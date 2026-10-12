/* -------------------------------------------------------------------------- */
/* Canonical CBS Record Delta Contracts                                       */
/* -------------------------------------------------------------------------- */

/**
 * Patch description representing modified field states between a baseline
 * record and current draft values.
 */
export interface CbsDeltaPatch<T = unknown> {
  /** Map of field names to newly updated values */
  readonly modifiedFields: Readonly<Record<string, T>>;
  /** Map of field names to their baseline/original values */
  readonly originalFields: Readonly<Record<string, T>>;
  /** List of field names that were changed */
  readonly dirtyKeys: readonly string[];
  /** Whether any field differs from the baseline */
  readonly isDirty: boolean;
}
