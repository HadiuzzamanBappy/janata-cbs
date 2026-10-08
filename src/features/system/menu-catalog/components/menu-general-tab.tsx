"use client";

import * as React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getMenuFieldValue,
  MENU_FIELD_GROUPS,
  MENU_META_FIELDS,
  setMenuFieldValue,
  type MenuFieldDef,
} from "../config/menu-fields";
import type {
  MenuCatalogRecord,
  MenuValidationErrorItem,
} from "@/lib/schemas/menu-catalog-schema";

interface MenuGeneralTabProps {
  formData: MenuCatalogRecord;
  setFormData: React.Dispatch<React.SetStateAction<MenuCatalogRecord>>;
  isReadOnly: boolean;
  validationErrors?: MenuValidationErrorItem[];
}

export function MenuGeneralTab({
  formData,
  setFormData,
  isReadOnly,
  validationErrors = [],
}: MenuGeneralTabProps) {
  const handleInputChange = React.useCallback(
    (def: MenuFieldDef, rawValue: string) => {
      let finalVal: unknown = rawValue;
      if (def.uppercase) {
        finalVal = rawValue.toUpperCase();
      }
      setFormData((prev) => setMenuFieldValue(prev, def.path, finalVal));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="max-w-3xl space-y-3">
        {MENU_FIELD_GROUPS.map((group) => {
          const groupFields = MENU_META_FIELDS.filter((f) => f.group === group.id);
          const isStatusGroup = group.id === "STATUS";

          return (
            <div
              key={group.id}
              className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">
                {group.title}
              </div>

              {isStatusGroup ? (
                /* Group: Status rendered with Lifecycle state card identical to Model Config */
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2">
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
                          checked={Boolean(formData.isActive)}
                          disabled={isReadOnly}
                          onCheckedChange={(val) =>
                            setFormData((p) => ({ ...p, isActive: !!val }))
                          }
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
                          {formData.isActive ? "ACTIVE CATALOG ITEM" : "INACTIVE / HIDDEN"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Form Rows: Top-to-Bottom scan line identical to mc-general-tab */
                <div className="space-y-2 text-xs">
                  {groupFields.map((field) => {
                    const rawVal = getMenuFieldValue(formData, field.path);
                    const displayVal =
                      rawVal !== undefined && rawVal !== null ? String(rawVal) : "";

                    const inputWidth =
                      field.width === "compact"
                        ? "w-32"
                        : field.width === "full"
                          ? "max-w-md flex-1"
                          : "max-w-md flex-1";

                    const isRecordIdField = field.path === "recordId";
                    const fieldError = validationErrors.find(
                      (e) => e.tab === "general" && e.fieldKey === field.path,
                    );

                    if (field.type === "select") {
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
                            <div className={cn("max-w-md flex-1")}>
                              <Select
                                value={displayVal || "SCREEN"}
                                disabled={isReadOnly}
                                onValueChange={(val) => {
                                  if (val) handleInputChange(field, val);
                                }}
                              >
                                <SelectTrigger
                                  size="sm"
                                  className="h-7 text-xs rounded bg-background border-border/80 w-full"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded">
                                  {field.options?.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={opt.value}
                                      className="text-xs rounded"
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {fieldError && (
                            <div className="pl-35 text-[11px] text-destructive flex items-center gap-1 font-medium">
                              <span>• {fieldError.message}</span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (field.type === "textarea") {
                      return (
                        <div key={field.path} className="space-y-1">
                          <div className="flex items-start gap-2">
                            <Label
                              className={cn(
                                "w-32 shrink-0 text-xs select-none pt-1",
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
                            <span className="text-muted-foreground/60 font-mono text-xs pt-1">:</span>
                            <Textarea
                              value={displayVal}
                              disabled={isReadOnly}
                              onChange={(e) => handleInputChange(field, e.target.value)}
                              placeholder={field.placeholder}
                              rows={2}
                              className={cn(
                                "rounded text-xs bg-background border-border/80 max-w-md flex-1 resize-none",
                                fieldError
                                  ? "border-destructive focus-visible:ring-destructive/30 bg-destructive/5"
                                  : "border-border/80",
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
                    }

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
                            type="text"
                            value={displayVal}
                            disabled={isReadOnly || isRecordIdField}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={field.placeholder}
                            className={cn(
                              "h-7 rounded text-xs bg-background",
                              fieldError
                                ? "border-destructive focus-visible:ring-destructive/30 bg-destructive/5"
                                : "border-border/80",
                              (isReadOnly || isRecordIdField) &&
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
