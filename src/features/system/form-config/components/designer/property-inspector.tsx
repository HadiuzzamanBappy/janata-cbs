"use client";

import { Settings, X } from "lucide-react";
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
import type { FormFieldItem, FormSection } from "@/lib/data-schemas/form-config-schema";

export interface PropertyInspectorProps {
  selectedSection: FormSection | null;
  selectedField: FormFieldItem | null;
  onUpdateSection: (patch: Partial<FormSection>) => void;
  onUpdateField: (patch: Partial<FormFieldItem>) => void;
  onClose: () => void;
  disabled?: boolean;
}

export function PropertyInspector({
  selectedSection,
  selectedField,
  onUpdateSection,
  onUpdateField,
  onClose,
  disabled,
}: PropertyInspectorProps) {
  if (!selectedSection && !selectedField) {
    return (
      <div className="w-60 border-l border-border/70 bg-card/30 p-3 flex flex-col items-center justify-center text-center text-muted-foreground text-xs select-none shrink-0">
        <Settings className="size-5 opacity-30 mb-1.5" />
        <p className="text-[11px] leading-relaxed">
          Select a field or section on the canvas to configure properties.
        </p>
      </div>
    );
  }

  return (
    <div className="w-64 border-l border-border/70 bg-card/50 flex flex-col h-full select-none text-xs shrink-0">
      {/* Header */}
      <div className="px-2.5 py-1.5 border-b border-border/60 bg-muted/20 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Settings className="size-3 text-primary" />
          <span>{selectedField ? "Field Inspector" : "Section Inspector"}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded cursor-pointer"
        >
          <X className="size-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {selectedField ? (
          <>
            {/* Field Label */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Display Label</Label>
              <Input
                disabled={disabled}
                value={selectedField.label}
                onChange={(e) => onUpdateField({ label: e.target.value })}
                className="h-7 text-xs bg-background"
              />
            </div>

            {/* Field Key (Immutable Model Schema Binding) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground">Model Column</Label>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono h-3.5 px-1 text-emerald-500 border-emerald-500/40 bg-emerald-500/5"
                >
                  SCHEMA BOUND
                </Badge>
              </div>
              <div className="h-7 px-2.5 rounded border border-border/70 bg-muted/30 flex items-center text-xs font-mono text-foreground font-medium select-all">
                {selectedField.fieldKey}
              </div>
            </div>

            {/* Widget Type */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Widget Type</Label>
              <Select
                disabled={disabled}
                value={selectedField.widget}
                onValueChange={(val) => onUpdateField({ widget: val as FormFieldItem["widget"] })}
              >
                <SelectTrigger className="h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="text">Single Text</SelectItem>
                  <SelectItem value="amount">Amount / Currency</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date Picker</SelectItem>
                  <SelectItem value="select">Dropdown Select</SelectItem>
                  <SelectItem value="radio">Radio Group (Vertical)</SelectItem>
                  <SelectItem value="radio-group">Segmented Pills (Horizontal)</SelectItem>
                  <SelectItem value="checkbox-group">Multi-Checkbox Tags</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="switch">Boolean Switch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options List (for Select, Radio, Radio-Group, Checkbox-Group) */}
            {["select", "radio", "radio-group", "checkbox-group"].includes(
              selectedField.widget,
            ) && (
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Options (Comma-separated)
                </Label>
                <Input
                  disabled={disabled}
                  placeholder="e.g. SAVINGS, CURRENT, DEPOSIT"
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
                <span className="text-[10px] text-muted-foreground/60">
                  Defines selectable choices for this input.
                </span>
              </div>
            )}

            {/* Column Span */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Width (12-Col Span)</Label>
              <Select
                disabled={disabled}
                value={String(selectedField.colSpan)}
                onValueChange={(val) => onUpdateField({ colSpan: Number(val) })}
              >
                <SelectTrigger className="h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="12">Full Width (12-Col)</SelectItem>
                  <SelectItem value="6">Half Width (6-Col)</SelectItem>
                  <SelectItem value="4">One Third (4-Col)</SelectItem>
                  <SelectItem value="3">One Fourth (3-Col)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calculated Formula Expression */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Formula (Calculated)</Label>
              <Input
                disabled={disabled}
                placeholder="e.g. principal + charge"
                value={selectedField.formula || ""}
                onChange={(e) => onUpdateField({ formula: e.target.value || undefined })}
                className="h-7 text-xs bg-background font-mono"
              />
              <span className="text-[10px] text-muted-foreground/60">
                Auto-evaluates values across other field keys.
              </span>
            </div>

            {/* Flags */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selectedField.required}
                  onChange={(e) => onUpdateField({ required: e.target.checked })}
                  className="rounded border-border size-3.5"
                />
                <span className="text-foreground">Required Field</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selectedField.readOnly}
                  onChange={(e) => onUpdateField({ readOnly: e.target.checked })}
                  className="rounded border-border size-3.5"
                />
                <span className="text-foreground">Read-Only Field</span>
              </label>
            </div>
          </>
        ) : selectedSection ? (
          <>
            {/* Section Title */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Section Title</Label>
              <Input
                disabled={disabled}
                value={selectedSection.title}
                onChange={(e) => onUpdateSection({ title: e.target.value })}
                className="h-7 text-xs bg-background"
              />
            </div>

            {/* Layout Zone */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Presentation Zone</Label>
              <Select
                disabled={disabled}
                value={selectedSection.zone || "standard"}
                onValueChange={(val) => onUpdateSection({ zone: val as FormSection["zone"] })}
              >
                <SelectTrigger className="h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="header">Fixed Master Header (Pinned at Top)</SelectItem>
                  <SelectItem value="tab">Tabbed Page (In Body)</SelectItem>
                  <SelectItem value="standard">Standard Flowing Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tab Title (if Zone is 'tab') */}
            {selectedSection.zone === "tab" && (
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Tab Label</Label>
                <Input
                  disabled={disabled}
                  value={selectedSection.tabTitle || ""}
                  placeholder={selectedSection.title}
                  onChange={(e) => onUpdateSection({ tabTitle: e.target.value })}
                  className="h-7 text-xs bg-background"
                />
              </div>
            )}

            {/* Container Type */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Container Type</Label>
              <Select
                disabled={disabled}
                value={selectedSection.type}
                onValueChange={(val) => onUpdateSection({ type: val as FormSection["type"] })}
              >
                <SelectTrigger className="h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="standard">Standard Section</SelectItem>
                  <SelectItem value="object-group">Object Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Container Appearance / Card Style */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Block Style</Label>
              <Select
                disabled={disabled}
                value={selectedSection.layoutStyle || "card"}
                onValueChange={(val) => onUpdateSection({ layoutStyle: val as "card" | "plain" })}
              >
                <SelectTrigger className="h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="card">Bordered Card Container</SelectItem>
                  <SelectItem value="plain">Plain Block (No Card / Borderless)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Object Binding Key */}
            {selectedSection.type !== "standard" && (
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Target Object Key</Label>
                <Input
                  disabled={disabled}
                  value={selectedSection.bindKey || ""}
                  placeholder="e.g. presentAddress or nominees"
                  onChange={(e) => onUpdateSection({ bindKey: e.target.value })}
                  className="h-7 text-xs bg-background font-mono"
                />
              </div>
            )}

            {/* Collapsible Toggle */}
            <div className="pt-2 border-t border-border/60">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selectedSection.collapsible}
                  onChange={(e) => onUpdateSection({ collapsible: e.target.checked })}
                  className="rounded border-border size-3.5"
                />
                <span className="text-foreground">Allow Section Collapse</span>
              </label>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
