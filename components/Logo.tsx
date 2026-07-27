interface LogoProps {
  withWordmark?: boolean;
  size?: number;
  className?: string;
}

export default function Logo({ withWordmark = true, size = 28, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* balance beam mark: fulcrum + tilting beam with two weighted ends */}
        <path d="M16 6V26" stroke="#2F6F5E" strokeWidth="2.2" strokeLinecap="round" />
        <path
          d="M16 9L6 12.5M16 9L26 12.5"
          stroke="#1B2B3A"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="6" cy="12.5" r="3.4" fill="#2F6F5E" />
        <circle cx="26" cy="12.5" r="3.4" fill="#C9A227" />
        <path
          d="M12 26H20"
          stroke="#1B2B3A"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {withWordmark && (
        <span className="font-display font-semibold tracking-tight text-ink" style={{ fontSize: size * 0.64 }}>
          StudySplit
        </span>
      )}
    </div>
  );
}
