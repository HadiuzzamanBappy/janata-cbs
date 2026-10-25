"use client";

import { Database, Info, Sparkles } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cbs } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

export interface IcGeneralTabProps {
  formData: InquiryConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<InquiryConfigRecord>>;
  isReadOnly?: boolean;
}

export function IcGeneralTab({ formData, setFormData, isReadOnly = false }: IcGeneralTabProps) {
  const [modelDef, setModelDef] = React.useState<ModelConfigRecord>({
    tableName: "INQUIRY_CONFIG",
    description: "Dynamic Inquiry & Query Definition Designer",
    prefix: "SC",
    servicePath: "default",
    userDefineId: true,
    access: "G",
    readOnly: false,
    searchable: true,
    authorize: true,
    associates: [],
    devBy: "System",
    devDate: "2026-10-17",
    idDef: {
      idPrefix: "",
      idPattern: "",
      sequenceReset: false,
    },
    properties: [],
  });

  const availableModels: Array<{ id: string; label: string }> = [];

  React.useEffect(() => {
    let mounted = true;

    async function syncRegistry() {
      try {
        const res = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get("INQUIRY.CONFIG"), {
          silent: true,
        });
        if (mounted && res.status === "SUCCESS" && res.data) {
          setModelDef(res.data);
        }
      } catch {
        // Safe fallback
      }
    }

    syncRegistry();
    return () => {
      mounted = false;
    };
  }, []);

  const setValue = (field: string, val: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const activeProperties: ModelProperty[] = modelDef.properties || [];

  return (
    <TooltipProvider delay={200}>
      <div className="h-full overflow-y-auto select-none pr-1">
        <div className="max-w-3xl space-y-3">
          {activeProperties.length === 0 ? (
            <div className="p-8 border border-dashed border-border/70 rounded-lg bg-card/40 text-center space-y-2">
              <Info className="size-8 mx-auto text-muted-foreground/60" />
              <div className="text-sm font-medium text-foreground">No Properties Configured</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No custom metadata properties configured in MODEL.CONFIG for INQUIRY.CONFIG. Any
                properties added by the administrator in MODEL.CONFIG will appear here dynamically.
              </p>
            </div>
          ) : (
            <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Database className="size-3 text-primary" />
                  <span>{modelDef.description || "Inquiry Metadata Properties"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono py-0 px-1.5 bg-muted/30 text-muted-foreground flex items-center gap-1"
                  >
                    <Sparkles className="size-2.5 text-primary" />
                    <span>Model: INQUIRY.CONFIG</span>
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {activeProperties.length} Properties
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {activeProperties.map((prop) => {
                  const rawVal = (formData as Record<string, unknown>)[prop.name];
                  const val = rawVal !== undefined ? rawVal : (prop.defaultValue ?? "");
                  const isBoolean = prop.type === "Boolean";
                  const isRequired = prop.required && !isReadOnly;
                  const isPageOrientation = prop.name === "pageOrientation";
                  const isInqType = prop.name === "inqType";
                  const isController = prop.name === "controllerName";

                  return (
                    <div key={prop.name} className="flex items-center gap-2">
                      {prop.enrichText ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Label
                                title={prop.enrichText}
                                className="w-40 shrink-0 text-xs text-muted-foreground select-none cursor-help hover:text-foreground transition-colors flex items-center"
                              >
                                <span className="truncate underline decoration-dotted decoration-muted-foreground/50 underline-offset-2">
                                  {prop.label}
                                </span>
                                {isRequired && (
                                  <span className="text-destructive font-bold ml-1 select-none">
                                    *
                                  </span>
                                )}
                              </Label>
                            }
                          />
                          <TooltipContent side="top" className="text-xs max-w-xs shadow-md">
                            {prop.enrichText}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Label className="w-40 shrink-0 text-xs text-muted-foreground select-none flex items-center">
                          <span className="truncate">{prop.label}</span>
                          {isRequired && (
                            <span className="text-destructive font-bold ml-1 select-none">*</span>
                          )}
                        </Label>
                      )}

                      <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

                      <div className="flex-1 max-w-md">
                        {isBoolean ? (
                          <div className="flex items-center gap-2 h-7">
                            <Checkbox
                              id={`inq-prop-${prop.name}`}
                              disabled={isReadOnly || prop.disabled}
                              checked={Boolean(val)}
                              onCheckedChange={(checked) => setValue(prop.name, Boolean(checked))}
                            />
                            <label
                              htmlFor={`inq-prop-${prop.name}`}
                              className="text-xs cursor-pointer select-none font-medium text-foreground"
                            >
                              {val ? "Yes" : "No"}
                            </label>
                          </div>
                        ) : isPageOrientation ? (
                          <Select
                            disabled={isReadOnly || prop.disabled}
                            value={String(val || "Portrait")}
                            onValueChange={(newVal) => setValue("pageOrientation", newVal)}
                          >
                            <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-36 font-sans">
                              <SelectValue placeholder="Orientation..." />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                              <SelectItem value="Portrait" className="text-xs">
                                Portrait
                              </SelectItem>
                              <SelectItem value="Landscape" className="text-xs">
                                Landscape
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : isInqType ? (
                          <Select
                            disabled={isReadOnly || prop.disabled}
                            value={String(val || "DFT")}
                            onValueChange={(newVal) => setValue("inqType", newVal)}
                          >
                            <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-52 font-sans">
                              <SelectValue placeholder="Inquiry Type..." />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                              <SelectItem value="DFT" className="text-xs font-sans">
                                DFT (Data From Table)
                              </SelectItem>
                              <SelectItem value="DFR" className="text-xs font-sans">
                                DFR (Data From Routine)
                              </SelectItem>
                              <SelectItem value="DFV" className="text-xs font-sans">
                                DFV (Data From View)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : isController && availableModels.length > 0 ? (
                          <Select
                            disabled={isReadOnly || prop.disabled}
                            value={String(val || "")}
                            onValueChange={(newVal) => setValue("controllerName", newVal)}
                          >
                            <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 font-mono">
                              <SelectValue placeholder="Select Target CBS Model..." />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                              {availableModels.map((m) => (
                                <SelectItem key={m.id} value={m.id} className="text-xs font-mono">
                                  {m.label || m.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : prop.type === "Number" ? (
                          <Input
                            type="number"
                            disabled={isReadOnly || prop.disabled}
                            value={val !== undefined && val !== null ? String(val) : "50"}
                            onChange={(e) =>
                              setValue(prop.name, e.target.value ? Number(e.target.value) : 0)
                            }
                            className="h-7 text-xs bg-background rounded border-border/80 w-28 font-mono"
                          />
                        ) : (
                          <Input
                            disabled={isReadOnly || prop.disabled}
                            placeholder={prop.enrichText || `Enter ${prop.label}...`}
                            value={String(val || "")}
                            onChange={(e) => {
                              const isUpper =
                                prop.name === "controllerName" || prop.name === "rptControllerName";
                              setValue(
                                prop.name,
                                isUpper ? e.target.value.toUpperCase() : e.target.value,
                              );
                            }}
                            className={cn(
                              "h-7 text-xs bg-background rounded border-border/80",
                              (prop.name === "controllerName" ||
                                prop.name === "rptControllerName") &&
                                "font-mono uppercase",
                            )}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
