"use client";

import { CheckCircle2, ChevronDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCbsAccess } from "@/lib/cbs-access";
import type { MoreActionItem } from "@/lib/cbs-screen/types";
import { ActionBtn } from "./action-btn";

export interface ActionMoreMenuProps {
  moreActions?: MoreActionItem[];
  submitting?: boolean;
}

/**
 * Secondary Operations Dropdown & Executor for CBS screens.
 * Allows users to pick an extra lifecycle action and execute it with permission enforcement.
 */
export function ActionMoreMenu({ moreActions = [], submitting = false }: ActionMoreMenuProps) {
  const access = useCbsAccess();
  const [selectedAction, setSelectedAction] = React.useState<MoreActionItem | null>(null);

  const isAllowed = selectedAction
    ? !selectedAction.requiredRight || access.hasFunctionRight(selectedAction.requiredRight)
    : false;

  const isExecutable = Boolean(selectedAction && isAllowed && !submitting);

  return (
    <div className="flex items-center gap-1 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5 w-44 justify-between border-border bg-background hover:bg-muted/50 text-foreground shrink-0"
            >
              <span className="truncate">
                {selectedAction ? selectedAction.label : "More operations"}
              </span>
              <ChevronDown className="size-3 text-muted-foreground shrink-0" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48 text-xs">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[11px] text-muted-foreground font-mono">
              More operations
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {moreActions.length === 0 ? (
              <DropdownMenuItem disabled className="text-xs font-mono">
                No extra actions
              </DropdownMenuItem>
            ) : (
              moreActions.map((action) => {
                const allowed =
                  !action.requiredRight || access.hasFunctionRight(action.requiredRight);
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
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ActionBtn
        onClick={() => selectedAction?.onClick()}
        enabled={isExecutable}
        reason={
          !selectedAction
            ? "Select an operation from the dropdown"
            : !isAllowed
              ? `Requires ${selectedAction.requiredRight} right`
              : undefined
        }
        defaultTooltip={selectedAction ? `Execute: ${selectedAction.label}` : "Execute Operation"}
      >
        <CheckCircle2 className="size-3.5" />
      </ActionBtn>
    </div>
  );
}
