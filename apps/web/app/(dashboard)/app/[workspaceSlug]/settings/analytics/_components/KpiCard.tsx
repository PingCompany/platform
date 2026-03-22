import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  delta?: string;
  sub?: string;
}

export function KpiCard({ icon: Icon, label, value, delta, sub }: KpiCardProps) {
  const isNegative = delta && delta.startsWith("-");
  return (
    <div className="rounded border border-subtle bg-surface-1 px-4 py-3">
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-foreground/30" />
          <span className="text-2xs font-medium uppercase tracking-widest text-foreground/30">
            {label}
          </span>
        </div>
        {delta && (
          <span
            className={cn(
              "text-2xs font-medium",
              isNegative ? "text-destructive" : "text-status-online",
            )}
          >
            {isNegative ? "↓" : "↑"} {delta.replace("-", "")}%
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-2xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
