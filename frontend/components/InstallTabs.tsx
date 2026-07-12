"use client";

import { useState } from "react";

type Tab = "hermes-paste" | "hermes-url" | "openclaw" | "claude";

const TABS: { key: Tab; label: string }[] = [
  { key: "hermes-paste", label: "Hermes (paste)" },
  { key: "hermes-url", label: "Hermes (URL)" },
  { key: "openclaw", label: "OpenClaw" },
  { key: "claude", label: "Claude / other" },
];

const CONTENT: Record<Tab, { steps: string[]; note: string }> = {
  "hermes-paste": {
    steps: [
      "Copy the full SKILL.md content above",
      'Paste it into your Hermes chat and say: "Save this as a skill called memegrid"',
      "Hermes writes ~/.hermes/skills/memegrid/SKILL.md itself",
    ],
    note: "No GitHub, no URL, no CLI — this is the fastest path for a single-file skill.",
  },
  "hermes-url": {
    steps: [
      "Host SKILL.md anywhere that serves raw text (a Gist, Pastebin, your own site)",
      "In chat: /skills install <url-to-SKILL.md>",
    ],
    note: "Hermes fetches and installs a single file directly — a full GitHub repo isn't required for a one-file skill.",
  },
  openclaw: {
    steps: [
      "Publish to ClawHub: clawhub package publish ./memegrid --family skill",
      'In chat: "Install the memegrid skill from clawhub:your-handle/memegrid"',
    ],
    note: "Or install straight from a Git URL without publishing: \"Install the skill at <repo-url>\".",
  },
  claude: {
    steps: [
      "Drop the SKILL.md file into your project's skills directory",
      "Claude picks it up automatically the next time its description matches your request",
    ],
    note: "Works with any AgentSkills-compatible runtime, not just Hermes/OpenClaw.",
  },
};

export default function InstallTabs() {
  const [tab, setTab] = useState<Tab>("hermes-paste");
  const active = CONTENT[tab];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-sm border px-3 py-1.5 font-mono text-xs transition ${
              tab === t.key ? "border-ink bg-ink text-paper" : "border-ink/20 text-deep/60 hover:border-ink/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ol className="mt-5 space-y-2">
        {active.steps.map((s, i) => (
          <li key={i} className="flex gap-3 font-body text-sm text-deep/80">
            <span className="font-mono text-xs text-signal">{String(i + 1).padStart(2, "0")}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 font-body text-xs text-deep/50">{active.note}</p>
    </div>
  );
}
