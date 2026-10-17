"use client";

import { Download, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ThemeToggle } from "@/components/layout/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { appConfig } from "@/lib/core-config";
import { DEV_NAV_GROUPS } from "../config";
import type { NavGroup } from "../types";
import { DocPdfModal } from "./pdf/doc-pdf-modal";

export interface DocHeaderProps {
  portalSubFolder?: string;
  portalTitle?: string;
  navGroups?: NavGroup[];
}

export function DocHeader({
  portalSubFolder = "devs",
  portalTitle = "CBS Developer Hub",
  navGroups = DEV_NAV_GROUPS,
}: DocHeaderProps) {
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const pathname = usePathname();

  // Find active group and item for breadcrumb
  const { currentGroup, currentItem } = useMemo(() => {
    for (const group of navGroups) {
      const match = group.items.find((item) => item.href === pathname);
      if (match) {
        return { currentGroup: group, currentItem: match };
      }
    }
    return { currentGroup: undefined, currentItem: undefined };
  }, [navGroups, pathname]);

  return (
    <>
      <header className="h-10 border-b border-border/60 bg-background/50 backdrop-blur-xs px-3 sm:px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Dynamic Breadcrumbs (Toggle & Search live cleanly on the Sidebar) */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Breadcrumb>
            <BreadcrumbList className="text-[11px]">
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/${portalSubFolder}`}
                  className="font-medium text-muted-foreground hover:text-foreground"
                >
                  {portalSubFolder}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {currentGroup && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="hidden sm:inline-flex">
                    <span className="text-muted-foreground/80">{currentGroup.title}</span>
                  </BreadcrumbItem>
                </>
              )}
              {currentItem ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-foreground truncate max-w-60">
                      {currentItem.label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-foreground">
                      README.md
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right: Export PDF Button + Square Dashboard Icon + Square ThemeToggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPdfModalOpen(true)}
            className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition cursor-pointer shadow-2xs"
            title="Export portal documentation as dynamic PDF"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Dashboard Icon Button: identical square styling to ThemeToggle (size-7, border-border/80) */}
          <Link
            href={appConfig.routes.dashboard}
            className={buttonVariants({
              variant: "outline",
              size: "icon-sm",
              className:
                "size-7 bg-background border-border/80 hover:bg-accent hover:text-accent-foreground shrink-0",
            })}
            title="Return to Officer Dashboard"
            aria-label="Return to Dashboard"
          >
            <Home className="size-3.5" />
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
