"use client";

import { CheckCircle2, ChevronDown, LifeBuoy } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserRights } from "@/hooks";

export interface MoreActionItem {
  label: string;
  command?: string;
  onClick: () => void;
  requiredRight?: "R" | "I" | "D" | "A" | "S" | "H";
}

export interface ActionMoreMenuProps {
  moreActions?: MoreActionItem[];
  submitting?: boolean;
  onSubmit?: () => void;
}

export function ActionMoreMenu({
  moreActions = [],
  submitting = false,
  onSubmit,
}: ActionMoreMenuProps) {
  const rights = useUserRights();
  const [selectedAction, setSelectedAction] = React.useState<MoreActionItem | null>(null);

  return (
    <>
      {/* More Actions Dropdown Selector - Bordered Field */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5 min-w-[150px] max-w-[190px] justify-between border-border bg-background hover:bg-muted/50 text-foreground shrink-0 rounded"
            >
              <span className="truncate">
                {selectedAction ? selectedAction.label : "More Actions ..."}
              </span>
              <ChevronDown className="size-3 text-muted-foreground shrink-0" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-[180px] text-xs">
          <DropdownMenuLabel className="text-[11px] text-muted-foreground font-mono">
            More Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {moreActions.length === 0 ? (
            <DropdownMenuItem disabled className="text-xs font-mono">
              No extra actions
            </DropdownMenuItem>
          ) : (
            moreActions.map((action) => {
              const allowed = !action.requiredRight || rights.hasRight(action.requiredRight);
              return (
                <DropdownMenuItem
                  key={action.command || action.label}
                  disabled={!allowed}
                  onClick={() => setSelectedAction(action)}
                  className="text-xs cursor-pointer"
                >
                  <span className="truncate">{action.label}</span>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Distinct Submit Action Checkmark Button */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon-sm"
              onClick={() => {
                if (selectedAction) {
                  selectedAction.onClick();
                } else if (onSubmit) {
                  onSubmit();
                }
              }}
              disabled={
                submitting ||
                !selectedAction ||
                (selectedAction.requiredRight
                  ? !rights.hasRight(selectedAction.requiredRight)
                  : false)
              }
              variant="default"
              className="size-7 rounded shrink-0 shadow-xs disabled:opacity-40"
            >
              <CheckCircle2 className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {selectedAction
            ? `Execute: ${selectedAction.label}`
            : "Select an action from More Actions to enable"}
        </TooltipContent>
      </Tooltip>

      {/* Temenos Support / Help LifeBuoy Icon Button */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-7 rounded shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              aria-label="Online Help"
            >
              <LifeBuoy className="size-4" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">Online Documentation &amp; Help</TooltipContent>
      </Tooltip>
    </>
  );
}
