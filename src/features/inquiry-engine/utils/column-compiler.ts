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
    alignCode === "R" || col.fieldType === "AM" || col.fieldType === "NR"
      ? "right"
      : alignCode === "C" || col.fieldType === "DT"
        ? "center"
        : "left";

  // 2. Parse coordinate position ("1,1" -> row 1, order 1)
  const [rowStr, colStr] = (col.fieldRowCol || "1,1").split(",");
  const row = Number.parseInt(rowStr || "1", 10) || 1;
  const order = Number.parseInt(colStr || "1", 10) || 1;

  // 3. Map CBS Type to UI Format
  const typeUpper = (col.fieldType || "CH").toUpperCase();
  let format: "text" | "currency" | "date" | "number" | "badge" | "account" = "text";
  if (typeUpper === "AM") format = "currency";
  else if (typeUpper === "DT") format = "date";
  else if (typeUpper === "NR") format = "number";
  else if (typeUpper === "BDG") format = "badge";
  else if (typeUpper === "ACC") format = "account";

  const isMono =
    typeUpper === "AM" ||
    typeUpper === "ACC" ||
    col.fieldName.toLowerCase().includes("id") ||
    col.fieldName.toLowerCase().includes("ref") ||
    col.fieldName.toLowerCase().includes("date");

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
  };
}
