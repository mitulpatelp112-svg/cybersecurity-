# Attack Catalog — Threats, Detection & Defense

A working taxonomy of how systems get attacked and how to defend each class.
Use it as the checklist for Phase 3 (audit) and the playbook source for Phase 5
(harden). Scope coverage by tier (`security-tiers.md`): Basic/Standard focus on
the OWASP Top 10; Hardened/Maximum add supply chain, secrets/crypto depth,
infra/DoS, mobile/desktop, and advanced/APT classes.

Each entry: **what it is → how to detect in code → how to defend → how to test**.

---

## A. Injection (OWASP A03)

### A1. SQL / NoSQL injection
- **What**: untrusted input concatenated into a query alters its logic.
- **Detect**: string-built queries, f-strings/`+` into SQL, `$where`/`$ne` in
  Mongo from user input, ORMs used with raw fragments.
- **Defend**: parameterized queries / prepared statements; ORM bound params;
  allowlist column/sort names; least-privilege DB accounts; input validation.
- **Test**: `' OR '1'='1`, time-based `SLEEP`, boolean-blind, NoSQL operator
  injection (`{"$gt":""}`). Verify parameterization neutralizes them.

### A2. OS command injection
- **What**: input reaches a shell.
- **Detect**: `exec`, `system`, `child_process`, `os.system`, `Runtime.exec`,
  backticks, shell=True.
- **Defend**: avoid shells; use array-arg APIs; allowlist; no shell metachar
  passthrough; escape only as last resort.
- **Test**: `; id`, `$(id)`, `| whoami`, newline injection.

### A3. Template / expression injection (SSTI), LDAP, XPath, header/CRLF
- **Defend**: don't render user input as templates; sandbox engines; encode for
  the target grammar; strip CR/LF from header values.

---

## B. Cross-Site Scripting (XSS) & output handling

- **Reflected / Stored / DOM-based XSS**: untrusted data rendered as HTML/JS.
- **Detect**: `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, unescaped
  template interpolation, `document.write`, `eval`, building DOM from input.
- **Defend**: contextual output encoding; framework auto-escaping (don't bypass);
  a strict **Content-Security-Policy**; `HttpOnly`/`SameSite` cookies; sanitize
  rich HTML with a vetted library (DOMPurify) server-side; Trusted Types.
- **Test**: `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>`,
  attribute/JS-context breakouts, DOM sink tracing.

---

## C. Broken Authentication & Session (OWASP A07)

- **Threats**: credential stuffing, brute force, weak password storage,
  session fixation, predictable tokens, missing MFA, account enumeration.
- **Defend**: strong password hashing (argon2id/bcrypt/scrypt, never MD5/SHA1/
  plain); rate limiting + lockout/backoff; MFA; rotate session IDs on login;
  secure random tokens; generic auth errors (no enumeration); short-lived
  sessions + idle timeout; `Secure`/`HttpOnly`/`SameSite` cookies.
- **JWT/OAuth/OIDC pitfalls**: `alg:none`, weak HMAC secret, no `exp`/`aud`/`iss`
  checks, algorithm confusion (RS256→HS256), missing token revocation, leaking
  tokens in URLs, open redirect in OAuth callback, PKCE absent on public clients.
- **Test**: login throttling, token tampering, expired/forged JWTs, fixation,
  enumeration via timing/error differences.

---

## D. Broken Access Control (OWASP A01)

- **IDOR / BOLA**: object IDs not authorized per-request → access others' data.
- **Privilege escalation / function-level (BFLA)**: missing role checks on admin
  or write operations; mass assignment of `isAdmin`/`role`.
- **Path traversal**: `../` reaching files outside intended dir.
- **Defend**: enforce authorization server-side on *every* request at the object
  and function level (deny by default); ownership checks; never trust client
  role/ID; bind allowed fields explicitly (no mass assignment); canonicalize &
  confine file paths; signed/opaque identifiers where helpful.
- **Test**: swap IDs across accounts, call admin endpoints as a normal user,
  manipulate JSON to set privileged fields, `../../etc/passwd`.

---

## E. Security Misconfiguration & Hardening (OWASP A05)

- **Threats**: debug mode in prod, verbose errors/stack traces, default creds,
  open admin panels, directory listing, permissive CORS (`*` with credentials),
  missing security headers, unpatched components, overexposed cloud storage.
- **Defend**: secure defaults; disable debug; generic error pages; least
  privilege; lock down CORS to known origins; set headers — `Content-Security-
  Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options`/frame-ancestors, `Referrer-Policy`, `Permissions-Policy`;
  remove unused features/ports/services; config as code, reviewed.
- **Test**: header scan, CORS preflight abuse, error-triggering inputs, default
  credential checks.

---

## F. SSRF & Cryptographic Failures (OWASP A02 / A10)

### F1. SSRF
- **What**: server fetches an attacker-controlled URL → hits internal services,
  cloud metadata (169.254.169.254), files.
- **Defend**: allowlist outbound hosts/schemes; resolve & validate IPs (block
  private/link-local/loopback); no redirects to internal; drop `file://`/`gopher://`;
  isolate egress; require metadata v2/IMDSv2.
