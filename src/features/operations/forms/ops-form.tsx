"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { CbsErrorState, CbsScreenScaffold } from "@/components/cbs-screen";
import {
  type CbsScreenProps,
  createCopyPasteActions,
  getDefaultMoreActions,
} from "@/lib/cbs-screen";
import type { AuditData } from "@/lib/data-schemas";
import { CBS_IDLE_MODE, CbsRecordFunction } from "@/types";
import { FormSkeleton } from "./components/form-skeleton";
import { useFormActions } from "./hooks/use-form-actions";
import { useFormMutations } from "./hooks/use-form-mutations";
import { useFormSchema } from "./hooks/use-form-schema";
import { useFormState } from "./hooks/use-form-state";

/**
 * Operational Form Shell (OpsForm).
 * Coordinates CbsScreenScaffold with FormRenderer.
 * 100% Lean, Zero dead/legacy code, Zero magic strings.
 */
export function OpsForm({ command, tabId }: CbsScreenProps) {
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
    hydrate,
    baseline,
    rebaseline,
    errors,
    isDirty,
    validate,
    clearForm,
    revertForm,
  } = useFormState({ schema, tabId });

  // 3. CBS Transactional Mutations (Commit, Hold, Delete, Authorize/Reverse)
  const mutations = useFormMutations({
    modelCode,
    schema,
    searchRecordId,
    screenMode,
    values,
    baseline,
    validate,
    rebaseline,
    clearForm,
  });

  // 4. CBS Navigation & Operator Actions
  const actions = useFormActions({
    modelCode,
    schema,
    searchRecordId,
    setSearchRecordId,
    screenMode,
    setScreenMode,
    hydrate,
    clearForm,
    validate,
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
        message={error || `No form for command "${command}" in CONFIG.FORM`}
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
      onReturnToSearch={clearForm}
      onReset={screenMode !== CBS_IDLE_MODE ? revertForm : undefined}
      onSubmit={mutations.handleSubmit}
      onValidate={actions.handleValidate}
      submitting={mutations.submitting}
      validationErrors={validationErrors}
      availableItems={[]}
      moreActions={[
        ...createCopyPasteActions({
          code: modelCode,
          getValues: () => values,
          canPaste: () => screenMode === CbsRecordFunction.INPUT,
          onPaste: (copied) =>
            setValues({
              ...copied,
              ...(values.auditData !== undefined ? { auditData: values.auditData } : {}),
            }),
        }),
        ...getDefaultMoreActions(modelCode),
      ]}
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
