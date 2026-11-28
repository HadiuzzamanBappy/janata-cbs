/**
 * @fileoverview Persistence binding and initial empty draft for FORM.CONFIG.
 * Integrates with CBS screen persistence layer and validates schema with Zod.
 *
 * @module features/system/form-config/hooks/use-fc-persistence
 */

"use client";

import { useCbsPersistence } from "@/components/cbs-screen";
import { type FormConfigRecord, formConfigRecordSchema } from "@/lib/data-schemas";

/**
 * Creates a fresh, empty form layout draft for self-entry.
 * No synthetic titles, descriptions, or dummy sections are pre-filled.
 */
export function createInitialDraft(): FormConfigRecord {
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

/** Stable idle value, so the persistence layer sees the same reference on every render. */
const EMPTY_FORM_CONFIG = createInitialDraft();

export function useFormConfigPersistence(tabId?: string) {
  return useCbsPersistence<FormConfigRecord>({
    tabId,
    initialData: EMPTY_FORM_CONFIG,
    schema: formConfigRecordSchema,
  });
}
