"use client";

import type * as React from "react";
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
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import { FORM_META_FIELDS, META_FIELD_GROUPS } from "../fields";

import type { ModelCatalogItem } from "../hooks/use-fc-catalog";

export interface FcGeneralTabProps {
  formData: FormConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>;
  isReadOnly?: boolean;
  availableModels?: ModelCatalogItem[];
}

export function FcGeneralTab({
  formData,
  setFormData,
  isReadOnly,
  availableModels = [],
}: FcGeneralTabProps) {
  const getValue = (path: string): unknown => {
    const parts = path.split(".");
    let current: unknown = formData;
    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== "object") return "";
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  };

  const setValue = (path: string, val: unknown) => {
    setFormData((prev) => {
      const parts = path.split(".");
      const clone = JSON.parse(JSON.stringify(prev)) as Record<string, unknown>;
      let current: Record<string, unknown> = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = val;
      return clone as typeof prev;
    });
  };

  return (
    <div className="h-full overflow-y-auto select-none">
      <div className="max-w-3xl space-y-3">
        {META_FIELD_GROUPS.map((group) => {
          const groupFields = FORM_META_FIELDS.filter((f) => f.group === group.id);
          if (groupFields.length === 0) return null;

          return (
            <div
              key={group.id}
              className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">
                {group.title}
              </div>

              <div className="space-y-2 text-xs">
                {groupFields.map((field) => {
                  const val = getValue(field.path);
                  const inputWidth =
                    field.width === "compact"
                      ? "w-28"
                      : field.width === "half"
                        ? "max-w-xs flex-1"
                        : "max-w-md flex-1";

                  return (
                    <div key={field.path} className="flex items-center gap-2">
                      <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none">
                        {field.label}
                        {field.required && !isReadOnly && (
                          <span className="text-destructive font-bold ml-1">*</span>
                        )}
                      </Label>

                      <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>

                      {field.type === "boolean" ? (
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={Boolean(val)}
                            onChange={(e) => setValue(field.path, e.target.checked)}
                            className="rounded border-border size-3.5"
                          />
                          <span className="text-xs text-muted-foreground">
                            {field.helperText || "Enable / Active"}
                          </span>
                        </label>
                      ) : field.type === "select" ? (
                        <div className={inputWidth}>
                          <Select
                            disabled={isReadOnly}
                            value={String(val || "")}
                            onValueChange={(newVal) => setValue(field.path, newVal)}
                          >
                            <SelectTrigger className="h-7 text-xs bg-background">
                              <SelectValue placeholder={`Select ${field.label}`} />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                              {(field.options || []).map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : field.path === "targetModel" && availableModels.length > 0 ? (
                        <div className={inputWidth}>
                          <Select
                            disabled={isReadOnly}
                            value={String(val || "")}
                            onValueChange={(newVal) => setValue(field.path, newVal)}
                          >
                            <SelectTrigger className="h-7 text-xs bg-background font-mono uppercase">
                              <SelectValue placeholder="Select Target Model" />
                            </SelectTrigger>
                            <SelectContent className="text-xs max-h-56">
                              {availableModels.map((m) => (
                                <SelectItem
                                  key={m.id}
                                  value={m.tableName || m.id}
                                  className="text-xs font-mono"
                                >
                                  <span>{m.tableName || m.id}</span>
                                  {m.label && (
                                    <span className="text-muted-foreground ml-2 text-[11px] font-sans">
                                      ({m.label})
                                    </span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className={cn("space-y-1", inputWidth)}>
                          <Input
                            disabled={isReadOnly}
                            placeholder={field.placeholder}
                            value={String(val || "")}
                            onChange={(e) => {
                              const v = field.uppercase
                                ? e.target.value.toUpperCase()
                                : e.target.value;
                              setValue(field.path, v);
                            }}
                            className={cn(
                              "h-7 text-xs bg-background rounded border-border/80",
                              field.uppercase && "font-mono uppercase",
                            )}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
