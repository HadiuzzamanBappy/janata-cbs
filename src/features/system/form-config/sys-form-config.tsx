"use client";

import { Code, Eye, FileText, Layers, Palette, ShieldCheck } from "lucide-react";
import * as React from "react";
import { CbsScreenScaffold } from "@/components/cbs-screen";
import type { CbsScreenProps, CbsScreenTab } from "@/lib/cbs-screen";
import { getDefaultMoreActions } from "@/lib/cbs-screen";
import { FcAuditTab } from "./components/fc-audit-tab";
import { FcDesignerTab } from "./components/fc-designer-tab";
import { FcGeneralTab } from "./components/fc-general-tab";
import { FcJsonTab } from "./components/fc-json-tab";
import { FcPreviewTab } from "./components/fc-preview-tab";
import { useFormConfig } from "./hooks/use-form-config";
import { CbsControlTable } from "@/types";

type FormConfigTabKey = "general" | "designer" | "preview" | "audit" | "json";

export function SysFormConfig({ command, tabId }: CbsScreenProps) {
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
    selectedSectionId,
    setSelectedSectionId,
    selectedFieldId,
    setSelectedFieldId,
    validationErrors,
    targetModelRecord,
    availableForms,
    addSection,
    updateSection,
    removeSection,
    addFieldToSection,
    updateField,
    removeField,
    reorderFields,
    moveFieldAcrossSections,
    reorderSections,
    convertSectionZone,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    handleHold,
    handleDelete,
    handleReverse,
    resetToIdle,
    fetchRecord,
  } = useFormConfig(initialId, tabId);

  const [activeTab, setActiveTab] = React.useState<FormConfigTabKey>("general");
  const isReadOnly = mode !== "I";

  const availableItems = React.useMemo(
    () =>
      availableForms.map((f) => ({
        id: f.id,
        label: f.label,
        details: f.details,
      })),
    [availableForms],
  );

  const tabs: CbsScreenTab<FormConfigTabKey>[] = React.useMemo(
    () => [
      {
        id: "general",
        label: "General",
        icon: <FileText className="size-3 text-muted-foreground" />,
        content: (
          <FcGeneralTab formData={formData} setFormData={setFormData} isReadOnly={isReadOnly} />
        ),
      },
      {
        id: "designer",
        label: "Visual Designer",
        icon: <Palette className="size-3 text-primary" />,
        content: (
          <FcDesignerTab
            targetModel={
              typeof formData.targetModel === "string"
                ? formData.targetModel
                : targetModelRecord?.tableName
            }
            sections={formData.presentation.sections}
            selectedSectionId={selectedSectionId}
            selectedFieldId={selectedFieldId}
            onSelectSection={setSelectedSectionId}
            onSelectField={setSelectedFieldId}
            onAddSection={addSection}
            onUpdateSection={updateSection}
            onRemoveSection={removeSection}
            onAddFieldToSection={addFieldToSection}
            onUpdateField={updateField}
            onRemoveField={removeField}
            onReorderFields={reorderFields}
            onMoveFieldAcrossSections={moveFieldAcrossSections}
            onReorderSections={reorderSections}
            onConvertSectionZone={convertSectionZone}
            disabled={isReadOnly}
          />
        ),
      },
      {
        id: "preview",
        label: "Live Preview",
        icon: <Eye className="size-3 text-emerald-500" />,
        content: <FcPreviewTab formData={formData} targetModelRecord={targetModelRecord} />,
      },
      {
        id: "audit",
        label: "Audit Data",
        icon: <ShieldCheck className="size-3 text-purple-500" />,
        content: <FcAuditTab formData={formData} />,
      },
      {
        id: "json",
        label: "JSON Output",
        icon: <Code className="size-3 text-amber-500" />,
        content: <FcJsonTab formData={formData} />,
      },
    ],
    [
      formData,
      isReadOnly,
      targetModelRecord,
      selectedSectionId,
      selectedFieldId,
      addSection,
      updateSection,
      removeSection,
      addFieldToSection,
      updateField,
      removeField,
      reorderFields,
      moveFieldAcrossSections,
      reorderSections,
      convertSectionZone,
      setFormData,
      setSelectedSectionId,
      setSelectedFieldId,
    ],
  );

  return (
    <CbsScreenScaffold<FormConfigTabKey>
      title="Form Designer"
      commandCode={CbsControlTable.FORM_CONFIG}
      recordId={recordId}
      mode={mode}
      isDirty={isDirty}
      auditContext={formData.auditData}
      onRecordIdChange={(newId: string) => setRecordId(newId.toUpperCase())}
      onRecordSearch={(searchedId: string) => fetchRecord(searchedId.toUpperCase(), "I")}
      onCreateNew={(newId?: string) => newId && fetchRecord(newId.toUpperCase(), "I")}
      onReturnToSearch={resetToIdle}
      onReset={mode !== "IDLE" ? () => recordId && fetchRecord(recordId, mode) : undefined}
      onAmend={() => recordId && fetchRecord(recordId, "I")}
      onView={() => recordId && fetchRecord(recordId, "S")}
      onValidate={handleValidate}
      onSubmit={handleSubmit}
      onHold={handleHold}
      onDelete={handleDelete}
      onAuthorizeReverse={
        formData.auditData?.recStatus === "AU" || mode === "R" ? handleReverse : handleAuthorize
      }
      submitting={submitting || loading}
      availableItems={availableItems}
      variant="admin-tabs"
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      validationErrors={validationErrors}
      rightTabContent={
        <div className="text-[11px] font-mono text-muted-foreground hidden sm:flex items-center gap-1.5">
          <Layers className="size-3" />
          <span>PRESENTATION_BUILDER</span>
        </div>
      }
      moreActions={[
        ...getDefaultMoreActions("FORM.CONFIG"),
        {
          label: "Export Form JSON Spec",
          onClick: () => {
            const blob = new Blob([JSON.stringify(formData, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${formData.recordId || "form"}.json`;
            a.click();
            URL.revokeObjectURL(url);
          },
          requiredRight: "S",
        },
      ]}
    />
  );
}
