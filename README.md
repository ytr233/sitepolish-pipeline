# SitePolish Pipeline

**Drop in a website and wireframe. Understand every finding. Approve the polish. Export the result.**

SitePolish is a reusable **front-end validation, remediation, and progressive-enhancement pipeline** for plain HTML, CSS, and JavaScript websites.

Unlike a blind rewrite, SitePolish preserves the submitted site as an untouched baseline. It identifies standards and code-quality findings, connects them to official documentation, lets the user approve supported changes, builds a separate candidate, and serves a side-by-side before/after preview.

## What it provides

- untouched website baseline, preserved wireframe, and separate candidate;
- HTML Validate, Stylelint, ESLint, and Prettier integration;
- human-readable Markdown report and machine-readable JSON;
- file, line, rule identifier, definition, fixability, and official reference for each finding;
- detected beginner/intermediate/advanced complexity ceiling;
- visual audit dashboard and plain-English reports;
- `y`, `n`, and `d` review before code or styling changes;
- chronological review-session history;
- decision journal;
- responsive before/after browser comparison;
- final folder and ZIP only after configured checks and manual review;
- an isolated, opt-in post-finalization boundary for designing private peer-to-peer features with [Veilid](https://veilid.com/), the open-source framework launched by members of Cult of the Dead Cow;
- a profile-ready architecture for future opt-in enhancements.
- an automated GitHub Actions quality gate.

## Quick start

You need a current Node.js installation.

```bash
git clone https://github.com/ytr233/sitepolish-pipeline.git
cd sitepolish-pipeline
npm install
npm run guide
```

Enter the full path to the website folder and a wireframe image or PDF.
SitePolish copies both; it does not edit either source.

## Fictional example

The included **Lantern Grove Home Learning** case study is fictional and contains no
real family, school, or private project material:

```bash
npm run example
```

The example has two deliberately separate artifacts:

- `examples/lantern-grove-learning/input/` contains a small website with teachable
  HTML, CSS, and JavaScript findings;
- `examples/lantern-grove-learning/finished/` shows a reviewed, passing reference.

See [the example walkthrough](examples/lantern-grove-learning/README.md) for the
finding-to-fix decisions.

## The workflow

The guide prints the exact next commands. A typical run is:

```bash
npm run compare -- --run "my-site"
npm run audit -- --run "my-site"
npm run review -- --run "my-site"
npm run compare -- --run "my-site"
npm run finalize -- --run "my-site"
npm run veilid -- --run "my-site"
```

## Veilid, kept separate on purpose

After a site is approved and finalized, `npm run veilid -- --run "my-site"`
creates a separate `runs/my-site/veilid/` planning area. It never injects code into
the polished website. Veilid is a peer-to-peer application framework—not a magic
security badge—so SitePolish records the integration boundary and requires a real
private feature, threat model, data model, and platform decision before implementation.

This extension draws on the privacy engineering work of the
[Veilid Foundation](https://veilid.com/) and members of
[Cult of the Dead Cow](https://cultdeadcow.com/). It is an independent integration;
no endorsement or affiliation is implied. See the
[official Veilid developer book](https://veilid.gitlab.io/developer-book/) for the
framework API and supported platforms.

Open `http://localhost:8000` while the comparison command is running. Press `Control-C` to stop the preview server.

## What the folders mean

```text
runs/my-site/
├── baseline/   untouched imported website
├── candidate/  approved changes under review
├── final/      verified output
├── reference/  preserved wireframe
├── reports/    findings and decision journal
├── my-site-final.zip
└── run.json    run metadata
```

Generated runs are ignored by Git so a user’s site does not accidentally become part of this repository.

## Scope and honesty

SitePolish can identify syntax, standards, consistency, and configured
code-quality findings. It stores and displays a wireframe and can apply an
explicit reviewed styling profile. A purely local validator cannot visually
interpret every arbitrary image; a new wireframe requires a human- or
AI-authored profile before the pipeline can apply it. A finding or wireframe is
evidence to review—not permission to redesign.

Read [docs/WORKFLOW.md](docs/WORKFLOW.md) for the professional workflow and extension model.

Use [the website + wireframe walkthrough](docs/WIREFRAME_WALKTHROUGH.md) for
the concise terminal sequence.

Use [the independent audit checklist](docs/PIPELINE_AUDIT_CHECKLIST.md) to test
the pipeline instead of trusting its author.

The older Front-End Quality Pipeline’s reusable quality-gate responsibilities
are now incorporated here. The optional framework discussion is preserved as a
non-required [Bootstrap appendix](docs/BOOTSTRAP_APPENDIX.md).

## Portfolio summary

Designed and implemented SitePolish, a guided front-end QA pipeline that protects source projects, normalizes findings from multiple standards tools, connects code issues to official documentation, records user-approved remediation, and produces verified before/after deliverables.
