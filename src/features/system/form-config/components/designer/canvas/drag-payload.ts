/**
 * @fileoverview Native drag and drop data of the designer. Every drag is written and read here,
 * under the designer's own MIME type and through `designerDragPayloadSchema`, so a drop from
 * another app or window never reaches the layout unchecked.
 *
 * @module features/system/form-config/components/designer/canvas/drag-payload
 */

import type * as React from "react";
import { type DesignerDragPayload, designerDragPayloadSchema } from "@/lib/data-schemas";

const DESIGNER_DRAG_MIME = "application/x-cbs-form-designer";

export type PaletteDragPayload = Exclude<DesignerDragPayload, { type: "canvas-tab" }>;

/** Where a dropped palette item lands. */
export type PaletteDropTarget =
  /** A new block on the canvas, at this section index (end when unset). */
  | { kind: "canvas"; insertIndex?: number }
  /** Into this section, at this field index (end when unset). */
  | { kind: "section"; sectionId: string; insertIndex?: number }
  /** A new tab in this tab group. */
  | { kind: "new-tab"; groupId: string; title: string };

export function writeDragPayload(e: React.DragEvent, payload: DesignerDragPayload): void {
  e.dataTransfer.setData(DESIGNER_DRAG_MIME, JSON.stringify(payload));
}

/** The drop's designer payload, or null when it is not one (foreign, malformed or tampered). */
export function readDragPayload(e: React.DragEvent): DesignerDragPayload | null {
  const raw = e.dataTransfer.getData(DESIGNER_DRAG_MIME);
  if (!raw) return null;
  try {
    const parsed = designerDragPayloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
