import fs from "node:fs";
import path from "node:path";
import { findFiles, copyDirectory } from "./files.js";
import { profiles } from "../config/profiles.js";
import { projectRoot, recordDecision, updateManifest } from "./run.js";
import { runTool } from "./tools.js";

export function applySupportedFixes(paths, selections) {
    const changed = [];

    if (selections.includes("css")) {
        const files = findFiles(paths.candidate, [".css"]);
        if (files.length) {
            runTool("stylelint", ["--fix", ...files]);
            changed.push("Stylelint-supported CSS fixes");
        }
    }

    if (selections.includes("js")) {
        const files = findFiles(paths.candidate, [".js"]);
        if (files.length) {
            runTool("eslint", [
                "--fix",
                "--fix-type",
                "problem",
                "--fix-type",
                "suggestion",
                ...files,
            ]);
            changed.push("ESLint-supported JavaScript fixes");
        }
    }

    if (selections.includes("format")) {
        const files = findFiles(paths.candidate, [".html", ".css", ".js"]);
        if (files.length) {
            runTool("prettier", ["--write", ...files]);
            changed.push("Prettier formatting");
        }
    }

    changed.forEach((change) =>
        recordDecision(paths, `Approved and applied: ${change}.`),
    );
    updateManifest(paths, { status: "candidate-updated" });
    return changed;
}

export function applyProfile(paths, profileName) {
    const profile = profiles[profileName];
    if (!profile) {
        throw new Error(`Unknown profile: ${profileName}`);
    }

    if (!profile.overlay) {
        recordDecision(
            paths,
            "Selected validation-only profile; no feature overlay applied.",
        );
        updateManifest(paths, { profile: profileName });
        return [];
    }

    const overlay = path.join(projectRoot, profile.overlay);
    if (!fs.existsSync(overlay)) {
        throw new Error(`Profile overlay not found: ${overlay}`);
    }

    copyDirectory(overlay, paths.candidate);
    recordDecision(paths, `Approved and applied profile: ${profile.label}.`);
    updateManifest(paths, {
        profile: profileName,
        status: "candidate-updated",
    });
    return [profile.label];
}
