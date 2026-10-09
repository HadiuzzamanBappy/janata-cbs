"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  MenuDesignerValidationError,
  MenuTreeRecord,
} from "@/lib/schemas/menu-designer-schema";
import { cn } from "@/lib/utils";
import {
  getMenuDesignerFieldValue,
  MENU_DESIGNER_FIELD_GROUPS,
  MENU_DESIGNER_META_FIELDS,
  type MenuDesignerFieldDef,
  setMenuDesignerFieldValue,
} from "../config/meta-fields";

interface DesignerGeneralTabProps {
  formData: MenuTreeRecord;
  setFormData: React.Dispatch<React.SetStateAction<MenuTreeRecord>>;
  isReadOnly: boolean;
  validationErrors?: MenuDesignerValidationError[];
}

export function DesignerGeneralTab({
  formData,
  setFormData,
  isReadOnly,
  validationErrors = [],
}: DesignerGeneralTabProps) {
  const handleInputChange = React.useCallback(
    (def: MenuDesignerFieldDef, rawValue: string) => {
      let finalVal: unknown = rawValue;
      if (def.uppercase) {
        finalVal = rawValue.toUpperCase();
      }
      setFormData((prev) => setMenuDesignerFieldValue(prev, def.path, finalVal));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl space-y-3">
        {MENU_DESIGNER_FIELD_GROUPS.map((group) => {
          const groupFields = MENU_DESIGNER_META_FIELDS.filter((f) => f.group === group.id);
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
                /* Group: Status Lifecycle card matching MODEL.CONFIG standards */
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
                          {formData.isActive ? "ACTIVE NAVIGATION" : "DRAFT / INACTIVE"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Data Fields: Top-to-Bottom scan line identical to MODEL.CONFIG */
                <div className="space-y-2 text-xs">
                  {groupFields.map((field) => {
                    const rawVal = getMenuDesignerFieldValue(formData, field.path);
                    const displayVal =
                      rawVal !== undefined && rawVal !== null ? String(rawVal) : "";

                    const inputWidth = field.width === "compact" ? "w-32" : "max-w-md flex-1";

                    const fieldError = validationErrors.find(
                      (e) => e.tab === "general" && e.fieldKey === field.path,
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
                            type="text"
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
