"use client";

import { FileCode, FileText, History, Layers, Network } from "lucide-react";
import * as React from "react";
import type { CbsScreenProps as ScreenProps } from "@/lib/cbs-screen";
import { CbsScreenScaffold, type CbsScreenTab } from "@/lib/cbs-screen";
import { DesignerAuditTab } from "./components/designer-audit-tab";
import { DesignerCanvasTab } from "./components/designer-canvas-tab";
import { DesignerGeneralTab } from "./components/designer-general-tab";
import { DesignerJsonTab } from "./components/designer-json-tab";
import { useMenuDesigner } from "./hooks/use-menu-designer";

type MenuDesignerTabKey = "general" | "canvas" | "audit" | "json";

export function SysMenuDesigner({ command, tabId }: ScreenProps) {
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
    catalogItems,
    catalogLoading,
    availableTrees,
    treeOps,
    fetchTreeRecord,
    handleCreateNew,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    validationErrors,
    resetToIdle,
  } = useMenuDesigner(initialId, tabId);

  const [activeTab, setActiveTab] = React.useState<MenuDesignerTabKey>("general");
  const isReadOnly = mode === "VIEW";

  React.useEffect(() => {
    setActiveTab("general");
  }, [formData.recordId, mode]);

  const availableItems = React.useMemo(
    () =>
      availableTrees.map((item) => ({
        id: item.id,
        label: item.label,
        details: item.details,
      })),
    [availableTrees],
  );

  const tabs: CbsScreenTab<MenuDesignerTabKey>[] = React.useMemo(
    () => [
      {
        id: "general",
        label: "General",
        icon: <FileText className="size-3 text-muted-foreground" />,
        content: (
          <DesignerGeneralTab
            formData={formData}
            setFormData={setFormData}
            isReadOnly={isReadOnly}
            validationErrors={validationErrors}
          />
        ),
      },
      {
        id: "canvas",
        label: "Hierarchy Canvas",
        icon: <Network className="size-3 text-primary" />,
        content: (
          <DesignerCanvasTab
            nodes={formData.menuTree}
            catalogItems={catalogItems}
            catalogLoading={catalogLoading}
            collapsedNodeIds={treeOps.collapsedNodeIds}
            onToggleCollapse={treeOps.toggleCollapse}
            onUpdateNode={treeOps.updateNode}
            onDeleteNode={treeOps.deleteNode}
            onMoveOrder={treeOps.moveNodeOrder}
            onMoveParent={treeOps.moveNodeParent}
            onAddSubgroup={(parentId) => treeOps.addCustomGroup("New Group", parentId)}
            onDropCatalogItem={treeOps.addCatalogItem}
            isReadOnly={isReadOnly}
          />
        ),
      },
      {
        id: "audit",
        label: "Audit Trail",
        icon: <History className="size-3 text-emerald-500" />,
        content: <DesignerAuditTab formData={formData} />,
      },
      {
        id: "json",
        label: "JSON Output",
        icon: <FileCode className="size-3 text-amber-500" />,
        content: <DesignerJsonTab formData={formData} />,
      },
    ],
    [
      catalogItems,
      catalogLoading,
      formData,
      isReadOnly,
      setFormData,
      treeOps,
      validationErrors,
    ],
  );

  return (
    <CbsScreenScaffold<MenuDesignerTabKey>
      title="Navigation Tree Designer"
      commandCode="MENU.TREE"
      recordId={recordId}
      mode={mode}
      onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
      onRecordSearch={(searchedId) => setRecordId(searchedId.toUpperCase())}
      onCreateNew={handleCreateNew}
      onReturnToSearch={resetToIdle}
      onReset={mode !== "IDLE" ? () => fetchTreeRecord(recordId || "MAIN_MENU") : undefined}
      onValidate={handleValidate}
      onSubmit={handleSubmit}
      onAuthorizeReverse={handleAuthorize}
      onView={() => recordId && fetchTreeRecord(recordId, "VIEW")}
      onAmend={() => recordId && fetchTreeRecord(recordId, "EDIT")}
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
          <span>SYS_MENU_TREE</span>
        </div>
      }
      moreActions={[
        {
          label: "Toggle Tree Active Status",
          onClick: () => setFormData((p) => ({ ...p, isActive: !p.isActive })),
          requiredRight: "A",
        },
      ]}
    />
  );
}
