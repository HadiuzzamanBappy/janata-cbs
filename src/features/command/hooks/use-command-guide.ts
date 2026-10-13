"use client";

import * as React from "react";
import { cbsCommand } from "@/lib/cbs-command";
import type { SystemCommandItem } from "@/lib/data-schemas";
import type { CommandGuideInfo } from "../types";

interface UseCommandGuideOptions {
  searchQuery: string;
  allCommands: SystemCommandItem[];
}

/**
 * Proactive command guidance powered by the centralized CBS Command Gateway.
 * Resolves application tokens, functions, and record IDs without ad-hoc string slicing.
 */
export function useCommandGuide({
  searchQuery,
  allCommands,
}: UseCommandGuideOptions): CommandGuideInfo | null {
  return React.useMemo(() => {
    const trimmed = searchQuery.trimStart();
    if (!trimmed) return null;

    // Delegate parsing to CBS Command Gateway
    const parsed = cbsCommand.parse(trimmed);

    // Filter out commands that do not provide RIDASH guidance (settings, inquiries, system actions)
    if (parsed.type === "SETTINGS" || parsed.type === "ACTION" || parsed.type === "INQUIRY") {
      return null;
    }

    const firstToken = trimmed.split(/\s+/)[0].toUpperCase();

    // Check if the typed token matches a known control/command or registered alias
    const matched = allCommands.find(
      (c) =>
        c.command.toUpperCase() === firstToken ||
        c.aliases?.some((a) => a.toUpperCase() === firstToken),
    );

    // If there is no trailing space yet, only show guidance on exact match
    const hasSpace = /\s/.test(trimmed);
    if (!hasSpace && !matched) {
      return null;
    }

    if (!matched && !/^[A-Z][A-Z0-9._-]*$/i.test(firstToken)) {
      return null;
    }

    const appName = matched?.command || parsed.application || firstToken;
    const typedFn = parsed.functionCode || "";
    const typedRecordId = parsed.recordId || "";

    return {
      appName,
      typedFn,
      typedRecordId,
    };
  }, [allCommands, searchQuery]);
}
