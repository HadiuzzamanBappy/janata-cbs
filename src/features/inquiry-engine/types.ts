import type {
  EnquiryRow,
  INQCmd,
  INQDef,
  INQSelectField,
} from "@/lib/data-schemas/inquiry-config-schema";

export type SelectionOperand = "EQ" | "LK" | "RG" | "NE" | "GT" | "LT" | "CT";

export interface FilterCriterion {
  value: string;
  operand: SelectionOperand;
}

export type FilterCriteriaMap = Record<string, FilterCriterion>;

export interface InquiryTableProps {
  columns: INQDef[];
  rows: EnquiryRow[];
  commands?: INQCmd[];
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalRows?: number;
  showSerial?: boolean;
  className?: string;
}

export interface InquiryFilterBarProps {
  fields: INQSelectField[];
  criteria?: FilterCriteriaMap;
  onCriteriaChange?: (criteria: FilterCriteriaMap) => void;
  onSearch: (criteria: FilterCriteriaMap) => void;
  onReset: () => void;
  loading?: boolean;
}

