# Workflow design

The professional name for this process is a **front-end validation, remediation, and progressive-enhancement workflow**.

## Stages

| Stage          | Input                     | Output                          | Why it exists                                              |
| -------------- | ------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Import         | User’s website folder     | Baseline and candidate copies   | Protect the source and make the comparison honest          |
| Before preview | Baseline                  | Browser preview                 | Record what the user actually started with                 |
| Audit          | Candidate                 | Findings report                 | Identify objective problems without silently changing them |
| Review         | Findings and user choices | Decision journal                | Keep the author in control                                 |
| Remediation    | Approved fix groups       | Updated candidate               | Apply only selected, supported fixes                       |
| Enhancement    | Optional selected profile | Updated candidate               | Add requested features after code quality is understood    |
| After preview  | Candidate                 | Side-by-side browser comparison | Let the user judge the result                              |
| Verification   | Candidate                 | Fresh findings report           | Confirm what remains                                       |
| Finalize       | Passing candidate         | Separate final folder           | Produce a deliverable without overwriting evidence         |

## Why the stages are separate

A checker, a fixer, and a formatter answer different questions:

- A validator asks whether markup follows HTML rules.
- A linter asks whether CSS or JavaScript violates selected rules.
- A formatter changes spacing, indentation, wrapping, and other presentation of source code.
- A browser preview shows the human-visible result.
- A decision journal records why a change was accepted or skipped.

Combining all of those into an unreviewed rewrite would hide which tool made which decision. SitePolish gives them one guided workflow while preserving their separate responsibilities.

## Future enhancement profiles

Profiles live in `profiles/`. A profile may contain a reviewed overlay and a
description of exactly what it changes. The engine supports selectable profiles
and currently ships with the neutral `validation-only` profile.

Future profiles should be small, explicit, reversible, and never run without approval.
