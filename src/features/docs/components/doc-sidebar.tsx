"use client";

import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DEV_NAV_GROUPS } from "../config/dev-nav-config";
import type { NavGroup } from "../config/types";

export interface DocSidebarProps {
  portalTitle?: string;
  portalHomeHref?: string;
  navGroups?: NavGroup[];
}

export function DocSidebar({
  portalTitle = "CBS - Developer",
  portalHomeHref = "/devs",
  navGroups = DEV_NAV_GROUPS,
}: DocSidebarProps) {
  const pathname = usePathname();

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const matching = navGroups
      .filter((group) => group.items.some((item) => item.href === pathname))
      .map((group) => group.id);
    // Default to expanding all groups so menu is fully visible on first load
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
    <aside className="w-80 h-screen border-r bg-card/50 backdrop-blur-xs flex flex-col shrink-0 z-30 select-none">
      {/* Sidebar Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b shrink-0">
        <Link
          href={portalHomeHref}
          className="flex items-center gap-2.5 font-bold text-base text-primary hover:opacity-90 transition no-underline"
        >
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <span>{portalTitle}</span>
        </Link>
      </div>

      {/* Sidebar Nav Items (Accordion Driven) */}
      <nav className="flex-1 overflow-y-auto p-4 text-sm scrollbar-thin">
        <Accordion
          multiple
          value={expandedGroups}
          onValueChange={(val) => setExpandedGroups(val as string[])}
          className="space-y-3"
        >
          {navGroups.map((group) => (
            <AccordionItem key={group.id} value={group.id} className="border-none">
              <AccordionTrigger className="hover:no-underline no-underline py-1.5 px-2 rounded-md hover:bg-accent/50 transition">
                <div className="flex items-center gap-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">
                  <group.icon className="h-3.5 w-3.5 text-primary" />
                  <span>{group.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-1 [&_a]:no-underline [&_a]:hover:no-underline">
                <div className="space-y-0.5 pl-2 border-l border-border/50 ml-3">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 py-1.5 px-2.5 rounded-md transition text-xs font-medium group no-underline hover:no-underline ${
                          isActive
                            ? "bg-primary/15 text-primary font-semibold border-l-2 border-primary -ml-[9px] pl-[15px]"
                            : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
                        }`}
                      >
                        <FileText
                          className={`h-3 w-3 shrink-0 transition ${
                            isActive
                              ? "text-primary opacity-100"
                              : "text-muted-foreground/50 group-hover:text-primary"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </nav>
    </aside>
  );
}

export { DocSidebar as DevSidebar, type DocSidebarProps as DevSidebarProps };
