/**
 * @fileoverview Property inspector panel for MODEL.CONFIG properties.
 * Renders column definitions and physical constraints using FormRenderer.
 *
 * @module features/system/model-config/components/property/mc-property-inspector
 */

"use client";

import { PanelLeft } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormRenderer } from "@/features/form-engine";
import type { ModelProperty } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { PROPERTY_INSPECTOR_SECTIONS } from "../../fields/mc-property-fields";
import type { ModelValidationErrorItem } from "../../hooks/mc-validation";

interface McPropertyInspectorProps {
  property?: ModelProperty;
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
  isReadOnly,
  isCommitted = false,
  validationErrors = [],
  onUpdate,
  onToggleSidebar,
  isSidebarOpen = false,
  showSidebarToggle = false,
}: McPropertyInspectorProps) {
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
              className="size-7 text-muted-foreground hover:text-foreground shrink-0 mr-0.5"
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
              className="font-mono text-[10px] h-5 rounded uppercase tracking-wider text-amber-500 border-amber-500/30 bg-amber-500/10"
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
            frmElements={{ sections: PROPERTY_INSPECTOR_SECTIONS }}
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
