// Fortify demo — HARDENED version. Each `// FIX:` corresponds to a `// VULN:`
// in ../src/server.js, showing the remediation applied by the skill.
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const argon2 = require("argon2");
const Database = require("better-sqlite3");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "100kb" })); // FIX #10-style: bound body size

// FIX #7: full security header set (CSP, HSTS, nosniff, frame-ancestors, ...).
app.use(helmet({
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'self'"] },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
}));

// FIX #5: secret comes from the environment / secret manager, never source.
const API_KEY = process.env.API_KEY;
if (!API_KEY) console.warn("API_KEY not set — configure via env/secret manager.");

const db = new Database(":memory:");
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, pwd_hash TEXT, role TEXT, owner TEXT);
  CREATE TABLE notes (id INTEGER PRIMARY KEY, owner TEXT, body TEXT);
`);

async function seed() {
  // FIX #6: passwords hashed with argon2id.
  const aliceHash = await argon2.hash("password1", { type: argon2.argon2id });
  const bobHash = await argon2.hash("hunter2", { type: argon2.argon2id });
  db.prepare("INSERT INTO users (username, pwd_hash, role, owner) VALUES (?,?,?,?)").run("alice", aliceHash, "admin", "alice");
  db.prepare("INSERT INTO users (username, pwd_hash, role, owner) VALUES (?,?,?,?)").run("bob", bobHash, "user", "bob");
  db.prepare("INSERT INTO notes (owner, body) VALUES (?,?)").run("alice", "alice private note");
  db.prepare("INSERT INTO notes (owner, body) VALUES (?,?)").run("bob", "bob private note");
}

// Minimal session/auth stub for the demo (real apps: signed tokens/sessions).
const sessions = new Map(); // token -> { username, role }
function authRequired(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const sess = sessions.get(token);
  if (!sess) return res.status(401).json({ error: "unauthorized" });
  req.user = sess;
  next();
}
function adminRequired(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "forbidden" });
  next();
}

// FIX #9: rate limit auth endpoints.
const loginLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true });

// FIX #1: parameterized query. FIX #6: verify with argon2. Generic error (no enumeration).
app.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  const row = db.prepare("SELECT * FROM users WHERE username = ?").get(String(username || ""));
  if (row && (await argon2.verify(row.pwd_hash, String(password || "")))) {
    const token = require("crypto").randomBytes(32).toString("hex"); // CSPRNG token
    sessions.set(token, { username: row.username, role: row.role });
    return res.json({ ok: true, token });
  }
  return res.status(401).json({ ok: false, error: "invalid credentials" });
});

// FIX #2: output encoding prevents reflected XSS.
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
app.get("/search", (req, res) => {
  const term = escapeHtml(req.query.q || "");
  res.set("Content-Type", "text/html").send(`<h1>Results for ${term}</h1><div>nothing found</div>`);
});

// FIX #3: ownership check + parameterized query (no IDOR).
app.get("/notes/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "bad id" });
  const note = db.prepare("SELECT * FROM notes WHERE id = ?").get(id);
  if (!note) return res.status(404).json({ error: "not found" });
  if (note.owner !== req.user.username) return res.status(403).json({ error: "forbidden" });
  return res.json(note);
});

// FIX #4: admin route requires auth + admin role; FIX: no over-exposure of hashes.
app.get("/admin/users", authRequired, adminRequired, (req, res) => {
  const users = db.prepare("SELECT id, username, role FROM users").all();
  return res.json(users);
});

// FIX #8: generic error handler — no stack traces leaked.
app.use((err, req, res, next) => {
  console.error(err); // logged server-side only
  res.status(500).json({ error: "internal server error" });
});

const PORT = process.env.PORT || 3000;
seed().then(() =>
  app.listen(PORT, "127.0.0.1", () => console.log(`hardened demo on http://localhost:${PORT}`))
);
