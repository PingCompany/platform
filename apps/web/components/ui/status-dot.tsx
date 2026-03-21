import { cn } from "@/lib/utils";

type StatusVariant = "online" | "danger" | "warning" | "info" | "merged" | "offline" | "pending";

const variantStyles: Record<StatusVariant, string> = {
  online:  "bg-status-online shadow-[0_0_6px_rgba(34,197,94,0.5)]",
  danger:  "bg-status-danger shadow-[0_0_6px_rgba(239,68,68,0.5)]",
  warning: "bg-status-warning shadow-[0_0_6px_rgba(245,158,11,0.4)]",
  info:    "bg-status-info",
  merged:  "bg-status-merged",
  offline: "bg-white/20",
  pending: "bg-white/40 animate-pulse",
};

interface StatusDotProps {
  variant?: StatusVariant;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const sizeStyles = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
};

export function StatusDot({ variant = "online", size = "sm", className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    />
  );
}
