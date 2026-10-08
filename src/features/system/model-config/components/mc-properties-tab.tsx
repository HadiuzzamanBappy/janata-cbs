"use client";

import { Layers } from "lucide-react";
import * as React from "react";
import type { ModelProperty, ValidationErrorItem } from "@/lib/schemas/model-config-schema";
import { McPropertyInspector } from "./property/mc-property-inspector";
import { McPropertyList } from "./property/mc-property-list";

interface McPropertiesTabProps {
  properties: ModelProperty[];
  isReadOnly: boolean;
  isFieldCommitted: (sn: string) => boolean;
  selectedSN?: string | null;
  onSelectSN?: (sn: string) => void;
  validationErrors?: ValidationErrorItem[];
  onAddField: () => string;
  onUpdateField: (sn: string, patch: Partial<ModelProperty>) => void;
  onRemoveField: (sn: string, forceHardDelete?: boolean) => void;
}

export function McPropertiesTab({
  properties,
  isReadOnly,
  isFieldCommitted,
  selectedSN: controlledSN,
  onSelectSN: onControlledSelectSN,
  validationErrors = [],
  onAddField,
  onUpdateField,
  onRemoveField,
}: McPropertiesTabProps) {
  const [internalSN, setInternalSN] = React.useState<string | null>(null);

  const selectedSN = controlledSN !== undefined ? controlledSN : internalSN;
  const handleSelectSN = (sn: string) => {
    if (onControlledSelectSN) onControlledSelectSN(sn);
    setInternalSN(sn);
  };

  // Keep selectedSN valid
  React.useEffect(() => {
    if (properties.length === 0) {
      if (onControlledSelectSN) onControlledSelectSN("");
      setInternalSN(null);
      return;
    }
    const exists = properties.some((p) => p.sn === selectedSN);
    if (!exists) {
      const fallback = properties[0]?.sn || null;
      if (onControlledSelectSN && fallback) onControlledSelectSN(fallback);
      setInternalSN(fallback);
    }
  }, [properties, selectedSN, onControlledSelectSN]);

  const selectedProperty = React.useMemo(() => {
    if (!selectedSN) return undefined;
    return properties.find((p) => p.sn === selectedSN);
  }, [properties, selectedSN]);

  return (
    <div className="h-full w-full rounded border border-border/80 bg-card/60 flex overflow-hidden shadow-2xs min-h-0">
      {/* 1. Left Panel: Master Field Navigator */}
      <McPropertyList
        properties={properties}
        selectedSN={selectedSN}
        onSelectSN={handleSelectSN}
        isReadOnly={isReadOnly}
        isFieldCommitted={isFieldCommitted}
        validationErrors={validationErrors}
        onAddField={onAddField}
        onDeleteField={onRemoveField}
      />

      {/* 2. Right Panel: Field Details Inspector Form */}
      <div className="flex-1 flex flex-col min-h-0 bg-background/50 overflow-hidden">
        {selectedProperty ? (
          <McPropertyInspector
            property={selectedProperty}
            isReadOnly={isReadOnly}
            isCommitted={isFieldCommitted(selectedProperty.sn)}
            validationErrors={validationErrors}
            onUpdate={onUpdateField}
            onDelete={onRemoveField}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
            <Layers className="size-7 text-muted-foreground/35 mb-2" />
            <p className="text-xs text-muted-foreground/80">
              Select a property on the left to inspect or edit details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
