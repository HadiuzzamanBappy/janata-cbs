"use client";

import { AlertTriangle, LogOut, RefreshCw } from "lucide-react";
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
import { appConfig } from "@/lib/config";

export function AppTimeoutWatcher() {
  const timeoutMinutes = appConfig.logoutTimeMinutes || 10;
  const { isWarningOpen, remainingSeconds, keepAlive, performLogout } = useIdleTimeout({
    timeoutMinutes,
  });

  return (
    <Dialog open={isWarningOpen} onOpenChange={(open) => !open && keepAlive()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="gap-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
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
          <Button variant="outline" onClick={performLogout} className="flex-1 gap-1.5">
            <LogOut className="h-4 w-4" />
            Logout Now
          </Button>
          <Button variant="default" onClick={keepAlive} className="flex-1 gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
