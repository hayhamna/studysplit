"use client";

interface LoadBarProps {
  name: string;
  strengths: string;
  assignedHours: number;
  capacityHours: number;
  available: boolean;
  onToggleUnavailable: () => void;
  rebalancing: boolean;
}

export default function LoadBar({
  name,
  strengths,
  assignedHours,
  capacityHours,
  available,
  onToggleUnavailable,
  rebalancing,
}: LoadBarProps) {
  const pct = capacityHours > 0 ? Math.min(100, (assignedHours / capacityHours) * 100) : 0;
  const overloaded = assignedHours > capacityHours;

  return (
    <div
      className={`rounded-lg border p-3 transition-opacity ${
        available ? "border-cardline bg-white/60" : "border-coral/40 bg-coral/5 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display font-medium text-ink truncate">{name}</p>
          <p className="font-mono text-[11px] text-ink/50 truncate">{strengths || "no strengths listed"}</p>
        </div>
        <span className="font-mono text-xs text-ink/60 whitespace-nowrap pt-0.5">
          {assignedHours}h / {capacityHours}h
        </span>
      </div>

      <div className="mt-2 h-2 w-full rounded-full bg-card overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            overloaded ? "bg-coral" : "bg-teal"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <button
        onClick={onToggleUnavailable}
        disabled={rebalancing}
        className={`mt-2 w-full rounded-md px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          available
            ? "bg-ink/5 text-ink/70 hover:bg-coral/10 hover:text-coral"
            : "bg-coral text-white hover:bg-coral-light"
        }`}
      >
        {available ? `${name} is unavailable` : rebalancing ? "Rebalancing…" : "Rebalance tasks"}
      </button>
    </div>
  );
}
