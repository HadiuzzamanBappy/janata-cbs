"use client";

import { Database, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CbsFormHeader, CbsIdleState } from "@/features/screens/shared";
import type { ScreenProps } from "@/features/screens/types";
import { useModelConfig } from "../hooks/use-model-config";
import type { PropertyType } from "../types";

const PROPERTY_TYPES: PropertyType[] = [
  "Text",
  "Number",
  "Date",
  "Boolean",
  "Dropdown",
  "Checkbox",
  "Radio",
  "Textarea",
];

export function ModelConfigScreen({ command }: ScreenProps) {
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

  const availableModels = React.useMemo(
    () =>
      modelsPool.map((m) => ({
        id: m.id,
        label: m.label,
        details: m.details,
      })),
    [modelsPool],
  );

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden select-none font-sans">
      {/* 1. CBS FORM HEADER */}
      <CbsFormHeader
        title="Data Model & Schema Config"
        commandCode="MODEL.CONFIG"
        recordId={recordId}
        onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
        onRecordSearch={(searchedId) => fetchRecord(searchedId, "EDIT")}
        onCreateNew={handleCreateNew}
        onReturnToSearch={resetToIdle}
        onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "CUSTOMER") : undefined}
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

      {/* 2. BODY: IDLE vs SCHEMA FIELD EDITOR */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col">
        {mode === "IDLE" ? (
          <div className="h-full flex flex-col items-center justify-center">
            <CbsIdleState
              title="Data Dictionary & Schema Designer"
              code="MODEL.CONFIG"
              customMessage="Configure Core Banking data dictionary tables, field data types, multi-value structures, and validation constraints. Select an existing table or press + to start."
            />
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-md -mt-8 mb-4">
              {availableModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => fetchRecord(m.id, "EDIT")}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-card border border-border/80 hover:border-primary/50 hover:bg-accent text-foreground transition-all flex items-center gap-1"
                >
                  <Database className="size-3 text-primary" />
                  {m.id} - {m.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE MODEL SCHEMA BUILDER */
          <div className="flex flex-col h-full gap-3 overflow-hidden">
            {/* Top metadata strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-lg border border-border bg-card/50 shrink-0">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-16 shrink-0">
                  Table ID
                </Label>
                <Input
                  value={formData.recordId}
                  disabled
                  className="h-8 font-mono text-xs bg-muted/30"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-20 shrink-0">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.description}
                  disabled={isReadOnly}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Customer CIF Master"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-16 shrink-0">
                  Category
                </Label>
                <Input
                  value={formData.category}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, category: e.target.value.toUpperCase() }))
                  }
                  placeholder="MASTER, FINANCIAL, TXN"
                  className="h-8 font-mono text-xs"
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
                    {formData.isActive ? "Live Schema" : "Draft"}
                  </span>
                </label>
              </div>
            </div>

            {/* Field Table / Schema Grid */}
            <div className="flex-1 border border-border rounded-lg bg-card/40 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-border/80 flex items-center justify-between gap-2 bg-card/60">
                <div className="flex items-center gap-2">
                  <Database className="size-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Field Definitions ({formData.properties.length})
                  </span>
                </div>

                {!isReadOnly && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addField}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Plus className="size-3.5" /> Add Field
                  </Button>
                )}
              </div>

              {/* Fields Table Header & Body */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground text-[11px] uppercase font-semibold">
                      <th className="py-2 px-3 w-12 text-center">#</th>
                      <th className="py-2 px-3 w-40">Field Name</th>
                      <th className="py-2 px-3 w-48">Label</th>
                      <th className="py-2 px-3 w-32">Type</th>
                      <th className="py-2 px-3 w-20 text-center">Structure</th>
                      <th className="py-2 px-3 w-20 text-center">Length</th>
                      <th className="py-2 px-3 w-20 text-center">Required</th>
                      {!isReadOnly && <th className="py-2 px-3 w-16 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.properties.map((prop) => (
                      <tr
                        key={prop.sn}
                        className="border-b border-border/60 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2 px-3 text-center font-mono font-bold text-primary">
                          {prop.sn}
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            value={prop.name}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              updateField(prop.sn, {
                                name: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                              })
                            }
                            className="h-7 font-mono text-xs uppercase"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            value={prop.label}
                            disabled={isReadOnly}
                            onChange={(e) => updateField(prop.sn, { label: e.target.value })}
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Select
                            value={prop.type}
                            disabled={isReadOnly}
                            onValueChange={(val) => {
                              if (val) updateField(prop.sn, { type: val as PropertyType });
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROPERTY_TYPES.map((t) => (
                                <SelectItem key={t} value={t} className="text-xs">
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge
                            variant={prop.structure === "M" ? "secondary" : "outline"}
                            className="cursor-pointer font-mono text-[10px]"
                            onClick={() =>
                              !isReadOnly &&
                              updateField(prop.sn, {
                                structure: prop.structure === "S" ? "M" : "S",
                              })
                            }
                          >
                            {prop.structure === "S" ? "Single (S)" : "Multi (M)"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Input
                            type="number"
                            value={prop.length}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              updateField(prop.sn, { length: Number(e.target.value) || 0 })
                            }
                            className="h-7 text-xs text-center w-16 mx-auto"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={prop.required}
                            disabled={isReadOnly}
                            onChange={(e) => updateField(prop.sn, { required: e.target.checked })}
                            className="size-3.5 rounded accent-primary cursor-pointer"
                          />
                        </td>
                        {!isReadOnly && (
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeField(prop.sn)}
                              title="Delete Field"
                              className="size-6 inline-flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {formData.properties.length === 0 && (
                      <tr>
                        <td
                          colSpan={isReadOnly ? 7 : 8}
                          className="text-center py-8 text-xs text-muted-foreground"
                        >
                          No fields defined in this schema. Click "+ Add Field" to create fields.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
