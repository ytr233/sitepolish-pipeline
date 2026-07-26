import fs from "node:fs";
import path from "node:path";
import { findFiles } from "./files.js";
import { officialDocumentation, ruleHelp } from "../config/rule-help.js";
import { runTool } from "./tools.js";
import { updateManifest } from "./run.js";

function relativeName(root, filename) {
    return path.relative(root, filename);
}

function baseFinding(
    tool,
    root,
    filename,
    line,
    column,
    ruleId,
    message,
    fixable,
) {
    return {
        tool,
        file: relativeName(root, filename),
        line: line ?? 1,
        column: column ?? 1,
        ruleId: ruleId || "formatting",
        message,
        definition:
            ruleHelp[ruleId] ??
            "The checker found code that does not match the selected standards or project rules.",
        documentation: officialDocumentation(tool, ruleId || "formatting"),
        fixable: Boolean(fixable),
    };
}

function parseHtml(root, output) {
    if (!output.trim()) {
        return [];
    }

    const reports = JSON.parse(output);
    return reports.flatMap((report) =>
        report.messages.map((message) =>
            baseFinding(
                "HTML Validate",
                root,
                report.filePath,
                message.line,
                message.column,
                message.ruleId,
                message.message,
                false,
            ),
        ),
    );
}

function parseCss(root, output) {
    if (!output.trim()) {
        return [];
    }

    const reports = JSON.parse(output);
    return reports.flatMap((report) =>
        report.warnings.map((warning) =>
            baseFinding(
                "Stylelint",
                root,
                report.source,
                warning.line,
                warning.column,
                warning.rule,
                warning.text,
                warning.fix === undefined ? false : warning.fix,
            ),
        ),
    );
}

function parseJavaScript(root, output) {
    if (!output.trim()) {
        return [];
    }

    const reports = JSON.parse(output);
    return reports.flatMap((report) =>
        report.messages.map((message) =>
            baseFinding(
                "ESLint",
                root,
                report.filePath,
                message.line,
                message.column,
                message.ruleId,
                message.message,
                message.fix || message.suggestions,
            ),
        ),
    );
}

