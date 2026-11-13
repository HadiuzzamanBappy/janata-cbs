"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { useSingleTab } from "@/hooks/use-single-tab";
import { clientConfig } from "@/lib/core-config";

/**
 * Monitors session inactivity in the active workbench tab.
 * Displays a 60-second countdown warning when idle. If timeout expires,
 * cleanly redirects the operator to /login (Option 1).
 * Inactive tabs are suppressed from showing warnings.
 */
export function AppTimeoutWatcher() {
  const timeoutMinutes = clientConfig.logoutTime;
  const { isOverridden } = useSingleTab();
  const { isWarningOpen, remainingSeconds, keepAlive } = useIdleTimeout({
    timeoutMinutes,
  });

  return (
    <Dialog open={isWarningOpen && !isOverridden} onOpenChange={(open) => !open && keepAlive()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="gap-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center text-lg font-semibold">
            Inactivity Timeout Warning
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-sm">
            You have been inactive. For banking security, your active session will be logged out in:
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold tracking-wider text-amber-600 dark:text-amber-400">
            00:{remainingSeconds.toString().padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground mt-1">seconds remaining</span>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-center">
          <Button variant="default" onClick={keepAlive} className="flex-1 gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
