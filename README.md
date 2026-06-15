# cybersecurity- · Fortify

A **universal cybersecurity skill** for Claude Code that hardens any project and
then verifies the hardening by attacking it with a swarm of authorized agents.

This repository hosts:

- **`.claude/skills/fortify/`** — the portable Fortify skill. Drop it into any
  project (web, API, mobile, desktop) and run `fortify` to audit → harden →
  red-team → report. See [the skill README](.claude/skills/fortify/README.md).
- **`demo-app/`** — a small intentionally-vulnerable Express app (plus a hardened
  version) to demonstrate the full workflow end-to-end.

## What Fortify does

1. **Authorize** — confirms ownership; live testing is restricted to
   localhost / your confirmed staging only.
2. **Discover** — detects the stack and maps what is accessible vs. protected.
3. **Choose a level** — Basic → Standard → Hardened → Maximum, plus compliance
   frameworks (OWASP ASVS, NIST, CIS, SOC 2 / ISO 27001 / PCI-DSS).
4. **Audit & threat-model** — against a comprehensive attack catalog.
5. **Report** — severity-ranked findings + remediation (report-first by default).
6. **Harden** — applies fixes on your approval.
7. **Red-team swarm** — parallel authorized attacker agents prove the fixes hold.
8. **Final report** — Markdown + JSON + SARIF, accessibility map, residual risk,
   optional CI gate.

## Use it on your own project

```bash
.claude/skills/fortify/scripts/install.sh /path/to/your/project
```

Then open that project in Claude Code and run the **`fortify`** skill.

## Try the demo

```bash
cd demo-app && npm install && npm start   # vulnerable app on localhost:3000
```

Then run `fortify`, review the report, apply hardening, and let the swarm test it.

## Safety & ethics

Fortify is a **defensive** tool. Active testing runs only against systems you own
or are explicitly authorized to test, is non-destructive by default, and never
echoes secrets or live PII. Reports are advisory evidence and gap analysis —
**not** a certification, and no tier guarantees invulnerability. See
[`authorization-checklist.md`](.claude/skills/fortify/templates/authorization-checklist.md).
