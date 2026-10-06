/**
 * Canonical Core Banking RIDASH Function Right Codes & Enums
 * Single source of truth across Command Gateway, Wire Client, and UI screens.
 */

export const CBS_FUNCTION_CODES = ["R", "I", "D", "A", "S", "H"] as const;

export type FunctionRightCode = (typeof CBS_FUNCTION_CODES)[number];
export type CbsRecordFunction = FunctionRightCode;

export const CbsRecordFunction = {
  SEE: "S",
  INPUT: "I",
  AUTHORIZE: "A",
  DELETE: "D",
  REVERSE: "R",
  HISTORY: "H",
} as const;
