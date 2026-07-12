"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { howItWorksSteps, faqs } from "@/lib/mockData";

export default function HowItWorksPage() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-sage">how it works</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-deep">
          From skill install to fee claim.
        </h1>
        <p className="mt-4 font-body text-sm leading-relaxed text-deep/70">
          Memegrid has exactly one way in: an AI agent installs the skill, then talks to Memegrid through a
          single command namespace. There's no separate web form for deploying — the steps below are the
          entire surface area.
        </p>

        {/* install block */}
        <div className="mt-10 rounded-sm border border-ink/15 bg-ink-deep p-6 text-paper">
          <p className="font-mono text-xs uppercase tracking-widest text-signal-dim">install once</p>
          <button
            onClick={() => copy("npx memegrid-cli install")}
            className="mt-3 flex w-full items-center justify-between rounded-sm border border-paper/15 bg-paper/5 px-4 py-3 text-left font-mono text-sm"
          >
            <span>npx memegrid-cli install</span>
            <span className="text-xs text-paper/40">
              {copied === "npx memegrid-cli install" ? "copied" : "copy"}
            </span>
          </button>
          <p className="mt-3 font-body text-xs leading-relaxed text-paper/50">
            This registers the agent (provisions a custodial wallet via KMS), drops the{" "}
            <code className="font-mono text-paper/70">SKILL.md</code> into the agent's skills directory, and
            saves an API key locally. Nothing here ever touches a private key directly.
          </p>
        </div>

        {/* the one command */}
        <div className="mt-6 rounded-sm border border-ink/15 bg-white/40 p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-sage">the command</p>
          <button
            onClick={() => copy("/memegrid deploy token")}
            className="mt-3 flex w-full items-center justify-between rounded-sm border border-ink/20 bg-white/60 px-4 py-3 text-left font-mono text-sm text-deep"
          >
            <span>/memegrid deploy token</span>
            <span className="text-xs text-sage">
              {copied === "/memegrid deploy token" ? "copied" : "copy"}
            </span>
          </button>
          <p className="mt-3 font-body text-xs leading-relaxed text-deep/60">
            Inside the agent's chat, this is the only supported deploy command. The agent then walks through
            collecting the token's name, symbol, description, socials, and logo before handing everything to
            Memegrid.
          </p>
        </div>

        {/* step list */}
        <div className="mt-16 space-y-0">
          {howItWorksSteps.map((s, i) => (
            <div key={s.number} className="border-t border-ink/10 py-8 first:border-t-0">
              <div className="flex gap-6">
                <span className="font-mono text-sm text-signal">{s.number}</span>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-deep">{s.title}</h3>
                  <p className="mt-1 font-body text-sm text-deep/50">{s.summary}</p>
                  <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-deep/70">{s.detail}</p>
                  {s.command && (
                    <div className="mt-3 inline-block rounded-sm bg-ink px-3 py-2 font-mono text-xs text-paper/80">
                      {s.command}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* logo / ipfs detail */}
        <div className="mt-4 rounded-sm border border-ink/15 bg-white/40 p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-sage">logo handling</p>
          <h3 className="mt-2 font-display text-lg font-semibold text-deep">Every logo goes to IPFS automatically</h3>
          <ul className="mt-3 space-y-2 font-body text-sm leading-relaxed text-deep/70">
            <li>· The agent points to a local file or URL — no manual upload step.</li>
            <li>· Accepted formats: PNG, JPEG, WebP, GIF. Square aspect ratio, minimum 250×250px.</li>
            <li>· Hard limit: <span className="font-mono text-ink">3&nbsp;MB</span>. Anything larger is rejected before it reaches IPFS.</li>
            <li>· The file is pinned to IPFS, and the resulting CID is what gets passed to NOXA Fun as the token logo — not a Memegrid-hosted URL.</li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <p className="font-mono text-xs uppercase tracking-widest text-sage">frequently asked</p>
          <div className="mt-4 divide-y divide-ink/10 rounded-sm border border-ink/10">
            {faqs.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-body text-sm font-medium text-deep">
                  {f.q}
                </summary>
                <p className="mt-2 font-body text-sm leading-relaxed text-deep/60">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 px-6 py-8 text-center font-mono text-xs text-sage">
        memegrid · deployed on robinhood chain via noxa fun
      </footer>
    </main>
  );
}
