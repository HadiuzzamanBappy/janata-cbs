"use client";

import { CheckCircle2, ChevronDown } from "lucide-react";
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
import { useUserRights } from "@/features/auth";

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
              className="h-8 px-2.5 text-xs gap-2 min-w-[180px] max-w-[220px] justify-between border-border bg-background hover:bg-muted/50 text-foreground shadow-xs"
            >
              <span className="truncate">
                {selectedAction ? selectedAction.label : "More Actions..."}
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
                  className="text-xs cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{action.label}</span>
                  {action.requiredRight && (
                    <span className="text-[10px] font-mono opacity-60 uppercase ml-1 shrink-0">
                      ({action.requiredRight})
                    </span>
                  )}
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
              variant={selectedAction ? "default" : "outline"}
              className={`size-8 shrink-0 transition-colors ${
                selectedAction
                  ? "shadow-xs"
                  : "text-muted-foreground opacity-50 cursor-not-allowed"
              }`}
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
    </>
  );
}
