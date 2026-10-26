"use client";

import { ArrowDownToLine } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import { CBS_SCREEN_EVENT } from "@/lib/cbs-screen";
import { CbsValidationChecklist } from "./cbs-validation-checklist";
import { InquiryActions, type InquiryActionsProps } from "./inquiry-actions";

export interface CbsInquiryHeaderProps extends InquiryActionsProps {
  title: string;
  commandCode: string;
  step?: "SELECTION" | "RESULTS";
  validationErrors?: CbsScreenValidationError[];
  onSelectValidationTab?: (tab: string) => void;
}

export function CbsInquiryHeader({
  title,
  commandCode,
  onBackToSelection,
  onRefresh,
  onPrintLocal,
  onPrintServer,
  onExportCSV,
  onExportHTML,
  onExportXML,
  validationErrors = [],
  onSelectValidationTab,
}: CbsInquiryHeaderProps) {
  const [canDock, setCanDock] = React.useState(false);
  React.useEffect(() => {
    setCanDock(typeof window !== "undefined" && Boolean(window.opener));
  }, []);

  return (
    <TooltipProvider delay={150}>
      <header className="sticky top-0 z-20 bg-muted/40 border-b border-border/80 select-none">
        {/* ROW 1: Minimalist CBS Action Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1 border-b border-border/50 bg-background/90 text-xs">
          {/* Universal Inquiry Action Toolbar */}
          <InquiryActions
            onBackToSelection={onBackToSelection}
            onRefresh={onRefresh}
            onPrintLocal={onPrintLocal}
            onPrintServer={onPrintServer}
            onExportCSV={onExportCSV}
            onExportHTML={onExportHTML}
            onExportXML={onExportXML}
          />

          {/* Validation Checklist Indicator & Drawer (Visible when issues exist) */}
          {validationErrors.length > 0 && (
            <>
              <span className="h-4 w-px bg-border/60 mx-1" />
              <CbsValidationChecklist
                errors={validationErrors}
                onSelectTab={(tab) => onSelectValidationTab?.(tab)}
              />
            </>
          )}

          {/* Right Action: Back to Tab (Dock into main window) when in popup window mode */}
          {canDock && (
            <div className="ml-auto flex items-center pl-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent(CBS_SCREEN_EVENT.DOCK_TO_SHELL));
                        }
                      }}
                      className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Back to tab bar"
                    >
                      <ArrowDownToLine className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent side="bottom" className="text-xs">
                  Back to tab bar
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* ROW 2: Ultra-compact CBS Record Title */}
        <div className="flex items-center gap-2 px-2.5 py-1 text-xs bg-muted/20">
          <span className="font-semibold text-foreground/90 text-xs tracking-tight shrink-0 whitespace-nowrap">
            {title || "Enquiry Screen"}
          </span>

          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-xs border border-border bg-background text-foreground shrink-0 shadow-2xs">
            {commandCode}
          </span>
        </div>
      </header>
    </TooltipProvider>
  );
}
