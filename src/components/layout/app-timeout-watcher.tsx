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
  const timeoutMinutes = appConfig.logoutTime;
  const { isWarningOpen, isLoggedOut, remainingSeconds, keepAlive, handleLogoutConfirm } =
    useIdleTimeout({
      timeoutMinutes,
    });

  return (
    <>
      {/* 1. Inactivity Warning Dialog (Countdown with keep-alive option) */}
      <Dialog open={isWarningOpen && !isLoggedOut} onOpenChange={(open) => !open && keepAlive()}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="gap-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-semibold">
              Inactivity Timeout Warning
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm">
              You have been inactive. For banking security, your active session will be logged out
              in:
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

      {/* 2. Session Expired Modal (Uncloseable, background viewable, explicit CTA to Login) */}
      <Dialog
        open={isLoggedOut}
        onOpenChange={(open) => {
          // Strictly prevent closing via outside click or Escape key
          if (!open) return;
        }}
      >
        <DialogContent
          className="sm:max-w-md border-destructive/20 shadow-2xl"
          showCloseButton={false}
        >
          <DialogHeader className="gap-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <LogOut className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">Session Expired</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm leading-relaxed">
              You have been automatically logged out due to inactivity. To protect sensitive banking
              operations, please log in again to continue your work.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 sm:justify-center">
            <Button
              variant="default"
              size="lg"
              onClick={handleLogoutConfirm}
              className="w-full gap-2 font-medium"
            >
              <LogOut className="h-4 w-4" />
              Log In Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
