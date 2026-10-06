/**
 * Canonical Temenos T24 CBS Record Function Codes
 */
export const CbsRecordFunction = {
  SEE: "S", // See / View record
  INPUT: "I", // Input / Commit record
  AUTHORIZE: "A", // Authorize unauth record
  DELETE: "D", // Mark for deletion
  LIST: "L", // Query / List records
  REVERSE: "R", // Reverse committed record
  HISTORY: "H", // Read history record
} as const;

export type CbsRecordFunction = (typeof CbsRecordFunction)[keyof typeof CbsRecordFunction];
