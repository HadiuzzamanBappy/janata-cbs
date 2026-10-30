"use client";

import { FileText, Settings2, Trash2 } from "lucide-react";
import * as React from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/core-utils";
import {
  type ModelProperty,
  PROPERTY_TYPES,
  PROPERTY_WIDTHS,
  type PropertyType,
  type PropertyWidth,
  type ValidationErrorItem,
} from "@/lib/data-schemas/model-config-schema";

interface McPropertyInspectorProps {
  property?: ModelProperty;
  isReadOnly: boolean;
  isCommitted?: boolean;
  validationErrors?: ValidationErrorItem[];
  onUpdate: (sn: string, patch: Partial<ModelProperty>) => void;
  onDelete: (sn: string, forceHardDelete?: boolean) => void;
}

function InspectorRow({
  label,
  required,
  error,
  description,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-7 flex items-center gap-2">
      <div className="w-28 shrink-0 flex items-center text-xs select-none font-normal">
        {description ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex items-center">
                  <span
                    className={cn(
                      "cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground hover:text-foreground transition-colors",
                      error ? "text-destructive font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                  {required && (
                    <span className="text-destructive font-semibold ml-0.5 no-underline select-none">
                      *
                    </span>
                  )}
                </span>
              }
            />
            <TooltipContent side="right" className="text-xs max-w-xs z-50">
              {description}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Label
            className={cn(
              "text-xs select-none font-normal",
              error ? "text-destructive font-semibold" : "text-muted-foreground",
            )}
          >
            {label} {required && <span className="text-destructive font-semibold ml-0.5">*</span>}
          </Label>
        )}
      </div>
      <span className="text-muted-foreground/60 font-mono text-xs">:</span>
      <div className="max-w-md flex-1">{children}</div>
    </div>
  );
}

