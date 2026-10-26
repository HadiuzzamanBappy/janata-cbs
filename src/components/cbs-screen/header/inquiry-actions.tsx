"use client";

import {
  Briefcase,
  ChevronDown,
  FileCode,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActionBtn } from "./action-btn";

export interface InquiryActionsProps {
  onBackToSelection?: () => void;
  onRefresh?: () => void;
  onPrintLocal?: () => void;
  onPrintServer?: () => void;
  onExportCSV?: () => void;
  onExportHTML?: () => void;
  onExportXML?: () => void;
}

/**
 * Universal Inquiry Action Toolbar:
 * Manages Refresh, Criteria Search toggle, and Export/Print output dropdown for CBS Inquiry screens.
 */
export function InquiryActions({
  onBackToSelection,
  onRefresh,
  onPrintLocal,
  onPrintServer,
  onExportCSV,
  onExportHTML,
  onExportXML,
}: InquiryActionsProps) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* 1. Refresh Enquiry Data */}
      <ActionBtn
        onClick={onRefresh}
        enabled={Boolean(onRefresh)}
        defaultTooltip="Refresh Results (F5)"
      >
        <RefreshCw className="size-3" />
      </ActionBtn>

      {/* 2. Selection / Criteria Filter */}
      <ActionBtn
        onClick={onBackToSelection}
        enabled={Boolean(onBackToSelection)}
        defaultTooltip="Criteria Selection"
      >
        <Search className="size-3" />
      </ActionBtn>

      <span className="h-4 w-px bg-border/60 mx-0.5" />

      {/* 3. Export / Print Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5 border-border bg-background hover:bg-muted/50 text-foreground shrink-0"
            >
              <Briefcase className="size-3 text-primary shrink-0" />
              <span className="text-[11px] font-medium">Export / Print</span>
              <ChevronDown className="size-3 text-muted-foreground shrink-0" />
            </Button>
          }
        />

        <DropdownMenuContent align="start" sideOffset={4} className="w-44 text-xs shadow-lg">
          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40">
            Print & Output
          </div>
          <DropdownMenuItem onClick={onPrintLocal} className="cursor-pointer gap-2 py-1">
            <Printer className="size-3 text-muted-foreground" />
            <span>Print Locally</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPrintServer} className="cursor-pointer gap-2 py-1">
            <Printer className="size-3 text-muted-foreground" />
            <span>Print to Server</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40">
            Data Export
          </div>
          <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer gap-2 py-1">
            <FileSpreadsheet className="size-3 text-foreground" />
            <span>Save as CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportHTML} className="cursor-pointer gap-2 py-1">
            <FileText className="size-3 text-foreground" />
            <span>Save as HTML</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportXML} className="cursor-pointer gap-2 py-1">
            <FileCode className="size-3 text-foreground" />
            <span>Save as XML</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
