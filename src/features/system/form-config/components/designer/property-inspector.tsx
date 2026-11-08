"use client";

import { ArrowLeft, Code2, Settings, Sliders, Type, X } from "lucide-react";
import * as React from "react";
import { CbsJsonViewerTab } from "@/components/cbs-screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import { setFieldValue } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { CbsRecordFunction } from "@/types";
import { InspectorAnchorSection } from "./inspector/inspector-anchor-section";
import { InspectorWidgetSection } from "./inspector/inspector-widget-section";
import { CONTAINER_CONFIG_SECTION, FIELD_GENERAL_SECTION } from "./inspector/property-field-specs";

export interface PropertyInspectorProps {
  selectedSection: FormSection | null;
  selectedField: FormElement | null;
  modelProperties?: ModelProperty[];
  onUpdateSection: (patch: Partial<FormSection>) => void;
  onUpdateField: (patch: Partial<FormElement>) => void;
  onClose?: () => void;
  onDeselectField?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PropertyInspector({
  selectedSection,
  selectedField,
  modelProperties = [],
  onUpdateSection,
  onUpdateField,
  onClose,
  onDeselectField,
  disabled,
  className,
}: PropertyInspectorProps) {
  const [activeTab, setActiveTab] = React.useState<"form" | "json">("form");

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
        icon: <Settings className="size-3.5 text-primary shrink-0" />,
        title:
          selectedSection.groupTitle ||
          selectedSection.title ||
          (selectedSection.containerType === "tab" ? "Tab Item" : "Section Container"),
      };
    }
    return {
      icon: <Settings className="size-3.5 text-muted-foreground shrink-0" />,
      title: "Property Inspector",
    };
  }, [selectedField, selectedSection]);

  const handleGeneralFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      if (!selectedField) return;
      const updated = setFieldValue(selectedField as Record<string, unknown>, fieldKey, value);
      onUpdateField(updated as Partial<FormElement>);
    },
    [selectedField, onUpdateField],
  );

  const handleContainerSectionChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      if (!selectedSection) return;
      const updated = setFieldValue(selectedSection as Record<string, unknown>, fieldKey, value);
      onUpdateSection(updated as Partial<FormSection>);
    },
    [selectedSection, onUpdateSection],
  );

  if (!selectedField && !selectedSection) {
    return (
      <div
        className={cn(
          "w-110 border-l border-border/70 bg-card/25 p-4 flex flex-col items-center justify-center text-center text-muted-foreground text-xs select-none shrink-0 relative",
          className,
        )}
      >
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            title="Close Inspector"
          >
            <X className="size-3.5" />
          </Button>
        )}
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

  const activeRawSpec = selectedField || selectedSection;

  return (
    <div
      className={cn(
        "w-110 border-l border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0 overflow-hidden",
        className,
      )}
    >
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
                  ? `Back to ${selectedSection.groupTitle || selectedSection.title || "Container"}`
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
        <div className="flex items-center gap-1.5 shrink-0">
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
              {selectedSection.containerType || "CARD"}
            </Badge>
          ) : null}

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              title="Close Inspector"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Top Tabs Navigation: FormEngine UI vs JSON ────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "form" | "json")}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="px-3 py-1.5 border-b border-border/60 bg-muted/15 flex items-center justify-between shrink-0">
          <TabsList className="h-6.5 p-0.5 bg-muted/40">
            <TabsTrigger
              value="form"
              className="h-5.5 px-2.5 text-[11px] gap-1 data-[state=active]:bg-background"
            >
              <Sliders className="size-3" />
              <span>Properties</span>
            </TabsTrigger>
            <TabsTrigger
              value="json"
              className="h-5.5 px-2.5 text-[11px] gap-1 data-[state=active]:bg-background"
            >
              <Code2 className="size-3" />
              <span>JSON Spec</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab Content: FormEngine UI ──────────────────────────────────── */}
        <TabsContent value="form" className="flex-1 overflow-y-auto p-3 space-y-3.5 m-0">
          {selectedField ? (
            <>
              <InspectorAnchorSection
                selectedField={selectedField}
                matchedModelProp={matchedModelProp}
                baseType={baseType}
              />

              {/* General Field Properties rendered with FormEngine */}
              <div className="rounded-md border border-border/80 bg-card/60 p-2.5 shadow-2xs">
                <FormRenderer
                  frmElements={{ sections: [FIELD_GENERAL_SECTION] }}
                  values={selectedField as Record<string, unknown>}
                  onChange={handleGeneralFieldChange}
                  disabled={disabled}
                  mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
                />
              </div>

              {/* Widget-Specific Presentation Section */}
              <InspectorWidgetSection
                selectedField={selectedField}
                baseType={baseType}
                onUpdateField={onUpdateField}
                disabled={disabled}
              />
            </>
          ) : selectedSection ? (
            <div className="rounded-md border border-border/80 bg-card/60 p-2.5 shadow-2xs">
              <FormRenderer
                frmElements={{ sections: [CONTAINER_CONFIG_SECTION] }}
                values={selectedSection as Record<string, unknown>}
                onChange={handleContainerSectionChange}
                disabled={disabled}
                mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
              />
            </div>
          ) : null}
        </TabsContent>

        {/* ── Tab Content: JSON Contract ──────────────────────────────────── */}
        <TabsContent value="json" className="flex-1 overflow-hidden m-0 p-2">
          {activeRawSpec ? (
            <CbsJsonViewerTab data={activeRawSpec} />
          ) : (
            <div className="p-4 text-center text-muted-foreground text-xs">No active spec.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
