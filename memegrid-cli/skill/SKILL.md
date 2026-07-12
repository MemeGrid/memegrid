---
name: memegrid
description: Deploy a memecoin to the NOXA Fun launchpad (Robinhood Chain) and claim creator fees, without ever handling a private key or a smart contract directly. Trigger this skill whenever the user types a /memegrid command, or asks in plain language to create/deploy a token, launch a memecoin, check their deployed tokens, or claim creator fees.
compatibility: Requires the memegrid-cli to be installed first (npx memegrid-cli install), which provisions a custodial wallet and saves an API key to ~/.memegrid/config.json.
---

# Memegrid

This skill is the only supported way to deploy tokens through Memegrid. There is intentionally no web form for
deploying — every launch goes through this skill so an agent is always the one describing and authorizing the
token, not a browser tab.

## Command surface

In chat, the user (or the agent acting on the user's behalf) interacts with Memegrid through a single
namespace: `/memegrid <subcommand>`. The primary one is:

```
/memegrid deploy token
```

Treat this as the entrypoint for the entire deploy flow below. Other subcommands (`claim`, `status`,
`set-payout`) exist for managing what's already been deployed, but `deploy` is the one users will reach for
most.

## One-time setup

If `~/.memegrid/config.json` doesn't exist yet, run:

```bash
npx memegrid-cli install --name "<agent-name>"
```

This registers the agent, provisions a custodial wallet through Memegrid's KMS (the agent never sees a private
key), and saves an API key locally. Report the wallet address back to the user once this completes.

## Handling `/memegrid deploy token`

When the user runs this command, collect the following before calling the CLI — ask for anything missing,
don't guess silently:

1. **Name** — max 60 characters. If the user gave a theme instead of an exact name, generate something catchy
   that fits the theme.
2. **Symbol** — max 20 characters, will be upper-cased automatically.
3. **Description** — optional, max 256 characters.
4. **Socials** — Twitter, Telegram, website. All optional; skip any the user doesn't provide.
5. **Logo** — a local file path or a file the user has shared. This is required by NOXA Fun before a token can
   launch. Formats: PNG, JPEG, WebP, GIF. Square, minimum 250×250px. **Hard limit: 3MB** — if the file is
   larger, tell the user to compress or resize it before continuing; do not attempt to deploy without a valid
   logo.
6. **Initial buy** (optional) — an ETH amount if the user wants to buy their own token at launch.

Once you have at least name, symbol, and a logo path, run:

```bash
npx memegrid-cli deploy \
  --name "<name>" \
  --symbol "<symbol>" \
  --description "<description>" \
  --logo-path "<local path to logo file>" \
  --twitter "<url>" --telegram "<url>" --website "<url>" \
  --initial-buy "<eth amount>"
```

The CLI validates the logo file size and format locally, uploads it to IPFS automatically (pinned, not
Memegrid-hosted), and only then sends the deploy request to Memegrid's API, which builds and signs the launch
transaction. Report back to the user: token address, marketplace link, and transaction hash. Also mention the
anti-snipe window (~1 hour, wallet cap 2% of supply) so they know why full trading takes a moment to open up.

## Handling `/memegrid claim`

```bash
npx memegrid-cli claim --token <address>   # omit --token to claim every token's fees
```

Report the full breakdown to the user exactly as returned — gross amount, the 70% agent share, the 30%
Memegrid share, and the transaction hash. Never round in the agent's favor or omit the Memegrid share.

## Handling `/memegrid status`

```bash
npx memegrid-cli status              # list deployed tokens + accrued fees
npx memegrid-cli status --balance    # wallet balance (gas + unclaimed fees)
```

## Handling `/memegrid set-payout`

```bash
npx memegrid-cli set-payout --address <external_wallet_address>
```

Tell the user there's a 24-48 hour cooldown before a newly set address becomes active, and that this is a
security measure, not a bug.

## Boundaries to enforce

- Never fabricate a token address, transaction hash, or IPFS CID — only report what the CLI actually returns.
- Never attempt to deploy without a valid logo file under 3MB.
- Never suggest depositing funds into any wallet other than the one this skill provisioned.
- If the CLI errors, relay the error message to the user rather than retrying silently in a loop.
