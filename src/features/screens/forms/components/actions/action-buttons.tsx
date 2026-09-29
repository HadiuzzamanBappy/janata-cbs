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
      {/* Create New Record ('+' Right) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => onCreateNew?.()}
              disabled={!onCreateNew || submitting || !rights.canInput}
              className="size-8 text-foreground shrink-0 border-transparent"
            >
              <Plus className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!rights.canInput ? "Requires Input ('I') permission" : "Create New Record"}
        </TooltipContent>
      </Tooltip>

      {/* Amend Control ('A' Right) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => onAmend?.()}
              disabled={!onAmend || submitting || !searchVal.trim() || !rights.canAmend}
              className="size-8 text-foreground shrink-0 disabled:opacity-40 border-transparent"
            >
              <Edit3 className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!searchVal.trim()
            ? "Enter a Record ID to amend"
            : !rights.canAmend
              ? "Requires Amend ('A') permission"
              : "Amend Record"}
        </TooltipContent>
      </Tooltip>

      {/* View Control ('See' / 'Read' Right) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => onView?.()}
              disabled={
                !onView || submitting || !searchVal.trim() || (!rights.canSee && !rights.canRead)
              }
              className="size-8 text-foreground shrink-0 disabled:opacity-40 border-transparent"
            >
              <Eye className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!searchVal.trim()
            ? "Enter a Record ID to view details"
            : !rights.canSee && !rights.canRead
              ? "Requires View permission"
              : "View Details"}
        </TooltipContent>
      </Tooltip>

      {/* Save Record Icon Button (Single Tick) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => onSubmit?.()}
              disabled={!onSubmit || submitting || (!rights.canInput && !rights.canAmend)}
              className="size-8 bg-primary/10 text-primary hover:bg-primary/20 shrink-0 border-transparent"
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

      {/* Validate Control (Double Tick CheckCheck icon button) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => onValidate?.()}
              disabled={!onValidate || submitting || (!rights.canInput && !rights.canAmend)}
              className="size-8 text-foreground shrink-0 border-transparent"
            >
              <CheckCheck className="size-3.5 stroke-[2.5]" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          Validate onsite &amp; DB rules (check for errors)
        </TooltipContent>
      </Tooltip>

      {/* Hold Draft Control ('H' Right) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => onHold?.()}
              disabled={!onHold || submitting || !rights.canHold}
              className="size-8 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shrink-0 border-transparent"
            >
              <Clock className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!rights.canHold ? "Requires Hold ('H') permission" : "Hold Draft"}
        </TooltipContent>
      </Tooltip>

      {/* Delete Control ('D' Right) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => onDelete?.()}
              disabled={!onDelete || submitting || !rights.canDelete}
              className="size-8 bg-destructive/10 text-destructive hover:bg-destructive/20 shrink-0 border-transparent"
            >
              <Trash2 className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {!rights.canDelete ? "Requires Delete ('D') permission" : "Delete Record"}
        </TooltipContent>
      </Tooltip>

      {/* Reset Control */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => onReset?.()}
              disabled={!onReset || submitting}
              className="size-8 text-muted-foreground shrink-0 border-transparent"
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
