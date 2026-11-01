"use client";

import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { FormElement } from "@/lib/data-schemas/form-config-schema";
import { InspectorRow } from "./inspector-row";

export interface InspectorLookupConfigProps {
  selectedField: FormElement;
  onUpdateField: (patch: Partial<FormElement>) => void;
  disabled?: boolean;
}

export function InspectorLookupConfig({
  selectedField,
  onUpdateField,
  disabled,
}: InspectorLookupConfigProps) {
  const [newOptionCode, setNewOptionCode] = React.useState("");
  const [newOptionLabel, setNewOptionLabel] = React.useState("");

  const handleAddStaticOption = () => {
    if (!newOptionCode.trim()) return;
    const curData = (selectedField.PARAMETER?.data || []) as unknown[];
    const nextData = [
      ...curData,
      { code: newOptionCode.trim(), label: newOptionLabel.trim() || newOptionCode.trim() },
    ];
    onUpdateField({
      PARAMETER: {
        type: "O",
        data: nextData,
        modelName: "",
        displayField: "",
        condition: "",
        reference: "",
      },
    });
    setNewOptionCode("");
    setNewOptionLabel("");
  };

  const handleRemoveStaticOption = (indexToRemove: number) => {
    const curData = (selectedField.PARAMETER?.data || []) as unknown[];
    const nextData = curData.filter((_, idx) => idx !== indexToRemove);
    onUpdateField({
      PARAMETER: {
        type: "O",
        data: nextData,
        modelName: "",
        displayField: "",
        condition: "",
        reference: "",
      },
    });
  };

  return (
    <div className="space-y-2 pt-1 border-t border-border/50">
      <div className="grid grid-cols-2 gap-1 p-0.5 rounded border border-border/70 bg-background">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const cur = selectedField.PARAMETER || {
              type: "O",
              data: [],
              modelName: "",
              displayField: "",
              condition: "",
              reference: "",
            };
            onUpdateField({ PARAMETER: { ...cur, type: "O" } });
          }}
          className={cn(
            "py-1 text-[10px] font-semibold text-center rounded transition-all cursor-pointer border-0",
            (selectedField.PARAMETER?.type || "O") === "O"
              ? "bg-cyan-500 text-white font-bold shadow-2xs"
              : "text-muted-foreground hover:text-foreground bg-transparent",
          )}
        >
          Static Options (O)
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const cur = selectedField.PARAMETER || {
              type: "M",
              data: [],
              modelName: "",
              displayField: "",
              condition: "",
              reference: "",
            };
            onUpdateField({ PARAMETER: { ...cur, type: "M" } });
          }}
          className={cn(
            "py-1 text-[10px] font-semibold text-center rounded transition-all cursor-pointer border-0",
            selectedField.PARAMETER?.type === "M"
              ? "bg-cyan-500 text-white font-bold shadow-2xs"
              : "text-muted-foreground hover:text-foreground bg-transparent",
          )}
        >
          Model Lookup (M)
        </button>
      </div>

      {selectedField.PARAMETER?.type === "M" ? (
        <div className="space-y-2">
          <InspectorRow
            label="Target Model Table"
            description="CBS Database Model to lookup records from."
          >
            <Input
              disabled={disabled}
              placeholder="e.g. ACCOUNT, CUSTOMER"
              value={selectedField.PARAMETER?.modelName || ""}
              onChange={(e) => {
                const cur = selectedField.PARAMETER || {
                  type: "M",
                  data: [],
                  modelName: "",
                  displayField: "",
                  condition: "",
                  reference: "",
                };
                onUpdateField({
                  PARAMETER: { ...cur, modelName: e.target.value.toUpperCase() },
                });
              }}
              className="h-7 text-xs bg-background font-mono uppercase"
            />
          </InspectorRow>

          <div className="grid grid-cols-2 gap-1.5">
            <InspectorRow label="Code Field" description="Value code property (e.g. ID, code).">
              <Input
                disabled={disabled}
                placeholder="e.g. ID"
                value={selectedField.PARAMETER?.reference || ""}
                onChange={(e) => {
                  const cur = selectedField.PARAMETER || {
                    type: "M",
                    data: [],
                    modelName: "",
                    displayField: "",
                    condition: "",
                    reference: "",
                  };
                  onUpdateField({
                    PARAMETER: { ...cur, reference: e.target.value },
                  });
                }}
                className="h-7 text-xs bg-background font-mono"
              />
            </InspectorRow>

            <InspectorRow
              label="Display Field"
              description="Display title property (e.g. NAME, title)."
            >
              <Input
                disabled={disabled}
                placeholder="e.g. NAME"
                value={selectedField.PARAMETER?.displayField || ""}
                onChange={(e) => {
                  const cur = selectedField.PARAMETER || {
                    type: "M",
                    data: [],
                    modelName: "",
                    displayField: "",
                    condition: "",
                    reference: "",
                  };
                  onUpdateField({
                    PARAMETER: { ...cur, displayField: e.target.value },
                  });
                }}
                className="h-7 text-xs bg-background font-mono"
              />
            </InspectorRow>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="max-h-36 overflow-y-auto space-y-1 rounded border border-border/60 bg-background/50 p-1">
            {!selectedField.PARAMETER?.data || selectedField.PARAMETER.data.length === 0 ? (
              <div className="text-[10px] text-muted-foreground/60 text-center py-2 italic font-mono">
                No options defined
              </div>
            ) : (
              selectedField.PARAMETER.data.map((opt: unknown, idx: number) => {
                const optCode =
                  typeof opt === "string" ? opt : (opt as Record<string, string>)?.code || "";
                const optLabel =
                  typeof opt === "string" ? opt : (opt as Record<string, string>)?.label || optCode;
                return (
                  <div
                    key={`opt_${optCode || ""}_${optLabel || ""}`}
                    className="flex items-center justify-between gap-1 text-[11px] px-1.5 py-0.5 rounded bg-muted/40 font-mono"
                  >
                    <span className="font-semibold text-foreground truncate">{optCode}</span>
                    <span className="text-muted-foreground truncate max-w-28 text-[10px]">
                      {optLabel}
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStaticOption(idx)}
                        className="text-muted-foreground/50 hover:text-destructive p-0.5 rounded cursor-pointer shrink-0"
                        title="Remove option"
                      >
                        <Trash2 className="size-2.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {!disabled && (
            <div className="space-y-1 pt-1">
              <div className="grid grid-cols-2 gap-1">
                <Input
                  placeholder="Code (e.g. BDT)"
                  value={newOptionCode}
                  onChange={(e) => setNewOptionCode(e.target.value)}
                  className="h-6 text-[10px] bg-background font-mono uppercase"
                />
                <Input
                  placeholder="Label (optional)"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  className="h-6 text-[10px] bg-background"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddStaticOption}
                disabled={!newOptionCode.trim()}
                className="w-full h-6 text-[10px] gap-1 cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Add Option</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
