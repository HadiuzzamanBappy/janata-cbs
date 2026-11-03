"use client";

import { ArrowLeft, Database, Settings, Table, Type } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { InspectorAnchorSection } from "./inspector/inspector-anchor-section";
import { InspectorContainerSection } from "./inspector/inspector-container-section";
import { InspectorGeneralSection } from "./inspector/inspector-general-section";
import { InspectorWidgetSection } from "./inspector/inspector-widget-section";

export interface PropertyInspectorProps {
  selectedSection: FormSection | null;
  selectedField: FormElement | null;
  modelProperties?: ModelProperty[];
  onUpdateSection: (patch: Partial<FormSection>) => void;
  onUpdateField: (patch: Partial<FormElement>) => void;
  onClose?: () => void;
  onDeselectField?: () => void;
  disabled?: boolean;
}

export function PropertyInspector({
  selectedSection,
  selectedField,
  modelProperties = [],
  onUpdateSection,
  onUpdateField,
  onClose: _onClose,
  onDeselectField,
  disabled,
}: PropertyInspectorProps) {
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
        title: selectedField.LABEL || selectedField.NAME || "Field Inspector",
      };
    }
    if (selectedSection) {
      return {
        icon:
          selectedSection.type === "array-table" ? (
            <Table className="size-3.5 text-emerald-400 shrink-0" />
          ) : selectedSection.type === "object-group" ? (
            <Database className="size-3.5 text-purple-400 shrink-0" />
          ) : (
            <Settings className="size-3.5 text-primary shrink-0" />
          ),
        title:
          selectedSection.tabTitle ||
          selectedSection.title ||
          (selectedSection.zone === "tab" ? "Tab Item" : "Section Container"),
      };
    }
    return {
      icon: <Settings className="size-3.5 text-muted-foreground shrink-0" />,
      title: "Property Inspector",
    };
  }, [selectedField, selectedSection]);

  if (!selectedField && !selectedSection) {
    return (
      <div className="w-96 border-l border-border/70 bg-card/25 p-4 flex flex-col items-center justify-center text-center text-muted-foreground text-xs select-none shrink-0">
        <div className="size-10 rounded-full bg-muted/40 flex items-center justify-center mb-2">
          <Settings className="size-5 opacity-40 text-muted-foreground" />
        </div>
        <span className="font-semibold text-foreground text-xs">Property Inspector</span>
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-1">
          Click any field or container on the canvas to configure its layout, parameters, and
          display rules.
        </p>
      </div>
    );
  }

  return (
    <div className="w-96 border-l border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0 overflow-hidden">
      {/* ── Single Unified Header ─────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b border-border/60 bg-muted/25 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {selectedField && onDeselectField && (
            <button
              type="button"
              onClick={onDeselectField}
              className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
              title={
                selectedSection
                  ? `Back to ${selectedSection.tabTitle || selectedSection.title || "Container"}`
                  : "Back to container"
              }
            >
              <ArrowLeft className="size-3.5" />
            </button>
          )}

          {inspectorHeader.icon}

          <div className="truncate">
            <span className="font-semibold text-foreground text-xs">{inspectorHeader.title}</span>
          </div>
        </div>

        {/* Type badge on right */}
        <div className="flex items-center gap-1 shrink-0">
          {selectedField ? (
            <Badge
              variant="outline"
              className="text-[9px] font-mono h-4 px-1.5 uppercase tracking-wider text-cyan-400 border-cyan-500/30 bg-cyan-500/10 font-bold"
            >
              {selectedField.WIDGET || selectedField.TYPE || "FIELD"}
            </Badge>
          ) : selectedSection ? (
            <Badge
              variant="outline"
              className="text-[9px] font-mono h-4 px-1.5 uppercase tracking-wider text-primary border-primary/30 bg-primary/10 font-bold"
            >
              {selectedSection.zone === "tab"
                ? "TAB"
                : selectedSection.type === "object-group"
                  ? "OBJECT-GROUP"
                  : selectedSection.type === "array-table"
                    ? "ARRAY-TABLE"
                    : selectedSection.layoutStyle === "plain"
                      ? "CANVAS"
                      : "CARD"}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* ── Form Body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {selectedField ? (
          <>
            <InspectorAnchorSection
              selectedField={selectedField}
              matchedModelProp={matchedModelProp}
              baseType={baseType}
            />

            <InspectorGeneralSection
              selectedField={selectedField}
              onUpdateField={onUpdateField}
              disabled={disabled}
            />

            <InspectorWidgetSection
              selectedField={selectedField}
              baseType={baseType}
              onUpdateField={onUpdateField}
              disabled={disabled}
            />
          </>
        ) : selectedSection ? (
          <InspectorContainerSection
            selectedSection={selectedSection}
            onUpdateSection={onUpdateSection}
            disabled={disabled}
          />
        ) : null}
      </div>
    </div>
  );
}
