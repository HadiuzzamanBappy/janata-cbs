"use client";

import {
  ArrowLeft,
  Calculator,
  Columns,
  DollarSign,
  Layers,
  LayoutGrid,
  Settings,
  Type,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/core-utils";
import {
  type FormFieldItem,
  type FormSection,
  getCompatibleWidgets,
  type PropertyType,
  WIDGET_LABELS,
} from "@/lib/data-schemas";

export interface PropertyInspectorProps {
  selectedSection: FormSection | null;
  selectedField: FormFieldItem | null;
  onUpdateSection: (patch: Partial<FormSection>) => void;
  onUpdateField: (patch: Partial<FormFieldItem>) => void;
  onClose: () => void;
  onDeselectField?: () => void;
  disabled?: boolean;
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
  if (!selectedSection && !selectedField) {
    return (
      <div className="w-72 border-l border-border/70 bg-card/25 p-4 flex flex-col items-center justify-center text-center text-muted-foreground text-xs select-none shrink-0">
        <div className="size-10 rounded-full bg-muted/40 flex items-center justify-center mb-2">
          <Settings className="size-5 opacity-40 text-muted-foreground" />
        </div>
        <span className="font-semibold text-foreground text-xs">Property Inspector</span>
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-1">
          Click any field or container on the canvas to configure its layout, widgets, and
          validation rules.
        </p>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0 overflow-hidden">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b border-border/60 bg-muted/25 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedField ? (
            <>
              <Type className="size-3.5 text-primary shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-foreground text-xs">Field Properties</span>
              </div>
            </>
          ) : (
            <>
              <LayoutGrid className="size-3.5 text-sky-500 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-foreground text-xs">Container Properties</span>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground/60 hover:text-foreground p-1 rounded hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
          title="Close Inspector"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* ── Breadcrumb Switcher when Field is Selected ─────────────────────── */}
      {selectedField && selectedSection && (
        <div className="px-3 py-1.5 bg-muted/15 border-b border-border/40 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onDeselectField}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 truncate font-medium"
            title="Switch inspector back to parent container"
          >
            <ArrowLeft className="size-3 shrink-0" />
            <span className="truncate">
              In:{" "}
              {selectedSection.title ||
                (selectedSection.layoutStyle === "plain" ? "Canvas Root" : "Container")}
            </span>
          </button>
          <Badge variant="outline" className="text-[9px] font-mono h-3.5 px-1 uppercase shrink-0">
            {selectedSection.columns || 1} COL
          </Badge>
        </div>
      )}

      {/* ── Form Body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {selectedField ? (
          /* ================================================================ */
          /* FIELD INSPECTOR                                                  */
          /* ================================================================ */
          <>
            {/* Display Label */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Display Label</Label>
              <Input
                disabled={disabled}
                value={selectedField.label}
                onChange={(e) => onUpdateField({ label: e.target.value })}
                className="h-7 text-xs bg-background"
                placeholder="Field label"
              />
            </div>

            {/* Model Field Key (Schema-Bound) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Model Column
                </Label>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono h-3.5 px-1 text-emerald-500 border-emerald-500/40 bg-emerald-500/5"
                >
                  SCHEMA BOUND
                </Badge>
              </div>
              <div className="h-7 px-2.5 rounded border border-border/70 bg-muted/30 flex items-center text-xs font-mono text-foreground font-medium select-all truncate">
                {selectedField.fieldKey}
              </div>
            </div>

            {/* Widget Type Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-muted-foreground">Widget Type</Label>
                {selectedField.modelType && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono h-3.5 px-1 uppercase text-primary border-primary/30 bg-primary/5"
                  >
                    {selectedField.modelType}
                  </Badge>
                )}
              </div>
              <Select
                disabled={disabled}
                value={selectedField.widget}
                onValueChange={(val) => onUpdateField({ widget: val as FormFieldItem["widget"] })}
              >
                <SelectTrigger className="w-full h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {getCompatibleWidgets(selectedField.modelType as PropertyType | undefined).map(
                    (w) => (
                      <SelectItem key={w} value={w}>
                        {WIDGET_LABELS[w]?.label || w}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Width / Column Span inside parent container */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Width / Column Span
                </Label>
                <span className="text-[10px] font-mono text-muted-foreground/70">
                  {selectedField.colSpan ? `${selectedField.colSpan}/12` : "Auto"}
                </span>
              </div>
              <Select
                disabled={disabled}
                value={String(selectedField.colSpan || 12)}
                onValueChange={(val) => onUpdateField({ colSpan: Number(val) })}
              >
                <SelectTrigger className="w-full h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="12">Full Width (12/12 - 100%)</SelectItem>
                  <SelectItem value="8">Two-Thirds (8/12 - 66%)</SelectItem>
                  <SelectItem value="6">Half Width (6/12 - 50%)</SelectItem>
                  <SelectItem value="4">One-Third (4/12 - 33%)</SelectItem>
                  <SelectItem value="3">One-Quarter (3/12 - 25%)</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[10px] text-muted-foreground/70 leading-tight block">
                Determines how much space this field takes inside multi-column containers.
              </span>
            </div>

            {/* Amount: Currency Prefix */}
            {selectedField.widget === "amount" && (
              <div className="space-y-1 p-2 rounded border border-border/60 bg-muted/20">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                  <DollarSign className="size-3 text-emerald-500" />
                  <span>Currency Prefix</span>
                </div>
                <Select
                  disabled={disabled}
                  value={selectedField.currencyPrefix || "BDT"}
                  onValueChange={(val) => onUpdateField({ currencyPrefix: val ?? undefined })}
                >
                  <SelectTrigger className="w-full h-7 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="BDT">BDT (Bangladeshi Taka)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Options List (for Select, Radio, Radio-Group, Checkbox-Group) */}
            {["select", "radio", "radio-group", "checkbox-group"].includes(
              selectedField.widget,
            ) && (
              <div className="space-y-1.5 p-2 rounded border border-border/60 bg-muted/20">
                <Label className="text-[11px] font-semibold text-foreground">
                  Options (Comma-separated)
                </Label>
                <Input
                  disabled={disabled}
                  placeholder="SAVINGS, CURRENT, DEPOSIT"
                  value={selectedField.options ? selectedField.options.join(", ") : ""}
                  onChange={(e) =>
                    onUpdateField({
                      options: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="h-7 text-xs bg-background font-mono"
                />
                <span className="text-[10px] text-muted-foreground/70 leading-tight block">
                  Define selectable options for this field.
                </span>
              </div>
            )}

            {/* Placeholder Text */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Placeholder Text
              </Label>
              <Input
                disabled={disabled}
                placeholder="e.g. Enter full legal name..."
                value={selectedField.placeholder || ""}
                onChange={(e) => onUpdateField({ placeholder: e.target.value })}
                className="h-7 text-xs bg-background"
              />
            </div>

            {/* Helper Guidance Text */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Helper Guidance Text
              </Label>
              <Input
                disabled={disabled}
                placeholder="e.g. As stated on NID or passport"
                value={selectedField.helperText || ""}
                onChange={(e) => onUpdateField({ helperText: e.target.value })}
                className="h-7 text-xs bg-background"
              />
            </div>

            {/* Derived Formula */}
            <div className="space-y-1 p-2 rounded border border-border/60 bg-muted/15">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                <Calculator className="size-3 text-amber-500" />
                <span>Derived Formula</span>
              </div>
              <Input
                disabled={disabled}
                placeholder="e.g. principal * 0.075"
                value={selectedField.formula || ""}
                onChange={(e) => onUpdateField({ formula: e.target.value || undefined })}
                className="h-7 text-xs bg-background font-mono"
              />
              <span className="text-[10px] text-muted-foreground/70 leading-tight block">
                Calculates automatically based on other field keys.
              </span>
            </div>

            {/* Field State & Validation Flags */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Validation & Flags
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={Boolean(selectedField.required)}
                  onChange={(e) => onUpdateField({ required: e.target.checked })}
                  className="rounded border-border size-3.5"
                />
                <span className="text-foreground">Required (Mandatory)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={Boolean(selectedField.readOnly)}
                  onChange={(e) => onUpdateField({ readOnly: e.target.checked })}
                  className="rounded border-border size-3.5"
                />
                <span className="text-foreground">Read-Only (Protected)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={Boolean(selectedField.hidden)}
                  onChange={(e) => onUpdateField({ hidden: e.target.checked })}
                  className="rounded border-border size-3.5"
                />
                <span className="text-foreground">Hidden from Form View</span>
              </label>
            </div>
          </>
        ) : selectedSection ? (
          /* ================================================================ */
          /* CONTAINER / SECTION INSPECTOR                                    */
          /* ================================================================ */
          <>
            {/* Section Title */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Container Title
              </Label>
              <Input
                disabled={disabled}
                value={selectedSection.title}
                onChange={(e) => onUpdateSection({ title: e.target.value })}
                className="h-7 text-xs bg-background"
                placeholder="e.g. Operating Parameters"
              />
            </div>

            {/* Description / Subtitle */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Subtitle / Guidance
              </Label>
              <Input
                disabled={disabled}
                value={selectedSection.description || ""}
                onChange={(e) => onUpdateSection({ description: e.target.value })}
                className="h-7 text-xs bg-background"
                placeholder="e.g. Mandatory account attributes"
              />
            </div>

            {/* ── Grid Columns Layout (User's Key Feature) ──────────────────── */}
            <div className="space-y-1.5 p-2 rounded-lg border border-border/80 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                  <Columns className="size-3 text-primary" />
                  <span>Grid Columns</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono h-4 px-1.5 text-primary border-primary/40 bg-primary/5"
                >
                  {selectedSection.columns || 1}{" "}
                  {selectedSection.columns === 1 ? "COLUMN" : "COLUMNS"}
                </Badge>
              </div>

              {/* 1, 2, 3, 4 Column Toggle Buttons */}
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

              <span className="text-[10px] text-muted-foreground/80 leading-snug block">
                {(selectedSection.columns || 1) === 1 &&
                  "1 Column: Fields stack vertically, 1 per row."}
                {selectedSection.columns === 2 &&
                  "2 Columns: Fields arrange side-by-side in 2 columns (50% / 50%)."}
                {selectedSection.columns === 3 &&
                  "3 Columns: Up to 3 fields per row (33% each). Columns can remain free if fewer fields exist."}
                {selectedSection.columns === 4 &&
                  "4 Columns: Compact 4-way split for high-density teller inputs."}
              </span>
            </div>

            {/* Container Type */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Container Type
              </Label>
              <Select
                disabled={disabled}
                value={selectedSection.type || "standard"}
                onValueChange={(val) =>
                  onUpdateSection({ type: (val || "standard") as FormSection["type"] })
                }
              >
                <SelectTrigger className="w-full h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="standard">Standard Container</SelectItem>
                  <SelectItem value="object-group">Object Group (Nested Object)</SelectItem>
                  <SelectItem value="array-table">Repeating Sub-Table</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                <span className="text-[10px] text-muted-foreground/70 leading-tight block">
                  Binds all fields inside this container into the nested model property.
                </span>
              </div>
            )}

            {/* Presentation Zone */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Presentation Zone
              </Label>
              <Select
                disabled={disabled}
                value={selectedSection.zone || "standard"}
                onValueChange={(val) => onUpdateSection({ zone: val as FormSection["zone"] })}
              >
                <SelectTrigger className="w-full h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="standard">Standard Flowing Container</SelectItem>
                  <SelectItem value="tab">Tabbed Page (Inside Tab Group)</SelectItem>
                  <SelectItem value="header">Fixed Master Header (Pinned at Top)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tab Settings (if Zone is 'tab') */}
            {selectedSection.zone === "tab" && (
              <div className="space-y-2 p-2 rounded border border-sky-500/30 bg-sky-500/5">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-400">
                  <Layers className="size-3" />
                  <span>Tab Group Settings</span>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Tab Button Label</Label>
                  <Input
                    disabled={disabled}
                    value={selectedSection.tabTitle || ""}
                    placeholder={selectedSection.title || "Tab Label"}
                    onChange={(e) => onUpdateSection({ tabTitle: e.target.value })}
                    className="h-7 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Tab Group ID</Label>
                  <Input
                    disabled={disabled}
                    value={selectedSection.tabGroupId || ""}
                    placeholder="e.g. tabgrp_remarks"
                    onChange={(e) => onUpdateSection({ tabGroupId: e.target.value || undefined })}
                    className="h-7 text-xs bg-background font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground/70 leading-tight block">
                    Tabs with the same Tab Group ID dock together into one tab strip.
                  </span>
                </div>
              </div>
            )}

            {/* Block Style */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Block Visual Style
              </Label>
              <Select
                disabled={disabled}
                value={selectedSection.layoutStyle || "card"}
                onValueChange={(val) => onUpdateSection({ layoutStyle: val as "card" | "plain" })}
              >
                <SelectTrigger className="w-full h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="card">Bordered Card Box</SelectItem>
                  <SelectItem value="plain">Plain / Borderless Canvas Block</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Behavior & Collapsible */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Container Behavior
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={Boolean(selectedSection.collapsible)}
                  onChange={(e) => onUpdateSection({ collapsible: e.target.checked })}
                  className="rounded border-border size-3.5"
                />
                <span className="text-foreground">Allow Container Collapse</span>
              </label>
              {selectedSection.collapsible && (
                <label className="flex items-center gap-2 cursor-pointer text-xs pl-5">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={Boolean(selectedSection.isCollapsed)}
                    onChange={(e) => onUpdateSection({ isCollapsed: e.target.checked })}
                    className="rounded border-border size-3.5"
                  />
                  <span className="text-muted-foreground">Default to Collapsed</span>
                </label>
              )}
            </div>

            {/* Field count summary */}
            <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Fields in container:</span>
              <span className="font-mono font-semibold text-foreground">
                {selectedSection.fields.length}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
