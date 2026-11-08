import type { SelectionOperand } from "./types";

export const INQUIRY_OPERAND_OPTIONS: Array<{
  value: SelectionOperand;
  label: string;
  badge: string;
}> = [
  { value: "EQ", label: "Equal to", badge: "EQ" },
  { value: "GT", label: "Greater then", badge: "GT" },
  { value: "LT", label: "Less then", badge: "LT" },
  { value: "GE", label: "Greater then or equal", badge: "GE" },
  { value: "LE", label: "Less then or equal", badge: "LE" },
  { value: "RG", label: "Between", badge: "RG" },
  { value: "CT", label: "Contains", badge: "CT" },
  { value: "SW", label: "Start with", badge: "SW" },
  { value: "EW", label: "End with", badge: "EW" },
  { value: "NE", label: "Not equal to", badge: "NE" },
  { value: "LK", label: "Like (*)", badge: "LK" },
];

export const INQUIRY_FILTER_FIELD_TYPES = [
  { value: "text", label: "Text String (CHAR)" },
  { value: "number", label: "Numeric / Amount" },
  { value: "date", label: "Date (YYYYMMDD)" },
  { value: "select", label: "Dropdown Options" },
] as const;
