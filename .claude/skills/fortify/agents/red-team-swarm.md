# Red-Team Swarm — Authorized Attacker Agents

Phase 6 verifies that hardening actually holds by *attacking the system the way a
real adversary would* — but only against authorized targets, with non-destructive
intent. This file explains how to orchestrate the swarm using the `Agent` tool.

## Authorization gate (must pass before ANY active test)
Do not spawn attacker agents until `templates/authorization-checklist.md` passes:
- Target is `localhost`/loopback, or a staging URL the user explicitly confirmed
  they own/are authorized to test.
- No third-party hosts, no production without written confirmation.
- Destructive actions (data deletion, persistent DoS, account lockout of real
  users) are off by default; only safe, reversible probes.
Every spawned agent's prompt MUST restate these constraints.

## Orchestration model (parallel specialized agents + coordinator)
You are the coordinator. Spawn role-specialized sub-agents **in parallel** (one
message, multiple `Agent` calls). Each gets: the authorized target(s), the tier,
the relevant `attack-catalog.md` section, the hardening that was applied, and the
strict rules of engagement. Each returns structured findings; you de-duplicate,
score, and merge into the report. New confirmed findings loop back to Phase 4/5.

Scale the swarm to the tier and project size (see composition below). For very
large projects, shard by area (per service/route group) across more agents.

## Swarm composition by tier

### Standard tier (and up) — core squad
1. **Injection tester** — SQL/NoSQL/command/template injection against inputs.
2. **Auth & session tester** — brute force/throttle, token tampering, JWT flaws,
   fixation, enumeration, MFA bypass.
3. **Access-control tester** — IDOR/BOLA, BFLA/function-level, mass assignment,
   path traversal, privilege escalation.
4. **Config & headers tester** — security headers, CORS, error leakage, debug
   endpoints, default creds, open admin.
5. **Recon agent** — map endpoints/surfaces, build/refine the Accessibility Map,
   find shadow APIs & exposed files.

### Hardened tier — add
6. **Secrets & crypto tester** — secret scan (history too), weak crypto, token
   randomness, TLS config.
7. **Dependency / supply-chain auditor** — CVEs, unpinned deps, dependency
   confusion, risky install scripts, SBOM gaps.
8. **SSRF & file-handling tester** — outbound fetch abuse, upload bypass.

### Maximum tier — add
9. **DoS / resource-abuse tester** — rate-limit gaps, ReDoS, payload/depth bombs
   (bounded, non-destructive — measure thresholds, don't actually take it down).
10. **Mobile/desktop client tester** — local storage, exported components/deep
    links, IPC, Electron config, embedded secrets (for those target types).
11. **Advanced-scenario / chaining agent** — chain lower findings into realistic
    attack paths (assume-breach, lateral movement, privilege-escalation chains)
    on the authorized target only.

## Per-agent prompt template
Give each agent something like:
```
You are an AUTHORIZED security tester (role: <ROLE>). Target(s): <AUTHORIZED
TARGETS ONLY — localhost/confirmed staging>. You may ONLY test these; refuse
anything else. Non-destructive only: no data deletion, no persistent DoS, no
real-user lockout. Tier: <TIER>.

Using <attack-catalog section>, attempt to find and SAFELY validate weaknesses in
<area>. For each: report severity, exact location/endpoint, the minimal safe PoC
steps, observed impact, and remediation. Also report what you tried that the
hardening correctly BLOCKED (negative results matter — they confirm controls).

Return findings as JSON matching templates/findings.schema.json. Do not echo any
secret values. Stay within scope.
```

## Coordinator responsibilities
- De-duplicate overlapping findings; keep the clearest evidence.
- Re-score consistently using `reporting.md` severity scale.
- Separate **confirmed** (validated live) from **potential** (static) findings.
- Capture *blocked* attempts too — they become the "what is NOT accessible"
  evidence in the Accessibility Map.
- Feed confirmed findings back into Phase 5; re-run affected agents after fixes
  to prove closure.
- Aggregate into `security/findings.json` + `report.md`.

## Safety reminders
- Bound DoS/fuzz tests so they don't actually degrade shared environments.
- If an agent reports it can reach something out of scope, STOP and ask the user.
- Treat any discovered secret as compromised; recommend rotation, never log it.
- Follow NIST SP 800-115 phasing: plan → discover → attack → report.
