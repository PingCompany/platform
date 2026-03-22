import { cn } from "@/lib/utils";

const PERIODS = ["7d", "30d", "90d"] as const;
export type Period = (typeof PERIODS)[number];

interface PeriodSelectorProps {
  value: Period;
  onChange: (p: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex rounded border border-subtle bg-surface-2 p-0.5">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded px-2.5 py-1 text-2xs font-medium transition-colors",
            value === p
              ? "bg-surface-3 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
