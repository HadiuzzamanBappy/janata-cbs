"use client";

import * as React from "react";
import { cbsCommand } from "@/lib/cbs-command";
import type { ControlCommand } from "@/lib/data-schemas";
import { CBS_FUNCTION_CODES, type CbsRecordFunction } from "@/types";
import type { CommandGuideInfo } from "../types";

interface UseCommandGuideOptions {
  searchQuery: string;
  allCommands: ControlCommand[];
}

/**
 * Proactive command guidance powered by the centralized CBS Command Gateway.
 * Resolves application tokens, functions, and record IDs without triggering false
 * guidance warnings on multi-word natural-language search queries (e.g. "user req").
 */
export function useCommandGuide({
  searchQuery,
  allCommands,
}: UseCommandGuideOptions): CommandGuideInfo | null {
  return React.useMemo(() => {
    const trimmed = searchQuery.trimStart();
    if (!trimmed) return null;

    const parsed = cbsCommand.parse(trimmed);
    if (parsed.type === "SETTINGS" || parsed.type === "INQUIRY") {
      return null;
    }

    const tokens = trimmed.split(/\s+/);
    const firstToken = tokens[0].toUpperCase();

    // Check if the typed token matches a known control/command or registered alias
    const matched = allCommands.find(
      (c) =>
        c.command.toUpperCase() === firstToken ||
        c.aliases?.some((a) => a.toUpperCase() === firstToken),
    );

    // Recognize dotted/comma CBS app identifiers (e.g. "SC.MODEL.CONFIG", "ACCOUNT,V")
    // or an explicit RIDASH function token after the app name
    const looksLikeCbsApp = firstToken.includes(".") || firstToken.includes(",");
    const secondTokenUpper = tokens[1]?.toUpperCase();
    const hasValidFnToken = Boolean(
      secondTokenUpper && CBS_FUNCTION_CODES.includes(secondTokenUpper as CbsRecordFunction),
    );

    if (!matched && !looksLikeCbsApp && !hasValidFnToken) {
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
