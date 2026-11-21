import {
  type INQInfo,
  type InquiryFieldType,
  isOperandAllowed,
  type SelectionOperand,
} from "@/lib/data-schemas";

export interface InquiryOperandOption {
  readonly value: SelectionOperand;
  readonly label: string;
}

/** Every operand the core accepts (`INQUIRY_OPERANDS`), with its label for the filter screen. */
export const INQUIRY_OPERAND_OPTIONS: readonly InquiryOperandOption[] = [
  { value: "EQ", label: "Equal to" },
  { value: "GT", label: "Greater than" },
  { value: "LT", label: "Less than" },
  { value: "GE", label: "Greater than or equal" },
  { value: "LE", label: "Less than or equal" },
  { value: "RG", label: "Between" },
  { value: "CT", label: "Contains" },
  { value: "SW", label: "Starts with" },
  { value: "EW", label: "Ends with" },
  { value: "NE", label: "Not equal to" },
  { value: "LK", label: "Like (*)" },
];

/** The operands a filter of this type offers (pattern operands are text-only). */
export function operandOptionsFor(type: InquiryFieldType): readonly InquiryOperandOption[] {
  return INQUIRY_OPERAND_OPTIONS.filter((o) => isOperandAllowed(type, o.value));
}

/** Rows per page when `INQInfo.perpageItem` isn't a positive whole number. */
const DEFAULT_PAGE_SIZE = 30;

/** An unpaged inquiry (`showPagination` off) is still paged above this many rows. */
export const INQUIRY_UNPAGED_MAX_ROWS = 500;

/** The inquiry's page size (`INQInfo.perpageItem`). */
export function inquiryPageSize(info: Pick<INQInfo, "perpageItem">): number {
  const size = Number(info.perpageItem);
  return Number.isInteger(size) && size > 0 ? size : DEFAULT_PAGE_SIZE;
}
