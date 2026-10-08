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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface InquiryHeaderProps {
  title: string;
  commandCode: string;
  step: "SELECTION" | "RESULTS";
  rowCount?: number;
  totalCount?: number;
  pageRange?: string;
  onBackToSelection?: () => void;
  onExecuteSelection?: () => void;
  onRefresh?: () => void;
  onPrintLocal?: () => void;
  onPrintServer?: () => void;
  onExportCSV?: () => void;
  onExportHTML?: () => void;
  onExportXML?: () => void;
}

export type CbsInquiryHeaderProps = InquiryHeaderProps;
export type EnquiryHeaderProps = InquiryHeaderProps;

export function CbsInquiryHeader({
  title,
  commandCode,
  step: _step,
  rowCount: _rowCount = 0,
  totalCount: _totalCount,
  pageRange: _pageRange,
  onBackToSelection,
  onExecuteSelection: _onExecuteSelection,
  onRefresh,
  onPrintLocal,
  onPrintServer,
  onExportCSV,
  onExportHTML,
  onExportXML,
}: InquiryHeaderProps) {
  return (
    <TooltipProvider delay={150}>
      <header className="sticky top-0 z-20 bg-muted/40 border-b border-border/80 select-none">
        {/* ROW 1: Minimalist CBS Action Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1 border-b border-border/50 bg-background/90 text-xs">
          {/* 1. Refresh Enquiry Data */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="default"
                  size="icon-sm"
                  onClick={onRefresh}
                  disabled={!onRefresh}
                  className="h-7 w-9 rounded shadow-xs shrink-0"
                >
                  <RefreshCw className="size-3" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">Refresh Results</TooltipContent>
          </Tooltip>

          {/* 2. Selection / Criteria Filter */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="default"
                  size="icon-sm"
                  onClick={onBackToSelection}
                  disabled={!onBackToSelection}
                  className="h-7 w-9 rounded shadow-xs shrink-0"
                >
                  <Search className="size-3" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">Criteria Selection</TooltipContent>
          </Tooltip>

          <span className="h-4 w-px bg-border/60 mx-0.5" />

          {/* 3. Export / Print Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1.5 border-border bg-background hover:bg-muted/50 text-foreground shrink-0 rounded"
                >
                  <Briefcase className="size-3 text-red-600 dark:text-red-400 shrink-0" />
                  <span className="text-[11px] font-medium">Export / Print</span>
                  <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                </Button>
              }
            />

            <DropdownMenuContent align="start" sideOffset={4} className="w-44 text-xs shadow-lg">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40">
                Print &amp; Output
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
                <FileSpreadsheet className="size-3 text-emerald-600" />
                <span>Save as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportHTML} className="cursor-pointer gap-2 py-1">
                <FileText className="size-3 text-blue-600" />
                <span>Save as HTML</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportXML} className="cursor-pointer gap-2 py-1">
                <FileCode className="size-3 text-purple-600" />
                <span>Save as XML</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ROW 2: Ultra-compact CBS Record Title */}
        <div className="flex items-center gap-2 px-2.5 py-1 text-xs bg-muted/20">
          <span className="font-semibold text-foreground/90 text-xs tracking-tight shrink-0 whitespace-nowrap">
            {title || "Enquiry Screen"}
          </span>

          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border border-border bg-background text-foreground shrink-0 shadow-2xs">
            {commandCode}
          </span>
        </div>
      </header>
    </TooltipProvider>
  );
}
