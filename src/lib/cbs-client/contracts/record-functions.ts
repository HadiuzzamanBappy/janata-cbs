/**
 * Canonical CBS Record Function Codes
 */
export const CbsRecordFunction = {
  SEE: "S", // See / View record
  INPUT: "I", // Input / Commit record
  AUTHORIZE: "A", // Authorize unauth record
  DELETE: "D", // Mark for deletion
  REVERSE: "R", // Reverse committed record
  HISTORY: "H", // Read history record
} as const;

export type CbsRecordFunction = (typeof CbsRecordFunction)[keyof typeof CbsRecordFunction];
