"use client";

import { PanelLeft, Trash2 } from "lucide-react";
import * as React from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { setFieldValue } from "@/lib/cbs-form-spec";
import type { ModelProperty, PropertyType } from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";
import { PROPERTY_INSPECTOR_SECTIONS } from "../../fields/mc-property-fields";
import type { ModelValidationErrorItem } from "../../hooks/mc-validation";
import { McLookupConfig } from "./mc-lookup-config";
import { McObjectPropsCard } from "./mc-object-props-card";

interface McPropertyInspectorProps {
  property?: ModelProperty;
  isReadOnly: boolean;
  isCommitted?: boolean;
  validationErrors?: ModelValidationErrorItem[];
  onUpdate: (sn: string, patch: Partial<ModelProperty>) => void;
  onDelete: (sn: string) => void;
  onSelectSubField?: (sn: string) => void;
  onAddSubField?: (parentSn: string) => string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  showSidebarToggle?: boolean;
}

export function McPropertyInspector({
  property,
  isReadOnly,
  isCommitted = false,
  validationErrors = [],
  onUpdate,
  onDelete,
  onSelectSubField,
  onAddSubField,
  onToggleSidebar,
  isSidebarOpen = false,
  showSidebarToggle = false,
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

  // Centralized field change dispatcher with setFieldValue
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      if (!property) return;
      let nextVal = value;
      if (fieldKey === "NAME" && typeof value === "string") {
        nextVal = value.replace(/\s+/g, "");
      }
      const updated = setFieldValue(property as Record<string, unknown>, fieldKey, nextVal);

      // Auto-suggest Display Label when Field Name is typed and Label is pristine
      if (fieldKey === "NAME" && typeof value === "string") {
        const cleanName = nextVal as string;
        const currentLabel = (property.LABEL || "").trim();
        const prevDerived = (property.NAME || "")
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        if (!currentLabel || currentLabel === prevDerived) {
          updated.LABEL = cleanName.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        }
      }

      // Type change side-effects
      if (fieldKey === "TYPE") {
        const nextType = value as PropertyType;
        if (nextType === "Date") updated.LENGTH = 10;
        else if (nextType === "DateTime") updated.LENGTH = 19;
        else if (nextType === "Amount") updated.LENGTH = 19;
        else if (nextType === "Rate") updated.LENGTH = 11;
        else if (nextType === "Number") updated.LENGTH = 15;
        else if (nextType === "Text") updated.LENGTH = 50;
        else if (nextType === "Boolean") {
          updated.LENGTH = 1;
          updated.STRUCTURE = "S";
        } else if (nextType === "Object") {
          updated.LENGTH = 0;
          if (!updated.PROP) updated.PROP = [];
        }

        // Clean up parameters when switching away from Text
        if (nextType !== "Text") {
          updated.PARAMETER = undefined;
        }
        // Clean up sub-properties when switching away from Object
        if (nextType !== "Object") {
          updated.PROP = undefined;
        }
      }

      onUpdate(property.SN, updated as ModelProperty);
    },
    [property, onUpdate],
  );

  // Dynamically adapt inspector section fields to property type (disable instead of hide)
  const inspectorSections = React.useMemo(() => {
    if (!property) return PROPERTY_INSPECTOR_SECTIONS;
    return PROPERTY_INSPECTOR_SECTIONS.map((sec) => {
      if (sec.id === "sec_prop_definition") {
        return {
          ...sec,
          fields: sec.fields.map((f) => {
            // Composite Object types don't have scalar storage Length -> disable Length
            if (f.NAME === "LENGTH" && property.TYPE === "Object") {
              return {
                ...f,
                DISABLED: true,
                ENRICHTEXT:
                  "Not applicable for Object (nested child properties define their own storage lengths).",
              };
            }
            // Date, DateTime, and Boolean have fixed physical database lengths -> disable Length
            if (
              f.NAME === "LENGTH" &&
              (property.TYPE === "Date" ||
                property.TYPE === "DateTime" ||
                property.TYPE === "Boolean")
            ) {
              return {
                ...f,
                DISABLED: true,
                ENRICHTEXT: `Fixed length (${property.LENGTH} chars) enforced by ${property.TYPE} database type.`,
              };
            }
            // Boolean is strictly scalar Single (S) -> disable Structure
            if (f.NAME === "STRUCTURE" && property.TYPE === "Boolean") {
              return {
                ...f,
                DISABLED: true,
                ENRICHTEXT: "Boolean is strictly a single (S) true/false flag.",
              };
            }
            return f;
          }),
        };
      }
      return sec;
    });
  }, [property]);

  if (!property) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 1. Header Bar */}
      <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {showSidebarToggle && onToggleSidebar && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onToggleSidebar}
              className="size-7 text-muted-foreground hover:text-foreground shrink-0 mr-0.5"
              title={isSidebarOpen ? "Hide Columns" : "Show Columns"}
            >
              <PanelLeft className="size-3.5" />
            </Button>
          )}

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
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs shrink-0"
          >
            SN #{property.SN}
          </Badge>

          {!isCommitted && (
            <Badge
              variant="outline"
              className="font-mono text-[10px] h-5 rounded uppercase tracking-wider text-amber-500 border-amber-500/30 bg-amber-500/10"
            >
              New
            </Badge>
          )}

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
          <FormRenderer
            frmElements={{ sections: inspectorSections }}
            values={property}
            onChange={handleFieldChange}
            errors={errorMap}
            disabled={isReadOnly}
            mode={isReadOnly ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
          />

          {/* 3. Text Options & Model Lookup Configuration Panel */}
          {(property.TYPE === "Text" || !property.TYPE) && (
            <McLookupConfig
              property={property}
              onUpdate={onUpdate}
              errors={errorMap}
              disabled={isReadOnly}
            />
          )}

          {/* 4. Object Group Sub-Properties (PROP) Definition Panel */}
          {property.TYPE === "Object" && (
            <McObjectPropsCard
              property={property}
              onSelectSubField={onSelectSubField}
              onAddSubField={onAddSubField}
              onDeleteSubField={onDelete}
              disabled={isReadOnly}
            />
          )}
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
