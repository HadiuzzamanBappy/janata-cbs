/**
 * Text measurement and line-breaking engine for the PDF renderer.
 *
 * These helpers are extracted from PdfPreviewModal and have no React dependency.
 * They operate on a live jsPDF `doc` instance passed as an explicit parameter.
 */

import {
  hexRgb,
  sanitizeForPdf,
  ptMm,
} from "@/features/reportstudio/pdf/helpers";
import { setFont, fillRect } from "@/features/reportstudio/pdf/helpers";

export { setFont, fillRect };

/**
 * Line-height multiplier — matches Quill .ql-editor { line-height: 1.6 }
 */
export const LH = 1.6;

/**
 * Compute the rendered height of one text line in mm at the given font size.
 */
export function thMm(fsPt: number): number {
  return ptMm(fsPt) * LH;
}

/**
 * Render a sequence of styled runs for a single line of text.
 *
 * @param doc         - Live jsPDF instance
 * @param runs        - Array of {text, varStyle?} objects for the line
 * @param startX      - Left edge X in mm
 * @param curY        - Top-of-line Y in mm (baseline: "top")
 * @param innerW      - Available width in mm (for alignment calculations)
 * @param paraFsPt    - Paragraph-level font size in pt
 * @param paraFont    - Paragraph-level font name
 * @param paraBold    - Paragraph-level bold flag
 * @param paraItal    - Paragraph-level italic flag
 * @param paraColor   - Paragraph-level font colour hex
 * @param aln         - Alignment: "left" | "center" | "right" (not "justify" — caller handles that)
 * @param lineStr     - Full line string (used to compute total line width for alignment)
 * @param underline   - Paragraph-level underline flag
 */
export function renderRunsLine(
  doc: any,
  runs: Array<{ text: string; varStyle?: any }>,
  startX: number,
  curY: number,
  innerW: number,
  paraFsPt: number,
  paraFont: string,
  paraBold: boolean,
  paraItal: boolean,
  paraColor: string,
  aln: string,
  lineStr: string,
  underline: boolean,
): void {
  // Compute line width for center/right alignment
  setFont(doc, paraFont, paraBold, paraItal);
  doc.setFontSize(paraFsPt);
  const lineW = doc.getStringUnitWidth(lineStr) * paraFsPt * ptMm(1);
  // ptMm(1) = PT_TO_MM
  let curX = startX;
  if (aln === "center") curX = startX + (innerW - lineW) / 2;
  else if (aln === "right") curX = startX + innerW - lineW;

  for (const run of runs) {
    const sanitized = sanitizeForPdf(run.text);
    if (!sanitized) continue;
    const vs = run.varStyle;
    const fsPt = vs?.fontSize ?? paraFsPt;
    const bold = vs?.bold ?? paraBold;
    const ital = vs?.italic ?? paraItal;
    const color = vs?.color ?? paraColor;
    setFont(doc, paraFont, bold, ital);
    doc.setFontSize(fsPt);
    doc.setTextColor(...hexRgb(color));
    if (vs?.background && vs.background !== "transparent") {
      const cw = doc.getStringUnitWidth(sanitized) * fsPt * ptMm(1);
      fillRect(
        doc,
        curX,
        curY - ptMm(fsPt) * 0.1,
        cw,
        ptMm(fsPt) * 1.2,
        vs.background,
      );
    }
    doc.text(sanitized, curX, curY, { baseline: "top" });
    if (vs?.underline ?? underline) {
      const uw = doc.getStringUnitWidth(sanitized) * fsPt * ptMm(1);
      doc.setDrawColor(...hexRgb(color));
      doc.setLineWidth(Math.max(0.2, ptMm(fsPt) * 0.07));
      doc.line(
        curX,
        curY + ptMm(fsPt) * 0.92,
        curX + uw,
        curY + ptMm(fsPt) * 0.92,
      );
    }
    curX += doc.getStringUnitWidth(sanitized) * fsPt * ptMm(1);
  }
}

/**
 * Render a justified line by distributing word gaps to fill innerW exactly.
 * For single-word lines, falls back to left-align.
 *
 * @param doc        - Live jsPDF instance
 * @param line       - The line string (trimmed)
 * @param startX     - Left edge X in mm
 * @param curY       - Top-of-line Y in mm
 * @param innerW     - Available width in mm
 * @param paraFsPt   - Font size in pt
 * @param paraFont   - Font name
 * @param paraBold   - Bold flag
 * @param paraItal   - Italic flag
 * @param paraColor  - Colour hex
 */
export function renderJustifiedLine(
  doc: any,
  line: string,
  startX: number,
  curY: number,
  innerW: number,
  paraFsPt: number,
  paraFont: string,
  paraBold: boolean,
  paraItal: boolean,
  paraColor: string,
): void {
  setFont(doc, paraFont, paraBold, paraItal);
  doc.setFontSize(paraFsPt);
  doc.setTextColor(...hexRgb(paraColor));

  // Split line into words (no empty strings)
  const words = line.trimEnd().split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    // Single word or empty — just left-align
    if (words[0]) doc.text(words[0], startX, curY, { baseline: "top" });
  } else {
    // Measure each word width
    const wordWidths = words.map(
      (w: string) =>
        doc.getStringUnitWidth(sanitizeForPdf(w)) * paraFsPt * ptMm(1),
    );
    const totalWordW = wordWidths.reduce((a: number, b: number) => a + b, 0);
    const gap = Math.max(0, (innerW - totalWordW) / (words.length - 1));
    let wx = startX;
    for (let wi = 0; wi < words.length; wi++) {
      doc.text(sanitizeForPdf(words[wi]), wx, curY, { baseline: "top" });
      wx += wordWidths[wi] + (wi < words.length - 1 ? gap : 0);
    }
  }
}
