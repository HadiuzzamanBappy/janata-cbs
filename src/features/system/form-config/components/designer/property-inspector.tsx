"use client";

import {
  ArrowLeft,
  Columns,
  Database,
  Hash,
  HelpCircle,
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
import type { FormElement, FormSection } from "@/lib/data-schemas/form-config-schema";

export interface PropertyInspectorProps {
  selectedSection: FormSection | null;
  selectedField: FormElement | null;
  onUpdateSection: (patch: Partial<FormSection>) => void;
  onUpdateField: (patch: Partial<FormElement>) => void;
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
          Click any field or container on the canvas to configure its layout, parameters, and
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
          /* FIELD INSPECTOR (Canonical CBS 18 Properties)                    */
          /* ================================================================ */
          <>
            {/* Display Label */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Display Label</Label>
              <Input
                disabled={disabled}
                value={selectedField.LABEL || ""}
                onChange={(e) => onUpdateField({ LABEL: e.target.value })}
                className="h-7 text-xs bg-background"
                placeholder="Field label"
              />
            </div>

            {/* Model Field Key (Schema-Bound) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Field Key (NAME)
                </Label>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-[9px] font-mono h-3.5 px-1">
                    SN: {selectedField.SN}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono h-3.5 px-1 text-emerald-500 border-emerald-500/40 bg-emerald-500/5"
                  >
                    CANONICAL
                  </Badge>
                </div>
              </div>
              <div className="h-7 px-2.5 rounded border border-border/70 bg-muted/30 flex items-center text-xs font-mono text-foreground font-medium select-all truncate">
                {selectedField.NAME}
              </div>
            </div>

            {/* Field Type Selector */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Field Type</Label>
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
            </div>

            {/* Length & Structure Split */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Hash className="size-3 opacity-60" />
                  <span>Max Length</span>
                </Label>
                <Input
                  type="number"
                  disabled={disabled}
                  value={selectedField.LENGTH ?? 35}
                  onChange={(e) => onUpdateField({ LENGTH: Number(e.target.value) || 0 })}
                  className="h-7 text-xs bg-background font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Structure</Label>
                <Select
                  disabled={disabled}
                  value={selectedField.STRUCTURE || "S"}
                  onValueChange={(val: string | null) => onUpdateField({ STRUCTURE: val || "S" })}
                >
                  <SelectTrigger className="w-full h-7 text-xs bg-background font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="S">S (Single)</SelectItem>
                    <SelectItem value="M">M (Multi-value)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Width Preset / Width in PX */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Width (Pixels)
                </Label>
                <span className="text-[10px] font-mono text-muted-foreground/70">
                  {selectedField.WIDTH || 200}px
                </span>
              </div>
              <Input
                type="number"
                disabled={disabled}
                value={selectedField.WIDTH ?? 200}
                onChange={(e) => onUpdateField({ WIDTH: Number(e.target.value) || 200 })}
                className="h-7 text-xs bg-background font-mono"
              />
            </div>

            {/* Default Value */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Default Value</Label>
              <Input
                disabled={disabled}
                placeholder="Initial default value..."
                value={selectedField.DEFAULTVALUE || ""}
                onChange={(e) => onUpdateField({ DEFAULTVALUE: e.target.value })}
                className="h-7 text-xs bg-background font-mono"
              />
            </div>

            {/* Enrich Text (Guidance / Tooltip) */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <HelpCircle className="size-3 opacity-60" />
                <span>Help / Tooltip (ENRICHTEXT)</span>
              </Label>
              <Input
                disabled={disabled}
                placeholder="e.g. As stated on official documents"
                value={selectedField.ENRICHTEXT || ""}
                onChange={(e) => onUpdateField({ ENRICHTEXT: e.target.value })}
                className="h-7 text-xs bg-background"
              />
            </div>

            {/* Lookup / Parameter Section (if applicable) */}
            <div className="space-y-1.5 p-2 rounded border border-border/60 bg-muted/15">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                <Database className="size-3 text-primary" />
                <span>Lookup / Parameter (PARAMETER)</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Model Target</span>
                <Input
                  disabled={disabled}
                  placeholder="e.g. CUSTOMER, BRANCH"
                  value={selectedField.PARAMETER?.modelName || ""}
                  onChange={(e) =>
                    onUpdateField({
                      PARAMETER: {
                        ...(selectedField.PARAMETER || {
                          type: "O",
                          data: [],
                          modelName: "",
                          displayField: "",
                          condition: "",
                          reference: "",
                        }),
                        modelName: e.target.value,
                      },
                    })
                  }
                  className="h-7 text-xs bg-background font-mono"
                />
              </div>
            </div>

            {/* Field Flags */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Validation & Flags
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={Boolean(selectedField.REQUIRED)}
                  onChange={(e) => onUpdateField({ REQUIRED: e.target.checked })}
                  className="rounded border-border size-3.5"
                />
                <span className="text-foreground">Required (Mandatory)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={Boolean(selectedField.DISABLED)}
                  onChange={(e) => onUpdateField({ DISABLED: e.target.checked })}
                  className="rounded border-border size-3.5"
                />
                <span className="text-foreground">Disabled / Read-Only</span>
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

            {/* ── Grid Columns Layout ────────────────────────────────────────── */}
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
            </div>

            {/* Container Type */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Container Type
              </Label>
              <Select
                disabled={disabled}
                value={selectedSection.type || "standard"}
                onValueChange={(val: string | null) =>
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
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
