"use client";

import { AlertCircle, Layers, LogOut, Monitor } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSingleTab } from "@/hooks";
import { cbsAuth } from "@/lib/cbs-client";
import { clientConfig } from "@/lib/core-config";

const ALERT_FAVICON =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b"><path d="M12 2L1 21h22L12 2zm-1 7h2v5h-2V9zm1 9a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg>';

/**
 * Global single-tab leadership guard for the CBS Workbench (Temenos Transact style).
 *
 * When another browser tab opens or reclaims leadership, this component displays an uncloseable
 * security modal that disables operations in this tab and offers a 1-click "Take Over Session Here" CTA.
 * Updates browser favicon with a yellow alert icon when inactive.
 */
export function AppSingleTabWatcher() {
  const router = useRouter();
  const { isOverridden, takeOver } = useSingleTab();

  // Dynamic Browser Favicon Indicator: Swaps to yellow alert icon when tab is inactive
  React.useEffect(() => {
    if (!isOverridden) return;

    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    const created = !link;
    const originalHref = link?.href;

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = ALERT_FAVICON;

    return () => {
      if (created && link) {
        link.remove();
      } else if (link && originalHref) {
        link.href = originalHref;
      }
    };
  }, [isOverridden]);

  const handleLogout = React.useCallback(async () => {
    try {
      await cbsAuth.logout();
    } catch {
      // Safe fallback
    } finally {
      localStorage.removeItem(clientConfig.storage.local.lastActivity);
      localStorage.removeItem(clientConfig.storage.local.activeTabInstance);
      router.push(clientConfig.routes.login);
      router.refresh();
    }
  }, [router]);

  return (
    <Dialog
      open={isOverridden}
      onOpenChange={(open) => {
        // Prevent dismissal via outside click or Escape key
        if (!open) return;
      }}
    >
      <DialogContent className="sm:max-w-md border-destructive/30" showCloseButton={false}>
        <DialogHeader className="gap-2">
          {/* WhatsApp-style custom red alert badge icon */}
          <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
            <Monitor className="h-6 w-6 text-foreground/80" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground ring-2 ring-background">
              <AlertCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <DialogTitle className="text-center text-lg font-semibold text-foreground">
            Active in Another Tab
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-xs leading-relaxed">
            Janata CBS has been opened in another browser tab. To safeguard cash transactions,
            drawer limits, and account integrity, only one active workbench tab is permitted at a
            time.
          </DialogDescription>
        </DialogHeader>

        <div className="my-1.5 p-2.5 rounded-md border border-border/60 bg-muted/30 text-xs text-muted-foreground text-center">
          Your open form drafts in this tab remain safe and preserved in memory.
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={takeOver}
            className="w-full gap-2 font-medium"
          >
            <Layers className="h-4 w-4" />
            Take Over Session Here
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full gap-2 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
