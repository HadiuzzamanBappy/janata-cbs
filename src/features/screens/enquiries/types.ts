export type SelectionOperand = "EQ" | "LK" | "RG" | "NE" | "GT" | "LT";

export interface SelectionField {
  id: string;
  label: string;
  type: "text" | "select" | "date" | "number";
  operand: SelectionOperand;
  value: string;
  options?: Array<{ label: string; value: string }>;
}

export interface EnquiryColumn {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
  isMono?: boolean;
  isDrilldown?: boolean;
  drilldownTargetCommand?: string;
}

export interface EnquiryRow {
  id: string;
  [key: string]: unknown;
}

export interface EnquirySchema {
  code: string; // e.g. ENQ USER.LIST or ENQ STMT.ENT.BOOK
  title: string; // e.g. System Users Enquiry
  description?: string;
  selectionFields: SelectionField[];
  columns: EnquiryColumn[];
  sampleData?: EnquiryRow[];
}
