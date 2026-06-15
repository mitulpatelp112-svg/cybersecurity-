# Hardening Playbooks

Concrete, idiomatic fixes to apply in Phase 5, organized by concern and stack.
Prefer minimal changes that fit the project's existing patterns. After any
change, re-run tests/build. These are recipes — adapt to the detected framework.

General rule: **fix the class, not just the instance.** When you find one SQLi,
sweep for the pattern everywhere; when you add a security header, add the full
recommended set.

---

## 1. Input validation & injection
- Replace string-built queries with parameterized/prepared statements or ORM
  bound params. Allowlist dynamic identifiers (table/column/sort).
- Add a validation layer at trust boundaries (schema validation: zod/joi/pydantic/
  JSON Schema/bean validation). Validate type, length, format, range; reject by
  default.
- Remove shell invocation; use array-argument process APIs. No `shell=True`.

## 2. Output encoding & XSS
- Use framework auto-escaping; remove `innerHTML`/`dangerouslySetInnerHTML`/
  `v-html` on user data, or sanitize with DOMPurify (server-side for stored).
- Add a strict CSP (start report-only, then enforce); enable Trusted Types where
  supported.

## 3. Security headers (web)
Set the full set (via helmet/middleware/server config):
```
Content-Security-Policy: default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```
- Node/Express: `helmet()`. Django: `SecurityMiddleware` + settings. Rails:
  `secure_headers`. Nginx: `add_header`. Set `Cache-Control: no-store` on
  sensitive responses.

## 4. CORS
- Replace `*` (especially with credentials) with an explicit origin allowlist.
- Restrict methods/headers; never reflect arbitrary `Origin`.

## 5. Authentication & sessions
- Hash passwords with argon2id (or bcrypt/scrypt). Remove MD5/SHA1/plaintext.
- Cookies: `HttpOnly; Secure; SameSite=Lax|Strict`. Rotate session ID on login;
  set idle + absolute timeout.
- Add rate limiting + exponential backoff/lockout on auth endpoints.
- Generic auth errors (no user enumeration). Offer/require MFA per tier.
- JWT: enforce `alg` allowlist (no `none`), strong secret/keys, verify
  `exp`/`aud`/`iss`; prevent RS256↔HS256 confusion; short TTL + refresh rotation.

## 6. Access control
- Enforce authorization server-side on every request: ownership checks (no
  IDOR/BOLA) and role/scope checks (no BFLA). Deny by default.
- Stop mass assignment: bind an explicit allowlist of fields; never accept
  client-supplied `role`/`isAdmin`.
- Canonicalize & confine file paths; reject `..`; serve uploads from a safe dir.

## 7. SSRF & outbound
- Allowlist outbound hosts/schemes; validate resolved IPs (block private/
  link-local/loopback/metadata); disable redirects to internal; drop `file://`.

## 8. Crypto & secrets
- TLS modern config + HSTS. AEAD ciphers (AES-GCM/ChaCha20-Poly1305); CSPRNG for
  tokens. Move secrets to env/secret manager; remove from source and history.
- Add secret scanning (gitleaks) + pre-commit hook. **Recommend rotating any
  exposed secret** (report location/type only, never the value).

## 9. File uploads
- Validate content type by magic bytes, cap size, randomize names, store outside
  webroot, set `nosniff`, never execute, optional AV scan.

## 10. Rate limiting & DoS
- Add rate limits/quotas, request body size caps, timeouts, bounded pagination.
- GraphQL: depth + complexity limits, disable introspection in prod, cost
  analysis. Review regexes for ReDoS.

## 11. Errors, logging & monitoring
- Disable debug/verbose errors in prod; generic error pages. Log security events
  (authn/authz failures, input rejection) without secrets/PII. Add alerting at
  higher tiers.

## 12. Dependencies & supply chain
- Commit lockfiles; pin versions; run `npm/pip/cargo audit` / OSV; enable
  Dependabot. Generate an SBOM. Review postinstall scripts. Scope internal
  registries to prevent dependency confusion.

## 13. Infra / IaC (when present)
- Containers: non-root user, read-only rootfs, drop capabilities, no
  `--privileged`, resource limits, minimal base image, pinned digests.
- K8s: network policies, securityContext, no default service-account token,
  secrets via manager.
- Cloud: least-privilege IAM, private-by-default storage, encryption at rest,
  audit logging. Run tfsec/checkov/kube-linter and fix high findings.

## 14. Mobile client
- Store secrets/tokens in Keychain/Keystore; encrypt local DB; no secrets in the
  binary. Certificate pinning. Validate deep-link params + require auth. Restrict
  exported components. Strip debug, disable backup of sensitive data.

## 15. Desktop / Electron
- `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true`. Strict CSP.
  No loading of remote content into privileged windows. Validate all IPC inputs.
  Signed & verified auto-update. Least-privilege file/OS access.

---

After hardening: update the Accessibility Map, re-run the swarm to confirm fixes
hold, and record each change for the report's "what changed" section.
