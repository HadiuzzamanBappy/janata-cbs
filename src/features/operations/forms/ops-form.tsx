"use client";

import * as React from "react";
import { CbsErrorState, CbsScreenScaffold } from "@/components/cbs-screen";
import { toast } from "@/components/ui/toast";
import { FormKernelProvider } from "@/features/form-engine";
import type { CbsScreenMode } from "@/lib/cbs-screen";
import { getDefaultMoreActions } from "@/lib/cbs-screen";
import { FormGrid } from "./components/form-grid";
import { FormSkeleton } from "./components/form-skeleton";
import { useFormActions } from "./hooks/use-form-actions";
import { useFormPersistence } from "./hooks/use-form-persistence";
import { useFormSchema } from "./hooks/use-form-schema";
import { useFormState } from "./hooks/use-form-state";
import type { DynamicFormProps } from "./types";
import {
  findPrimaryKeyField,
  findRecordInFixtures,
  getAvailableFixtureRecords,
} from "./utils/record-finder";
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
  const { schema, loading, error, refetch } = useFormSchema(command);

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
    return schema?.code || command;
  }, [command, schema?.code]);

  const { values, errors, setValue, validate, resetForm, setValues } = useFormState(
    schema,
    mergedInitialValues,
  );

  const actions = useFormActions({
    schema,
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

  // Auto-populate & synchronize record when schema loads or searchRecordId / formData changes
  React.useEffect(() => {
    if (!schema) return;

    const cleanModel = schema.code.toUpperCase();
    const cleanId = (searchRecordId || "").trim();
    const found = cleanId ? findRecordInFixtures(cleanModel, cleanId) : undefined;
    const rawData = found || (currentTab?.formData as Record<string, unknown>) || undefined;

    if (rawData && Object.keys(rawData).length > 0) {
      const normalized = normalizeRecordData(rawData, schema);
      if (cleanId) {
        const idField = findPrimaryKeyField(schema);
        if (idField && !normalized[idField.fieldKey]) {
          normalized[idField.fieldKey] = cleanId;
        }
      }

      setValues(normalized);

      if (screenMode === "I" && found) {
        toast.add({
          title: "Existing Record Found",
          description: `Record #${cleanId} already exists. Loaded in Edit/Input mode.`,
          type: "info",
        });
      }
    } else if (cleanId) {
      const idField = findPrimaryKeyField(schema);
      if (idField) {
        setValue(idField.fieldKey, cleanId);
      }
    }
  }, [schema, searchRecordId, currentTab?.formData, screenMode, setValues, setValue]);

  const handleFieldChange = (name: string, val: unknown) => {
    setValue(name, val);
    persistFieldChange(name, val);
  };

  const validationErrors = React.useMemo(() => {
    return Object.entries(errors).map(([fieldName, msg]) => ({
      id: fieldName,
      tab: schema?.code || "GENERAL",
      fieldKey: fieldName,
      message: msg,
    }));
  }, [errors, schema?.code]);

  if (loading) return <FormSkeleton />;

  if (error || !schema) {
    return (
      <CbsErrorState
        title="Failed to Load Command Schema"
        message={error || `No schema found for "${command}"`}
        command={command}
        onRetry={refetch}
      />
    );
  }

  return (
    <CbsScreenScaffold
      variant="form"
      title={schema.title}
      commandCode={displayCommandCode}
      mode={screenMode}
      recordId={searchRecordId}
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
      onProcessAction={actions.onProcessAction}
      onReturnToSearch={actions.onReturnToSearch}
      onReset={screenMode !== "IDLE" ? () => resetForm(initialValues) : undefined}
      onSubmit={actions.onSubmit}
      onValidate={actions.onValidate}
      submitting={actions.submitting}
      validationErrors={validationErrors}
      availableItems={getAvailableFixtureRecords(schema.code)}
      moreActions={getDefaultMoreActions(schema.code)}
    >
      <FormKernelProvider initialValues={values} onFieldChange={handleFieldChange}>
        <FormGrid
          schema={schema}
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
