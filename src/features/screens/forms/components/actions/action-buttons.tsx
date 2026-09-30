"use client";

import { Check, CheckCheck, Clock, Edit3, Eye, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserRights } from "@/features/auth";

export interface ActionButtonsProps {
  searchVal: string;
  submitting?: boolean;
  onCreateNew?: () => void;
  onAmend?: () => void;
  onView?: () => void;
  onSubmit?: () => void;
  onValidate?: () => void;
  onHold?: () => void;
  onDelete?: () => void;
  onReset?: () => void;
}

export function ActionButtons({
  searchVal,
  submitting = false,
  onCreateNew,
  onAmend,
  onView,
  onSubmit,
  onValidate,
  onHold,
  onDelete,
  onReset,
}: ActionButtonsProps) {
  const rights = useUserRights();

  return (
    <>
      {/* Create New Record ('+' Right) - Primary */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onCreateNew?.()}
              disabled={!onCreateNew || submitting || !rights.canInput}
              className="size-8 shadow-xs shrink-0"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!rights.canInput ? "Requires Input ('I') permission" : "Create New Record (+)"}
        </TooltipContent>
      </Tooltip>

      {/* Amend Control ('A' Right) - Clean Outline */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onAmend?.()}
              disabled={!onAmend || submitting || !searchVal.trim() || !rights.canAmend}
              className="size-8 shrink-0 disabled:opacity-40"
            >
              <Edit3 className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!searchVal.trim()
            ? "Enter or select a Record ID to amend"
            : !rights.canAmend
              ? "Requires Amend ('A') permission"
              : "Amend / Edit Record"}
        </TooltipContent>
      </Tooltip>

      {/* View Control ('See' / 'Read' Right) - Clean Outline */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onView?.()}
              disabled={
                !onView || submitting || !searchVal.trim() || (!rights.canSee && !rights.canRead)
              }
              className="size-8 shrink-0 disabled:opacity-40"
            >
              <Eye className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!searchVal.trim()
            ? "Enter or select a Record ID to view details"
            : !rights.canSee && !rights.canRead
              ? "Requires View permission"
              : "View Details"}
        </TooltipContent>
      </Tooltip>

      {/* Save Record Button (Single Tick) - Primary CTA */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onSubmit?.()}
              disabled={!onSubmit || submitting || (!rights.canInput && !rights.canAmend)}
              className="size-8 shadow-xs shrink-0 disabled:opacity-40"
            >
              <Check className="size-3.5 stroke-[2.5]" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!rights.canInput && !rights.canAmend
            ? "Requires Input ('I') or Amend ('A') permission"
            : "Save Record"}
        </TooltipContent>
      </Tooltip>

      {/* Validate Control (Double Tick) - Clean Outline */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onValidate?.()}
              disabled={!onValidate || submitting || (!rights.canInput && !rights.canAmend)}
              className="size-8 shrink-0 disabled:opacity-40"
            >
              <CheckCheck className="size-3.5 stroke-[2.5]" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          Validate onsite &amp; DB rules (check for errors)
        </TooltipContent>
      </Tooltip>

      {/* Hold Draft Control ('H' Right) - Clean Outline */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onHold?.()}
              disabled={!onHold || submitting || !rights.canHold}
              className="size-8 shrink-0 disabled:opacity-40"
            >
              <Clock className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!rights.canHold ? "Requires Hold ('H') permission" : "Hold Draft"}
        </TooltipContent>
      </Tooltip>

      {/* Delete Control ('D' Right) - Subdued Destructive */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onDelete?.()}
              disabled={!onDelete || submitting || !rights.canDelete}
              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 shrink-0 disabled:opacity-40"
            >
              <Trash2 className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!rights.canDelete ? "Requires Delete ('D') permission" : "Delete Record"}
        </TooltipContent>
      </Tooltip>

      {/* Reset Control - Clean Outline */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onReset?.()}
              disabled={!onReset || submitting}
              className="size-8 text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">Reset Form</TooltipContent>
      </Tooltip>
    </>
  );
}
