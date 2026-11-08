import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";

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
 * Compiles a canonical CBS INQDef wire spec into presentation metadata for UI tables.
 * Keeps data-schemas pure and isolates display math to the presentation layer.
 */
export function deriveInquiryColumnMeta(col: INQDef): DerivedColumnMeta {
  // 1. Parse "20,L" or "150,R"
  const [lenPart, alignPart] = (col.fieldLength || "20,L").split(",");
  const charLength = Number.parseInt(lenPart?.trim() || "20", 10) || 20;
  const alignCode = (alignPart?.trim().toUpperCase() || "L") as "L" | "R" | "C";

  const align: "left" | "right" | "center" =
    alignCode === "R" ? "right" : alignCode === "C" ? "center" : "left";

  // 2. Parse coordinate position ("1,1" -> row 1, order 1)
  const [rowStr, colStr] = (col.fieldRowCol || "1,1").split(",");
  const row = Number.parseInt(rowStr || "1", 10) || 1;
  const order = Number.parseInt(colStr || "1", 10) || 1;

  // 3. Map CBS conversion routines or semantic field names to UI display format
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
    width: `${Math.max(charLength * 9, 80)}px`,
    format,
    isMono,
    row,
    order,
    canPass: Boolean(col.dataPassable),
    routine: col.fieldFunc?.trim() || undefined,
  };
}
