"use client";

import { Shield } from "lucide-react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { FieldRow } from "@/features/form-engine/components/widgets/field-row";
import { cn } from "@/lib/core-utils";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import {
  FORM_META_FIELDS,
  getFieldValue,
  META_FIELD_GROUPS,
  type MetaFieldDef,
  setFieldValue,
} from "../fields";

export interface FcGeneralTabProps {
  formData: FormConfigRecord;
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>;
  isReadOnly?: boolean;
}

export function FcGeneralTab({ formData, setFormData, isReadOnly = false }: FcGeneralTabProps) {
  const handleInputChange = React.useCallback(
    (def: MetaFieldDef, rawValue: string) => {
      let finalVal: unknown = rawValue;
      if (def.type === "number") {
        finalVal = rawValue ? Number(rawValue) : 1;
      } else if (def.uppercase) {
        finalVal = rawValue.toUpperCase();
      }
      setFormData((prev) => setFieldValue(prev, def.path, finalVal));
    },
    [setFormData],
  );

  return (
    <div className="h-full overflow-y-auto select-none pr-1">
      <div className="max-w-3xl space-y-3 pb-8">
        {/* Core Field Groups */}
        {META_FIELD_GROUPS.map((group) => {
          const groupFields = FORM_META_FIELDS.filter((f) => f.group === group.id);

          return (
            <div
              key={group.id}
              className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
                <span>{group.title}</span>
                {group.id === "AUTHORIZATION" && <Shield className="size-3 text-primary" />}
              </div>

              <div className="space-y-2.5 text-xs">
                {groupFields.map((field) => {
                  const rawVal = getFieldValue(formData, field.path);
                  const displayVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : "";

                  return (
                    <FieldRow
                      key={field.path}
                      label={field.label}
                      required={field.required && !isReadOnly}
                      enrichText={field.helperText}
                    >
                      <div
                        className={cn(
                          "flex-1",
                          field.width === "compact"
                            ? "max-w-30"
                            : field.width === "half"
                              ? "max-w-xs"
                              : "max-w-md",
                        )}
                      >
                        <Input
                          type={field.type === "number" ? "number" : "text"}
                          disabled={isReadOnly}
                          value={displayVal}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          className={cn(
                            "h-7 text-xs bg-background rounded border-border/80",
                            field.uppercase && "font-mono uppercase",
                            field.type === "number" && "font-mono",
                          )}
                        />
                      </div>
                    </FieldRow>
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
