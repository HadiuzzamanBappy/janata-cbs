import { BarChart2, FileImage, Pilcrow, Table2 } from "lucide-react";
import type { BodyCompType } from "../../types/body";

/**
 * Visual metadata for each body-component type.
 *
 * Drives:
 *   - The right-rail header strip (`BodyCompHeader`).
 *   - The body's "add component" palette.
 *   - The component icon in row headers and the JSON tree.
 *
 * `Icon` is typed `any` because Lucide's component signature uses a complex
 * generic — matches the monolith and keeps consuming sites import-free.
 */
export const BODY_COMP_META: Record<
  BodyCompType,
  { label: string; color: string; Icon: any; shortLabel: string }
> = {
  TABLE: { label: "Data Table", shortLabel: "TBL", color: "#d97706", Icon: Table2 },
  CHART: { label: "Chart",      shortLabel: "CHT", color: "#2563eb", Icon: BarChart2 },
  IMAGE: { label: "Image",      shortLabel: "IMG", color: "#059669", Icon: FileImage },
  TEXT_BLOCK: { label: "Text Block", shortLabel: "TXT", color: "#7c3aed", Icon: Pilcrow },
};
