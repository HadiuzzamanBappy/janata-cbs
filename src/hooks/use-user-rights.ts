"use client";

import { useSessionStore } from "@/store";
import { type FunctionRightCode, CBS_FUNCTION_CODES } from "@/types";

export interface UserRights {
  canSee: boolean;
  canRead: boolean;
  canInput: boolean;
  canAmend: boolean;
  canDelete: boolean;
  canAuthorise: boolean;
  canReverse: boolean;
  canHistory: boolean;
  canHold: boolean;
  functionRights: string[];
  hasRight: (code: FunctionRightCode) => boolean;
}

/**
 * Universal hook to evaluate active user's CBS function rights.
 * Evaluates:
 *  - S: See (single record read without lock)
 *  - I: Input / Amend (Maker lock, insert/update draft to $NAU)
 *  - D: Delete (Delete pending unapproved draft from $NAU)
 *  - A: Authorize (Checker approval promoting from $NAU to live ledger)
 *  - R: Reverse (Reverse live authorized record to history)
 *  - H: History (Inspect $HIS historical snapshots)
 */
export function useUserRights(): UserRights {
  const user = useSessionStore((state) => state.user);

  // Default to full standard rights if not explicitly restricted
  const functionRights = user?.functionRights ?? (CBS_FUNCTION_CODES as readonly string[]);

  const hasRight = (code: FunctionRightCode): boolean => {
    return functionRights.includes(code);
  };

  const hasInput = hasRight("I");
  const hasSee = hasRight("S");
  const hasAuth = hasRight("A");
  const hasReverse = hasRight("R");
  const hasDelete = hasRight("D");
  const hasHistory = hasRight("H");

  return {
    canSee: hasSee,
    canRead: hasSee,
    canInput: hasInput,
    canAmend: hasInput || hasAuth, // Inputters/Makers amend drafts; supervisors with A also have amend access
    canDelete: hasDelete,
    canAuthorise: hasAuth,
    canReverse: hasReverse,
    canHistory: hasHistory,
    canHold: hasInput, // Holding drafts is part of the Maker/Input workflow
    functionRights: [...functionRights],
    hasRight,
  };
}
