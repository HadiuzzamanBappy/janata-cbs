import { STATIC_MODELS } from "@fixtures";
import type { EnquiryColumn, EnquirySchema, SelectionField, SelectionOperand } from "./types";

export function getEnquirySchema(code: string): EnquirySchema {
  const clean = code.trim().toUpperCase();
  // Strip action prefix "INQ S ", "INQ ", "ENQ ", "INQUIRY " to match canonical table name
  const canonicalKey = clean
    .replace(/^(INQ\s+S\s+|INQ\s+|ENQ\s+|INQUIRY\s+)/i, "")
    .trim();

  const rawModel = STATIC_MODELS[canonicalKey] || STATIC_MODELS[clean];

  if (rawModel) {
    const title = rawModel.DESCRIPTION || clean;
    const selectionFields: SelectionField[] = (rawModel.PROPERTIES || []).map((prop) => {
      const typeStr = (prop.TYPE || "VARCHAR").toUpperCase();
      const isSelect = Array.isArray(prop.DATASOURCE) && prop.DATASOURCE.length > 0;
      const isDate = typeStr === "DATE";
      const isNum = typeStr === "NUMERIC" || typeStr === "NUMBER";

      const fieldType = isSelect ? "select" : isDate ? "date" : isNum ? "number" : "text";
      const operand: SelectionOperand = isDate ? "RG" : isSelect ? "EQ" : "LK";

      return {
        id: prop.NAME || "FIELD",
        label: prop.LABEL || prop.NAME || "Field",
        type: fieldType,
        operand,
        value: "",
        options: isSelect
          ? prop.DATASOURCE!.map((opt) => ({ label: opt, value: opt }))
          : undefined,
      };
    });

    const columns: EnquiryColumn[] = rawModel.COLUMNS || (rawModel.PROPERTIES || []).map((prop) => ({
      id: (prop.NAME || "col").toLowerCase().replace(/[^a-zA-Z0-9]/g, "_"),
      label: prop.LABEL || prop.NAME || "Column",
    }));

    return {
      code: clean,
      title,
      description: rawModel.DESCRIPTION,
      selectionFields,
      columns,
    };
  }

  // Graceful fallback for unspecified enquiries
  return {
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
  };
}
