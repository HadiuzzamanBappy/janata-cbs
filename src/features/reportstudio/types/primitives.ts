/**
 * Primitive value types reused across the studio.
 *
 * Units note (preserved from the monolith):
 *  - `Spacing` carries different units depending on context. Zone-level
 *    spacings are in **pt** (PDF points). BodyRow / BodyComponent spacings
 *    are stored in **mm** and converted to pt at serialise time via
 *    `utils/units.mmToPt`. Don't normalise here — callers know their unit.
 */

export type Spacing = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type Radius = {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
};

export type Align = "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";

export type Font = "HELVETICA" | "TIMES" | "COURIER";
