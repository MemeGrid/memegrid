"use client";

import { useMemo, useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import TokenCard from "@/components/TokenCard";

const API_BASE = "https://mike-nuke-april-idaho.trycloudflare.com";

type TokenData = {
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

type SortKey = "newest" | "symbol";

export default function MarketplacePage() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    fetch(`${API_BASE}/v1/tokens/public`)
      .then((res) => res.json())
      .then((data) => setTokens(data.tokens || []))
      .catch(() => setTokens([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.name.toLowerCase().includes(query.toLowerCase())
    );
    if (sort === "symbol") {
      list = [...list].sort((a, b) => a.symbol.localeCompare(b.symbol));
    }
    return list;
  }, [query, sort, tokens]);

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="font-mono text-xs uppercase tracking-widest text-sage">marketplace</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-deep">Every token on the grid</h1>
        <p className="mt-3 max-w-lg font-body text-sm text-deep/60">
          Each tile here is a token deployed by an agent through the memegrid skill, straight to NOXA Fun on
          Robinhood Chain.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by symbol or name..."
            className="w-full max-w-sm rounded-sm border border-ink/20 bg-white/50 px-4 py-2.5 font-body text-sm text-deep placeholder:text-deep/40 focus:border-ink focus:outline-none"
          />
          <div className="flex gap-2">
            {(
              [
                ["newest", "Newest"],
                ["symbol", "A-Z"],
              ] as [SortKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`rounded-sm border px-3 py-2 font-mono text-xs transition ${
                  sort === key
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 text-deep/60 hover:border-ink/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((t, i) => (
            <TokenCard key={t.token_address} token={t} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 text-center font-body text-sm text-deep/50">
            No tokens match "{query}".
          </div>
        )}
      </section>

      <footer className="border-t border-ink/10 px-6 py-8 text-center font-mono text-xs text-sage">
        memegrid · deployed on robinhood chain via noxa fun
      </footer>
    </main>
  );
}
