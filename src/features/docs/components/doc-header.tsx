"use client";

import { Home, Search } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function DocHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <header className="h-14 border-b bg-card/30 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left: Functional Search Trigger Bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 w-72 bg-muted/50 border border-input rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80 transition text-left cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate">Search documentation...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            ⌘K / Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Home Button & Theme Toggle */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium transition"
          title="Return to Officer Dashboard"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

export { DocHeader as DevHeader };
