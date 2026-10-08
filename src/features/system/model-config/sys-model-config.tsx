"use client";

import {
  AlertTriangle,
  ChevronDown,
  Database,
  FileCode,
  FileText,
  Layers,
  ShieldCheck,
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
import { McAuditTab } from "./components/mc-audit-tab";
import { McGeneralTab } from "./components/mc-general-tab";
import { McJsonTab } from "./components/mc-json-tab";
import { McPropertiesTab } from "./components/mc-properties-tab";
import { useModelConfig } from "./hooks/use-model-config";

export function SysModelConfig({ command, tabId }: ScreenProps) {
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
    modelsPool,
    loading,
    submitting,
    fetchRecord,
    handleCreateNew,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    validationErrors,
    addField,
    updateField,
    removeField,
    isFieldCommitted,
    resetToIdle,
  } = useModelConfig(initialId, tabId);

  const isReadOnly = mode === "VIEW";
  const [activeTab, setActiveTab] = React.useState<string>("general");
  const [selectedPropertySN, setSelectedPropertySN] = React.useState<string | null>(null);

  // Reset tab selection to 'General' whenever switching to a different record or when creating a new record
  React.useEffect(() => {
    setActiveTab("general");
    setSelectedPropertySN(null);
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
        onValidate={mode !== "IDLE" && !isReadOnly ? handleValidate : undefined}
        onSubmit={mode !== "IDLE" && !isReadOnly ? handleSubmit : undefined}
        onAuthorizeReverse={mode !== "IDLE" ? handleAuthorize : undefined}
        onView={() => recordId && fetchRecord(recordId, "VIEW")}
        onAmend={() => recordId && fetchRecord(recordId, "EDIT")}
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
                                if (first.sn) setSelectedPropertySN(first.sn);
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
                              onClick={() => {
                                setActiveTab(err.tab);
                                if (err.sn) {
                                  setSelectedPropertySN(err.sn);
                                }
                              }}
                              className="px-2 py-1.5 text-xs cursor-pointer flex flex-col items-start gap-0.5 rounded hover:bg-destructive/10"
                            >
                              <div className="flex items-center gap-1.5 w-full">
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-mono h-4 px-1 rounded uppercase tracking-wider text-muted-foreground border-border/80"
                                >
                                  {err.tab}
                                </Badge>
                                {err.sn && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] font-mono h-4 px-1 rounded text-primary border-primary/30"
                                  >
                                    #{err.sn}
                                  </Badge>
                                )}
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
                    <span>SYS_MODEL_DEFINITION</span>
                  </div>
                </div>
              </div>

              {/* Tab 1: General Parameters */}
              <TabsContent value="general" className="flex-1 overflow-hidden min-h-0 m-0">
                <McGeneralTab
                  formData={formData}
                  setFormData={setFormData}
                  isReadOnly={isReadOnly}
                  validationErrors={validationErrors}
                />
              </TabsContent>

              {/* Tab 2: Fields & Properties */}
              <TabsContent value="fields" className="flex-1 flex flex-col overflow-hidden min-h-0 m-0">
                <McPropertiesTab
                  properties={formData.properties}
                  isReadOnly={isReadOnly}
                  isFieldCommitted={isFieldCommitted}
                  selectedSN={selectedPropertySN}
                  onSelectSN={setSelectedPropertySN}
                  validationErrors={validationErrors}
                  onAddField={addField}
                  onUpdateField={updateField}
                  onRemoveField={removeField}
                />
              </TabsContent>

              {/* Tab 3: Audit Sign-off History */}
              <TabsContent value="audit" className="flex-1 overflow-hidden min-h-0 m-0">
                <McAuditTab formData={formData} />
              </TabsContent>

              {/* Tab 4: JSON Wire Output Preview */}
              <TabsContent value="json" className="flex-1 flex flex-col overflow-hidden min-h-0 m-0">
                <McJsonTab formData={formData} />
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
