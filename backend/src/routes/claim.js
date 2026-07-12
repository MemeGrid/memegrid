const { Router } = require("express");
const { v4: uuid } = require("uuid");
const { ethers } = require("ethers");
const { getDb } = require("../db");
const { getSigner, getProvider } = require("../wallet");
const { authMiddleware } = require("../middleware/auth");

const router = Router();

// POST /claim — klaim fee + split 70/30
router.post("/", authMiddleware, async (req, res) => {
  const { token_address } = req.body || {};
  const db = getDb();
  const agent = req.agent;

  try {
    let launches;
    if (token_address) {
      launches = db.prepare(
        "SELECT * FROM launches WHERE token_address = ? AND agent_id = ?"
      ).all(token_address, agent.id);
    } else {
      launches = db.prepare(
        "SELECT * FROM launches WHERE agent_id = ?"
      ).all(agent.id);
    }

    if (launches.length === 0) {
      return res.status(200).json({
        claims: [],
        message: "No fees available to claim right now.",
      });
    }

    const signer = getSigner(agent.wallet_key);
    const claims = [];

    for (const launch of launches) {
      const ledger = db.prepare(
        "SELECT * FROM fee_ledger WHERE launch_id = ?"
      ).get(launch.id);

      if (!ledger) continue;

      const accrued = ethers.parseEther(ledger.accrued_amount || "0");
      const claimed = ethers.parseEther(ledger.claimed_amount || "0");
      const available = accrued - claimed;

      if (available <= 0n) continue;

      // === CLAIM ON-CHAIN ===
      // MVP: Simulasi claim — di production, panggil fee router NOXA
      const gross = ethers.formatEther(available);
      const agentAmount = ethers.formatEther(available * 70n / 100n);
      const memegridAmount = ethers.formatEther(available * 30n / 100n);

      // Simpan claim record
      const claimId = uuid();
      db.prepare(`
        INSERT INTO claims (id, launch_id, agent_id, gross_amount, agent_amount, memegrid_amount, tx_hash, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(claimId, launch.id, agent.id, gross, agentAmount, memegridAmount, "simulated-mvp");

      // Update claimed amount di ledger
      db.prepare(`
        UPDATE fee_ledger SET claimed_amount = ?, updated_at = datetime('now') WHERE id = ?
      `).run(ledger.accrued_amount, ledger.id);

      claims.push({
        token_address: launch.token_address,
        gross_amount: `${gross} ETH`,
        agent_amount: `${agentAmount} ETH`,
        memegrid_amount: `${memegridAmount} ETH`,
        tx_hash: "simulated-mvp",
      });
    }

    return res.json({ claims });
  } catch (err) {
    console.error("[claim] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
