"use client";

import { ArrowLeft, Settings, Type } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { useOptionalDesignerContext } from "./context/designer-context";
import { ContainerInspector } from "./inspector/container-inspector";
import { FieldInspector } from "./inspector/field-inspector";
import { RootCanvasInspector } from "./inspector/root-canvas-inspector";

export interface PropertyInspectorProps {
  selectedSection?: FormSection | null;
  selectedField?: FormElement | null;
  modelProperties?: ModelProperty[];
  onUpdateSection?: (patch: Partial<FormSection>) => void;
  onUpdateField?: (patch: Partial<FormElement>) => void;
  onClose?: () => void;
  onDeselectField?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * PropertyInspector: Streamlined right-hand workbench panel.
 * Directly renders flat properties for Root Canvas, Containers, or Fields.
 * Never displays an empty state placeholder.
 */
export function PropertyInspector(props: PropertyInspectorProps) {
  const ctx = useOptionalDesignerContext();

  const selectedSection = props.selectedSection ?? ctx?.activeSection ?? null;
  const selectedField = props.selectedField ?? ctx?.activeField ?? null;
  const modelProperties = props.modelProperties ?? ctx?.modelProperties ?? [];
  const disabled = props.disabled ?? ctx?.disabled ?? false;

  const onUpdateSection = React.useCallback(
    (patch: Partial<FormSection>) => {
      if (props.onUpdateSection) {
        props.onUpdateSection(patch);
      } else if (ctx && selectedSection) {
        ctx.onUpdateSection(selectedSection.id, patch);
      }
    },
    [props.onUpdateSection, ctx, selectedSection],
  );

  const onUpdateField = React.useCallback(
    (patch: Partial<FormElement>) => {
      if (props.onUpdateField) {
        props.onUpdateField(patch);
      } else if (ctx && selectedField) {
        ctx.onUpdateField(selectedField.SN || selectedField.NAME, patch);
      }
    },
    [props.onUpdateField, ctx, selectedField],
  );

  const onDeselectField =
    props.onDeselectField ?? (ctx ? () => ctx.onSelectField(null) : undefined);

  // Parent container lookup for hierarchical back navigation
  const parentContainer = React.useMemo(() => {
    if (!selectedField) return null;
    return (
      ctx?.sections.find((s) =>
        (s.fields || []).some((f) => f.SN === selectedField.SN || f.NAME === selectedField.NAME),
      ) || null
    );
  }, [selectedField, ctx?.sections]);

  const isParentAnActualContainer = React.useMemo(() => {
    if (!parentContainer) return false;
    return (
      Boolean(parentContainer.title?.trim()) ||
      parentContainer.containerType === "tab" ||
      Boolean(parentContainer.groupTitle)
    );
  }, [parentContainer]);

  const handleBack = React.useCallback(() => {
    if (selectedField) {
      if (isParentAnActualContainer && parentContainer) {
        if (ctx) {
          ctx.onSelectSection(parentContainer.id);
          ctx.onSelectField(null);
        } else if (onDeselectField) {
          onDeselectField();
        }
      } else {
        if (ctx) {
          ctx.onSelectSection(null);
          ctx.onSelectField(null);
        } else if (onDeselectField) {
          onDeselectField();
        }
      }
    } else if (selectedSection) {
      if (ctx) {
        ctx.onSelectSection(null);
        ctx.onSelectField(null);
      }
    }
  }, [
    selectedField,
    selectedSection,
    isParentAnActualContainer,
    parentContainer,
    ctx,
    onDeselectField,
  ]);

  // Resolve underlying physical database model property (if available)
  const matchedModelProp = React.useMemo(() => {
    if (!selectedField) return null;
    return (
      modelProperties.find((p) => p.SN === selectedField.SN || p.NAME === selectedField.NAME) ||
      null
    );
  }, [modelProperties, selectedField]);

  // Determine normalized base physical type (TEXT | NUMBER | DATE)
  const baseType = React.useMemo<"TEXT" | "NUMBER" | "DATE">(() => {
    const rawType = (matchedModelProp?.TYPE || selectedField?.TYPE || "Text").toUpperCase();
    if (rawType.includes("NUM") || rawType.includes("AMOUNT")) return "NUMBER";
    if (rawType.includes("DATE") || rawType.includes("TIME")) return "DATE";
    return "TEXT";
  }, [matchedModelProp, selectedField]);

  const inspectorHeader = React.useMemo(() => {
    if (selectedField) {
      return {
        icon: <Type className="size-3.5 text-primary shrink-0" />,
        title: selectedField.LABEL || selectedField.NAME || "Field Configuration",
      };
    }
    if (selectedSection) {
      return {
        icon: <Settings className="size-3.5 text-primary shrink-0" />,
        title:
          selectedSection.groupTitle ||
          selectedSection.title ||
          (selectedSection.containerType === "tab" ? "Tab Item" : "Card Container"),
      };
    }
    return {
      icon: <Settings className="size-3.5 text-muted-foreground shrink-0" />,
      title: "Canvas Properties",
    };
  }, [selectedField, selectedSection]);

  const backButtonTooltip = React.useMemo(() => {
    if (selectedField) {
      if (isParentAnActualContainer && parentContainer) {
        return `Back to ${parentContainer.title || parentContainer.groupTitle || "Container"}`;
      }
      return "Back to Canvas Properties";
    }
    if (selectedSection) {
      return "Back to Canvas Properties";
    }
    return "";
  }, [selectedField, selectedSection, isParentAnActualContainer, parentContainer]);

  const hasBackAction = Boolean(selectedField || selectedSection);

  return (
    <div
      className={cn(
        "w-80 sm:w-88 border-l border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0 overflow-hidden",
        props.className,
      )}
    >
      {/* ── Ultra-Minimal Header: [Back or Icon] Title (No close button or badge label) ── */}
      <div className="h-8 px-2.5 border-b border-border/60 bg-muted/25 flex items-center shrink-0 gap-1.5">
        {hasBackAction ? (
          <button
            type="button"
            onClick={handleBack}
            className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
            title={backButtonTooltip}
          >
            <ArrowLeft className="size-3.5" />
          </button>
        ) : (
          inspectorHeader.icon
        )}

        <span className="font-semibold text-foreground text-xs truncate">
          {inspectorHeader.title}
        </span>
      </div>

      {/* ── Direct Scrollable Properties Body ────── */}
      <div className="flex-1 overflow-y-auto">
        {selectedField ? (
          <FieldInspector
            field={selectedField}
            matchedModelProp={matchedModelProp}
            baseType={baseType}
            onUpdateField={onUpdateField}
            disabled={disabled}
          />
        ) : selectedSection ? (
          <ContainerInspector
            section={selectedSection}
            onUpdateSection={onUpdateSection}
            disabled={disabled}
          />
        ) : (
          <RootCanvasInspector
            columns={ctx?.rootColumns}
            density={ctx?.rootDensity}
            onUpdateFormConfig={ctx?.onUpdateFormConfig}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
