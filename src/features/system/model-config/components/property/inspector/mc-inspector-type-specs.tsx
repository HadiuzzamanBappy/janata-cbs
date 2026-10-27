"use client";

import { Boxes, Database, Plus, Sliders, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cbs } from "@/lib/cbs-client";
import type {
  ModelConfigRecord,
  ModelProperty,
  PropertyParameter,
  PropertyParameterOption,
  PropertyType,
} from "@/lib/data-schemas/model-config-schema";

interface McInspectorTypeSpecsProps {
  property: ModelProperty;
  allProperties?: ModelProperty[];
  isReadOnly: boolean;
  onUpdate: (sn: string, patch: Partial<ModelProperty>) => void;
  onSelectSN?: (sn: string) => void;
  onAddChild?: (parentSN: string) => void;
}

const isParameterized = (t: PropertyType): boolean =>
  t === "Dropdown" || t === "Checkbox" || t === "Radio";

export function McInspectorTypeSpecs({
  property,
  isReadOnly,
  onUpdate,
  onSelectSN,
  onAddChild,
}: McInspectorTypeSpecsProps) {
  // If property is an Object, render the Object Children Group Manager (Screenshot 1)
  if (property.TYPE === "Object") {
    const directChildren = property.PROP || [];

    return (
      <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Boxes className="size-3.5 text-primary" />
            <span>Object Children</span>
          </div>
          <Badge
            variant="outline"
            className="font-mono text-[10px] h-4.5 px-1.5 rounded uppercase tracking-wider text-primary border-primary/30"
          >
            {property.STRUCTURE === "M" ? "Object.M (Multi-Value)" : "Object (Single)"}
          </Badge>
        </div>

        <div className="max-w-xl space-y-2.5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add and arrange this object's child fields from the tree on the left (use the + on this
            object).
          </p>

          {directChildren.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Configured Child Fields ({directChildren.length})</span>
              </div>
              <div className="space-y-1 rounded border border-border/60 bg-muted/20 p-1.5 max-h-56 overflow-y-auto">
                {directChildren.map((child) => (
                  <button
                    type="button"
                    key={child.SN}
                    onClick={() => onSelectSN?.(child.SN)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs bg-background hover:bg-muted/60 cursor-pointer transition-colors border border-border/40 select-none text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                        #{child.SN}
                      </span>
                      <span className="font-medium truncate text-foreground">
                        {child.LABEL || child.NAME || "<unnamed>"}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] h-4 px-1 rounded text-muted-foreground shrink-0"
                    >
                      {child.TYPE}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!isReadOnly && onAddChild && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddChild(property.SN)}
                className="h-7 text-xs gap-1.5 px-3 rounded border-dashed"
              >
                <Plus className="size-3" />
                <span>Add Child Field</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  const parameter: PropertyParameter = property.PARAMETER ?? {
    TYPE: "O",
    DATA: [],
    MODELNAME: "",
    DISPLAYFIELD: "",
    CONDITION: "",
    REFERENCE: "",
  };

  const updateParameter = (patch: Partial<PropertyParameter>) => {
    onUpdate(property.SN, {
      PARAMETER: {
        ...parameter,
        ...patch,
      },
    });
  };

  // Normalize options with stable persistent IDs (independent of array indices)
  const options = (parameter.DATA ?? []).map((opt, i) => {
    if (opt.ID) return opt as PropertyParameterOption & { ID: string };
    const fallbackId = opt.ITEMCODE
      ? `opt-${property.SN}-${opt.ITEMCODE}`
      : `opt-${property.SN}-entry-${i + 1}`;
    return { ...opt, ID: fallbackId };
  });

  const handleAddOption = () => {
    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    updateParameter({
      DATA: [...options, { ID: newId, ITEMCODE: "", ITEMLABEL: "" }],
    });
  };

  const handleUpdateOption = (targetId: string, field: "ITEMCODE" | "ITEMLABEL", val: string) => {
    const nextData = options.map((opt) => (opt.ID === targetId ? { ...opt, [field]: val } : opt));
    updateParameter({ DATA: nextData });
  };

  const handleRemoveOption = (targetId: string) => {
    const nextData = options.filter((opt) => opt.ID !== targetId);
    updateParameter({ DATA: nextData });
  };

  return (
    <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sliders className="size-3.5 text-primary" />
          <span>Type-Dependent Specifications</span>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] h-4.5 px-1.5 rounded uppercase tracking-wider text-primary border-primary/30"
        >
          {property.TYPE} Mode
        </Badge>
      </div>

      <div className="space-y-2 text-xs">
        {/* Default Value */}
        <div className="flex items-start gap-2">
          <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none pt-1">
            Default Value
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs pt-1">:</span>
          <div className="max-w-md flex-1">
            {property.TYPE === "Boolean" ? (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant={property.DEFAULTVALUE === true ? "default" : "outline"}
                  size="sm"
                  disabled={isReadOnly}
                  onClick={() => onUpdate(property.SN, { DEFAULTVALUE: true })}
                  className="h-7 px-3 text-xs rounded flex-1"
                >
                  True
                </Button>
                <Button
                  type="button"
                  variant={property.DEFAULTVALUE === false ? "default" : "outline"}
                  size="sm"
                  disabled={isReadOnly}
                  onClick={() => onUpdate(property.SN, { DEFAULTVALUE: false })}
                  className="h-7 px-3 text-xs rounded flex-1"
                >
                  False
                </Button>
              </div>
            ) : property.TYPE === "Textarea" ? (
              <Textarea
                value={
                  property.DEFAULTVALUE !== undefined && property.DEFAULTVALUE !== null
                    ? String(property.DEFAULTVALUE)
                    : ""
                }
                disabled={isReadOnly}
                onChange={(e) => onUpdate(property.SN, { DEFAULTVALUE: e.target.value })}
                placeholder="Optional multiline initial text"
                rows={3}
                className="rounded text-xs bg-background border-border/80 w-full resize-y min-h-15"
              />
            ) : (
              <Input
                type={
                  property.TYPE === "Number" ? "number" : property.TYPE === "Date" ? "date" : "text"
                }
                value={
                  property.DEFAULTVALUE !== undefined && property.DEFAULTVALUE !== null
                    ? String(property.DEFAULTVALUE)
                    : ""
                }
                disabled={isReadOnly}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdate(property.SN, {
                    DEFAULTVALUE:
                      property.TYPE === "Number" ? (val === "" ? undefined : Number(val)) : val,
                  });
                }}
                placeholder={
                  property.TYPE === "Date"
                    ? "YYYY-MM-DD"
                    : property.TYPE === "Number"
                      ? "0.00"
                      : property.TYPE === "Array"
                        ? 'e.g. ["VAL1", "VAL2"] or comma-separated'
                        : isParameterized(property.TYPE)
                          ? "Default item code or blank"
                          : "Optional base fallback"
                }
                className="h-7 rounded text-xs bg-background border-border/80 w-full"
              />
            )}
          </div>
        </div>

        {/* Max Length / Digits Precision */}
        <div className="flex items-center gap-2">
          <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
            {property.TYPE === "Number" ? "Max Digits" : "Max Length"}
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
          <div className="flex items-center gap-2 max-w-md flex-1">
            <Input
              type="number"
              value={
                property.TYPE === "Boolean" ? 1 : property.TYPE === "Date" ? 10 : property.LENGTH
              }
              disabled={isReadOnly || property.TYPE === "Boolean" || property.TYPE === "Date"}
              onChange={(e) => onUpdate(property.SN, { LENGTH: Number(e.target.value) || 0 })}
              className="h-7 rounded text-xs font-mono w-28 bg-background border-border/80 disabled:opacity-75 disabled:bg-muted/40"
            />
            {property.TYPE === "Boolean" ? (
              <Badge
                variant="outline"
                className="text-[10px] font-normal text-muted-foreground h-5 rounded px-1.5 border-border/60"
              >
                Fixed (1 char / flag)
              </Badge>
            ) : property.TYPE === "Date" ? (
              <Badge
                variant="outline"
                className="text-[10px] font-normal text-muted-foreground h-5 rounded px-1.5 border-border/60"
              >
                Fixed (ISO 10 chars)
              </Badge>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                {property.TYPE === "Number"
                  ? "digits precision"
                  : property.TYPE === "Textarea"
                    ? "characters (multiline)"
                    : property.TYPE === "Array"
                      ? "buffer / item limit"
                      : isParameterized(property.TYPE)
                        ? "storage characters"
                        : "characters"}
              </span>
            )}
          </div>
        </div>

        {/* Layout Column Width */}
        <div className="flex items-center gap-2">
          <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
            Column Width
          </Label>
          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
          <div className="flex items-center gap-2 max-w-md flex-1">
            <Select
              value={property.WIDTH ? String(property.WIDTH) : "auto"}
              disabled={isReadOnly}
              onValueChange={(val: string | null) => {
                onUpdate(property.SN, {
                  WIDTH: val && val !== "auto" ? Number(val) : undefined,
                });
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-7 text-xs rounded bg-background border-border/80 w-36"
              >
                <SelectValue placeholder="Auto" />
              </SelectTrigger>
              <SelectContent className="rounded">
                <SelectItem value="auto" className="text-xs rounded">
                  Auto (Default)
                </SelectItem>
                <SelectItem value="3" className="text-xs rounded">
                  Col-3 (Quarter)
                </SelectItem>
                <SelectItem value="4" className="text-xs rounded">
                  Col-4 (Third)
                </SelectItem>
                <SelectItem value="6" className="text-xs rounded">
                  Col-6 (Half)
                </SelectItem>
                <SelectItem value="8" className="text-xs rounded">
                  Col-8 (Two Thirds)
                </SelectItem>
                <SelectItem value="12" className="text-xs rounded">
                  Col-12 (Full Width)
                </SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[11px] text-muted-foreground">
              {property.WIDTH ? `${property.WIDTH}/12 grid columns` : "Computed dynamically"}
            </span>
          </div>
        </div>

        {/* Parameter Configuration for Dropdown, Checkbox, Radio */}
        {isParameterized(property.TYPE) && (
          <div className="pt-2 border-t border-border/60 space-y-2 max-w-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Database className="size-3.5 text-primary" />
                <span>Options & Data Source</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={parameter.TYPE === "O" ? "default" : "outline"}
                  disabled={isReadOnly}
                  onClick={() => updateParameter({ TYPE: "O" })}
                  className="h-6 px-2 text-[11px] rounded"
                >
                  Options (Static)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={parameter.TYPE === "M" ? "default" : "outline"}
                  disabled={isReadOnly}
                  onClick={() => updateParameter({ TYPE: "M" })}
                  className="h-6 px-2 text-[11px] rounded"
                >
                  Model (DB)
                </Button>
              </div>
            </div>

            {parameter.TYPE === "O" ? (
              <div className="space-y-1.5 bg-muted/20 p-2 rounded border border-border/50">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  <span className="w-28 shrink-0">Item Code</span>
                  <span className="flex-1">Display Label</span>
                  <span className="w-6 text-center shrink-0">Act</span>
                </div>
                {options.map((opt) => (
                  <div key={opt.ID} className="flex items-center gap-2">
                    <Input
                      value={opt.ITEMCODE}
                      disabled={isReadOnly}
                      onChange={(e) => handleUpdateOption(opt.ID, "ITEMCODE", e.target.value)}
                      placeholder="e.g. 01"
                      className="h-6 text-xs font-mono w-28 shrink-0 bg-background"
                    />
                    <Input
                      value={opt.ITEMLABEL}
                      disabled={isReadOnly}
                      onChange={(e) => handleUpdateOption(opt.ID, "ITEMLABEL", e.target.value)}
                      placeholder="e.g. Active"
                      className="h-6 text-xs bg-background flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isReadOnly}
                      onClick={() => handleRemoveOption(opt.ID)}
                      className="size-6 text-muted-foreground hover:text-destructive rounded shrink-0"
                      title="Remove option"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isReadOnly}
                  onClick={handleAddOption}
                  className="h-6 text-[11px] gap-1 px-2 mt-1 rounded border-dashed"
                >
                  <Plus className="size-3" /> Add Option
                </Button>
              </div>
            ) : (
              <ModelLookupConfig
                parameter={parameter}
                isReadOnly={isReadOnly}
                onUpdate={updateParameter}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ModelLookupConfigProps {
  parameter: PropertyParameter;
  isReadOnly: boolean;
  onUpdate: (patch: Partial<PropertyParameter>) => void;
}

function ModelLookupConfig({ parameter, isReadOnly, onUpdate }: ModelLookupConfigProps) {
  const [modelCatalog, setModelCatalog] = React.useState<Array<{ id: string; label: string }>>([]);
  const [targetModelFields, setTargetModelFields] = React.useState<ModelProperty[]>([]);
  const [loadingModels, setLoadingModels] = React.useState(false);
  const [loadingFields, setLoadingFields] = React.useState(false);

  // 1. Fetch available models for the catalog dropdown
  React.useEffect(() => {
    let mounted = true;
    setLoadingModels(true);
    cbs
      .send<Array<{ id: string; label: string }>>(cbs.modelConfig.list(), { silent: true })
      .then((res) => {
        if (mounted && res.status === "SUCCESS" && Array.isArray(res.data)) {
          setModelCatalog(res.data.map((m) => ({ id: m.id, label: m.label || m.id })));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingModels(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. When MODELNAME changes, fetch its properties to populate Reference & Display dropdowns
  React.useEffect(() => {
    const targetModel = parameter.MODELNAME?.trim();
    if (!targetModel) {
      setTargetModelFields([]);
      return;
    }
    let mounted = true;
    setLoadingFields(true);
    cbs
      .send<ModelConfigRecord>(cbs.modelConfig.get(targetModel), { silent: true })
      .then((res) => {
        if (mounted && res.status === "SUCCESS" && res.data?.PROPERTIES) {
          setTargetModelFields(res.data.PROPERTIES);
        }
      })
      .catch(() => {
        if (mounted) setTargetModelFields([]);
      })
      .finally(() => {
        if (mounted) setLoadingFields(false);
      });
    return () => {
      mounted = false;
    };
  }, [parameter.MODELNAME]);

  return (
    <div className="bg-muted/15 p-2.5 rounded border border-border/70 space-y-2 text-xs">
      {/* 1. Target Model */}
      <div className="flex items-center gap-2">
        <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none flex items-center justify-between">
          <span>Target Model</span>
          {loadingModels && <span className="text-[9px] font-normal lowercase pr-1">...</span>}
        </Label>
        <span className="text-muted-foreground/60 font-mono text-xs">:</span>
        <div className="max-w-md flex-1">
          <Select
            value={parameter.MODELNAME || ""}
            disabled={isReadOnly || loadingModels}
            onValueChange={(val: string | null) => {
              onUpdate({
                MODELNAME: val || "",
                DISPLAYFIELD: "",
                REFERENCE: "",
              });
            }}
          >
            <SelectTrigger size="sm" className="h-7 text-xs bg-background w-full">
              <SelectValue
                placeholder={loadingModels ? "Loading models..." : "Select Model (DB)"}
              />
            </SelectTrigger>
            <SelectContent className="rounded max-h-56">
              {modelCatalog.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs font-mono">
                  {m.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Reference Field (Saved Value) */}
      <div className="flex items-center gap-2">
        <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none flex items-center justify-between">
          <span>Reference Field</span>
          {loadingFields && <span className="text-[9px] font-normal lowercase pr-1">...</span>}
        </Label>
        <span className="text-muted-foreground/60 font-mono text-xs">:</span>
        <div className="max-w-md flex-1">
          {targetModelFields.length > 0 ? (
            <Select
              value={parameter.REFERENCE || ""}
              disabled={isReadOnly || loadingFields}
              onValueChange={(val: string | null) => onUpdate({ REFERENCE: val || "" })}
            >
              <SelectTrigger size="sm" className="h-7 text-xs font-mono bg-background w-full">
                <SelectValue placeholder="Select reference key (DB column)" />
              </SelectTrigger>
              <SelectContent className="rounded max-h-56">
                {targetModelFields.map((f) => (
                  <SelectItem key={f.SN} value={f.NAME} className="text-xs font-mono">
                    {f.NAME}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={parameter.REFERENCE ?? ""}
              disabled={isReadOnly}
              onChange={(e) => onUpdate({ REFERENCE: e.target.value })}
              placeholder={parameter.MODELNAME ? "e.g. branchCode" : "Select model first"}
              className="h-7 text-xs font-mono bg-background w-full"
            />
          )}
        </div>
      </div>

      {/* 3. Display Field (UI Label) */}
      <div className="flex items-center gap-2">
        <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
          Display Field
        </Label>
        <span className="text-muted-foreground/60 font-mono text-xs">:</span>
        <div className="max-w-md flex-1">
          {targetModelFields.length > 0 ? (
            <Select
              value={parameter.DISPLAYFIELD || ""}
              disabled={isReadOnly || loadingFields}
              onValueChange={(val: string | null) => onUpdate({ DISPLAYFIELD: val || "" })}
            >
              <SelectTrigger size="sm" className="h-7 text-xs bg-background w-full">
                <SelectValue placeholder="Select display label (UI text)" />
              </SelectTrigger>
              <SelectContent className="rounded max-h-56">
                {targetModelFields.map((f) => (
                  <SelectItem key={f.SN} value={f.NAME} className="text-xs font-mono">
                    {f.LABEL || f.NAME}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={parameter.DISPLAYFIELD ?? ""}
              disabled={isReadOnly}
              onChange={(e) => onUpdate({ DISPLAYFIELD: e.target.value })}
              placeholder={parameter.MODELNAME ? "e.g. branchName" : "Select model first"}
              className="h-7 text-xs bg-background w-full"
            />
          )}
        </div>
      </div>

      {/* 4. Filter Condition Clause */}
      {(() => {
        // Parse existing condition string like "STATUS = 'ACTIVE'" or "REGION = 'DHAKA'"
        const raw = (parameter.CONDITION || "").trim();
        let fieldPart = "";
        let valPart = "";

        if (raw) {
          const match = raw.match(/^([A-Za-z0-9_]+)\s*=\s*['"]?(.*?)['"]?$/);
          if (match) {
            fieldPart = match[1];
            valPart = match[2];
          } else {
            valPart = raw;
          }
        }

        const handleConditionFieldChange = (newField: string | null) => {
          if (!newField) {
            onUpdate({ CONDITION: "" });
            return;
          }
          const nextVal = valPart || "ACTIVE";
          onUpdate({ CONDITION: `${newField} = '${nextVal}'` });
        };

        const handleConditionValChange = (newVal: string) => {
          if (!newVal && !fieldPart) {
            onUpdate({ CONDITION: "" });
            return;
          }
          const targetField = fieldPart || targetModelFields[0]?.NAME || "STATUS";
          onUpdate({ CONDITION: newVal ? `${targetField} = '${newVal}'` : "" });
        };

        return (
          <div className="flex items-center gap-2">
            <Label className="w-28 shrink-0 text-xs text-muted-foreground select-none">
              Condition
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs">:</span>
            <div className="flex items-center gap-1.5 max-w-md flex-1">
              {targetModelFields.length > 0 ? (
                <>
                  <Select
                    value={fieldPart}
                    disabled={isReadOnly}
                    onValueChange={handleConditionFieldChange}
                  >
                    <SelectTrigger size="sm" className="h-7 text-xs font-mono bg-background flex-1">
                      <SelectValue placeholder="Target field..." />
                    </SelectTrigger>
                    <SelectContent className="rounded max-h-56">
                      {targetModelFields.map((f) => (
                        <SelectItem key={f.SN} value={f.NAME} className="text-xs font-mono">
                          {f.NAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="font-mono text-xs text-muted-foreground font-bold px-0.5 select-none">
                    =
                  </span>

                  <Input
                    value={valPart}
                    disabled={isReadOnly}
                    onChange={(e) => handleConditionValChange(e.target.value)}
                    placeholder="e.g. ACTIVE"
                    className="h-7 text-xs font-mono bg-background flex-1"
                  />
                </>
              ) : (
                <Input
                  value={parameter.CONDITION ?? ""}
                  disabled={isReadOnly}
                  onChange={(e) => onUpdate({ CONDITION: e.target.value })}
                  placeholder="e.g. STATUS = 'ACTIVE'"
                  className="h-7 text-xs font-mono bg-background w-full"
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
