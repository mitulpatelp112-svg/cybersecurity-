# Demo Target App

A tiny Express app used to demonstrate the **Fortify** skill end-to-end.

- `src/server.js` — **intentionally vulnerable**. Each issue is tagged with a
  `// VULN:` comment so you can see what Fortify should find.
- `hardened/server.js` — the same app after hardening, with `// FIX:` comments
  showing the remediation for each issue.

> ⚠️ The vulnerable version is for local demonstration only. Never deploy it or
> expose it to a network. Run on localhost only.

## Run
```bash
cd demo-app
npm install
npm start            # runs the vulnerable version on http://localhost:3000
npm run start:hardened   # runs the hardened version
```

## Issues demonstrated (vulnerable → hardened)
| # | Class | Vulnerable | Hardened |
|---|-------|-----------|----------|
| 1 | SQL injection | string-built query | parameterized query |
| 2 | Reflected XSS | echoes input into HTML | output encoding |
| 3 | Broken access control (IDOR) | any user reads any record | ownership check |
| 4 | Missing authentication | admin route open | auth + role check |
| 5 | Hardcoded secret | API key in source | from env / secret manager |
| 6 | Weak password storage | SHA1 | argon2/bcrypt |
| 7 | Missing security headers | none | helmet + CSP |
| 8 | Verbose errors | stack traces leaked | generic errors |
| 9 | No rate limiting | unlimited login attempts | rate limiter |

Use this app to try the workflow: run `fortify`, let it audit `src/`, review the
report, apply hardening, then run the red-team swarm against `localhost:3000`.
