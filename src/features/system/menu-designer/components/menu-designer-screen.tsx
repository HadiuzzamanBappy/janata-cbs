"use client";

import { GitFork } from "lucide-react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CbsFormHeader, CbsIdleState } from "@/features/screens/shared";
import type { ScreenProps } from "@/features/screens/types";
import { useMenuDesigner } from "../hooks/use-menu-designer";
import { MenuCatalogSidebar } from "./menu-catalog-sidebar";
import { MenuTreeCanvas } from "./menu-tree-canvas";

export function MenuDesignerScreen({ command }: ScreenProps) {
  const initialId = React.useMemo(() => {
    const parts = (command || "").trim().split(/\s+/);
    return parts.length > 1 ? parts[1] : undefined;
  }, [command]);

  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    description,
    setDescription,
    isActive,
    setIsActive,
    nodes,
    loading,
    submitting,
    catalogItems,
    catalogLoading,
    availableTrees,
    treeOps,
    fetchTreeRecord,
    handleCreateNew,
    handleSubmit,
    handleAuthorize,
    resetToIdle,
  } = useMenuDesigner(initialId);

  const isReadOnly = mode === "VIEW";

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden select-none font-sans">
      {/* 1. CBS FORM HEADER */}
      <CbsFormHeader
        title="Menu Designer"
        commandCode="MENU.TREE"
        recordId={recordId}
        onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
        onRecordSearch={(searchedId) => fetchTreeRecord(searchedId, "EDIT")}
        onCreateNew={handleCreateNew}
        onReturnToSearch={resetToIdle}
        onReset={mode !== "IDLE" ? () => fetchTreeRecord(recordId || "MAIN.NAV") : undefined}
        onSubmit={mode !== "IDLE" && !isReadOnly ? handleSubmit : undefined}
        onAuthorizeReverse={mode !== "IDLE" ? handleAuthorize : undefined}
        onView={() => recordId && fetchTreeRecord(recordId, "VIEW")}
        onAmend={() => recordId && setMode("EDIT")}
        mode={mode}
        submitting={submitting || loading}
        availableItems={availableTrees}
        moreActions={[
          {
            label: "Toggle Tree Active Status",
            onClick: () => setIsActive((prev) => !prev),
            requiredRight: "A",
          },
        ]}
      />

      {/* 2. MAIN BODY (Exact Form IDLE vs Active Tree Canvas) */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col">
        {mode === "IDLE" ? (
          <div className="h-full flex flex-col items-center justify-center">
            <CbsIdleState title="Navigation Hierarchy Designer" code="MENU.TREE" />
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-md -mt-8 mb-4">
              {availableTrees.slice(0, 5).map((tree) => (
                <button
                  key={tree.id}
                  type="button"
                  onClick={() => fetchTreeRecord(tree.id, "EDIT")}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-card border border-border/80 hover:border-primary/50 hover:bg-accent text-foreground transition-all flex items-center gap-1.5"
                >
                  <GitFork className="size-3 text-primary" />
                  {tree.id} - {tree.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE DESIGNER WORKSPACE */
          <div className="flex flex-col h-full gap-3 overflow-hidden">
            {/* Meta header controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg border border-border bg-card/50 shrink-0">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-20 shrink-0">Tree ID</Label>
                <Input value={recordId} disabled className="h-8 font-mono text-xs bg-muted/30" />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-24 shrink-0">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={description}
                  disabled={isReadOnly}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Core Enterprise Main Navigation"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    disabled={isReadOnly}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <span className={isActive ? "text-emerald-500 font-medium" : ""}>
                    {isActive ? "Active (Live Navigation)" : "Inactive"}
                  </span>
                </label>
              </div>
            </div>

            {/* Split Workspace: Left Catalog Pool + Right Tree Hierarchy Canvas */}
            <div className="flex-1 flex gap-3 overflow-hidden">
              <MenuCatalogSidebar
                items={catalogItems}
                loading={catalogLoading}
                onAddItem={(item) => treeOps.addCatalogItem(item, null)}
                disabled={isReadOnly}
              />

              <MenuTreeCanvas
                nodes={nodes}
                collapsedNodeIds={treeOps.collapsedNodeIds}
                onToggleCollapse={treeOps.toggleCollapse}
                onUpdateNode={treeOps.updateNode}
                onDeleteNode={treeOps.deleteNode}
                onMoveOrder={treeOps.moveNodeOrder}
                onAddSubgroup={(parentId) => treeOps.addCustomGroup("New Group", parentId)}
                onDropCatalogItem={(item, parentId) => treeOps.addCatalogItem(item, parentId)}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
