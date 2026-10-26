"use client";

import { Database, Eye, FileCode, FileText, Layers, ShieldCheck } from "lucide-react";
import * as React from "react";
import { CbsScreenScaffold } from "@/components/cbs-screen";
import type { CbsScreenTab, CbsScreenProps as ScreenProps } from "@/lib/cbs-screen";
import { getDefaultMoreActions } from "@/lib/cbs-screen";
import { CbsControlTable, CbsRecordFunction, CbsRecordStatus } from "@/types";
import { McAuditTab } from "./components/mc-audit-tab";
import { McGeneralTab } from "./components/mc-general-tab";
import { McJsonTab } from "./components/mc-json-tab";
import { McPreviewTab } from "./components/mc-preview-tab";
import { McPropertiesTab } from "./components/mc-properties-tab";
import { useModelConfig } from "./hooks/use-model-config";

type ModelConfigTabKey = "general" | "fields" | "preview" | "audit" | "json";

export function SysModelConfig({ command, tabId }: ScreenProps) {
  const initialId = React.useMemo(() => {
    const parts = (command || "").trim().split(/\s+/);
    return parts.length > 1 ? parts[1] : undefined;
  }, [command]);

  const {
    recordId,
    setRecordId,
    mode,
    formData,
    setFormData,
    isDirty,
    loading,
    submitting,
    modelsPool,
    validationErrors,
    isFieldCommitted,
    fetchRecord,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    handleHold,
    handleDelete,
    handleReverse,
    addField,
    addChildField,
    updateField,
    removeField,
    handleCreateNew,
    resetToIdle,
  } = useModelConfig(initialId, tabId);

  const [activeTab, setActiveTab] = React.useState<ModelConfigTabKey>("general");
  const [selectedPropertySN, setSelectedPropertySN] = React.useState<string | null>(null);
  const isReadOnly = mode !== CbsRecordFunction.INPUT;

  const availableModels = React.useMemo(
    () =>
      modelsPool
        .map((m) => {
          const id = String(m.id || m.record?.tableName || "").trim();
          return {
            id,
            label: m.label || id,
            details: m.details,
          };
        })
        .filter((m) => m.id.length > 0),
    [modelsPool],
  );

  const tabs: CbsScreenTab<ModelConfigTabKey>[] = React.useMemo(
    () => [
      {
        id: "general",
        label: "General",
        icon: <FileText className="size-3 text-muted-foreground" />,
        content: (
          <McGeneralTab
            formData={formData}
            setFormData={setFormData}
            isReadOnly={isReadOnly}
            validationErrors={validationErrors}
          />
        ),
      },
      {
        id: "fields",
        label: "Fields",
        icon: <Database className="size-3 text-primary" />,
        content: (
          <McPropertiesTab
            properties={formData.properties}
            isReadOnly={isReadOnly}
            isFieldCommitted={isFieldCommitted}
            selectedSN={selectedPropertySN}
            onSelectSN={setSelectedPropertySN}
            validationErrors={validationErrors}
            onAddField={addField}
            onAddChildField={addChildField}
            onUpdateField={updateField}
            onRemoveField={removeField}
          />
        ),
      },
      {
        id: "preview",
        label: "Form Preview",
        icon: <Eye className="size-3 text-cyan-500" />,
        content: <McPreviewTab formData={formData} />,
      },
      {
        id: "audit",
        label: "Audit Data",
        icon: <ShieldCheck className="size-3 text-emerald-500" />,
        content: <McAuditTab formData={formData} />,
      },
      {
        id: "json",
        label: "JSON Output",
        icon: <FileCode className="size-3 text-amber-500" />,
        content: <McJsonTab formData={formData} />,
      },
    ],
    [
      addField,
      addChildField,
      formData,
      isFieldCommitted,
      isReadOnly,
      removeField,
      selectedPropertySN,
      setFormData,
      updateField,
      validationErrors,
    ],
  );

  return (
    <CbsScreenScaffold<ModelConfigTabKey>
      title="Data Model & Schema Config"
      commandCode={CbsControlTable.MODEL_CONFIG}
      recordId={recordId}
      mode={mode}
      isDirty={isDirty}
      auditContext={formData.auditData}
      onRecordIdChange={(newId: string) => setRecordId(newId.toUpperCase())}
      onRecordSearch={(searchedId: string) =>
        fetchRecord(searchedId.toUpperCase(), CbsRecordFunction.INPUT)
      }
      onCreateNew={handleCreateNew}
      onReturnToSearch={resetToIdle}
      onReset={mode !== "IDLE" && recordId ? () => fetchRecord(recordId, mode) : undefined}
      onValidate={handleValidate}
      onSubmit={handleSubmit}
      onHold={handleHold}
      onDelete={handleDelete}
      onAuthorizeReverse={
        formData.auditData?.recStatus === CbsRecordStatus.AU || mode === CbsRecordFunction.REVERSE
          ? handleReverse
          : handleAuthorize
      }
      onView={() => recordId && fetchRecord(recordId, CbsRecordFunction.SEE)}
      onAmend={() => recordId && fetchRecord(recordId, CbsRecordFunction.INPUT)}
      submitting={submitting || loading}
      availableItems={availableModels}
      variant="admin-tabs"
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      validationErrors={validationErrors}
      rightTabContent={
        <div className="text-[11px] font-mono text-muted-foreground hidden sm:flex items-center gap-1.5">
          <Layers className="size-3" />
          <span>SYS_MODEL_DEFINITION</span>
        </div>
      }
      moreActions={getDefaultMoreActions("MODEL.CONFIG")}
    />
  );
}
