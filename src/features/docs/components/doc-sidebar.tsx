"use client";

import { BookOpen, FileText, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DEV_NAV_GROUPS } from "../config";
import type { NavGroup } from "../types";

export interface DocSidebarProps {
  portalTitle?: string;
  portalHomeHref?: string;
  navGroups?: NavGroup[];
  onOpenSearch?: () => void;
}

export function DocSidebar({
  portalTitle = "CBS - Developer",
  portalHomeHref = "/devs",
  navGroups = DEV_NAV_GROUPS,
  onOpenSearch,
}: DocSidebarProps) {
  const pathname = usePathname();

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const matching = navGroups
      .filter((group) => group.items.some((item) => item.href === pathname))
      .map((group) => group.id);
    return matching.length > 0 ? matching : navGroups.map((g) => g.id);
  });

  // Auto-expand group containing active route on route change
  useEffect(() => {
    const matchingGroups = navGroups
      .filter((group) => group.items.some((item) => item.href === pathname))
      .map((group) => group.id);

    if (matchingGroups.length > 0) {
      setExpandedGroups((prev) => Array.from(new Set([...prev, ...matchingGroups])));
    }
  }, [pathname, navGroups]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar select-none shrink-0"
    >
      {/* Sidebar Header: Matches Dashboard SidebarHeaderNav */}
      <SidebarHeader className="h-10 shrink-0 border-b border-border/60 p-0 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
        {/* Expanded Mode Title */}
        <div className="flex items-center gap-2 min-w-0 px-2.5 group-data-[collapsible=icon]:hidden">
          <Link
            href={portalHomeHref}
            className="flex items-center gap-2 font-semibold text-xs text-foreground hover:opacity-90 transition no-underline min-w-0 truncate"
          >
            <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="size-3.5" />
            </div>
            <span className="truncate">{portalTitle}</span>
          </Link>
        </div>

        {/* Expanded Mode Action Buttons: Search + Toggle */}
        <div className="flex items-center gap-0.5 pr-1.5 group-data-[collapsible=icon]:hidden shrink-0">
          {onOpenSearch && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onOpenSearch}
              className="size-7 text-muted-foreground hover:text-foreground"
              title="Search documentation (⌘K / Ctrl+K)"
            >
              <Search className="size-3.5" />
            </Button>
          )}
          <SidebarTrigger className="size-7 text-muted-foreground hover:text-foreground" />
        </div>

        {/* Collapsed Mode: Icon by default, SidebarTrigger on hover */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center size-9 relative group/iconheader">
          <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 transition-opacity duration-150 group-hover/iconheader:opacity-0">
            <BookOpen className="size-3.5" />
          </div>
          <SidebarTrigger className="size-7 absolute inset-0 m-auto opacity-0 group-hover/iconheader:opacity-100 transition-opacity duration-150 text-foreground hover:bg-accent" />
        </div>
      </SidebarHeader>

      {/* Collapsed Mode Dedicated Search Icon */}
      {onOpenSearch && (
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-1.5 border-b border-border/50 shrink-0">
          <TooltipProvider delay={150}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={onOpenSearch}
                    className="size-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <Search className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="right" className="text-xs">
                Search documentation (⌘K)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Sidebar Content (Menu Tree) */}
      <SidebarContent className="p-2 text-xs overflow-x-hidden overflow-y-auto">
        {/* Expanded Mode: Full Accordion Tree */}
        <div className="w-full min-w-0 group-data-[collapsible=icon]:hidden">
          <Accordion
            multiple
            value={expandedGroups}
            onValueChange={(val) => setExpandedGroups(val as string[])}
            className="w-full min-w-0 space-y-2"
          >
            {navGroups.map((group) => (
              <AccordionItem
                key={group.id}
                value={group.id}
                className="w-full min-w-0 border-none overflow-hidden"
              >
                <AccordionTrigger className="w-full min-w-0 hover:no-underline no-underline py-1.5 px-2 rounded-sm hover:bg-accent/40 transition">
                  <div className="flex items-center gap-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground min-w-0 flex-1 truncate">
                    <group.icon className="size-3.5 text-primary shrink-0" />
                    <span className="truncate flex-1 min-w-0 text-left">{group.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-1 w-full min-w-0 overflow-hidden [&_a]:no-underline [&_a]:hover:no-underline">
                  <div className="w-full min-w-0 space-y-1 pl-2 border-l border-border/40 ml-2.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.label}
                          className={`flex items-center gap-2 py-1.5 px-2.5 rounded-sm transition text-xs font-normal group no-underline hover:no-underline leading-normal w-full min-w-0 overflow-hidden ${
                            isActive
                              ? "bg-accent/80 text-foreground font-medium shadow-2xs border-l-2 border-primary"
                              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                          }`}
                        >
                          <FileText
                            className={`size-3.5 shrink-0 transition ${
                              isActive
                                ? "text-primary opacity-100"
                                : "text-muted-foreground/50 group-hover:text-primary"
                            }`}
                          />
                          <span className="truncate flex-1 min-w-0">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Collapsed Mode: Group Icons with Tooltips */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1.5 py-1">
          <TooltipProvider delay={150}>
            {navGroups.map((group) => (
              <Tooltip key={group.id}>
                <TooltipTrigger
                  render={
                    <Link
                      href={group.items[0]?.href || portalHomeHref}
                      className="size-7 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition"
                    >
                      <group.icon className="size-3.5" />
                    </Link>
                  }
                />
                <TooltipContent side="right" className="text-xs">
                  {group.title}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

export { DocSidebar as DevSidebar, type DocSidebarProps as DevSidebarProps };
