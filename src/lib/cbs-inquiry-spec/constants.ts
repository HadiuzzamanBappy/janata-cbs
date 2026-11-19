import type { SelectionOperand } from "@/lib/data-schemas";

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
