"use client";

import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarFooter } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toTitleCase } from "@/lib/core-utils";
import { useAlertStore, useSessionStore } from "@/store";
import { BranchSwitcher } from "../widgets/branch-switcher";
import { ThemeToggle } from "../widgets/theme-toggle";

interface SidebarFooterNavProps {
  onOpenSettingsTab: (tabId: string) => void;
  userLoading: boolean;
}

export function SidebarFooterNav({ onOpenSettingsTab, userLoading }: SidebarFooterNavProps) {
  const { user, logout } = useSessionStore();
  const { confirm: confirmAlert } = useAlertStore();

  const displayUser = user?.fullName ? toTitleCase(user.fullName) : "";
  const displayId = user?.userId;
  const displayRole = user?.userRole?.join(", ") || user?.userRole?.[0];
  const businessDate = user?.txnDate;

  const handleLogout = () => {
    confirmAlert({
      title: "Sign Out Confirmation",
      message:
        "Are you sure you want to terminate your current active session? Any unsaved form progress will be lost.",
      variant: "destructive",
      confirmText: "Sign Out",
      onConfirm: () => logout(),
    });
  };

  return (
    <SidebarFooter className="border-t border-border/60 p-1.5 gap-1 bg-background/50 shrink-0 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:items-center">
      {/* Expanded mode footer */}
      <div className="flex flex-col gap-1 w-full group-data-[collapsible=icon]:hidden">
        {/* Row 1: Branch Switcher */}
        <BranchSwitcher
          className="w-full"
          triggerClassName="w-full justify-between h-7 px-2 text-xs"
          align="start"
        />

        {/* Row 2: User profile button (opens settings) + dedicated Logout button */}
        <div className="flex items-center gap-1 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenSettingsTab("profile")}
            disabled={userLoading}
            className="flex-1 h-7 px-2 justify-start gap-1.5 min-w-0 text-xs font-normal border-border/80 hover:bg-accent rounded"
            title={
              userLoading
                ? "Loading user session..."
                : `User: ${displayUser || displayId || "User"}${displayRole ? ` (${displayRole})` : ""}${businessDate ? ` • ${businessDate}` : ""} — Click to open settings`
            }
          >
            <div className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="size-2.5" />
            </div>
            {userLoading ? (
              <Skeleton className="h-3.5 w-24 rounded" />
            ) : (
              <span className="truncate text-xs text-foreground font-medium flex-1 text-left">
                {displayUser || displayId || "User"}
              </span>
            )}
          </Button>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Logout Button */}
          <TooltipProvider delay={150}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={handleLogout}
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-colors rounded"
                  >
                    <LogOut className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent className="text-xs">Sign Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Collapsed icon mode footer: Compact vertical icon column */}
      <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1.5 py-1">
        <TooltipProvider delay={150}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onOpenSettingsTab("profile")}
                  className="size-7 text-muted-foreground hover:text-foreground rounded"
                >
                  <User className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent side="right" className="text-xs">
              {displayUser || "User Profile"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ThemeToggle />

        <TooltipProvider delay={150}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleLogout}
                  className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                >
                  <LogOut className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent side="right" className="text-xs">
              Sign Out
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </SidebarFooter>
  );
}