export function McPropertyInspector({
  property,
  isReadOnly,
  isCommitted = false,
  validationErrors = [],
  onUpdate,
  onDelete,
}: McPropertyInspectorProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  if (!property) return null;

  const nameError = validationErrors.find(
    (e) => e.sn === property.SN && (e.fieldKey === "NAME" || e.fieldKey === "name"),
  );
  const labelError = validationErrors.find(
    (e) => e.sn === property.SN && (e.fieldKey === "LABEL" || e.fieldKey === "label"),
  );

  const handleTypeChange = (val: string | null) => {
    if (!val) return;
    const nextType = val as PropertyType;
    const patch: Partial<ModelProperty> = { TYPE: nextType };
    if (nextType === "Date") {
      patch.LENGTH = 10;
    } else if (nextType === "Number") {
      patch.LENGTH = 15;
    } else if (nextType === "Text") {
      patch.LENGTH = 50;
    }
    onUpdate(property.SN, patch);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 1. Header Bar */}
      <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs"
          >
            SN #{property.SN}
          </Badge>
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
            {property.NAME || "<UNNAMED_FIELD>"}
          </span>
          {property.LABEL && (
            <span className="text-xs text-muted-foreground truncate">— {property.LABEL}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px] h-5 rounded uppercase tracking-wider",
              !isCommitted
                ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                : "text-emerald-600 border-emerald-600/30 bg-emerald-600/10 dark:text-emerald-400",
            )}
          >
            {!isCommitted ? "Draft (New)" : "Active"}
          </Badge>

          <Badge
            variant="outline"
            className="font-mono text-[10px] h-5 rounded uppercase tracking-wider text-muted-foreground"
          >
            {property.TYPE} • {property.STRUCTURE === "M" ? "Multi" : "Single"}
          </Badge>

          {!isReadOnly && !isCommitted && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="h-6.5 text-xs rounded gap-1 px-2 ml-1 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Draft</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Inspector Panels */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          {/* Panel 1: Column Identity & Data Type */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>Column Identity</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">SN #{property.SN}</span>
            </div>

            <div className="space-y-2 text-xs">
              <InspectorRow
                label="Field Name"
                required
                error={nameError?.message}
                description="Database column identifier (snake_case or camelCase) mapped to backend tables."
              >
                <Input
                  value={property.NAME}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    onUpdate(property.SN, {
                      NAME: e.target.value.replace(/\s+/g, ""),
                    })
                  }
                  className={cn(
                    "h-7 rounded text-xs font-mono bg-background",
                    nameError
                      ? "border-destructive focus-visible:ring-destructive/30 bg-destructive/5"
                      : "border-border/80",
                  )}
                />
              </InspectorRow>

              <InspectorRow
                label="Display Label"
                required
                error={labelError?.message}
                description="Human-readable label displayed across user interface screens."
              >
                <Input
                  value={property.LABEL}
                  disabled={isReadOnly}
                  onChange={(e) => onUpdate(property.SN, { LABEL: e.target.value })}
                  className={cn(
                    "h-7 rounded text-xs bg-background",
                    labelError
                      ? "border-destructive focus-visible:ring-destructive/30 bg-destructive/5"
                      : "border-border/80",
                  )}
                />
              </InspectorRow>

              <InspectorRow
                label="Data Type"
                description="Physical database column data type: Text, Number, or ISO-8601 Date."
              >
                <div className="flex items-center gap-1.5">
                  {PROPERTY_TYPES.map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={property.TYPE === t ? "default" : "outline"}
                      size="sm"
                      disabled={isReadOnly}
                      onClick={() => handleTypeChange(t)}
                      className="h-7 px-2.5 text-xs rounded flex-1"
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </InspectorRow>

              <InspectorRow
                label="Structure"
                description="Single (S) scalar value or Multi-Value (M) repeating primitive array."
              >
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant={property.STRUCTURE === "S" ? "default" : "outline"}
                    size="sm"
                    disabled={isReadOnly}
                    onClick={() => onUpdate(property.SN, { STRUCTURE: "S" })}
                    className="h-7 px-3 text-xs rounded flex-1"
                  >
                    Single (S)
                  </Button>
                  <Button
                    type="button"
                    variant={property.STRUCTURE === "M" ? "default" : "outline"}
                    size="sm"
                    disabled={isReadOnly}
                    onClick={() => onUpdate(property.SN, { STRUCTURE: "M" })}
                    className="h-7 px-3 text-xs rounded flex-1"
                  >
                    Multi-Value (M)
                  </Button>
                </div>
              </InspectorRow>
            </div>
          </div>

          {/* Panel 2: Storage & Display Constraints */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Settings2 className="size-3.5 text-primary" />
                <span>Storage & Display Constraints</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Physical Specifications</span>
            </div>

            <div className="space-y-2 text-xs">
              <InspectorRow
                label="Length / Size"
                description="Maximum character storage limit or numerical precision allowed."
              >
                <Input
                  type="number"
                  min={1}
                  max={4000}
                  value={property.LENGTH ?? 50}
                  disabled={isReadOnly || property.TYPE === "Date"}
                  onChange={(e) =>
                    onUpdate(property.SN, {
                      LENGTH: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-7 rounded text-xs bg-background border-border/80"
                />
              </InspectorRow>

              <InspectorRow
                label="Display Width"
                description="Semantic layout width token: XS (120px/flags), SM (180px/dates), MD (240px/standard), LG (360px), FULL (row-wide)."
              >
                <div className="flex items-center gap-1">
                  {PROPERTY_WIDTHS.map((w) => (
                    <Button
                      key={w}
                      type="button"
                      variant={(property.WIDTH || "md") === w ? "default" : "outline"}
                      size="sm"
                      disabled={isReadOnly || property.TYPE === "Date"}
                      onClick={() => onUpdate(property.SN, { WIDTH: w as PropertyWidth })}
                      className="h-7 px-2 text-xs rounded flex-1 uppercase"
                    >
                      {w}
                    </Button>
                  ))}
                </div>
              </InspectorRow>

              <InspectorRow
                label="Required"
                description="Whether this column enforces non-null constraint at database commit."
              >
                <label
                  htmlFor={`prop-required-${property.SN}`}
                  className={cn(
                    "flex items-center gap-2 select-none",
                    isReadOnly ? "cursor-default opacity-85" : "cursor-pointer",
                  )}
                >
                  <Checkbox
                    id={`prop-required-${property.SN}`}
                    checked={property.REQUIRED}
                    disabled={isReadOnly}
                    onCheckedChange={(val: boolean) => onUpdate(property.SN, { REQUIRED: !!val })}
                    className={cn(
                      "rounded",
                      isReadOnly && "disabled:opacity-90 disabled:cursor-default",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold",
                      property.REQUIRED
                        ? "bg-primary/10 text-primary border-primary/25"
                        : "bg-muted text-muted-foreground border-border/40",
                    )}
                  >
                    {property.REQUIRED ? "Yes" : "No"}
                  </span>
                </label>
              </InspectorRow>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Draft Field?"
        description={
          <span className="text-xs text-muted-foreground leading-relaxed block">
            Permanently delete draft field #{property.SN} ({property.NAME || "UNNAMED"})? Since this
            field has not been saved or committed yet, it will be removed entirely.
          </span>
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => onDelete(property.SN)}
      />
    </div>
  );
}
