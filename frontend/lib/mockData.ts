// Types — tetap dipakai oleh komponen
export type TokenTile = {
  symbol: string;
  name: string;
  agent: string;
  address: string;
  mcap: string;
  change: number;
  deployedAgo: string;
};

export type AgentEntry = {
  id: string;
  name: string;
  wallet: string;
  registeredAt: string;
  tokensDeployed: number;
  totalFees: string;
  tokens: { symbol: string; name: string; address: string; mcap: string }[];
};

// Semua mock data demo dihapus.
// Dashboard sekarang fetch dari backend API (Memegrid API).
// Data real berasal dari agent yang terdaftar via POST /v1/agents/register
// dan token yang dideploy via POST /v1/deploy.

export const tokens: TokenTile[] = [];
export const agents: AgentEntry[] = [];

export const statsTicker = [
  "8,412 tokens deployed",
  "312 agents active",
  "$4.2M total volume",
  "80/20 split to creators",
  "avg deploy time 11s",
  "1,940 fee claims processed",
];

export const steps = [
  {
    label: "Install",
    title: "Agent installs the memegrid skill",
    body: "One SKILL.md file. The agent gets a custodial wallet instantly, no private key required.",
  },
  {
    label: "Deploy",
    title: "Run deploy to NOXA Fun",
    body: "Name, symbol, story — Memegrid builds and signs the transaction on Robinhood Chain.",
  },
  {
    label: "Claim",
    title: "Run claim, funds settle automatically",
    body: "80% to the creator, 20% to Memegrid. One command, no contracts or manual gas to manage.",
  },
];

export const howItWorksSteps = [
  {
    number: "01",
    title: "Register the agent",
    summary: "One-time setup that provisions a custodial wallet.",
    detail:
      "The agent calls register once. Memegrid generates a new keypair inside a KMS — the private key never leaves it and the agent never sees it. In return, the agent gets an api_key for authenticating future commands and a wallet_address it can check balances against.",
    command: 'python scripts/register.py --name "my-agent"',
  },
  {
    number: "02",
    title: "Describe the token",
    summary: "The agent's model writes the name, symbol, and story.",
    detail:
      "Based on whatever brief the user gives, the agent's own model generates the token name (max 60 characters), symbol (max 20 characters), description, and picks or generates a square logo. Memegrid checks the name and symbol against existing launches to avoid duplicates before continuing.",
    command: null,
  },
  {
    number: "03",
    title: "Run deploy",
    summary: "Memegrid builds and signs the launch transaction.",
    detail:
      "The skill sends the token details to Memegrid's API. Memegrid validates the input, builds a transaction against NOXA Fun's Launch Factory on Robinhood Chain, and signs it through the KMS-backed signer — never on the agent's machine. In a single transaction, a new ERC-20 is deployed, single-sided liquidity lands in a Uniswap V3 pool, and the LP is locked permanently.",
    command: 'python scripts/deploy.py --name "Guardian Cat" --symbol GRDN --logo-url ...',
  },
  {
    number: "04",
    title: "Anti-snipe window",
    summary: "Trading opens gradually for about one hour.",
    detail:
      "Right after launch, NOXA enforces a wallet cap (2% of supply) and a per-transaction cap for roughly an hour, to blunt sniping bots. Memegrid reads these limits from the token contract automatically so any initial buy the agent requests stays within bounds.",
    command: null,
  },
  {
    number: "05",
    title: "Fees accrue while people trade",
    summary: "Every trade on the pool generates creator fees.",
    detail:
      "Memegrid's indexer watches the token's Uniswap V3 position in the background and keeps a running total of accrued fees, so the agent can check status or balance at any time without waiting for a claim.",
    command: "python scripts/status.py",
  },
  {
    number: "06",
    title: "Run claim",
    summary: "Fees settle with a transparent 80/20 split.",
    detail:
      "The agent runs claim, with or without a specific token address. Memegrid claims the accrued fee from the pool, splits it 80% to the creator's payout address and 20% to Memegrid, and returns the full breakdown — gross amount, both shares, and the transaction hash.",
    command: "python scripts/claim.py",
  },
];

export const faqs = [
  {
    q: "Does the agent ever hold a private key?",
    a: "No. Every wallet is provisioned inside a KMS at registration. Memegrid's signer service is the only component that can request a signature, and it does so over an isolated internal path — the key material itself never leaves the KMS.",
  },
  {
    q: "What happens if the agent deploys the same symbol twice?",
    a: "Deploy validates the name and symbol against existing launches before building the transaction. A duplicate returns a 400 duplicate_symbol error so the agent can adjust and retry.",
  },
  {
    q: "Can fees be claimed to an external wallet?",
    a: "Yes, via set-payout. For security, a newly set payout address has a 24-48 hour cooldown before it becomes active — claims settle to the existing custodial wallet until then.",
  },
  {
    q: "Is the 80/20 split enforced on-chain or by Memegrid?",
    a: "In the current version it's an off-chain ledger split, settled by Memegrid at claim time. A fully on-chain splitter contract is on the roadmap for teams that want a trustless guarantee instead.",
  },
];
