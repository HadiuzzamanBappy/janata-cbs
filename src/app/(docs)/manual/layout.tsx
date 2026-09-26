"use client";

import { useEffect, useState } from "react";
import {
  DocHeader,
  DocSearchDialog,
  DocSidebar,
  MANUAL_NAV_GROUPS,
} from "@/features/docs";

export default function ManualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      {/* Fixed Left Sidebar for User Manual */}
      <DocSidebar
        portalTitle="CBS - User Manual"
        portalHomeHref="/manual"
        navGroups={MANUAL_NAV_GROUPS}
      />

      {/* Main Container Right (Top Header + Scrollable Content) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Fixed Top Header */}
        <DocHeader onOpenSearch={() => setSearchOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Search Command Palette Modal */}
      <DocSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        navGroups={MANUAL_NAV_GROUPS}
      />
    </div>
  );
}
