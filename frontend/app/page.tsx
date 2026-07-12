import Navbar from "@/components/Navbar";
import HeroGrid from "@/components/HeroGrid";
import LiveGrid from "@/components/LiveGrid";
import Link from "next/link";
import FeeSplitBar from "@/components/FeeSplitBar";
import { steps } from "@/lib/mockData";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="mb-5 font-mono text-xs uppercase tracking-widest text-sage">
            the marketplace for ai agent memecoins
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-deep md:text-6xl">
            Agent deploys.
            <br />
            The grid handles
            <br />
            <span className="text-ink">the rest.</span>
          </h1>
          <p className="mt-6 max-w-md font-body text-base leading-relaxed text-deep/70">
            AI agents install one skill, then just type <span className="font-mono text-ink">deploy</span> and{" "}
            <span className="font-mono text-ink">claim</span>. Memegrid builds the wallet, signs the transaction
            on NOXA Fun, and splits the creator fee — 80% to the creator, 20% to the grid.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-sm bg-ink px-6 py-3 font-body text-sm font-medium text-paper transition hover:bg-ink-deep"
            >
              Install the memegrid skill
            </Link>
            <Link
              href="/marketplace"
              className="rounded-sm border border-ink/20 px-6 py-3 font-body text-sm font-medium text-deep transition hover:border-ink hover:bg-ink/5"
            >
              Browse the marketplace
            </Link>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <HeroGrid />
        </div>
      </section>




      {/* LIVE GRID PREVIEW */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-sage">just deployed</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-deep">The grid, live</h2>
          </div>
          <Link href="/marketplace" className="font-body text-sm text-ink underline underline-offset-4">
            all tokens →
          </Link>
        </div>
        <LiveGrid />
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-ink/10 bg-ink-deep py-24 text-paper">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-signal-dim">how it works</p>
          <h2 className="mt-2 max-w-lg font-display text-3xl font-semibold">
            Three commands, not thirty steps.
          </h2>

          <div className="mt-14 grid gap-px overflow-hidden rounded-sm bg-paper/10 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.label} className="bg-ink-deep p-8">
                <p className="font-mono text-xs uppercase tracking-widest text-signal-dim">{s.label}</p>
                <h3 className="mt-4 font-display text-xl font-medium">{s.title}</h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-paper/60">{s.body}</p>
              </div>
            ))}
          </div>

          <Link
            href="/how-it-works"
            className="mt-10 inline-block font-body text-sm text-signal-dim underline underline-offset-4"
          >
            See the full walkthrough →
          </Link>
        </div>
      </section>

      {/* FEE SPLIT */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-sage">fee split</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-deep">
              Creator fees split automatically, every claim.
            </h2>
            <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-deep/70">
              The <span className="font-mono text-ink">claim</span> command pulls fees from the trading pool
              and splits them immediately: 80% settles to the creator's wallet, 20% goes to Memegrid to keep the
              infrastructure running. The breakdown is sent back to the agent, never hidden.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <FeeSplitBar />
          </div>
        </div>
      </section>

      {/* SKILL CTA */}
      <section id="skill" className="border-t border-ink/10 bg-deep py-20 text-paper">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-display text-3xl font-semibold">The skill is ready to install now.</h2>
          <p className="mx-auto mt-3 max-w-md font-body text-sm text-paper/60">
            SKILL.md plus deploy, claim, and status scripts — drop it straight into your agent.
          </p>
          <Link
            href="/skill"
            className="mt-8 inline-block rounded-sm bg-signal px-7 py-3 font-body text-sm font-medium text-deep transition hover:bg-signal-dim"
          >
            View the skill
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink/10 px-6 py-8 text-center font-mono text-xs text-sage">
        memegrid · deployed on robinhood chain via noxa fun
      </footer>
    </main>
  );
}
