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
      className={`group rounded-xl border bg-white p-3.5 transition-all duration-200 ${
        available
          ? "border-cardline hover:border-teal/40 hover:shadow-sm"
          : "border-cardline border-l-[3px] border-l-coral"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span
            className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-display font-medium ${
              available ? "bg-teal-50 text-teal-dark" : "bg-coral-50 text-coral"
            }`}
            aria-hidden="true"
          >
            {name.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={`font-display font-medium text-sm truncate leading-tight ${available ? "text-ink" : "text-ink/60"}`}>
                {name}
              </p>
              {!available && (
                <span className="shrink-0 text-[9.5px] font-mono uppercase tracking-wide text-coral bg-coral-50 rounded px-1 py-0.5">
                  unavailable
                </span>
              )}
            </div>
            <p className="font-mono text-[10.5px] text-ink/45 truncate leading-tight mt-0.5">
              {strengths || "no strengths listed"}
            </p>
          </div>
        </div>
        <span
          className={`font-mono text-[11px] whitespace-nowrap pt-1 ${
            overloaded ? "text-coral font-medium" : "text-ink/55"
          }`}
        >
          {assignedHours}h / {capacityHours}h
        </span>
      </div>

      <div
        className="mt-2.5 h-2 w-full rounded-full bg-card overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${name}'s workload`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${
            overloaded ? "bg-coral" : available ? "bg-teal" : "bg-ink/20"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <button
        onClick={onToggleUnavailable}
        disabled={rebalancing}
        className={`mt-2.5 w-full rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
          available
            ? "bg-ink/[0.04] text-ink/60 hover:bg-coral-50 hover:text-coral"
            : "bg-coral text-white hover:bg-coral-light"
        }`}
      >
        {available ? (
          `${name} is unavailable`
        ) : rebalancing ? (
          <span className="inline-flex items-center gap-1.5 justify-center w-full">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulseSoft" />
            Rebalancing…
          </span>
        ) : (
          "Rebalance tasks"
        )}
      </button>
    </div>
  );
}
