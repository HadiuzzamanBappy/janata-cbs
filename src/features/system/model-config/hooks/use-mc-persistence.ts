"use client";

import { useCbsPersistence } from "@/components/cbs-screen";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
import { modelConfigRecordSchema } from "@/lib/data-schemas/model-config-schema";

export const INITIAL_MODEL: ModelConfigRecord = {
  DESCRIPTION: "",
  TABLENAME: "",
  PREFIX: "",
  SERVICEPATH: "",
  USERDEFINEID: false,
  ACCESS: "",
  SEARCHABLE: false,
  READONLY: false,
  AUTHORIZE: false,
  ASSOCIATES: [],
  _DEVBY: "",
  _DEVDATE: "",
  IDDEF: {
    IDPREFIX: "",
    IDPATTERN: "",
    SEQUENCELENGTH: "",
    SEQUENCERESET: false,
  },
  PROPERTIES: [],
  VIEWDEF: [],
  IDROUTINE: "",
  FIELDBASED: false,
};

export function useModelConfigPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<ModelConfigRecord>({
    initialId,
    tabId,
    initialData: INITIAL_MODEL,
    schema: modelConfigRecordSchema,
  });
}
