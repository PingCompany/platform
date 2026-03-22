"use client";

import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

interface SearchFieldProps {
  onOpenSearch: () => void;
}

export function SearchField({ onOpenSearch }: SearchFieldProps) {
  return (
    <>
      {/* Desktop: full search bar */}
      <button
        onClick={onOpenSearch}
        aria-label="Search or ask AI (⌘K)"
        className="hidden w-full max-w-[480px] items-center gap-2 rounded-lg border border-subtle bg-surface-1 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground sm:flex"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search or ask AI...</span>
        <Kbd>⌘K</Kbd>
      </button>

      {/* Mobile: icon only */}
      <button
        onClick={onOpenSearch}
        aria-label="Search (⌘K)"
        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground sm:hidden"
      >
        <Search className="h-4 w-4" />
      </button>
    </>
  );
}
