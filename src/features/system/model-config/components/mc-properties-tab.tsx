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
import type { CommittedPropertyLookup } from "../hooks/use-mc-property-ops";
import { McPropertyInspector } from "./property/mc-property-inspector";
import { McPropertyList } from "./property/mc-property-list";

interface McPropertiesTabProps {
  properties: ModelProperty[];
  isReadOnly: boolean;
  committedProperty: CommittedPropertyLookup;
  /** Selected property SN, owned by the screen. */
  selectedSN: string | null;
  onSelectSN: (sn: string | null) => void;
  validationErrors?: ModelValidationErrorItem[];
  onAddField: () => string;
  onAddSubField?: (parentSn: string) => string;
  onUpdateField: (sn: string, patch: Partial<ModelProperty>) => void;
  onRemoveField: (sn: string) => void;
}

export function McPropertiesTab({
  properties,
  isReadOnly,
  committedProperty,
  selectedSN,
  onSelectSN,
  validationErrors = [],
  onAddField,
  onAddSubField,
  onUpdateField,
  onRemoveField,
}: McPropertiesTabProps) {
  const { ref: containerRef, isCompact } = useContainerWidth<HTMLDivElement>(960);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleSelectSN = (sn: string) => {
    onSelectSN(sn);
    // When in compact mode (offcanvas drawer), auto-close when a column is selected
    if (isCompact) {
      setIsSidebarOpen(false);
    }
  };

  // Keep the selection valid: fall back to the first property, or none when the list is empty
  React.useEffect(() => {
    if (properties.length === 0) {
      if (selectedSN !== null) onSelectSN(null);
      return;
    }
    const currentExists = selectedSN
      ? properties.some((p) => p.SN === selectedSN || p.PROP?.some((sub) => sub.SN === selectedSN))
      : false;
    if (!currentExists) onSelectSN(properties[0].SN);
  }, [properties, selectedSN, onSelectSN]);

  const { selectedProperty, isSubProperty } = React.useMemo(() => {
    if (!selectedSN) return { selectedProperty: undefined, isSubProperty: false };
    for (const p of properties) {
      if (p.SN === selectedSN) return { selectedProperty: p, isSubProperty: false };
      if (p.PROP) {
        const sub = p.PROP.find((s) => s.SN === selectedSN);
        if (sub) return { selectedProperty: sub, isSubProperty: true };
      }
    }
    return { selectedProperty: undefined, isSubProperty: false };
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
              "absolute inset-y-0 left-0 z-30 w-72 sm:w-80 shadow-2xl transition-all duration-200 ease-in-out bg-card flex flex-col overflow-hidden",
              isSidebarOpen
                ? "translate-x-0 opacity-100 visible"
                : "-translate-x-full opacity-0 invisible pointer-events-none",
            )}
          >
            <McPropertyList
              properties={properties}
              selectedSN={selectedSN}
              onSelectSN={handleSelectSN}
              isReadOnly={isReadOnly}
              committedProperty={committedProperty}
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
          committedProperty={committedProperty}
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
            isSubProperty={isSubProperty}
            isReadOnly={isReadOnly}
            committed={committedProperty(selectedProperty.SN)}
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
