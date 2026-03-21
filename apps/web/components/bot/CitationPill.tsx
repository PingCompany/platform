import { GitPullRequest, Zap, GitCommit, MessageSquare, ExternalLink, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type CitationType = "pr" | "ticket" | "commit" | "message" | "doc";

export interface Citation {
  type: CitationType;
  label: string;
  url?: string;
}

const typeConfig: Record<CitationType, { icon: React.ElementType; color: string }> = {
  pr:      { icon: GitPullRequest, color: "text-status-merged" },
  ticket:  { icon: Zap,           color: "text-ping-purple" },
  commit:  { icon: GitCommit,     color: "text-muted-foreground" },
  message: { icon: MessageSquare, color: "text-status-info" },
  doc:     { icon: FileText,      color: "text-status-warning" },
};

interface CitationPillProps {
  citation: Citation;
  className?: string;
}

export function CitationPill({ citation, className }: CitationPillProps) {
  const config = typeConfig[citation.type];
  const Icon = config.icon;

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-white/8 bg-white/5",
        "px-1.5 py-0.5 text-2xs text-white/55",
        "transition-all duration-100",
        citation.url && "cursor-pointer hover:border-white/15 hover:bg-white/10 hover:text-white/80",
        className
      )}
    >
      <Icon className={cn("h-2.5 w-2.5 shrink-0", config.color)} />
      <span className="font-mono">{citation.label}</span>
      {citation.url && <ExternalLink className="h-2 w-2 opacity-50" />}
    </span>
  );

  if (citation.url) {
    return (
      <a href={citation.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

interface CitationRowProps {
  citations: Citation[];
  className?: string;
}

export function CitationRow({ citations, className }: CitationRowProps) {
  if (citations.length === 0) return null;

  return (
    <div className={cn("mt-1.5 flex flex-wrap gap-1", className)}>
      {citations.map((citation, i) => (
        <CitationPill key={i} citation={citation} />
      ))}
    </div>
  );
}
