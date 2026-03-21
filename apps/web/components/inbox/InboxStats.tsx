"use client";

interface InboxStatsProps {
  stats?: {
    todayCount: number;
    avgResponseMinutes: number;
    pendingCount: number;
    delegationRate: number;
  };
}

export function InboxStats({ stats }: InboxStatsProps) {
  if (!stats) return null;

  const items = [
    `${stats.todayCount} decisions today`,
    `Avg response: ${stats.avgResponseMinutes}m`,
    `${stats.pendingCount} pending`,
    `${stats.delegationRate}% delegated`,
  ];

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 border-b border-subtle">
      {items.map((label, i) => (
        <span key={label} className="flex items-center gap-4">
          {i > 0 && <span className="text-2xs text-white/20">&middot;</span>}
          <span className="text-2xs text-muted-foreground">{label}</span>
        </span>
      ))}
    </div>
  );
}
