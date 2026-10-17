"use client";

import { STATIC_MODEL_CONFIG_LIST, STATIC_MODEL_CONFIGS } from "@fixtures";
import { Database, Sparkles } from "lucide-react";
import * as React from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cbs } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { getInquiryFieldValue, setInquiryFieldValue } from "../fields";

export interface IcGeneralTabProps {
  formData: InquiryConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<InquiryConfigRecord>>;
  isReadOnly?: boolean;
}

export function IcGeneralTab({ formData, setFormData, isReadOnly = false }: IcGeneralTabProps) {
  const [modelDef, setModelDef] = React.useState<ModelConfigRecord>(() => {
    return (
      (STATIC_MODEL_CONFIGS as Record<string, ModelConfigRecord>)["INQUIRY.CONFIG"] ||
      (STATIC_MODEL_CONFIGS as Record<string, ModelConfigRecord>).INQUIRY_CONFIG || {
        recordId: "INQUIRY.CONFIG",
        tableName: "INQUIRY_CONFIG",
        description: "Dynamic Inquiry & Query Definition Designer",
        prefix: "SC",
        category: "SYSTEM",
        servicePath: "default",
        userDefineId: true,
        predefineId: false,
        access: "G",
        readOnly: false,
        searchable: true,
        authorize: true,
        associates: [],
        devBy: "System",
        devDate: "2026-10-17",
        isActive: true,
        properties: [],
      }
    );
  });

  const [availableModels, setAvailableModels] = React.useState<
    Array<{ id: string; label: string }>
  >(() => {
    return (STATIC_MODEL_CONFIG_LIST as ModelConfigRecord[]).map((m) => ({
      id: m.recordId || m.tableName,
      label: `${m.tableName} — ${m.description || m.tableName}`,
    }));
  });

  React.useEffect(() => {
    let mounted = true;

    async function syncRegistry() {
      try {
        // 1. Fetch live INQUIRY.CONFIG model definition
        const res = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get("INQUIRY.CONFIG"), {
          silent: true,
        });
        if (mounted && res.status === "SUCCESS" && res.data) {
          setModelDef(res.data);
        }

        // 2. Fetch live CBS Models catalog
        const listRes = await cbs.send<Array<{ id: string; label: string }>>(
          cbs.modelConfig.list(),
          { silent: true },
        );
        if (mounted && listRes.status === "SUCCESS" && listRes.data && listRes.data.length > 0) {
          setAvailableModels(listRes.data);
        }
      } catch {
        // Safe fallback already initialized from fixtures
      }
    }

    syncRegistry();
    return () => {
      mounted = false;
    };
  }, []);

  const setValue = (path: string, val: unknown) => {
    setFormData((prev) => setInquiryFieldValue(prev, path, val));
  };

  const activeProperties: ModelProperty[] = modelDef.properties;

  return (
    <TooltipProvider delay={200}>
      <div className="h-full overflow-y-auto select-none pr-1">
        <div className="max-w-3xl space-y-3">
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Database className="size-3 text-primary" />
                <span>{modelDef.description || "Inquiry Identification & Target Entity"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono py-0 px-1.5 bg-muted/30 text-muted-foreground flex items-center gap-1"
                >
                  <Sparkles className="size-2.5 text-primary" />
                  <span>Model: {modelDef.recordId || modelDef.tableName || "INQUIRY.CONFIG"}</span>
                </Badge>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {activeProperties.length} Properties
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {activeProperties.map((prop) => {
                const val = getInquiryFieldValue(formData, prop.name);
                const isTargetModel = prop.name === "targetModel";
                const isIdField = prop.name === "id";
                const isRequired = prop.required && !isReadOnly;

                return (
                  <div key={prop.name} className="flex items-center gap-2">
                    {/* Field Label with hover Tooltip for enrichText */}
                    {prop.enrichText ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Label
                              title={prop.enrichText}
                              className="w-32 shrink-0 text-xs text-muted-foreground select-none cursor-help hover:text-foreground transition-colors flex items-center"
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
                      <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none flex items-center">
                        <span className="truncate">{prop.label}</span>
                        {isRequired && (
                          <span className="text-destructive font-bold ml-1 select-none">*</span>
                        )}
                      </Label>
                    )}

                    <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

                    <div className="flex-1 max-w-md">
                      {isTargetModel ? (
                        <Select
                          disabled={isReadOnly}
                          value={String(val || "")}
                          onValueChange={(newVal) => setValue("targetModel", newVal)}
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
                          value={val !== undefined && val !== null ? String(val) : ""}
                          onChange={(e) =>
                            setValue(prop.name, e.target.value ? Number(e.target.value) : undefined)
                          }
                          className="h-7 text-xs bg-background rounded border-border/80 w-32 font-mono"
                        />
                      ) : (
                        <Input
                          disabled={isReadOnly || prop.disabled}
                          placeholder={`Enter ${prop.label}...`}
                          value={String(val || "")}
                          onChange={(e) => {
                            const v = isIdField ? e.target.value.toUpperCase() : e.target.value;
                            setValue(prop.name, v);
                          }}
                          className={cn(
                            "h-7 text-xs bg-background rounded border-border/80",
                            isIdField && "font-mono uppercase",
                          )}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
