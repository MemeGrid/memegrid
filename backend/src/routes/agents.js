const { Router } = require("express");
const crypto = require("crypto");
const { v4: uuid } = require("uuid");
const { getDb } = require("../db");
const { generateWallet } = require("../wallet");
const { authMiddleware, hashApiKey } = require("../middleware/auth");

const router = Router();

// POST /agents/register — registrasi agent baru
router.post("/register", (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Agent name is required" });
    }

    const db = getDb();

    // Cek duplikasi nama
    const existing = db.prepare("SELECT id FROM agents WHERE name = ?").get(name.trim());
    if (existing) {
      return res.status(409).json({ error: "Agent name already registered" });
    }

    // Generate wallet
    const wallet = generateWallet();

    // Generate API key
    const apiKey = `mg_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = hashApiKey(apiKey);

    const agent = {
      id: uuid(),
      name: name.trim(),
      api_key_hash: keyHash,
      api_key_prefix: apiKey.slice(0, 12) + "...",
      wallet_address: wallet.address,
      wallet_key: wallet.privateKey,
      payout_address: null,
      status: "active",
    };

    db.prepare(`
      INSERT INTO agents (id, name, api_key_hash, api_key_prefix, wallet_address, wallet_key, payout_address, status)
      VALUES (@id, @name, @api_key_hash, @api_key_prefix, @wallet_address, @wallet_key, @payout_address, @status)
    `).run(agent);

    console.log(`[register] Agent "${name}" — wallet ${wallet.address}`);

    return res.status(201).json({
      api_key: apiKey,
      wallet_address: wallet.address,
      name: name.trim(),
    });
  } catch (err) {
    console.error("[register] error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /agents/lookup — public lookup by wallet address (no auth)
router.get("/lookup", (req, res) => {
  try {
    const { wallet } = req.query;
    if (!wallet || typeof wallet !== "string") {
      return res.status(400).json({ error: "wallet query param required" });
    }

    const db = getDb();
    const agent = db.prepare(
      "SELECT name, wallet_address, payout_address, status, created_at FROM agents WHERE LOWER(wallet_address) = LOWER(?)"
    ).get(wallet);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found for this wallet" });
    }

    // Hitung token yang udah dideploy
    const launches = db.prepare(
      "SELECT token_address, name, symbol, tx_hash, initial_buy, created_at FROM launches WHERE agent_id = (SELECT id FROM agents WHERE LOWER(wallet_address) = LOWER(?)) ORDER BY created_at DESC"
    ).all(wallet);

    // Hitung fee info
    const feeInfo = db.prepare(`
      SELECT SUM(CAST(accrued_amount AS REAL)) as total_accrued, SUM(CAST(claimed_amount AS REAL)) as total_claimed
      FROM fee_ledger
      WHERE launch_id IN (SELECT id FROM launches WHERE agent_id = (SELECT id FROM agents WHERE LOWER(wallet_address) = LOWER(?)))
    `).get(wallet);

    return res.json({
      name: agent.name,
      wallet_address: agent.wallet_address,
      payout_address: agent.payout_address,
      status: agent.status,
      registered_at: agent.created_at,
      tokens_deployed: launches.length,
      total_accrued: (feeInfo?.total_accrued || 0).toFixed(6),
      total_claimed: (feeInfo?.total_claimed || 0).toFixed(6),
      tokens: launches.map((l) => ({
        symbol: l.symbol,
        name: l.name,
        address: l.token_address,
        tx_hash: l.tx_hash,
        initial_buy: l.initial_buy,
        deployed_at: l.created_at,
      })),
    });
  } catch (err) {
    console.error("[lookup] error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Apply auth middleware to all routes below
router.use(authMiddleware);

// GET /agents/me — info agent (protected)
router.get("/me", (req, res) => {
  return res.json({
    name: req.agent.name,
    wallet_address: req.agent.wallet_address,
    payout_address: req.agent.payout_address,
    status: req.agent.status,
    created_at: req.agent.created_at,
  });
});

// PUT /agents/me/payout-address — set payout address (protected)
router.put("/me/payout-address", (req, res) => {
  try {
    const { address } = req.body;
    if (!address || typeof address !== "string" || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Valid Ethereum address required" });
    }

    const db = getDb();
    db.prepare("UPDATE agents SET payout_address = ? WHERE id = ?").run(
      address,
      req.agent.id
    );

    // Cooldown: effective after 24h for security
    const activeAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    console.log(`[payout] Agent "${req.agent.name}" → ${address} (active ${activeAt})`);

    return res.json({
      status: "pending",
      address,
      active_at: activeAt,
      message: "Claims settle to the existing wallet until the cooldown ends.",
    });
  } catch (err) {
    console.error("[payout] error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
