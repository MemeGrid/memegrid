const crypto = require("crypto");
const { getDb } = require("../db");

function hashApiKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const key = header.slice(7).trim();
  if (!key) {
    return res.status(401).json({ error: "Empty API key" });
  }

  const hash = hashApiKey(key);
  const db = getDb();
  const agent = db.prepare("SELECT * FROM agents WHERE api_key_hash = ?").get(hash);

  if (!agent) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  if (agent.status !== "active") {
    return res.status(403).json({ error: "Agent suspended" });
  }

  req.agent = agent;
  req.apiKey = key;
  next();
}

module.exports = { authMiddleware, hashApiKey };
