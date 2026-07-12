const express = require("express");
const cors = require("cors");
const { getDb } = require("./db");
const { authMiddleware } = require("./middleware/auth");

const agentsRouter = require("./routes/agents");
const deployRouter = require("./routes/deploy");
const claimRouter = require("./routes/claim");
const tokensRouter = require("./routes/tokens");
const balanceRouter = require("./routes/balance");

const PORT = process.env.PORT || 3099;
const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Health check
app.get("/", (req, res) => {
  const db = getDb();
  const agentCount = db.prepare("SELECT COUNT(*) as count FROM agents").get().count;
  const launchCount = db.prepare("SELECT COUNT(*) as count FROM launches").get().count;

  res.json({
    name: "Memegrid API",
    version: "1.0.0-mvp",
    chain: "Robinhood (4663)",
    stats: {
      agents: agentCount,
      launches: launchCount,
    },
    endpoints: [
      "POST /v1/agents/register",
      "GET  /v1/agents/me",
      "PUT  /v1/agents/me/payout-address",
      "POST /v1/deploy",
      "POST /v1/claim",
      "GET  /v1/tokens",
      "GET  /v1/balance",
    ],
  });
});

// API v1 routes
app.use("/v1/agents", agentsRouter);
app.use("/v1/deploy", deployRouter);
app.use("/v1/claim", claimRouter);
app.use("/v1/tokens", tokensRouter);
app.use("/v1/balance", balanceRouter);

// Initialize DB on startup
getDb();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[memegrid] API running on port ${PORT}`);
  console.log(`[memegrid] Robinhood Chain — Factory: 0xD9eC2db5f3D1b236843925949fe5bd8a3836FCcB`);
});
