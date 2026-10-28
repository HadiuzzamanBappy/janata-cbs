"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useContext, useState } from "react";
import { cn } from "@/lib/core-utils";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { CbsScreenMode } from "@/types";
import { FormKernelContext } from "../store/form-kernel-provider";
import { ArrayTableSection, ObjectGroupSection, StandardGridSection } from "./sections";

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
  const hasKernel = Boolean(useContext(FormKernelContext));
  const [collapsed, setCollapsed] = useState<boolean>(section.isCollapsed ?? false);

  const isPlain = section.layoutStyle === "plain";
  const isObjectGroup = section.type === "object-group";
  const numCols = section.columns || 1;

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
      {/* Section Header */}
      {!hideHeader && (section.title || section.collapsible || !isPlain) && (
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <div className="flex items-center gap-1.5">
            {section.collapsible && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
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

      {/* Body: Array Table vs Object Group vs Standard Grid */}
      {!collapsed &&
        (section.type === "array-table" ? (
          <ArrayTableSection
            section={section}
            values={values}
            onChange={onChange}
            disabled={disabled}
            mode={mode}
          />
        ) : section.type === "object-group" ? (
          <ObjectGroupSection
            section={section}
            values={values}
            onChange={onChange}
            errors={errors}
            disabled={disabled}
            mode={mode}
            numCols={numCols}
            hasKernel={hasKernel}
          />
        ) : (
          <StandardGridSection
            section={section}
            values={values}
            onChange={onChange}
            errors={errors}
            disabled={disabled}
            mode={mode}
            numCols={numCols}
            hasKernel={hasKernel}
          />
        ))}
    </div>
  );
}
