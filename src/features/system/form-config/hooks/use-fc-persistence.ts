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

/**
 * Creates a clean, empty form layout draft for self-entry.
 * No synthetic titles, descriptions, or dummy sections are pre-filled.
 */
export function createInitialDraft(_cleanId?: string, _description?: string): FormConfigRecord {
  return {
    ...INITIAL_FORM_CONFIG,
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
}

export function useFormConfigPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<FormConfigRecord>({
    initialId,
    tabId,
    initialData: INITIAL_FORM_CONFIG,
    schema: formConfigRecordSchema,
  });
}
