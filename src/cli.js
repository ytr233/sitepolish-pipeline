#!/usr/bin/env node
import path from "node:path";
import { readOptions } from "./arguments.js";
import { auditCandidate } from "./audit.js";
import { applyProfile, applySupportedFixes } from "./fixes.js";
import { copyDirectory, emptyDirectory } from "./files.js";
import { askYesNo, questionSession } from "./questions.js";
import {
    createRun,
    projectRoot,
    recordDecision,
    requireRun,
    updateManifest,
} from "./run.js";
import { startComparisonServer } from "./server.js";

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

  npm run import -- --source "/path/to/site" --name "my-site"
      Preserve an untouched baseline and make a separate candidate.

  npm run audit -- --run "my-site"
      Identify HTML, CSS, and JavaScript findings with official references.

  npm run review -- --run "my-site"
      Choose supported fixes and optional enhancement profile.

  npm run compare -- --run "my-site" --port 8000
      Preview the untouched baseline beside the candidate.

  npm run finalize -- --run "my-site"
      Recheck and copy the approved candidate into a separate final folder.

  npm run example
      Import and audit the included fictional example website.
`);
}

async function importCommand(source, name) {
    const paths = createRun(source, name);
    console.log(`Imported: ${source}`);
    console.log(`Untouched baseline: ${paths.baseline}`);
    console.log(`Editable candidate: ${paths.candidate}`);
    console.log(`\nNext: npm run audit -- --run "${paths.name}"`);
    return paths;
}

function auditCommand(name) {
    const paths = requireRun(name);
    const findings = auditCandidate(paths);
    console.log(`Audit complete: ${findings.length} finding(s).`);
    console.log(`Read: ${paths.auditReport}`);
    return { paths, findings };
}

async function reviewCommand(name, requestedProfile) {
    const paths = requireRun(name);
    const session = questionSession();
    try {
        console.log(
            `\nReviewing candidate for "${paths.name}". The baseline will not be changed.\n`,
        );
        const css = await askYesNo(
            session,
            "Apply fixes Stylelint explicitly supports?",
        );
        const js = await askYesNo(
            session,
            "Apply fixes ESLint explicitly supports?",
        );
        const format = await askYesNo(
            session,
            "Run Prettier on the candidate for consistent spacing and indentation?",
        );
        const selections = [
            ...(css ? ["css"] : []),
            ...(js ? ["js"] : []),
            ...(format ? ["format"] : []),
        ];
        const applied = applySupportedFixes(paths, selections);

        const profile = requestedProfile ?? "validation-only";
        if (profile !== "validation-only") {
            const approveProfile = await askYesNo(
                session,
                `Apply the optional "${profile}" enhancement profile?`,
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
        console.log(`Compare: npm run compare -- --run "${paths.name}"`);
    } finally {
        session.close();
    }
}

function finalizeCommand(name) {
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

    emptyDirectory(paths.final);
    copyDirectory(paths.candidate, paths.final);
    recordDecision(
        paths,
        "Accepted candidate and created final output after all configured checks passed.",
    );
    updateManifest(paths, {
        status: "finalized",
        finalizedAt: new Date().toISOString(),
    });
    console.log(`Final project created: ${paths.final}`);
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
        const name = (
            await session.question("Short name for this run: ")
        ).trim();
        const paths = await importCommand(source, name);
        console.log(
            "\nFirst preview the real imported project before changing it:",
        );
        console.log(`npm run compare -- --run "${paths.name}"`);
        console.log(
            "\nAfter viewing it, stop the preview with Control-C and run:",
        );
        console.log(`npm run audit -- --run "${paths.name}"`);
        console.log(`npm run review -- --run "${paths.name}"`);
    } finally {
        session.close();
    }
}

async function exampleCommand() {
    const exampleName = `lantern-grove-example-${Date.now()}`;
    const source = path.join(
        projectRoot,
        "examples",
        "lantern-grove-learning",
        "input",
    );
    const paths = await importCommand(source, exampleName);
    auditCommand(paths.name);
    console.log("\nCompare the imported example with its unchanged candidate:");
    console.log(`npm run compare -- --run "${paths.name}"`);
    console.log(
        "\nThe reviewed reference is in examples/lantern-grove-learning/finished.",
    );
}

try {
    if (command === "help") {
        printHelp();
    } else if (command === "guide") {
        await guideCommand();
    } else if (command === "import") {
        await importCommand(value("source"), value("name"));
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
        finalizeCommand(value("run"));
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
