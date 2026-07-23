import path from "node:path";
import { spawnSync } from "node:child_process";
import { projectRoot } from "./run.js";

function executable(name) {
    const extension = process.platform === "win32" ? ".cmd" : "";
    return path.join(
        projectRoot,
        "node_modules",
        ".bin",
        `${name}${extension}`,
    );
}

export function runTool(name, argumentsList, options = {}) {
    const result = spawnSync(executable(name), argumentsList, {
        cwd: options.cwd ?? projectRoot,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
    });

    if (result.error) {
        if (result.error.code === "ENOENT") {
            throw new Error(
                `The ${name} package is not installed. Run npm install first.`,
            );
        }
        throw result.error;
    }

    return {
        status: result.status ?? 1,
        stdout: result.stdout ?? "",
        stderr: result.stderr ?? "",
    };
}
