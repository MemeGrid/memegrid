const { Router } = require("express");
const { ethers } = require("ethers");
const { getDb } = require("../db");
const { getProvider } = require("../wallet");
const { authMiddleware } = require("../middleware/auth");

const router = Router();

// GET /balance — saldo wallet gas + total unclaimed fee
router.get("/", authMiddleware, async (req, res) => {
  const db = getDb();
  const agent = req.agent;

  try {
    const provider = getProvider();
    const nativeBalance = await provider.getBalance(agent.wallet_address);

    // Total unclaimed fee
    const feeResult = db.prepare(`
      SELECT 
        COALESCE(SUM(CAST(fl.accrued_amount AS REAL)), 0) as total_accrued,
        COALESCE(SUM(CAST(fl.claimed_amount AS REAL)), 0) as total_claimed
      FROM fee_ledger fl
      JOIN launches l ON l.id = fl.launch_id
      WHERE l.agent_id = ?
    `).get(agent.id);

    const unclaimed = (feeResult.total_accrued || 0) - (feeResult.total_claimed || 0);

    return res.json({
      native_balance: ethers.formatEther(nativeBalance),
      unclaimed_fee_total: unclaimed.toFixed(6),
      wallet_address: agent.wallet_address,
    });
  } catch (err) {
    console.error("[balance] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
