"use client";

import { Filter, LayoutGrid, Plus, Search, Trash2 } from "lucide-react";
import * as React from "react";
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
import { useInquiryDesigner } from "../hooks/use-inquiry-designer";
import type { EnquiryColumnDef, EnquirySelectionField } from "../types";

export function InquiryDesignerScreen({ command }: ScreenProps) {
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
    enquiriesPool,
    loading,
    submitting,
    fetchRecord,
    handleCreateNew,
    handleSubmit,
    handleAuthorize,
    addFilter,
    updateFilter,
    removeFilter,
    addColumn,
    updateColumn,
    removeColumn,
    resetToIdle,
  } = useInquiryDesigner(initialId);

  const isReadOnly = mode === "VIEW";

  const availableEnquiries = React.useMemo(
    () =>
      enquiriesPool.map((e) => ({
        id: e.id,
        label: e.label,
        details: e.details,
      })),
    [enquiriesPool],
  );

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden select-none font-sans">
      {/* 1. CBS FORM HEADER */}
      <CbsFormHeader
        title="Inquiry Designer"
        commandCode="INQUIRY"
        recordId={recordId}
        onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
        onRecordSearch={(searchedId) => fetchRecord(searchedId, "EDIT")}
        onCreateNew={handleCreateNew}
        onReturnToSearch={resetToIdle}
        onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "ACCT.BAL") : undefined}
        onSubmit={mode !== "IDLE" && !isReadOnly ? handleSubmit : undefined}
        onAuthorizeReverse={mode !== "IDLE" ? handleAuthorize : undefined}
        onView={() => recordId && fetchRecord(recordId, "VIEW")}
        onAmend={() => recordId && setMode("EDIT")}
        mode={mode}
        submitting={submitting || loading}
        availableItems={availableEnquiries}
        moreActions={[
          {
            label: "Toggle Active Status",
            onClick: () => setFormData((p) => ({ ...p, isActive: !p.isActive })),
            requiredRight: "A",
          },
        ]}
      />

      {/* 2. BODY: IDLE vs INQUIRY CRITERIA & COLUMN BUILDER */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col">
        {mode === "IDLE" ? (
          <div className="h-full flex flex-col items-center justify-center">
            <CbsIdleState
              title="Inquiry & Grid Designer"
              code="INQUIRY"
              customMessage="Visually build dynamic inquiry reports, search filter criteria, grid column layouts, sorting, and drill-down actions for terminal commands."
            />
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-md -mt-8 mb-4">
              {availableEnquiries.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => fetchRecord(e.id, "EDIT")}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-card border border-border/80 hover:border-primary/50 hover:bg-accent text-foreground transition-all flex items-center gap-1.5"
                >
                  <Search className="size-3 text-primary" />
                  {e.id} - {e.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE DESIGNER WORKBENCH */
          <div className="flex flex-col h-full gap-3 overflow-hidden">
            {/* Top metadata strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-lg border border-border bg-card/50 shrink-0">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-20 shrink-0">
                  Enquiry ID
                </Label>
                <Input
                  value={formData.recordId}
                  disabled
                  className="h-8 font-mono text-xs bg-muted/30"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-16 shrink-0">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.title}
                  disabled={isReadOnly}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Realtime Account Balances"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-20 shrink-0">
                  Target Table
                </Label>
                <Input
                  value={formData.targetTable}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, targetTable: e.target.value.toUpperCase() }))
                  }
                  placeholder="ACCOUNT, CUSTOMER"
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
                    {formData.isActive ? "Live Enquiry" : "Inactive"}
                  </span>
                </label>
              </div>
            </div>

            {/* Split Workbench: Top Filters Builder + Bottom Display Columns Builder */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
              {/* Left Column: Filter Criteria Builder */}
              <div className="border border-border rounded-lg bg-card/40 flex flex-col overflow-hidden">
                <div className="p-2.5 border-b border-border/80 flex items-center justify-between bg-card/60">
                  <div className="flex items-center gap-2">
                    <Filter className="size-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Search Criteria ({formData.selectionFields.length})
                    </span>
                  </div>

                  {!isReadOnly && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={addFilter}
                      className="h-6 text-[10px] px-2 gap-1"
                    >
                      <Plus className="size-3" /> Add Filter
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {formData.selectionFields.map((f, idx) => (
                    <div
                      key={f.id || `f_${f.fieldName}_${f.label}`}
                      className="p-2 rounded-md border border-border/70 bg-background/80 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          value={f.fieldName}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            updateFilter(idx, {
                              fieldName: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                            })
                          }
                          placeholder="FIELD.NAME"
                          className="h-6 font-mono text-xs flex-1"
                        />
                        <Input
                          value={f.label}
                          disabled={isReadOnly}
                          onChange={(e) => updateFilter(idx, { label: e.target.value })}
                          placeholder="Label"
                          className="h-6 text-xs flex-1"
                        />
                        <Select
                          value={f.operator}
                          disabled={isReadOnly}
                          onValueChange={(val: EnquirySelectionField["operator"] | null) =>
                            val && updateFilter(idx, { operator: val })
                          }
                        >
                          <SelectTrigger className="h-6 text-[10px] w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EQ" className="text-xs">
                              EQ (=)
                            </SelectItem>
                            <SelectItem value="LIKE" className="text-xs">
                              LIKE
                            </SelectItem>
                            <SelectItem value="BETWEEN" className="text-xs">
                              BETWEEN
                            </SelectItem>
                            <SelectItem value="GT" className="text-xs">
                              GT (&gt;)
                            </SelectItem>
                            <SelectItem value="LT" className="text-xs">
                              LT (&lt;)
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => removeFilter(idx)}
                            title="Remove"
                            className="size-5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center justify-center"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {formData.selectionFields.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                      No filters configured. Click "+ Add Filter" to add search inputs.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Grid Columns Builder */}
              <div className="border border-border rounded-lg bg-card/40 flex flex-col overflow-hidden">
                <div className="p-2.5 border-b border-border/80 flex items-center justify-between bg-card/60">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="size-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Display Columns ({formData.columns.length})
                    </span>
                  </div>

                  {!isReadOnly && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={addColumn}
                      className="h-6 text-[10px] px-2 gap-1"
                    >
                      <Plus className="size-3" /> Add Column
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {formData.columns.map((col, idx) => (
                    <div
                      key={col.id || `c_${col.fieldName}_${col.headerLabel}`}
                      className="p-2 rounded-md border border-border/70 bg-background/80 flex items-center gap-2 text-xs"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground w-4 text-center">
                        {idx + 1}.
                      </span>
                      <Input
                        value={col.fieldName}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          updateColumn(idx, {
                            fieldName: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                          })
                        }
                        placeholder="field"
                        className="h-6 font-mono text-xs w-32"
                      />
                      <Input
                        value={col.headerLabel}
                        disabled={isReadOnly}
                        onChange={(e) => updateColumn(idx, { headerLabel: e.target.value })}
                        placeholder="Header"
                        className="h-6 text-xs flex-1"
                      />
                      <Select
                        value={col.format}
                        disabled={isReadOnly}
                        onValueChange={(val: EnquiryColumnDef["format"] | null) =>
                          val && updateColumn(idx, { format: val })
                        }
                      >
                        <SelectTrigger className="h-6 text-[10px] w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text" className="text-xs">
                            Text
                          </SelectItem>
                          <SelectItem value="currency" className="text-xs">
                            Currency
                          </SelectItem>
                          <SelectItem value="date" className="text-xs">
                            Date
                          </SelectItem>
                          <SelectItem value="badge" className="text-xs">
                            Badge
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => removeColumn(idx)}
                          title="Remove"
                          className="size-5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center justify-center"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  {formData.columns.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                      No columns configured. Click "+ Add Column" to define table columns.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
