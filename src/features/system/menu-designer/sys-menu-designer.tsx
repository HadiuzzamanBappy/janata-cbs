"use client";

import {
  AlertTriangle,
  ChevronDown,
  FileCode,
  FileText,
  History,
  Layers,
  Network,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CbsAuditFooter, CbsFormHeader, CbsIdleState } from "@/features/screens/shared";
import type { ScreenProps } from "@/features/screens/types";
import { DesignerAuditTab } from "./components/designer-audit-tab";
import { DesignerCanvasTab } from "./components/designer-canvas-tab";
import { DesignerGeneralTab } from "./components/designer-general-tab";
import { DesignerJsonTab } from "./components/designer-json-tab";
import { useMenuDesigner } from "./hooks/use-menu-designer";

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

  const [activeTab, setActiveTab] = React.useState<string>("canvas");
  const isReadOnly = mode === "VIEW";

  // Reset tab selection to 'canvas' whenever switching to a different record or when creating a new record
  React.useEffect(() => {
    setActiveTab("canvas");
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

  const generalErrorCount = validationErrors.filter((e) => e.tab === "general").length;
  const canvasErrorCount = validationErrors.filter((e) => e.tab === "canvas").length;

  const auditFooterData = React.useMemo(() => {
    if (!formData.auditData) return undefined;
    return {
      recordStatus: formData.auditData.recStatus,
      currNo: formData.auditData.recCurrNumber,
      inputter: formData.auditData.recInputter,
      dateTime: formData.auditData.recAuthTime || formData.auditData.recInputTime,
      authoriser: formData.auditData.recAuthorizer,
      coCode: formData.auditData.recBranchCode,
    };
  }, [formData.auditData]);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden select-none font-sans">
      {/* 1. CBS BASE FORM HEADER */}
      <CbsFormHeader
        title="Navigation Tree Designer"
        commandCode="MENU.TREE"
        recordId={recordId}
        onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
        onRecordSearch={(searchedId) => fetchTreeRecord(searchedId, "EDIT")}
        onCreateNew={handleCreateNew}
        onReturnToSearch={resetToIdle}
        onReset={mode !== "IDLE" ? () => fetchTreeRecord(recordId || "MAIN_MENU") : undefined}
        onValidate={mode !== "IDLE" && !isReadOnly ? handleValidate : undefined}
        onSubmit={mode !== "IDLE" && !isReadOnly ? handleSubmit : undefined}
        onAuthorizeReverse={mode !== "IDLE" ? handleAuthorize : undefined}
        onView={() => recordId && fetchTreeRecord(recordId, "VIEW")}
        onAmend={() => recordId && fetchTreeRecord(recordId, "EDIT")}
        mode={mode}
        submitting={submitting || loading}
        availableItems={availableItems}
        moreActions={[
          {
            label: "Toggle Tree Active Status",
            onClick: () => setFormData((p) => ({ ...p, isActive: !p.isActive })),
            requiredRight: "A",
          },
        ]}
      />

      {/* 2. BODY CANVAS */}
      <div className="flex-1 overflow-hidden p-2 flex flex-col min-h-0">
        {mode === "IDLE" ? (
          <div className="h-full flex flex-col items-center justify-center">
            <CbsIdleState
              title="Navigation Tree Designer"
              code="MENU.TREE"
              customMessage="Configure Core Banking navigation menus (MENU.TREE / SYS_MENU_TREE), hierarchical group folders, and action mappings. Enter a Tree ID in the header or click + to start."
            />
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden min-h-0 gap-1.5"
            >
              {/* TAB ROW STRIP */}
              <div className="border-b border-border/70 pb-1 flex items-center justify-between shrink-0">
                <TabsList className="h-7 bg-muted/60 p-0.5 rounded">
                  <TabsTrigger
                    value="general"
                    className="h-6 px-2.5 text-xs rounded gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium"
                  >
                    <FileText className="size-3 text-muted-foreground" />
                    <span>General</span>
                    {generalErrorCount > 0 && (
                      <Badge variant="destructive" className="ml-1 h-3.5 min-w-3.5 px-1 text-[9px] rounded-full">
                        {generalErrorCount}
                      </Badge>
                    )}
                  </TabsTrigger>

                  <TabsTrigger
                    value="canvas"
                    className="h-6 px-2.5 text-xs rounded gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium"
                  >
                    <Network className="size-3 text-primary" />
                    <span>Hierarchy Canvas</span>
                    {canvasErrorCount > 0 && (
                      <Badge variant="destructive" className="ml-1 h-3.5 min-w-3.5 px-1 text-[9px] rounded-full">
                        {canvasErrorCount}
                      </Badge>
                    )}
                  </TabsTrigger>

                  <TabsTrigger
                    value="audit"
                    className="h-6 px-2.5 text-xs rounded gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium"
                  >
                    <History className="size-3 text-emerald-500" />
                    <span>Audit Trail</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="json"
                    className="h-6 px-2.5 text-xs rounded gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium"
                  >
                    <FileCode className="size-3 text-amber-500" />
                    <span>JSON Output</span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 pr-1">
                  {/* Validation Alerts Dropdown (Standard CBS Error Inspector) */}
                  {validationErrors.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-6 px-2 text-[11px] gap-1 rounded font-semibold animate-pulse shadow-xs cursor-pointer"
                          >
                            <AlertTriangle className="size-3 shrink-0" />
                            <span>{validationErrors.length} Issue{validationErrors.length > 1 ? "s" : ""}</span>
                            <ChevronDown className="size-3 opacity-75 shrink-0" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent
                        align="end"
                        className="w-84 rounded-md p-1 shadow-lg bg-popover border border-destructive/30"
                      >
                        <DropdownMenuLabel className="text-xs font-semibold px-2 py-1.5 flex items-center justify-between text-destructive bg-destructive/5 rounded-t">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="size-3.5 text-destructive" />
                            <span>Validation Checklist</span>
                            <Badge variant="destructive" className="text-[10px] h-4 px-1 rounded font-mono ml-0.5">
                              {validationErrors.length}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const first = validationErrors[0];
                              if (first) {
                                setActiveTab(first.tab);
                              }
                            }}
                            className="h-5 px-1.5 text-[10px] font-semibold rounded shadow-none cursor-pointer"
                          >
                            Fix First →
                          </Button>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="my-1" />
                        <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
                          {validationErrors.map((err) => (
                            <DropdownMenuItem
                              key={err.id}
                              onClick={() => setActiveTab(err.tab)}
                              className="px-2 py-1.5 text-xs cursor-pointer flex flex-col items-start gap-0.5 rounded hover:bg-destructive/10"
                            >
                              <div className="flex items-center gap-1.5 w-full">
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-mono h-4 px-1 rounded uppercase tracking-wider text-muted-foreground border-border/80"
                                >
                                  {err.tab}
                                </Badge>
                                <span className="font-semibold text-foreground text-[11px] truncate flex-1">
                                  {err.fieldKey}
                                </span>
                              </div>
                              <span className="text-[11px] text-destructive leading-tight">
                                {err.message}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <div className="text-[11px] font-mono text-muted-foreground hidden sm:flex items-center gap-1.5">
                    <Layers className="size-3" />
                    <span>SYS_MENU_TREE</span>
                  </div>
                </div>
              </div>

              {/* TAB CONTENTS */}
              <TabsContent value="general" className="flex-1 overflow-hidden min-h-0 m-0">
                <DesignerGeneralTab
                  formData={formData}
                  setFormData={setFormData}
                  isReadOnly={isReadOnly}
                  validationErrors={validationErrors}
                />
              </TabsContent>

              <TabsContent value="canvas" className="flex-1 overflow-hidden min-h-0 m-0">
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
              </TabsContent>

              <TabsContent value="audit" className="flex-1 overflow-hidden min-h-0 m-0">
                <DesignerAuditTab formData={formData} />
              </TabsContent>

              <TabsContent value="json" className="flex-1 flex flex-col overflow-hidden min-h-0 m-0">
                <DesignerJsonTab formData={formData} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* 3. CBS BASE AUDIT FOOTER */}
      {mode !== "IDLE" && auditFooterData && (
        <CbsAuditFooter audit={auditFooterData} />
      )}
    </div>
  );
}
