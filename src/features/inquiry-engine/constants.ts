import type { SelectionOperand } from "./types";

export const INQUIRY_OPERAND_OPTIONS: Array<{
  value: SelectionOperand;
  label: string;
  badge: string;
}> = [
  { value: "EQ", label: "Equals (=)", badge: "EQ" },
  { value: "LK", label: "Like (*)", badge: "LK" },
  { value: "RG", label: "Range (Between)", badge: "RG" },
  { value: "NE", label: "Not Equal (≠)", badge: "NE" },
  { value: "GT", label: "Greater Than (>)", badge: "GT" },
  { value: "LT", label: "Less Than (<)", badge: "LT" },
  { value: "CT", label: "Contains (Substring)", badge: "CT" },
];

export const INQUIRY_FILTER_FIELD_TYPES = [
  { value: "text", label: "Text String (CHAR)" },
  { value: "number", label: "Numeric / Amount" },
  { value: "date", label: "Date (YYYYMMDD)" },
  { value: "select", label: "Dropdown Options" },
] as const;
