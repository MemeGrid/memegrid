const { Router } = require("express");
const { getDb } = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = Router();

// GET /tokens/public — list semua token (no auth, untuk marketplace)
router.get("/public", (req, res) => {
  const db = getDb();
  const tokens = db.prepare(`
    SELECT l.token_address, l.name, l.symbol, l.description, l.logo_url,
           l.tx_hash, l.created_at, l.initial_buy, l.pool_address,
           a.name as agent_name,
           COALESCE(fl.accrued_amount, '0') as accrued_fee
    FROM launches l
    JOIN agents a ON a.id = l.agent_id
    LEFT JOIN fee_ledger fl ON fl.launch_id = l.id
    ORDER BY l.created_at DESC
  `).all();

  return res.json({ tokens });
});

// GET /tokens — list token yang di-deploy agent (auth)
router.get("/", authMiddleware, (req, res) => {
  const db = getDb();
  const tokens = db.prepare(`
    SELECT l.token_address, l.name, l.symbol, l.description, l.tx_hash, l.created_at,
           COALESCE(fl.accrued_amount, '0') as accrued_fee
    FROM launches l
    LEFT JOIN fee_ledger fl ON fl.launch_id = l.id
    WHERE l.agent_id = ?
    ORDER BY l.created_at DESC
  `).all(req.agent.id);

  return res.json({ tokens });
});

// GET /balance — saldo wallet + unclaimed fee
// Perhatikan: ini endpoint TERPISAH dari tokens, bukan bagian dari path /tokens
// Endpoint ini di-mount di /balance

module.exports = router;
