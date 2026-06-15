// Fortify demo — INTENTIONALLY VULNERABLE app. Localhost only. Do not deploy.
// Each weakness is tagged `// VULN:` so the skill's audit has clear targets.
const express = require("express");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// VULN #5: hardcoded secret committed to source control.
const API_KEY = "sk_live_DEMO_1234567890_hardcoded_secret";

// In-memory SQLite seeded with a couple of users/records.
const db = new Database(":memory:");
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, pwd_hash TEXT, owner TEXT);
  CREATE TABLE notes (id INTEGER PRIMARY KEY, owner TEXT, body TEXT);
`);
// VULN #6: passwords stored as unsalted SHA1.
const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex");
db.prepare("INSERT INTO users (username, pwd_hash, owner) VALUES (?,?,?)").run("alice", sha1("password1"), "alice");
db.prepare("INSERT INTO users (username, pwd_hash, owner) VALUES (?,?,?)").run("bob", sha1("hunter2"), "bob");
db.prepare("INSERT INTO notes (owner, body) VALUES (?,?)").run("alice", "alice private note");
db.prepare("INSERT INTO notes (owner, body) VALUES (?,?)").run("bob", "bob private note");

// VULN #1: SQL injection — username concatenated directly into the query.
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const q = `SELECT * FROM users WHERE username = '${username}' AND pwd_hash = '${sha1(password)}'`;
  // VULN #9: no rate limiting on auth.
  const row = db.prepare(q).get();
  if (row) return res.json({ ok: true, user: row.username });
  return res.status(401).json({ ok: false });
});

// VULN #2: reflected XSS — user input echoed into HTML unescaped.
app.get("/search", (req, res) => {
  const term = req.query.q || "";
  res.send(`<h1>Results for ${term}</h1><div>nothing found</div>`);
});

// VULN #3: IDOR — returns any note by id with no ownership/auth check.
app.get("/notes/:id", (req, res) => {
  const note = db.prepare(`SELECT * FROM notes WHERE id = ${req.params.id}`).get();
  if (!note) return res.status(404).json({ error: "not found" });
  return res.json(note);
});

// VULN #4: admin route with no authentication or role check.
app.get("/admin/users", (req, res) => {
  const users = db.prepare("SELECT id, username, pwd_hash, owner FROM users").all();
  return res.json(users); // also over-exposes password hashes
});

// VULN #8: verbose error handler leaks stack traces.
app.use((err, req, res, next) => {
  res.status(500).send(`<pre>${err.stack}</pre>`);
});

// VULN #7: no security headers (no helmet/CSP/HSTS/etc.).
const PORT = process.env.PORT || 3000;
app.listen(PORT, "127.0.0.1", () => console.log(`vulnerable demo on http://localhost:${PORT}`));
