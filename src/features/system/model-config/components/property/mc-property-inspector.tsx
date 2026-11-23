/**
 * @fileoverview Property inspector panel for MODEL.CONFIG properties.
 * Renders column definitions and physical constraints using FormRenderer.
 *
 * @module features/system/model-config/components/property/mc-property-inspector
 */

"use client";

import { PanelLeft } from "lucide-react";
import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ModelProperty } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { getPropertyInspectorSections } from "../../fields/mc-property-fields";
import type { ModelValidationErrorItem } from "../../hooks/mc-validation";

interface McPropertyInspectorProps {
  property?: ModelProperty;
  isSubProperty?: boolean;
  isReadOnly: boolean;
  isCommitted?: boolean;
  validationErrors?: ModelValidationErrorItem[];
  onUpdate: (sn: string, patch: Partial<ModelProperty>) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  showSidebarToggle?: boolean;
}

export function McPropertyInspector({
  property,
  isSubProperty = false,
  isReadOnly,
  isCommitted = false,
  validationErrors = [],
  onUpdate,
  onToggleSidebar,
  isSidebarOpen = false,
  showSidebarToggle = false,
}: McPropertyInspectorProps) {
  const inspectorSections = React.useMemo(() => {
    const base = getPropertyInspectorSections(isSubProperty);
    if (!isCommitted) return base;

    return base.map((sec) => ({
      ...sec,
      fields: sec.fields.map((f) => {
        if (f.NAME === "NAME" || f.NAME === "TYPE" || f.NAME === "STRUCTURE") {
          return {
            ...f,
            DISABLED: true,
            ENRICHTEXT: `${f.LABEL} is locked once committed to database.`,
          };
        }
        return f;
      }),
    }));
  }, [isSubProperty, isCommitted]);
  // Map external domain validation errors for this specific property
  const externalErrors = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (!property) return map;
    for (const err of validationErrors) {
      if (err.sn === property.SN && err.fieldKey) {
        map[err.fieldKey] = err.message;
      }
    }
    return map;
  }, [validationErrors, property]);

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
              className="size-7 text-muted-foreground hover:text-foreground shrink-0 mr-0.5 cursor-pointer"
              title={isSidebarOpen ? "Hide Columns" : "Show Columns"}
            >
              <PanelLeft className="size-3.5" />
            </Button>
          )}

          <span className="text-xs font-bold font-mono text-foreground tracking-wide truncate">
            {property.NAME || "<UNNAMED_FIELD>"}
          </span>
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
              className="font-mono text-3xs h-5 rounded uppercase tracking-wider text-warning border-warning/30 bg-warning/10"
            >
              New
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Form Engine Rendered Property Sections */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          <FormRenderer
            frmElements={{ sections: inspectorSections }}
            values={property}
            onRecordChange={(next) => onUpdate(property.SN, next as ModelProperty)}
            externalErrors={externalErrors}
            disabled={isReadOnly}
            mode={isReadOnly ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
          />
        </div>
      </div>
    </div>
  );
}
