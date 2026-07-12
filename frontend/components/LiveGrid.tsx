"use client";

import { useState, useEffect } from "react";
import TokenCard from "./TokenCard";

const API_BASE = "https://pleasant-entertainment-medications-damages.trycloudflare.com";

import type { TokenData } from "./TokenCard";

export default function LiveGrid() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/v1/tokens/public`)
      .then((res) => res.json())
      .then((data) => setTokens(data.tokens || []))
      .catch(() => setTokens([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-sm bg-ink/10" />
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <p className="py-12 text-center font-body text-sm text-deep/30">
        No tokens deployed yet. Be the first!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {tokens.slice(0, 4).map((t, i) => (
        <TokenCard key={t.token_address} token={t} index={i} />
      ))}
    </div>
  );
}
