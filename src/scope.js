import fs from "node:fs";
import path from "node:path";
import { findFiles } from "./files.js";

const levelOrder = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
};

function read(files) {
    return files
        .map((filename) => fs.readFileSync(filename, "utf8"))
        .join("\n");
}

export function analyzeScope(directory) {
    const htmlFiles = findFiles(directory, [".html"]);
    const cssFiles = findFiles(directory, [".css"]);
    const jsFiles = findFiles(directory, [".js", ".mjs", ".cjs"]);
    const allFiles = findFiles(directory, [
        ".html",
        ".css",
        ".js",
        ".mjs",
        ".cjs",
        ".jsx",
        ".ts",
        ".tsx",
        ".vue",
        ".svelte",
    ]);
    const html = read(htmlFiles);
    const css = read(cssFiles);
    const js = read(jsFiles);
    const signals = [];
    let level = "beginner";

    if (
        /<script[^>]+type=["']module["']/i.test(html) ||
        /\b(import|export)\b/.test(js) ||
        /@supports|@container|grid-template/i.test(css)
    ) {
        level = "intermediate";
        signals.push("modules, Grid, container queries, or feature queries");
    }

    if (
        allFiles.some((filename) =>
            [".jsx", ".tsx", ".vue", ".svelte", ".ts"].includes(
                path.extname(filename).toLowerCase(),
            ),
        ) ||
        /\b(React|Vue|Angular|Svelte|customElements)\b/.test(`${html}\n${js}`)
    ) {
        level = "advanced";
        signals.push("framework, typed, component, or custom-element code");
    }

    if (signals.length === 0) {
        signals.push("plain HTML, CSS, and introductory JavaScript");
    }

    return {
        level,
        levelNumber: levelOrder[level],
        signals,
        counts: {
            html: htmlFiles.length,
            css: cssFiles.length,
            javascript: jsFiles.length,
        },
        policy:
            level === "beginner"
                ? "Keep recommendations within semantic HTML, standard CSS, and introductory event-based JavaScript."
                : `Preserve the existing ${level} architecture and recommend changes no more complex than the imported project.`,
    };
}

export function scopeMarkdown(scope) {
    return `# Input Complexity and Scope

- Detected level: **${scope.level}**
- HTML files: ${scope.counts.html}
- CSS files: ${scope.counts.css}
- JavaScript files: ${scope.counts.javascript}
- Evidence: ${scope.signals.join("; ")}

## Recommendation ceiling

${scope.policy}

SitePolish must not introduce a framework, build system, backend, database, or
language level above the imported project merely to reproduce a visual design.
`;
}

export function levelAllowed(inputLevel, proposalLevel) {
    return levelOrder[proposalLevel] <= levelOrder[inputLevel];
}
