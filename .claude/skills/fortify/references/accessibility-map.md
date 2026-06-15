# Accessibility Map — What Is Accessible vs. What Is Not

A core deliverable the user asked for: a clear, explicit inventory of **what is
accessible and what is not**, and *to whom*. Build a first draft in Phase 1 and
finalize it in Phase 7 (after hardening), so the user can see the before/after.

The map answers, for every surface: *Who can reach this? With what auth? What
can they do or read? Is that intended?*

## What to inventory

For each target type, enumerate surfaces and classify them.

### Web / API
- Every route/endpoint (method + path), plus shadow/legacy API versions.
- Static assets, admin panels, debug/health/metrics endpoints, docs (Swagger).
- File upload/download paths; webhooks; SSE/websockets.
- Auth requirement per endpoint; required role/scope; rate limits.
- Data returned (does it over-expose fields/PII?).

### Mobile / Desktop
- Exported activities/intents/URL schemes/deep links; protocol handlers.
- IPC channels; local files/DB and whether encrypted; backup inclusion.
- Secrets/keys embedded in the binary; remote endpoints the client calls.

### Infra (if present)
- Open ports/services; public storage buckets; management dashboards.
- IAM roles/principals and what they can access; network exposure.

## Classification (per surface)

| Field | Values |
|---|---|
| Surface | route / intent / port / file / bucket … |
| Exposure | public · authenticated · role-restricted · internal-only · localhost |
| AuthN | none · session · token/JWT · mTLS · API key |
| AuthZ | none · ownership-checked · role/scope-checked |
| Sensitivity | public · internal · confidential · secret/PII/regulated |
| Intended? | yes · NO — finding |
| Rate-limited | yes / no |
| Notes | over-exposure, missing checks, etc. |

## Output format (in the report)

Two views:

1. **Accessible** — everything reachable, grouped by exposure level, with the
   auth/authz that protects it. Highlight anything reachable *without* the
   protection it should have (these are findings).
2. **Not accessible / protected** — what is correctly locked down, and the
   control enforcing it. This reassures the user and documents the security
   posture.

Example skeleton:

```
## Accessibility Map

### Publicly accessible (no auth required)
- GET /            — landing page            — public content — OK
- GET /health      — liveness               — no sensitive data — OK
- POST /login      — rate-limited (5/min)   — OK

### Authenticated only
- GET /api/me      — session required       — own data only (ownership-checked) — OK
- GET /api/orders/:id — token required      — ⚠ NOT ownership-checked → IDOR (FINDING F-003)

### Role-restricted
- /admin/*         — role=admin + MFA       — OK

### Internal / localhost only
- :9090 metrics    — bound to 127.0.0.1     — OK

### Correctly NOT accessible
- /.env, /.git     — blocked by server config — OK
- internal DB :5432 — not exposed to network  — OK
```

## Rules
- A surface that is reachable but *should not be* (or lacks the auth/authz its
  sensitivity demands) is a **finding** — cross-reference its ID.
- Re-generate the map after hardening so the user sees what changed.
- Never include secret values in the map — reference location/type only.
