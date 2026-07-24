"use client";

interface RationalePanelProps {
  label: string;
  text: string;
  onDismiss: () => void;
  tone?: "teal" | "coral";
}

export default function RationalePanel({ label, text, onDismiss, tone = "teal" }: RationalePanelProps) {
  const isTeal = tone === "teal";

  return (
    <div
      className={`animate-fadeUp rounded-xl border p-4 sm:p-4.5 flex items-start gap-3.5 ${
        isTeal ? "border-teal/25 bg-teal-50/70" : "border-coral/25 bg-coral-50/70"
      }`}
    >
      <span
        className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isTeal ? "bg-teal text-white" : "bg-coral text-white"
        }`}
        aria-hidden="true"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L14.4 9.2H22L16 13.6L18.4 20.8L12 16.4L5.6 20.8L8 13.6L2 9.2H9.6L12 2Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-[11px] font-mono uppercase tracking-wide mb-1 ${
            isTeal ? "text-teal-dark" : "text-coral"
          }`}
        >
          {label}
        </p>
        <p className="text-sm text-ink/80 leading-relaxed">{text}</p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md h-6 w-6 flex items-center justify-center text-ink/35 hover:text-ink/70 hover:bg-ink/5 transition-colors text-sm leading-none"
      >
        ✕
      </button>
    </div>
  );
}
