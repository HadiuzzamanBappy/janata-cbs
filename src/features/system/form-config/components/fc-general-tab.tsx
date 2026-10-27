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
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { CbsControlTable } from "@/types";

export interface FcGeneralTabProps {
  formData: FormConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>;
  isReadOnly?: boolean;
}

export function FcGeneralTab({ formData, setFormData, isReadOnly = false }: FcGeneralTabProps) {
  const [modelDef, setModelDef] = React.useState<ModelConfigRecord | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function loadFormModel() {
      try {
        const res = await cbs.send<ModelConfigRecord>(
          cbs.modelConfig.get(CbsControlTable.FORM_CONFIG),
          { silent: true },
        );
        if (mounted && res.status === "SUCCESS" && res.data) {
          setModelDef(res.data);
        }
      } catch {
        // Fallback initialized
      }
    }
    loadFormModel();
    return () => {
      mounted = false;
    };
  }, []);

  const setValue = (field: string, val: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const activeProperties: ModelProperty[] = modelDef?.PROPERTIES || [];

  return (
    <TooltipProvider delay={200}>
      <div className="h-full overflow-y-auto select-none pr-1">
        <div className="max-w-3xl space-y-3">
          {activeProperties.length === 0 ? (
            <div className="p-8 border border-dashed border-border/70 rounded-lg bg-card/40 text-center space-y-2">
              <Info className="size-8 mx-auto text-muted-foreground/60" />
              <div className="text-sm font-medium text-foreground">No Properties Configured</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No custom metadata properties configured in MODEL.CONFIG for FORM.CONFIG. Any
                properties added by the administrator in MODEL.CONFIG will appear here dynamically.
              </p>
            </div>
          ) : (
            <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Database className="size-3 text-primary" />
                  <span>{modelDef?.DESCRIPTION || "Dynamic Form Properties"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono py-0 px-1.5 bg-muted/30 text-muted-foreground flex items-center gap-1"
                  >
                    <Sparkles className="size-2.5 text-primary" />
                    <span>Model: FORM.CONFIG</span>
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {activeProperties.length} Properties
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {activeProperties.map((prop) => {
                  const val = formData[prop.NAME];
                  const isBoolean = prop.TYPE === "Boolean";
                  const isRequired = prop.REQUIRED && !isReadOnly;

                  return (
                    <div key={prop.NAME} className="flex items-center gap-2">
                      {prop.ENRICHTEXT ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Label
                                title={prop.ENRICHTEXT}
                                className="w-32 shrink-0 text-xs text-muted-foreground select-none cursor-help hover:text-foreground transition-colors flex items-center"
                              >
                                <span className="truncate underline decoration-dotted decoration-muted-foreground/50 underline-offset-2">
                                  {prop.LABEL}
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
                            {prop.ENRICHTEXT}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none flex items-center">
                          <span className="truncate">{prop.LABEL}</span>
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
                              id={`fc-prop-${prop.NAME}`}
                              disabled={isReadOnly || prop.DISABLED}
                              checked={Boolean(val)}
                              onCheckedChange={(checked: boolean) =>
                                setValue(prop.NAME, Boolean(checked))
                              }
                            />
                            <label
                              htmlFor={`fc-prop-${prop.NAME}`}
                              className="text-xs cursor-pointer select-none font-medium text-foreground"
                            >
                              {val ? "Yes" : "No"}
                            </label>
                          </div>
                        ) : prop.TYPE === "Dropdown" ? (
                          <Select
                            disabled={isReadOnly || prop.DISABLED}
                            value={String(val || prop.DEFAULTVALUE || "")}
                            onValueChange={(newVal: string | null) =>
                              setValue(prop.NAME, newVal ?? "")
                            }
                          >
                            <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44 font-sans">
                              <SelectValue placeholder={`Select ${prop.LABEL}...`} />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                              <SelectItem value="DEFAULT" className="text-xs">
                                Default
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            disabled={isReadOnly || prop.DISABLED}
                            placeholder={prop.ENRICHTEXT || `Enter ${prop.LABEL}...`}
                            value={String(val !== undefined ? val : prop.DEFAULTVALUE || "")}
                            onChange={(e) => setValue(prop.NAME, e.target.value)}
                            maxLength={prop.LENGTH}
                            className="h-7 text-xs bg-background rounded border-border/80 font-sans"
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
