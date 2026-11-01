"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/features/form-engine/components/section-card";
import { cn } from "@/lib/core-utils";
import type {
  ModelProperty,
  PropertyType,
  ValidationErrorItem,
} from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";
import { PROPERTY_INSPECTOR_SECTIONS } from "../../fields";

interface McPropertyInspectorProps {
  property?: ModelProperty;
  isReadOnly: boolean;
  isCommitted?: boolean;
  validationErrors?: ValidationErrorItem[];
  onUpdate: (sn: string, patch: Partial<ModelProperty>) => void;
  onDelete: (sn: string, forceHardDelete?: boolean) => void;
}

export function McPropertyInspector({
  property,
  isReadOnly,
  isCommitted = false,
  validationErrors = [],
  onUpdate,
  onDelete,
}: McPropertyInspectorProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  // Map validation errors for this specific property
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (!property) return map;
    for (const err of validationErrors) {
      if (err.sn === property.SN && err.fieldKey) {
        map[err.fieldKey] = err.message;
      }
    }
    return map;
  }, [validationErrors, property]);

  // Form values record for the inspector
  const formValues = React.useMemo(() => {
    if (!property) return {};
    return {
      NAME: property.NAME,
      LABEL: property.LABEL,
      TYPE: property.TYPE,
      STRUCTURE: property.STRUCTURE,
      LENGTH: property.LENGTH ?? (property.TYPE === "Date" ? 10 : 50),
      WIDTH: property.WIDTH || "md",
      REQUIRED: property.REQUIRED ?? false,
    };
  }, [property]);

  // Centralized field change dispatcher
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      if (!property) return;
      const patch: Partial<ModelProperty> = {};

      if (fieldKey === "NAME") {
        patch.NAME = typeof value === "string" ? value.replace(/\s+/g, "") : "";
      } else if (fieldKey === "LABEL") {
        patch.LABEL = String(value ?? "");
      } else if (fieldKey === "TYPE") {
        const nextType = value as PropertyType;
        patch.TYPE = nextType;
        if (nextType === "Date") {
          patch.LENGTH = 10;
        } else if (nextType === "Number") {
          patch.LENGTH = 15;
        } else if (nextType === "Text") {
          patch.LENGTH = 50;
        }
      } else if (fieldKey === "STRUCTURE") {
        patch.STRUCTURE = (value as "S" | "M") || "S";
      } else if (fieldKey === "LENGTH") {
        patch.LENGTH = value !== "" && value !== undefined ? Number(value) : undefined;
      } else if (fieldKey === "WIDTH") {
        patch.WIDTH = value as ModelProperty["WIDTH"];
      } else if (fieldKey === "REQUIRED") {
        patch.REQUIRED = Boolean(value);
      }

      onUpdate(property.SN, patch);
    },
    [property, onUpdate],
  );

  if (!property) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 1. Header Bar */}
      <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs"
          >
            SN #{property.SN}
          </Badge>
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
            {property.NAME || "<UNNAMED_FIELD>"}
          </span>
          {property.LABEL && (
            <span className="text-xs text-muted-foreground truncate">— {property.LABEL}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px] h-5 rounded uppercase tracking-wider",
              !isCommitted
                ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                : "text-emerald-600 border-emerald-600/30 bg-emerald-600/10 dark:text-emerald-400",
            )}
          >
            {!isCommitted ? "Draft (New)" : "Active"}
          </Badge>

          <Badge
            variant="outline"
            className="font-mono text-[10px] h-5 rounded uppercase tracking-wider text-muted-foreground"
          >
            {property.TYPE} • {property.STRUCTURE === "M" ? "Multi" : "Single"}
          </Badge>

          {!isReadOnly && !isCommitted && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="h-6.5 text-xs rounded gap-1 px-2 ml-1 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Draft</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Form Engine Rendered Property Sections */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          {PROPERTY_INSPECTOR_SECTIONS.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              values={formValues}
              onChange={handleFieldChange}
              errors={errorMap}
              disabled={isReadOnly}
              mode={isReadOnly ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Draft Field?"
        description={
          <span className="text-xs text-muted-foreground leading-relaxed block">
            Permanently delete draft field #{property.SN} ({property.NAME || "UNNAMED"})? Since this
            field has not been saved or committed yet, it will be removed entirely.
          </span>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => onDelete(property.SN)}
      />
    </div>
  );
}
