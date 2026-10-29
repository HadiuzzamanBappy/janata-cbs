"use client";

import { Code, Columns, Eye, FileText, Filter, Layers } from "lucide-react";
import * as React from "react";
import { CbsScreenScaffold } from "@/components/cbs-screen";
import type { CbsScreenProps, CbsScreenTab } from "@/lib/cbs-screen";
import { CbsControlTable, CbsRecordFunction } from "@/types";
import { IcGeneralTab } from "./components/ic-general-tab";
import { IcJsonTab } from "./components/ic-json-tab";
import { IcPreviewTab } from "./components/ic-preview-tab";
import { IcSelectionTab } from "./components/ic-selection-tab";
import { IcTableTab } from "./components/ic-table-tab";
import { useInquiryConfig } from "./hooks/use-inquiry-config";

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
    inquiriesPool,
    resetToIdle,
    initDraft,
    loadRecord,
    handleSubmit,
    filterOps,
    columnOps,
    actionOps,
  } = useInquiryConfig(initialId, tabId);

  const [activeTab, setActiveTab] = React.useState<InquiryConfigTabKey>("general");
  const isReadOnly = mode !== "I";

  const availableItems = React.useMemo(
    () =>
      inquiriesPool.map((inq) => ({
        id: inq.id,
        label: inq.label,
        details: inq.details,
      })),
    [inquiriesPool],
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
            filters={formData.INQSelectField || []}
            targetModel={formData.INQInfo?.controllerName}
            onAddFilter={filterOps.addFilter}
            onUpdateFilter={filterOps.updateFilter}
            onRemoveFilter={filterOps.removeFilter}
            onReorderFilters={filterOps.reorderFilters}
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
            columns={formData.INQDef || []}
            actions={formData.INQCmds || []}
            targetModel={formData.INQInfo?.controllerName}
            onAddColumn={columnOps.addColumn}
            onUpdateColumn={columnOps.updateColumn}
            onRemoveColumn={columnOps.removeColumn}
            onReorderColumns={columnOps.reorderColumns}
            onAddAction={actionOps.addAction}
            onUpdateAction={actionOps.updateAction}
            onRemoveAction={actionOps.removeAction}
            onReorderActions={actionOps.reorderActions}
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
    [formData, isReadOnly, setFormData, filterOps, columnOps, actionOps],
  );

  return (
    <CbsScreenScaffold<InquiryConfigTabKey>
      title="Inquiry Designer"
      commandCode={CbsControlTable.INQUIRY_CONFIG}
      recordId={recordId || formData.INQInfo?.controllerName}
      mode={mode}
      isDirty={isDirty}
      auditContext={formData.auditData}
      onRecordIdChange={(newId: string) => setRecordId(newId.toUpperCase())}
      onRecordSearch={(searchedId: string) => loadRecord(searchedId.toUpperCase(), "I")}
      onCreateNew={(newId?: string) => newId && initDraft(newId.toUpperCase())}
      onReturnToSearch={resetToIdle}
      onReset={mode !== "IDLE" && recordId ? () => loadRecord(recordId, mode) : undefined}
      onAmend={() => recordId && loadRecord(recordId, "I")}
      onView={() => recordId && loadRecord(recordId, "S")}
      onSubmit={() => handleSubmit(CbsRecordFunction.INPUT)}
      onHold={() => handleSubmit(CbsRecordFunction.HOLD)}
      onDelete={() => handleSubmit(CbsRecordFunction.DELETE)}
      onAuthorizeReverse={() =>
        handleSubmit(
          formData.auditData?.recStatus === "AU" || mode === "R"
            ? CbsRecordFunction.REVERSE
            : CbsRecordFunction.AUTHORIZE,
        )
      }
      submitting={submitting || loading}
      availableItems={availableItems}
      variant="system"
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      rightTabContent={
        <div className="text-[11px] font-mono text-muted-foreground hidden sm:flex items-center gap-1.5">
          <Layers className="size-3" />
          <span>INQUIRY_DESIGNER</span>
        </div>
      }
    />
  );
}