- **Test**: point fetchers at `http://169.254.169.254/`, `http://127.0.0.1`,
  DNS-rebinding, redirect-to-internal.

### F2. Cryptographic failures
- **Threats**: plaintext/weak transport, weak ciphers/hashes, hardcoded keys,
  ECB mode, static IVs, weak randomness (`Math.random` for tokens), no integrity.
- **Defend**: TLS everywhere (modern config, HSTS); AEAD ciphers (AES-GCM,
  ChaCha20-Poly1305); CSPRNG for tokens/keys; proper key management/rotation;
  hash passwords with argon2id/bcrypt; sign+verify where integrity matters.

---

## G. Insecure Design, SSJI, Deserialization, File handling

- **Insecure deserialization**: untrusted data into `pickle`, Java
  `ObjectInputStream`, PHP `unserialize`, unsafe YAML → RCE. **Defend**: avoid
  native deser of untrusted data; use data-only formats (JSON) with schema
  validation; signed payloads; safe loaders.
- **Unrestricted file upload**: **Defend** — validate type by content not
  extension, cap size, store outside webroot, randomize names, scan, never
  execute uploads, serve with correct/`nosniff` content-type.
- **Insecure design**: missing rate limits, no abuse cases, trust boundaries
  unclear. **Defend**: threat-model early; secure-by-design patterns; abuse-case
  tests.

---

## H. CSRF, Clickjacking & Client-side

- **CSRF**: state-changing request forged via the victim's session. **Defend**:
  anti-CSRF tokens (synchronizer/double-submit), `SameSite` cookies, require
  custom headers / re-auth for sensitive actions.
- **Clickjacking**: **Defend** — `frame-ancestors`/`X-Frame-Options`.
- **Open redirect / tabnabbing**: validate redirect targets to allowlist;
  `rel=noopener`.
- **Prototype pollution / client logic**: avoid unsafe merges of user objects.

---

## I. Server-Side Request Forgery already in F; API-specific (OWASP API Top 10)

- BOLA/BFLA (see D), excessive data exposure (return only needed fields),
  mass assignment, lack of resources & rate limiting, improper inventory
  (shadow/old API versions), unrestricted access to business flows.
- **Defend**: per-object & per-function authz, response shaping/DTOs, quotas &
  rate limits, API gateway, version inventory, schema validation (OpenAPI).

---

## J. Supply Chain & Dependencies (OWASP A06 — Hardened+)

- **Threats**: known-vulnerable deps (CVEs), typosquatting, dependency
  confusion, malicious/compromised packages, install scripts, poisoned build
  pipeline, unsigned artifacts.
- **Defend**: lockfiles + pinned versions; automated dependency audit
  (npm/pip/cargo audit, OSV, Dependabot); SBOM (CycloneDX/SPDX); verify
  integrity/signatures; scope internal registries to prevent confusion; review
  postinstall scripts; minimal base images; least-privilege CI tokens; protect
  the pipeline (branch protection, required reviews, no secrets in logs).
