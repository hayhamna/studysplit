import Logo from "./Logo";

interface TopNavProps {
  rightSlot: React.ReactNode;
  maxWidth?: string;
}

export default function TopNav({ rightSlot, maxWidth = "max-w-6xl" }: TopNavProps) {
  return (
    <>
      <nav className={`${maxWidth} mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-cardline`}>
        <Logo size={24} />
        {rightSlot}
      </nav>
      <div className="h-[2px] bg-gold/70" aria-hidden="true" />
    </>
  );
}
