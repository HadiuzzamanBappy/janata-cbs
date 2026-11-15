import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";

export interface ParsedColumnLength {
  length: number;
  alignCode: "L" | "R" | "C";
  align: "left" | "right" | "center";
}

export interface ParsedColumnCoordinates {
  row: number;
  col: number;
}

export interface DerivedColumnMeta {
  id: string;
  label: string;
  align: "left" | "right" | "center";
  width: string;
  format: "text" | "currency" | "date" | "number" | "badge" | "account";
  isMono: boolean;
  row: number;
  order: number;
  canPass: boolean;
  routine?: string;
}

/**
 * Parses a CBS column length & alignment specifier (e.g. "20,L" or "150,R").
 */
export function parseColumnLength(fieldLength?: string): ParsedColumnLength {
  const [lenPart, alignPart] = (fieldLength || "20,L").split(",");
  const length = Number.parseInt(lenPart?.trim() || "20", 10) || 20;
  const rawAlign = (alignPart?.trim().toUpperCase() || "L") as "L" | "R" | "C";
  const alignCode: "L" | "R" | "C" = rawAlign === "R" || rawAlign === "C" ? rawAlign : "L";
  const align: "left" | "right" | "center" =
    alignCode === "R" ? "right" : alignCode === "C" ? "center" : "left";

  return { length, alignCode, align };
}

/**
 * Formats column length and alignment code into CBS wire format (e.g. "20,L").
 */
export function formatColumnLength(length: number, alignCode: "L" | "R" | "C" = "L"): string {
  const cleanLen = Math.max(1, Number(length) || 20);
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
  const cleanRow = Math.max(1, Number(row) || 1);
  const cleanCol = Math.max(1, Number(col) || 1);
  return `${cleanRow},${cleanCol}`;
}

/**
 * Compiles a canonical CBS INQDef wire spec into presentation metadata for UI tables.
 * Keeps data-schemas pure and isolates display math to the specification compiler.
 */
export function deriveInquiryColumnMeta(col: INQDef): DerivedColumnMeta {
  const { length, alignCode, align } = parseColumnLength(col.fieldLength);
  const { row, col: order } = parseColumnCoordinates(col.fieldRowCol);

  // Map CBS conversion routines or semantic field names to UI display format
  const funcUpper = col.fieldFunc?.toUpperCase() || "";
  const nameLower = col.fieldName.toLowerCase();

  let format: "text" | "currency" | "date" | "number" | "badge" | "account" = "text";
  if (funcUpper.includes("AMT") || nameLower.includes("balance") || nameLower.includes("amount")) {
    format = "currency";
  } else if (funcUpper.includes("DATE") || nameLower.includes("date")) {
    format = "date";
  } else if (alignCode === "R") {
    format = "number";
  } else if (nameLower === "status" || nameLower.endsWith("status")) {
    format = "badge";
  } else if (nameLower.includes("account") || nameLower.includes("accno")) {
    format = "account";
  }

  const isMono =
    align === "right" ||
    nameLower.includes("id") ||
    nameLower.includes("ref") ||
    nameLower.includes("date") ||
    nameLower.includes("account");

  return {
    id: col.fieldName,
    label: col.fieldDisplay,
    align,
    width: `${Math.max(length * 9, 80)}px`,
    format,
    isMono,
    row,
    order,
    canPass: Boolean(col.dataPassable),
    routine: col.fieldFunc?.trim() || undefined,
  };
}
