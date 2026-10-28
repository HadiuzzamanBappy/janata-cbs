"use client";

import { useCbsPersistence } from "@/components/cbs-screen";
import {
  type FormConfigRecord,
  formConfigRecordSchema,
} from "@/lib/data-schemas/form-config-schema";

export const INITIAL_FORM_CONFIG: FormConfigRecord = {
  title: "",
  description: "",
  authNumber: 1,
  frmRoutine: {
    rtnValidate: [],
    rtnBeforeAuth: [],
    rtnAfterAuth: [],
  },
  frmElements: {
    steps: [],
    sections: [],
  },
};

export function createInitialDraft(cleanId: string, description?: string): FormConfigRecord {
  const targetModel = cleanId.split(",")[0].trim();
  const version = cleanId.split(",")[1]?.trim() || "1.0.0";
  return {
    ...INITIAL_FORM_CONFIG,
    targetModel,
    version,
    title: `${targetModel} Form (${version})`,
    description: description || `${targetModel} form layout version ${version}`,
    frmElements: {
      steps: [],
      sections: [
        {
          id: "general_sec",
          title: "General Information",
          type: "standard",
          zone: "standard",
          layoutStyle: "card",
          columns: 1,
          collapsible: false,
          isCollapsed: false,
          fields: [],
        },
      ],
    },
  };
}

export function useFormConfigPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<FormConfigRecord>({
    initialId,
    tabId,
    initialData: INITIAL_FORM_CONFIG,
    schema: formConfigRecordSchema,
  });
}

