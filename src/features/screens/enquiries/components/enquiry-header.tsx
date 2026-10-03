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
  X,
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

export interface EnquiryHeaderProps {
  title: string;
  commandCode: string;
  step: "SELECTION" | "RESULTS";
  rowCount?: number;
  totalCount?: number;
  pageRange?: string; // e.g. "1 - 10"
  onBackToSelection?: () => void;
  onExecuteSelection?: () => void;
  onRefresh?: () => void;
  onPrintLocal?: () => void;
  onPrintServer?: () => void;
  onExportCSV?: () => void;
  onExportHTML?: () => void;
  onExportXML?: () => void;
  onExitPopup?: () => void;
}

export function EnquiryHeader({
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
  onExitPopup,
}: EnquiryHeaderProps) {
  return (
    <TooltipProvider delay={150}>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/60 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left Title & Status Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Search className="size-3.5" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-foreground whitespace-nowrap leading-tight">
              {title}
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider leading-none mt-0.5">
              {commandCode}
            </span>
          </div>
        </div>

        {/* Right Action Toolbar (Icon Buttons styled like Form toolbar) */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* 1. Refresh Enquiry Data */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={onRefresh}
                  disabled={!onRefresh}
                  className="size-8 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">Refresh Results</TooltipContent>
          </Tooltip>

          {/* 2. Selection / Criteria Filter (🔍/Filter icon from CBS reference) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={onBackToSelection}
                  disabled={!onBackToSelection}
                  className="size-8 text-primary hover:bg-primary/10 shrink-0"
                >
                  <Search className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">Refilter Criteria</TooltipContent>
          </Tooltip>

          {/* 3. Enquiry Tools & Export Dropdown (Proper button with tool icon and arrow, no text) */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs gap-1.5 border-border bg-background hover:bg-muted/50 text-foreground shadow-xs shrink-0"
                      >
                        <Briefcase className="size-3.5 text-red-600 dark:text-red-400 shrink-0" />
                        <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                      </Button>
                    }
                  />
                }
              />
              <TooltipContent className="text-xs">Enquiry Actions &amp; Export</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" sideOffset={6} className="w-48 text-xs shadow-lg">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40">
                Print &amp; Output
              </div>
              <DropdownMenuItem onClick={onPrintLocal} className="cursor-pointer gap-2 py-1.5">
                <Printer className="size-3.5 text-muted-foreground" />
                <span>Print Locally</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPrintServer} className="cursor-pointer gap-2 py-1.5">
                <Printer className="size-3.5 text-muted-foreground" />
                <span>Print to Server</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40">
                Data Export
              </div>
              <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer gap-2 py-1.5">
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
                <span>Save as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportHTML} className="cursor-pointer gap-2 py-1.5">
                <FileText className="size-3.5 text-blue-600" />
                <span>Save as HTML</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportXML} className="cursor-pointer gap-2 py-1.5">
                <FileCode className="size-3.5 text-purple-600" />
                <span>Save as XML</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 4. Exit Popup Window Button */}
          {onExitPopup && (
            <>
              <div className="h-4 w-px bg-border/60 mx-0.5" />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={onExitPopup}
                      className="size-8 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 shrink-0 transition-colors"
                    >
                      <X className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent className="text-xs">Exit Popup Window</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
