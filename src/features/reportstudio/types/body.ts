import type { Radius, Spacing } from "./primitives";
import type { Column, TableStyle } from "./table";
import type { ChartSeries, ChartType, ChartTitleAlign } from "./chart";
import type { Paragraph, QuillDelta } from "./text-block";

/**
 * Body components — the four block kinds that flow inside the report body.
 *
 * Each component belongs to exactly one `BodyRow` and one slot within that
 * row (unless `freePosition: true`, in which case rowId/slotIndex are
 * preserved on `_origRowId` / `_origSlotIndex` so the original placement can
 * be restored).
 *
 * Units: layout-related fields (`width`, `height`, `margin`, `padding`,
 * `freeX`, `freeY`, `freeWidth`, `imageWidth`, `imageHeight`) are in **mm**
 * and converted to pt in `data/buildReportJson`.
 */

export type BodyCompType = "TABLE" | "CHART" | "IMAGE" | "TEXT_BLOCK";

export interface BodyComponent {
  _id: string;
  type: BodyCompType;
  label?: string;
  hidden?: boolean;
  locked?: boolean;
  /** mm, optional explicit height. */
  height?: number;
  /** mm, explicit width (overrides flex in flow mode). */
  width?: number;
  aspectLock?: boolean;
  margin?: Spacing;
  /** Inner padding around component content. */
  padding?: Spacing;

  // Row-layout linkage
  rowId: string;
  slotIndex: number;
  /** Percentage width override; null/undefined means equal flex. */
  flexBasis?: number;

  // Free positioning (absolute within body)
  freePosition?: boolean;
  /** mm from left content edge. */
  freeX?: number;
  /** mm from top of body area. */
  freeY?: number;
  /** mm width when in free-position mode. */
  freeWidth?: number;
  _origRowId?: string;
  _origSlotIndex?: number;

  /** Reference to a key in `AppState.centralData`. */
  dataSourceKey?: string;

  // ── TABLE-specific ───────────────────────────────────────────────
  tableColumns?: Column[];
  tableStyle?: TableStyle;
  tableOddRowBg?: string;
  tableDataType?: "list" | "database" | "api";
  tableDataRows?: Record<string, any>[];
  tableDbQuery?: string;
  tableApiUrl?: string;
  tableApiMethod?: "GET" | "POST";
  tableApiBody?: string;
  tableApiHeaders?: string;

  // ── CHART-specific ───────────────────────────────────────────────
  chartType?: ChartType;
  chartTitle?: string;
  chartTitleFontSize?: number;
  chartTitleBold?: boolean;
  chartTitleItalic?: boolean;
  chartTitleColor?: string;
  chartTitleAlign?: ChartTitleAlign;
  chartSeries?: ChartSeries[];
  chartLabelKey?: string;
  chartShowLegend?: boolean;
  chartShowGrid?: boolean;
  chartShowValues?: boolean;
  chartShowScale?: boolean;
  chartCategories?: string[];
  chartBg?: string;

  // ── IMAGE-specific (mirrors LOGO) ────────────────────────────────
  imagePath?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlign?: "LEFT" | "CENTER" | "RIGHT";
  imageRotation?: number;
  imageOpacity?: number;
  imageCaption?: string;
  imageCaptionColor?: string;
  imageCaptionSize?: number;
  imageCaptionAlign?: string;
  imageRadius?: Radius;
  imageBorder?: { enabled?: boolean; color?: string; width?: number; style?: string };

  // ── TEXT_BLOCK-specific ──────────────────────────────────────────
  paragraphs?: Paragraph[];
  /** Quill Delta JSON — primary rich-text store when the inline editor is used. */
  quillDelta?: QuillDelta | any;
  textBg?: string;
  textPadding?: Spacing;
  textBorderEnabled?: boolean;
  textBorderColor?: string;
  textBorderWidth?: number;
  textBorderStyle?: string;
  textRadius?: Radius;

  /**
   * Per-table datasource bindings (keyed by the table's positional index
   * among tables inside `quillDelta`).
   *
   * `colMap[ci]` = datasource field name for table column `ci` ("" to skip).
   * `style` is a Quill-table style snapshot (separate from `TableStyle`).
   */
  tableBindings?: Record<
    number,
    { dsRef: string; arrayField: string; colMap: string[]; style?: Record<string, any> }
  >;

  /**
   * Repeat behaviour for TEXT_BLOCK:
   *   "none"     — render once (default).
   *   "inline"   — one copy per row, stacked in page flow.
   *   "new-page" — one copy per row, each on a new page.
   */
  repeatMode?: "none" | "inline" | "new-page";
  /** Same ref format as `ReportVariable.dataSourceRef`. */
  repeatDataSourceRef?: string;
  /** mm gap between copies when `repeatMode === "inline"`. */
  repeatGap?: number;
}

/** Row container — holds N column slots. */
export interface BodyRow {
  _id: string;
  label?: string;
  cols: number;
  gap?: number;
  height?: number;
  background?: string;
  padding?: Spacing;
  margin?: Spacing;
  hidden?: boolean;
  locked?: boolean;
}
