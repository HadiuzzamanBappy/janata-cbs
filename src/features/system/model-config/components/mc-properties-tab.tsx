/**
 * @fileoverview Properties Master-Detail tab for MODEL.CONFIG editor.
 * Houses responsive property tree list on left and inspector form on right.
 *
 * @module features/system/model-config/components/mc-properties-tab
 */

"use client";

import { Layers } from "lucide-react";
import * as React from "react";
import { useContainerWidth } from "@/hooks";
import { cn } from "@/lib/core-utils";
import type { ModelProperty } from "@/lib/data-schemas";
import type { ModelValidationErrorItem } from "../hooks/mc-validation";
import { McPropertyInspector } from "./property/mc-property-inspector";
import { McPropertyList } from "./property/mc-property-list";

interface McPropertiesTabProps {
  properties: ModelProperty[];
  isReadOnly: boolean;
  isFieldCommitted: (sn: string) => boolean;
  selectedSN?: string | null;
  onSelectSN?: (sn: string) => void;
  validationErrors?: ModelValidationErrorItem[];
  onAddField: () => string;
  onAddSubField?: (parentSn: string) => string;
  onUpdateField: (sn: string, patch: Partial<ModelProperty>) => void;
  onRemoveField: (sn: string) => void;
}

export function McPropertiesTab({
  properties,
  isReadOnly,
  isFieldCommitted,
  selectedSN: controlledSN,
  onSelectSN: onControlledSelectSN,
  validationErrors = [],
  onAddField,
  onAddSubField,
  onUpdateField,
  onRemoveField,
}: McPropertiesTabProps) {
  const { ref: containerRef, isCompact } = useContainerWidth<HTMLDivElement>(860);
  const [internalSN, setInternalSN] = React.useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const selectedSN = controlledSN !== undefined ? controlledSN : internalSN;
  const handleSelectSN = (sn: string) => {
    if (onControlledSelectSN) onControlledSelectSN(sn);
    setInternalSN(sn);
    // When in compact mode (offcanvas drawer), auto-close when a column is selected
    if (isCompact) {
      setIsSidebarOpen(false);
    }
  };

  // Keep selectedSN valid
  React.useEffect(() => {
    if (properties.length === 0) {
      if (onControlledSelectSN) onControlledSelectSN("");
      setInternalSN(null);
      return;
    }

    const currentExists = selectedSN
      ? properties.some((p) => p.SN === selectedSN || p.PROP?.some((sub) => sub.SN === selectedSN))
      : false;
    if (!currentExists && properties.length > 0) {
      const fallbackSN = properties[0].SN;
      if (onControlledSelectSN) onControlledSelectSN(fallbackSN);
      setInternalSN(fallbackSN);
    }
  }, [properties, selectedSN, onControlledSelectSN]);

  const selectedProperty = React.useMemo(() => {
    if (!selectedSN) return undefined;
    for (const p of properties) {
      if (p.SN === selectedSN) return p;
      if (p.PROP) {
        const sub = p.PROP.find((s) => s.SN === selectedSN);
        if (sub) return sub;
      }
    }
    return undefined;
  }, [properties, selectedSN]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full rounded border border-border/80 bg-card/60 flex overflow-hidden shadow-2xs min-h-0"
    >
      {/* 1. Left Panel / Offcanvas Drawer */}
      {isCompact ? (
        <>
          {/* Backdrop when offcanvas is open */}
          {isSidebarOpen && (
            <div
              className="absolute inset-0 bg-black/40 z-20 backdrop-blur-xs transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          {/* Offcanvas Drawer */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 z-30 w-72 sm:w-80 shadow-2xl transition-transform duration-200 ease-in-out bg-card flex flex-col",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
            )}
          >
            <McPropertyList
              properties={properties}
              selectedSN={selectedSN}
              onSelectSN={handleSelectSN}
              isReadOnly={isReadOnly}
              isFieldCommitted={isFieldCommitted}
              validationErrors={validationErrors}
              onAddField={onAddField}
              onAddSubField={onAddSubField}
              onDeleteField={onRemoveField}
              className="w-full h-full border-r border-border"
            />
          </div>
        </>
      ) : (
        <McPropertyList
          properties={properties}
          selectedSN={selectedSN}
          onSelectSN={handleSelectSN}
          isReadOnly={isReadOnly}
          isFieldCommitted={isFieldCommitted}
          validationErrors={validationErrors}
          onAddField={onAddField}
          onAddSubField={onAddSubField}
          onDeleteField={onRemoveField}
        />
      )}

      {/* 2. Right Panel: Column Details Inspector Form */}
      <div className="flex-1 flex flex-col min-h-0 bg-background/50 overflow-hidden">
        {selectedProperty ? (
          <McPropertyInspector
            property={selectedProperty}
            isReadOnly={isReadOnly}
            isCommitted={isFieldCommitted(selectedProperty.SN)}
            validationErrors={validationErrors}
            onUpdate={onUpdateField}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            isSidebarOpen={isSidebarOpen}
            showSidebarToggle={isCompact}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
            <Layers className="size-7 text-muted-foreground/35 mb-2" />
            <p className="text-xs text-muted-foreground/80">
              Select a column on the left to inspect or edit details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
