"use client";

import { Code, Columns, Eye, FileText, Layers } from "lucide-react";
import * as React from "react";
import { CbsScreenScaffold } from "@/components/cbs-screen";
import { type CbsScreenProps, type CbsScreenTab, getDefaultMoreActions } from "@/lib/cbs-screen";
import { IcColumnsTab, IcGeneralTab, IcJsonTab, IcPreviewTab } from "./components";
import { useInquiryConfig } from "./hooks";

type InquiryConfigTabKey = "general" | "columns" | "preview" | "json";

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
    updateConfig,
    loading,
    submitting,
    addColumn,
    updateColumn,
    removeColumn,
    reorderColumns,
    fetchRecord,
    handleValidate,
    handleSubmit,
    handleCreateNew,
    resetToIdle,
  } = useInquiryConfig(initialId, tabId);

  const [activeTab, setActiveTab] = React.useState<InquiryConfigTabKey>("columns");
  const isReadOnly = mode !== "I";

  const tabs: CbsScreenTab<InquiryConfigTabKey>[] = React.useMemo(
    () => [
      {
        id: "general",
        label: "General",
        icon: <FileText className="size-3 text-muted-foreground" />,
        content: (
          <IcGeneralTab formData={formData} updateConfig={updateConfig} disabled={isReadOnly} />
        ),
      },
      {
        id: "columns",
        label: "Columns Layout",
        icon: <Columns className="size-3 text-primary" />,
        content: (
          <IcColumnsTab
            columns={formData.columns}
            onAddColumn={addColumn}
            onUpdateColumn={updateColumn}
            onRemoveColumn={removeColumn}
            onReorderColumns={reorderColumns}
            disabled={isReadOnly}
          />
        ),
      },
      {
        id: "preview",
        label: "Live Preview",
        icon: <Eye className="size-3 text-muted-foreground" />,
        content: <IcPreviewTab columns={formData.columns} />,
      },
      {
        id: "json",
        label: "JSON",
        icon: <Code className="size-3 text-muted-foreground" />,
        content: <IcJsonTab formData={formData} />,
      },
    ],
    [formData, isReadOnly, addColumn, updateColumn, removeColumn, reorderColumns, updateConfig],
  );

  return (
    <CbsScreenScaffold<InquiryConfigTabKey>
      title="Inquiry Designer"
      commandCode="CONFIG.INQUIRY"
      recordId={recordId || formData.id}
      mode={mode}
      onRecordIdChange={(newId: string) => setRecordId(newId.toUpperCase())}
      onRecordSearch={(searchedId: string) => fetchRecord(searchedId.toUpperCase())}
      onCreateNew={handleCreateNew}
      onReturnToSearch={resetToIdle}
      onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "INQ.ACCOUNT.LIST") : undefined}
      onAmend={() => recordId && fetchRecord(recordId)}
      onView={() => recordId && fetchRecord(recordId)}
      onValidate={handleValidate}
      onSubmit={handleSubmit}
      submitting={submitting || loading}
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
