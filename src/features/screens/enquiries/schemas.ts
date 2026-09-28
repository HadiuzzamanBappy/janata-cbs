import { STATIC_ENQUIRIES } from "@fixtures";
import type { EnquirySchema } from "./types";

export const MOCK_ENQUIRIES = STATIC_ENQUIRIES;

export function getEnquirySchema(code: string): EnquirySchema {
  const clean = code.trim().toUpperCase();
  return (
    STATIC_ENQUIRIES[clean] || {
      code: clean,
      title: `${clean} Enquiry`,
      description: `Default enquiry view for ${clean}`,
      selectionFields: [
        { id: "RECORD.ID", label: "Record ID / Key", type: "text", operand: "LK", value: "" },
      ],
      columns: [
        { id: "id", label: "Reference ID", isMono: true, isDrilldown: true },
        { id: "description", label: "Description" },
        { id: "status", label: "Status", align: "center" },
      ],
      sampleData: [
        { id: "REC-1001", description: "Sample record row 1", status: "AUTHORIZED" },
        { id: "REC-1002", description: "Sample record row 2", status: "UNAUTHORIZED" },
      ],
    }
  );
}
