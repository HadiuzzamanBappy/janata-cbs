/**
 * renderTable — hand-drawn table cells (no jspdf-autotable dependency).
 *
 * Extracted from PdfPreviewModal. All closures have been converted to
 * explicit parameters so this module is pure (no React, no global state).
 */

import { COLUMN_DATA_KEY_MAP } from "@/features/system/report-studio/constants/preview-data";
import {
  evalCond,
  fmtVal,
  hexRgb,
  ptMm,
  sanitizeForPdf,
  setFont,
} from "@/features/system/report-studio/pdf/helpers";

/**
 * Page-break context passed by the body renderer.
 */
export interface PageCtx {
  ensureSpace: (curY: number, needed: number) => number;
  bodyBottom: number;
}

/**
 * Render a TABLE body component onto the PDF document.
 *
 * @param doc     - Live jsPDF instance
 * @param comp    - TABLE body component object
 * @param rows    - Already-resolved data rows
 * @param x       - Left edge X in mm
 * @param y       - Top edge Y in mm
 * @param w       - Available width in mm
 * @param pageCtx - Optional page-break context
 * @returns       The new curY after the last rendered row
 */
export function renderTable(
  doc: any,
  comp: any,
  rows: any[],
  x: number,
  y: number,
  w: number,
  pageCtx?: PageCtx,
): number {
  const cols = comp.tableColumns || [];
  if (cols.length === 0) return y;
  const data =
    rows && rows.length > 0 ? rows : Array.isArray(comp.tableDataRows) ? comp.tableDataRows : [];
  const ts = comp.tableStyle || {
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    horizontalBorderOnly: false,
    verticalBorderOnly: false,
    headerBorder: true,
    headerColor: "#1e40af",
    dataBorder: true,
    cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
  };
  const cpPt = ts.cellPadding || { top: 4, bottom: 4, left: 6, right: 6 };
  const cp = {
    top: ptMm(cpPt.top ?? 4),
    bottom: ptMm(cpPt.bottom ?? 4),
    left: ptMm(cpPt.left ?? 6),
    right: ptMm(cpPt.right ?? 6),
  };
  const [hr, hg, hb] = hexRgb(ts.headerColor || "#1e40af");
  const [br, bg_, bb] = hexRgb(ts.borderColor || "#e2e8f0");
  const borderW = ts.borderWidth ?? 0.5;

  const totalWeight = cols.reduce((s: number, c: any) => s + (c.width || 1), 0) || 1;
  const colW: number[] = cols.map((c: any) => (w * (c.width || 1)) / totalWeight);

  const resolveKey = (col: any): string =>
    col.dataKey || COLUMN_DATA_KEY_MAP[col.header] || col.header;

  const extractNumber = (raw: any): number => {
    if (raw == null || raw === "") return NaN;
    if (typeof raw === "number") return raw;
    const cleaned = String(raw).replace(/[^0-9.-]/g, "");
    if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
    const n = parseFloat(cleaned);
    return isNaN(n) ? NaN : n;
  };

  const kahanSum = (arr: number[]): number => {
    let sum = 0,
      c = 0;
    for (let i = 0; i < arr.length; i++) {
      const yv = arr[i] - c;
      const t = sum + yv;
      c = t - sum - yv;
      sum = t;
    }
    return sum;
  };

  const arrayMin = (arr: number[]): number => {
    let m = arr[0];
    for (let i = 1; i < arr.length; i++) if (arr[i] < m) m = arr[i];
    return m;
  };
  const arrayMax = (arr: number[]): number => {
    let m = arr[0];
    for (let i = 1; i < arr.length; i++) if (arr[i] > m) m = arr[i];
    return m;
  };

  const computeAgg = (fn: string, dataRows: any[], dataKey: string): number | null => {
    const vals = dataRows
      .map((r: any) => extractNumber(r[dataKey]))
      .filter((v: number) => !isNaN(v));
    if (!vals.length) return null;
    const f = (fn || "").toUpperCase();
    if (f === "SUM") return kahanSum(vals);
    if (f === "AVG") return kahanSum(vals) / vals.length;
    if (f === "COUNT") return vals.length;
    if (f === "MIN") return arrayMin(vals);
    if (f === "MAX") return arrayMax(vals);
    return null;
  };

  const buildAggRow = (dataRows: any[], label: string, filter: (col: any) => boolean) => {
    const values = cols.map((col: any, ci: number) => {
      let text = "";
      let fg = hexRgb("#1e40af");
      if (col.aggregate?.function && filter(col)) {
        const key = resolveKey(col);
        const v = computeAgg(col.aggregate.function, dataRows, key);
        if (v != null) {
          const aggCol = { ...col, decimals: 2 };
          text = fmtVal(v, aggCol);
          fg = hexRgb(col.aggregate.color || "#1e40af");
        }
      }
      if (!text && ci === 0) text = label;
      return {
        text,
        bg: hexRgb("#f1f5f9") as [number, number, number],
        fg,
        bold: true,
      };
    });
    return values;
  };

  const hasPageWise = cols.some((c: any) => c.aggregate?.function && c.aggregate?.pageWise);
  const hasGrandTotal = cols.some((c: any) => c.aggregate?.function && c.aggregate?.showTotal);

  const TABLE_LH = 1.15;
  const computeRowHeight = (
    values: { text: string }[],
    fontSize: number,
  ): { rowH: number; wrapped: string[][]; lineH: number } => {
    doc.setFontSize(fontSize);
    const wrapped: string[][] = values.map((v, i) => {
      const safetyMargin = 0.5;
      const innerW = Math.max(1, colW[i] - cp.left - cp.right - safetyMargin);
      const safeText = sanitizeForPdf(v.text || "");
      return doc.splitTextToSize(safeText, innerW) || [""];
    });
    const lineH = ptMm(fontSize) * TABLE_LH;
    const maxLines = Math.max(1, ...wrapped.map((ls) => ls.length));
    const rowH = cp.top + cp.bottom + maxLines * lineH;
    return { rowH, wrapped, lineH };
  };

  const drawRow = (
    cellY: number,
    values: {
      text: string;
      bg?: [number, number, number];
      fg?: [number, number, number];
      bold?: boolean;
      italic?: boolean;
    }[],
    fontSize: number,
    align: string[],
    preComputed?: { rowH: number; wrapped: string[][]; lineH: number },
  ): number => {
    const { rowH, wrapped, lineH } = preComputed || computeRowHeight(values, fontSize);

    let cellX = x;
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      const cw = colW[i];
      if (v.bg) {
        doc.setFillColor(v.bg[0], v.bg[1], v.bg[2]);
        doc.rect(cellX, cellY, cw, rowH, "F");
      }
      if (borderW > 0) {
        doc.setDrawColor(br, bg_, bb);
        doc.setLineWidth(borderW);
        if (ts.horizontalBorderOnly) {
          doc.line(cellX, cellY, cellX + cw, cellY);
          doc.line(cellX, cellY + rowH, cellX + cw, cellY + rowH);
        } else if (ts.verticalBorderOnly) {
          doc.line(cellX, cellY, cellX, cellY + rowH);
          doc.line(cellX + cw, cellY, cellX + cw, cellY + rowH);
        } else {
          doc.rect(cellX, cellY, cw, rowH, "S");
        }
      }
      doc.setFontSize(fontSize);
      setFont(doc, "HELVETICA", !!v.bold, !!v.italic);
      const fg = v.fg || [51, 65, 85];
      doc.setTextColor(fg[0], fg[1], fg[2]);
      const aln = (align[i] || "LEFT").toLowerCase();
      const lines = wrapped[i];
      const textBlockH = lines.length * lineH;
      const contentAreaH = Math.max(0, rowH - cp.top - cp.bottom);
      const verticalOffset = (contentAreaH - textBlockH) / 2;
      let textY = cellY + cp.top + Math.max(0, verticalOffset);
      for (const line of lines) {
        let tx = cellX + cp.left;
        const opts: any = { baseline: "top" };
        if (aln === "center") {
          tx = cellX + cw / 2;
          opts.align = "center";
        } else if (aln === "right") {
          tx = cellX + cw - cp.right;
          opts.align = "right";
        }
        doc.text(line, tx, textY, opts);
        textY += lineH;
      }
      cellX += cw;
    }
    return rowH;
  };

  let curY = y;

  const drawHeader = (yPos: number): number => {
    const headerValues = cols.map((c: any) => ({
      text: c.header || "",
      bg: [hr, hg, hb] as [number, number, number],
      fg: [255, 255, 255] as [number, number, number],
      bold: true,
    }));
    const aligns = cols.map((c: any) => c.align || "LEFT");
    return drawRow(yPos, headerValues, 8, aligns);
  };

  if (ts.headerBorder) {
    curY += drawHeader(curY);
  }

  const drawPageSubtotal = (currentPageRows: any[]): number => {
    if (!hasPageWise || currentPageRows.length === 0) return 0;
    const aligns = cols.map((c: any) => c.align || "LEFT");
    const aggValues = buildAggRow(currentPageRows, "Subtotal", (col) => !!col.aggregate?.pageWise);
    const dims = computeRowHeight(aggValues, 7.5);
    return drawRow(curY, aggValues, 7.5, aligns, dims);
  };

  const oddBg = hexRgb(comp.tableOddRowBg || "#f8fafc");
  let pageRows: any[] = [];

  for (let ri = 0; ri < data.length; ri++) {
    const row = data[ri];
    const aligns = cols.map((c: any) => c.align || "LEFT");
    const cellValues = cols.map((col: any) => {
      const key = resolveKey(col);
      const raw = row[key] ?? row[col.header] ?? "";
      const disp = fmtVal(raw, col);
      let bg: [number, number, number] | undefined = ri % 2 === 1 ? oddBg : undefined;
      let fg: [number, number, number] | undefined;
      let bold = false,
        italic = false;
      for (const cond of col.conditions || []) {
        if (evalCond(cond.when, raw)) {
          if (cond.fontColor) fg = hexRgb(cond.fontColor);
          if (cond.bgColor) bg = hexRgb(cond.bgColor);
          if (cond.bold) bold = true;
          if (cond.italic) italic = true;
          break;
        }
      }
      return { text: disp, bg, fg, bold, italic };
    });

    const dims = computeRowHeight(cellValues, 7.5);

    if (pageCtx) {
      const subtotalH =
        hasPageWise && pageRows.length > 0
          ? computeRowHeight(
              buildAggRow(pageRows, "Subtotal", (col) => !!col.aggregate?.pageWise),
              7.5,
            ).rowH
          : 0;
      if (curY + subtotalH + dims.rowH > pageCtx.bodyBottom) {
        if (subtotalH > 0) {
          curY += drawPageSubtotal(pageRows);
        }
        const newY = pageCtx.ensureSpace(curY, dims.rowH);
        if (newY !== curY) {
          curY = newY;
          if (ts.headerBorder) curY += drawHeader(curY);
          pageRows = [];
        }
      }
    }

    curY += drawRow(curY, cellValues, 7.5, aligns, dims);
    pageRows.push(row);
  }

  if (hasPageWise && pageRows.length > 0 && pageRows.length < data.length) {
    const aligns = cols.map((c: any) => c.align || "LEFT");
    const aggValues = buildAggRow(pageRows, "Subtotal", (col) => !!col.aggregate?.pageWise);
    const dims = computeRowHeight(aggValues, 7.5);
    if (pageCtx) {
      const newY = pageCtx.ensureSpace(curY, dims.rowH);
      if (newY !== curY) {
        curY = newY;
        if (ts.headerBorder) curY += drawHeader(curY);
      }
    }
    curY += drawRow(curY, aggValues, 7.5, aligns, dims);
  }

  if (hasGrandTotal) {
    const aligns = cols.map((c: any) => c.align || "LEFT");
    const aggValues = buildAggRow(data, "Total", (col) => !!col.aggregate?.showTotal);
    const dims = computeRowHeight(aggValues, 7.5);
    if (pageCtx) {
      const newY = pageCtx.ensureSpace(curY, dims.rowH);
      if (newY !== curY) {
        curY = newY;
        if (ts.headerBorder) curY += drawHeader(curY);
      }
    }
    curY += drawRow(curY, aggValues, 7.5, aligns, dims);
  }

  return curY;
}
