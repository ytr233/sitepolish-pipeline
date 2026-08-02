import fs from "node:fs";
import path from "node:path";
import { copyDirectory, emptyDirectory, safeRunName } from "./files.js";
import { analyzeScope, scopeMarkdown } from "./scope.js";

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
        auditDashboard: path.join(root, "reports", "AUDIT_DASHBOARD.html"),
        styleReport: path.join(root, "reports", "STYLE_REVIEW.md"),
        decisions: path.join(root, "reports", "DECISIONS.md"),
        scopeReport: path.join(root, "reports", "SCOPE_REPORT.md"),
        reference: path.join(root, "reference"),
        reviewSessions: path.join(root, "reports", "review-sessions"),
        reviewIndex: path.join(root, "reports", "REVIEW_SESSION_INDEX.md"),
        finalArchive: path.join(root, `${safeName}-final.zip`),
        veilid: path.join(root, "veilid"),
    };
}

export function createRun(sourcePath, name, wireframePath) {
    if (!sourcePath) {
        throw new Error(
            "Provide a source folder with --source or use npm run guide.",
        );
    }

    const source = path.resolve(sourcePath);
    if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
        throw new Error(`Source folder not found: ${source}`);
    }

    if (!wireframePath) {
        throw new Error(
            "Provide a wireframe image or PDF with --wireframe or use npm run guide.",
        );
    }

    const wireframe = path.resolve(wireframePath);
    if (!fs.existsSync(wireframe) || !fs.statSync(wireframe).isFile()) {
        throw new Error(`Wireframe file not found: ${wireframe}`);
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
        fs.mkdirSync(paths.reference, { recursive: true });
        copyDirectory(source, paths.baseline);
        copyDirectory(source, paths.candidate);
        fs.copyFileSync(
            wireframe,
            path.join(paths.reference, path.basename(wireframe)),
        );
        emptyDirectory(paths.final);
    } catch (error) {
        fs.rmSync(paths.root, { recursive: true, force: true });
        throw error;
    }

    const scope = analyzeScope(paths.baseline);
    fs.writeFileSync(paths.scopeReport, scopeMarkdown(scope));

    const manifest = {
        name: paths.name,
        source,
        wireframe,
        storedWireframe: path.join("reference", path.basename(wireframe)),
        inputLevel: scope.level,
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
