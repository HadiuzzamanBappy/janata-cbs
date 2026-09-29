"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "finx_last_activity";
const WARNING_BEFORE_LOGOUT_MS = 60 * 1000; // 60 seconds warning window

interface UseIdleTimeoutOptions {
  timeoutMinutes?: number;
  onLogout?: () => void;
}

export function useIdleTimeout({
  timeoutMinutes = 10,
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

    try {
      if (onLogout) {
        onLogout();
      } else {
        await fetch("/api/logout", { method: "POST" });
      }
    } catch {
      // Fail-safe cleanup
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      router.push("/login?reason=inactivity");
      router.refresh();
    }
  }, [onLogout, router]);

  const keepAlive = useCallback(async () => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, String(now));
    setIsWarningOpen(false);

    // Heartbeat to update server-side session lastActiveAt
    try {
      await fetch("/api/session");
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
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Storage event for multi-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTime = Number(e.newValue);
        const elapsed = Date.now() - remoteTime;
        if (elapsed < warningThresholdMs) {
          setIsWarningOpen(false);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 1-second wall-clock ticker
    const ticker = setInterval(() => {
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
  }, [totalTimeoutMs, warningThresholdMs, isWarningOpen, performLogout]);

  return {
    isWarningOpen,
    remainingSeconds,
    keepAlive,
    performLogout,
  };
}
