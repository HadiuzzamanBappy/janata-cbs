"use client";

import { useCbsPersistence } from "@/lib/cbs-screen";
import type { ModelConfigRecord } from "@/lib/schemas/model-config-schema";
import { modelConfigRecordSchema } from "@/lib/schemas/model-config-schema";

export const INITIAL_MODEL: ModelConfigRecord = {
  recordId: "",
  description: "",
  tableName: "",
  prefix: "",
  category: "",
  servicePath: "",
  userDefineId: false,
  predefineId: false,
  access: "",
  searchable: false,
  readOnly: false,
  authorize: false,
  associates: [],
  devBy: "",
  devDate: "",
  idDef: {
    idPrefix: "",
    idPattern: "",
    sequenceReset: false,
  },
  properties: [],
  isActive: false,
};

export function useModelConfigPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<ModelConfigRecord>({
    initialId,
    tabId,
    initialData: INITIAL_MODEL,
    schema: modelConfigRecordSchema,
  });
}
