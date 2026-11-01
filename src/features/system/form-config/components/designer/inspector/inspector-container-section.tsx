"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { InspectorRow } from "./inspector-row";

export interface InspectorContainerSectionProps {
  selectedSection: FormSection;
  onUpdateSection: (patch: Partial<FormSection>) => void;
  disabled?: boolean;
}

export function InspectorContainerSection({
  selectedSection,
  onUpdateSection,
  disabled,
}: InspectorContainerSectionProps) {
  const isTab = selectedSection.zone === "tab";

  return (
    <>
      {/* Container / Tab Title */}
      <InspectorRow
        label={isTab ? "Tab Name" : "Container Title"}
        description={
          isTab
            ? "Label displayed on this tab's header button."
            : "Header banner title displayed above this group. Leave empty for root canvas without card borders."
        }
      >
        <Input
          disabled={disabled}
          value={
            isTab
              ? (selectedSection.tabTitle ?? selectedSection.title ?? "")
              : (selectedSection.title ?? "")
          }
          placeholder={
            isTab ? "e.g. Personal Details, Nominee..." : "Leave empty for plain root fields..."
          }
          onChange={(e) => {
            const val = e.target.value;
            if (isTab) {
              onUpdateSection({ tabTitle: val, title: val });
            } else {
              onUpdateSection({ title: val });
            }
          }}
          className="h-7 text-xs bg-background"
        />
      </InspectorRow>

      {/* Grid Columns Layout */}
      <InspectorRow
        label="Grid Columns"
        description="Number of columns for fields inside this container."
      >
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded border border-border/70 bg-background">
          {[1, 2, 3, 4].map((col) => {
            const isCurrent = (selectedSection.columns || 1) === col;
            return (
              <button
                key={col}
                type="button"
                disabled={disabled}
                onClick={() => onUpdateSection({ columns: col })}
                className={cn(
                  "py-1 text-[11px] font-semibold text-center rounded transition-all cursor-pointer border-0",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 bg-transparent",
                )}
              >
                {col} Col
              </button>
            );
          })}
        </div>
      </InspectorRow>

      {/* Container Type (Read-Only) */}
      <InspectorRow
        label="Container Type"
        description="Fixed container classification defined at creation."
      >
        <div className="flex items-center gap-1.5 h-7 px-2.5 rounded border border-border/70 bg-muted/20 text-xs">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-4 px-1.5 font-mono uppercase font-semibold",
              selectedSection.type === "object-group" &&
                "border-purple-500/40 text-purple-400 bg-purple-500/10",
              selectedSection.type === "array-table" &&
                "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
              (selectedSection.type === "standard" || !selectedSection.type) &&
                "border-blue-500/40 text-blue-400 bg-blue-500/10",
            )}
          >
            {selectedSection.type === "object-group"
              ? "Object Group"
              : selectedSection.type === "array-table"
                ? "Array Table"
                : "Standard"}
          </Badge>
          {selectedSection.zone === "tab" && (
            <Badge
              variant="outline"
              className="text-[9px] h-4 px-1 font-mono uppercase border-sky-500/40 text-sky-400 bg-sky-500/10"
            >
              Tab Item
            </Badge>
          )}
          {selectedSection.layoutStyle === "plain" && (
            <span className="text-[10px] text-muted-foreground ml-auto font-mono">
              plain (no border)
            </span>
          )}
        </div>
      </InspectorRow>

      {/* Object Group Multi vs Single Toggle */}
      {selectedSection.type === "object-group" && (
        <InspectorRow
          label="Group Cardinality"
          description="Single (1 occurrence) or Multi (allow adding multiple repeating instances with +/- buttons)."
        >
          <div className="grid grid-cols-2 gap-1 p-0.5 rounded border border-border/70 bg-background">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onUpdateSection({ structure: "S" })}
              className={cn(
                "py-1 text-[11px] font-semibold text-center rounded transition-all cursor-pointer border-0",
                (selectedSection.structure || "S") === "S"
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 bg-transparent",
              )}
            >
              Single (S)
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onUpdateSection({ structure: "M" })}
              className={cn(
                "py-1 text-[11px] font-semibold text-center rounded transition-all cursor-pointer border-0",
                selectedSection.structure === "M"
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 bg-transparent",
              )}
            >
              Multi (M)
            </button>
          </div>
        </InspectorRow>
      )}

      {/* Target Object Bind Key (for object-group / array-table) */}
      {selectedSection.type !== "standard" && (
        <div className="space-y-1 p-2 rounded border border-purple-500/30 bg-purple-500/5">
          <Label className="text-[11px] font-semibold text-purple-400">Target Model Bind Key</Label>
          <Input
            disabled={disabled}
            value={selectedSection.bindKey || ""}
            placeholder="e.g. presentAddress, nominees"
            onChange={(e) => onUpdateSection({ bindKey: e.target.value })}
            className="h-7 text-xs bg-background font-mono"
          />
        </div>
      )}
    </>
  );
}
