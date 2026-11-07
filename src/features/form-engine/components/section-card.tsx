"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useContext, useState } from "react";
import { cn } from "@/lib/core-utils";
import { FormKernelContext } from "../store/form-kernel-provider";
import type { SectionCardProps } from "../types";
import { ArrayTableSection } from "./sections/array-table-section";
import { ObjectGroupSection } from "./sections/object-group-section";
import { StandardGridSection } from "./sections/standard-grid-section";

export type { SectionCardProps };

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
  const isGroup = section.type === "object-group";
  const isPlain = section.layoutStyle === "plain";
  const isCollapsible = !isGroup && Boolean(section.collapsible);
  const [collapsed, setCollapsed] = useState<boolean>(
    isCollapsible ? (section.isCollapsed ?? false) : false,
  );

  const numCols = section.columns || 1;

  return (
    <div
      className={cn(
        "transition-all duration-150",
        isPlain || hideHeader
          ? "space-y-2"
          : "rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5",
      )}
    >
      {/* Section Header (shown whenever layoutStyle === 'card' or title is present, unless hideHeader is set or object-group with plain style) */}
      {!hideHeader && !isPlain && (section.title || isCollapsible) && (
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <div className="flex items-center gap-1.5">
            {isCollapsible && (
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
      {(!collapsed || isGroup) &&
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
