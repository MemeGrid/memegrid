import { statsTicker } from "@/lib/mockData";

export default function StatsTicker() {
  const items = [...statsTicker, ...statsTicker];
  return (
    <div className="overflow-hidden border-y border-ink/10 bg-ink py-3">
      <div className="animate-ticker flex w-max gap-10 font-mono text-xs text-paper/80">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-signal pulse-dot" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
