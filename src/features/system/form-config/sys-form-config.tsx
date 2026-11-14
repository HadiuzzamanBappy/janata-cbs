/**
 * @fileoverview Main Form Configuration Screen (FORM.CONFIG).
 * Provides a 4-tab workbench: General Metadata, Visual Form Designer,
 * Live Runtime Preview, and Wire JSON Inspection.
 *
 * @module features/system/form-config/sys-form-config
 */

"use client";

import { Code, Eye, FileText, Palette } from "lucide-react";
import * as React from "react";
import { CbsScreenScaffold } from "@/components/cbs-screen";
import { cbsCommand } from "@/lib/cbs-command";
import type { CbsScreenProps, CbsScreenTab } from "@/lib/cbs-screen";
import { CBS_SCREEN_MODES, CbsControlTable, CbsRecordFunction, CbsRecordStatus } from "@/types";
import { FcDesignerTab } from "./components/fc-designer-tab";
import { FcGeneralTab } from "./components/fc-general-tab";
import { FcJsonTab } from "./components/fc-json-tab";
import { FcPreviewTab } from "./components/fc-preview-tab";
import { useFormConfig } from "./hooks/use-form-config";

type FormConfigTabKey = "general" | "formDesigner" | "preview" | "json";

export function SysFormConfig({ command, tabId }: CbsScreenProps) {
  const initialId = React.useMemo(() => {
    return cbsCommand.parse(command || "").recordId;
  }, [command]);

  const {
    recordId,
    setRecordId,
    mode,
    formData,
    baseline,
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
    rawRecord,
    addSection,
    updateSection,
    removeSection,
    ungroupSection,
    addFieldToSection,
    updateField,
    removeField,
    reorderFields,
    moveFieldAcrossSections,
    reorderSections,
    convertSectionZone,
    mergeTabGroups,
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
  const isReadOnly = mode !== CbsRecordFunction.INPUT;

  const tabs: CbsScreenTab<FormConfigTabKey>[] = React.useMemo(
    () => [
      {
        id: "general",
        label: "General",
        icon: <FileText className="size-3 text-muted-foreground" />,
        badgeCount: validationErrors.filter((e) => e.tab === "general").length || undefined,
        content: (
          <FcGeneralTab
            formData={formData}
            setFormData={setFormData}
            isReadOnly={isReadOnly}
            validationErrors={validationErrors}
          />
        ),
      },
      {
        id: "formDesigner",
        label: "Form Designer",
        icon: <Palette className="size-3 text-muted-foreground" />,
        content: (
          <FcDesignerTab
            formTitle={formData.title}
            formDescription={formData.description}
            authNumber={formData.authNumber}
            rootLayout={formData.frmElements?.layout ?? "horizontal"}
            rootDensity={formData.frmElements?.density ?? "compact"}
            onUpdateFormConfig={(patch) => {
              setFormData((prev) => ({
                ...prev,
                ...(patch.title !== undefined ? { title: patch.title } : {}),
                ...(patch.description !== undefined ? { description: patch.description } : {}),
                ...(patch.authNumber !== undefined ? { authNumber: patch.authNumber } : {}),
                frmElements: {
                  ...prev.frmElements,
                  sections: prev.frmElements?.sections || [],
                  ...(patch.layout !== undefined ? { layout: patch.layout } : {}),
                  ...(patch.density !== undefined ? { density: patch.density } : {}),
                },
              }));
            }}
            modelProperties={targetModelRecord?.PROPERTIES}
            targetModel={targetModelRecord?.TABLENAME}
            sections={formData.frmElements?.sections || []}
            selectedSectionId={selectedSectionId}
            selectedFieldId={selectedFieldId}
            onSelectSection={setSelectedSectionId}
            onSelectField={setSelectedFieldId}
            onAddSection={addSection}
            onUpdateSection={updateSection}
            onRemoveSection={removeSection}
            onUngroupSection={ungroupSection}
            onAddFieldToSection={addFieldToSection}
            onUpdateField={updateField}
            onRemoveField={removeField}
            onReorderFields={reorderFields}
            onMoveFieldAcrossSections={moveFieldAcrossSections}
            onReorderSections={reorderSections}
            onConvertSectionZone={convertSectionZone}
            onMergeTabGroup={mergeTabGroups}
            disabled={isReadOnly}
          />
        ),
      },
      {
        id: "preview",
        label: "Live Preview",
        icon: <Eye className="size-3 text-muted-foreground" />,
        content: <FcPreviewTab formData={formData} mode={mode} />,
      },
      {
        id: "json",
        label: "JSON Output",
        icon: <Code className="size-3 text-muted-foreground" />,
        content: <FcJsonTab formData={formData} baseline={baseline} raw={rawRecord} />,
      },
    ],
    [
      formData,
      baseline,
      rawRecord,
      isReadOnly,
      targetModelRecord,
      selectedSectionId,
      selectedFieldId,
      addSection,
      updateSection,
      removeSection,
      ungroupSection,
      addFieldToSection,
      updateField,
      removeField,
      reorderFields,
      moveFieldAcrossSections,
      reorderSections,
      convertSectionZone,
      mergeTabGroups,
      setFormData,
      setSelectedSectionId,
      setSelectedFieldId,
      validationErrors,
      mode,
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
      onRecordSearch={(searchedId: string) =>
        fetchRecord(searchedId.toUpperCase(), CbsRecordFunction.INPUT)
      }
      onCreateNew={(newId?: string) =>
        newId && fetchRecord(newId.toUpperCase(), CbsRecordFunction.INPUT)
      }
      onReturnToSearch={resetToIdle}
      onReset={
        mode !== CBS_SCREEN_MODES[0] && recordId ? () => fetchRecord(recordId, mode) : undefined
      }
      onAmend={() => recordId && fetchRecord(recordId, CbsRecordFunction.INPUT)}
      onView={() => recordId && fetchRecord(recordId, CbsRecordFunction.SEE)}
      onValidate={handleValidate}
      onSubmit={handleSubmit}
      onHold={handleHold}
      onDelete={handleDelete}
      onAuthorizeReverse={
        formData.auditData?.recStatus === CbsRecordStatus.AU || mode === CbsRecordFunction.REVERSE
          ? handleReverse
          : handleAuthorize
      }
      submitting={submitting || loading}
      availableItems={[]}
      variant="system"
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      validationErrors={validationErrors}
    />
  );
}
