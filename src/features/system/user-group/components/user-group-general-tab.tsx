"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  USER_GROUP_FIELD_GROUPS,
  USER_GROUP_META_FIELDS,
  type UserGroupMetaFieldDef,
} from "../config/meta-fields";
import type { UserGroupRecord, UserGroupValidationError } from "@/lib/schemas/user-group-schema";

interface UserGroupGeneralTabProps {
  formData: UserGroupRecord;
  setFormData: React.Dispatch<React.SetStateAction<UserGroupRecord>>;
  isReadOnly: boolean;
  validationErrors?: UserGroupValidationError[];
}

export function UserGroupGeneralTab({
  formData,
  setFormData,
  isReadOnly,
  validationErrors = [],
}: UserGroupGeneralTabProps) {
  const handleInputChange = React.useCallback(
    (def: UserGroupMetaFieldDef, rawValue: string) => {
      let finalVal: string = rawValue;
      if (def.uppercase) {
        finalVal = rawValue.toUpperCase();
      }
      setFormData((prev) => ({
        ...prev,
        [def.path]: finalVal,
      }));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl space-y-3">
        {USER_GROUP_FIELD_GROUPS.map((group) => {
          const groupFields = USER_GROUP_META_FIELDS.filter((f) => f.group === group.id);
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
                /* Group: Status Lifecycle card matching MODEL.CONFIG standards exactly */
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
                          {formData.isActive ? "ACTIVE GROUP" : "INACTIVE / DISABLED"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Data Fields: Top-to-Bottom scan line identical to MODEL.CONFIG */
                <div className="space-y-2 text-xs">
                  {groupFields.map((field) => {
                    const raw = formData[field.path];
                    const displayVal = typeof raw === "string" ? raw : "";

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
                              <span className="text-destructive font-bold ml-0.5">*</span>
                            )}
                          </Label>

                          <span className="text-muted-foreground/60 font-mono text-xs">:</span>

                          <div className={cn("relative flex items-center", inputWidth)}>
                            <Input
                              value={displayVal}
                              disabled={isReadOnly}
                              placeholder={field.placeholder}
                              onChange={(e) => handleInputChange(field, e.target.value)}
                              className={cn(
                                "h-7 text-xs bg-background/50 border-border/80 focus:border-primary transition-colors",
                                fieldError &&
                                  "border-destructive focus-visible:ring-destructive/30 text-destructive",
                              )}
                            />
                          </div>
                        </div>

                        {fieldError && (
                          <div className="pl-34 text-[11px] text-destructive flex items-center gap-1 font-medium">
                            <span>⚠ {fieldError.message}</span>
                          </div>
                        )}

                        {field.helperText && !fieldError && (
                          <div className="pl-34 text-[10px] text-muted-foreground/80 leading-normal">
                            {field.helperText}
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
