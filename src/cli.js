#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { readOptions } from "./arguments.js";
import { auditCandidate } from "./audit.js";
import { applyProfile, applySupportedFixes } from "./fixes.js";
import { copyDirectory, emptyDirectory } from "./files.js";
import { askReview, questionSession } from "./questions.js";
import {
    createRun,
    projectRoot,
    recordDecision,
    requireRun,
    updateManifest,
} from "./run.js";
import { startComparisonServer } from "./server.js";
import { prepareVeilidStage } from "./veilid.js";

const [command = "help", ...rawOptions] = process.argv.slice(2);
const options = readOptions(rawOptions);

function value(name, fallback) {
    return options[name] === true || options[name] === undefined
        ? fallback
        : options[name];
}

function printHelp() {
    console.log(`
SitePolish Pipeline

  npm run guide
      Beginner-friendly guided workflow.

  npm run import -- --source "/path/to/site" --wireframe "/path/to/wireframe.png" --name "my-site"
      Preserve the website and wireframe, then make a separate candidate.

  npm run audit -- --run "my-site"
      Identify HTML, CSS, and JavaScript findings with official references.

  npm run review -- --run "my-site"
      Choose supported fixes and optional enhancement profile.

  npm run compare -- --run "my-site" --port 8000
      Preview the untouched baseline beside the candidate.

  npm run finalize -- --run "my-site"
      Recheck and copy the approved candidate into a separate final folder.

  npm run veilid -- --run "my-site"
      Prepare an isolated post-finalization Veilid integration boundary.
`);
}

function sessionId() {
    return new Date().toISOString().replace(/[-:TZ.]/g, "");
}

function showText(text) {
    console.log(`\n${text}\n`);
}

