import type { Spacing } from "./primitives";
import type { Zone } from "./zone";

/** Supported paper sizes — keys match `constants/pages.PAGE_SIZE_MM`. */
export type PageSize = "A4" | "A3" | "LETTER" | "LEGAL" | string;

export type PageOrientation = "portrait" | "landscape";

export interface PageConfig {
  size: PageSize;
  orientation: PageOrientation;
  /** Page margin — stored in **pt** (zone-style units). */
  margin: Spacing;
  header: Zone;
  footer: Zone;
}
