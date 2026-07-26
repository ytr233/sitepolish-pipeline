# Independent Pipeline Audit Checklist

```bash
npm test
npm audit
npm run example
```

Then verify:

1. A deliberately broken site produces findings.
2. A known-valid site passes.
3. Rejecting proposals leaves the candidate unchanged.
4. Approving a proposal changes only the candidate.
5. `a` records alternative text but never executes it.
6. The live comparison refreshes only the After pane.
7. Finalization stops while findings remain.
8. Passing, manually approved work produces a final folder and ZIP.
9. Baseline, wireframe, reports, and chronological sessions remain preserved.

Use a second developer or independent security reviewer for higher assurance.
The pipeline’s author should never be its only auditor.
