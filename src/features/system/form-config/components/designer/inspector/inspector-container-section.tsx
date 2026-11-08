"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { InspectorRow } from "./inspector-row";

export interface InspectorContainerSectionProps {
  selectedSection: FormSection;
  onUpdateSection: (patch: Partial<FormSection>) => void;
  disabled?: boolean;
}

export function InspectorContainerSection({
  selectedSection,
  onUpdateSection,
  disabled,
}: InspectorContainerSectionProps) {
  const isTab = selectedSection.containerType === "tab";
  const isStep = selectedSection.containerType === "step";
  const config = selectedSection.containerConfig || {};

  const handleUpdateConfig = (patch: Record<string, unknown>) => {
    onUpdateSection({
      containerConfig: {
        ...config,
        ...patch,
      },
    });
  };

  return (
    <>
      {/* Container / Tab / Step Title */}
      <InspectorRow
        label={isTab ? "Tab Name" : isStep ? "Step Title" : "Container Title"}
        description={
          isTab
            ? "Label displayed on this tab's header button."
            : isStep
              ? "Label displayed on this step's header button."
              : "Header banner title displayed above this group. Leave empty for root canvas without card borders."
        }
      >
        <Input
          disabled={disabled}
          value={
            isTab || isStep
              ? (selectedSection.groupTitle ?? selectedSection.title ?? "")
              : (selectedSection.title ?? "")
          }
          placeholder={
            isTab
              ? "e.g. Personal Details, Nominee..."
              : isStep
                ? "e.g. KYC Verification..."
                : "Leave empty for plain root fields..."
          }
          onChange={(e) => {
            const val = e.target.value;
            if (isTab || isStep) {
              onUpdateSection({ groupTitle: val, title: val });
            } else {
              onUpdateSection({ title: val });
            }
          }}
          className="h-7 text-xs bg-background"
        />
      </InspectorRow>

      {/* Grid Columns Layout */}
      <InspectorRow
        label="Grid Columns"
        description="Number of columns for fields inside this container."
      >
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded border border-border/70 bg-background">
          {[1, 2, 3, 4].map((col) => {
            const isCurrent = (selectedSection.columns || 1) === col;
            return (
              <button
                key={col}
                type="button"
                disabled={disabled}
                onClick={() => onUpdateSection({ columns: col })}
                className={cn(
                  "py-1 text-[11px] font-semibold text-center rounded transition-all cursor-pointer border-0",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 bg-transparent",
                )}
              >
                {col} Col
              </button>
            );
          })}
        </div>
      </InspectorRow>

      {/* Container Type */}
      <InspectorRow
        label="Container Type"
        description="Visual wrapper and grouping classification."
      >
        <div className="flex items-center gap-1.5 h-7 px-2.5 rounded border border-border/70 bg-muted/20 text-xs">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-4 px-1.5 font-mono uppercase font-semibold",
              selectedSection.containerType === "tab" &&
                "border-sky-500/40 text-sky-400 bg-sky-500/10",
              selectedSection.containerType === "step" &&
                "border-amber-500/40 text-amber-400 bg-amber-500/10",
              selectedSection.containerType === "plain" &&
                "border-zinc-500/40 text-zinc-400 bg-zinc-500/10",
              (selectedSection.containerType === "card" || !selectedSection.containerType) &&
                "border-blue-500/40 text-blue-400 bg-blue-500/10",
            )}
          >
            {selectedSection.containerType || "card"}
          </Badge>
          {selectedSection.groupId && (
            <span className="text-[10px] text-muted-foreground ml-auto font-mono">
              Group: {selectedSection.groupId}
            </span>
          )}
        </div>
      </InspectorRow>

      {/* Visual Variant Styling */}
      <InspectorRow label="Visual Variant" description="Surface elevation and border treatment.">
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded border border-border/70 bg-background">
          {(["default", "subtle", "bordered", "elevated"] as const).map((v) => {
            const isCurrent = (config.variant || "default") === v;
            return (
              <button
                key={v}
                type="button"
                disabled={disabled}
                onClick={() => handleUpdateConfig({ variant: v })}
                className={cn(
                  "py-1 text-[10px] capitalize text-center rounded transition-all cursor-pointer border-0",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 bg-transparent",
                )}
              >
                {v}
              </button>
            );
          })}
        </div>
      </InspectorRow>

      {/* Density */}
      <InspectorRow label="Padding Density" description="Internal padding and field spacing.">
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded border border-border/70 bg-background">
          {(["compact", "normal", "spacious"] as const).map((d) => {
            const isCurrent = (config.density || "compact") === d;
            return (
              <button
                key={d}
                type="button"
                disabled={disabled}
                onClick={() => handleUpdateConfig({ density: d })}
                className={cn(
                  "py-1 text-[10px] capitalize text-center rounded transition-all cursor-pointer border-0",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 bg-transparent",
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
      </InspectorRow>

      {/* Badge Text */}
      <InspectorRow
        label="Container Badge"
        description="Optional badge tag shown on container/tab header."
      >
        <div className="flex gap-2 items-center">
          <Input
            disabled={disabled}
            value={config.badge ?? ""}
            placeholder="e.g. MANDATORY, NEW..."
            onChange={(e) => handleUpdateConfig({ badge: e.target.value || undefined })}
            className="h-7 text-xs bg-background flex-1"
          />
          {config.badge && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleUpdateConfig({ badge: undefined })}
              className="text-[10px] text-destructive hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </InspectorRow>
    </>
  );
}
