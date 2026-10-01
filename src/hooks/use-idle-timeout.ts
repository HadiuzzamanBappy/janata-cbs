"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { appConfig } from "@/lib/config";

const STORAGE_KEY = appConfig.storageKeys.lastActivity;
const WARNING_BEFORE_LOGOUT_MS = appConfig.storageKeys.idleWarningWindowMs;

interface UseIdleTimeoutOptions {
  timeoutMinutes?: number;
  onLogout?: () => void;
}

export function useIdleTimeout({
  timeoutMinutes = appConfig.logoutTime,
  onLogout,
}: UseIdleTimeoutOptions = {}) {
  const router = useRouter();
  const totalTimeoutMs = timeoutMinutes * 60 * 1000;
  const warningThresholdMs = Math.max(totalTimeoutMs - WARNING_BEFORE_LOGOUT_MS, 0);

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const isLoggingOutRef = useRef(false);

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    // Immediately close the warning countdown and display the uncloseable logged-out modal
    setIsWarningOpen(false);
    setIsLoggedOut(true);

    try {
      if (onLogout) {
        onLogout();
      } else {
        await fetch(appConfig.routes.api.logout, { method: "POST" });
      }
    } catch {
      // Fail-safe cleanup
    } finally {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [onLogout]);

  const handleLogoutConfirm = useCallback(() => {
    router.push(appConfig.routes.login);
    router.refresh();
  }, [router]);

  const keepAlive = useCallback(async () => {
    if (isLoggedOut) return;
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, String(now));
    setIsWarningOpen(false);

    // Heartbeat to update server-side session lastActiveAt
    try {
      await fetch(appConfig.routes.api.session);
    } catch {
      // Ignore heartbeat network drop
    }
  }, [isLoggedOut]);

  useEffect(() => {
    // Initialize timestamp if missing
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    let lastRecorded = Date.now();

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
      }
    };

    // User interaction listeners
    const events = ["mousedown", "keydown", "scroll", "touchstart", "wheel"];
    if (!isLoggedOut) {
      events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));
    }

    // Storage event for multi-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (isLoggedOut) return;
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTime = Number(e.newValue);
        const elapsed = Date.now() - remoteTime;
        if (elapsed >= totalTimeoutMs) {
          performLogout();
        } else if (elapsed < warningThresholdMs) {
          setIsWarningOpen(false);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 1-second wall-clock ticker
    const ticker = setInterval(() => {
      if (isLoggedOut) {
        clearInterval(ticker);
        return;
      }

      const storedTime = Number(localStorage.getItem(STORAGE_KEY) || Date.now());
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
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(ticker);
    };
  }, [totalTimeoutMs, warningThresholdMs, isWarningOpen, isLoggedOut, performLogout]);

  return {
    isWarningOpen,
    isLoggedOut,
    remainingSeconds,
    keepAlive,
    performLogout,
    handleLogoutConfirm,
  };
}
