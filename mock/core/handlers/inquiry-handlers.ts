import "server-only";

import { SC_MODEL_CONFIG } from "@mock/db";
import type { CbsWirePayload } from "@/lib/data-schemas";
import { type ApiResponse, CbsControlTable } from "@/types";
import { resolveTable } from "../database-router";
import { successResult } from "../response-factory";

/**
 * Accessor generating inquiry presentation schema (columns, filters, actions)
 * from explicit inquiry configuration or dynamically synthesized from Model properties.
 */
export function getMockInquiryPayload(command: string): unknown {
  const clean = command
    .trim()
    .toUpperCase()
    .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
    .replace(/^(?:[SRIDAH]\s+)/i, "")
    .trim();

  // 1. If explicit Inquiry Config exists in database, return it
  const inqTable = resolveTable(CbsControlTable.INQUIRY_CONFIG);
  if (inqTable?.LIVE[clean]) {
    return inqTable.LIVE[clean];
  }

  // 2. Fallback: Synthesize raw Model Inquiry dynamically from MODEL.CONFIG properties
  const modelTable = resolveTable(CbsControlTable.MODEL_CONFIG);
  const model = (modelTable?.LIVE[clean] ||
    SC_MODEL_CONFIG[clean] ||
    Object.values(SC_MODEL_CONFIG).find(
      (m) => m.TABLENAME === clean || `${m.PREFIX}_${m.TABLENAME}` === clean,
    )) as (typeof SC_MODEL_CONFIG)[keyof typeof SC_MODEL_CONFIG] | undefined;

  if (!model) return null;

  const rawProps = Array.isArray(model.PROPERTIES) ? model.PROPERTIES : [];

  // Build inquiry columns from model properties
  const columns = rawProps.map((prop) => {
    const isAmount = prop.TYPE?.toLowerCase() === "amount";
    const isDate = prop.TYPE?.toLowerCase() === "date";
    const isNumber = prop.TYPE?.toLowerCase() === "number";

    return {
      id: prop.NAME,
      label: prop.LABEL || prop.NAME,
      align: isAmount || isNumber ? "right" : isDate ? "center" : "left",
      width: isAmount ? "140px" : isDate ? "120px" : "150px",
      format: isAmount ? "amount" : isDate ? "date" : "text",
      isMono: Boolean(prop.NAME.toLowerCase().includes("id") || prop.SN === "1"),
      sortable: true,
      visible: true,
      isPinned: false,
    };
  });

  // Build inquiry filters from active model properties
  const filters = rawProps
    .filter((prop) => !prop.DISABLED)
    .map((prop) => {
      const pType = prop.TYPE?.toLowerCase();
      const filterType =
        pType === "date" ? "date" : pType === "number" || pType === "amount" ? "number" : "text";

      return {
        id: prop.NAME,
        label: prop.LABEL || prop.NAME,
        type: filterType,
        defaultOperand: "EQ",
        defaultValue: "",
        required: Boolean(prop.REQUIRED),
      };
    });

  return {
    id: clean,
    code: clean,
    title: `${model.DESCRIPTION || clean} Inquiry`,
    description: `Auto-generated raw model inquiry for ${clean}`,
    controllerName: clean,
    pageOrientation: "Landscape",
    showSerial: true,
    showPagination: true,
    columns,
    filters,
    actions: [
      {
        id: "view_rec",
        label: "View",
        targetCommand: clean,
        actionType: "view",
        icon: "eye",
        openMode: "tab",
      },
      {
        id: "edit_rec",
        label: "Edit",
        targetCommand: clean,
        actionType: "edit",
        icon: "edit",
        openMode: "tab",
      },
    ],
  };
}

/**
 * Handles INQ (Dynamic Inquiry Execution).
 */
export function handleInquiry(payload: CbsWirePayload): ApiResponse {
  const cleanKey = (payload.controlName || payload.recordId || "").trim().toUpperCase();
  const inqTable = resolveTable(CbsControlTable.INQUIRY_CONFIG);
  const inqSpec = inqTable?.LIVE[cleanKey] as Record<string, unknown> | undefined;

  if (inqSpec) {
    const targetModel = String(inqSpec.controllerName || inqSpec.targetModel || cleanKey)
      .trim()
      .toUpperCase();
    const table = resolveTable(targetModel);
    return successResult(table?.getList() ?? [], "Inquiry data loaded from canonical table");
  }

  // Fallback: If querying a direct table name through INQ (e.g. INQ ACCOUNT)
  const directTable = resolveTable(cleanKey);
  if (directTable) {
    return successResult(directTable.getList(), `Inquiry data loaded for ${cleanKey}`);
  }

  return successResult([], "No inquiry records found in fixture");
}
