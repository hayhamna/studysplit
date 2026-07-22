"use client";

interface RationalePanelProps {
  label: string;
  text: string;
  onDismiss: () => void;
  tone?: "teal" | "coral";
}

export default function RationalePanel({ label, text, onDismiss, tone = "teal" }: RationalePanelProps) {
  const border = tone === "teal" ? "border-teal/30" : "border-coral/30";
  const chip = tone === "teal" ? "bg-teal text-white" : "bg-coral text-white";

  return (
    <div className={`rounded-lg border ${border} bg-white/70 p-4 flex items-start gap-3`}>
      <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-mono ${chip}`}>{label}</span>
      <p className="text-sm text-ink/80 leading-relaxed flex-1">{text}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-ink/40 hover:text-ink/70 text-sm leading-none px-1"
      >
        ✕
      </button>
    </div>
  );
}
