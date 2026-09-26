"use client";

import { Download, Home, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DEV_NAV_GROUPS } from "../config/dev-nav-config";
import type { NavGroup } from "../config/types";
import { DocPdfModal } from "./doc-pdf-modal";

export interface DocHeaderProps {
  onOpenSearch: () => void;
  portalSubFolder?: string;
  portalTitle?: string;
  navGroups?: NavGroup[];
}

export function DocHeader({
  onOpenSearch,
  portalSubFolder = "devs",
  portalTitle = "CBS Developer Hub",
  navGroups = DEV_NAV_GROUPS,
}: DocHeaderProps) {
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  return (
    <>
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

        {/* Right: Download PDF, Home Button & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPdfModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition cursor-pointer shadow-xs"
            title="Export portal documentation as dynamic PDF"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </button>

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

      {/* Dynamic PDF Export Progress Modal */}
      <DocPdfModal
        open={pdfModalOpen}
        onOpenChange={setPdfModalOpen}
        portalSubFolder={portalSubFolder}
        portalTitle={portalTitle}
        navGroups={navGroups}
      />
    </>
  );
}

export { DocHeader as DevHeader };