function markdown(findings, root) {
    const lines = [
        "# SitePolish Audit Report",
        "",
        `Audited candidate: \`${root}\``,
        "",
        `Total findings: **${findings.length}**`,
        "",
        "A finding is evidence to review, not permission to change the code.",
        "",
    ];

    if (findings.length === 0) {
        lines.push(
            "No HTML, CSS, or JavaScript findings were reported by the configured checkers.",
        );
    }

    findings.forEach((finding, index) => {
        lines.push(
            `## ${index + 1}. ${finding.tool}: ${finding.ruleId}`,
            "",
            `- Location: \`${finding.file}:${finding.line}:${finding.column}\``,
            `- Reported issue: ${finding.message}`,
            `- Plain-language meaning: ${finding.definition}`,
            `- Supported automatic fix reported: ${finding.fixable ? "yes" : "no"}`,
            `- Official documentation: ${finding.documentation}`,
            "",
        );
    });

    return `${lines.join("\n")}\n`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function dashboard(findings, paths, manifest) {
    const rows = findings
        .map(
            (finding, index) => `<tr>
                <td>F-${String(index + 1).padStart(3, "0")}</td>
                <td>${escapeHtml(finding.file)}:${finding.line}</td>
                <td>${escapeHtml(finding.tool)}</td>
                <td><strong>${escapeHtml(finding.ruleId)}</strong><br>${escapeHtml(finding.message)}</td>
                <td>${escapeHtml(finding.definition)}</td>
                <td><a href="${escapeHtml(finding.documentation)}">Official rule</a></td>
            </tr>`,
        )
        .join("");
    const wireframe = `../${manifest.storedWireframe}`;

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SitePolish Audit | ${escapeHtml(paths.name)}</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; color: #203047; background: #edf1f5; font: 16px/1.5 Georgia, serif; }
        header { padding: 2rem 4vw; color: white; background: #153b5b; }
        header h1 { margin: 0; }
        main { width: min(96%, 1450px); margin: auto; padding: 1.5rem 0 4rem; }
        section { margin: 1rem 0; padding: 1.25rem; background: white; border: 1px solid #c9d1dc; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
        .card { padding: 1rem; border-top: 5px solid #d8752a; background: #f8fafc; }
        .card strong { display: block; font-size: 1.6rem; }
        img { display: block; max-width: min(100%, 900px); max-height: 520px; margin: 1rem auto; object-fit: contain; border: 2px solid #d8752a; }
        .table { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 0.7rem; text-align: left; vertical-align: top; border: 1px solid #d7dde6; }
        th { color: white; background: #315f7d; }
        code { padding: 0.12rem 0.3rem; background: #edf1f5; }
    </style>
</head>
<body>
    <header>
        <h1>SitePolish audit and wireframe review</h1>
        <p>${escapeHtml(paths.name)} · input scope: ${escapeHtml(manifest.inputLevel)}</p>
    </header>
    <main>
        <div class="summary">
            <div class="card"><strong>${findings.length}</strong>code findings</div>
            <div class="card"><strong>${escapeHtml(manifest.inputLevel)}</strong>complexity ceiling</div>
            <div class="card"><strong>Protected</strong>original baseline</div>
        </div>
        <section>
            <h2>Wireframe reference</h2>
            <p>The image is design evidence for manual review. Styling is applied only through an explicit proposal and <code>y</code> approval.</p>
            <img src="${escapeHtml(wireframe)}" alt="Imported wireframe reference">
        </section>
        <section>
            <h2>Code findings</h2>
            <div class="table"><table>
                <thead><tr><th>ID</th><th>Location</th><th>Tool</th><th>Finding</th><th>Plain-English meaning</th><th>Reference</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="6">No configured code findings.</td></tr>'}</tbody>
            </table></div>
        </section>
        <section>
            <h2>Next terminal step</h2>
            <p><code>npm run review -- --run "${escapeHtml(paths.name)}" --profile PROFILE_NAME</code></p>
            <p>At each prompt: <strong>d</strong> displays details, <strong>y</strong> approves, and <strong>n</strong> skips.</p>
        </section>
    </main>
</body>
</html>`;
}

export function auditCandidate(paths) {
    const htmlFiles = findFiles(paths.candidate, [".html"]);
    const cssFiles = findFiles(paths.candidate, [".css"]);
    const jsFiles = findFiles(paths.candidate, [".js"]);
    const findings = [];

    if (htmlFiles.length) {
        const result = runTool("html-validate", [
            "--formatter",
            "json",
            ...htmlFiles,
        ]);
        findings.push(
            ...parseHtml(paths.candidate, result.stdout || result.stderr),
        );
    }

    if (cssFiles.length) {
        const result = runTool("stylelint", [
            "--formatter",
            "json",
            ...cssFiles,
        ]);
        findings.push(
            ...parseCss(paths.candidate, result.stdout || result.stderr),
        );
    }

    if (jsFiles.length) {
        const result = runTool("eslint", ["--format", "json", ...jsFiles]);
        findings.push(
            ...parseJavaScript(paths.candidate, result.stdout || result.stderr),
        );
    }

    fs.mkdirSync(paths.reports, { recursive: true });
    fs.writeFileSync(paths.findings, `${JSON.stringify(findings, null, 4)}\n`);
    fs.writeFileSync(paths.auditReport, markdown(findings, paths.candidate));
    const manifest = JSON.parse(fs.readFileSync(paths.manifest, "utf8"));
    fs.writeFileSync(
        paths.auditDashboard,
        dashboard(findings, paths, manifest),
    );
    fs.writeFileSync(
        paths.styleReport,
        `# Wireframe Styling Review

- Wireframe: \`${manifest.storedWireframe}\`
- Imported code level: **${manifest.inputLevel}**
- Styling ceiling: do not introduce code above the imported level.

## Review rule

The wireframe is a visual target, not permission to replace authorship. Preserve
content, assets, working behavior, and established selectors unless the user
approves a documented proposal. Use \`d\` before \`y\` to inspect the proposed
candidate difference.

## Available local proposals

- \`validation-only\`: code-quality work with no visual overlay.
- \`lantern-grove-wireframe\`: the included fictional beginner-level wireframe implementation.

Arbitrary wireframes require a reviewed profile or a human/AI-authored style
plan. The local validator does not pretend that filename metadata is visual
understanding.
`,
    );
    updateManifest(paths, {
        lastAuditAt: new Date().toISOString(),
        findingCount: findings.length,
        status: findings.length ? "review-needed" : "checks-passed",
    });

    return findings;
}
