"use client";

import { ArrowDownToLine, Lock } from "lucide-react";
import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCbsAccess } from "@/lib/cbs-access";
import type { CbsScreenValidationError, MoreActionItem, RecordLookupItem } from "@/lib/cbs-screen";
import { CBS_SCREEN_EVENT, resolveMoreActions } from "@/lib/cbs-screen";
import type { CbsScreenMode } from "@/types";
import { useRecordLookup } from "../hooks/use-record-lookup";
import { ActionBtn } from "./action-btn";
import { ActionButtons } from "./action-buttons";
import { ActionMoreMenu } from "./action-more-menu";
import { CbsValidationChecklist } from "./cbs-validation-checklist";
import { RecordLookupBar } from "./record-lookup-bar";

export interface CbsFormHeaderProps {
  title: string;
  commandCode?: string;
  recordId?: string;
  onRecordIdChange?: (id: string) => void;
  onRecordSearch?: (id: string) => void;
  onReset?: () => void;
  onSubmit?: () => void;
  onHold?: () => void;
  onDelete?: () => void;
  onValidate?: () => void;
  onAmend?: () => void;
  onView?: () => void;
  onPerformAction?: () => void;
  onAuthorizeReverse?: () => void;
  onProcessAction?: () => void;
  onReturnToSearch?: () => void;
  onCreateNew?: (newId?: string) => void;
  mode?: CbsScreenMode;
  recordStatus?: string;
  recordInputter?: string;
  submitting?: boolean;
  moreActions?: MoreActionItem[];
  availableItems?: RecordLookupItem[];
  validationErrors?: CbsScreenValidationError[];
  onSelectValidationTab?: (tab: string) => void;
  className?: string;
}

/**
 * Standard header toolbar for Core Banking forms.
 * Manages action triggers, record search bar, and validation drawer.
 */
