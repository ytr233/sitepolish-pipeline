# SitePolish Pipeline

**Drop in a website. Understand every finding. Approve the polish. Compare the result.**

SitePolish is a reusable **front-end validation, remediation, and progressive-enhancement pipeline** for plain HTML, CSS, and JavaScript websites.

Unlike a blind rewrite, SitePolish preserves the submitted site as an untouched baseline. It identifies standards and code-quality findings, connects them to official documentation, lets the user approve supported changes, builds a separate candidate, and serves a side-by-side before/after preview.

## What it provides

- untouched baseline and separate editable candidate;
- HTML Validate, Stylelint, ESLint, and Prettier integration;
- human-readable Markdown report and machine-readable JSON;
- file, line, rule identifier, definition, fixability, and official reference for each finding;
- explicit approval before supported CSS, JavaScript, or formatting changes;
- decision journal;
- responsive before/after browser comparison;
- final output only after configured checks pass;
- a profile-ready architecture for future opt-in enhancements.

## Quick start

You need a current Node.js installation.

```bash
git clone https://github.com/ytr233/sitepolish-pipeline.git
cd sitepolish-pipeline
npm install
npm run guide
```

Enter the full path to the website folder you want to inspect. SitePolish copies it; it does not edit that source folder.

## The workflow

The guide prints the exact next commands. A typical run is:

```bash
npm run compare -- --run "my-site"
npm run audit -- --run "my-site"
npm run review -- --run "my-site"
npm run compare -- --run "my-site"
npm run finalize -- --run "my-site"
```

Open `http://localhost:8000` while the comparison command is running. Press `Control-C` to stop the preview server.

## What the folders mean

```text
runs/my-site/
├── baseline/   untouched imported website
├── candidate/  approved changes under review
├── final/      verified output
├── reports/    findings and decision journal
└── run.json    run metadata
```

Generated runs are ignored by Git so a user’s site does not accidentally become part of this repository.

## Scope and honesty

SitePolish can identify syntax, standards, consistency, and configured code-quality findings. It cannot decide whether branding is effective, text is truthful, or a visual suggestion matches the author’s intention. A finding is evidence to review—not permission to redesign.

Read [docs/WORKFLOW.md](docs/WORKFLOW.md) for the professional workflow and extension model.

## Portfolio summary

Designed and implemented SitePolish, a guided front-end QA pipeline that protects source projects, normalizes findings from multiple standards tools, connects code issues to official documentation, records user-approved remediation, and produces verified before/after deliverables.
