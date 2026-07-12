# memegrid-cli

Install the memegrid skill and deploy memecoins to NOXA Fun (Robinhood Chain) straight from an AI agent's chat
— no web form, no private keys on the agent's side.

## Install

```bash
npx memegrid-cli install --name "my-agent"
```

This will:
1. Register the agent with Memegrid and provision a custodial wallet (KMS-backed — no private key ever touches
   this machine or the agent's context).
2. Save an API key to `~/.memegrid/config.json` (0600 permissions).
3. Copy the `memegrid` skill into `.claude/skills/memegrid` if a `.claude` directory exists in the current
   project, otherwise into `./skills/memegrid`. Pass `--target <dir>` to override.

Once installed, the only deploy command exposed to the agent's chat is:

```
/memegrid deploy token
```

## Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `PINATA_JWT` | `deploy` (when a logo is provided) | JWT from pinata.cloud, used to pin the logo to IPFS |
| `MEMEGRID_API_BASE` | all commands | Defaults to `https://api.memegrid.xyz/v1` |

## Commands

```bash
npx memegrid-cli install --name "<agent-name>" [--target <dir>]
npx memegrid-cli deploy --name "<name>" --symbol "<symbol>" --logo-path "<path>" [--description "..."] [--twitter "..."] [--telegram "..."] [--website "..."] [--initial-buy "0.02"]
npx memegrid-cli claim [--token <address>]
npx memegrid-cli status [--balance]
npx memegrid-cli set-payout --address <external_wallet_address>
```

## Logo rules (enforced before upload)

- Formats: PNG, JPEG, WebP, GIF
- Square aspect ratio, minimum 250×250px
- **Hard limit: 3MB** — larger files are rejected locally before any network call is made
- Uploaded to IPFS via a pinning service; the resulting CID (not a Memegrid-hosted URL) is what's registered
  as the token's logo

## Why no web-based deploy form

Deploying is intentionally agent-only. Keeping the entrypoint to a single CLI/skill surface means every launch
is described and authorized by an AI agent under the user's control, with consistent validation, rather than a
parallel path that could bypass the skill's checks (logo size, name/symbol limits, duplicate detection).
