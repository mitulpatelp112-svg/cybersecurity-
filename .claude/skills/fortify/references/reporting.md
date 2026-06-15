# Reporting

Each run produces reports written into the target project's `security/` folder
(create it). Outputs:

1. **`security/report.md`** — human report: executive summary + technical
   appendix + accessibility map.
2. **`security/findings.json`** — machine-readable, conforming to
   `templates/findings.schema.json`.
3. **`security/findings.sarif`** — SARIF 2.1.0 for GitHub code scanning (so
   findings show inline on PRs).
4. Accessibility Map embedded in `report.md` (see `accessibility-map.md`).

Use `templates/report-template.md` as the Markdown skeleton.

## Severity scoring
Use a CVSS-style qualitative scale; include a short rationale per finding.
- **Critical** — trivially exploitable, high impact (RCE, auth bypass, mass data
  exposure). Fix before shipping.
- **High** — serious impact or easy exploitation (SQLi behind auth, IDOR, stored
  XSS, secret in repo).
- **Medium** — meaningful but constrained (reflected XSS w/ mitigations, missing
  rate limit, weak config).
- **Low** — minor/defense-in-depth (missing header, verbose error).
- **Info** — observations, hardening suggestions, no direct vuln.

Score with impact × exploitability × exposure (public > authenticated >
internal). When unsure, justify the rating rather than inflating it.

## Each finding includes
- ID (e.g. `F-001`), title, severity (+ rationale/CVSS vector if computed).
- Location: file:line or endpoint/surface.
- Description: what it is and why it matters here (concrete, not generic).
- Evidence: how it was found (and, for validated findings, the safe PoC steps
  the swarm used against the authorized target).
- Impact: what an attacker gains.
- Remediation: specific, actionable, ideally with a code/config snippet.
- Status: open / fixed-in-this-run / accepted-risk / wont-fix.
- Compliance tags: framework + control IDs (`compliance-mapping.md`).
- Attack-catalog reference (which class).

## Executive summary (top of report)
- One-paragraph posture statement + chosen tier.
- Counts by severity, before vs. after hardening.
- Top 3–5 risks in plain language for non-engineers.
- Compliance matrix snapshot (covered / gaps per selected framework).
- Residual risk statement (honest — see tiers doc).

## Technical appendix
- Full findings list (above schema).
- Methodology: tiers/frameworks chosen, tools run, swarm composition, what was
  in/out of scope, authorization basis & targets tested.
- "What changed" — every hardening edit applied this run.
- Re-test instructions (how to re-run Fortify / the CI gate).

## Rules
- Never include secret values, full tokens, or live PII in any report. Redact;
  reference location/type.
- Be precise and reproducible; avoid vague "consider improving security".
- Distinguish *confirmed* (validated by swarm) from *potential* (static-only)
  findings.
- Reports are advisory evidence toward compliance, not certification.
