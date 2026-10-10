/**
 * Core types for the CBS Record & Delta Engine
 */

export interface CbsDeltaPatch<T = unknown> {
  /** Map of field names to newly updated values */
  modifiedFields: Record<string, T>;
  /** Map of field names to their baseline/original values */
  originalFields: Record<string, T>;
  /** List of field names that were changed */
  dirtyKeys: string[];
  /** Whether any field differs from the baseline */
  isDirty: boolean;
}

export interface CbsFieldRule<T = unknown> {
  field: string;
  validate: (val: T, allValues: Record<string, unknown>) => string | null;
}

export interface CurrencyFormatOptions {
  currencyCode?: string;
  decimals?: number;
  locale?: string;
}
