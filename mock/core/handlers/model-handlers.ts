import "server-only";

import { SC_MODEL_CONFIG } from "@mock/db";
import type { CbsWirePayload } from "@/lib/data-schemas";
import { type ApiResponse, CbsControlTable } from "@/types";
import { resolveTable } from "../database-router";
import { notFoundResult, successResult } from "../response-factory";

/**
 * Accessor retrieving explicit Form Configuration layout or falling back to Model schema.
 */
export function getMockFormPayload(command: string): unknown {
  const clean = command.trim().toUpperCase();

  // 1. If explicit Form Config exists (e.g. ACCOUNT,1.0.0 or USER,1.0.0), return layout
  const formTable = resolveTable(CbsControlTable.FORM_CONFIG);
  if (formTable?.LIVE[clean]) {
    return formTable.LIVE[clean];
  }

  // 2. Otherwise return base Model Config
  const baseModel = clean.split(",")[0].trim();
  const modelTable = resolveTable(CbsControlTable.MODEL_CONFIG);
  if (modelTable?.LIVE[baseModel]) return modelTable.LIVE[baseModel];
  if (modelTable?.LIVE[clean]) return modelTable.LIVE[clean];

  const modelDef =
    SC_MODEL_CONFIG[baseModel] ||
    SC_MODEL_CONFIG[clean] ||
    Object.values(SC_MODEL_CONFIG).find(
      (m) => m.TABLENAME === baseModel || `${m.PREFIX}_${m.TABLENAME}` === baseModel,
    );
  if (modelDef) return modelDef;

  const directModel = resolveTable(baseModel) || resolveTable(clean);
  return directModel?.LIVE || null;
}

/**
 * Handles GMC (Get Model Configuration) - Returns pure Model definition schema.
 */
export function handleGetModelConfig(payload: CbsWirePayload): ApiResponse {
  const target = (payload.recordId || payload.controlName || "").trim().toUpperCase();

  // 1. Check if the target is a versioned form config (e.g. ACCOUNT,1.0.0)
  const formTable = resolveTable(CbsControlTable.FORM_CONFIG);
  if (formTable?.LIVE[target]) {
    return successResult(
      formTable.LIVE[target],
      `Form schema for ${target} loaded from simulated database`,
    );
  }

  // 2. Query model definition from MODEL.CONFIG table or model schema
  const modelTable = resolveTable(CbsControlTable.MODEL_CONFIG);
  const baseModel = target.split(",")[0].trim();

  const modelPayload =
    modelTable?.LIVE[baseModel] ||
    modelTable?.LIVE[target] ||
    SC_MODEL_CONFIG[baseModel] ||
    SC_MODEL_CONFIG[target] ||
    Object.values(SC_MODEL_CONFIG).find(
      (m) => m.TABLENAME === baseModel || `${m.PREFIX}_${m.TABLENAME}` === baseModel,
    ) ||
    null;

  if (!modelPayload) {
    return notFoundResult(`Model configuration for "${target}" not found`);
  }
  return successResult(modelPayload, `Model schema for ${target} loaded from simulated database`);
}

/**
 * Handles GFC (Get Form Configuration) - Returns Form presentation layout (or base model layout).
 */
export function handleGetFormConfig(payload: CbsWirePayload): ApiResponse {
  const target = (payload.recordId || payload.controlName || "").trim().toUpperCase();
  const formPayload = getMockFormPayload(target);
  if (!formPayload) {
    return notFoundResult(`Form specification for "${target}" not found`);
  }
  return successResult(
    formPayload,
    `Form specification for ${target} loaded from simulated database`,
  );
}
