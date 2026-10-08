"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import logo from "@/app/icon.png";
import { Button } from "@/components/ui/button";
import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";

interface SidebarHeaderNavProps {
  onOpenSearch: () => void;
}

export function SidebarHeaderNav({ onOpenSearch }: SidebarHeaderNavProps) {
  return (
    <SidebarHeader className="h-10 shrink-0 border-b border-border/60 p-0 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
      {/* Expanded mode branding */}
      <div className="flex items-center gap-2 min-w-0 px-2.5 group-data-[collapsible=icon]:hidden">
        <Image
          src={logo}
          alt="Janata Bank PLC"
          className="size-6.5 rounded object-contain shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs leading-tight truncate text-foreground">
            Janata Bank PLC.
          </span>
          <span className="text-[10px] text-muted-foreground truncate leading-tight">
            Core Banking Solution
          </span>
        </div>
      </div>

      {/* Expanded mode action buttons: Search Icon + Sidebar Toggle */}
      <div className="flex items-center gap-0.5 pr-1.5 group-data-[collapsible=icon]:hidden shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onOpenSearch}
          className="size-7 text-muted-foreground hover:text-foreground rounded"
          title="Search / Run (⌘K / Ctrl+K)"
        >
          <Search className="size-3.5" />
        </Button>
        <SidebarTrigger className="size-7 text-muted-foreground hover:text-foreground rounded" />
      </div>

      {/* Collapsed icon mode top item: Logo by default, switches to Toggle button on hover */}
      <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center size-9 relative group/iconheader">
        <Image
          src={logo}
          alt="Janata Bank PLC"
          className="size-6 rounded object-contain transition-opacity duration-150 group-hover/iconheader:opacity-0"
        />
        <SidebarTrigger className="size-7 absolute inset-0 m-auto opacity-0 group-hover/iconheader:opacity-100 transition-opacity duration-150 text-foreground hover:bg-accent rounded" />
      </div>
    </SidebarHeader>
  );
}
