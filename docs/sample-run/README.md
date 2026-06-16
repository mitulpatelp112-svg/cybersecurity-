# Sample Fortify run — demo-app (Standard tier)

These are the **actual artifacts** produced by running the `fortify` skill
against `demo-app/src/server.js` (localhost-only, self-attested owner,
report-first, Standard tier). They are committed here as a worked example; in a
real project the equivalent files are written to `<project>/security/` (which is
gitignored by default).

- [`report.md`](report.md) — executive summary, accessibility map, technical appendix.
- [`findings.json`](findings.json) — 10 findings, validated against
  [`findings.schema.json`](../../.claude/skills/fortify/templates/findings.schema.json).
- [`findings.sarif`](findings.sarif) — SARIF 2.1.0 for GitHub code scanning.

**Result:** 2 critical, 5 high, 3 medium on the vulnerable build — all remediated
in `demo-app/hardened/server.js` and confirmed blocked by an authorized localhost
red-team. See the annotated walkthrough in [`../EXAMPLE-RUN.md`](../EXAMPLE-RUN.md).
