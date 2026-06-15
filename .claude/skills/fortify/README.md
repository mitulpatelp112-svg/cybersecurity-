# Fortify — Universal Security Skill

A portable Claude Code **skill** that hardens any project and then verifies the
hardening with a swarm of authorized attacker agents. Works on web apps, REST/
GraphQL APIs, mobile, and desktop projects — it detects the stack itself.

## What it does
1. **Authorize** — confirms you own the target; locks live testing to
   localhost / your confirmed staging only.
2. **Discover** — detects stack, maps every entry point, drafts an
   *Accessibility Map* (what's exposed vs. protected).
3. **Choose level** — you pick a tier: **Basic → Standard → Hardened → Maximum**,
   plus fix policy and compliance frameworks.
4. **Audit & threat-model** — against a comprehensive attack catalog (OWASP Top
   10 and beyond), mapped to OWASP ASVS, NIST, CIS, SOC 2 / ISO 27001 / PCI-DSS.
5. **Report** — severity-ranked findings + remediation (report-first by default).
6. **Harden** — applies fixes on your approval (idiomatic, tested).
7. **Red-team swarm** — parallel specialized agents safely attack the authorized
   target to prove fixes hold.
8. **Final report** — Markdown + JSON + SARIF, updated Accessibility Map,
   residual-risk statement, optional CI gate.

## Install into another project
```bash
.claude/skills/fortify/scripts/install.sh /path/to/your/project
```
Then open that project in Claude Code and run the **`fortify`** skill.

## Layout
```
fortify/
  SKILL.md                      # the orchestrator (phases & principles)
  references/
    attack-catalog.md           # threats → detection → defense → test
    security-tiers.md           # the 4 tiers
    compliance-mapping.md       # ASVS / NIST / CIS / SOC2 / ISO / PCI
    hardening-playbooks.md      # per-stack fixes
    accessibility-map.md        # exposed-vs-protected inventory
    reporting.md                # report structure, severity, formats
  agents/red-team-swarm.md      # authorized attacker-agent orchestration
  templates/                    # auth checklist, findings schema, report, CI
  scripts/install.sh            # copy into any project
```

## Safety & ethics
Fortify is a **defensive** tool. Active testing runs only against systems you own
or are explicitly authorized to test (localhost / confirmed staging). It is
non-destructive by default and never echoes secrets or live PII. Reports are
advisory evidence and gap analysis — not a security certification, and no tier
guarantees invulnerability. See `templates/authorization-checklist.md`.
