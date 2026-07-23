import fs from "node:fs";
import path from "node:path";
import { copyDirectory, emptyDirectory, safeRunName } from "./files.js";

export const projectRoot = path.resolve(import.meta.dirname, "..");

export function runPaths(name) {
    const safeName = safeRunName(name);
    const root = path.join(projectRoot, "runs", safeName);

    return {
        name: safeName,
        root,
        baseline: path.join(root, "baseline"),
        candidate: path.join(root, "candidate"),
        final: path.join(root, "final"),
        reports: path.join(root, "reports"),
        manifest: path.join(root, "run.json"),
        findings: path.join(root, "reports", "findings.json"),
        auditReport: path.join(root, "reports", "AUDIT_REPORT.md"),
        decisions: path.join(root, "reports", "DECISIONS.md"),
    };
}

export function createRun(sourcePath, name) {
    if (!sourcePath) {
        throw new Error(
            "Provide a source folder with --source or use npm run guide.",
        );
    }

    const source = path.resolve(sourcePath);
    if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
        throw new Error(`Source folder not found: ${source}`);
    }

    const paths = runPaths(name);
    if (fs.existsSync(paths.root)) {
        throw new Error(
            `A run named "${paths.name}" already exists. Choose another name.`,
        );
    }

    if (paths.root.startsWith(`${source}${path.sep}`)) {
        throw new Error(
            "The source cannot contain its own generated run. Choose the website folder, not the SitePolish project folder.",
        );
    }

    try {
        fs.mkdirSync(paths.reports, { recursive: true });
        copyDirectory(source, paths.baseline);
        copyDirectory(source, paths.candidate);
        emptyDirectory(paths.final);
    } catch (error) {
        fs.rmSync(paths.root, { recursive: true, force: true });
        throw error;
    }

    const manifest = {
        name: paths.name,
        source,
        createdAt: new Date().toISOString(),
        baselineLocked: true,
        profile: "validation-only",
        status: "imported",
    };

    fs.writeFileSync(paths.manifest, `${JSON.stringify(manifest, null, 4)}\n`);
    fs.writeFileSync(
        paths.decisions,
        `# Decision Journal: ${paths.name}\n\n- Imported from: \`${source}\`\n- Preserved baseline: yes\n- Candidate created separately: yes\n`,
    );

    return paths;
}

export function requireRun(name) {
    const paths = runPaths(name);
    if (!fs.existsSync(paths.manifest)) {
        throw new Error(
            `Run not found: ${paths.name}. Import a website first.`,
        );
    }
    return paths;
}

export function updateManifest(paths, changes) {
    const manifest = JSON.parse(fs.readFileSync(paths.manifest, "utf8"));
    Object.assign(manifest, changes);
    fs.writeFileSync(paths.manifest, `${JSON.stringify(manifest, null, 4)}\n`);
}

export function recordDecision(paths, text) {
    fs.appendFileSync(
        paths.decisions,
        `\n- ${new Date().toISOString()}: ${text}\n`,
    );
}
