"use client";

import { Sparkles } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { FormRenderer } from "@/features/form-engine";
import {
  type FormConfigRecord,
  type FormFieldItem,
  type FormSection,
  getDefaultWidget,
} from "@/lib/data-schemas";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export interface McPreviewTabProps {
  formData: ModelConfigRecord;
}

/**
 * Builds the canonical default FormPresentation straight from a ModelConfigRecord.
 * Automatically maps model properties to FormFieldItem inputs using the centralized
 * widget dictionary (getDefaultWidget) and native parameter bindings.
 */
export function buildDefaultFormPresentation(
  model: ModelConfigRecord,
): FormConfigRecord["presentation"] {
  const rootProps = (model.properties || []).filter(
    (p) => !p.sn.includes("_") && p.status !== "ARCHIVED",
  );
  const childProps = (model.properties || []).filter(
    (p) => p.sn.includes("_") && p.status !== "ARCHIVED",
  );

  const sections: FormSection[] = [];

  // 1. Root / Primary Fields Section (Single row per field, columns: 1)
  const rootFields: FormFieldItem[] = rootProps
    .filter((p) => p.type !== "Object")
    .map((p) => ({
      id: `f_${p.name || p.sn}`,
      fieldKey: p.name || `field_${p.sn}`,
      label: p.label || p.name || `Field #${p.sn}`,
      widget: getDefaultWidget(p.type),
      modelType: p.type,
      parameter: p.parameter,
      colSpan: p.type === "Textarea" ? 12 : 6,
      required: p.required,
      readOnly: p.disabled,
      placeholder:
        p.enrichText || (p.defaultValue !== undefined ? String(p.defaultValue) : undefined),
    }));

  if (rootFields.length > 0) {
    sections.push({
      id: "sec_root_defaults",
      title: "",
      type: "standard",
      zone: "standard",
      layoutStyle: "plain",
      columns: 1,
      collapsible: false,
      isCollapsed: false,
      fields: rootFields,
    });
  }

  // 2. Object & Repeating Sub-Table Sections
  const objectParents = rootProps.filter((p) => p.type === "Object");

  for (const obj of objectParents) {
    const prefix = `${obj.sn}_`;
    const children = childProps.filter((cp) => cp.sn.startsWith(prefix));
    const isMulti = obj.structure === "M";

    const childFields: FormFieldItem[] = children.map((c) => ({
      id: `f_${c.name || c.sn}`,
      fieldKey: c.name || `child_${c.sn}`,
      label: c.label || c.name || `Child #${c.sn}`,
      widget: getDefaultWidget(c.type),
      modelType: c.type,
      parameter: c.parameter,
      colSpan: 12,
      required: c.required,
      readOnly: c.disabled,
      placeholder: c.enrichText,
    }));

    sections.push({
      id: `sec_obj_${obj.sn}`,
      title: obj.label || obj.name || "Object Group",
      description: isMulti
        ? "Repeatable multi-row sub-table (Object.M)"
        : "Structured child field group",
      type: isMulti ? "array-table" : "object-group",
      zone: "standard",
      layoutStyle: "card",
      bindKey: obj.name || `obj_${obj.sn}`,
      columns: isMulti ? 2 : 1,
      collapsible: true,
      isCollapsed: false,
      fields: childFields,
    });
  }

  return {
    archetype: "scanline",
    density: "compact",
    steps: [],
    sections:
      sections.length > 0
        ? sections
        : [
            {
              id: "sec_empty",
              title: "Empty Model",
              description: "No active fields configured in this model definition.",
              type: "standard",
              zone: "standard",
              layoutStyle: "card",
              columns: 1,
              collapsible: false,
              isCollapsed: false,
              fields: [],
            },
          ],
  };
}

export function McPreviewTab({ formData }: McPreviewTabProps) {
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>({});

  // Initialize default values from model properties
  React.useEffect(() => {
    const defaults: Record<string, unknown> = {};
    for (const p of formData.properties || []) {
      if (p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== "") {
        defaults[p.name] = p.defaultValue;
      }
    }
    setFormValues(defaults);
  }, [formData.properties]);

  const handleInputChange = (key: string, val: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  const presentation = React.useMemo(() => {
    return buildDefaultFormPresentation(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      {/* Informative Preview Header matching fc-preview-tab */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
            {formData.recordId || formData.tableName}
          </Badge>
          <span className="text-xs font-semibold text-foreground">
            {formData.description || formData.tableName}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {formData.properties?.length || 0} fields
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2 py-0.5 rounded border border-border/40">
          <Sparkles className="size-3 text-primary" />
          <span>Live Form Engine Preview</span>
        </div>
      </div>

      {/* Unified Form Engine Execution */}
      <FormRenderer
        presentation={presentation}
        values={formValues}
        onChange={handleInputChange}
        mode="I"
      />
    </div>
  );
}
