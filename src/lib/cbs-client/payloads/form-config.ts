import type { CbsWirePayload } from "@/lib/data-schemas";
import { CbsControlTable, CbsRequestType } from "@/types";
import { createModelPayloads, type ModelOptions } from "./base-model";

/* -------------------------------------------------------------------------- */
/* Dedicated Form Config (CONFIG.FORM) Payload Builders                       */
/* -------------------------------------------------------------------------- */

// Inherit primitive operations (list, searchIds, getNewId, hold, delete, reverse)
const baseFormConfigPayloads = createModelPayloads(CbsControlTable.FORM_CONFIG);

/**
 * Dedicated payload builder for CONFIG.FORM presentation operations.
 * `get` and `save` are the base payloads under the form verbs GFC and SFC, so the record ID,
 * record function and service are handled exactly as for every other control.
 */
export const formConfigPayloads = {
  ...baseFormConfigPayloads,

  /**
   * Get Form Configuration ('GFC'): the model plus its stored layout. The record function picks
   * the copy (`S` the live one; `A`, `I`... the pending one that function acts on).
   */
  get: (recordId: string, options?: ModelOptions): CbsWirePayload => ({
    ...baseFormConfigPayloads.get(recordId, options),
    requestType: CbsRequestType.GFC,
  }),

  /** Save Form Configuration ('SFC'). */
  save: (
    data: Record<string, unknown>,
    options: ModelOptions & { recordId: string },
  ): CbsWirePayload => ({
    ...baseFormConfigPayloads.save(data, options),
    requestType: CbsRequestType.SFC,
  }),
};
