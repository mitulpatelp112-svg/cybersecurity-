# Security Tiers

Fortify offers four tiers. In Phase 2, present these to the user and let them
pick. Each tier is cumulative — it includes everything below it. State plainly
what protection each adds and what it costs (effort/friction), so the user can
choose with eyes open.

The honest framing for the top tier: **"high-end security that nobody can
access" is an aspiration, not a guarantee.** No system is unbreakable. Maximum
tier means defense-in-depth, assume-breach, and zero-trust controls that make
attacks expensive, slow, and loud — and ensure you detect and recover. Always
communicate residual risk.

---

## Tier 1 — Basic ("close the obvious doors")
**For**: prototypes, internal tools, MVPs, learning projects.
**Covers**:
- OWASP Top 10 quick pass — injection, XSS, broken access control basics.
- Parameterized queries / no string-built SQL.
- Output encoding / framework auto-escaping on.
- No secrets in source; `.gitignore` for env; basic secret scan.
- HTTPS/TLS in transit; no debug mode in prod; generic error pages.
- Dependency audit for known CVEs.
- Strong password hashing if auth exists.
**Testing**: static analysis + dependency/secret scan. No active exploitation
unless requested.

## Tier 2 — Standard ("production-ready baseline")
**For**: most public-facing apps and APIs.
**Adds**:
- Full OWASP Top 10 + OWASP API Top 10 coverage.
- Robust authN/authZ: per-object & per-function authorization (no IDOR/BFLA),
  session hardening, rate limiting/lockout, MFA available.
- Security headers (CSP, HSTS, nosniff, frame-ancestors, etc.) + CORS lockdown.
- CSRF protection; secure cookies (`HttpOnly`/`Secure`/`SameSite`).
- Input validation (allowlist) and safe file uploads.
- SSRF protection on outbound fetchers.
- Secret scanning in CI; lockfiles + dependency audit gate.
- Logging of security events (no secrets/PII).
**Testing**: static + safe automated probes (header checks, auth/IDOR checks,
fuzzing of inputs) against localhost/staging.

## Tier 3 — Hardened ("defense in depth")
**For**: apps handling sensitive data, regulated or B2B contexts.
**Adds**:
- Formal threat model per entry point (STRIDE) and documented trust boundaries.
- Supply-chain security: SBOM, pinned/verified deps, dependency-confusion
  protection, hardened CI pipeline (least-privilege tokens, branch protection).
- Secrets in a manager/vault, short-lived & rotated; pre-commit secret hooks.
- Crypto review: AEAD ciphers, CSPRNG, key management/rotation, TLS modern config.
- Infra/IaC hardening to CIS benchmarks (containers non-root, least-priv IAM,
  private-by-default storage, network policies) where applicable.
- Centralized audit logging + alerting.
- Compliance mapping (ASVS L2 + chosen frameworks).
**Testing**: active exploit validation (authorized, localhost/staging) by the
red-team swarm across injection, auth, access control, secrets, supply chain.

## Tier 4 — Maximum ("assume breach, zero trust")
**For**: high-value targets, defense-grade, fintech/health, anything where
compromise is catastrophic.
**Adds**:
- Zero-trust architecture: authenticate & authorize *every* request; no implicit
  network trust; continuous verification.
- Assume-breach controls: network segmentation, lateral-movement detection,
  least privilege everywhere, immutable infrastructure.
- Phishing-resistant MFA (FIDO2/passkeys); separation of duties; just-in-time
  access; audited privileged access.
- DoS/availability resilience (rate/cost limits, GraphQL depth/complexity, WAF,
  autoscaling, ReDoS review).
- Advanced/APT scenario coverage: privilege-escalation chains, persistence,
  exfiltration/covert channels, insider risk.
- Full detection & response: SIEM-ready logging, tamper-evident logs, tested
  incident-response runbook, backups + tested restore.
- ASVS L3 + full compliance mapping; periodic re-testing in CI.
**Testing**: full red-team swarm including advanced scenarios, DoS resilience
checks, and mobile/desktop client surface (authorized targets only).

---

## How tier choice maps to behavior
- **Audit scope** widens with tier (which catalog sections in `attack-catalog.md`).
- **ASVS level**: Basic≈L1-, Standard≈L1, Hardened≈L2, Maximum≈L3.
- **Swarm composition** grows (see `agents/red-team-swarm.md`).
- **Fix aggressiveness** stays governed by the separate fix-policy choice.

Always tell the user, after the run: which tier was applied, what it protects
against, and what residual risk remains at that tier.
