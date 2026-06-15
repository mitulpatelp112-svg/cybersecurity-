# Compliance & Standards Mapping

Map every finding to the frameworks the user selected. Default is OWASP ASVS +
Top 10. Don't claim "compliant" — Fortify produces *evidence and gap analysis*
toward these frameworks; formal certification requires an auditor.

For each finding, attach the relevant control IDs (see `findings.schema.json`
`compliance` field). Use this file as the lookup.

---

## OWASP (application security — default)
- **OWASP Top 10 (2021)**: A01 Broken Access Control · A02 Cryptographic
  Failures · A03 Injection · A04 Insecure Design · A05 Security Misconfiguration
  · A06 Vulnerable/Outdated Components · A07 Auth Failures · A08 Software/Data
  Integrity Failures · A09 Logging/Monitoring Failures · A10 SSRF.
- **OWASP API Security Top 10**: API1 BOLA · API2 Broken Auth · API3 Property-
  level authz · API4 Resource consumption · API5 BFLA · API6 Sensitive business
  flows · API7 SSRF · API8 Misconfiguration · API9 Inventory · API10 Unsafe
  consumption of APIs.
- **OWASP ASVS** (verification levels): L1 (opportunistic, baseline) → L2
  (standard, most apps with sensitive data) → L3 (advanced, high-value). Map the
  chosen tier: Basic→L1-, Standard→L1, Hardened→L2, Maximum→L3.
- **OWASP MASVS** (mobile): MASVS-STORAGE, -CRYPTO, -AUTH, -NETWORK, -PLATFORM,
  -CODE, -RESILIENCE. Use for the mobile target type.

## NIST
- **CSF 2.0 functions**: Govern · Identify · Protect · Detect · Respond ·
  Recover. Tag findings by which function the missing control supports.
- **SP 800-53** control families (selected): AC (access control), IA
  (identification & auth), SC (system & comms protection), SI (system &
  information integrity), AU (audit & accountability), CM (config management),
  RA (risk assessment), IR (incident response). Cite family + control where
  precise (e.g. AC-3 enforcement, IA-2 MFA, SC-13 cryptography, SC-8 transit).
- **SP 800-115** — Technical Guide to Information Security Testing: governs how
  the red-team swarm should plan, execute, and report tests (planning →
  discovery → attack → reporting). Follow its phasing.

## CIS
- **CIS Controls v8** (prioritized safeguards) — map infra/process findings
  (e.g. Control 3 data protection, 4 secure config, 5 account mgmt, 6 access
  control mgmt, 7 continuous vuln mgmt, 8 audit log mgmt, 16 app security).
- **CIS Benchmarks** — concrete hardening for the detected platform: OS (Linux),
  Docker, Kubernetes, cloud (AWS/Azure/GCP), web servers, databases. When infra
  is present, check config against the relevant benchmark and cite the section.

## Audit / regulatory frameworks
- **SOC 2** Trust Services Criteria: Security (Common Criteria CC1–CC9),
  Availability, Confidentiality, Processing Integrity, Privacy. Map findings to
  CC (e.g. CC6 logical access, CC7 system operations/monitoring).
- **ISO/IEC 27001:2022** Annex A controls (themes: Organizational, People,
  Physical, Technological). Cite Annex A reference where applicable (e.g. A.8.x
  technological controls — access, crypto, logging, secure development).
- **PCI-DSS v4.0** (only if cardholder data is handled): key requirements — Req
  3 protect stored data, Req 4 encrypt transmission, Req 6 secure development &
  patching, Req 7/8 access control & auth, Req 10 logging & monitoring, Req 11
  testing. Flag if PAN/CHD handling is detected.

---

## How to apply
1. Detect which frameworks are relevant (user selection + project signals — e.g.
   payment code → PCI, health data → add HIPAA note, cloud infra → CIS).
2. For each finding, populate `compliance: [{framework, control, status}]`.
3. In the report, include a compliance matrix: framework → covered / gaps.
4. State the disclaimer: this is gap analysis & evidence, not certification.
