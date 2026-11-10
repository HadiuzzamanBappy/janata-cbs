import type { CbsWirePayload } from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";
import { createModelPayloads, type ModelOptions } from "./base-model";

/* -------------------------------------------------------------------------- */
/* Dedicated Model Config Payload Builders                                    */
/* -------------------------------------------------------------------------- */

// Inherit primitive operations (get, list, searchIds, getNewId, hold, delete, reverse)
const baseModelConfigPayloads = createModelPayloads(CbsControlTable.MODEL_CONFIG);

/**
 * Dedicated payload builder for MODEL.CONFIG metamodel operations.
 * Overrides only `save` (SMC) and `authorize` (AMC) with dedicated protocol verbs,
 * while inheriting all primitive record operations.
 */
export const modelConfigPayloads = {
  ...baseModelConfigPayloads,

  /**
   * Get Model Configuration definition ('GMC').
   * Dedicated metamodel verb replacing generic 'GET'.
   */
  get: (recordId: string, options?: ModelOptions): CbsWirePayload => {
    return {
      servicePath: options?.servicePath?.trim(),
      requestType: CbsRequestType.GMC,
      controlName: CbsControlTable.MODEL_CONFIG,
      recordFunction: CbsRecordFunction.SEE,
      recordId: recordId.trim().toUpperCase(),
    };
  },

  /**
   * Save Model Configuration definition ('SMC').
   * Dedicated metamodel verb replacing generic 'PUT'.
   */
  save: (
    data: Record<string, unknown>,
    options?: ModelOptions & {
      recordId?: string;
      recordFunction?: CbsRecordFunction;
    },
  ): CbsWirePayload => {
    const targetId = (options?.recordId || data?.recordId || data?.TABLENAME || "")
      .toString()
      .trim()
      .toUpperCase();

    return {
      servicePath: options?.servicePath?.trim(),
      requestType: CbsRequestType.SMC,
      controlName: CbsControlTable.MODEL_CONFIG,
      recordFunction: options?.recordFunction || CbsRecordFunction.INPUT,
      recordId: targetId,
      idempotencyKey: options?.idempotencyKey,
      data,
    };
  },

  /**
   * Authorize Model Configuration definition ('AMC').
   * Dedicated metamodel verb replacing generic 'AUT'.
   */
  authorize: (recordId: string, options?: ModelOptions): CbsWirePayload => {
    return {
      servicePath: options?.servicePath?.trim(),
      requestType: CbsRequestType.AMC,
      controlName: CbsControlTable.MODEL_CONFIG,
      recordFunction: CbsRecordFunction.AUTHORIZE,
      recordId: recordId.trim().toUpperCase(),
    };
  },
};
