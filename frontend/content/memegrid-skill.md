---
name: memegrid
description: Deploy a memecoin to the NOXA Fun launchpad on Robinhood Chain and claim creator fees, without ever handling a private key directly. Use this skill when the user asks to deploy or launch a token/memecoin, check tokens they've deployed, check wallet or fee balance, or claim creator fees. The command surface is /memegrid <install|deploy|claim|status|set-payout>. There is no web form for deploying — this skill is the only way in.
version: 0.1.0
metadata:
  openclaw:
    requires:
      bins:
        - node
    primaryEnv: MEMEGRID_API_KEY
    envVars:
      - name: MEMEGRID_API_KEY
        required: false
        description: Written automatically by "/memegrid install". Only set by hand when migrating to a new host.
      - name: PINATA_JWT
        required: true
        description: JWT from pinata.cloud, used to pin token logos to IPFS before a deploy.
      - name: MEMEGRID_API_BASE
        required: false
        description: Overrides the default Memegrid API base URL (https://api.memegrid.xyz/v1).
    emoji: "🧩"
    homepage: https://memegrid.xyz
---

# Memegrid

This is a self-extracting skill: it's a single file so it can be pasted straight into chat and installed with
no GitHub repo and no separate CLI tool. The first time any `/memegrid` command runs, materialize the helper
files below under `~/.memegrid/lib/` **only if they don't already exist**, then run commands against them.
After the first run they're already on disk — don't rewrite them on every call.

## One-time setup: write these files if missing

Check whether `~/.memegrid/lib/api.mjs` exists. If it does not, create the following files with exactly this
content before doing anything else:

**`~/.memegrid/lib/config.mjs`**
```js
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONFIG_DIR = path.join(os.homedir(), ".memegrid");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function readConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")); } catch { return null; }
}

export function writeConfig(data) {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

export function requireConfig() {
  const cfg = readConfig();
  if (!cfg || !cfg.apiKey) {
    console.error('Not registered yet. Run "/memegrid install" first.');
    process.exit(1);
  }
  return cfg;
}
```

**`~/.memegrid/lib/ipfs.mjs`**
```js
import fs from "node:fs";
import path from "node:path";

const MAX_BYTES = 3 * 1024 * 1024;
const MIME_BY_EXT = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };

export function validateLogoFile(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Logo file not found: ${filePath}`);
  const ext = path.extname(filePath).toLowerCase();
  if (!MIME_BY_EXT[ext]) throw new Error(`Unsupported logo format "${ext}". Allowed: png, jpg, jpeg, webp, gif`);
  const { size } = fs.statSync(filePath);
  if (size > MAX_BYTES) throw new Error(`Logo file is ${(size / 1024 / 1024).toFixed(2)}MB, exceeds the 3MB limit.`);
  return { mime: MIME_BY_EXT[ext] };
}

export async function uploadLogoToIPFS(filePath) {
  const { mime } = validateLogoFile(filePath);
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT is not set. Get a JWT from pinata.cloud first.");

  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: mime });
  const form = new FormData();
  form.append("file", blob, path.basename(filePath));
  form.append("pinataMetadata", JSON.stringify({ name: `memegrid-logo-${path.basename(filePath)}` }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST", headers: { Authorization: `Bearer ${jwt}` }, body: form,
  });
  if (!res.ok) throw new Error(`IPFS upload failed (${res.status}): ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return { cid: data.IpfsHash, ipfsUri: `ipfs://${data.IpfsHash}`, gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}` };
}
```

**`~/.memegrid/lib/api.mjs`**
```js
const API_BASE = process.env.MEMEGRID_API_BASE || "https://api.memegrid.xyz/v1";

