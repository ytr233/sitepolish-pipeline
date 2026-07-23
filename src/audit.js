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
        findings.push(...parseHtml(paths.candidate, result.stdout));
    }

    if (cssFiles.length) {
        const result = runTool("stylelint", [
            "--formatter",
            "json",
            ...cssFiles,
        ]);
        findings.push(...parseCss(paths.candidate, result.stdout));
    }

    if (jsFiles.length) {
        const result = runTool("eslint", ["--format", "json", ...jsFiles]);
        findings.push(...parseJavaScript(paths.candidate, result.stdout));
    }

    fs.mkdirSync(paths.reports, { recursive: true });
    fs.writeFileSync(paths.findings, `${JSON.stringify(findings, null, 4)}\n`);
    fs.writeFileSync(paths.auditReport, markdown(findings, paths.candidate));
    updateManifest(paths, {
        lastAuditAt: new Date().toISOString(),
        findingCount: findings.length,
        status: findings.length ? "review-needed" : "checks-passed",
    });

    return findings;
}
