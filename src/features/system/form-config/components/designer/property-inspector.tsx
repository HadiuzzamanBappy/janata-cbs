"use client";

import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Database,
  Hash,
  Info,
  Layers,
  LayoutGrid,
  Plus,
  Settings,
  Table,
  Trash2,
  Type,
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
import type {
  FormElement,
  FormSection,
  FormWidgetType,
} from "@/lib/data-schemas/form-config-schema";
import {
  type ModelProperty,
  PROPERTY_WIDTHS,
  type PropertyWidth,
} from "@/lib/data-schemas/model-config-schema";

export interface PropertyInspectorProps {
  selectedSection: FormSection | null;
  selectedField: FormElement | null;
  modelProperties?: ModelProperty[];
  onUpdateSection: (patch: Partial<FormSection>) => void;
  onUpdateField: (patch: Partial<FormElement>) => void;
  onClose?: () => void;
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
  modelProperties = [],
  onUpdateSection,
  onUpdateField,
  onClose: _onClose,
  onDeselectField,
  disabled,
}: PropertyInspectorProps) {
  // Resolve underlying physical database model property (if available)
  const matchedModelProp = React.useMemo(() => {
    if (!selectedField) return null;
    return (
      modelProperties.find((p) => p.SN === selectedField.SN || p.NAME === selectedField.NAME) ||
      null
    );
  }, [modelProperties, selectedField]);

  // Determine normalized base physical type (TEXT | NUMBER | DATE)
  const baseType = React.useMemo<"TEXT" | "NUMBER" | "DATE">(() => {
    const rawType = (matchedModelProp?.TYPE || selectedField?.TYPE || "Text").toUpperCase();
    if (rawType.includes("NUM") || rawType.includes("AMOUNT")) return "NUMBER";
    if (rawType.includes("DATE") || rawType.includes("TIME")) return "DATE";
    return "TEXT";
  }, [matchedModelProp, selectedField]);

  // Canonical CBS Form Design Widgets available across the system
  const ALL_SYSTEM_WIDGETS: Array<{
    value: FormWidgetType;
    label: string;
    description: string;
    supportedBases: Array<"TEXT" | "NUMBER" | "DATE">;
  }> = React.useMemo(
    () => [
      {
        value: "text",
        label: "Text (Standard Input)",
        description: "Single-line alphanumeric input with casing/masking.",
        supportedBases: ["TEXT"],
      },
      {
        value: "number",
        label: "Number (Standard Numeric)",
        description: "Integer or standard numeric counter/input.",
        supportedBases: ["NUMBER"],
      },
      {
        value: "amount",
        label: "Amount (Financial Currency)",
        description: "Monetary amount with currency prefix & decimals.",
        supportedBases: ["NUMBER"],
      },
      {
        value: "date",
        label: "Date Picker (CBS Calendar)",
        description: "CBS calendar date selector.",
        supportedBases: ["DATE"],
      },
      {
        value: "select",
        label: "Select / Dropdown (Lookup)",
        description: "Model lookup or static key-value options.",
        supportedBases: ["TEXT", "NUMBER"],
      },
      {
        value: "radio-group",
        label: "Radio Group (Option Pills)",
        description: "Compact horizontal option pills for quick selection.",
        supportedBases: ["TEXT", "NUMBER"],
      },
      {
        value: "switch",
        label: "Switch (Toggle Y / N)",
        description: "Binary toggle switch for boolean flags.",
        supportedBases: ["TEXT", "NUMBER"],
      },
      {
        value: "checkbox",
        label: "Checkbox (Checkmark)",
        description: "Standard checkbox for binary status flags.",
        supportedBases: ["TEXT", "NUMBER"],
      },
    ],
    [],
  );

  // Compute widget availability and disabled state based on active field baseType
  const widgetSelectItems = React.useMemo(() => {
    return ALL_SYSTEM_WIDGETS.map((w) => ({
      ...w,
      isEligible: w.supportedBases.includes(baseType),
    }));
  }, [ALL_SYSTEM_WIDGETS, baseType]);

  // Resolve dynamic title and icon based on field or container type (always call hooks at top level)
  const inspectorHeader = React.useMemo(() => {
    if (selectedField) {
      const type = (selectedField.TYPE || "Text").toLowerCase();
      const widget = (selectedField.WIDGET || "").toLowerCase();
      let icon = <Type className="size-3.5 text-primary shrink-0" />;
      let title = "Text Field Properties";

      if (type.includes("number") || widget === "number" || widget === "amount") {
        icon = <Hash className="size-3.5 text-emerald-500 shrink-0" />;
        title = widget === "amount" ? "Amount Field Properties" : "Number Field Properties";
      } else if (type.includes("date") || widget === "date") {
        icon = <Calendar className="size-3.5 text-amber-500 shrink-0" />;
        title = "Date Field Properties";
      } else if (
        type.includes("dropdown") ||
        type.includes("select") ||
        widget === "select" ||
        widget === "radio-group"
      ) {
        icon = <ChevronDown className="size-3.5 text-cyan-500 shrink-0" />;
        title = "Lookup & Options Properties";
      } else if (widget === "switch" || widget === "checkbox" || type.includes("bool")) {
        icon = <Settings className="size-3.5 text-indigo-500 shrink-0" />;
        title = "Boolean / Switch Properties";
      } else {
        title = `${selectedField.LABEL || selectedField.NAME} Properties`;
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

  const [newOptionCode, setNewOptionCode] = React.useState("");
  const [newOptionLabel, setNewOptionLabel] = React.useState("");

  const handleAddStaticOption = () => {
    if (!newOptionCode.trim() || !selectedField) return;
    const currentParam = selectedField.PARAMETER || {
      type: "O",
      data: [],
      modelName: "",
      displayField: "",
      condition: "",
      reference: "",
    };
    const currentData = Array.isArray(currentParam.data) ? [...currentParam.data] : [];
    currentData.push({
      code: newOptionCode.trim().toUpperCase(),
      label: newOptionLabel.trim() || newOptionCode.trim(),
    });
    onUpdateField({
      PARAMETER: {
        ...currentParam,
        type: "O",
        data: currentData,
      },
    });
    setNewOptionCode("");
    setNewOptionLabel("");
  };

  const handleRemoveStaticOption = (index: number) => {
    if (!selectedField) return;
    const currentParam = selectedField.PARAMETER || {
      type: "O",
      data: [],
      modelName: "",
      displayField: "",
      condition: "",
      reference: "",
    };
    const currentData = Array.isArray(currentParam.data) ? [...currentParam.data] : [];
    currentData.splice(index, 1);
    onUpdateField({
      PARAMETER: {
        ...currentParam,
        data: currentData,
      },
    });
  };

  if (!selectedSection && !selectedField) {
    return (
      <div className="w-96 border-l border-border/70 bg-card/25 p-4 flex flex-col items-center justify-center text-center text-muted-foreground text-xs select-none shrink-0">
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
    <div className="w-96 border-l border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0 overflow-hidden">
      {/* ── Single Unified Header ─────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b border-border/60 bg-muted/25 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Back button: Shown whenever there is a parent container or field selected */}
          {selectedField && onDeselectField && (
            <button
              type="button"
              onClick={onDeselectField}
              className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
              title={
                selectedSection
                  ? `Back to ${selectedSection.tabTitle || selectedSection.title || "Container"}`
                  : "Back to container"
              }
            >
              <ArrowLeft className="size-3.5" />
            </button>
          )}

          {inspectorHeader.icon}

          <div className="truncate">
            <span className="font-semibold text-foreground text-xs">{inspectorHeader.title}</span>
          </div>
        </div>

        {/* Type badge on right */}
        <div className="flex items-center gap-1 shrink-0">
          {selectedField ? (
            <Badge
              variant="outline"
              className="text-[9px] font-mono h-4 px-1.5 uppercase tracking-wider text-cyan-400 border-cyan-500/30 bg-cyan-500/10 font-bold"
            >
              {selectedField.WIDGET || selectedField.TYPE || "FIELD"}
            </Badge>
          ) : selectedSection ? (
            <Badge
              variant="outline"
              className="text-[9px] font-mono h-4 px-1.5 uppercase tracking-wider text-primary border-primary/30 bg-primary/10 font-bold"
            >
              {selectedSection.zone === "tab"
                ? "TAB"
                : selectedSection.type === "object-group"
                  ? "OBJECT-GROUP"
                  : selectedSection.type === "array-table"
                    ? "ARRAY-TABLE"
                    : selectedSection.layoutStyle === "plain"
                      ? "CANVAS"
                      : "CARD"}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* ── Form Body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {selectedField ? (
          <>
            {/* ── GROUP 1: Fixed / Model Schema-Bound Anchor ── */}
            <div className="p-2.5 rounded-md border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="size-3 text-primary" />
                  <span>Physical Model Anchor</span>
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono h-3.5 px-1 uppercase tracking-wider text-muted-foreground border-border/80 bg-background"
                >
                  BASE: {baseType}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Column Key (NAME)
                  </span>
                  <span className="font-mono font-bold text-foreground truncate block select-all">
                    {selectedField.NAME}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Sequence (SN)
                  </span>
                  <span className="font-mono font-bold text-primary block">
                    #{selectedField.SN}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Physical Type
                  </span>
                  <span className="font-mono text-foreground block">
                    {matchedModelProp?.TYPE || selectedField.TYPE || "Text"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Structure
                  </span>
                  <span className="font-mono text-foreground block">
                    {selectedField.STRUCTURE === "M" ? "Multi-Value (M)" : "Single (S)"}
                  </span>
                </div>
              </div>
            </div>

            {/* ── GROUP 2: General Presentation Overrides ── */}
            <div className="space-y-3 pt-1">
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
                label="Enrich Text (Placeholder)"
                description="Contextual guidance shown on scanline or placeholder."
              >
                <Input
                  disabled={disabled}
                  placeholder="Guidance or placeholder..."
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
            </div>

            {/* ── GROUP 3: Dynamic Presentation Widget (Eligible by Base Type) ── */}
            <div className="p-2.5 rounded-md border border-primary/20 bg-primary/5 space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-primary/20 pb-1.5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="size-3" />
                  <span>UI Presentation Widget</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Eligible for {baseType}
                </span>
              </div>

              <InspectorRow
                label="Selected Widget"
                description={`Presentation widget on the banking form. Types incompatible with physical ${baseType} are disabled.`}
              >
                <Select
                  disabled={disabled}
                  value={
                    widgetSelectItems.some((w) => w.isEligible && w.value === selectedField.WIDGET)
                      ? selectedField.WIDGET
                      : widgetSelectItems.find((w) => w.isEligible)?.value || "text"
                  }
                  onValueChange={(val: string | null) => {
                    const chosen = widgetSelectItems.find((w) => w.value === val);
                    if (!chosen?.isEligible) return;

                    const widget = chosen.value;
                    let type = selectedField.TYPE;
                    if (widget === "amount" || widget === "number") type = "Number";
                    else if (widget === "date") type = "Date";
                    else if (widget === "select" || widget === "radio-group") type = "Select";
                    else if (widget === "switch" || widget === "checkbox") type = "Boolean";
                    else type = "Text";

                    onUpdateField({
                      WIDGET: widget,
                      TYPE: type,
                    });
                  }}
                >
                  <SelectTrigger className="w-full h-7 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {widgetSelectItems.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                        disabled={!item.isEligible}
                        className={cn(
                          "flex items-center justify-between text-xs",
                          !item.isEligible && "opacity-45 cursor-not-allowed text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={cn(item.isEligible ? "font-medium" : "line-through")}>
                            {item.label}
                          </span>
                        </div>
                        {!item.isEligible && (
                          <span className="text-[9px] font-mono text-muted-foreground/70 uppercase shrink-0">
                            (Req {item.supportedBases.join("/")})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InspectorRow>

              {/* Dynamic Type Config: Text / Masking */}
              {baseType === "TEXT" &&
                (selectedField.WIDGET === "text" || !selectedField.WIDGET) && (
                  <div className="space-y-2 pt-1 border-t border-border/50">
                    <InspectorRow label="Text Transform" description="Enforce casing on user input">
                      <Select
                        disabled={disabled}
                        value={selectedField.TEXT_CONFIG?.textTransform || "uppercase"}
                        onValueChange={(val: string | null) =>
                          onUpdateField({
                            TEXT_CONFIG: {
                              ...selectedField.TEXT_CONFIG,
                              autoTrim: selectedField.TEXT_CONFIG?.autoTrim ?? true,
                              maskPattern: selectedField.TEXT_CONFIG?.maskPattern || "",
                              textTransform: (val || "uppercase") as
                                | "uppercase"
                                | "lowercase"
                                | "none",
                            },
                          })
                        }
                      >
                        <SelectTrigger className="w-full h-7 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="uppercase">UPPERCASE (CBS Standard)</SelectItem>
                          <SelectItem value="lowercase">lowercase</SelectItem>
                          <SelectItem value="none">None (Standard)</SelectItem>
                        </SelectContent>
                      </Select>
                    </InspectorRow>
                    <InspectorRow
                      label="Input Mask Pattern"
                      description="e.g. 9999-9999-9999, SWIFT"
                    >
                      <Input
                        disabled={disabled}
                        placeholder="e.g. 9999-9999-9999"
                        value={selectedField.TEXT_CONFIG?.maskPattern || ""}
                        onChange={(e) =>
                          onUpdateField({
                            TEXT_CONFIG: {
                              ...selectedField.TEXT_CONFIG,
                              textTransform:
                                selectedField.TEXT_CONFIG?.textTransform || "uppercase",
                              autoTrim: selectedField.TEXT_CONFIG?.autoTrim ?? true,
                              maskPattern: e.target.value,
                            },
                          })
                        }
                        className="h-7 text-xs bg-background font-mono"
                      />
                    </InspectorRow>
                  </div>
                )}

              {/* Dynamic Type Config: Boolean & Switch */}
              {(selectedField.WIDGET === "switch" || selectedField.WIDGET === "checkbox") && (
                <div className="space-y-2 pt-1 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-1.5">
                    <InspectorRow label="True Value" description="Value stored in DB when active">
                      <Input
                        disabled={disabled}
                        value={selectedField.BOOLEAN_CONFIG?.trueValue ?? "Y"}
                        onChange={(e) =>
                          onUpdateField({
                            BOOLEAN_CONFIG: {
                              ...selectedField.BOOLEAN_CONFIG,
                              widgetStyle:
                                (selectedField.WIDGET as "switch" | "checkbox") || "switch",
                              trueValue: e.target.value,
                              falseValue: selectedField.BOOLEAN_CONFIG?.falseValue ?? "N",
                              activeLabel: selectedField.BOOLEAN_CONFIG?.activeLabel ?? "Enabled",
                              inactiveLabel:
                                selectedField.BOOLEAN_CONFIG?.inactiveLabel ?? "Disabled",
                            },
                          })
                        }
                        className="h-6 text-[10px] bg-background font-mono"
                      />
                    </InspectorRow>
                    <InspectorRow
                      label="False Value"
                      description="Value stored in DB when inactive"
                    >
                      <Input
                        disabled={disabled}
                        value={selectedField.BOOLEAN_CONFIG?.falseValue ?? "N"}
                        onChange={(e) =>
                          onUpdateField({
                            BOOLEAN_CONFIG: {
                              ...selectedField.BOOLEAN_CONFIG,
                              widgetStyle:
                                (selectedField.WIDGET as "switch" | "checkbox") || "switch",
                              trueValue: selectedField.BOOLEAN_CONFIG?.trueValue ?? "Y",
                              falseValue: e.target.value,
                              activeLabel: selectedField.BOOLEAN_CONFIG?.activeLabel ?? "Enabled",
                              inactiveLabel:
                                selectedField.BOOLEAN_CONFIG?.inactiveLabel ?? "Disabled",
                            },
                          })
                        }
                        className="h-6 text-[10px] bg-background font-mono"
                      />
                    </InspectorRow>
                  </div>
                </div>
              )}

              {/* Dynamic Type Config: Amount & Currency */}
              {(selectedField.WIDGET === "amount" ||
                (baseType === "NUMBER" && selectedField.WIDGET === "number")) && (
                <div className="space-y-2 pt-1 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-1.5">
                    <InspectorRow label="Decimals" description="Decimal precision">
                      <Input
                        type="number"
                        disabled={disabled}
                        value={
                          selectedField.NUMBER_CONFIG?.decimals ??
                          (selectedField.WIDGET === "amount" ? 2 : 0)
                        }
                        onChange={(e) =>
                          onUpdateField({
                            NUMBER_CONFIG: {
                              ...selectedField.NUMBER_CONFIG,
                              isCurrency: selectedField.WIDGET === "amount",
                              currencyCode: selectedField.NUMBER_CONFIG?.currencyCode ?? "",
                              allowNegative: selectedField.NUMBER_CONFIG?.allowNegative ?? false,
                              decimals: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="h-6 text-[10px] bg-background font-mono"
                      />
                    </InspectorRow>
                    <InspectorRow label="Currency Prefix" description="e.g. BDT, USD">
                      <Input
                        disabled={disabled}
                        placeholder="e.g. BDT"
                        value={selectedField.NUMBER_CONFIG?.currencyCode ?? ""}
                        onChange={(e) =>
                          onUpdateField({
                            NUMBER_CONFIG: {
                              ...selectedField.NUMBER_CONFIG,
                              isCurrency: true,
                              decimals: selectedField.NUMBER_CONFIG?.decimals ?? 2,
                              allowNegative: selectedField.NUMBER_CONFIG?.allowNegative ?? false,
                              currencyCode: e.target.value.toUpperCase(),
                            },
                          })
                        }
                        className="h-6 text-[10px] bg-background font-mono uppercase"
                      />
                    </InspectorRow>
                  </div>
                </div>
              )}

              {/* Dynamic Type Config: Lookup / Options */}
              {(selectedField.WIDGET === "select" || selectedField.WIDGET === "radio-group") && (
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
                        <InspectorRow
                          label="Code Field"
                          description="Value code property (e.g. ID, code)."
                        >
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
                    /* Static Key-Value Options List */
                    <div className="space-y-1.5">
                      <div className="max-h-36 overflow-y-auto space-y-1 rounded border border-border/60 bg-background/50 p-1">
                        {!selectedField.PARAMETER?.data ||
                        selectedField.PARAMETER.data.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground/60 text-center py-2 italic font-mono">
                            No options defined
                          </div>
                        ) : (
                          selectedField.PARAMETER.data.map((opt: unknown, idx: number) => {
                            const optCode =
                              typeof opt === "string"
                                ? opt
                                : (opt as Record<string, string>)?.code || "";
                            const optLabel =
                              typeof opt === "string"
                                ? opt
                                : (opt as Record<string, string>)?.label || optCode;
                            return (
                              <div
                                key={`opt_${optCode || ""}_${optLabel || ""}`}
                                className="flex items-center justify-between gap-1 text-[11px] px-1.5 py-0.5 rounded bg-muted/40 font-mono"
                              >
                                <span className="font-semibold text-foreground truncate">
                                  {optCode}
                                </span>
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
              )}
            </div>
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
