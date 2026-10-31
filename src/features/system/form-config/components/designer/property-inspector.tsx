"use client";

import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Hash,
  Info,
  Layers,
  LayoutGrid,
  Settings,
  Table,
  Type,
  X,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/core-utils";
import type { FormElement, FormSection } from "@/lib/data-schemas/form-config-schema";
import { PROPERTY_WIDTHS, type PropertyWidth } from "@/lib/data-schemas/model-config-schema";

export interface PropertyInspectorProps {
  selectedSection: FormSection | null;
  selectedField: FormElement | null;
  onUpdateSection: (patch: Partial<FormSection>) => void;
  onUpdateField: (patch: Partial<FormElement>) => void;
  onClose: () => void;
  onDeselectField?: () => void;
  disabled?: boolean;
}

function InspectorRow({
  label,
  required,
  description,
  children,
}: {
  label: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs select-none font-normal">
        <Label className="text-[11px] font-medium text-muted-foreground select-none flex items-center">
          {label}
          {required && <span className="text-destructive font-semibold ml-0.5">*</span>}
        </Label>
        {description && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex items-center text-muted-foreground/60 hover:text-foreground cursor-help p-0.5 transition-colors">
                  <Info className="size-3" />
                </span>
              }
            />
            <TooltipContent side="left" className="text-xs max-w-xs z-50">
              {description}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

export function PropertyInspector({
  selectedSection,
  selectedField,
  onUpdateSection,
  onUpdateField,
  onClose,
  onDeselectField,
  disabled,
}: PropertyInspectorProps) {
  // Resolve dynamic title and icon based on field or container type (always call hooks at top level)
  const inspectorHeader = React.useMemo(() => {
    if (selectedField) {
      const type = (selectedField.TYPE || "Text").toLowerCase();
      let icon = <Type className="size-3.5 text-primary shrink-0" />;
      let title = "Text Field Properties";

      if (type.includes("number")) {
        icon = <Hash className="size-3.5 text-emerald-500 shrink-0" />;
        title = "Number Field Properties";
      } else if (type.includes("date")) {
        icon = <Calendar className="size-3.5 text-amber-500 shrink-0" />;
        title = "Date Field Properties";
      } else if (type.includes("dropdown") || type.includes("select")) {
        icon = <ChevronDown className="size-3.5 text-cyan-500 shrink-0" />;
        title = "Dropdown Properties";
      } else {
        title = `${selectedField.TYPE || "Field"} Properties`;
      }

      return { icon, title, isField: true };
    }

    if (selectedSection) {
      if (selectedSection.zone === "tab") {
        return {
          icon: <Layers className="size-3.5 text-sky-500 shrink-0" />,
          title: "Tab Properties",
          isField: false,
        };
      }
      if (selectedSection.type === "object-group") {
        return {
          icon: <Layers className="size-3.5 text-purple-500 shrink-0" />,
          title: "Object Group Properties",
          isField: false,
        };
      }
      if (selectedSection.type === "array-table") {
        return {
          icon: <Table className="size-3.5 text-emerald-500 shrink-0" />,
          title: "Table Properties",
          isField: false,
        };
      }
      if (selectedSection.layoutStyle === "plain") {
        return {
          icon: <LayoutGrid className="size-3.5 text-muted-foreground shrink-0" />,
          title: "Canvas Root Properties",
          isField: false,
        };
      }
      return {
        icon: <LayoutGrid className="size-3.5 text-sky-500 shrink-0" />,
        title: "Card Container Properties",
        isField: false,
      };
    }

    return {
      icon: <Settings className="size-3.5 text-muted-foreground shrink-0" />,
      title: "Properties",
      isField: false,
    };
  }, [selectedField, selectedSection]);

  if (!selectedSection && !selectedField) {
    return (
      <div className="w-72 border-l border-border/70 bg-card/25 p-4 flex flex-col items-center justify-center text-center text-muted-foreground text-xs select-none shrink-0">
        <div className="size-10 rounded-full bg-muted/40 flex items-center justify-center mb-2">
          <Settings className="size-5 opacity-40 text-muted-foreground" />
        </div>
        <span className="font-semibold text-foreground text-xs">Property Inspector</span>
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-1">
          Click any field or container on the canvas to configure its layout, parameters, and
          display rules.
        </p>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0 overflow-hidden">
      {/* ── Single Unified Header ─────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b border-border/60 bg-muted/25 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {inspectorHeader.icon}
          <div className="truncate">
            <span className="font-semibold text-foreground text-xs">{inspectorHeader.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedField && (
            <Badge
              variant="outline"
              className="text-[9px] font-mono h-4 px-1 uppercase tracking-wider text-primary border-primary/30 bg-primary/10"
            >
              {selectedField.TYPE || "TEXT"}
            </Badge>
          )}
          {selectedField && selectedSection && (
            <button
              type="button"
              onClick={onDeselectField}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/60 transition-colors cursor-pointer"
              title={`Switch inspector to container: ${selectedSection.title || selectedSection.id}`}
            >
              <ArrowLeft className="size-3" />
              <span className="max-w-20 truncate hidden sm:inline">
                {selectedSection.tabTitle || selectedSection.title || "Container"}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground/60 hover:text-foreground p-1 rounded hover:bg-muted/60 transition-colors cursor-pointer"
            title="Close Inspector"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* ── Form Body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {selectedField ? (
          /* ================================================================ */
          /* FIELD INSPECTOR                                                   */
          /* ================================================================ */
          <>
            {/* Display Label */}
            <InspectorRow
              label="Display Label"
              required
              description="User-facing label rendered on form scanlines."
            >
              <Input
                disabled={disabled}
                value={selectedField.LABEL || ""}
                onChange={(e) => onUpdateField({ LABEL: e.target.value })}
                className="h-7 text-xs bg-background"
                placeholder="Field label"
              />
            </InspectorRow>

            {/* Model Field Key (Schema-Bound) */}
            <InspectorRow
              label="Field Key (NAME)"
              description="Physical database column name mapped to this field."
            >
              <div className="h-7 px-2.5 rounded border border-border/70 bg-muted/30 flex items-center text-xs font-mono text-foreground font-medium select-all truncate">
                {selectedField.NAME}
              </div>
            </InspectorRow>

            {/* Field Type Selector */}
            <InspectorRow
              label="Field Type"
              description="Input presentation widget: Text, Number, Date, Amount, Select, or Boolean."
            >
              <Select
                disabled={disabled}
                value={selectedField.TYPE || "Text"}
                onValueChange={(val: string | null) => onUpdateField({ TYPE: val || "Text" })}
              >
                <SelectTrigger className="w-full h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Text">Text (Standard)</SelectItem>
                  <SelectItem value="Number">Number (Numeric)</SelectItem>
                  <SelectItem value="Amount">Amount (Currency)</SelectItem>
                  <SelectItem value="Date">Date (Calendar)</SelectItem>
                  <SelectItem value="Select">Select (Lookup / Options)</SelectItem>
                  <SelectItem value="Boolean">Boolean (Toggle)</SelectItem>
                </SelectContent>
              </Select>
            </InspectorRow>

            {/* Structure (Single vs Multi) */}
            <InspectorRow
              label="Structure"
              description="Single scalar value or repeating multi-value array (.1, .2)."
            >
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant={selectedField.STRUCTURE === "S" ? "default" : "outline"}
                  size="sm"
                  disabled={disabled}
                  onClick={() => onUpdateField({ STRUCTURE: "S" })}
                  className="h-7 px-3 text-xs rounded flex-1"
                >
                  Single (S)
                </Button>
                <Button
                  type="button"
                  variant={selectedField.STRUCTURE === "M" ? "default" : "outline"}
                  size="sm"
                  disabled={disabled}
                  onClick={() => onUpdateField({ STRUCTURE: "M" })}
                  className="h-7 px-3 text-xs rounded flex-1"
                >
                  Multi-Value (M)
                </Button>
              </div>
            </InspectorRow>

            {/* Display Width Semantic Tokens (XS to FULL) */}
            <InspectorRow
              label="Display Width"
              description="Semantic field width token scale: XS, SM, MD, LG, XL, XXL, or FULL."
            >
              <div className="flex items-center gap-1 flex-wrap">
                {PROPERTY_WIDTHS.map((w) => (
                  <Button
                    key={w}
                    type="button"
                    variant={
                      String(selectedField.WIDTH || "md").toLowerCase() === w
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    disabled={disabled || selectedField.TYPE === "Date"}
                    onClick={() => onUpdateField({ WIDTH: w as PropertyWidth })}
                    className="h-6 px-1.5 text-[10px] rounded flex-1 uppercase font-mono"
                  >
                    {w}
                  </Button>
                ))}
              </div>
            </InspectorRow>

            {/* Max Length */}
            <InspectorRow
              label="Max Length"
              description="Maximum character limit allowed for this input."
            >
              <Input
                type="number"
                disabled={disabled || selectedField.TYPE === "Date"}
                value={selectedField.LENGTH ?? 35}
                onChange={(e) => onUpdateField({ LENGTH: Number(e.target.value) || 0 })}
                className="h-7 text-xs bg-background font-mono"
              />
            </InspectorRow>

            {/* Constraints: Required & Readonly */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
              <label
                htmlFor={`field-req-${selectedField.SN}`}
                className={cn(
                  "flex items-center gap-2 select-none",
                  disabled ? "cursor-default opacity-85" : "cursor-pointer",
                )}
              >
                <Checkbox
                  id={`field-req-${selectedField.SN}`}
                  checked={Boolean(selectedField.REQUIRED)}
                  disabled={disabled}
                  onCheckedChange={(val: boolean) => onUpdateField({ REQUIRED: Boolean(val) })}
                  className="rounded"
                />
                <span className="text-xs text-foreground font-medium">Required</span>
              </label>

              <label
                htmlFor={`field-dis-${selectedField.SN}`}
                className={cn(
                  "flex items-center gap-2 select-none",
                  disabled ? "cursor-default opacity-85" : "cursor-pointer",
                )}
              >
                <Checkbox
                  id={`field-dis-${selectedField.SN}`}
                  checked={Boolean(selectedField.DISABLED)}
                  disabled={disabled}
                  onCheckedChange={(val: boolean) => onUpdateField({ DISABLED: Boolean(val) })}
                  className="rounded"
                />
                <span className="text-xs text-muted-foreground font-medium">Disabled</span>
              </label>
            </div>

            {/* Enrich Text (Guidance / Tooltip) */}
            <InspectorRow
              label="Enrich Text (Tooltip)"
              description="Contextual guidance shown on hover to help operators."
            >
              <Input
                disabled={disabled}
                placeholder="Guidance shown on hover..."
                value={selectedField.ENRICHTEXT || ""}
                onChange={(e) => onUpdateField({ ENRICHTEXT: e.target.value })}
                className="h-7 text-xs bg-background"
              />
            </InspectorRow>

            {/* Default Value */}
            <InspectorRow
              label="Default Value"
              description="Pre-filled value populated when creating new records."
            >
              <Input
                disabled={disabled}
                value={String(selectedField.DEFAULTVALUE || "")}
                onChange={(e) => onUpdateField({ DEFAULTVALUE: e.target.value })}
                className="h-7 text-xs bg-background font-mono"
              />
            </InspectorRow>
          </>
        ) : selectedSection ? (
          /* ================================================================ */
          /* CONTAINER INSPECTOR                                               */
          /* ================================================================ */
          <>
            {/* Container Title */}
            <InspectorRow
              label="Container Title"
              description="Header banner title displayed above this group. Leave empty for root canvas without card borders."
            >
              <Input
                disabled={disabled}
                value={selectedSection.title || ""}
                placeholder="Leave empty for plain root fields..."
                onChange={(e) => onUpdateSection({ title: e.target.value })}
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
                <Label className="text-[11px] font-semibold text-purple-400">
                  Target Model Bind Key
                </Label>
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
        ) : null}
      </div>
    </div>
  );
}
