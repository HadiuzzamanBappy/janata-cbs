"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  getFieldValue,
  META_FIELD_GROUPS,
  MODEL_META_FIELDS,
  setFieldValue,
  type MetaFieldDef,
} from "../config/meta-fields";
import type { ModelConfigRecord, ValidationErrorItem } from "@/lib/schemas/model-config-schema";

interface McGeneralTabProps {
  formData: ModelConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<ModelConfigRecord>>;
  isReadOnly: boolean;
  validationErrors?: ValidationErrorItem[];
}

export function McGeneralTab({
  formData,
  setFormData,
  isReadOnly,
  validationErrors = [],
}: McGeneralTabProps) {
  const handleInputChange = React.useCallback(
    (def: MetaFieldDef, rawValue: string) => {
      let finalVal: unknown = rawValue;
      if (def.type === "number") {
        finalVal = rawValue ? Number(rawValue) : undefined;
      } else if (def.type === "tags") {
        finalVal = rawValue
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
      } else if (def.uppercase) {
        finalVal = rawValue.toUpperCase();
      }
      setFormData((prev) => setFieldValue(prev, def.path, finalVal));
    },
    [setFormData],
  );

  const handleBooleanChange = React.useCallback(
    (def: MetaFieldDef, checked: boolean) => {
      setFormData((prev) => setFieldValue(prev, def.path, checked));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl space-y-3">
        {META_FIELD_GROUPS.map((group) => {
          const groupFields = MODEL_META_FIELDS.filter((f) => f.group === group.id);
          const isFlagsGroup = group.id === "FLAGS";

          return (
            <div
              key={group.id}
              className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">
                {group.title}
              </div>

              {isFlagsGroup ? (
                /* Group: Flags rendered with label on left and checkboxes aligned on the same side */
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none pt-0.5">
                      System Flags
                    </Label>
                    <span className="text-muted-foreground/60 font-mono text-xs pt-0.5">:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 max-w-lg flex-1">
                      {groupFields.map((field) => {
                        const isChecked = Boolean(getFieldValue(formData, field.path));
                        return (
                          <label
                            key={field.path}
                            className={cn(
                              "flex items-center gap-1.5 select-none",
                              isReadOnly ? "cursor-default opacity-85" : "cursor-pointer",
                            )}
                          >
                            <Checkbox
                              checked={isChecked}
                              disabled={isReadOnly}
                              onCheckedChange={(val) => handleBooleanChange(field, !!val)}
                              className={cn(
                                "rounded",
                                isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs font-medium",
                                isReadOnly && isChecked
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {field.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Lifecycle Indicator aligned on the same scan line */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                    <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none">
                      Lifecycle State
                    </Label>
                    <span className="text-muted-foreground/60 font-mono text-xs">:</span>
                    <div className="flex items-center gap-3 max-w-lg flex-1">
                      <label
                        className={cn(
                          "flex items-center gap-2 select-none",
                          isReadOnly ? "cursor-default" : "cursor-pointer",
                        )}
                      >
                        <Checkbox
                          checked={formData.isActive}
                          disabled={isReadOnly}
                          onCheckedChange={(val) => setFormData((p) => ({ ...p, isActive: !!val }))}
                          className={cn(
                            "rounded",
                            isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[11px] font-mono font-medium px-2 py-0.5 rounded border",
                            formData.isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border/60",
                          )}
                        >
                          {formData.isActive ? "ACTIVE MODEL" : "DRAFT MODEL"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Data Fields: Top-to-Bottom with inputs aligned on same left side */
                <div className="space-y-2 text-xs">
                  {groupFields.map((field) => {
                    const rawVal = getFieldValue(formData, field.path);
                    const displayVal = Array.isArray(rawVal)
                      ? rawVal.join(", ")
                      : rawVal !== undefined && rawVal !== null
                        ? String(rawVal)
                        : "";

                    if (field.type === "boolean") {
                      return (
                        <div key={field.path} className="flex items-center gap-2">
                          <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none">
                            {field.label}
                          </Label>
                          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
                          <div className="flex items-center gap-2 max-w-md flex-1">
                            <label
                              className={cn(
                                "flex items-center gap-1.5 select-none",
                                isReadOnly ? "cursor-default opacity-85" : "cursor-pointer",
                              )}
                            >
                              <Checkbox
                                checked={Boolean(rawVal)}
                                disabled={isReadOnly}
                                onCheckedChange={(val) => handleBooleanChange(field, !!val)}
                                className={cn(
                                  "rounded",
                                  isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                                )}
                              />
                              {field.helperText && (
                                <span className="text-xs text-muted-foreground">
                                  {field.helperText}
                                </span>
                              )}
                            </label>
                          </div>
                        </div>
                      );
                    }

                    if (field.type === "checkbox-group") {
                      const selectedValues = Array.isArray(rawVal) ? (rawVal as string[]) : [];
                      return (
                        <div key={field.path} className="flex items-center gap-2">
                          <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none">
                            {field.label}
                          </Label>
                          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
                          <div className="flex items-center gap-4 max-w-md flex-1">
                            {field.options?.map((opt) => {
                              const isChecked = selectedValues.includes(opt.value);
                              return (
                                <label
                                  key={opt.value}
                                  className={cn(
                                    "flex items-center gap-1.5 select-none",
                                    isReadOnly ? "cursor-default opacity-85" : "cursor-pointer",
                                  )}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    disabled={isReadOnly}
                                    onCheckedChange={(checked) => {
                                      const next = checked
                                        ? [...selectedValues, opt.value]
                                        : selectedValues.filter((v) => v !== opt.value);
                                      setFormData((prev) => setFieldValue(prev, field.path, next));
                                    }}
                                    className={cn(
                                      "rounded",
                                      isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                                    )}
                                  />
                                  <span className="text-xs font-mono font-medium text-foreground">
                                    {opt.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    const inputWidth =
                      field.width === "compact"
                        ? "w-28"
                        : field.type === "number"
                          ? "w-28"
                          : "max-w-md flex-1";

                    const lastSegment = field.path.split(".").pop();
                    const fieldError = validationErrors.find(
                      (e) =>
                        e.tab === "general" &&
                        (e.fieldKey === field.path || e.fieldKey === lastSegment),
                    );

                    return (
                      <div key={field.path} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label
                            className={cn(
                              "w-32 shrink-0 text-xs select-none",
                              fieldError
                                ? "text-destructive font-semibold"
                                : field.required
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground",
                            )}
                          >
                            {field.label}
                            {field.required && (
                              <span className="text-destructive font-bold ml-1">*</span>
                            )}
                          </Label>
                          <span className="text-muted-foreground/60 font-mono text-xs">:</span>
                          <Input
                            type={field.type === "number" ? "number" : "text"}
                            value={displayVal}
                            disabled={isReadOnly}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={field.placeholder}
                            className={cn(
                              "h-7 rounded text-xs bg-background",
                              fieldError
                                ? "border-destructive focus-visible:ring-destructive/30 bg-destructive/5"
                                : "border-border/80",
                              isReadOnly &&
                                "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium text-foreground",
                              field.uppercase ? "font-mono uppercase" : "",
                              inputWidth,
                            )}
                          />
                        </div>
                        {fieldError && (
                          <div className="pl-35 text-[11px] text-destructive flex items-center gap-1 font-medium">
                            <span>• {fieldError.message}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
