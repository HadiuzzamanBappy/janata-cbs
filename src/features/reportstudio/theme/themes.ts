/**
 * Built-in theme presets surfaced by the `Theme` quick-picker in the page
 * setup panel. Picking a theme rewrites a set of colours on the page —
 * background, font, table-header, separator — without otherwise touching
 * the layout. Values intentionally match the monolith verbatim.
 */

export interface Theme {
  name: string;
  /** Primary accent (matches the corresponding palette entry on chips/buttons). */
  color: string;
  /** Header / footer zone background. */
  headerBg: string;
  /** Header / footer zone text colour. */
  headerFont: string;
  /** Default standalone-TABLE header colour. */
  tableHeader: string;
  /** Default soft border colour for cards / separators. */
  borderColor: string;
  /** Default separator colour. */
  sepColor: string;
}

export const THEMES: Theme[] = [
  {
    name: "Ocean",
    color: "#2563eb",
    headerBg: "#EBF2FB",
    headerFont: "#1e3a5f",
    tableHeader: "#1e40af",
    borderColor: "#bfdbfe",
    sepColor: "#2563eb",
  },
  {
    name: "Forest",
    color: "#059669",
    headerBg: "#ECFDF5",
    headerFont: "#064e3b",
    tableHeader: "#065f46",
    borderColor: "#a7f3d0",
    sepColor: "#059669",
  },
  {
    name: "Sunset",
    color: "#d97706",
    headerBg: "#FFFBEB",
    headerFont: "#78350f",
    tableHeader: "#92400e",
    borderColor: "#fde68a",
    sepColor: "#d97706",
  },
  {
    name: "Violet",
    color: "#7c3aed",
    headerBg: "#F5F3FF",
    headerFont: "#2e1065",
    tableHeader: "#4c1d95",
    borderColor: "#ddd6fe",
    sepColor: "#7c3aed",
  },
  {
    name: "Crimson",
    color: "#dc2626",
    headerBg: "#FEF2F2",
    headerFont: "#450a0a",
    tableHeader: "#991b1b",
    borderColor: "#fecaca",
    sepColor: "#dc2626",
  },
  {
    name: "Slate",
    color: "#475569",
    headerBg: "#F8FAFC",
    headerFont: "#0f172a",
    tableHeader: "#334155",
    borderColor: "#e2e8f0",
    sepColor: "#94a3b8",
  },
];
