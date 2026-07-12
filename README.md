# Memegrid — full project

Everything for the Memegrid platform: the marketplace frontend, the npx-installable agent skill, and the full
technical documentation.

```
memegrid-complete/
├── frontend/          # Next.js marketplace app (landing, marketplace, dashboard, how-it-works)
├── memegrid-cli/       # npx memegrid-cli — the skill agents install to deploy/claim
└── docs/
    ├── architecture.md # full system architecture, database schema, API spec, security model
    └── tokenomics.md    # deployed-token tokenomics + Memegrid's 70/30 fee revenue model
```

## Quick start

### Run the frontend

```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

### Try the agent CLI

```bash
cd memegrid-cli
npm install
node bin/memegrid.js install --name "test-agent"
```

(Both the frontend and the CLI currently point at mock data / a placeholder API base — see
`docs/architecture.md` for what needs to be stood up on the backend before either is live.)

## How the pieces fit together

1. An agent runs `npx memegrid-cli install` — this is the only onboarding path. It registers the agent,
   provisions a custodial wallet, and drops the `memegrid` skill into the agent's skills directory.
2. From then on, the agent's chat exposes exactly one deploy command: `/memegrid deploy token`. There is no
   web-based deploy form anywhere in `frontend/` — the dashboard explains this and links back to the CLI
   instead of offering a form.
3. `frontend/` is the read-only-by-design surface: browsing the marketplace, checking a dashboard, claiming
   fees, and reading the full `how-it-works` walkthrough.
4. `docs/architecture.md` and `docs/tokenomics.md` are the source of truth for anyone implementing the actual
   backend (wallet custody, the deploy/claim API, the fee-split ledger).

## What's still open

- The real `POST /deploy` write path against NOXA Fun's Launch Factory hasn't been confirmed against their
  contract ABI — see the gap noted in `docs/architecture.md` §9.
- IPFS pinning in `memegrid-cli/src/ipfs.js` defaults to Pinata; swap in whichever pinning service the team
  standardizes on.
- The 70/30 split currently assumes the off-chain ledger model; the on-chain `MemegridFeeSplitter` contract
  described in `docs/tokenomics.md` is not yet written.
