"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface BreadcrumbsProps {
  channelName?: string | null;
  conversationName?: string | null;
}

interface Segment {
  label: string;
  href?: string;
}

export function Breadcrumbs({ channelName, conversationName }: BreadcrumbsProps) {
  const pathname = usePathname();
  const p = pathname.replace(/^\/app\/[^/]+/, "");
  const workspacePrefix = pathname.match(/^\/app\/[^/]+/)?.[0] ?? "";

  const segments = getSegments(p, workspacePrefix, channelName, conversationName);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      {segments.map((segment, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronRight className="h-3 w-3 shrink-0 text-foreground/40" />
          )}
          {segment.href && i < segments.length - 1 ? (
            <Link
              href={segment.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {/* Show only last segment on mobile */}
              <span className={i < segments.length - 1 ? "hidden sm:inline" : ""}>
                {segment.label}
              </span>
            </Link>
          ) : (
            <span className="font-medium text-foreground">{segment.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function getSegments(
  p: string,
  prefix: string,
  channelName?: string | null,
  conversationName?: string | null,
): Segment[] {
  if (p === "/inbox" || p === "") return [{ label: "My Deck" }];
  if (p === "/dms") return [{ label: "Communication" }];
  if (p === "/email") return [{ label: "Communication" }];

  if (p.startsWith("/dm/")) {
    return [
      { label: "Communication", href: `${prefix}/dms` },
      { label: conversationName ?? "Direct Message" },
    ];
  }

  if (p.startsWith("/email/")) {
    return [
      { label: "Communication", href: `${prefix}/dms` },
      { label: conversationName ?? "Email" },
    ];
  }

  if (p.startsWith("/channel/")) {
    return [
      { label: "Channels" },
      { label: channelName ? `# ${channelName}` : "Channel" },
    ];
  }

  if (p.startsWith("/settings/")) {
    const page = p.replace("/settings/", "");
    const pageNames: Record<string, string> = {
      profile: "Profile",
      workspace: "Workspace",
      team: "Team",
      agents: "Agents",
      "knowledge-graph": "Knowledge Graph",
      email: "Email",
      analytics: "Analytics",
    };
    return [
      { label: "Settings" },
      { label: pageNames[page] ?? page },
    ];
  }

  if (p.startsWith("/admin") || p === "") return [{ label: "Backoffice" }];

  return [{ label: "PING" }];
}