export function CbsFormHeader({
  title,
  commandCode,
  recordId = "",
  onRecordIdChange,
  onRecordSearch,
  onReset,
  onSubmit,
  onHold,
  onDelete,
  onValidate,
  onAmend,
  onView,
  onPerformAction,
  onAuthorizeReverse,
  onProcessAction,
  onReturnToSearch,
  onCreateNew,
  mode = "IDLE",
  recordStatus,
  recordInputter,
  submitting = false,
  moreActions = [],
  availableItems = [],
  validationErrors = [],
  onSelectValidationTab,
  className = "",
}: CbsFormHeaderProps) {
  const access = useCbsAccess({ mode, recordStatus, recordInputter, command: commandCode });
  const [inputVal, setInputVal] = React.useState(recordId);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Dynamic SBI Record ID Lookup & GNI Sequencer
  const {
    items: lookupItems,
    loading: lookupLoading,
    generatingId,
    fetchRecordList,
    fetchNewRecordId,
  } = useRecordLookup(commandCode, availableItems);

  const [canDock, setCanDock] = React.useState(false);
  React.useEffect(() => {
    setCanDock(typeof window !== "undefined" && Boolean(window.opener));
  }, []);

  React.useEffect(() => {
    setInputVal(recordId);
  }, [recordId]);

  // Action 2: Chevron Dropdown open triggers server-side SBI lookup, filtered by inputVal prefix
  const handleDropdownOpenChange = React.useCallback(
    (open: boolean) => {
      setIsDropdownOpen(open);
      if (open) {
        fetchRecordList(inputVal.trim());
      }
    },
    [fetchRecordList, inputVal],
  );

  const itemsToDisplay = lookupItems.length > 0 ? lookupItems : availableItems;

  // Action 1: Typing Record ID + Enter -> Load Record in Mode 'I'
  const handlePerformSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputVal.trim();
    if (!query) return;

    setIsDropdownOpen(false);
    setHasSearched(true);
    onRecordSearch?.(query.toUpperCase());
  };

  // Selecting item from dropdown populates input field and closes dropdown
  const handleSelectRecord = (id: string) => {
    const cleanId = id.trim().toUpperCase();
    setInputVal(cleanId);
    setIsDropdownOpen(false);
    onRecordIdChange?.(cleanId);
  };

  // Action 3: New Button (+) -> Allocates sequence ID via 'GNI' or initializes user-defined draft
  const handleCreateNewClick = React.useCallback(async () => {
    try {
      const candidateId = inputVal.trim();
      const newId = await fetchNewRecordId(candidateId || undefined);
      if (newId) {
        setInputVal(newId);
        onRecordIdChange?.(newId);
        if (onCreateNew) {
          onCreateNew(newId);
        } else if (onRecordSearch) {
          onRecordSearch(newId);
        }
      }
    } catch (err) {
      console.warn("[CbsFormHeader] Failed to allocate new record sequence:", err);
    }
  }, [fetchNewRecordId, inputVal, onRecordIdChange, onCreateNew, onRecordSearch]);

  const handleClearRecord = () => {
    setInputVal("");
    setHasSearched(false);
    onRecordIdChange?.("");
    onReset?.();
  };

  const handleInputChange = (val: string) => {
    setInputVal(val);
    onRecordIdChange?.(val);
  };

  return (
    <TooltipProvider delay={150}>
      <header
        className={`sticky top-0 z-20 bg-muted/40 border-b border-border/80 select-none ${className}`}
      >
        {/* ROW 1: Minimalist CBS Action Toolbar */}
        <div className="flex items-center gap-1.5 px-2 py-1 border-b border-border/50 bg-background/90 text-xs">
          <ActionButtons
            mode={mode}
            searchVal={inputVal}
            recordStatus={recordStatus}
            recordInputter={recordInputter}
            command={commandCode}
            submitting={submitting}
            onAmend={onAmend}
            onView={onView}
            onPerformAction={onPerformAction}
            onSubmit={onSubmit}
            onValidate={onValidate}
            onHold={onHold}
            onDelete={onDelete}
            onAuthorizeReverse={onAuthorizeReverse}
            onProcessAction={onProcessAction}
            onReturnToSearch={onReturnToSearch}
          />

          <span className="h-4 w-px bg-border/60 mx-1" />

          {/* More Actions Dropdown & Dedicated CTA (Automatic Base Inheritance + Extensions) */}
          <div className="flex items-center gap-1">
            <ActionMoreMenu
              moreActions={resolveMoreActions(commandCode, moreActions)}
              submitting={submitting}
            />
          </div>

          {/* Validation Checklist Indicator & Drawer (visible only in active edit mode 'I') */}
          {mode === "I" && validationErrors.length > 0 && (
            <>
              <span className="h-4 w-px bg-border/60 mx-1" />
              <CbsValidationChecklist
                errors={validationErrors}
                onSelectTab={onSelectValidationTab}
              />
            </>
          )}

          {/* Right Action: Back to Tab (Dock into main window) when in popup window mode */}
          {canDock && (
            <div className="ml-auto flex items-center pl-2">
              <ActionBtn
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent(CBS_SCREEN_EVENT.DOCK_TO_SHELL));
                  }
                }}
                defaultTooltip="Back to tab bar"
                variant="ghost"
                className="size-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <ArrowDownToLine className="size-3.5" />
              </ActionBtn>
            </div>
          )}
        </div>

        {/* ROW 2: CBS Record Header: Label + Record ID Field + Add Button */}
        <div className="flex items-center gap-2 px-2.5 py-1 text-xs bg-muted/20">
          <span className="font-semibold text-foreground/90 text-xs tracking-tight shrink-0 whitespace-nowrap">
            {title}
          </span>

          {mode === "IDLE" ? (
            <RecordLookupBar
              inputVal={inputVal}
              onInputChange={handleInputChange}
              onClear={handleClearRecord}
              onSubmit={handlePerformSearch}
              onSelectRecord={handleSelectRecord}
              onCreateNew={handleCreateNewClick}
              matchingItems={itemsToDisplay}
              isDropdownOpen={isDropdownOpen}
              onDropdownOpenChange={handleDropdownOpenChange}
              hasSearched={hasSearched}
              submitting={submitting}
              loadingItems={lookupLoading}
              generatingId={generatingId}
              canCreate={access.canInput}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs border border-border bg-background text-foreground shrink-0 shadow-2xs flex items-center gap-1.5">
                <Lock className="size-3 text-muted-foreground" />
                {inputVal.trim() ||
                  (mode === "I" && !inputVal.trim()
                    ? "NEW"
                    : commandCode
                      ? `[${commandCode}]`
                      : "---")}
              </span>
              <span className="text-[9px] font-mono px-1 py-0 rounded-xs bg-primary/10 text-primary border border-primary/20 shrink-0 font-medium">
                {mode}
              </span>
            </div>
          )}

          {commandCode && (
            <span className="text-[10px] font-mono text-muted-foreground uppercase ml-auto">
              {commandCode}
            </span>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
