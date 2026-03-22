interface RankedItem {
  label: string;
  value: number;
  pct: number;
}

interface RankedListProps {
  items: RankedItem[];
  unit?: string;
  color?: string;
}

export function RankedList({ items, unit = "", color = "#5E6AD2" }: RankedListProps) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        No data for this period
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-4 text-right text-2xs text-foreground/25">
                #{i + 1}
              </span>
              <span className="text-xs text-foreground">{item.label}</span>
            </div>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {item.value.toLocaleString()}
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
          <div className="ml-6 h-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${item.pct}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
