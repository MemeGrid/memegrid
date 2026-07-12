const { Router } = require("express");
const { v4: uuid } = require("uuid");
const { ethers } = require("ethers");
const { getDb } = require("../db");
const {
  getProvider,
  getSigner,
  generateSalt,
  FACTORY_ADDRESS,
} = require("../wallet");
const { authMiddleware } = require("../middleware/auth");

const router = Router();

// POST /deploy — launch token via MemegridFactory (own launchpad)
router.post("/", authMiddleware, async (req, res) => {
  const { name, symbol, description, logo_url, initial_buy } = req.body || {};

  // === VALIDASI ===
  if (!name || typeof name !== "string" || name.trim().length > 40) {
    return res.status(400).json({ error: "Token name required, max 40 chars" });
  }
  if (!symbol || typeof symbol !== "string" || symbol.trim().length > 10) {
    return res.status(400).json({ error: "Token symbol required, max 10 chars" });
  }
  if (description && description.length > 256) {
    return res.status(400).json({ error: "Description max 256 chars" });
  }

  const db = getDb();
  const agent = req.agent;

  try {
    const provider = getProvider();
    const balance = await provider.getBalance(agent.wallet_address);

    const launchFee = ethers.parseEther("0.0005");
    const effectiveInitialBuy = initial_buy || "0.0001";
    const initialBuyWei = ethers.parseEther(effectiveInitialBuy);
    const gasReserve = ethers.parseEther("0.001");  // buffer for gas
    const totalValue = launchFee + initialBuyWei;
    const minRequired = totalValue + gasReserve;

    if (balance < minRequired) {
      return res.status(400).json({
        error: "Insufficient balance for deploy",
        wallet_address: agent.wallet_address,
        balance_eth: ethers.formatEther(balance),
        launch_fee_eth: ethers.formatEther(launchFee),
        initial_buy_eth: effectiveInitialBuy,
        gas_reserve_eth: ethers.formatEther(gasReserve),
        required_total_eth: ethers.formatEther(minRequired),
      });
    }

    console.log(
      `[deploy] ${agent.name} → \"${name}\" (${symbol}) | value=${ethers.formatEther(totalValue)} ETH`
    );

    // === ON-CHAIN: Call MemegridFactory.launchToken ===
    const signer = getSigner(agent.wallet_key);
    const factory = new ethers.Contract(
      FACTORY_ADDRESS,
      [
        "function launchToken(tuple(string name, string symbol, address devWallet, address agent) params, uint256 initialBuyAmount, bytes32 salt) payable returns (address token, uint256 positionId)",
        "event TokenLaunched(address indexed token, address indexed deployer, address indexed agent, address pool, uint256 positionId, uint256 initialLiquidity, uint256 totalSupply)",
      ],
      signer
    );

    const salt = generateSalt();
    const params = {
      name: name.trim(),
      symbol: symbol.trim(),
      devWallet: agent.payout_address || agent.wallet_address,
      agent: agent.wallet_address,
    };

    let tx;
    try {
      tx = await factory.launchToken(params, initialBuyWei, salt, {
        value: totalValue,
        gasLimit: 5000000,  // via_ir contracts need more gas
      });
      console.log(`[deploy] TX: ${tx.hash}`);
    } catch (contractErr) {
      const msg = contractErr.reason || contractErr.message || String(contractErr);
      console.error(`[deploy] Contract call failed:`, msg.slice(0, 400));
      return res.status(500).json({
        error: "MemegridFactory contract call failed",
        details: msg.slice(0, 300),
        factory: FACTORY_ADDRESS,
      });
    }

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`[deploy] Confirmed block ${receipt.blockNumber} | gas used: ${receipt.gasUsed}`);

    // Extract TokenLaunched event
    let tokenAddress = "";
    let pool = "";
    let positionId = "0";
    let initialLiquidity = "0";
    let totalSupply = "0";

    const iface = new ethers.Interface([
      "event TokenLaunched(address indexed token, address indexed deployer, address indexed agent, address pool, uint256 positionId, uint256 initialLiquidity, uint256 totalSupply)",
    ]);

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === "TokenLaunched") {
          tokenAddress = parsed.args.token;
          pool = parsed.args.pool;
          positionId = parsed.args.positionId.toString();
          initialLiquidity = ethers.formatEther(parsed.args.initialLiquidity);
          totalSupply = ethers.formatEther(parsed.args.totalSupply);
          console.log(`[deploy] ✅ Token: ${tokenAddress} | Pool: ${pool} | Liq: ${initialLiquidity} ETH`);
          break;
        }
      } catch (_) { /* not our event */ }
    }

    if (!tokenAddress) {
      console.error("[deploy] TokenLaunched event NOT FOUND in receipt logs!");
      return res.status(500).json({
        error: "Token deployed but could not extract address from logs",
        tx_hash: tx.hash,
        log_count: receipt.logs.length,
      });
    }

    // === SIMPAN DB ===
    const launchId = uuid();
    db.prepare(`
      INSERT INTO launches (id, agent_id, chain_id, token_address, name, symbol, description, logo_url, tx_hash, initial_buy, config_id, dex_id, pool_address, pair_token)
      VALUES (?, ?, 4663, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(
      launchId, agent.id, tokenAddress, params.name, params.symbol,
      (description || "").trim(), logo_url || "", tx.hash, effectiveInitialBuy,
      pool, "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73" // WETH
    );

    // Init fee ledger (80/20 split via collectFees)
    db.prepare(`INSERT INTO fee_ledger (id, launch_id, accrued_amount) VALUES (?, ?, '0')`).run(uuid(), launchId);

    console.log(`[deploy] 💾 Saved: ${tokenAddress} (${symbol})`);

    return res.status(201).json({
      token_address: tokenAddress,
      tx_hash: tx.hash,
      pool_address: pool,
      position_id: positionId,
      pair_token: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
      launch_fee_eth: ethers.formatEther(launchFee),
      initial_liquidity_eth: initialLiquidity,
      total_supply: totalSupply,
      memegrid_url: `https://memegrid.site/token?address=${tokenAddress}`,
      explorer_url: `https://robinhoodchain.blockscout.com/token/${tokenAddress}`,
    });

  } catch (err) {
    console.error("[deploy] Unexpected:", err.message);
    return res.status(500).json({
      error: "Deploy failed",
      details: err.message?.slice(0, 300),
    });
  }
});

