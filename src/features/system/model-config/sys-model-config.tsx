"use client";

import { Database, FileText, Layers, ShieldCheck } from "lucide-react";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CbsAuditFooter, CbsFormHeader, CbsIdleState } from "@/features/screens/shared";
import type { ScreenProps } from "@/features/screens/types";
import { McAuditTab } from "./components/mc-audit-tab";
import { McGeneralTab } from "./components/mc-general-tab";
import { McOptionsDialog } from "./components/mc-options-dialog";
import { McPropertyTable } from "./components/mc-property-table";
import { useModelConfig } from "./hooks/use-model-config";

export function SysModelConfig({ command }: ScreenProps) {
  const initialId = React.useMemo(() => {
    const parts = (command || "").trim().split(/\s+/);
    return parts.length > 1 ? parts[1] : undefined;
  }, [command]);

  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    modelsPool,
    loading,
    submitting,
    fetchRecord,
    handleCreateNew,
    handleSubmit,
    handleAuthorize,
    addField,
    updateField,
    removeField,
    resetToIdle,
  } = useModelConfig(initialId);

  const isReadOnly = mode === "VIEW";
  const [activeTab, setActiveTab] = React.useState<string>("general");
  const [editingOptionsForSN, setEditingOptionsForSN] = React.useState<string | null>(null);

  // Reset tab selection to 'General' whenever switching to a different record or when creating a new record
  React.useEffect(() => {
    setActiveTab("general");
  }, [formData.recordId, mode]);

  const availableModels = React.useMemo(
    () =>
      modelsPool.map((m) => ({
        id: m.id,
        label: m.label,
        details: m.details,
      })),
    [modelsPool],
  );

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
        title="Data Model & Schema Config"
        commandCode="MODEL.CONFIG"
        recordId={recordId}
        onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
        onRecordSearch={(searchedId) => fetchRecord(searchedId, "EDIT")}
        onCreateNew={handleCreateNew}
        onReturnToSearch={resetToIdle}
        onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "MENU_TREE") : undefined}
        onSubmit={mode !== "IDLE" && !isReadOnly ? handleSubmit : undefined}
        onAuthorizeReverse={mode !== "IDLE" ? handleAuthorize : undefined}
        onView={() => recordId && fetchRecord(recordId, "VIEW")}
        onAmend={() => recordId && setMode("EDIT")}
        mode={mode}
        submitting={submitting || loading}
        availableItems={availableModels}
        moreActions={[
          {
            label: "Toggle Active Status",
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
              title="Data Dictionary & Schema Designer"
              code="MODEL.CONFIG"
              customMessage="Configure Core Banking table dictionary models (SYS_MODEL_DEFINITION), field data types, options, dynamic array structures, and validation constraints. Enter a Table ID in the header or click + to start."
            />
          </div>
        ) : (
          /* ACTIVE MODEL SCHEMA BUILDER - TEMENOS 3-TAB ADMIN DASHBOARD PATTERN */
          <div className="flex flex-col h-full overflow-hidden min-h-0">
            {/* Temenos CBS 3-Tab Navigator */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden min-h-0 gap-1.5"
            >
              <div className="border-b border-border/70 pb-1 flex items-center justify-between shrink-0">
                <TabsList className="h-7 bg-muted/60 p-0.5 rounded">
                  <TabsTrigger
                    value="general"
                    className="h-6 px-2.5 text-xs rounded gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium"
                  >
                    <FileText className="size-3 text-muted-foreground" />
                    <span>General</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="fields"
                    className="h-6 px-2.5 text-xs rounded gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium"
                  >
                    <Database className="size-3 text-primary" />
                    <span>Fields</span>
                    <span className="px-1 py-0.2 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold ml-0.5">
                      {formData.properties.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="audit"
                    className="h-6 px-2.5 text-xs rounded gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium"
                  >
                    <ShieldCheck className="size-3 text-emerald-500" />
                    <span>Audit Data</span>
                  </TabsTrigger>
                </TabsList>

                <div className="text-[11px] font-mono text-muted-foreground hidden sm:flex items-center gap-1.5 pr-1">
                  <Layers className="size-3" />
                  <span>SYS_MODEL_DEFINITION</span>
                </div>
              </div>

              {/* Tab 1: General Parameters */}
              <TabsContent value="general" className="flex-1 overflow-hidden min-h-0 m-0">
                <McGeneralTab
                  formData={formData}
                  setFormData={setFormData}
                  isReadOnly={isReadOnly}
                />
              </TabsContent>

              {/* Tab 2: Fields & Properties */}
              <TabsContent value="fields" className="flex-1 flex flex-col overflow-hidden min-h-0 m-0">
                <McPropertyTable
                  properties={formData.properties}
                  isReadOnly={isReadOnly}
                  onAddField={addField}
                  onUpdateField={updateField}
                  onRemoveField={removeField}
                  onOpenOptions={(sn: string) => setEditingOptionsForSN(sn)}
                />
              </TabsContent>

              {/* Tab 3: Audit Sign-off History */}
              <TabsContent value="audit" className="flex-1 overflow-hidden min-h-0 m-0">
                <McAuditTab formData={formData} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* 3. CBS BASE AUDIT FOOTER */}
      {mode !== "IDLE" && auditFooterData && (
        <CbsAuditFooter audit={auditFooterData} />
      )}

      {/* 4. INLINE OPTIONS EDITOR MODAL */}
      {editingOptionsForSN && (
        <McOptionsDialog
          property={formData.properties.find((p) => p.sn === editingOptionsForSN)}
          isReadOnly={isReadOnly}
          onSave={(newOptions) => {
            updateField(editingOptionsForSN, { options: newOptions });
            setEditingOptionsForSN(null);
          }}
          onClose={() => setEditingOptionsForSN(null)}
        />
      )}
    </div>
  );
}
