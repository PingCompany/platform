"use client";

import { Menu, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { TOPBAR_HEIGHT } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/kbd";

function titleFromPath(pathname: string): string {
  if (pathname === "/inbox") return "Inbox";
  if (pathname.startsWith("/channel/")) return `# ${pathname.split("/channel/")[1]}`;
  if (pathname === "/settings/profile") return "Profile";
  if (pathname === "/settings/team") return "Team";
  if (pathname === "/settings/agents") return "Agents";
  if (pathname === "/settings/knowledge-graph") return "Knowledge Graph";
  if (pathname === "/settings/analytics") return "Analytics";
  if (pathname === "/admin") return "Backoffice";
  if (pathname.includes("/security")) return "Security";
  if (pathname.includes("/proxy")) return "Impersonation";
  return "PING";
}

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
}

export function TopBar({ onToggleSidebar, onOpenSearch, onOpenShortcuts }: TopBarProps) {
  const title = titleFromPath(usePathname());
  const router = useRouter();
  const user = useQuery(api.users.getMe);

  const userInitial = user?.name?.[0]?.toUpperCase() ?? "U";
  const userName = user?.name ?? "User";
  const userEmail = user?.email ?? "user@company.com";

  return (
    <header
      className="flex items-center justify-between border-b border-subtle bg-background/80 px-3 backdrop-blur-sm"
      style={{ height: TOPBAR_HEIGHT, minHeight: TOPBAR_HEIGHT }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="rounded p-1 text-white/30 transition-colors hover:bg-surface-3 hover:text-foreground md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-sm font-medium text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Command palette trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden items-center gap-2 rounded border border-subtle px-2.5 py-1 text-xs text-white/35 transition-colors hover:border-white/10 hover:text-white/60 sm:flex"
        >
          <Search className="h-3 w-3" />
          <span>Search or jump to...</span>
          <Kbd>⌘K</Kbd>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-ping-purple text-2xs font-medium text-white">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-surface-2 border-subtle">
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-foreground">{userName}</p>
              <p className="text-2xs text-muted-foreground">{userEmail}</p>
            </div>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => router.push("/settings/profile")}>
              Profile settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs" onClick={onOpenShortcuts}>
              Keyboard shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={() => (window.location.href = "/login")}
              className="cursor-pointer text-xs text-destructive focus:text-destructive"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
