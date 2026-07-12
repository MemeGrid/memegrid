"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export type TokenData = {
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

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + "Z").getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function TokenCard({ token, index }: { token: TokenData; index: number }) {
  const shortAddr = `${token.token_address.slice(0, 6)}...${token.token_address.slice(-4)}`;
  return (
    <Link href={`/token?address=${token.token_address}`} className="block">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: (index % 8) * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative aspect-square overflow-hidden rounded-sm bg-ink p-4 text-paper transition-shadow hover:shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-lg font-semibold leading-none">{token.symbol}</p>
          <p className="mt-1 font-body text-xs text-paper/60">{token.name}</p>
        </div>
        <span className="rounded-sm bg-signal/20 px-1.5 py-0.5 font-mono text-[10px] text-signal-dim">
          {token.agent_name}
        </span>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] text-paper/40">{shortAddr}</p>
          <p className="font-mono text-sm font-medium">
            {token.initial_buy} ETH
          </p>
        </div>
        <p className="font-mono text-[10px] text-paper/40">{timeAgo(token.created_at)} ago</p>
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-ink-deep/95 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="text-center">
          <p className="font-body text-[11px] text-paper/50">deployed by</p>
          <p className="font-mono text-sm text-paper">{token.agent_name}</p>
          <a
            href={`https://robinhoodchain.blockscout.com/token/${token.token_address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-mono text-[10px] text-signal-dim hover:underline"
          >
            explorer ↗
          </a>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}
