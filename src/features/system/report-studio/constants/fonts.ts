import type { Font } from "../types/primitives";

/**
 * Font mapping tables.
 *
 *  - `FONT_FAMILY_MAP` — CSS `font-family` strings used on the canvas. The
 *    extra fallbacks (`,sans-serif`, `,serif`) matter when the system lacks
 *    the requested face.
 *  - `JSPDF_FONTS`     — the lowercase aliases jsPDF expects when calling
 *    `doc.setFont(name, style)`.
 */

export const FONT_FAMILY_MAP: Record<Font, string> = {
  HELVETICA: "Arial,sans-serif",
  TIMES: "Georgia,serif",
  COURIER: "'Courier New',monospace",
};

export const JSPDF_FONTS: Record<Font, string> = {
  HELVETICA: "helvetica",
  TIMES: "times",
  COURIER: "courier",
};
