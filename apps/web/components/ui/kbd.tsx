import { cn } from "@/lib/utils";

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded border border-white/10 bg-white/5",
        "px-1.5 py-px font-mono text-2xs text-white/40 leading-none",
        className
      )}
    >
      {children}
    </kbd>
  );
}
