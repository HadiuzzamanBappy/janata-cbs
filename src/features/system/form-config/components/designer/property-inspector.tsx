/**
 * @fileoverview Unified Property Inspector panel for Form Designer workbench.
 * Renders hierarchical properties for Root Canvas, Containers, and Fields.
 *
 * @module features/system/form-config/components/designer/property-inspector
 */

"use client";

import { ArrowLeft, Layers, LayoutList, Settings, Type } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/core-utils";
import type { FormElement, FormSection, ModelProperty } from "@/lib/data-schemas";
import { findFieldDeep, findModelPropDeep } from "../../hooks/fc-field-tree";
import { useOptionalDesignerContext } from "./context/designer-context";
import { ContainerInspector, RootCanvasInspector } from "./inspector/canvas-inspectors";
import { FieldInspector } from "./inspector/field-inspector";

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

function resolveBaseType(type?: string): "TEXT" | "NUMBER" | "DATE" {
  const norm = (type || "").toUpperCase();
  if (norm.includes("NUM") || norm.includes("AMOUNT")) return "NUMBER";
  if (norm.includes("DATE") || norm.includes("TIME")) return "DATE";
  return "TEXT";
}

/**
 * PropertyInspector: Streamlined right-hand workbench panel.
 * Directly renders flat properties for Root Canvas, Containers, or Fields.
 */
export function PropertyInspector(props: PropertyInspectorProps) {
  const ctx = useOptionalDesignerContext();

  const selectedSection = props.selectedSection ?? ctx?.activeSection ?? null;
  const selectedField = props.selectedField ?? ctx?.activeField ?? null;
  const modelProperties = props.modelProperties ?? ctx?.modelProperties ?? [];
  const disabled = props.disabled ?? ctx?.disabled ?? false;

  const onUpdateSection = React.useCallback(
    (patch: Partial<FormSection>) => {
      if (selectedSection) {
        props.onUpdateSection
          ? props.onUpdateSection(patch)
          : ctx?.onUpdateSection(selectedSection.id, patch);
      }
    },
    [props.onUpdateSection, ctx, selectedSection],
  );

  const onUpdateField = React.useCallback(
    (patch: Partial<FormElement>) => {
      if (selectedField) {
        props.onUpdateField
          ? props.onUpdateField(patch)
          : ctx?.onUpdateField(selectedField.SN || selectedField.NAME, patch);
      }
    },
    [props.onUpdateField, ctx, selectedField],
  );

  // Parent container lookup for hierarchical back navigation (inner fields included)
  const parentContainer = React.useMemo(() => {
    if (!selectedField || !ctx) return null;
    return findFieldDeep(ctx.sections, selectedField.SN || selectedField.NAME)?.section ?? null;
  }, [selectedField, ctx]);
  const parentObjectField = ctx?.activeParentField ?? null;

  const handleBack = React.useCallback(() => {
    // An inner field steps back to its object group
    if (parentObjectField) {
      ctx?.onSelectField(parentObjectField.SN || parentObjectField.NAME);
      return;
    }
    if (
      selectedField &&
      parentContainer &&
      (parentContainer.containerType === "tab" || parentContainer.title?.trim())
    ) {
      ctx?.onSelectSection(parentContainer.id);
      ctx?.onSelectField(null);
    } else {
      ctx?.onSelectSection(null);
      ctx?.onSelectField(null);
      props.onDeselectField?.();
    }
  }, [selectedField, parentContainer, parentObjectField, ctx, props.onDeselectField]);

  const matchedModelProp = React.useMemo(() => {
    if (!selectedField) return null;
    return findModelPropDeep(modelProperties, selectedField);
  }, [modelProperties, selectedField]);

  const baseType = resolveBaseType(matchedModelProp?.TYPE || selectedField?.TYPE);

  const fieldErrorMap = React.useMemo(() => {
    if (!selectedField || !ctx) return {};
    const fieldId = selectedField.SN || selectedField.NAME;
    const errors = ctx.getFieldErrors(fieldId);
    const map: Record<string, string> = {};
    for (const err of errors) {
      map[err.fieldKey] = err.message;
    }
    return map;
  }, [selectedField, ctx]);

  const sectionErrorMap = React.useMemo(() => {
    if (!selectedSection || !ctx) return {};
    const errors = ctx.getSectionErrors(selectedSection.id);
    const map: Record<string, string> = {};
    for (const err of errors) {
      map[err.fieldKey] = err.message;
    }
    return map;
  }, [selectedSection, ctx]);

  const header = selectedField
    ? {
        icon: <Type className="size-3.5 text-primary shrink-0" />,
        title: `${parentObjectField ? `${parentObjectField.LABEL || parentObjectField.NAME} › ` : ""}${selectedField.LABEL || selectedField.NAME || "Field Configuration"}`,
      }
    : selectedSection
      ? selectedSection.containerType === "tab"
        ? ctx?.tabScope === "container"
          ? {
              icon: <Layers className="size-3.5 text-info shrink-0" />,
              title: `${selectedSection.groupTitle || "Tab Group"} (Group)`,
            }
          : {
              icon: <LayoutList className="size-3.5 text-primary shrink-0" />,
              title: `${selectedSection.title || "Tab Item"} (Tab)`,
            }
        : {
            icon: <Settings className="size-3.5 text-primary shrink-0" />,
            title: selectedSection.title || "Card Container",
          }
      : {
          icon: <Settings className="size-3.5 text-muted-foreground shrink-0" />,
          title: "Canvas Properties",
        };

  const hasBackAction = Boolean(selectedField || selectedSection);

  return (
    <div
      className={cn(
        "w-80 sm:w-88 border-l border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0 overflow-hidden",
        props.className,
      )}
    >
      {/* ── Header: [Back or Icon] Title ── */}
      <div className="h-8 px-2.5 border-b border-border/60 bg-muted/25 flex items-center shrink-0 gap-1.5">
        {hasBackAction ? (
          <button
            type="button"
            onClick={handleBack}
            className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
            title="Back"
          >
            <ArrowLeft className="size-3.5" />
          </button>
        ) : (
          header.icon
        )}

        <span className="font-semibold text-foreground text-xs truncate">{header.title}</span>
      </div>

      {/* ── Direct Scrollable Properties Body ────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden">
        {selectedField ? (
          <FieldInspector
            field={selectedField}
            matchedModelProp={matchedModelProp}
            baseType={baseType}
            onUpdateField={onUpdateField}
            disabled={disabled}
            errors={fieldErrorMap}
          />
        ) : selectedSection ? (
          <ContainerInspector
            section={selectedSection}
            onUpdateSection={onUpdateSection}
            disabled={disabled}
            errors={sectionErrorMap}
          />
        ) : (
          <RootCanvasInspector
            layout={ctx?.rootLayout}
            density={ctx?.rootDensity}
            onUpdateFormConfig={ctx?.onUpdateFormConfig}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
