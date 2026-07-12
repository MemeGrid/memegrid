const { Command } = require("commander");
const { readConfig, writeConfig, requireConfig } = require("./config");
const { installSkill } = require("./skillInstaller");
const { validateLogoFile, uploadLogoToIPFS } = require("./ipfs");
const api = require("./api");

function run(argv) {
  const program = new Command();
  program
    .name("memegrid-cli")
    .description("Install the memegrid skill and deploy memecoins to NOXA Fun from an AI agent.");

  program
    .command("install")
    .description("Register this agent, provision a wallet, and install the memegrid skill")
    .option("--name <name>", "Agent name shown in Memegrid", "unnamed-agent")
    .option("--target <dir>", "Where to install the skill (auto-detected by default)")
    .action(async (opts) => {
      try {
        const existing = readConfig();
        if (existing && existing.apiKey) {
          console.log("Already registered as", existing.name, "-", existing.walletAddress);
        } else {
          console.log(`Registering agent "${opts.name}" with Memegrid...`);
          const result = await api.register(opts.name);
          writeConfig({
            name: opts.name,
            apiKey: result.api_key,
            walletAddress: result.wallet_address,
          });
          console.log("Registered. Wallet address:", result.wallet_address);
          console.log("API key saved to ~/.memegrid/config.json (not printed here for safety).");
        }

        const target = installSkill(opts.target);
        console.log("Skill installed to:", target);
        console.log("\nIn your agent's chat, the only deploy command is:");
        console.log("  /memegrid deploy token");
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program
    .command("deploy")
    .description("Deploy a new token to NOXA Fun (name/symbol/description/socials/logo)")
    .requiredOption("--name <name>", "Token name, max 60 characters")
    .requiredOption("--symbol <symbol>", "Token symbol, max 20 characters")
    .option("--description <text>", "Short description, max 256 characters", "")
    .option("--logo-path <path>", "Local path to a square logo file, PNG/JPEG/WebP/GIF, max 3MB")
    .option("--twitter <url>", "", "")
    .option("--telegram <url>", "", "")
    .option("--website <url>", "", "")
    .option("--initial-buy <eth>", "ETH amount to buy on launch", "0")
    .action(async (opts) => {
      try {
        const cfg = requireConfig();

        if (opts.name.length > 60) throw new Error("Token name exceeds 60 characters.");
        if (opts.symbol.length > 20) throw new Error("Token symbol exceeds 20 characters.");
        if (opts.description && opts.description.length > 256) {
          throw new Error("Description exceeds 256 characters.");
        }

        let logoUrl = "";
        if (opts.logoPath) {
          validateLogoFile(opts.logoPath); // throws if > 3MB or unsupported format
          console.log("Uploading logo to IPFS...");
          const { ipfsUri, gatewayUrl, cid } = await uploadLogoToIPFS(opts.logoPath);
          console.log("Logo pinned:", cid);
          logoUrl = gatewayUrl;
          console.log("IPFS URI:", ipfsUri);
        } else {
          console.warn("No --logo-path given. NOXA Fun requires a logo before launch.");
        }

        console.log("Deploying to NOXA Fun (Robinhood Chain)...");
        const result = await api.deploy(cfg.apiKey, {
          name: opts.name,
          symbol: opts.symbol,
          description: opts.description,
          logo_url: logoUrl,
          initial_buy: opts.initialBuy,
          socials: {
            twitter: opts.twitter,
            telegram: opts.telegram,
            website: opts.website,
          },
        });

        console.log("\nDeployed.");
        console.log("Token address:", result.token_address);
        console.log("Marketplace:", result.marketplace_url);
        console.log("Tx hash:", result.tx_hash);
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program
    .command("claim")
    .description("Claim creator fees (70% agent / 30% memegrid split)")
    .option("--token <address>", "Claim a specific token; omit to claim all")
    .action(async (opts) => {
      try {
        const cfg = requireConfig();
        const result = await api.claim(cfg.apiKey, opts.token);
        const claims = result.claims || [];
        if (claims.length === 0) {
          console.log("No fees available to claim right now.");
          return;
        }
        for (const c of claims) {
          console.log(`\nToken ${c.token_address}`);
          console.log(`  Gross fee     : ${c.gross_amount}`);
          console.log(`  Agent (70%)   : ${c.agent_amount}`);
          console.log(`  Memegrid (30%): ${c.memegrid_amount}`);
          console.log(`  Tx hash       : ${c.tx_hash}`);
        }
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program
    .command("status")
    .description("List deployed tokens and accrued fees, or check wallet balance")
    .option("--balance", "Show wallet balance instead of the token list")
    .action(async (opts) => {
      try {
        const cfg = requireConfig();
        if (opts.balance) {
          const b = await api.balance(cfg.apiKey);
          console.log("Native balance (gas):", b.native_balance);
          console.log("Unclaimed fee total :", b.unclaimed_fee_total);
        } else {
          const result = await api.tokens(cfg.apiKey);
          const list = result.tokens || result || [];
          if (list.length === 0) {
            console.log("No tokens deployed yet.");
            return;
          }
          for (const t of list) {
            console.log(`${t.name} (${t.symbol}) - ${t.token_address} - accrued: ${t.accrued_fee || "0"}`);
          }
        }
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program
    .command("set-payout")
    .description("Set the external address that receives claimed fees (cooldown applies)")
    .requiredOption("--address <address>", "External wallet address")
    .action(async (opts) => {
      try {
        const cfg = requireConfig();
        const result = await api.setPayoutAddress(cfg.apiKey, opts.address);
        console.log("Status:", result.status);
        console.log("Active at:", result.active_at);
        console.log("Claims settle to the existing wallet until the cooldown ends.");
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program.parse(argv);
}

module.exports = { run };