- **Test**: `npm/pip audit`, OSV scan, check for unpinned/`latest` deps.

---

## K. Secrets Management (Hardened+)

- **Threats**: secrets in source/history, `.env` committed, keys in client
  bundles, secrets in logs/error messages, long-lived static credentials.
- **Defend**: secret scanning (gitleaks/trufflehog, GitHub secret scanning);
  vault/secret manager; env injection at runtime; short-lived/rotated creds;
  `.gitignore` for env; pre-commit hooks; **rotate any exposed secret**.
- **Reporting rule**: report location+type only, never the value.

---

## L. Infrastructure, Containers & Cloud (Hardened/Maximum)

- **Threats**: over-permissive IAM, public buckets, exposed dashboards
  (k8s/Docker API), containers as root, no network policy, no resource limits,
  unencrypted data at rest, missing logging.
- **Defend**: least-privilege IAM; private by default; CIS-benchmark hardening
  (see compliance map); non-root containers, read-only FS, dropped caps; network
  segmentation/policies; secrets via manager; encryption at rest; centralized
  audit logging & alerting; IaC scanning (tfsec/checkov/kube-linter).

---

## M. Availability / DoS & Resource abuse (Maximum)

- **Threats**: unbounded loops/recursion, ReDoS (catastrophic regex), zip bombs,
  large-payload/`Content-Length` abuse, amplification, no rate limiting, GraphQL
  query depth/complexity bombs, expensive endpoints.
- **Defend**: rate limiting & quotas; request/body size caps; timeouts &
  circuit breakers; bounded pagination; regex review / safe engines; GraphQL
  depth & complexity limits + cost analysis; autoscaling & WAF; backpressure.

---

## N. Mobile & Desktop client surface (selected target)

### Mobile (iOS/Android) — OWASP MASVS/MSTG
- **Threats**: insecure local storage (tokens/PII in plaintext, shared prefs,
  SQLite), no cert pinning (MITM), exported components/intents, insecure deep
  links, hardcoded keys in the binary, weak biometric/keystore use, debuggable
  builds, screenshot/clipboard leakage, insecure IPC.
- **Defend**: Keychain/Keystore for secrets; encrypt local data; certificate
  pinning; validate deep-link params & require auth; restrict exported
  components; obfuscate & strip debug; jailbreak/root awareness for high tiers;
  disable backups of sensitive data.

### Desktop (Electron/native)
- **Threats**: `nodeIntegration` on with remote content (RCE via XSS),
  `contextIsolation` off, loading remote URLs, insecure protocol handlers,
  unsigned auto-update, secrets in app bundle, path traversal in IPC.
- **Defend**: `contextIsolation:true`, `nodeIntegration:false`, sandbox,
  strict CSP, validate all IPC messages, signed & verified auto-updates,
  no remote code, principle of least privilege for file/OS access.

---

## O. Advanced / APT-grade scenarios (Maximum tier)

- **Lateral movement & persistence**: assume breach; segment networks; rotate
  creds; detect anomalous east-west traffic; immutable infra.
- **Privilege escalation chains**: minimize SUID/capabilities, patch kernel/
  runtime, monitor for escalation primitives.
- **Data exfiltration & covert channels**: egress filtering, DLP, anomaly
  detection on outbound volume.
- **Insider & social engineering**: least privilege, separation of duties,
  audited access, phishing-resistant MFA (FIDO2/passkeys).
- **Zero-trust posture**: authenticate & authorize every request; no implicit
  network trust; continuous verification; comprehensive audit logging + SIEM.
- **Detection & response**: logging of security events, alerting, tested
  incident-response runbook, backups + tested restore, tamper-evident logs.

---

## Cross-cutting defenses (apply at every tier appropriate level)
- Validate input (allowlist) and encode output for context.
- Deny by default; least privilege everywhere.
- Defense in depth — never rely on a single control.
- Fail securely (errors don't reveal internals or open access).
- Log security events without logging secrets/PII.
- Keep dependencies and runtimes patched.
- Make security testable and re-runnable (CI gate).
