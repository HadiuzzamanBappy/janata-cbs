"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { CbsErrorState, CbsScreenScaffold } from "@/components/cbs-screen";
import { getDefaultMoreActions } from "@/lib/cbs-screen";
import type { AuditData } from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsScreenMode } from "@/types";
import { FormSkeleton } from "./components/form-skeleton";
import { useFormActions } from "./hooks/use-form-actions";
import { useFormMutations } from "./hooks/use-form-mutations";
import { useFormSchema } from "./hooks/use-form-schema";
import { useFormState } from "./hooks/use-form-state";
import type { DynamicFormProps } from "./types";

const EMPTY_INITIAL_VALUES: Record<string, unknown> = {};

export type FormScreenProps = DynamicFormProps & {
  initialValues?: Record<string, unknown>;
  initialScreenMode?: CbsScreenMode;
  initialRecordId?: string;
  onReturn?: () => void;
};

/**
 * Operational Form Shell (OpsForm).
 * Coordinates CbsScreenScaffold with FormKernelProvider and FormRenderer.
 * 100% Lean, Zero dead/legacy code, Zero magic strings.
 */
export function OpsForm({
  command,
  tabId,
  initialValues = EMPTY_INITIAL_VALUES,
  initialScreenMode,
  initialRecordId: initialRecordIdProp,
  onSuccess,
  onReturn,
}: FormScreenProps) {
  const modelCode = (command || "").split(",")[0].trim().toUpperCase();

  // 1. Authoritative CBS Form & Model Schema Resolver
  const { schema, loading, error, refetch } = useFormSchema(command);

  // 2. Draft values, errors, dirty tracking, and tab persistence via useCbsPersistence
  const {
    screenMode,
    setScreenMode,
    searchRecordId,
    setSearchRecordId,
    values,
    setValue,
    setValues,
    errors,
    isDirty,
    validate,
    resetForm,
  } = useFormState({
    schema,
    tabId,
    initialScreenMode,
    initialRecordId: initialRecordIdProp,
    initialValues,
  });

  // 3. CBS Transactional Mutations (Commit, Hold, Delete, Authorize/Reverse)
  const mutations = useFormMutations({
    modelCode,
    schema,
    searchRecordId,
    screenMode,
    setScreenMode,
    values,
    initialValues,
    validate,
    resetForm,
    onSuccess,
  });

  // 4. CBS Navigation & Operator Actions
  const actions = useFormActions({
    modelCode,
    schema,
    searchRecordId,
    setSearchRecordId,
    screenMode,
    setScreenMode,
    setValues,
    resetForm,
    validate,
    initialValues,
    onReturn,
  });

  const validationErrors = React.useMemo(() => {
    return Object.entries(errors).map(([fieldName, msg]) => ({
      id: fieldName,
      tab: modelCode || "GENERAL",
      fieldKey: fieldName,
      message: msg,
    }));
  }, [errors, modelCode]);

  if (loading) return <FormSkeleton />;

  if (error || !schema) {
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
      title={schema.title}
      commandCode={command.trim().toUpperCase()}
      mode={screenMode}
      recordId={searchRecordId}
      isDirty={isDirty}
      auditContext={values.auditData as AuditData | undefined}
      onRecordIdChange={setSearchRecordId}
      onRecordSearch={(query: string) => actions.handleAmend(query)}
      onCreateNew={actions.handleCreateNew}
      onAmend={actions.handleAmend}
      onView={actions.handleView}
      onPerformAction={actions.handlePerformAction}
      onHold={mutations.handleHold}
      onDelete={mutations.handleDelete}
      onAuthorizeReverse={mutations.handleAuthorizeReverse}
      onReturnToSearch={actions.handleReturnToSearch}
      onReset={screenMode !== "IDLE" ? () => resetForm(initialValues) : undefined}
      onSubmit={mutations.handleSubmit}
      onValidate={actions.handleValidate}
      submitting={mutations.submitting}
      validationErrors={validationErrors}
      availableItems={[]}
      moreActions={getDefaultMoreActions(modelCode)}
    >
      <FormRenderer
        frmElements={schema.frmElements}
        values={values}
        onChange={setValue}
        errors={errors}
        disabled={mutations.submitting || screenMode === CbsRecordFunction.SEE}
        mode={screenMode}
        auditData={values.auditData as AuditData}
        showAuditSection
      />
    </CbsScreenScaffold>
  );
}

export { OpsForm as FormScreen };