function showProfileDiff(paths, profileName) {
    const profile = path.join(projectRoot, "profiles", profileName, "overlay");
    const result = spawnSync(
        "git",
        ["--no-pager", "diff", "--no-index", "--", paths.candidate, profile],
        { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
    );
    const output =
        result.stdout || result.stderr || "No text difference available.";
    const diffPath = path.join(paths.reports, "STYLE_PROFILE_DIFF.patch");
    fs.writeFileSync(diffPath, output);
    const changedFiles = output
        .split(/\r?\n/)
        .filter((line) => line.startsWith("diff --git "))
        .map((line) => line.split(" b/")[1])
        .filter(Boolean);
    console.log("\nSTYLING PROPOSAL DETAILS");
    console.log(`Profile: ${profileName}`);
    console.log(`Files represented in full diff: ${changedFiles.length}`);
    console.log(`Readable wireframe plan: ${paths.styleReport}`);
    console.log(`Complete patch: ${diffPath}`);
    console.log(
        "The overlay copies approved files into the candidate; it does not delete baseline evidence.",
    );
}

async function importCommand(source, name, wireframe) {
    const paths = createRun(source, name, wireframe);
    console.log(`Imported: ${source}`);
    console.log(`Wireframe stored: ${paths.reference}`);
    console.log(`Untouched baseline: ${paths.baseline}`);
    console.log(`Editable candidate: ${paths.candidate}`);
    console.log(`Scope report: ${paths.scopeReport}`);
    console.log(`\nNext: npm run audit -- --run "${paths.name}"`);
    return paths;
}

function auditCommand(name) {
    const paths = requireRun(name);
    const findings = auditCandidate(paths);
    console.log(`Audit complete: ${findings.length} finding(s).`);
    console.log(`Read: ${paths.auditReport}`);
    console.log(`Open dashboard: ${paths.auditDashboard}`);
    console.log(`Read styling review: ${paths.styleReport}`);
    return { paths, findings };
}

async function reviewCommand(name, requestedProfile) {
    const paths = requireRun(name);
    const session = questionSession();
    try {
        console.log(
            `\nReviewing candidate for "${paths.name}". The baseline will not be changed.\n`,
        );
        const css = await askReview(
            session,
            "Apply fixes Stylelint explicitly supports?",
            () =>
                showText(
                    "Stylelint will apply only fixes marked safe by its configured CSS rules. It will not interpret the wireframe.",
                ),
            (alternative) =>
                recordDecision(
                    paths,
                    `Alternative requested instead of Stylelint fixes: ${alternative}`,
                ),
        );
        const js = await askReview(
            session,
            "Apply fixes ESLint explicitly supports?",
            () =>
                showText(
                    "ESLint will apply supported problem and suggestion fixes to existing JavaScript. It will not add a framework.",
                ),
            (alternative) =>
                recordDecision(
                    paths,
                    `Alternative requested instead of ESLint fixes: ${alternative}`,
                ),
        );
        const format = await askReview(
            session,
            "Run Prettier on the candidate for consistent spacing and indentation?",
            () =>
                showText(
                    "Prettier changes source indentation, wrapping, and spacing. It does not redesign the rendered website.",
                ),
            (alternative) =>
                recordDecision(
                    paths,
                    `Alternative requested instead of Prettier formatting: ${alternative}`,
                ),
        );
        const selections = [
            ...(css ? ["css"] : []),
            ...(js ? ["js"] : []),
            ...(format ? ["format"] : []),
        ];
        const applied = applySupportedFixes(paths, selections);

        const profile = requestedProfile ?? "validation-only";
        if (profile !== "validation-only") {
            const approveProfile = await askReview(
                session,
                `Apply the optional "${profile}" enhancement profile?`,
                () => showProfileDiff(paths, profile),
                (alternative) =>
                    recordDecision(
                        paths,
                        `Alternative requested instead of ${profile}: ${alternative}`,
                    ),
            );
            if (approveProfile) {
                applied.push(...applyProfile(paths, profile));
            } else {
                recordDecision(paths, `Skipped optional profile: ${profile}.`);
            }
        } else {
            applyProfile(paths, profile);
        }

        if (!applied.length) {
            recordDecision(
                paths,
                "No automatic changes were selected during this review.",
            );
        }
        console.log(`\nApplied ${applied.length} selected change group(s).`);
        console.log(`Decision journal: ${paths.decisions}`);
        const id = sessionId();
        const sessionDirectory = path.join(paths.reviewSessions, id);
        fs.mkdirSync(sessionDirectory, { recursive: true });
        fs.copyFileSync(
            paths.decisions,
            path.join(sessionDirectory, "DECISIONS.md"),
        );
        fs.appendFileSync(
            paths.reviewIndex,
            `\n- ${id}: [decisions](review-sessions/${id}/DECISIONS.md)\n`,
        );
        console.log(`Permanent review session: ${sessionDirectory}`);
        console.log(`Compare: npm run compare -- --run "${paths.name}"`);
    } finally {
        session.close();
    }
}

async function finalizeCommand(name) {
    const paths = requireRun(name);
    const findings = auditCandidate(paths);
    if (findings.length) {
        console.log(
            `Finalization stopped: ${findings.length} finding(s) still need review.`,
        );
        console.log(`Read: ${paths.auditReport}`);
        process.exitCode = 1;
        return;
    }

    const session = questionSession();
    try {
        const approved = await askReview(
            session,
            "Did you manually compare the baseline and candidate and approve the visible result?",
            () =>
                showText(
                    `Run npm run compare -- --run "${paths.name}", inspect every page and interaction, then return here. Finalization never replaces manual visual review.`,
                ),
            (alternative) =>
                recordDecision(
                    paths,
                    `Final manual-review alternative or concern: ${alternative}`,
                ),
        );
        if (!approved) {
            console.log("Finalization paused. The candidate was preserved.");
            return;
        }
    } finally {
        session.close();
    }

    emptyDirectory(paths.final);
    copyDirectory(paths.candidate, paths.final);
    fs.rmSync(paths.finalArchive, { force: true });
    const archive = spawnSync(
        "zip",
        ["-r", "-q", paths.finalArchive, path.basename(paths.final)],
        {
            cwd: paths.root,
            encoding: "utf8",
        },
    );
    if (archive.status !== 0) {
        throw new Error(
            `Final folder was created, but ZIP packaging failed: ${archive.stderr}`,
        );
    }
    recordDecision(
        paths,
        "Accepted candidate and created final output after all configured checks passed.",
    );
    updateManifest(paths, {
        status: "finalized",
        finalizedAt: new Date().toISOString(),
    });
    console.log(`Final project created: ${paths.final}`);
    console.log(`Downloadable ZIP created: ${paths.finalArchive}`);
}

function veilidCommand(name) {
    const paths = requireRun(name);
    const output = prepareVeilidStage(paths);
    recordDecision(
        paths,
        "Prepared the isolated post-finalization Veilid integration boundary; the final website was not modified.",
    );
    console.log(`Veilid stage prepared separately: ${output}`);
    console.log(`Read: ${path.join(output, "README.md")}`);
}

async function guideCommand() {
    const session = questionSession();
    try {
        console.log("\nSitePolish guided workflow\n");
        console.log(
            "Your source folder will be copied. It will not be edited.",
        );
        const source = (
            await session.question("Full path to the website folder: ")
        ).trim();
        const wireframe = (
            await session.question("Full path to the wireframe image or PDF: ")
        ).trim();
        const name = (
            await session.question("Short name for this run: ")
        ).trim();
        const profile =
            (
                await session.question(
                    "Styling profile (validation-only or lantern-grove-wireframe): ",
                )
            ).trim() || "validation-only";
        const paths = await importCommand(source, name, wireframe);
        console.log(
            "\nFirst preview the real imported project before changing it:",
        );
        console.log(`npm run compare -- --run "${paths.name}"`);
        console.log(
            "\nAfter viewing it, stop the preview with Control-C and run:",
        );
        console.log(`npm run audit -- --run "${paths.name}"`);
        console.log(`open "runs/${paths.name}/reports/AUDIT_DASHBOARD.html"`);
        console.log(
            `npm run review -- --run "${paths.name}" --profile "${profile}"`,
        );
    } finally {
        session.close();
    }
}

async function exampleCommand() {
    const demoName = `lantern-grove-example-${Date.now()}`;
    const source = path.join(
        projectRoot,
        "examples",
        "lantern-grove-learning",
        "input",
    );
    const wireframe = path.join(
        projectRoot,
        "examples",
        "lantern-grove-learning",
        "wireframe.svg",
    );
    const paths = await importCommand(source, demoName, wireframe);
    auditCommand(paths.name);
    console.log(
        `\nTo review the fictional styling profile:\nnpm run review -- --run "${paths.name}" --profile lantern-grove-wireframe`,
    );
}

try {
    if (command === "help") {
        printHelp();
    } else if (command === "guide") {
        await guideCommand();
    } else if (command === "import") {
        await importCommand(value("source"), value("name"), value("wireframe"));
    } else if (command === "audit") {
        auditCommand(value("run"));
    } else if (command === "review") {
        await reviewCommand(value("run"), value("profile"));
    } else if (command === "compare") {
        startComparisonServer(
            requireRun(value("run")),
            Number(value("port", "8000")),
        );
    } else if (command === "finalize") {
        await finalizeCommand(value("run"));
    } else if (command === "veilid") {
        veilidCommand(value("run"));
    } else if (command === "example") {
        await exampleCommand();
    } else {
        printHelp();
        process.exitCode = 1;
    }
} catch (error) {
    console.error(`\nSitePolish stopped: ${error.message}\n`);
    process.exitCode = 1;
}
