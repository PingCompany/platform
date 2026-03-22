const QUADRANT_COLORS: Record<string, string> = {
  "urgent-important": "#F4423C",
  important: "#5E6AD2",
  urgent: "#F59E0B",
  fyi: "#6B7280",
};

interface Segment {
  label: string;
  count: number;
  pct?: number;
  color?: string;
  quadrant?: string;
}

interface StackedBarProps {
  segments: Segment[];
  showLegend?: boolean;
}

export function StackedBar({ segments, showLegend = true }: StackedBarProps) {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  if (total === 0) {
    return (
      <p className="py-2 text-center text-xs text-muted-foreground">
        No data for this period
      </p>
    );
  }

  const withPct = segments.map((seg) => ({
    ...seg,
    pct: seg.pct ?? Math.round((seg.count / total) * 100),
    color: seg.color ?? (seg.quadrant ? QUADRANT_COLORS[seg.quadrant] : "#5E6AD2"),
  }));

  return (
    <div>
      <div className="mb-3 flex h-3 overflow-hidden rounded-full">
        {withPct.map((seg) => (
          <div
            key={seg.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
            title={`${seg.label}: ${seg.pct}%`}
          />
        ))}
      </div>

      {showLegend && (
        <div className="space-y-1.5">
          {withPct.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-xs text-muted-foreground">{seg.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {seg.count.toLocaleString()}
                </span>
                <span className="w-8 text-right font-mono text-2xs text-foreground/30">
                  {seg.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