async function request(pathName, { method = "GET", apiKey, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(`${API_BASE}${pathName}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`Memegrid API error (${res.status}): ${data.message || data.error || res.statusText}`);
  return data;
}

export const register = (name) => request("/agents/register", { method: "POST", body: { name } });
export const deploy = (apiKey, payload) => request("/deploy", { method: "POST", apiKey, body: payload });
export const claim = (apiKey, tokenAddress) => request("/claim", { method: "POST", apiKey, body: tokenAddress ? { token_address: tokenAddress } : {} });
export const tokens = (apiKey) => request("/tokens", { apiKey });
export const balance = (apiKey) => request("/balance", { apiKey });
export const setPayoutAddress = (apiKey, address) => request("/agents/me/payout-address", { method: "PUT", apiKey, body: { address } });
```

Once those three files exist, every `/memegrid` command below is a short inline script run with `node --input-type=module -e "..."` (or written to a throwaway temp file first if the runtime prefers that) that imports from `~/.memegrid/lib/`.

## `/memegrid install`

Ask the user for an agent name if they haven't given one. Run:

```js
import { readConfig, writeConfig } from "os.homedir() + '/.memegrid/lib/config.mjs'"; // resolve the real path at runtime
import * as api from "<home>/.memegrid/lib/api.mjs";

const name = "<agent name>";
const existing = readConfig();
if (existing?.apiKey) {
  console.log(`Already registered as "${existing.name}" — wallet ${existing.walletAddress}`);
} else {
  const result = await api.register(name);
  writeConfig({ name, apiKey: result.api_key, walletAddress: result.wallet_address });
  console.log("Wallet address:", result.wallet_address);
}
```

Report the wallet address back to the user. Do not run `deploy`, `claim`, or `status` before this succeeds.

## `/memegrid deploy token`

Collect from the user before running anything — ask for anything missing, never invent values:

1. **Name** — max 60 characters.
2. **Symbol** — max 20 characters (upper-case it yourself).
3. **Description** — optional, max 256 characters.
4. **Socials** — Twitter, Telegram, website — all optional.
5. **Logo** — local file path. Required. PNG/JPEG/WebP/GIF, square, min 250×250px, **hard limit 3MB**. If the
   file is too big, tell the user to compress it — do not deploy without a valid logo.
6. **Initial buy** — optional ETH amount.

Then run:

```js
import { requireConfig } from "<home>/.memegrid/lib/config.mjs";
import { uploadLogoToIPFS } from "<home>/.memegrid/lib/ipfs.mjs";
import * as api from "<home>/.memegrid/lib/api.mjs";

const cfg = requireConfig();
const logo = await uploadLogoToIPFS("<local logo path>");
console.log("Logo pinned:", logo.cid);

const result = await api.deploy(cfg.apiKey, {
  name: "<name>", symbol: "<SYMBOL>", description: "<description>",
  logo_url: logo.gatewayUrl, initial_buy: "<eth amount or 0>",
  socials: { twitter: "<url>", telegram: "<url>", website: "<url>" },
});
console.log("Token:", result.token_address, "| Marketplace:", result.marketplace_url, "| Tx:", result.tx_hash);
```

Report token address, marketplace link, tx hash, and mention the ~1 hour anti-snipe window (wallet cap 2% of
supply).

## `/memegrid claim`

```js
import { requireConfig } from "<home>/.memegrid/lib/config.mjs";
import * as api from "<home>/.memegrid/lib/api.mjs";

const cfg = requireConfig();
const { claims } = await api.claim(cfg.apiKey, "<token address or omit>");
for (const c of claims || []) {
  console.log(c.token_address, "gross:", c.gross_amount, "agent(70%):", c.agent_amount, "memegrid(30%):", c.memegrid_amount, "tx:", c.tx_hash);
}
```

Report the full breakdown exactly as returned — never round in the agent's favor or omit the Memegrid share.

## `/memegrid status`

```js
import { requireConfig } from "<home>/.memegrid/lib/config.mjs";
import * as api from "<home>/.memegrid/lib/api.mjs";

const cfg = requireConfig();
console.log(await api.tokens(cfg.apiKey));       // token list + accrued fees
console.log(await api.balance(cfg.apiKey));       // gas + unclaimed fee total
```

## `/memegrid set-payout`

```js
import { requireConfig } from "<home>/.memegrid/lib/config.mjs";
import * as api from "<home>/.memegrid/lib/api.mjs";

const cfg = requireConfig();
console.log(await api.setPayoutAddress(cfg.apiKey, "<external wallet address>"));
```

Tell the user about the 24-48 hour cooldown before the new address goes active.

## Boundaries to enforce

- Never fabricate a token address, transaction hash, or IPFS CID — only report what the scripts actually return.
- Never deploy without a valid logo file under 3MB.
- Never suggest sending funds to any wallet other than the one this skill provisioned.
- If a script errors, relay the error message rather than retrying silently in a loop.
- Deploying is agent-only by design — never point the user to a web form, because none exists.
