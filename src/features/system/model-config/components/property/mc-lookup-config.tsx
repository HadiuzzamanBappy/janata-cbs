"use client";

import { Database, ListOrdered } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { FieldRow } from "@/features/form-engine/components/widgets/field-row";
import { setFieldValue } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";
import { DROPDOWN_LOOKUP_SECTION, DROPDOWN_OPTIONS_SECTION } from "../../fields";

export interface McLookupConfigProps {
  property: ModelProperty;
  onUpdate: (sn: string, patch: Partial<ModelProperty>) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

export function McLookupConfig({ property, onUpdate, disabled, errors = {} }: McLookupConfigProps) {
  const param = property.PARAMETER as Record<string, unknown> | undefined;
  const paramType = param ? (param.type as string) || "O" : "NONE";

  // Normalize data items so each item has { code, label } and has at least one initial item
  const normalizedProperty = React.useMemo(() => {
    if (param?.type === "O") {
      const rawData = Array.isArray(param.data) ? param.data : [];
      const data =
        rawData.length > 0
          ? rawData.map((it: unknown) => {
              if (typeof it === "object" && it !== null) {
                const rec = it as Record<string, unknown>;
                const itemCode = String(rec.itemCode ?? rec.code ?? "");
                const itemLabel = String(rec.itemLabel ?? rec.label ?? itemCode);
                return { itemCode, itemLabel };
              }
              const str = String(it ?? "");
              return { itemCode: str, itemLabel: str };
            })
          : [{ itemCode: "", itemLabel: "" }];

      return {
        ...property,
        PARAMETER: {
          ...(param || {}),
          type: "O",
          data,
        },
      };
    }
    return property;
  }, [property, param]);

  const handleSetType = (t: "NONE" | "O" | "M") => {
    if (t === "NONE") {
      onUpdate(property.SN, {
        PARAMETER: undefined,
      });
      return;
    }

    onUpdate(property.SN, {
      PARAMETER: {
        ...(param || {}),
        type: t,
        data:
          t === "O"
            ? Array.isArray(param?.data) && param.data.length > 0
              ? param.data
              : [{ itemCode: "", itemLabel: "" }]
            : [],
      },
    });
  };

  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      const updated = setFieldValue(normalizedProperty as Record<string, unknown>, fieldKey, value);
      const nextParam = updated.PARAMETER as Record<string, unknown> | undefined;

      // Ensure data items are clean { itemCode, itemLabel } objects
      if (nextParam?.type === "O" && Array.isArray(nextParam.data)) {
        nextParam.data = nextParam.data.map((it: unknown) => {
          if (typeof it === "object" && it !== null) {
            const rec = it as Record<string, unknown>;
            const itemCode = String(rec.itemCode ?? rec.code ?? "");
            const itemLabel = String(rec.itemLabel ?? rec.label ?? itemCode);
            return {
              itemCode,
              itemLabel: itemLabel || itemCode,
            };
          }
          const str = String(it ?? "");
          return { itemCode: str, itemLabel: str };
        });
      }

      onUpdate(property.SN, {
        PARAMETER: nextParam as ModelProperty["PARAMETER"],
      });
    },
    [normalizedProperty, property.SN, onUpdate],
  );

  const activeSection = paramType === "M" ? DROPDOWN_LOOKUP_SECTION : DROPDOWN_OPTIONS_SECTION;

  return (
    <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
      {/* Section Header exactly matching Column Definition card */}
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Options & Model Lookup
        </span>
      </div>

      {/* Input Source as standard FieldRow with segmented controls */}
      <FieldRow label="Input Source">
        <div className="inline-flex flex-wrap items-center gap-0.5 rounded border border-border/80 bg-muted/40 p-0.5 max-w-full">
          <Button
            type="button"
            size="xs"
            variant={paramType === "NONE" ? "default" : "ghost"}
            disabled={disabled}
            onClick={() => handleSetType("NONE")}
            className={cn(
              "h-6 px-2 text-xs font-mono rounded transition-all shrink-0",
              paramType === "NONE"
                ? "shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Plain Text</span>
          </Button>
          <Button
            type="button"
            size="xs"
            variant={paramType === "O" ? "default" : "ghost"}
            disabled={disabled}
            onClick={() => handleSetType("O")}
            className={cn(
              "h-6 px-2 text-xs font-mono gap-1 rounded transition-all shrink-0",
              paramType === "O"
                ? "shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ListOrdered className="size-3" />
            <span>Options List (O)</span>
          </Button>
          <Button
            type="button"
            size="xs"
            variant={paramType === "M" ? "default" : "ghost"}
            disabled={disabled}
            onClick={() => handleSetType("M")}
            className={cn(
              "h-6 px-2 text-xs font-mono gap-1 rounded transition-all shrink-0",
              paramType === "M"
                ? "shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Database className="size-3" />
            <span>Model Lookup (M)</span>
          </Button>
        </div>
      </FieldRow>

      {/* Dynamic Sub-Form (Options List or Model Lookup fields) */}
      {paramType !== "NONE" && (
        <div className="pt-2 border-t border-border/30">
          <FormRenderer
            frmElements={{ sections: [activeSection] }}
            values={normalizedProperty as Record<string, unknown>}
            onChange={handleFieldChange}
            errors={errors}
            disabled={disabled}
            mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
          />
        </div>
      )}
    </div>
  );
}
