"use client";

import * as React from "react";
import type { SystemCommandItem } from "@/lib/schemas";
import type { CommandGuideInfo } from "../types";

interface UseCommandGuideOptions {
  searchQuery: string;
  allCommands: SystemCommandItem[];
}

export function useCommandGuide({
  searchQuery,
  allCommands,
}: UseCommandGuideOptions): CommandGuideInfo | null {
  return React.useMemo(() => {
    const trimmedLeft = searchQuery.trimStart();
    if (!trimmedLeft) return null;

    // Check if query starts with a known command or application token
    const parts = trimmedLeft.split(/\s+/);
    const potentialApp = parts[0].toUpperCase();

    // Exclude special prefixes
    if (
      potentialApp.startsWith("SETTINGS:") ||
      potentialApp.startsWith("ACTION:") ||
      potentialApp === "INQ" ||
      potentialApp === "INQUIRY"
    ) {
      return null;
    }

    // Check if the typed token matches a known control/command or alias
    const matched = allCommands.find(
      (c) =>
        c.command.toUpperCase() === potentialApp ||
        c.aliases?.some((a) => a.toUpperCase() === potentialApp),
    );

    // If there is no trailing space or second token yet:
    // Only show guidance if the first token is an EXACT match to an application/command
    const hasSpace = /\s/.test(trimmedLeft);
    if (!hasSpace && !matched) {
      return null;
    }

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
  }, [allCommands, searchQuery]);
}
