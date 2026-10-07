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
import { appConfig } from "@/lib/config";
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
      <header className="h-14 border-b bg-card/30 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        {/* Left: Dynamic Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
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
                    <BreadcrumbPage className="font-semibold text-foreground truncate max-w-[280px]">
                      {currentItem.label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold text-foreground">
                      README.md
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
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
            href={appConfig.routes.dashboard}
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
