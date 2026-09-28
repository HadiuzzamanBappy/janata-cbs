"use client";

import { useSessionStore } from "@/components/providers/session-provider";

export interface UserRights {
  canRead: boolean;
  canInput: boolean;
  canDelete: boolean;
  canAmend: boolean;
  canSee: boolean;
  canHold: boolean;
  functionRights: string[];
  hasRight: (code: "R" | "I" | "D" | "A" | "S" | "H") => boolean;
}

/**
 * Hook to evaluate active user's Temenos RIDASH Function Rights.
 * Evaluates R (Read), I (Input), D (Delete), A (Amend), S (See), H (Hold).
 */
export function useUserRights(): UserRights {
  const user = useSessionStore((state) => state.user);

  // Default to standard rights if not explicitly restricted
  const functionRights = user?.functionRights ?? ["R", "I", "S", "H"];

  const hasRight = (code: "R" | "I" | "D" | "A" | "S" | "H"): boolean => {
    return functionRights.includes(code);
  };

  return {
    canRead: hasRight("R"),
    canInput: hasRight("I"),
    canDelete: hasRight("D"),
    canAmend: hasRight("A"),
    canSee: hasRight("S"),
    canHold: hasRight("H"),
    functionRights,
    hasRight,
  };
}
