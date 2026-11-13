"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cbsAuth } from "@/lib/cbs-client";
import { CBS_SCREEN_MESSAGE, getWorkbenchBus, type WorkbenchBusMessage } from "@/lib/cbs-screen";
import { clientConfig } from "@/lib/core-config";

const STORAGE_KEY = clientConfig.storage.local.lastActivity;
const WARNING_BEFORE_LOGOUT_MS = clientConfig.storage.idleWarningWindowMs;

interface UseIdleTimeoutOptions {
  timeoutMinutes?: number;
  onLogout?: () => void;
}

export function useIdleTimeout({
  timeoutMinutes = clientConfig.logoutTime,
  onLogout,
}: UseIdleTimeoutOptions = {}) {
  const router = useRouter();
  const totalTimeoutMs = timeoutMinutes * 60 * 1000;
  const warningThresholdMs = Math.max(totalTimeoutMs - WARNING_BEFORE_LOGOUT_MS, 0);

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const isLoggingOutRef = useRef(false);

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setIsWarningOpen(false);

    try {
      if (onLogout) onLogout();
      else await cbsAuth.logout();
    } catch {
      // Fail-safe cleanup
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(clientConfig.storage.local.activeTabInstance);
      const bus = getWorkbenchBus();
      if (bus) {
        bus.postMessage({
          type: CBS_SCREEN_MESSAGE.SESSION_LOGOUT,
          tabId: "global",
        } satisfies WorkbenchBusMessage);
      }
      router.push(clientConfig.routes.login);
      router.refresh();
    }
  }, [onLogout, router]);

  const keepAlive = useCallback(async () => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, String(now));
    setIsWarningOpen(false);

    try {
      await cbsAuth.getSession();
    } catch {
      // Ignore heartbeat network drop
    }
  }, []);

  useEffect(() => {
    // Initialize timestamp if missing
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    let lastRecorded = Date.now();
    let lastHeartbeat = Date.now();

    // Throttled activity updater
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle writes to localStorage (once every 2s)
      if (now - lastRecorded > 2000) {
        lastRecorded = now;
        localStorage.setItem(STORAGE_KEY, String(now));
        if (isWarningOpen) {
          setIsWarningOpen(false);
        }

        // Periodic heartbeat: notify server/Redis session every 3 minutes if actively interacting
        if (now - lastHeartbeat > 3 * 60 * 1000) {
          lastHeartbeat = now;
          cbsAuth.getSession().catch(() => {});
        }
      }
    };

    // User interaction listeners
    const events = ["mousedown", "keydown", "scroll", "touchstart", "wheel"];
    for (const evt of events) {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    }

    // Storage event for multi-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        // If storage item was removed, peer tab logged out -> direct clean redirect
        if (!e.newValue) {
          router.push(clientConfig.routes.login);
          router.refresh();
          return;
        }
        const remoteTime = Number(e.newValue);
        if (Number.isNaN(remoteTime)) return;
        const elapsed = Date.now() - remoteTime;
        if (elapsed >= totalTimeoutMs) {
          performLogout();
        } else if (elapsed < warningThresholdMs) {
          setIsWarningOpen(false);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for cross-tab session logout / session expired broadcasts
    const bus = getWorkbenchBus();
    const handleBusMessage = (event: MessageEvent<WorkbenchBusMessage>) => {
      if (
        event.data?.type === CBS_SCREEN_MESSAGE.SESSION_LOGOUT ||
        event.data?.type === CBS_SCREEN_MESSAGE.SESSION_EXPIRED
      ) {
        router.push(clientConfig.routes.login);
        router.refresh();
      }
    };
    if (bus) {
      bus.addEventListener("message", handleBusMessage);
    }

    // 1-second wall-clock ticker
    const ticker = setInterval(() => {
      const rawStored = localStorage.getItem(STORAGE_KEY);
      if (!rawStored) {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        return;
      }

      const storedTime = Number(rawStored);
      if (Number.isNaN(storedTime)) return;
      const elapsed = Date.now() - storedTime;

      if (elapsed >= totalTimeoutMs) {
        clearInterval(ticker);
        performLogout();
      } else if (elapsed >= warningThresholdMs) {
        const left = Math.max(0, Math.ceil((totalTimeoutMs - elapsed) / 1000));
        setRemainingSeconds(left);
        setIsWarningOpen(true);
      } else {
        if (isWarningOpen) {
          setIsWarningOpen(false);
        }
      }
    }, 1000);

    return () => {
      for (const evt of events) {
        window.removeEventListener(evt, handleUserActivity);
      }
      window.removeEventListener("storage", handleStorageChange);
      if (bus) {
        bus.removeEventListener("message", handleBusMessage);
      }
      clearInterval(ticker);
    };
  }, [totalTimeoutMs, warningThresholdMs, isWarningOpen, performLogout, router]);

  return {
    isWarningOpen,
    remainingSeconds,
    keepAlive,
    performLogout,
  };
}
