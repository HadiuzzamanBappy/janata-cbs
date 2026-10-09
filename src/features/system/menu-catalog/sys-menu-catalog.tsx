"use client";

import { FileCode, FileText, History, Layers } from "lucide-react";
import * as React from "react";
import type { CbsScreenProps as ScreenProps } from "@/lib/cbs-screen";
import { CbsScreenScaffold, type CbsScreenTab, getDefaultMoreActions } from "@/lib/cbs-screen";
import { MenuAuditTab } from "./components/menu-audit-tab";
import { MenuGeneralTab } from "./components/menu-general-tab";
import { MenuJsonTab } from "./components/menu-json-tab";
import { useMenuCatalog } from "./hooks/use-menu-catalog";

type MenuCatalogTabKey = "general" | "audit" | "json";

export function SysMenuCatalog({ command, tabId }: ScreenProps) {
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
    itemsPool,
    validationErrors,
    fetchRecord,
    handleCreateNew,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    resetToIdle,
  } = useMenuCatalog(initialId, tabId);

  const [activeTab, setActiveTab] = React.useState<MenuCatalogTabKey>("general");
  const isReadOnly = mode !== "I";

  const availableItems = React.useMemo(
    () =>
      itemsPool.map((item) => ({
        id: item.recordId,
        label: item.label,
        details: item.command ? `Command: ${item.command}` : item.menuType,
      })),
    [itemsPool],
  );

  const tabs: CbsScreenTab<MenuCatalogTabKey>[] = React.useMemo(
    () => [
      {
        id: "general",
        label: "General",
        icon: <FileText className="size-3 text-muted-foreground" />,
        content: (
          <MenuGeneralTab
            formData={formData}
            setFormData={setFormData}
            isReadOnly={isReadOnly}
            validationErrors={validationErrors}
          />
        ),
      },
      {
        id: "audit",
        label: "Audit Trail",
        icon: <History className="size-3 text-emerald-500" />,
        content: <MenuAuditTab formData={formData} />,
      },
      {
        id: "json",
        label: "JSON Output",
        icon: <FileCode className="size-3 text-amber-500" />,
        content: <MenuJsonTab formData={formData} />,
      },
    ],
    [formData, isReadOnly, setFormData, validationErrors],
  );

  return (
    <CbsScreenScaffold<MenuCatalogTabKey>
      title="Menu Item Catalog"
      commandCode="MENU"
      recordId={recordId}
      mode={mode}
      onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
      onRecordSearch={(searchedId) => setRecordId(searchedId.toUpperCase())}
      onCreateNew={handleCreateNew}
      onReturnToSearch={resetToIdle}
      onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "1") : undefined}
      onValidate={handleValidate}
      onSubmit={handleSubmit}
      onAuthorizeReverse={handleAuthorize}
      onView={() => recordId && fetchRecord(recordId, "S")}
      onAmend={() => recordId && fetchRecord(recordId, "I")}
      submitting={submitting || loading}
      availableItems={availableItems}
      variant="admin-tabs"
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      validationErrors={validationErrors}
      auditData={formData.auditData}
      rightTabContent={
        <div className="text-[11px] font-mono text-muted-foreground hidden sm:flex items-center gap-1.5">
          <Layers className="size-3" />
          <span>SYS_MENU</span>
        </div>
      }
      moreActions={[
        {
          label: "Toggle Active Status",
          onClick: () => setFormData((p) => ({ ...p, isActive: !p.isActive })),
          requiredRight: "A",
        },
        ...getDefaultMoreActions("MENU"),
      ]}
    />
  );
}
