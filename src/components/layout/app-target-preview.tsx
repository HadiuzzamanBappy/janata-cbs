"use client";

import { Terminal } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/core-utils";

/**
 * Minimal, square-edged, compact CBS Command Inspector badge.
 * Pinned precisely to the bottom-right edge without external padding.
 * Shows syntax: cbsCommand.execute("COMMAND")
 */
export function AppTargetPreview() {
  const [command, setCommand] = React.useState<string | null>(null);
  const hideTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (!targetEl) return;

      const trigger = targetEl.closest<HTMLElement>(
        "[data-cbs-command], [data-cbs-preview], a[href]",
      );

      if (!trigger) {
        if (!hideTimerRef.current) {
          hideTimerRef.current = setTimeout(() => {
            setCommand(null);
            hideTimerRef.current = null;
          }, 60);
        }
        return;
      }

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      const cmd =
        trigger.getAttribute("data-cbs-command") ||
        trigger.getAttribute("data-cbs-preview") ||
        trigger.getAttribute("href");

      if (cmd && cmd !== "#" && !cmd.startsWith("javascript:")) {
        setCommand(cmd);
      }
    };

    const handleMouseLeave = () => {
      setCommand(null);
    };

    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!command) return null;

  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed bottom-0 right-0 z-[9999] pointer-events-none select-none",
        "animate-in fade-in-0 duration-75",
      )}
    >
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-tl-md border-t border-l border-border/80 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-xs shadow-xs text-[10px] font-mono text-muted-foreground leading-tight">
        <Terminal className="size-2.5 text-primary shrink-0" />
        <span className="text-muted-foreground/70">cbsCommand.execute(</span>
        <span className="text-foreground font-semibold">"{command}"</span>
        <span className="text-muted-foreground/70">)</span>
      </div>
    </div>
  );
}
