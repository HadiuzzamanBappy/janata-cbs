/**
 * @fileoverview Main screen container for MODEL.CONFIG data dictionary workbench.
 * Houses General, Properties master-detail, Live Form Preview, and JSON wire tabs
 * on top of the unified CbsScreenScaffold architecture.
 *
 * @module features/system/model-config/sys-model-config
 */

"use client";

import { Database, Eye, FileCode, FileText } from "lucide-react";
import * as React from "react";
import { CbsScreenScaffold } from "@/components/cbs-screen";
import { cbsCommand } from "@/lib/cbs-command";
import type { CbsScreenProps, CbsScreenTab } from "@/lib/cbs-screen";
import { CBS_SCREEN_MODES, CbsControlTable, CbsRecordFunction, CbsRecordStatus } from "@/types";
import { McGeneralTab } from "./components/mc-general-tab";
import { McJsonTab } from "./components/mc-json-tab";
import { McPreviewTab } from "./components/mc-preview-tab";
import { McPropertiesTab } from "./components/mc-properties-tab";
import { useModelConfig } from "./hooks/use-model-config";

type ModelConfigTabKey = "general" | "properties" | "preview" | "json";

export function SysModelConfig({ command, tabId }: CbsScreenProps) {
  const initialId = React.useMemo(() => {
    return cbsCommand.parse(command || "").recordId;
  }, [command]);

  const {
    recordId,
    setRecordId,
    mode,
    formData,
    setFormData,
    baseline,
    rawRecord,
    isDirty,
    loading,
    submitting,
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
    addSubField,
    updateField,
    removeField,
    handleCreateNew,
    resetToIdle,
  } = useModelConfig(initialId, tabId);

  const [activeTab, setActiveTab] = React.useState<ModelConfigTabKey>("general");
  const [selectedPropertySN, setSelectedPropertySN] = React.useState<string | null>(null);
  const isReadOnly = mode !== CbsRecordFunction.INPUT;

  const tabs: CbsScreenTab<ModelConfigTabKey>[] = React.useMemo(
    () => [
      {
        id: "general",
        label: "General",
        icon: <FileText className="size-3 text-muted-foreground" />,
        badgeCount: validationErrors.filter((e) => e.tab === "general").length || undefined,
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
        id: "properties",
        label: "Properties",
        icon: <Database className="size-3 text-muted-foreground" />,
        badgeCount: validationErrors.filter((e) => e.tab === "properties").length || undefined,
        content: (
          <McPropertiesTab
            properties={formData.PROPERTIES || []}
            isReadOnly={isReadOnly}
            isFieldCommitted={isFieldCommitted}
            selectedSN={selectedPropertySN}
            onSelectSN={setSelectedPropertySN}
            validationErrors={validationErrors}
            onAddField={addField}
            onAddSubField={addSubField}
            onUpdateField={updateField}
            onRemoveField={removeField}
          />
        ),
      },
      {
        id: "preview",
        label: "Live Preview",
        icon: <Eye className="size-3 text-muted-foreground" />,
        content: <McPreviewTab formData={formData} mode={mode} />,
      },
      {
        id: "json",
        label: "JSON Output",
        icon: <FileCode className="size-3 text-muted-foreground" />,
        content: <McJsonTab formData={formData} baseline={baseline} raw={rawRecord} />,
      },
    ],
    [
      addField,
      addSubField,
      baseline,
      rawRecord,
      formData,
      isFieldCommitted,
      isReadOnly,
      mode,
      removeField,
      selectedPropertySN,
      setFormData,
      updateField,
      validationErrors,
    ],
  );

  return (
    <CbsScreenScaffold<ModelConfigTabKey>
      title="Model Config"
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
      onReset={
        mode !== CBS_SCREEN_MODES[0] && recordId ? () => fetchRecord(recordId, mode) : undefined
      }
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
      availableItems={[]}
      variant="system"
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      validationErrors={validationErrors}
      moreActions={[
        {
          label: "Export Model Schema JSON",
          command: "EXP.MODEL.JSON",
          onClick: () => {
            const blob = new Blob([JSON.stringify(formData, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${formData.TABLENAME || "model"}.config.json`;
            a.click();
            URL.revokeObjectURL(url);
          },
          requiredRight: CbsRecordFunction.SEE,
        },
      ]}
    />
  );
}
