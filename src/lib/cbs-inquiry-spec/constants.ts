import type { SelectionOperand } from "@/lib/data-schemas";

export type { SelectionOperand };

export interface InquiryOperandOption {
  value: SelectionOperand;
  label: string;
  badge: string;
}

export const INQUIRY_OPERAND_OPTIONS: InquiryOperandOption[] = [
  { value: "EQ", label: "Equal to", badge: "EQ" },
  { value: "GT", label: "Greater than", badge: "GT" },
  { value: "LT", label: "Less than", badge: "LT" },
  { value: "GE", label: "Greater than or equal", badge: "GE" },
  { value: "LE", label: "Less than or equal", badge: "LE" },
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

export const STANDARD_BANKING_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All Statuses" },
  { value: "AU", label: "Authorized (AU)" },
  { value: "INA", label: "Inactive / Input (INA)" },
  { value: "DEL", label: "Deleted (DEL)" },
  { value: "HLD", label: "On Hold (HLD)" },
  { value: "LIVE", label: "Live (LIVE)" },
];

export const STANDARD_BOOLEAN_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "Y", label: "Yes (Y)" },
  { value: "N", label: "No (N)" },
];
