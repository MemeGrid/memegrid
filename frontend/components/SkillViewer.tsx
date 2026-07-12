"use client";

import { useState } from "react";

export default function SkillViewer({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  function copyAll() {
    navigator.clipboard?.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function download() {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SKILL.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-sm border border-ink/15 bg-ink-deep text-paper">
      <div className="flex items-center justify-between border-b border-paper/10 px-5 py-3">
        <span className="font-mono text-xs text-paper/50">SKILL.md</span>
        <div className="flex gap-2">
          <button
            onClick={copyAll}
            className="rounded-sm border border-paper/20 px-3 py-1.5 font-mono text-xs text-paper/80 transition hover:border-paper/50"
          >
            {copied ? "copied" : "copy all"}
          </button>
          <button
            onClick={download}
            className="rounded-sm border border-paper/20 px-3 py-1.5 font-mono text-xs text-paper/80 transition hover:border-paper/50"
          >
            download
          </button>
        </div>
      </div>
      <pre className="max-h-[560px] overflow-auto px-5 py-4 font-mono text-[11px] leading-relaxed text-paper/70">
        {content}
      </pre>
    </div>
  );
}
