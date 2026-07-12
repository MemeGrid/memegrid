"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import type { AgentEntry } from "@/lib/mockData";

// Backend API — Cloudflare tunnel ke localhost:3099
const API_BASE = "https://pleasant-entertainment-medications-damages.trycloudflare.com";

type AgentData = {
  name: string;
  wallet_address: string;
  payout_address: string | null;
  status: string;
  registered_at: string;
  tokens_deployed: number;
  total_accrued: string;
  total_claimed: string;
  tokens: {
    symbol: string;
    name: string;
    address: string;
    tx_hash: string;
    initial_buy: string;
    deployed_at: string;
  }[];
};

const INSTALL_CMD = "npx memegrid-cli install";
const DEPLOY_CMD = "/memegrid deploy token";

export default function DashboardPage() {
  const [walletQuery, setWalletQuery] = useState("");
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // === IMPORT TOKEN STATE ===
  const [showImport, setShowImport] = useState(false);
  const [importForm, setImportForm] = useState({ apiKey: "", tokenAddress: "", name: "", symbol: "", description: "" });
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  }

  const handleImport = async () => {
    setImportLoading(true);
    setImportResult(null);
    try {
      const body: any = {
        token_address: importForm.tokenAddress.trim(),
        name: importForm.name.trim(),
        symbol: importForm.symbol.trim(),
      };
      if (importForm.description.trim()) body.description = importForm.description.trim();

      const res = await fetch(`${API_BASE}/v1/deploy/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${importForm.apiKey.trim()}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult({ ok: true, msg: `✅ ${data.symbol} imported! Refresh lookup to see it.` });
        setImportForm({ apiKey: "", tokenAddress: "", name: "", symbol: "", description: "" });
      } else {
        setImportResult({ ok: false, msg: `❌ ${data.error || "Import failed"}` });
      }
    } catch {
      setImportResult({ ok: false, msg: "❌ Cannot connect to backend." });
    }
    setImportLoading(false);
  };

  const handleSearch = useCallback(async (q: string) => {
    setWalletQuery(q);
    if (!q.trim()) {
      setAgentData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/agents/lookup?wallet=${encodeURIComponent(q.trim())}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Agent not found for this wallet address.");
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to fetch agent data.");
        }
        setAgentData(null);
      } else {
        const data: AgentData = await res.json();
        setAgentData(data);
      }
    } catch {
      setError("Cannot connect to backend. Is the API running?");
      setAgentData(null);
    }
    setLoading(false);
  }, []);

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-sage">agent dashboard</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-deep">
              {agentData ? agentData.name : "agent lookup"}
            </h1>
          </div>
        </div>

        {/* WALLET SEARCH — AGENT LOOKUP */}
        <div className="mt-10">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-sage">
            agent lookup
          </p>
          <h2 className="font-display text-2xl font-semibold text-deep">
            Search any agent by wallet address
          </h2>
          <p className="mt-1 font-body text-sm text-deep/50">
            Enter a wallet address to see the agent's deployed tokens and fee stats.
          </p>

          <div className="mt-5">
            <div className="relative">
              <input
                value={walletQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-sm border border-ink/20 bg-white/60 px-4 py-3.5 font-mono text-sm text-deep placeholder:text-deep/30 focus:border-ink focus:outline-none"
              />
              {walletQuery && (
                <button
                  onClick={() => {
                    setWalletQuery("");
                    setAgentData(null);
                    setError(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-sage hover:text-deep"
                >
                  clear
                </button>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <p className="mt-3 font-body text-sm text-sage animate-pulse">Searching agent...</p>
            )}

            {/* Error */}
            {error && !loading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 font-body text-sm text-red-500"
              >
                {error}
              </motion.p>
            )}

            {/* Agent Detail */}
            <AnimatePresence>
              {agentData && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-5 rounded-sm border border-ink/15 bg-white/60"
                >
                  {/* Agent header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 px-6 py-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-display text-xl font-semibold text-deep">
                          {agentData.name}
                        </p>
                        <span className={`rounded-sm px-2 py-0.5 font-mono text-[10px] ${
                          agentData.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {agentData.status}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-deep/40">{agentData.wallet_address}</p>
                      <p className="mt-0.5 font-body text-xs text-sage">
                        registered {agentData.registered_at}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setAgentData(null);
                        setWalletQuery("");
                        setError(null);
                      }}
                      className="font-mono text-xs text-sage hover:text-deep"
                    >
                      close ✕
                    </button>
                  </div>

                  {/* Stat mini cards */}
                  <div className="grid gap-4 px-6 py-5 sm:grid-cols-3">
                    <div className="rounded-sm border border-ink/10 bg-white/50 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-sage">
                        tokens deployed
                      </p>
                      <p className="mt-1 font-display text-2xl font-semibold text-deep">
                        {agentData.tokens_deployed}
                      </p>
                    </div>
                    <div className="rounded-sm border border-ink/10 bg-white/50 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-sage">
                        total fees accrued
                      </p>
                      <p className="mt-1 font-display text-2xl font-semibold text-signal">
                        {agentData.total_accrued} ETH
                      </p>
                    </div>
                    <div className="rounded-sm border border-ink/10 bg-white/50 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-sage">
                        total claimed
                      </p>
                      <p className="mt-1 font-display text-2xl font-semibold text-deep">
                        {agentData.total_claimed} ETH
                      </p>
                    </div>
                  </div>

                  {/* Token list */}
                  <div className="border-t border-ink/10 px-6 py-5">
                    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-sage">
                      deployed tokens ({agentData.tokens.length})
                    </p>
                    {agentData.tokens.length === 0 ? (
                      <p className="py-4 text-center font-body text-sm text-deep/30">
                        No tokens deployed yet. Use the CLI to deploy your first token!
                      </p>
                    ) : (
                      <div className="divide-y divide-ink/10 rounded-sm border border-ink/10 bg-white/50">
                        {agentData.tokens.map((t) => (
                          <div
                            key={t.address}
                            className="flex items-center justify-between gap-4 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="font-display text-sm font-semibold text-deep">
                                {t.symbol}{" "}
                                <span className="font-body font-normal text-deep/50">· {t.name}</span>
                              </p>
                              <p className="truncate font-mono text-xs text-deep/40">{t.address}</p>
                              <p className="mt-0.5 font-mono text-[10px] text-sage">
                                deployed {t.deployed_at}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="font-mono text-xs text-deep/60">
                                init buy: {t.initial_buy} ETH
                              </span>
                              <br />
                              <a
                                href={`https://robinhoodchain.blockscout.com/token/${t.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[10px] text-signal hover:underline"
                              >
                                explorer ↗
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payout address */}
                  {agentData.payout_address && (
                    <div className="border-t border-ink/10 px-6 py-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-sage">
                        payout address
                      </p>
                      <p className="mt-1 font-mono text-sm text-deep">{agentData.payout_address}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* IMPORT EXTERNAL TOKEN */}
        <div className="mt-14 rounded-sm border border-ink/15 bg-white/60 p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-sage">
                import external token
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-deep">
                Add a token deployed outside Memegrid
              </h2>
              <p className="mt-1 font-body text-sm text-deep/50">
                Manually deployed on NOXA Fun? Register it here so it shows up in your agent dashboard.
              </p>
            </div>
            <button
              onClick={() => { setShowImport(!showImport); setImportResult(null); }}
              className="rounded-sm border border-ink px-4 py-2 font-mono text-xs text-deep hover:bg-ink hover:text-paper transition-colors"
            >
              {showImport ? "cancel" : "import token +"}
            </button>
          </div>

          <AnimatePresence>
            {showImport && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-sage">agent api key</label>
                    <input
                      value={importForm.apiKey}
                      onChange={(e) => setImportForm({ ...importForm, apiKey: e.target.value })}
                      placeholder="mg_..."
                      className="mt-1 w-full rounded-sm border border-ink/20 bg-white px-3 py-2.5 font-mono text-sm text-deep placeholder:text-deep/30 focus:border-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-sage">token address</label>
                    <input
                      value={importForm.tokenAddress}
                      onChange={(e) => setImportForm({ ...importForm, tokenAddress: e.target.value })}
                      placeholder="0x..."
                      className="mt-1 w-full rounded-sm border border-ink/20 bg-white px-3 py-2.5 font-mono text-sm text-deep placeholder:text-deep/30 focus:border-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-sage">token name</label>
                    <input
                      value={importForm.name}
                      onChange={(e) => setImportForm({ ...importForm, name: e.target.value })}
                      placeholder="My Token"
                      className="mt-1 w-full rounded-sm border border-ink/20 bg-white px-3 py-2.5 font-body text-sm text-deep placeholder:text-deep/30 focus:border-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-sage">symbol</label>
                    <input
                      value={importForm.symbol}
                      onChange={(e) => setImportForm({ ...importForm, symbol: e.target.value })}
                      placeholder="TKN"
                      className="mt-1 w-full rounded-sm border border-ink/20 bg-white px-3 py-2.5 font-body text-sm text-deep placeholder:text-deep/30 focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleImport}
                    disabled={importLoading || !importForm.apiKey || !importForm.tokenAddress || !importForm.name || !importForm.symbol}
                    className="rounded-sm bg-signal px-5 py-2.5 font-mono text-xs text-white hover:bg-signal/90 disabled:opacity-40 transition-all"
                  >
                    {importLoading ? "importing..." : "import token"}
                  </button>
                  {importResult && (
                    <span className={`font-mono text-xs ${importResult.ok ? "text-green-600" : "text-red-500"}`}>
                      {importResult.msg}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Deploy via agent panel */}
        <div className="mt-14 rounded-sm border border-ink/15 bg-ink-deep p-7 text-paper">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-signal-dim">
                deploys run through your agent
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold">
                This dashboard doesn't deploy tokens — your agent does.
              </h2>
              <p className="mt-3 max-w-lg font-body text-sm leading-relaxed text-paper/60">
                There's no web form here on purpose. Deploying always goes through the memegrid skill so an AI
                agent — not a browser tab — is the one describing the token and signing off on it. Install the
                skill once, then run one command in your agent's chat.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-paper/40">1. install the skill</p>
              <button
                onClick={() => copy(INSTALL_CMD)}
                className="mt-1.5 flex w-full items-center justify-between rounded-sm border border-paper/15 bg-paper/5 px-3 py-2.5 text-left font-mono text-sm text-paper"
              >
                <span>{INSTALL_CMD}</span>
                <span className="text-xs text-paper/40">{copied === INSTALL_CMD ? "copied" : "copy"}</span>
              </button>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-paper/40">2. in your agent's chat</p>
              <button
                onClick={() => copy(DEPLOY_CMD)}
                className="mt-1.5 flex w-full items-center justify-between rounded-sm border border-paper/15 bg-paper/5 px-3 py-2.5 text-left font-mono text-sm text-paper"
              >
                <span>{DEPLOY_CMD}</span>
                <span className="text-xs text-paper/40">{copied === DEPLOY_CMD ? "copied" : "copy"}</span>
              </button>
            </div>
          </div>

          <p className="mt-5 font-body text-xs text-paper/50">
            Your agent will ask for the token name, symbol, description, socials, and a logo file — the logo is
            converted to IPFS automatically, max 3&nbsp;MB. Full walkthrough on the{" "}
            <a href="/how-it-works" className="text-signal-dim underline underline-offset-4">
              how it works
            </a>{" "}
            page.
          </p>
        </div>
      </section>
    </main>
  );
}
