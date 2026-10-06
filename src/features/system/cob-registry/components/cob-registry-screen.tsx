"use client";

import { Activity, Layers, PlayCircle, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormHeader } from "@/features/screens/forms/components/form-header";
import type { ScreenProps } from "@/features/screens/types";
import { useCobRegistry } from "../hooks/use-cob-registry";

export function CobRegistryScreen({ command }: ScreenProps) {
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
    configsPool,
    loading,
    submitting,
    fetchRecord,
    handleCreateNew,
    handleSubmit,
    handleAuthorize,
    addService,
    updateService,
    removeService,
    resetToIdle,
  } = useCobRegistry(initialId);

  const isReadOnly = mode === "VIEW";

  const availablePipelines = React.useMemo(
    () =>
      configsPool.map((c) => ({
        id: c.id,
        label: c.label,
        details: c.details,
      })),
    [configsPool],
  );

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden select-none font-sans">
      {/* 1. CBS FORM HEADER */}
      <FormHeader
        title="COB Service Registry & Batch Pipeline"
        commandCode="COB.REGISTRY"
        recordId={recordId}
        onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
        onRecordSearch={(searchedId) => fetchRecord(searchedId, "EDIT")}
        onCreateNew={handleCreateNew}
        onReturnToSearch={resetToIdle}
        onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "SYSTEM") : undefined}
        onSubmit={mode !== "IDLE" && !isReadOnly ? handleSubmit : undefined}
        onAuthorizeReverse={mode !== "IDLE" ? handleAuthorize : undefined}
        onView={() => recordId && fetchRecord(recordId, "VIEW")}
        onAmend={() => recordId && setMode("EDIT")}
        mode={mode}
        submitting={submitting || loading}
        availableItems={availablePipelines}
        moreActions={[
          {
            label: "Toggle Active Pipeline",
            onClick: () => setFormData((p) => ({ ...p, isActive: !p.isActive })),
            requiredRight: "A",
          },
        ]}
      />

      {/* 2. BODY: IDLE vs COB BATCH PIPELINE EDITOR */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col">
        {mode === "IDLE" ? (
          /* EXACT FORM IDLE STATE */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/10">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Layers className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Close of Business Registry (COB.REGISTRY)
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Configure Close of Business (COB / EOD) batch stages, background job sequences,
              accounting balance cutoffs, and regulatory reporting pipelines.
            </p>

            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-md">
              {availablePipelines.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => fetchRecord(p.id, "EDIT")}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-card border border-border/80 hover:border-primary/50 hover:bg-accent text-foreground transition-all flex items-center gap-1.5"
                >
                  <Activity className="size-3 text-primary" />
                  {p.id} - {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE PIPELINE EDITOR */
          <div className="flex flex-col h-full gap-3 overflow-hidden">
            {/* Top metadata strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg border border-border bg-card/50 shrink-0">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-20 shrink-0">
                  Pipeline ID
                </Label>
                <Input
                  value={formData.recordId}
                  disabled
                  className="h-8 font-mono text-xs bg-muted/30"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-24 shrink-0">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.description}
                  disabled={isReadOnly}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Core Enterprise End-of-Day Pipeline"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    disabled={isReadOnly}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                    className="size-4 rounded accent-primary"
                  />
                  <span className={formData.isActive ? "text-emerald-500 font-medium" : ""}>
                    {formData.isActive ? "Active Pipeline" : "Inactive"}
                  </span>
                </label>
              </div>
            </div>

            {/* Stages Scrollable Cards */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {formData.registries.map((stage, stageIdx) => (
                <div
                  key={stage.cobStage}
                  className="border border-border rounded-lg bg-card/50 overflow-hidden"
                >
                  {/* Stage Header */}
                  <div className="p-3 border-b border-border/80 flex items-center justify-between bg-card/80">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="size-4 text-primary" />
                      <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                        {stage.cobStage}
                      </Badge>
                      <span className="text-xs font-semibold text-foreground">
                        {stage.description}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        ({stage.serviceName.length} services)
                      </span>
                    </div>

                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addService(stageIdx)}
                        className="h-6 text-[10px] px-2 gap-1"
                      >
                        <Plus className="size-3" /> Add Service
                      </Button>
                    )}
                  </div>

                  {/* Stage Service Jobs */}
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {stage.serviceName.map((service, sIdx) => {
                      const itemKey = `${stage.cobStage}_item_${service || "empty"}_${sIdx}`;
                      return (
                        <div
                          key={itemKey}
                          className="flex items-center gap-1.5 p-1.5 rounded-md border border-border/70 bg-background/60"
                        >
                          <span className="font-mono text-[10px] text-muted-foreground w-4 text-center shrink-0">
                            {sIdx + 1}.
                          </span>
                          <Input
                            value={service}
                            disabled={isReadOnly}
                            onChange={(e) => updateService(stageIdx, sIdx, e.target.value)}
                            placeholder="SERVICE.JOB.NAME"
                            className="h-7 text-xs font-mono uppercase flex-1"
                          />
                          {!isReadOnly && stage.serviceName.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeService(stageIdx, sIdx)}
                              title="Remove Service"
                              className="size-6 inline-flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all shrink-0"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
