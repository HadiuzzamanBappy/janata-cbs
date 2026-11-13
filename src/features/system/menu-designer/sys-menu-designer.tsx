"use client";

import { FileCode, FileText, Network } from "lucide-react";
import * as React from "react";
import { CbsScreenScaffold } from "@/components/cbs-screen";
import { cbsCommand } from "@/lib/cbs-command";
import type { CbsScreenTab, CbsScreenProps as ScreenProps } from "@/lib/cbs-screen";
import { CbsControlTable, CbsRecordFunction } from "@/types";
import { MdCanvasTab } from "./components/md-canvas-tab";
import { MdGeneralTab } from "./components/md-general-tab";
import { MdJsonTab } from "./components/md-json-tab";
import { useMenuDesigner } from "./hooks/use-menu-designer";

type MenuDesignerTabKey = "general" | "canvas" | "json";

export function SysMenuDesigner({ command, tabId }: ScreenProps) {
  const initialId = React.useMemo(() => {
    if (!command) return undefined;
    const parsed = cbsCommand.parse(command);
    return parsed.recordId || undefined;
  }, [command]);

  const {
    recordId,
    setRecordId,
    mode,
    formData,
    setFormData,
    baseline,
    rawRecord,
    loading,
    submitting,
    catalogItems,
    catalogLoading,
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
  const isReadOnly = mode !== CbsRecordFunction.INPUT;

  const tabs: CbsScreenTab<MenuDesignerTabKey>[] = React.useMemo(
    () => [
      {
        id: "general",
        label: "General",
        icon: <FileText className="size-3 text-muted-foreground" />,
        content: (
          <MdGeneralTab
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
        icon: <Network className="size-3 text-muted-foreground" />,
        content: (
          <MdCanvasTab
            nodes={formData.menuTree}
            formData={formData}
            setFormData={setFormData}
            catalogItems={catalogItems}
            catalogLoading={catalogLoading}
            collapsedNodeIds={treeOps.collapsedNodeIds}
            onToggleCollapse={treeOps.toggleCollapse}
            onExpandAll={treeOps.expandAll}
            onCollapseAll={treeOps.collapseAll}
            onUpdateNode={treeOps.updateNode}
            onDeleteNode={treeOps.deleteNode}
            onUngroupNode={treeOps.ungroupNode}
            onIndentNode={treeOps.indentNode}
            onOutdentNode={treeOps.outdentNode}
            onMoveOrder={treeOps.moveNodeOrder}
            onMoveNode={treeOps.moveNode}
            onDropCatalogItem={treeOps.addCatalogItem}
            isReadOnly={isReadOnly}
          />
        ),
      },
      {
        id: "json",
        label: "JSON Output",
        icon: <FileCode className="size-3 text-muted-foreground" />,
        content: <MdJsonTab formData={formData} baseline={baseline} raw={rawRecord} />,
      },
    ],
    [
      formData,
      baseline,
      rawRecord,
      isReadOnly,
      setFormData,
      catalogItems,
      catalogLoading,
      treeOps,
      validationErrors,
    ],
  );

  return (
    <CbsScreenScaffold<MenuDesignerTabKey>
      title="Menu Designer"
      commandCode={CbsControlTable.MENU_TREE}
      recordId={recordId || formData.recordId}
      mode={mode}
      auditContext={formData.auditData}
      onRecordIdChange={(id) => setRecordId(id.toUpperCase())}
      onRecordSearch={(id) => fetchTreeRecord(id.toUpperCase(), CbsRecordFunction.INPUT)}
      onCreateNew={(id) => handleCreateNew(id?.toUpperCase())}
      onReturnToSearch={resetToIdle}
      onReset={mode !== "IDLE" && recordId ? () => fetchTreeRecord(recordId, mode) : undefined}
      onAmend={() => recordId && fetchTreeRecord(recordId, CbsRecordFunction.INPUT)}
      onView={() => recordId && fetchTreeRecord(recordId, CbsRecordFunction.SEE)}
      onValidate={handleValidate}
      onSubmit={handleSubmit}
      onAuthorizeReverse={handleAuthorize}
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
