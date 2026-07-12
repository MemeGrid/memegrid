const { ethers } = require("ethers");

// Robinhood Chain RPC
const RPC_URL = process.env.ROBINHOOD_RPC || "https://rpc.mainnet.chain.robinhood.com";

function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  };
}

function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL, 4663);
}

function getSigner(privateKey) {
  return new ethers.Wallet(privateKey, getProvider());
}

// ========== MEMEGRID LAUNCHPAD — Robinhood Chain ==========
const FACTORY_ADDRESS = "0x4E21417BaA662A145854D9698dF3AF0352A68Ba9";
const POSITION_MANAGER = "0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3";
const UNISWAP_V3_FACTORY = "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA";
const SWAP_ROUTER = "0xCaf681a66D020601342297493863E78C959E5cb2";
const WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";

// MemegridFactory ABI (compiled from MemegridFactory.sol)
const FACTORY_ABI = [
  // ── launchToken ──
  {
    type: "function",
    name: "launchToken",
    inputs: [
      {
        name: "params",
        type: "tuple",
        internalType: "struct LaunchParams",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "devWallet", type: "address" },
          { name: "agent", type: "address" },
        ],
      },
      { name: "initialBuyAmount", type: "uint256" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [
      { name: "token", type: "address" },
      { name: "positionId", type: "uint256" },
    ],
    stateMutability: "payable",
  },

  // ── View ──
  {
    type: "function", name: "launchFee", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view",
  },
  {
    type: "function", name: "bondingTarget", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view",
  },
  {
    type: "function", name: "agentFeeBps", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view",
  },
  {
    type: "function", name: "tokens", inputs: [{ name: "token", type: "address" }],
    outputs: [{
      type: "tuple", internalType: "struct MemegridFactory.TokenInfo",
      components: [
        { name: "token", type: "address" }, { name: "deployer", type: "address" },
        { name: "agent", type: "address" }, { name: "pool", type: "address" },
        { name: "positionId", type: "uint256" }, { name: "totalSupply", type: "uint256" },
        { name: "initialLiquidity", type: "uint256" }, { name: "feesAccrued", type: "uint256" },
        { name: "graduated", type: "bool" }, { name: "createdAt", type: "uint40" },
      ],
    }], stateMutability: "view",
  },
  {
    type: "function", name: "getBondingProgress", inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "poolWeth", type: "uint256" },
      { name: "target", type: "uint256" },
      { name: "progressBps", type: "uint256" },
    ], stateMutability: "view",
  },
  {
    type: "function", name: "getAgentTokens", inputs: [{ name: "agent", type: "address" }],
    outputs: [{ type: "address[]" }], stateMutability: "view",
  },
  {
    type: "function", name: "getAllTokens", inputs: [], outputs: [{ type: "address[]" }], stateMutability: "view",
  },
  {
    type: "function", name: "getTokenCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view",
  },
  {
    type: "function", name: "agentFees", inputs: [{ name: "agent", type: "address" }],
    outputs: [{ type: "uint256" }], stateMutability: "view",
  },

  // ── Mutative ──
  {
    type: "function", name: "collectFees", inputs: [{ name: "token", type: "address" }],
    outputs: [], stateMutability: "nonpayable",
  },
  {
    type: "function", name: "claimAgentFees", inputs: [],
    outputs: [], stateMutability: "nonpayable",
  },
  {
    type: "function", name: "checkAndGraduate", inputs: [{ name: "token", type: "address" }],
    outputs: [{ type: "bool" }], stateMutability: "nonpayable",
  },

  // ── Events ──
  {
    type: "event", name: "TokenLaunched",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "deployer", type: "address", indexed: true },
      { name: "agent", type: "address", indexed: true },
      { name: "pool", type: "address", indexed: false },
      { name: "positionId", type: "uint256", indexed: false },
      { name: "initialLiquidity", type: "uint256", indexed: false },
      { name: "totalSupply", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event", name: "TokenGraduated",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "pool", type: "address", indexed: false },
    ],
  },
  {
    type: "event", name: "FeesCollected",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "total", type: "uint256", indexed: false },
      { name: "agentShare", type: "uint256", indexed: false },
      { name: "protocolShare", type: "uint256", indexed: false },
    ],
  },
];

function getFactoryContract(signerOrProvider) {
  return new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signerOrProvider);
}

// Helper: generate random bytes32 salt untuk deterministic CREATE2
function generateSalt() {
  return ethers.hexlify(ethers.randomBytes(32));
}

module.exports = {
  generateWallet,
  getProvider,
  getSigner,
  generateSalt,
  FACTORY_ADDRESS,
  POSITION_MANAGER,
  UNISWAP_V3_FACTORY,
  SWAP_ROUTER,
  WETH,
  FACTORY_ABI,
  getFactoryContract,
};
