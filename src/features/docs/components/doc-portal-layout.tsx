// Generic Reusable Documentation Portal Layout Component
"use client";

import { useEffect, useState } from "react";
import type { NavGroup } from "../config/types";
import { DocHeader } from "./doc-header";
import { DocSearchDialog } from "./doc-search-dialog";
import { DocSidebar } from "./doc-sidebar";

interface DocPortalLayoutProps {
  children: React.ReactNode;
  navGroups: NavGroup[];
  portalSidebarTitle: string;
  portalHeaderTitle: string;
  portalHomeHref: string;
  portalSubFolder: string;
}

export function DocPortalLayout({
  children,
  navGroups,
  portalSidebarTitle,
  portalHeaderTitle,
  portalHomeHref,
  portalSubFolder,
}: DocPortalLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased">
      {/* Fixed Left Sidebar */}
      <DocSidebar
        portalTitle={portalSidebarTitle}
        portalHomeHref={portalHomeHref}
        navGroups={navGroups}
      />

      {/* Main Container Right (Top Header + Scrollable Content) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Fixed Top Header */}
        <DocHeader
          onOpenSearch={() => setSearchOpen(true)}
          portalSubFolder={portalSubFolder}
          portalTitle={portalHeaderTitle}
          navGroups={navGroups}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Search Command Palette Modal */}
      <DocSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        navGroups={navGroups}
      />
    </div>
  );
}
