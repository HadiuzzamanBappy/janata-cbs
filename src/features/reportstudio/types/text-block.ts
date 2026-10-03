import type { Align, Font } from "./primitives";

/**
 * One styled segment produced by `deltaToParas` from a Quill Delta op.
 * Carries inline formatting so the PDF renderer can use per-run font sizes,
 * bold, colour, etc. -- even when a paragraph contains mixed formatting.
 */
export interface ParagraphRun {
  text: string;
  /** pt font size; undefined -> inherit paragraph fontSize */
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  font?: Font;
}

/**
 * TEXT_BLOCK content model.
 *
 * Storage layers (oldest -> newest):
 *   - `paragraphs[]` -- flat list of styled lines. Derived from Delta on save;
 *     fed directly to the PDF renderer.
 *   - `quillDelta`   -- primary rich-text store when the inline Quill editor
 *     is active. Round-tripped back to `paragraphs[]` via
 *     `data/deltaToParas` so the PDF path stays paragraphs-based.
 *
 * The PDF renderer reads `paragraphs[]` and only consults `tableData` when
 * `isTable === true`.
 */

export interface VarStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** Hex, e.g. "#dc2626" */
  color?: string;
  /** pt override; if omitted, inherits the paragraph fontSize. */
  fontSize?: number;
  /** Highlight colour, e.g. "#fef9c3" */
  background?: string;
}

/** A named placeholder mapped to a datasource column. */
export interface ReportVariable {
  _id: string;
  name: string;
  /**
   * Reference to the source rows. Format:
   *   "comp:<componentId>"  -> componentDataSources[componentId]
   *   "central:<key>"       -> centralData[key]
   * Undefined -> fall back to the owning component's data.
   */
  dataSourceRef?: string;
  columnKey: string;
  staticValue?: string;
  style?: VarStyle;
}

export interface Paragraph {
  _id: string;
  text: string;
  font: Font;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  fontSize: number;
  fontColor: string;
  align: Align;
  spacingAfter: number;
  lineHeight?: number;
  /** Set by `deltaToParas` for embedded tables. */
  isTable?: boolean;
  tableData?: string[][];
  /** Quill-table style snapshot kept for legacy Delta payloads. */
  tableStyle?: Record<string, any> | null;
  /**
   * Per-run inline styles extracted from the Quill Delta ops by `deltaToParas`.
   * Populated for every non-table paragraph; absent on legacy paragraphs stored
   * before this field existed.
   * The PDF renderer uses these instead of the paragraph-level fontSize / bold
   * etc. so that mixed formatting within a single line renders correctly.
   */
  inlineRuns?: ParagraphRun[];
}

/**
 * Minimal structural type for Quill Delta payloads. We avoid pulling Quill's
 * types in here because Quill is loaded at runtime from CDN (see
 * `lib/quill-loader.ts`) and never compiled in.
 */
export interface QuillDeltaOp {
  insert: string | Record<string, any>;
  attributes?: Record<string, any>;
  retain?: number;
  delete?: number;
}

export interface QuillDelta {
  ops: QuillDeltaOp[];
}

/** Run produced by `resolveVariablesToRuns` for the PDF renderer. */
export interface VariableRun {
  text: string;
  varStyle?: VarStyle;
}
