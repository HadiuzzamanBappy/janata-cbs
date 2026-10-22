"use client";

import { Code, Columns, Eye, FileText, Filter, Layers } from "lucide-react";
import * as React from "react";
import { CbsScreenScaffold } from "@/components/cbs-screen";
import { type CbsScreenProps, type CbsScreenTab, getDefaultMoreActions } from "@/lib/cbs-screen";
import { IcGeneralTab, IcJsonTab, IcPreviewTab, IcSelectionTab, IcTableTab } from "./components";
import { useInquiryConfig } from "./hooks";
import { CbsControlTable } from "@/types";

type InquiryConfigTabKey = "general" | "selection" | "table" | "preview" | "json";

export function SysInquiryConfig({ command, tabId }: CbsScreenProps) {
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
    availableInquiries,
    // Columns
    addColumn,
    updateColumn,
    removeColumn,
    reorderColumns,
    // Filters
    addFilter,
    updateFilter,
    removeFilter,
    reorderFilters,
    // Actions
    addAction,
    updateAction,
    removeAction,
    reorderActions,
    // Operations
    fetchRecord,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    handleHold,
    handleDelete,
    handleReverse,
    resetToIdle,
  } = useInquiryConfig(initialId, tabId);

  const [activeTab, setActiveTab] = React.useState<InquiryConfigTabKey>("general");
  const isReadOnly = mode !== "I";

  const availableItems = React.useMemo(
    () =>
      availableInquiries.map((inq) => ({
        id: inq.id,
        label: inq.label,
        details: inq.details,
      })),
    [availableInquiries],
  );

  const tabs: CbsScreenTab<InquiryConfigTabKey>[] = React.useMemo(
    () => [
      {
        id: "general",
        label: "General",
        icon: <FileText className="size-3 text-muted-foreground" />,
        content: (
          <IcGeneralTab formData={formData} setFormData={setFormData} isReadOnly={isReadOnly} />
        ),
      },
      {
        id: "selection",
        label: "Selection Criteria",
        icon: <Filter className="size-3 text-sky-500" />,
        content: (
          <IcSelectionTab
            filters={formData.filters || []}
            targetModel={
              typeof formData.controllerName === "string"
                ? formData.controllerName
                : typeof formData.targetModel === "string"
                  ? formData.targetModel
                  : undefined
            }
            onAddFilter={addFilter}
            onUpdateFilter={updateFilter}
            onRemoveFilter={removeFilter}
            onReorderFilters={reorderFilters}
            disabled={isReadOnly}
          />
        ),
      },
      {
        id: "table",
        label: "Table Design",
        icon: <Columns className="size-3 text-primary" />,
        content: (
          <IcTableTab
            columns={formData.columns || []}
            actions={formData.actions || []}
            targetModel={
              typeof formData.controllerName === "string"
                ? formData.controllerName
                : typeof formData.targetModel === "string"
                  ? formData.targetModel
                  : undefined
            }
            onAddColumn={addColumn}
            onUpdateColumn={updateColumn}
            onRemoveColumn={removeColumn}
            onReorderColumns={reorderColumns}
            onAddAction={addAction}
            onUpdateAction={updateAction}
            onRemoveAction={removeAction}
            onReorderActions={reorderActions}
            disabled={isReadOnly}
          />
        ),
      },
      {
        id: "preview",
        label: "Live Preview",
        icon: <Eye className="size-3 text-emerald-500" />,
        content: <IcPreviewTab formData={formData} />,
      },
      {
        id: "json",
        label: "JSON Spec",
        icon: <Code className="size-3 text-amber-500" />,
        content: <IcJsonTab formData={formData} />,
      },
    ],
    [
      formData,
      isReadOnly,
      setFormData,
      addFilter,
      updateFilter,
      removeFilter,
      reorderFilters,
      addColumn,
      updateColumn,
      removeColumn,
      reorderColumns,
      addAction,
      updateAction,
      removeAction,
      reorderActions,
    ],
  );

  return (
    <CbsScreenScaffold<InquiryConfigTabKey>
      title="Inquiry Designer"
      commandCode={CbsControlTable.INQUIRY_CONFIG}
      recordId={recordId || (typeof formData.id === "string" ? formData.id : undefined)}
      mode={mode}
      isDirty={isDirty}
      auditContext={formData.auditData}
      onRecordIdChange={(newId: string) => setRecordId(newId.toUpperCase())}
      onRecordSearch={(searchedId: string) => fetchRecord(searchedId.toUpperCase(), "I")}
      onCreateNew={(newId?: string) => newId && fetchRecord(newId.toUpperCase(), "I")}
      onReturnToSearch={resetToIdle}
      onReset={mode !== "IDLE" && recordId ? () => fetchRecord(recordId, mode) : undefined}
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
      rightTabContent={
        <div className="text-[11px] font-mono text-muted-foreground hidden sm:flex items-center gap-1.5">
          <Layers className="size-3" />
          <span>INQUIRY_DESIGNER</span>
        </div>
      }
      moreActions={[
        ...getDefaultMoreActions("INQUIRY.CONFIG"),
        {
          label: "Export Inquiry Spec (JSON)",
          onClick: () => {
            const blob = new Blob([JSON.stringify(formData, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${formData.id || "inquiry"}.json`;
            a.click();
            URL.revokeObjectURL(url);
          },
          requiredRight: "S",
        },
      ]}
    />
  );
}
