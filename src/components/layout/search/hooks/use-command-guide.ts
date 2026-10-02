"use client";

import * as React from "react";
import type { SystemCommandItem } from "@/lib/core";
import type { CommandGuideInfo } from "../types";

interface UseCommandGuideOptions {
  searchQuery: string;
  allCommands: SystemCommandItem[];
  userHasCommandLine: boolean;
}

export function useCommandGuide({
  searchQuery,
  allCommands,
  userHasCommandLine,
}: UseCommandGuideOptions): CommandGuideInfo | null {
  return React.useMemo(() => {
    if (!userHasCommandLine) return null;
    const trimmedLeft = searchQuery.trimStart();
    const parts = trimmedLeft.split(/\s+/);
    if (parts.length < 2) return null;

    const potentialApp = parts[0].toUpperCase();
    // Exclude special prefixes
    if (
      potentialApp.startsWith("SETTINGS:") ||
      potentialApp.startsWith("ACTION:") ||
      potentialApp === "ENQ" ||
      potentialApp === "INQ"
    ) {
      return null;
    }

    // Check if the typed token matches a known control/command
    const matched = allCommands.find(
      (c) =>
        c.command.toUpperCase() === potentialApp ||
        (c.recordId && c.recordId.toUpperCase() === potentialApp) ||
        (c.controlName && c.controlName.toUpperCase() === potentialApp) ||
        c.aliases?.some((a) => a.toUpperCase() === potentialApp),
    );

    if (!matched && !/^[A-Z][A-Z0-9._-]*$/i.test(potentialApp)) {
      return null;
    }

    const appName = matched?.command || potentialApp;
    const typedFn = parts[1] ? parts[1].toUpperCase() : "";
    const typedRecordId = parts.slice(2).join(" ");

    return {
      appName,
      typedFn,
      typedRecordId,
    };
  }, [allCommands, searchQuery, userHasCommandLine]);
}
