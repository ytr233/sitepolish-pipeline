import fs from "node:fs";
import path from "node:path";

export function copyDirectory(source, destination) {
    fs.mkdirSync(destination, { recursive: true });
    fs.cpSync(source, destination, {
        recursive: true,
        force: true,
        filter: (item) =>
            !item.includes(`${path.sep}node_modules${path.sep}`) &&
            !item.endsWith(`${path.sep}.git`),
    });
}

export function emptyDirectory(directory) {
    fs.rmSync(directory, { recursive: true, force: true });
    fs.mkdirSync(directory, { recursive: true });
}

export function findFiles(directory, extensions) {
    const matches = [];

    function visit(current) {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            if (entry.name === "node_modules" || entry.name === ".git") {
                continue;
            }

            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                visit(fullPath);
            } else if (
                extensions.includes(path.extname(entry.name).toLowerCase())
            ) {
                matches.push(fullPath);
            }
        }
    }

    visit(directory);
    return matches;
}

export function safeRunName(value) {
    const name = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    if (!name) {
        throw new Error(
            "The project name must contain at least one letter or number.",
        );
    }

    return name;
}
