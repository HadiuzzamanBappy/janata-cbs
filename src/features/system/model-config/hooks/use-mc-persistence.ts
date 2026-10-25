"use client";

import { useCbsPersistence } from "@/components/cbs-screen";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
import { modelConfigRecordSchema } from "@/lib/data-schemas/model-config-schema";

export const INITIAL_MODEL: ModelConfigRecord = {
  recordId: "",
  description: "",
  tableName: "",
  prefix: "",
  servicePath: "",
  userDefineId: false,
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
};

export function useModelConfigPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<ModelConfigRecord>({
    initialId,
    tabId,
    initialData: INITIAL_MODEL,
    schema: modelConfigRecordSchema,
  });
}
