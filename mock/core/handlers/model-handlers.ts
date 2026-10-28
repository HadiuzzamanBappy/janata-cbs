import "server-only";

import { SC_FORM_CONFIG, SC_MODEL_CONFIG } from "@mock/db";
import type { CbsWirePayload } from "@/lib/data-schemas";
import { type ApiResponse, CbsControlTable } from "@/types";
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
 * Accessor retrieving explicit Form Configuration layout or falling back to Model schema.
 */
export function getMockFormPayload(command: string): unknown {
  const clean = command.trim().toUpperCase();
  const baseModel = clean.split(",")[0].trim();

  // 1. Resolve base Model definition
  const model = resolveModelDefinition(baseModel);
  if (!model) return null;

  // 2. Resolve visual layout from SC_FORM_CONFIG table
  const formTable = resolveTable(CbsControlTable.FORM_CONFIG);
  const formLayout =
    formTable?.LIVE[clean] ||
    formTable?.LIVE[baseModel] ||
    SC_FORM_CONFIG[clean] ||
    SC_FORM_CONFIG[baseModel] ||
    {};

  // 3. Return combined GfcResponse wire envelope: Model metadata + FORMCONTROL layout
  return {
    ...model,
    FORMCONTROL: formLayout,
  };
}

/**
 * Handles GMC (Get Model Configuration) - Returns pure Model definition schema.
 */
export function handleGetModelConfig(payload: CbsWirePayload): ApiResponse {
  const target = (payload.recordId || payload.controlName || "").trim().toUpperCase();
  const baseModel = target.split(",")[0].trim();

  const modelPayload = resolveModelDefinition(baseModel);
  if (!modelPayload) {
    return notFoundResult(`Model configuration for "${target}" not found`);
  }

  return successResult(modelPayload, `Model schema for ${target} loaded from simulated database`);
}

/**
 * Handles GFC (Get Form Configuration).
 * Returns the canonical combined GfcResponse envelope:
 * The base ModelConfigRecord + nested FORMCONTROL layout.
 */
export function handleGetFormConfig(payload: CbsWirePayload): ApiResponse {
  const target = (payload.recordId || payload.controlName || "").trim().toUpperCase();
  const combinedPayload = getMockFormPayload(target);

  if (!combinedPayload) {
    return notFoundResult(`Form specification for "${target}" not found`);
  }

  return successResult(
    combinedPayload,
    `Form specification for ${target} loaded from simulated database`,
  );
}
