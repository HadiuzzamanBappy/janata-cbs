/**
 * @fileoverview The width badge on a canvas field (top-level card or object-group inner row).
 *
 * @module features/system/form-config/components/designer/canvas/field-width-badge
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { deriveSemanticWidth } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormElement, ModelProperty } from "@/lib/data-schemas";

export interface FieldWidthBadgeProps {
  field: FormElement;
  /** The field's model property; its LENGTH and TYPE decide the width an unset field gets. */
  modelProp?: ModelProperty | null;
}

/**
 * Shows the width the form uses: quiet while it follows the column length (WIDTH unset, or set
 * to the same token), highlighted once set to another width.
 */
export function FieldWidthBadge({ field, modelProp }: FieldWidthBadgeProps) {
  const lengthWidth = deriveSemanticWidth(
    undefined,
    modelProp?.LENGTH ?? field.LENGTH,
    modelProp?.TYPE ?? field.TYPE,
  );
  const width = field.WIDTH ?? lengthWidth;
  const isChanged = width !== lengthWidth;
  const label = width.toUpperCase();
  const title = !field.WIDTH
    ? `Width ${label}: follows the column length`
    : isChanged
      ? `Width ${label}: set (the column length gives ${lengthWidth.toUpperCase()})`
      : `Width ${label}: set (the column length gives the same)`;

  return (
    <Badge
      variant={isChanged ? "secondary" : "outline"}
      className={cn(
        "text-3xs h-3.5 px-1 font-mono uppercase shrink-0",
        !isChanged && "text-muted-foreground",
      )}
      title={title}
    >
      {label}
    </Badge>
  );
}
