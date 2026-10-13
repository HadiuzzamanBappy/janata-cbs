"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import type { CbsScreenMode } from "@/lib/cbs-screen";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { UnifiedFieldFactory } from "./field-factory";

export interface SectionCardProps {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
  hideHeader?: boolean;
}

export function SectionCard({
  section,
  values,
  onChange,
  errors = {},
  disabled = false,
  mode = "I",
  hideHeader = false,
}: SectionCardProps) {
  const [collapsed, setCollapsed] = React.useState<boolean>(section.isCollapsed ?? false);

  const isPlain = section.layoutStyle === "plain";
  const isObjectGroup = section.type === "object-group";

  const numCols = section.columns || 1;

  const getGridColsClass = (cols: number) => {
    switch (cols) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      default:
        return "grid-cols-1";
    }
  };

  const getFieldColSpanClass = (cols: number, span?: number) => {
    if (cols <= 1) {
      switch (span) {
        case 3:
          return "w-full sm:max-w-[25%] sm:min-w-[200px]";
        case 4:
          return "w-full sm:max-w-[33.333%] sm:min-w-[240px]";
        case 6:
          return "w-full sm:max-w-[50%] sm:min-w-[280px]";
        case 8:
          return "w-full sm:max-w-[66.666%] sm:min-w-[320px]";
        case 12:
        default:
          return "w-full";
      }
    }
    if (cols === 2) {
      return span && span >= 12 ? "col-span-2 w-full" : "col-span-1 w-full";
    }
    if (cols === 3) {
      if (span && span >= 12) return "col-span-3 w-full";
      if (span && span >= 8) return "col-span-2 w-full";
      return "col-span-1 w-full";
    }
    if (cols === 4) {
      if (span && span >= 12) return "col-span-4 w-full";
      if (span && span >= 9) return "col-span-3 w-full";
      if (span && span >= 6) return "col-span-2 w-full";
      return "col-span-1 w-full";
    }
    return "w-full";
  };

  return (
    <div
      className={cn(
        "transition-all duration-150",
        isPlain || hideHeader
          ? "py-1 space-y-2"
          : "rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5",
        isObjectGroup && "bg-muted/10 border-dashed",
      )}
    >
      {/* Section Header (Hidden if hideHeader is true, or for plain root canvas sections without title/collapsible) */}
      {!hideHeader && (section.title || section.collapsible || !isPlain) && (
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <div className="flex items-center gap-1.5">
            {section.collapsible && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded"
              >
                {collapsed ? (
                  <ChevronRight className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
            )}
            {section.title && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </span>
            )}
            {section.description && (
              <span className="text-[11px] text-muted-foreground/60 font-normal">
                &bull; {section.description}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Grid Form Fields */}
      {!collapsed && (
        <div className={cn("grid gap-x-4 gap-y-2.5 text-xs pt-1", getGridColsClass(numCols))}>
          {section.fields.map((field) => {
            if (field.hidden) return null;

            return (
              <div key={field.id} className={getFieldColSpanClass(numCols, field.colSpan)}>
                <UnifiedFieldFactory
                  field={field}
                  value={values[field.fieldKey]}
                  onChange={onChange}
                  error={errors[field.fieldKey]}
                  disabled={disabled}
                  mode={mode}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