// POST /deploy/import — import token yang di-deploy manual
router.post("/import", authMiddleware, async (req, res) => {
  const { token_address, name, symbol, description, logo_url, tx_hash, pool_address, pair_token, initial_buy, chain_id } = req.body || {};

  if (!token_address || !ethers.isAddress(token_address)) {
    return res.status(400).json({ error: "Valid token_address required" });
  }
  if (!name || typeof name !== "string" || name.trim().length > 40) {
    return res.status(400).json({ error: "Token name required, max 40 chars" });
  }
  if (!symbol || typeof symbol !== "string" || symbol.trim().length > 10) {
    return res.status(400).json({ error: "Token symbol required, max 10 chars" });
  }

  const db = getDb();
  const agent = req.agent;

  try {
    const existing = db.prepare("SELECT id FROM launches WHERE LOWER(token_address) = LOWER(?)").get(token_address);
    if (existing) {
      return res.status(409).json({ error: "Token already registered", launch_id: existing.id, token_address });
    }

    const launchId = uuid();
    db.prepare(`
      INSERT INTO launches (id, agent_id, chain_id, token_address, name, symbol, description, logo_url, tx_hash, initial_buy, config_id, dex_id, pool_address, pair_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      launchId, agent.id, chain_id || 4663, token_address.toLowerCase(), name.trim(), symbol.trim(),
      (description || "").trim(), logo_url || "", tx_hash || "", initial_buy || "0",
      -1, -1, pool_address || "", pair_token || ""
    );

    db.prepare(`INSERT INTO fee_ledger (id, launch_id, accrued_amount) VALUES (?, ?, '0')`).run(uuid(), launchId);

    console.log(`[import] ${agent.name} imported ${token_address} (${symbol})`);

    return res.status(201).json({
      launch_id: launchId,
      token_address: token_address.toLowerCase(),
      name: name.trim(),
      symbol: symbol.trim(),
      imported: true,
      explorer_url: `https://robinhoodchain.blockscout.com/token/${token_address}`,
      memegrid_url: `https://memegrid.site/token?address=${token_address}`,
    });
  } catch (err) {
    console.error("[import] Error:", err.message);
    return res.status(500).json({ error: "Import failed", details: err.message?.slice(0, 300) });
  }
});

module.exports = router;
