/**
 * @fileoverview Persistence binding and initial empty draft for FORM.CONFIG.
 * Integrates with CBS screen persistence layer and validates schema with Zod.
 *
 * @module features/system/form-config/hooks/use-fc-persistence
 */

"use client";

import { useCbsPersistence } from "@/components/cbs-screen";
import { type FormConfigRecord, formConfigRecordSchema } from "@/lib/data-schemas";

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
    sections: [],
  },
};

/**
 * Creates a fresh, empty form layout draft for self-entry.
 * No synthetic titles, descriptions, or dummy sections are pre-filled.
 */
export function createInitialDraft(_cleanId?: string): FormConfigRecord {
  return {
    title: "",
    description: "",
    authNumber: 1,
    frmRoutine: {
      rtnValidate: [],
      rtnBeforeAuth: [],
      rtnAfterAuth: [],
    },
    frmElements: {
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
