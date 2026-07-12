import fs from "node:fs";
import path from "node:path";
import Navbar from "@/components/Navbar";
import SkillViewer from "@/components/SkillViewer";
import InstallTabs from "@/components/InstallTabs";

function readSkillContent() {
  const filePath = path.join(process.cwd(), "content", "memegrid-skill.md");
  return fs.readFileSync(filePath, "utf-8");
}

const ENV_VARS = [
  { name: "PINATA_JWT", required: true, description: "Pins token logos to IPFS before a deploy." },
  { name: "MEMEGRID_API_KEY", required: false, description: 'Written automatically by "/memegrid install".' },
  { name: "MEMEGRID_API_BASE", required: false, description: "Overrides the default API base URL." },
];

export default function SkillPage() {
  const content = readSkillContent();

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-sage">the skill</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-deep">
          memegrid <span className="text-sage">v0.1.0</span>
        </h1>
        <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-deep/70">
          A single self-contained <code className="font-mono text-ink">SKILL.md</code> file, written to the{" "}
          <a href="https://agentskills.io" target="_blank" className="text-ink underline underline-offset-4">
            AgentSkills
          </a>{" "}
          open standard. It's the only way tokens get deployed on Memegrid — no web form, no separate CLI to
          install first. Copy it, hand it to your agent, and the command surface{" "}
          <code className="font-mono text-ink">/memegrid deploy token</code> is live.
        </p>

        {/* quick facts */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-sm border border-ink/10 bg-white/40 p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-sage">format</p>
            <p className="mt-1 font-display text-sm text-deep">Single file, self-extracting</p>
          </div>
          <div className="rounded-sm border border-ink/10 bg-white/40 p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-sage">compatible with</p>
            <p className="mt-1 font-display text-sm text-deep">Hermes, OpenClaw, Claude</p>
          </div>
          <div className="rounded-sm border border-ink/10 bg-white/40 p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-sage">commands</p>
            <p className="mt-1 font-display text-sm text-deep">install · deploy · claim · status</p>
          </div>
        </div>

        {/* env vars */}
        <div className="mt-10">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-sage">environment</p>
          <div className="divide-y divide-ink/10 rounded-sm border border-ink/10 bg-white/40">
            {ENV_VARS.map((e) => (
              <div key={e.name} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-mono text-sm text-deep">{e.name}</p>
                  <p className="font-body text-xs text-deep/50">{e.description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-sm px-2 py-0.5 font-mono text-[10px] ${
                    e.required ? "bg-signal/15 text-signal" : "bg-ink/10 text-sage"
                  }`}
                >
                  {e.required ? "required" : "optional"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* install */}
        <div className="mt-10 rounded-sm border border-ink/15 bg-white/40 p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-sage">install</p>
          <h2 className="mt-2 font-display text-lg font-semibold text-deep">
            Pick the runtime your agent uses
          </h2>
          <div className="mt-5">
            <InstallTabs />
          </div>
        </div>

        {/* full content */}
        <div className="mt-10">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-sage">full source</p>
          <SkillViewer content={content} />
        </div>

        <p className="mt-6 font-body text-xs text-deep/50">
          Read the full walkthrough of what each command does on the{" "}
          <a href="/how-it-works" className="text-ink underline underline-offset-4">
            how it works
          </a>{" "}
          page.
        </p>
      </section>

      <footer className="border-t border-ink/10 px-6 py-8 text-center font-mono text-xs text-sage">
        memegrid · deployed on robinhood chain via noxa fun
      </footer>
    </main>
  );
}
