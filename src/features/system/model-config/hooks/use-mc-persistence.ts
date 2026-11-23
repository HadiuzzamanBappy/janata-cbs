/**
 * @fileoverview Persistence hook and initial state for MODEL.CONFIG records.
 * Integrates with CBS screen persistence layer and validates drafts with Zod.
 *
 * @module features/system/model-config/hooks/use-mc-persistence
 */

"use client";

import { useCbsPersistence } from "@/components/cbs-screen";
import { type ModelConfigRecord, modelConfigRecordSchema } from "@/lib/data-schemas";

export const INITIAL_MODEL: ModelConfigRecord = {
  DESCRIPTION: "",
  TABLENAME: "",
  PREFIX: "",
  SERVICEPATH: "default",
  USERDEFINEID: false,
  ACCESS: "G",
  SEARCHABLE: false,
  READONLY: false,
  AUTHLEVEL: 1,
  ASSOCIATES: [],
  _DEVBY: "",
  _DEVDATE: "",
  IDDEF: {
    IDPREFIX: "",
    IDPATTERN: "",
    SEQUENCELENGTH: "",
    SEQUENCERESET: false,
    SEQRESETPERIOD: "",
  },
  PROPERTIES: [],
};

export function useModelConfigPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<ModelConfigRecord>({
    initialId,
    tabId,
    initialData: INITIAL_MODEL,
    schema: modelConfigRecordSchema,
  });
}
