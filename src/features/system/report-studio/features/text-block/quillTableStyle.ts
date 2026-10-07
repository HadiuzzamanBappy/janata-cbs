/**
 * Quill table style helpers — constants and pure DOM utilities.
 *
 * These are module-level (no React) so they can be imported by both
 * the editor component and the PDF renderer without pulling in React.
 */

// Default table style
export const DEFAULT_TABLE_STYLE = {
  borderColor: "#94a3b8",
  borderWidth: "1.5",
  borderStyle: "solid",
  headerBg: "#f1f5f9",
  headerColor: "#1e293b",
  headerBold: true,
  cellBg: "#ffffff",
  cellColor: "#1e293b",
  altRowBg: "", // empty = no alternating
  cellPadding: "6px 9px",
  fontSize: "12",
  tableDsRef: "", // datasource ref — rows auto-populated from this source in PDF
};

// Build cell style string from a table style config
export const makeCellStyle = (s: typeof DEFAULT_TABLE_STYLE, isHeader: boolean) =>
  `display:table-cell;border:${s.borderWidth}px ${s.borderStyle} ${s.borderColor};` +
  `padding:${s.cellPadding};min-width:60px;vertical-align:top;` +
  `font-size:${s.fontSize}px;line-height:1.5;word-break:break-word;` +
  `background:${isHeader ? s.headerBg : s.cellBg};` +
  `color:${isHeader ? s.headerColor : s.cellColor};` +
  `font-weight:${isHeader && s.headerBold ? "700" : "400"};`;

// Build table HTML
export const buildTableHtml = (rows: number, cols: number, style = DEFAULT_TABLE_STYLE) => {
  const tableStyle = `border-collapse:collapse;width:100%;table-layout:fixed;display:table;`;
  let html = `<table style="${tableStyle}" data-ts='${JSON.stringify(style)}'><tbody style="display:table-row-group;">`;
  for (let r = 0; r < rows; r++) {
    html += `<tr style="display:table-row;">`;
    for (let c = 0; c < cols; c++) {
      const altBg = ((s) => (s.altRowBg && r % 2 === 1 ? `background:${s.altRowBg};` : ""))(style);
      html += `<td style="${makeCellStyle(style, r === 0)}${altBg}" contenteditable="true">&nbsp;</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  return html;
};

// Read style from a table DOM node
export const readTableStyle = (table: HTMLTableElement): typeof DEFAULT_TABLE_STYLE => {
  // Priority 1: data-ts attribute (set on Apply)
  try {
    const saved = JSON.parse(table.getAttribute("data-ts") || "null");
    if (saved && Object.keys(saved).length > 0) return { ...DEFAULT_TABLE_STYLE, ...saved };
  } catch (_) {}

  // Priority 2: read live inline styles from the DOM cells
  // This captures the current visual state even before first Apply
  try {
    const rows = Array.from(table.querySelectorAll("tr"));
    const headerRow = rows[0];
    const bodyRow = rows[1] || rows[0];
    const headerTd = headerRow?.querySelector("td,th") as HTMLElement | null;
    const bodyTd =
      bodyRow !== headerRow ? (bodyRow?.querySelector("td,th") as HTMLElement | null) : null;

    const cs = (el: HTMLElement | null, prop: string) =>
      el ? el.style.getPropertyValue(prop) || "" : "";

    // Parse border from header cell: "1.5px solid #94a3b8"
    const borderRaw = cs(headerTd, "border") || cs(headerTd, "border-top") || "";
    const borderParts = borderRaw.trim().split(/\s+/);
    const borderWidth = borderParts[0]
      ? parseFloat(borderParts[0]).toString()
      : DEFAULT_TABLE_STYLE.borderWidth;
    const borderStyle = borderParts[1] || DEFAULT_TABLE_STYLE.borderStyle;
    const borderColor = borderParts[2] || DEFAULT_TABLE_STYLE.borderColor;

    return {
      ...DEFAULT_TABLE_STYLE,
      borderColor,
      borderWidth,
      borderStyle,
      headerBg:
        cs(headerTd, "background") ||
        cs(headerTd, "background-color") ||
        DEFAULT_TABLE_STYLE.headerBg,
      headerColor: cs(headerTd, "color") || DEFAULT_TABLE_STYLE.headerColor,
      headerBold: (cs(headerTd, "font-weight") || "") >= "700",
      cellBg:
        cs(bodyTd, "background") || cs(bodyTd, "background-color") || DEFAULT_TABLE_STYLE.cellBg,
      cellColor: cs(bodyTd, "color") || DEFAULT_TABLE_STYLE.cellColor,
      fontSize: cs(headerTd, "font-size")
        ? parseFloat(cs(headerTd, "font-size")).toString()
        : DEFAULT_TABLE_STYLE.fontSize,
      altRowBg: DEFAULT_TABLE_STYLE.altRowBg,
      cellPadding: DEFAULT_TABLE_STYLE.cellPadding,
      tableDsRef: DEFAULT_TABLE_STYLE.tableDsRef,
    };
  } catch (_) {}

  return { ...DEFAULT_TABLE_STYLE };
};

// Apply style to DOM immediately for live preview (no save — Apply does the full save)
export const previewStyleOnTable = (tableEl: HTMLTableElement, s: typeof DEFAULT_TABLE_STYLE) => {
  if (!tableEl) return;
  Array.from(tableEl.querySelectorAll("tr")).forEach((tr, ri) => {
    const altBg = s.altRowBg && ri % 2 === 1 ? s.altRowBg : "";
    Array.from(tr.querySelectorAll("td,th")).forEach((td) => {
      const el = td as HTMLElement;
      el.style.cssText = makeCellStyle(s, ri === 0) + (altBg ? `background:${altBg};` : "");
      el.setAttribute("contenteditable", "true");
    });
  });
};

export const applyStyleToTable = (table: HTMLTableElement, s: typeof DEFAULT_TABLE_STYLE) => {
  previewStyleOnTable(table, s);
  table.setAttribute("data-ts", JSON.stringify(s));
};

// ── Reusable UI primitives (module-level — stable identity across renders) ───

export const TSW_PRESETS = [
  "#000000",
  "#ffffff",
  "#f8fafc",
  "#f1f5f9",
  "#e2e8f0",
  "#94a3b8",
  "#1e293b",
  "#334155",
  "#475569",
  "#64748b",
  "#cbd5e1",
  "#e8edf3",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#fca5a5",
  "#fdba74",
  "#fde68a",
  "#86efac",
  "#93c5fd",
  "#c4b5fd",
  "#fee2e2",
  "#ffedd5",
  "#fef9c3",
  "#dcfce7",
  "#dbeafe",
  "#ede9fe",
  "#1d4ed8",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
];
