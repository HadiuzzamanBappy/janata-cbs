"use client";

import { KeyRound, LogOut, User, UserCheck } from "lucide-react";
import { useAlertStore } from "@/components/providers/alert-provider";
import { useSessionStore } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
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

interface UserMenuProps {
  onOpenSettingsTab: (tabId: string) => void;
}

export function UserMenu({ onOpenSettingsTab }: UserMenuProps) {
  const { user, logout } = useSessionStore();
  const { confirm: confirmAlert } = useAlertStore();

  const displayUser = user?.fullName;
  const displayId = user?.userId;
  const displayRole = user?.userRole?.join(", ") || user?.userRole?.[0];
  const businessDate = user?.txnDate;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-8 bg-background border-border/80 hover:bg-accent hover:text-accent-foreground"
            title={displayUser || "No User"}
          />
        }
      >
        <div className="size-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <User className="size-3.5" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-border/60">
              <User className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs leading-tight truncate">
                {displayUser || "null"}
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                <Badge
                  variant="secondary"
                  className="text-[9px] font-mono px-1 py-0 shrink-0"
                >
                  {displayId || "null"}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-[9px] font-mono px-1 py-0 shrink-0"
                >
                  {displayRole || "null"}
                </Badge>
                <span className="text-[10px] opacity-50 shrink-0">&bull;</span>
                <span className="text-[10px] font-mono shrink-0">
                  {businessDate || "null"}
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer text-xs gap-2 py-2"
            onClick={() => onOpenSettingsTab("profile")}
          >
            <UserCheck className="size-3.5 text-muted-foreground" />
            <span>User Profile & Privileges</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-xs gap-2 py-2"
            onClick={() => onOpenSettingsTab("security")}
          >
            <KeyRound className="size-3.5 text-muted-foreground" />
            <span>Security & Password</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            confirmAlert({
              title: "Sign Out Confirmation",
              message:
                "Are you sure you want to terminate your current active session? Any unsaved form progress will be lost.",
              variant: "destructive",
              confirmText: "Sign Out",
              onConfirm: () => logout(),
            })
          }
          className="cursor-pointer text-xs gap-2 py-2"
        >
          <LogOut className="size-3.5" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
