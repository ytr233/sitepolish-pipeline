# Website + Wireframe Walkthrough

## 1. Start

```bash
npm install
npm run guide
```

SitePolish waits for the website folder, wireframe image/PDF, run name, and
styling profile. It copies both inputs and detects the source-code level.

## 2. Audit

```bash
npm run audit -- --run "RUN-NAME"
open "runs/RUN-NAME/reports/AUDIT_DASHBOARD.html"
```

The dashboard shows the wireframe, complexity ceiling, code findings,
plain-English explanations, and official references.

## 3. Open the live comparison

In Terminal 1:

```bash
npm run compare -- --run "RUN-NAME"
```

Open <http://localhost:8000>. The protected Before pane stays fixed. The After
pane refreshes automatically after approved or manually saved candidate edits.

## 4. Review

In Terminal 2:

```bash
npm run review -- --run "RUN-NAME" --profile "PROFILE-NAME"
```

- `d` displays details or records the full styling diff.
- `y` approves.
- `n` skips.
- `a` records a safer plain-language alternative.

Every review session is stored chronologically.

Users may edit `runs/RUN-NAME/candidate/` directly while watching the live
preview. SitePolish does not execute arbitrary terminal text.

## 5. Compare

```bash
npm run compare -- --run "RUN-NAME"
```

Open <http://localhost:8000>, manually test every page and interaction, then
press `Control+C`.

## 6. Export

```bash
npm run audit -- --run "RUN-NAME"
npm run finalize -- --run "RUN-NAME"
```

After checks pass and manual review is approved, SitePolish creates:

```text
runs/RUN-NAME/final/
runs/RUN-NAME/RUN-NAME-final.zip
```

Beginner input stays beginner-level. Advanced input retains its architecture.
An arbitrary wireframe needs a reviewed human- or AI-authored styling profile;
the local validators do not pretend to understand image pixels.
