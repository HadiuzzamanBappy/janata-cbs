import type { Radius, Spacing } from "./primitives";

/**
 * Header / footer "zone" model.
 *
 * Zones contain a mix of:
 *   - free-position elements (no `rowId`), placed by x/y in pt,
 *   - row-attached elements (have a `rowId`) laid out into 1–4 column rows.
 *
 * All numeric values in the zone tree are in **pt** (PDF points) — unlike the
 * body which stores values in mm. This mirrors the monolith and keeps the
 * serialise step in `data/buildReportJson` (Phase 7) free of unit guesswork.
 */

export interface ZoneElement {
  _id: string;
  type: string;
  config: any;
  hidden?: boolean;
  locked?: boolean;
  opacity?: number;
  zIndex?: number;
  rowId?: string;
  children?: ZoneElement[];
}

export interface ZoneRow {
  _id: string;
  cols: 1 | 2 | 3 | 4;
  height?: number;
  background?: string;
  margin?: Spacing;
  padding?: Spacing;
}

export type ZonePageShow =
  | "all"
  | "first_only"
  | "last_only"
  | "except_first"
  | "except_last"
  | "odd_pages"
  | "even_pages"
  | "custom";

export interface ZonePageVisibility {
  showOn: ZonePageShow;
  /** 1-based page numbers used when `showOn === "custom"`. */
  customPages?: number[];
}

export interface Zone {
  background: string;
  fontColor: string;
  padding: Spacing;
  margin: Spacing;
  radius: Radius;
  rows?: ZoneRow[];
  elements: ZoneElement[];
  /** Rendered height in pt — populated after layout for footer Y anchoring. */
  height?: number;
  minHeight?: number;
  pageVisibility?: ZonePageVisibility;
}
