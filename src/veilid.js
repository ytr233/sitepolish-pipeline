import fs from "node:fs";
import path from "node:path";

const VEILID_PROJECT = "https://veilid.com/";
const VEILID_DEVELOPER_BOOK = "https://veilid.gitlab.io/developer-book/";

export function prepareVeilidStage(paths) {
    const manifest = JSON.parse(fs.readFileSync(paths.manifest, "utf8"));
    if (manifest.status !== "finalized") {
        throw new Error(
            "Veilid preparation runs only after finalization. Finalize and approve the site first.",
        );
    }

    fs.mkdirSync(paths.veilid, { recursive: true });
    const configuration = {
        stage: "post-finalize",
        isolated: true,
        modifiesFinalSite: false,
        status: "design-required",
        framework: "Veilid",
        project: VEILID_PROJECT,
        developerBook: VEILID_DEVELOPER_BOOK,
        generatedAt: new Date().toISOString(),
        sourceArtifact: paths.finalArchive,
        nextDecision:
            "Define the private peer-to-peer feature and its data model before selecting Veilid WASM, Flutter, Python, or Rust bindings.",
    };

    fs.writeFileSync(
        path.join(paths.veilid, "veilid.json"),
        `${JSON.stringify(configuration, null, 4)}\n`,
    );
    fs.writeFileSync(
        path.join(paths.veilid, "README.md"),
        `# Veilid post-finalization stage

This directory is intentionally separate from the polished website. SitePolish does not inject networking or cryptography into arbitrary HTML, CSS, or JavaScript.

Veilid is an open-source, peer-to-peer application framework maintained by the Veilid Foundation and launched by members of Cult of the Dead Cow. It can support private, distributed application features, but integration requires an explicit feature, threat model, data model, and platform choice.

## Boundary

- The approved site remains unchanged at \`../final/\`.
- The downloadable site remains unchanged at \`../${path.basename(paths.finalArchive)}\`.
- Veilid work begins here only after finalization.
- No security guarantee is inferred merely from generating this plan.

## Next design decision

Name the private peer-to-peer capability the site actually needs. Then choose the appropriate official binding: in-browser WASM, Flutter, Python with a Veilid server, or Rust.

Official project: ${VEILID_PROJECT}

Official developer book: ${VEILID_DEVELOPER_BOOK}
`,
    );

    return paths.veilid;
}
