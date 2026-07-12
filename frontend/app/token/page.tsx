"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const API_BASE = "https://pleasant-entertainment-medications-damages.trycloudflare.com";

type TokenInfo = {
  token_address: string;
  name: string;
  symbol: string;
  description: string;
  logo_url: string;
  tx_hash: string;
  created_at: string;
  initial_buy: string;
  pool_address: string;
  agent_name: string;
  accrued_fee: string;
};

function TokenContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address");
  const [token, setToken] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [chartPool, setChartPool] = useState<string | null>(null);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    fetch(`${API_BASE}/v1/tokens/public`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.tokens?.find(
          (t: TokenInfo) => t.token_address.toLowerCase() === address.toLowerCase()
        );
        setToken(found || null);
        // After getting token, fetch DexScreener pool for GeckoTerminal chart
        const poolFallback = found?.pool_address || address;
        return fetch(`https://api.dexscreener.com/latest/dex/search?q=${address}`)
          .then((res) => res.json())
          .then((data) => {
            const pairs = data.pairs || [];
            const rh = pairs.filter((p: any) => p.chainId === "robinhood");
            setChartPool(rh[0]?.pairAddress || poolFallback);
          })
          .catch(() => setChartPool(poolFallback));
      })
      .catch(() => {
        setToken(null);
        // Still try to get DexScreener pair
        fetch(`https://api.dexscreener.com/latest/dex/search?q=${address}`)
          .then((res) => res.json())
          .then((data) => {
            const pairs = data.pairs || [];
            const rh = pairs.filter((p: any) => p.chainId === "robinhood");
            setChartPool(rh[0]?.pairAddress || address);
          })
          .catch(() => setChartPool(address));
      })
      .finally(() => setLoading(false));
  }, [address]);

  const copyAddr = () => {
    if (token) { navigator.clipboard?.writeText(token.token_address); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  if (loading) return null;

  if (!token) {
    return (
      <main className="min-h-screen bg-deep">
        <Navbar />
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-display text-2xl text-paper/30">token not found</p>
          <p className="mt-2 font-mono text-xs text-paper/20 break-all">{address || "no address"}</p>
          <Link href="/marketplace" className="mt-6 inline-block font-mono text-sm text-signal-dim hover:text-signal transition-colors">
            ← back to marketplace
          </Link>
        </section>
      </main>
    );
  }

  const shortAddr = `${token.token_address.slice(0, 8)}...${token.token_address.slice(-6)}`;
  const noxaUrl = `https://fun.noxa.fi/rh/token/${token.token_address}`;
  const explorerUrl = `https://robinhoodchain.blockscout.com/token/${token.token_address}`;
  const basedBotUrl = `https://t.me/based_eth_bot?start=r_Dms1310_b_${token.token_address}`;

  return (
    <main className="min-h-screen bg-deep">
      <Navbar />

      {/* HERO HEADER */}
      <section className="border-b border-paper/10 bg-ink-deep">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1 font-mono text-xs text-paper/40 hover:text-signal-dim transition-colors"
          >
            ← marketplace
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-signal-dim">token</p>
            <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-paper md:text-6xl">
              {token.symbol}
            </h1>
            <p className="mt-2 font-body text-xl text-paper/60">{token.name}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-sm bg-paper/10 px-3 py-1 font-mono text-xs text-paper/60">
                {shortAddr}
              </span>
              <button
                onClick={copyAddr}
                className="rounded-sm border border-paper/20 px-3 py-1 font-mono text-[10px] text-paper/50 hover:border-signal-dim hover:text-signal-dim transition-all"
              >
                {copied ? "copied ✓" : "copy address"}
              </button>
              <span className="font-mono text-xs text-paper/30">
                by <span className="text-signal-dim">{token.agent_name}</span>
              </span>
              <span className="font-mono text-xs text-paper/30">· {token.created_at}</span>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={noxaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm bg-signal px-5 py-3 font-mono text-sm font-medium text-white hover:bg-signal/90 transition-all shadow-lg shadow-signal/20"
            >
              swap on NOXA ↗
            </a>
            <a
              href={basedBotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm bg-[#5865F2] px-5 py-3 font-mono text-sm font-medium text-white hover:bg-[#4752C4] transition-all shadow-lg shadow-[#5865F2]/20"
            >
              buy via BasedBot ↗
            </a>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm border border-paper/20 px-5 py-3 font-mono text-sm text-paper/70 hover:border-paper/40 hover:text-paper transition-all"
            >
              explorer ↗
            </a>
          </div>
        </div>
      </section>

      {/* CHART + DETAILS */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Chart — takes 2/3 */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-sm border border-paper/10 bg-ink">
              <div className="flex items-center justify-between border-b border-paper/10 px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-paper/40">
                  price chart · GeckoTerminal
                </p>
                <a
                  href={`https://www.geckoterminal.com/robinhood/pools/${chartPool || token.token_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm bg-signal/20 px-2 py-0.5 font-mono text-[9px] text-signal-dim hover:bg-signal/30 transition-colors"
                >
                  open full chart ↗
                </a>
              </div>
              <div className="relative w-full bg-[#0D1117]" style={{ paddingBottom: "62%" }}>
                {chartPool && (
                  <iframe
                    src={`https://www.geckoterminal.com/robinhood/pools/${chartPool}?embed=1&info=0&swaps=0`}
                    className="absolute inset-0 h-full w-full border-0"
                    title={`${token.symbol} chart`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Info cards — 1/3 */}
          <div className="flex flex-col gap-4">
            {/* Contract */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-sm border border-paper/10 bg-ink p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-signal-dim">
                contract
              </p>
              <p className="mt-3 break-all font-mono text-[11px] leading-relaxed text-paper/60">
                {token.token_address}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={copyAddr}
                  className="rounded-sm border border-paper/15 px-3 py-1.5 font-mono text-[10px] text-paper/50 hover:border-signal-dim hover:text-signal-dim transition-all"
                >
                  {copied ? "copied ✓" : "copy"}
                </button>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm border border-paper/15 px-3 py-1.5 font-mono text-[10px] text-paper/50 hover:text-signal-dim transition-all"
                >
                  explorer ↗
                </a>
              </div>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-sm border border-paper/10 bg-ink p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-signal-dim">
                details
              </p>
              <div className="mt-3 space-y-3 font-mono text-sm">
                {[
                  ["symbol", token.symbol],
                  ["name", token.name],
                  ["initial buy", `${token.initial_buy} ETH`],
                  ["agent", token.agent_name],
                  ["deployed", token.created_at],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-paper/30 text-xs">{label}</span>
                    <span className={`text-xs ${label === "agent" ? "text-signal-dim" : "text-paper/70"}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Description */}
            {token.description && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-sm border border-paper/10 bg-ink p-5"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-signal-dim">
                  description
                </p>
                <p className="mt-3 font-body text-sm leading-relaxed text-paper/50">
                  {token.description}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="border-t border-paper/10">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="rounded-sm border border-signal/20 bg-signal/5 p-8 text-center">
            <p className="font-display text-2xl font-semibold text-paper">
              trade {token.symbol} now
            </p>
            <p className="mt-2 font-body text-sm text-paper/40 max-w-md mx-auto">
              Buy directly via Telegram bot or swap on NOXA Fun — the native DEX for Robinhood Chain.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={noxaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm bg-signal px-6 py-3 font-mono text-sm font-medium text-white hover:bg-signal/90 transition-all shadow-lg shadow-signal/20"
              >
                swap on NOXA Fun ↗
              </a>
              <Link
                href="/marketplace"
                className="rounded-sm border border-paper/20 px-6 py-3 font-mono text-sm text-paper/70 hover:border-paper/40 hover:text-paper transition-all"
              >
                back to marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-paper/10 px-6 py-8 text-center font-mono text-xs text-paper/20">
        memegrid · robinhood chain · noxa fun
      </footer>
    </main>
  );
}

export default function TokenPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-deep" />
    }>
      <TokenContent />
    </Suspense>
  );
}
