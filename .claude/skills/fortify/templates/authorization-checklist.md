# Authorization Checklist (Rules of Engagement)

Active/attack testing must NOT begin until every box is satisfied. Static source-
code analysis may proceed once project ownership is confirmed. When in doubt, ask
the user and stop.

## Required before active testing
- [ ] The user has confirmed they own, or are explicitly authorized to test,
      this project/codebase.
- [ ] Live targets are limited to:
      - [ ] `localhost` / loopback (127.0.0.1, ::1), and/or
      - [ ] a specific staging/test URL the user provided AND confirmed they own
            or are authorized to test.
- [ ] No third-party hosts, no arbitrary public IPs, no production systems
      (unless the user provides explicit written confirmation of authorization).
- [ ] Testing window / any constraints noted (avoid disrupting shared envs).
- [ ] Destructive actions are OFF by default: no data deletion, no persistent
      denial of service, no lockout of real user accounts, no spam/email/SMS
      sending, no irreversible state changes.
- [ ] Discovered secrets/PII will be reported by location/type only — never
      echoed, logged, or committed — and rotation will be recommended.

## Out of scope unless explicitly authorized in writing
- Production environments and real customer data.
- Any system, domain, or IP the user does not own/control.
- Social engineering of real people; physical security.
- Sustained/real DoS against shared or production infrastructure.

## If something goes out of scope mid-test
Stop immediately, do not pivot, and report to the user what was reached and how.

## Record for the report
- Authorization basis (who authorized, what scope).
- Exact targets tested.
- Date/time window.
- Any constraints applied.

> Fortify is a defensive tool. Its purpose is to harden the user's own systems
> and verify that hardening. It must never be used to attack systems the user is
> not authorized to test.
