# Workflow design

The professional name for this process is a **front-end validation, remediation, and progressive-enhancement workflow**.

## Stages

| Stage          | Input                                | Output                          | Why it exists                                                      |
| -------------- | ------------------------------------ | ------------------------------- | ------------------------------------------------------------------ |
| Import         | Website folder + wireframe           | Baseline, candidate, reference  | Protect both inputs and make the comparison honest                 |
| Scope analysis | Imported source                      | Complexity-ceiling report       | Prevent the pipeline from introducing unjustified complexity       |
| Before preview | Baseline                             | Browser preview                 | Record what the user actually started with                         |
| Audit          | Candidate                            | Findings report                 | Identify objective problems without silently changing them         |
| Review         | Findings and user choices            | Decision journal                | Keep the author in control                                         |
| Remediation    | Approved fix groups                  | Updated candidate               | Apply only selected, supported fixes                               |
| Enhancement    | Wireframe + approved profile         | Updated candidate               | Apply reviewed styling without pretending validators are designers |
| After preview  | Candidate                            | Side-by-side browser comparison | Let the user judge the result                                      |
| Verification   | Candidate                            | Fresh findings report           | Confirm what remains                                               |
| Finalize       | Passing, manually approved candidate | Final folder + ZIP              | Produce a downloadable deliverable without overwriting evidence    |

## Why the stages are separate

A checker, a fixer, and a formatter answer different questions:

- A validator asks whether markup follows HTML rules.
- A linter asks whether CSS or JavaScript violates selected rules.
- A formatter changes spacing, indentation, wrapping, and other presentation of source code.
- A browser preview shows the human-visible result.
- A decision journal records why a change was accepted or skipped.

Combining all of those into an unreviewed rewrite would hide which tool made which decision. SitePolish gives them one guided workflow while preserving their separate responsibilities.

## Terminal review controls

- `d` displays what a proposed action does or shows the candidate/profile diff.
- `y` approves the proposal.
- `n` skips it.
- `a` records a user-authored alternative without executing arbitrary commands.

Run the comparison server in one Terminal and review or edit in a second. The
After iframe refreshes when the candidate changes.

Each session is stored chronologically under
`reports/review-sessions/TIMESTAMP/`. The baseline and wireframe remain
untouched.

## Complexity ceiling

SitePolish scans the imported source for plain-language indicators such as
standard HTML/CSS/JavaScript, modules and advanced CSS, or component/framework
files. Beginner input receives beginner recommendations. More advanced input
keeps its architecture and may receive recommendations up to—but not beyond—
the level already present.

## Future enhancement profiles

Profiles live in `profiles/`. A profile may contain a reviewed overlay and a
description of exactly what it changes. The public example includes:

- `validation-only`
- `lantern-grove-wireframe`

Future profiles should be small, explicit, reversible, and never run without approval.
