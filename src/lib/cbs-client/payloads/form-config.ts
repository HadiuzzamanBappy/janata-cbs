import type { CbsWirePayload } from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction, CbsRequestType, DEFAULT_SERVICE_PATH } from "@/types";
import { createModelPayloads, type ModelOptions } from "./base-model";

/* -------------------------------------------------------------------------- */
/* Dedicated Form Config (CONFIG.FORM) Payload Builders                       */
/* -------------------------------------------------------------------------- */

// Inherit primitive operations (list, searchIds, getNewId, hold, delete, reverse)
const baseFormConfigPayloads = createModelPayloads(CbsControlTable.FORM_CONFIG);

/**
 * Dedicated payload builder for CONFIG.FORM presentation operations.
 * Overrides `get` (GFC) and `save` (SFC) with dedicated CBS protocol verbs,
 * while inheriting standard record lifecycle operations.
 */
export const formConfigPayloads = {
  ...baseFormConfigPayloads,

  /**
   * Get Form Configuration and layout presentation ('GFC').
   * Dedicated CBS form verb replacing generic 'GET'.
   */
  get: (recordId: string, options?: ModelOptions): CbsWirePayload => {
    const servicePath = options?.servicePath?.trim() || DEFAULT_SERVICE_PATH;
    return {
      servicePath,
      requestType: CbsRequestType.GFC,
      controlName: CbsControlTable.FORM_CONFIG,
      recordFunction: CbsRecordFunction.SEE,
      recordId: recordId.trim().toUpperCase(),
    };
  },

  /**
   * Save Form Configuration layout presentation ('SFC').
   * Dedicated CBS form verb replacing generic 'PUT'.
   */
  save: (
    data: Record<string, unknown>,
    options?: ModelOptions & {
      recordId?: string;
      recordFunction?: CbsRecordFunction;
      idempotencyKey?: string;
    },
  ): CbsWirePayload => {
    const servicePath = options?.servicePath?.trim() || DEFAULT_SERVICE_PATH;
    const targetId = (options?.recordId || data?.recordId || data?.formId || "")
      .toString()
      .trim()
      .toUpperCase();

    return {
      servicePath,
      requestType: CbsRequestType.SFC,
      controlName: CbsControlTable.FORM_CONFIG,
      recordFunction: options?.recordFunction || CbsRecordFunction.INPUT,
      recordId: targetId,
      idempotencyKey: options?.idempotencyKey,
      data,
    };
  },
};
