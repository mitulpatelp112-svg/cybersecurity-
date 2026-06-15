---
name: fortify
description: >-
  Universal security hardening and authorized red-team testing for ANY project
  (web apps, REST/GraphQL APIs, mobile, desktop). Use when the user wants to
  audit, harden, "make secure", pentest, threat-model, or security-review a
  codebase; asks "what is exposed/accessible", "is this safe to ship", or wants
  a security level from basic to maximum. Researches attack classes, hardens the
  code (report-first, fix-on-approval), then verifies with a parallel swarm of
  authorized attacker agents. Localhost/owned-staging targets only.
---

# Fortify — Universal Security Hardening & Authorized Red-Team Testing

Fortify is a project-agnostic security skill. It runs in **phases**: it learns the
project, agrees on a security tier and rules of engagement, maps the attack
surface (what is accessible vs. protected), hardens the code with your approval,
then proves the hardening holds by attacking it with a swarm of specialized,
**authorized** agents — and finally reports.

It works on any stack. It does not assume a language or framework; Phase 1
detects them.

## Operating principles (read first, always apply)

1. **Authorization is non-negotiable.** Active/attack testing only runs against
   `localhost`, loopback, or a target the user has *explicitly confirmed they own
   or are authorized to test*. Never scan, probe, or attack third-party hosts,
   public IPs you weren't given, or production without written confirmation. If
   in doubt, stop and ask. See `templates/authorization-checklist.md`.
2. **Defensive intent.** This skill exists to *harden* systems and verify that
   hardening. Generate exploit payloads only to validate the user's *own*
   findings, never for use against systems they don't control. Refuse if the
   framing turns offensive against third parties.
3. **Report before you change.** Default is: surface findings → get approval →
   apply fixes. Never silently rewrite security-relevant code unless the user
   chose "auto-harden".
4. **No secrets in output.** When you find credentials/keys, report their
   *location and type*, never echo the secret value into reports, commits, or
   logs. Treat discovered secrets as compromised and recommend rotation.
5. **Least surprise.** Explain what each phase will do before doing it. Keep the
   user in control of scope, depth, and which fixes land.

## Workflow

Run phases in order. Skip only when the user explicitly narrows scope
(e.g. "just audit, don't test").

### Phase 0 — Authorization & rules of engagement
- Confirm the user owns / is authorized to test this project.
- Establish allowed targets: source code is always fair game; for **live**
  testing, confirm `localhost` and/or a specific staging URL the user provides.
- Walk through `templates/authorization-checklist.md`. Do not proceed to any
  *active* testing until it passes. Static/code analysis can proceed once
  ownership is confirmed.

### Phase 1 — Discovery & recon (passive)
- Detect project type(s), languages, frameworks, package managers, services,
  data stores, auth mechanisms, and deployment/IaC.
- Inventory entry points: routes/endpoints, forms, file uploads, message
  consumers, CLI args, env/config, third-party integrations, IPC/deep links
  (mobile/desktop).
- Produce a first-pass **Accessibility Map** (what is exposed vs. protected):
  see `references/accessibility-map.md`.

### Phase 2 — Choose security tier & options
Ask the user (use AskUserQuestion):
- **Security tier**: Basic / Standard / Hardened / Maximum — defined in
  `references/security-tiers.md`. Summarize what each adds.
- **Fix policy**: report-first (default) / auto-harden / report-only.
- **Compliance frameworks** to map findings against (OWASP ASVS default; also
  NIST, CIS, SOC 2/ISO 27001/PCI-DSS). See `references/compliance-mapping.md`.
- **Live testing depth** (decided per run): static-only / safe probes /
  active exploit validation (localhost or confirmed staging only).
- **CI/CD**: offer to emit a pipeline gate (`templates/ci-workflow.yml`).

### Phase 3 — Audit & threat model
- Walk the codebase against `references/attack-catalog.md`, scoped to the chosen
  tier. Cover at minimum the OWASP Top 10 (web/API); add the broader catalog
  (supply chain, secrets/crypto, infra/DoS, mobile/desktop, advanced/APT) as the
  tier rises.
- Threat-model each entry point: who can reach it, with what privileges, what
  could go wrong (STRIDE-style).
- Run available scanners if present (dependency audit, secret scan, SAST). Note
  which tools are missing and recommend them — don't fail if absent.
- Record findings using `templates/findings.schema.json`.

### Phase 4 — Findings report (gate)
- Produce the report per `references/reporting.md`: executive summary +
  technical appendix + accessibility map, with severities (CVSS-style) and
  per-finding remediation. Write to `security/` in the target project.
- Stop and let the user choose what to fix (unless auto-harden was selected).

### Phase 5 — Harden (on approval)
- Apply fixes from `references/hardening-playbooks.md`, matched to the detected
  stack and chosen tier. Prefer minimal, idiomatic, well-tested changes.
- Re-run the project's tests/build after changes. Never leave the build broken.
- Track every change so the final report's "what changed" is accurate.

### Phase 6 — Red-team swarm (authorized verification)
- Orchestrate a swarm of parallel specialized attacker agents per
  `agents/red-team-swarm.md` (injection, auth/session, access-control, secrets,
  dependency/supply-chain, recon, plus mobile/desktop & DoS at higher tiers).
- Each agent attacks ONLY authorized targets, reports what it could and could
  not do, and feeds a coordinator that de-duplicates and synthesizes.
- Any new finding loops back to Phase 4/5.

### Phase 7 — Final report & handoff
- Emit final Markdown report + machine-readable JSON/SARIF
  (`templates/findings.schema.json`, SARIF for GitHub code scanning).
- Deliver the updated **Accessibility Map**: explicitly, what is now accessible
  vs. not, and to whom.
- If chosen, install the CI gate and document how to re-run Fortify.
- Summarize residual risk and recommended next steps.

## Reference files (load as needed — progressive disclosure)
- `references/attack-catalog.md` — comprehensive attack taxonomy + defenses.
- `references/security-tiers.md` — the 4 tiers and exactly what each requires.
- `references/compliance-mapping.md` — ASVS / NIST / CIS / SOC2 / ISO / PCI map.
- `references/hardening-playbooks.md` — per-stack fix recipes.
- `references/accessibility-map.md` — building the exposed-vs-protected inventory.
- `references/reporting.md` — report structure, severity scoring, output formats.
- `agents/red-team-swarm.md` — how to spawn and coordinate attacker agents.
- `templates/` — report template, findings JSON schema, CI workflow, auth checklist.
- `scripts/install.sh` — copy Fortify into any other project.

## Demo
`demo-app/` contains an intentionally-vulnerable app plus a `hardened/` version
so you can exercise the full audit → harden → attack → report loop end-to-end.
