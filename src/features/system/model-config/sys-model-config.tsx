"use client";

import { Database, FileCode, FileText, Layers, ShieldCheck } from "lucide-react";
import * as React from "react";
import type { CbsScreenProps as ScreenProps } from "@/lib/cbs-screen";
import { CbsScreenScaffold, type CbsScreenTab, getDefaultMoreActions } from "@/lib/cbs-screen";
import { McAuditTab } from "./components/mc-audit-tab";
import { McGeneralTab } from "./components/mc-general-tab";
import { McJsonTab } from "./components/mc-json-tab";
import { McPropertiesTab } from "./components/mc-properties-tab";
import { useModelConfig } from "./hooks/use-model-config";

type ModelConfigTabKey = "general" | "fields" | "audit" | "json";

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
    loading,
    submitting,
    modelsPool,
    validationErrors,
    isFieldCommitted,
    fetchRecord,
    handleCreateNew,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    addField,
    updateField,
    removeField,
    resetToIdle,
  } = useModelConfig(initialId, tabId);

  const [activeTab, setActiveTab] = React.useState<ModelConfigTabKey>("general");
  const [selectedPropertySN, setSelectedPropertySN] = React.useState<string | null>(null);
  const isReadOnly = mode !== "I";



  const availableModels = React.useMemo(
    () =>
      modelsPool.map((m) => ({
        id: m.id,
        label: m.label,
        details: m.details,
      })),
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
            onUpdateField={updateField}
            onRemoveField={removeField}
          />
        ),
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
      commandCode="MODEL.CONFIG"
      recordId={recordId}
      mode={mode}
      onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
      onRecordSearch={(searchedId) => setRecordId(searchedId.toUpperCase())}
      onCreateNew={handleCreateNew}
      onReturnToSearch={resetToIdle}
      onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "MENU_TREE") : undefined}
      onValidate={handleValidate}
      onSubmit={handleSubmit}
      onAuthorizeReverse={handleAuthorize}
      onView={() => recordId && fetchRecord(recordId, "S")}
      onAmend={() => recordId && fetchRecord(recordId, "I")}
      submitting={submitting || loading}
      availableItems={availableModels}
      variant="admin-tabs"
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      validationErrors={validationErrors}
      auditData={formData.auditData}
      rightTabContent={
        <div className="text-[11px] font-mono text-muted-foreground hidden sm:flex items-center gap-1.5">
          <Layers className="size-3" />
          <span>SYS_MODEL_DEFINITION</span>
        </div>
      }
      moreActions={[
        {
          label: "Toggle Active Status",
          onClick: () => setFormData((p) => ({ ...p, isActive: !p.isActive })),
          requiredRight: "A",
        },
        ...getDefaultMoreActions("MODEL.CONFIG"),
      ]}
    />
  );
}
