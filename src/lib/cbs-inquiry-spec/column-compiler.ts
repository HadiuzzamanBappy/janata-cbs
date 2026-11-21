import type { INQDef } from "@/lib/data-schemas";

export interface ParsedColumnLength {
  length: number;
  alignCode: "L" | "R" | "C";
  align: "left" | "right" | "center";
}

export interface ParsedColumnCoordinates {
  row: number;
  col: number;
}

export type ColumnFormat = "text" | "currency" | "date" | "number";

export interface DerivedColumnMeta {
  id: string;
  label: string;
  align: "left" | "right" | "center";
  width: string;
  format: ColumnFormat;
  isMono: boolean;
  row: number;
  order: number;
  canPass: boolean;
  routine?: string;
}

/**
 * Parses a CBS column length & alignment specifier (e.g. "20,L" or "150,R"). A length that isn't
 * a positive whole number falls back to 20.
 */
export function parseColumnLength(fieldLength?: string): ParsedColumnLength {
  const [lenPart, alignPart] = (fieldLength || "20,L").split(",");
  const parsed = Number.parseInt(lenPart?.trim() || "20", 10);
  const length = parsed > 0 ? parsed : 20;
  const rawAlign = alignPart?.trim().toUpperCase() || "L";
  const alignCode: "L" | "R" | "C" = rawAlign === "R" || rawAlign === "C" ? rawAlign : "L";
  const align: "left" | "right" | "center" =
    alignCode === "R" ? "right" : alignCode === "C" ? "center" : "left";

  return { length, alignCode, align };
}

/**
 * Formats column length and alignment code into CBS wire format (e.g. "20,L").
 */
export function formatColumnLength(length: number, alignCode: "L" | "R" | "C" = "L"): string {
  const cleanLen = Math.max(1, Math.trunc(Number(length)) || 20);
  const cleanAlign = alignCode === "R" || alignCode === "C" ? alignCode : "L";
  return `${cleanLen},${cleanAlign}`;
}

/**
 * Parses CBS multi-line coordinate string (e.g. "1,2" -> row 1, col 2).
 */
export function parseColumnCoordinates(fieldRowCol?: string): ParsedColumnCoordinates {
  const [rowStr, colStr] = (fieldRowCol || "1,1").split(",");
  const row = Math.max(1, Number.parseInt(rowStr?.trim() || "1", 10) || 1);
  const col = Math.max(1, Number.parseInt(colStr?.trim() || "1", 10) || 1);
  return { row, col };
}

/**
 * Formats grid row and column into CBS wire coordinate format (e.g. "1,2").
 */
export function formatColumnCoordinates(row: number, col: number): string {
  const cleanRow = Math.max(1, Math.trunc(Number(row)) || 1);
  const cleanCol = Math.max(1, Math.trunc(Number(col)) || 1);
  return `${cleanRow},${cleanCol}`;
}

/**
 * The display format a column's conversion routine (`fieldFunc`) asks for, matched on whole routine
 * tokens (`DATE.CONVERT` → date, `AMT` → currency). Without one, a right-aligned column is a
 * number. Date is checked first, so `CURRDATE` is a date, not an amount.
 */
function formatOf(fieldFunc: string, alignCode: ParsedColumnLength["alignCode"]): ColumnFormat {
  const func = fieldFunc.trim().toUpperCase();
  const tokens = func.split(/[^A-Z]+/).filter(Boolean);
  if (func === "D" || tokens.some((t) => t.endsWith("DATE"))) return "date";
  if (tokens.some((t) => t === "AMT" || t === "AMOUNT" || t.startsWith("CURR"))) return "currency";
  return alignCode === "R" ? "number" : "text";
}

/**
 * Compiles a canonical CBS INQDef wire spec into presentation metadata for UI tables, from the
 * config only (no guessing from field names). Amounts and numbers are always right-aligned; they,
 * dates and centered codes are monospaced.
 */
export function deriveInquiryColumnMeta(col: INQDef): DerivedColumnMeta {
  const { length, alignCode, align: configuredAlign } = parseColumnLength(col.fieldLength);
  const { row, col: order } = parseColumnCoordinates(col.fieldRowCol);
  const format = formatOf(col.fieldFunc, alignCode);
  const isNumeric = format === "currency" || format === "number";
  const align = isNumeric ? "right" : configuredAlign;

  return {
    id: col.fieldName,
    label: col.fieldDisplay.trim() || col.fieldName,
    align,
    width: `${Math.max(length * 9, 80)}px`,
    format,
    isMono: isNumeric || format === "date" || align === "center",
    row,
    order,
    canPass: col.dataPassable,
    routine: col.fieldFunc.trim() || undefined,
  };
}
