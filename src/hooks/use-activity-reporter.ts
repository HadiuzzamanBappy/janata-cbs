"use client";

import { useEffect, useRef } from "react";
import { clientConfig } from "@/lib/core-config";
import { cbsStorage } from "@/lib/core-utils";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;
const WRITE_THROTTLE_MS = 2000;

/**
 * Records user activity to the shared `lastActivity` key (throttled to one write per 2s), so the
 * idle-timeout watcher in the main shell sees activity from every window, popups included.
 * `onActivity` runs after each recorded write.
 */
export function useActivityReporter(onActivity?: (now: number) => void): void {
  const onActivityRef = useRef(onActivity);
  useEffect(() => {
    onActivityRef.current = onActivity;
  });

  useEffect(() => {
    let lastRecorded = Date.now();

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastRecorded <= WRITE_THROTTLE_MS) return;
      lastRecorded = now;
      cbsStorage.set("local", clientConfig.storage.local.lastActivity, String(now));
      onActivityRef.current?.(now);
    };

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }
    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, handleActivity);
      }
    };
  }, []);
}
