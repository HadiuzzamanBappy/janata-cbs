import type { Align, Spacing } from "./primitives";

/**
 * Standalone-TABLE body component types.
 *
 * Note: there are TWO distinct "table style" shapes in the studio:
 *   1. `TableStyle` (this file)    — used by the standalone TABLE body component,
 *      stored on `BodyComponent.tableStyle`. Fields are PDF/iText-oriented:
 *      `borderWidth`, `headerColor`, `cellPadding: Spacing`, etc.
 *   2. The Quill-table-blot style — a flat record of CSS-like keys
 *      (`headerBg`, `cellBg`, `altRowBg`, `fontSize: string`, …) used by the
 *      inline table editor inside TEXT_BLOCK. That shape lives with the
 *      text-block feature (`features/text-block/blots/`) and is intentionally
 *      kept separate.
 *
 * Don't try to unify these — they evolve independently and the monolith
 * relies on their structural differences.
 */

export interface TableStyle {
  borderWidth: number;
  borderColor: string;
  borderStyle: string;
  horizontalBorderOnly: boolean;
  verticalBorderOnly: boolean;
  headerBorder: boolean;
  headerColor: string;
  dataBorder: boolean;
  consistentCellAlignment: boolean;
  cellPadding: Spacing;
}

export interface Aggregate {
  function: string;
  color: string;
  pageWise: boolean;
  showTotal: boolean;
}

export interface Condition {
  /** Predicate string — supports `>`, `>=`, `<`, `<=`, `=`, `!=`, `contains:…` */
  when: string;
  usePreset?: string;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  bgColor?: string;
}

export interface Column {
  _id: string;
  header: string;
  dataKey: string;
  headerPreset: string;
  dataPreset?: string;
  align: Align;
  /** Flex ratio (relative units), NOT a physical width. Pass-through to PDF. */
  width: number;
  format: string | null;
  decimals?: number;
  rounding?: "none" | "floor" | "ceil" | "round";
  aggregate?: Aggregate;
  conditions?: Condition[];
}
