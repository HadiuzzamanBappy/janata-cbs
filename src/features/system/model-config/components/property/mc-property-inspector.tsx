"use client";

import {
  type ModelProperty,
  PROPERTY_TYPES,
  type PropertyType,
  type ValidationErrorItem,
} from "@/lib/data-schemas/model-config-schema";
import { McInspectorHeader } from "./inspector/mc-inspector-header";
import { McInspectorIdentitySection } from "./inspector/mc-inspector-identity";
import { McInspectorTypeSpecs } from "./inspector/mc-inspector-type-specs";

export { PROPERTY_TYPES, type PropertyType };

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
  if (!property) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 1. Header & Actions Bar */}
      <McInspectorHeader
        property={property}
        isReadOnly={isReadOnly}
        isCommitted={isCommitted}
        onDelete={onDelete}
      />

      {/* 2. Inspector Panels */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <McInspectorIdentitySection
          property={property}
          isReadOnly={isReadOnly}
          validationErrors={validationErrors}
          onUpdate={onUpdate}
        />

        <McInspectorTypeSpecs property={property} isReadOnly={isReadOnly} onUpdate={onUpdate} />
      </div>
    </div>
  );
}
