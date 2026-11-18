"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cbsAuth } from "@/lib/cbs-client";
import {
  CBS_SCREEN_MESSAGE,
  clearClientSession,
  getWorkbenchBus,
  type WorkbenchBusMessage,
} from "@/lib/cbs-screen";
import { clientConfig } from "@/lib/core-config";
import { cbsStorage } from "@/lib/core-utils";
import { useActivityReporter } from "./use-activity-reporter";

const STORAGE_KEY = clientConfig.storage.local.lastActivity;
const WARNING_BEFORE_LOGOUT_MS = clientConfig.storage.idleWarningWindowMs;
const HEARTBEAT_INTERVAL_MS = 3 * 60 * 1000;

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
      clearClientSession();
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
    cbsStorage.set("local", STORAGE_KEY, String(now));
    setIsWarningOpen(false);

    try {
      await cbsAuth.getSession();
    } catch {
      // Ignore heartbeat network drop
    }
  }, []);

  // Recorded activity closes the warning; a periodic heartbeat keeps the Redis session alive
  const lastHeartbeatRef = useRef(Date.now());
  useActivityReporter((now) => {
    setIsWarningOpen(false);
    if (now - lastHeartbeatRef.current > HEARTBEAT_INTERVAL_MS) {
      lastHeartbeatRef.current = now;
      cbsAuth.getSession().catch(() => {});
    }
  });

  useEffect(() => {
    // Initialize timestamp if missing
    if (!cbsStorage.get("local", STORAGE_KEY)) {
      cbsStorage.set("local", STORAGE_KEY, String(Date.now()));
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
      const rawStored = cbsStorage.get("local", STORAGE_KEY);
      if (!rawStored) {
        cbsStorage.set("local", STORAGE_KEY, String(Date.now()));
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
