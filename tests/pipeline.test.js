import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { analyzeScope, levelAllowed } from "../src/scope.js";
import { createRun } from "../src/run.js";
import { prepareVeilidStage } from "../src/veilid.js";

function fixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sitepolish-test-"));
    const site = path.join(root, "site");
    const wireframe = path.join(root, "wireframe.svg");
    fs.mkdirSync(site);
    fs.writeFileSync(
        path.join(site, "index.html"),
        "<!doctype html><html><head><title>Test</title></head><body><h1>Test</h1></body></html>",
    );
    fs.writeFileSync(path.join(site, "style.css"), "body { color: #222; }");
    fs.writeFileSync(
        wireframe,
        '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    );
    return { root, site, wireframe };
}

test("plain sites remain beginner scope", () => {
    const data = fixture();
    try {
        assert.equal(analyzeScope(data.site).level, "beginner");
    } finally {
        fs.rmSync(data.root, { recursive: true, force: true });
    }
});

test("scope ceiling blocks advanced output for beginner input", () => {
    assert.equal(levelAllowed("beginner", "advanced"), false);
    assert.equal(levelAllowed("advanced", "intermediate"), true);
});

test("import preserves website and wireframe separately", () => {
    const data = fixture();
    let paths;
    try {
        paths = createRun(
            data.site,
            `automated-test-${Date.now()}`,
            data.wireframe,
        );
        assert.ok(fs.existsSync(path.join(paths.baseline, "index.html")));
        assert.ok(fs.existsSync(path.join(paths.candidate, "index.html")));
        assert.ok(
            fs.existsSync(
                path.join(paths.reference, path.basename(data.wireframe)),
            ),
        );
    } finally {
        if (paths) {
            fs.rmSync(paths.root, { recursive: true, force: true });
        }
        fs.rmSync(data.root, { recursive: true, force: true });
    }
});

test("missing wireframe is rejected", () => {
    const data = fixture();
    try {
        assert.throws(
            () => createRun(data.site, `missing-${Date.now()}`),
            /wireframe/i,
        );
    } finally {
        fs.rmSync(data.root, { recursive: true, force: true });
    }
});

test("Veilid remains an isolated post-finalization stage", () => {
    const data = fixture();
    let paths;
    try {
        paths = createRun(
            data.site,
            `veilid-test-${Date.now()}`,
            data.wireframe,
        );
        assert.throws(() => prepareVeilidStage(paths), /after finalization/i);
        const manifest = JSON.parse(fs.readFileSync(paths.manifest, "utf8"));
        manifest.status = "finalized";
        fs.writeFileSync(
            paths.manifest,
            `${JSON.stringify(manifest, null, 4)}\n`,
        );
        fs.mkdirSync(paths.final, { recursive: true });
        fs.writeFileSync(path.join(paths.final, "index.html"), "unchanged");

        const output = prepareVeilidStage(paths);
        assert.ok(fs.existsSync(path.join(output, "veilid.json")));
        assert.equal(
            fs.readFileSync(path.join(paths.final, "index.html"), "utf8"),
            "unchanged",
        );
    } finally {
        if (paths) {
            fs.rmSync(paths.root, { recursive: true, force: true });
        }
        fs.rmSync(data.root, { recursive: true, force: true });
    }
});
