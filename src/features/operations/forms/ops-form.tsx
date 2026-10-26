"use client";

import * as React from "react";
import { CbsErrorState, CbsScreenScaffold } from "@/components/cbs-screen";
import { FormKernelProvider } from "@/features/form-engine";
import { getDefaultMoreActions, useRecordMutationSubscriber } from "@/lib/cbs-screen";
import type { AuditData } from "@/lib/data-schemas";
import type { CbsScreenMode } from "@/types";
import { FormGrid } from "./components/form-grid";
import { FormSkeleton } from "./components/form-skeleton";
import { useFormActions } from "./hooks/use-form-actions";
import { useFormPersistence } from "./hooks/use-form-persistence";
import { useFormSpec } from "./hooks/use-form-spec";
import { useFormState } from "./hooks/use-form-state";
import type { DynamicFormProps } from "./types";
import { findPrimaryKeyField } from "./utils/record-finder";
import { normalizeRecordData } from "./utils/record-normalizer";

const EMPTY_INITIAL_VALUES: Record<string, unknown> = {};

export type FormScreenProps = DynamicFormProps & {
  initialValues?: Record<string, unknown>;
  initialScreenMode?: CbsScreenMode;
  initialRecordId?: string;
  onReturn?: () => void;
};

export function OpsForm({
  command,
  tabId,
  initialValues = EMPTY_INITIAL_VALUES,
  initialScreenMode,
  initialRecordId: initialRecordIdProp,
  onSuccess,
  onReturn,
}: FormScreenProps) {
  // Dynamically resolve CompiledFormSpec from live Model + Form Config
  const { spec, loading, error, refetch } = useFormSpec(command);

  const {
    currentTab,
    screenMode,
    setScreenMode,
    searchRecordId,
    setSearchRecordId,
    mergedInitialValues,
    persistFieldChange,
  } = useFormPersistence({
    tabId,
    initialScreenMode,
    initialRecordId: initialRecordIdProp,
    initialValues,
  });

  const displayCommandCode = React.useMemo(() => {
    if (command?.includes(",")) {
      const parts = command.split(",");
      if (parts[1] && !parts[1].match(/^\d+$/) && !Number.isNaN(Number(parts[1]))) {
        return command.trim().toUpperCase();
      }
    }
    return spec?.code || command;
  }, [command, spec?.code]);

  const { values, errors, isDirty, setValue, validate, resetForm, setValues } = useFormState(
    spec,
    mergedInitialValues,
  );

  const actions = useFormActions({
    spec,
    searchRecordId,
    setSearchRecordId,
    screenMode,
    setScreenMode,
    values,
    setValues,
    setValue,
    resetForm,
    validate,
    initialValues,
    onSuccess,
    onReturn,
  });

  // Available records catalog fallback (SBI handles dynamic records on demand)
  const availableItems = React.useMemo(() => [], []);

  // Subscribe to real-time mutations of this entity
  useRecordMutationSubscriber((mutation) => {
    if (searchRecordId && mutation.recordId === searchRecordId.trim().toUpperCase()) {
      actions.loadRecordData(searchRecordId, screenMode);
    }
  }, spec?.code);

  // Synchronize working draft from tab if present
  React.useEffect(() => {
    if (!spec) return;

    const cleanId = (searchRecordId || "").trim();
    const rawDraft = (currentTab?.formData as Record<string, unknown>) || undefined;

    if (rawDraft && Object.keys(rawDraft).length > 0) {
      const normalized = normalizeRecordData(rawDraft, spec);
      if (cleanId) {
        const idField = findPrimaryKeyField(spec);
        if (idField && !normalized[idField.fieldKey]) {
          normalized[idField.fieldKey] = cleanId;
        }
      }
      setValues(normalized);
    } else if (cleanId) {
      const idField = findPrimaryKeyField(spec);
      if (idField) {
        setValue(idField.fieldKey, cleanId);
      }
    }
  }, [spec, searchRecordId, currentTab?.formData, setValues, setValue]);

  const handleFieldChange = (name: string, val: unknown) => {
    setValue(name, val);
    persistFieldChange(name, val);
  };

  const validationErrors = React.useMemo(() => {
    return Object.entries(errors).map(([fieldName, msg]) => ({
      id: fieldName,
      tab: spec?.code || "GENERAL",
      fieldKey: fieldName,
      message: msg,
    }));
  }, [errors, spec?.code]);

  if (loading) return <FormSkeleton />;

  if (error || !spec) {
    return (
      <CbsErrorState
        title="Failed to Resolve Form Specification"
        message={error || `No data model registered for command "${command}"`}
        command={command}
        onRetry={refetch}
      />
    );
  }

  return (
    <CbsScreenScaffold
      variant="form"
      title={spec.title}
      commandCode={displayCommandCode}
      mode={screenMode}
      recordId={searchRecordId}
      isDirty={isDirty}
      auditContext={values.auditData as AuditData | undefined}
      onRecordIdChange={setSearchRecordId}
      onRecordSearch={(query: string) => {
        actions.onAmend(query);
      }}
      onCreateNew={actions.onCreateNew}
      onAmend={actions.onAmend}
      onView={actions.onView}
      onPerformAction={actions.onPerformAction}
      onHold={actions.onHold}
      onDelete={actions.onDelete}
      onAuthorizeReverse={actions.onAuthorizeReverse}
      onReturnToSearch={actions.onReturnToSearch}
      onReset={screenMode !== "IDLE" ? () => resetForm(initialValues) : undefined}
      onSubmit={actions.onSubmit}
      onValidate={actions.onValidate}
      submitting={actions.submitting}
      validationErrors={validationErrors}
      availableItems={availableItems}
      moreActions={getDefaultMoreActions(spec.code)}
    >
      <FormKernelProvider initialValues={values} onFieldChange={handleFieldChange}>
        <FormGrid
          presentation={spec.presentation}
          values={values}
          onChange={handleFieldChange}
          errors={errors}
          disabled={actions.submitting}
          mode={screenMode}
        />
      </FormKernelProvider>
    </CbsScreenScaffold>
  );
}

export const FormScreen = OpsForm;
