"use client";

import { Database, ListOrdered, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";

export interface McLookupConfigProps {
  property: ModelProperty;
  onUpdate: (sn: string, patch: Partial<ModelProperty>) => void;
  disabled?: boolean;
}

interface DropdownOptionItem {
  itemCode: string;
  itemLabel: string;
  code?: string;
  label?: string;
}

export function McLookupConfig({ property, onUpdate, disabled }: McLookupConfigProps) {
  const param = (property.PARAMETER || {}) as Record<string, unknown>;
  const paramType = (param.type as string) || "O";
  const [newCode, setNewCode] = React.useState("");
  const [newLabel, setNewLabel] = React.useState("");

  const rawData = Array.isArray(param.data) ? (param.data as DropdownOptionItem[]) : [];
  const optionsList: DropdownOptionItem[] = rawData.map((d) => ({
    itemCode: d.itemCode || d.code || "",
    itemLabel: d.itemLabel || d.label || d.itemCode || d.code || "",
  }));

  const handleSetType = (t: "O" | "M") => {
    onUpdate(property.SN, {
      PARAMETER: {
        ...param,
        type: t,
        data: t === "O" ? optionsList : [],
      },
    });
  };

  const handleAddOption = () => {
    if (!newCode.trim()) return;
    const addedItem: DropdownOptionItem = {
      itemCode: newCode.trim(),
      itemLabel: newLabel.trim() || newCode.trim(),
    };
    const nextData = [...optionsList, addedItem];
    onUpdate(property.SN, {
      PARAMETER: {
        ...param,
        type: "O",
        data: nextData,
      },
    });
    setNewCode("");
    setNewLabel("");
  };

  const handleRemoveOption = (indexToRemove: number) => {
    const nextData = optionsList.filter((_, i) => i !== indexToRemove);
    onUpdate(property.SN, {
      PARAMETER: {
        ...param,
        type: "O",
        data: nextData,
      },
    });
  };

  const handleUpdateLookupField = (key: string, value: string) => {
    onUpdate(property.SN, {
      PARAMETER: {
        ...param,
        type: "M",
        [key]: value,
      },
    });
  };

  return (
    <div className="rounded border border-border/80 bg-card overflow-hidden shadow-2xs">
      {/* Header with Type Selector */}
      <div className="px-3 py-2 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            variant="outline"
            className="font-mono text-[10px] h-4.5 px-1.5 rounded uppercase tracking-wider text-primary border-primary/30 bg-primary/10"
          >
            Dropdown Source
          </Badge>
          <span className="text-xs font-semibold text-foreground truncate">
            Options & Lookup Configuration
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={paramType === "O" ? "default" : "outline"}
            disabled={disabled}
            onClick={() => handleSetType("O")}
            className="h-6 px-2 text-[10px] font-mono gap-1 rounded"
          >
            <ListOrdered className="size-3" />
            <span>Options List (O)</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={paramType === "M" ? "default" : "outline"}
            disabled={disabled}
            onClick={() => handleSetType("M")}
            className="h-6 px-2 text-[10px] font-mono gap-1 rounded"
          >
            <Database className="size-3" />
            <span>Model Lookup (M)</span>
          </Button>
        </div>
      </div>

      <div className="p-3">
        {/* Mode A: Static Option Items (e.g. Branch Types: HO, DV, BR...) */}
        {paramType === "O" ? (
          <div className="space-y-2.5">
            <div className="text-[11px] text-muted-foreground">
              Define the physical enum options ({optionsList.length} defined) stored in the database
              column:
            </div>

            {/* Existing Options Table */}
            <div className="rounded border border-border/60 overflow-hidden divide-y divide-border/40">
              <div className="grid grid-cols-12 bg-muted/40 px-2.5 py-1 text-[10px] font-mono font-semibold text-muted-foreground uppercase">
                <span className="col-span-4">Item Code</span>
                <span className="col-span-7">Display Label</span>
                <span className="col-span-1 text-right">Del</span>
              </div>

              {optionsList.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground italic">
                  No static dropdown options added yet. Add one below.
                </div>
              ) : (
                optionsList.map((opt, idx) => (
                  <div
                    key={opt.itemCode || `item_${idx}`}
                    className="grid grid-cols-12 items-center px-2.5 py-1 text-xs hover:bg-muted/20"
                  >
                    <span className="col-span-4 font-mono font-semibold text-primary truncate">
                      {opt.itemCode}
                    </span>
                    <span className="col-span-7 text-foreground truncate">{opt.itemLabel}</span>
                    <div className="col-span-1 text-right">
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="size-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add New Option Inputs */}
            {!disabled && (
              <div className="flex items-center gap-1.5 pt-1">
                <Input
                  placeholder="Code (e.g. HO)"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="h-7 text-xs font-mono uppercase w-32 bg-background"
                />
                <Input
                  placeholder="Label (e.g. Head Office)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="h-7 text-xs flex-1 bg-background"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddOption}
                  disabled={!newCode.trim()}
                  className="h-7 px-2.5 text-xs gap-1 rounded"
                >
                  <Plus className="size-3.5" />
                  <span>Add</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Mode B: Dynamic Model Reference (e.g. lookup from ACCOUNT, CUSTOMER) */
          <div className="space-y-3">
            <div className="text-[11px] text-muted-foreground">
              Configure dynamic core banking table lookup for this dropdown:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label
                  htmlFor={`lookup-model-${property.SN}`}
                  className="text-[11px] font-medium text-foreground"
                >
                  Target Model Name
                </label>
                <Input
                  id={`lookup-model-${property.SN}`}
                  placeholder="e.g. CUSTOMER, BRANCH"
                  value={String(param.modelName || "")}
                  disabled={disabled}
                  onChange={(e) =>
                    handleUpdateLookupField("modelName", e.target.value.toUpperCase())
                  }
                  className="h-7 text-xs font-mono uppercase bg-background"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={`lookup-code-${property.SN}`}
                  className="text-[11px] font-medium text-foreground"
                >
                  Code / Value Field
                </label>
                <Input
                  id={`lookup-code-${property.SN}`}
                  placeholder="e.g. branchCode, id"
                  value={String(param.codeField || param.valueField || "")}
                  disabled={disabled}
                  onChange={(e) => handleUpdateLookupField("codeField", e.target.value)}
                  className="h-7 text-xs font-mono bg-background"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={`lookup-display-${property.SN}`}
                  className="text-[11px] font-medium text-foreground"
                >
                  Display Field
                </label>
                <Input
                  id={`lookup-display-${property.SN}`}
                  placeholder="e.g. branchTitle, name"
                  value={String(param.displayField || "")}
                  disabled={disabled}
                  onChange={(e) => handleUpdateLookupField("displayField", e.target.value)}
                  className="h-7 text-xs font-mono bg-background"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={`lookup-condition-${property.SN}`}
                  className="text-[11px] font-medium text-foreground"
                >
                  Filter Condition
                </label>
                <Input
                  id={`lookup-condition-${property.SN}`}
                  placeholder="e.g. status == 'ACTIVE'"
                  value={String(param.condition || "")}
                  disabled={disabled}
                  onChange={(e) => handleUpdateLookupField("condition", e.target.value)}
                  className="h-7 text-xs font-mono bg-background"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
