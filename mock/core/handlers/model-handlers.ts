import "server-only";

import { SC_FORM_CONFIG, SC_MODEL_CONFIG } from "@mock/db";
import type { ApiResponse, CbsWirePayload } from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction } from "@/types";
import { resolveTable } from "../database-router";
import { notFoundResult, successResult } from "../response-factory";

/**
 * Resolves base ModelConfigRecord definition from database or master schema.
 */
function resolveModelDefinition(modelKey: string) {
  const clean = modelKey.trim().toUpperCase();
  const baseModel = clean.split(",")[0].trim();
  const modelTable = resolveTable(CbsControlTable.MODEL_CONFIG);

  return (
    modelTable?.LIVE[baseModel] ||
    modelTable?.LIVE[clean] ||
    SC_MODEL_CONFIG[baseModel] ||
    SC_MODEL_CONFIG[clean] ||
    Object.values(SC_MODEL_CONFIG).find(
      (m) => m.TABLENAME === baseModel || `${m.PREFIX}_${m.TABLENAME}` === baseModel,
    ) ||
    null
  );
}

/**
 * The model plus the form entry a GFC names, as the core sends them: `ACCOUNT` and `ACCOUNT,` read
 * the entry "ACCOUNT", and `ACCOUNT,1.0.0` reads only that version (a new version starts with no
 * layout, never the base one). Authorize (`A`) reads the pending copy first, as GET does.
 */
export function getMockFormPayload(command: string, recordFunction?: string): unknown {
  const clean = command.trim().toUpperCase();
  const [baseModel = "", version = ""] = clean.split(",").map((part) => part.trim());
  const entryId = version ? `${baseModel},${version}` : baseModel;

  // 1. Resolve base Model definition
  const model = resolveModelDefinition(baseModel);
  if (!model) return null;

  // 2. Resolve visual layout from SC_FORM_CONFIG table
  const formTable = resolveTable(CbsControlTable.FORM_CONFIG);
  const pending = formTable?.table?.INAU as Record<string, Record<string, unknown>> | undefined;
  const formLayout =
    (recordFunction === CbsRecordFunction.AUTHORIZE ? pending?.[entryId] : undefined) ||
    formTable?.LIVE[entryId] ||
    SC_FORM_CONFIG[entryId] ||
    {};

  // 3. Return combined GfcResponse wire envelope: Model metadata + FORMCONTROL layout
  return {
    ...model,
    FORMCONTROL: formLayout,
  };
}

/**
 * Handles GFC (Get Form Configuration).
 * Returns the canonical combined GfcResponse envelope:
 * The base ModelConfigRecord + nested FORMCONTROL layout.
 */
export function handleGetFormConfig(payload: CbsWirePayload): ApiResponse {
  const target = (payload.recordId || payload.controlName || "").trim().toUpperCase();
  const combinedPayload = getMockFormPayload(target, payload.recordFunction);

  if (!combinedPayload) {
    return notFoundResult(`Form specification for "${target}" not found`);
  }

  return successResult(
    combinedPayload,
    `Form specification for ${target} loaded from simulated database`,
  );
}
