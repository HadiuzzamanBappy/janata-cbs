/**
 * Pure PDF-helper utilities extracted from PdfPreviewModal.
 *
 * All functions are side-effect-free (except jsPDF doc mutations which are
 * intentional). Nothing here imports React.
 *
 * Already-extracted utils are IMPORTED — not re-defined:
 *   hexRgb, hexAlpha  ← @utils/color
 *   ptMm              ← @utils/units
 *   sanitizeForPdf    ← @utils/string
 *   JSPDF_FONTS       ← @constants/fonts
 */

import { hexRgb, hexAlpha } from "@/features/system/report-studio/utils/color";
import { ptMm } from "@/features/system/report-studio/utils/units";
import { sanitizeForPdf } from "@/features/system/report-studio/utils/string";
import { JSPDF_FONTS } from "@/features/system/report-studio/constants/fonts";

export { hexRgb, hexAlpha, ptMm, sanitizeForPdf, JSPDF_FONTS };

// ─── Local rounding helper ────────────────────────────────────────────────────

/**
 * Apply a rounding rule to a number.
 * Distinct from `applyRounding` in utils/number-format — that one is
 * tied to the column-format types; this one is the raw PDF-level wrapper.
 */
export function applyRound(v: number, rule?: string): number {
  if (!rule || rule === "none") return v;
  if (rule === "floor") return Math.floor(v);
  if (rule === "ceil") return Math.ceil(v);
  return Math.round(v);
}

// ─── Cell value formatter ─────────────────────────────────────────────────────

/**
 * Format a raw cell value for display using the column's format / decimals /
 * rounding settings.
 */
export function fmtVal(v: any, col: any): string {
  if (v == null) return "—";
  if (typeof v === "number") {
    const r = applyRound(v, col.rounding);
    const d = col.decimals ?? (col.format === "currency" ? 0 : undefined);
    if (col.format === "currency")
      return (
        "৳" +
        r.toLocaleString(
          "en-IN",
          d != null
            ? { minimumFractionDigits: d, maximumFractionDigits: d }
            : {},
        )
      );
    if (d != null)
      return r.toLocaleString("en-IN", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });
    return String(r);
  }
  return String(v);
}

// ─── Condition evaluator ──────────────────────────────────────────────────────

/**
 * Evaluate a condition string against a value.
 * Supports: contains:, >=, <=, !=, >, <, =
 */
export function evalCond(cond: string, val: any): boolean {
  try {
    const v = typeof val === "number" ? val : parseFloat(val);
    if (cond.startsWith("contains:"))
      return String(val).toLowerCase().includes(cond.slice(9).toLowerCase());
    if (cond.startsWith(">=")) return v >= parseFloat(cond.slice(2));
    if (cond.startsWith("<=")) return v <= parseFloat(cond.slice(2));
    if (cond.startsWith("!=")) return v !== parseFloat(cond.slice(2));
    if (cond.startsWith(">")) return v > parseFloat(cond.slice(1));
    if (cond.startsWith("<")) return v < parseFloat(cond.slice(1));
    if (cond.startsWith("=")) return v === parseFloat(cond.slice(1));
  } catch (_) { }
  return false;
}

// ─── Date formatter ───────────────────────────────────────────────────────────

/**
 * Format the current date using the given format string.
 * Tokens: yyyy, MMMM, MMM, MM, dd, HH, mm, ss
 */
export function fmtDate(fmt: string): string {
  const n = new Date();
  return fmt
    .replace("yyyy", String(n.getFullYear()))
    .replace("MMMM", n.toLocaleString("default", { month: "long" }))
    .replace("MMM", n.toLocaleString("default", { month: "short" }))
    .replace("MM", String(n.getMonth() + 1).padStart(2, "0"))
    .replace("dd", String(n.getDate()).padStart(2, "0"))
    .replace("HH", String(n.getHours()).padStart(2, "0"))
    .replace("mm", String(n.getMinutes()).padStart(2, "0"))
    .replace("ss", String(n.getSeconds()).padStart(2, "0"));
}

// ─── jsPDF font helper ────────────────────────────────────────────────────────

/** Set the active jsPDF font to the correct name+style combination. */
export function setFont(
  doc: any,
  font: string,
  bold: boolean,
  italic: boolean,
): void {
  const name = JSPDF_FONTS[font as keyof typeof JSPDF_FONTS] || "helvetica";
  const style =
    bold && italic
      ? "bolditalic"
      : bold
        ? "bold"
        : italic
          ? "italic"
          : "normal";
  doc.setFont(name, style);
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

/** Draw a filled rectangle with the given hex colour. No-op for transparent. */
export function fillRect(
  doc: any,
  x: number,
  y: number,
  w: number,
  h: number,
  hex: string,
): void {
  if (!hex || hex === "transparent") return;
  doc.setFillColor(...hexRgb(hex));
  doc.rect(x, y, w, h, "F");
}

/**
 * Draw a filled rounded rectangle with per-corner radius (values in mm).
 * Falls back to a plain rect when all radii are 0.
 * Uses cubic bezier arcs (kappa approx 0.5523) to approximate quarter-circle corners.
 */
export function fillRoundedRect(
  doc: any,
  x: number,
  y: number,
  w: number,
  h: number,
  hex: string,
  rTL: number,
  rTR: number,
  rBR: number,
  rBL: number,
): void {
  if (!hex || hex === "transparent") return;
  doc.setFillColor(...hexRgb(hex));
  const hasRadius = rTL > 0 || rTR > 0 || rBR > 0 || rBL > 0;
  if (!hasRadius) {
    doc.rect(x, y, w, h, "F");
    return;
  }
  // Clamp each radius so two adjacent corners never exceed the side length
  const mxH = w / 2,
    mxV = h / 2;
  const tl = Math.min(rTL, mxH, mxV),
    tr = Math.min(rTR, mxH, mxV);
  const br = Math.min(rBR, mxH, mxV),
    bl = Math.min(rBL, mxH, mxV);
  // k approx 0.5523 — cubic bezier approximation of a quarter-circle arc
  const k = 0.5523;
  // Draw path clockwise starting from top-left arc end
  doc.moveTo(x + tl, y);
  doc.lineTo(x + w - tr, y);
  if (tr > 0)
    doc.curveTo(x + w - tr + tr * k, y, x + w, y + tr - tr * k, x + w, y + tr);
  else doc.lineTo(x + w, y);
  doc.lineTo(x + w, y + h - br);
  if (br > 0)
    doc.curveTo(
      x + w,
      y + h - br + br * k,
      x + w - br + br * k,
      y + h,
      x + w - br,
      y + h,
    );
  else doc.lineTo(x + w, y + h);
  doc.lineTo(x + bl, y + h);
  if (bl > 0)
    doc.curveTo(x + bl - bl * k, y + h, x, y + h - bl + bl * k, x, y + h - bl);
  else doc.lineTo(x, y + h);
  doc.lineTo(x, y + tl);
  if (tl > 0) doc.curveTo(x, y + tl - tl * k, x + tl - tl * k, y, x + tl, y);
  else doc.lineTo(x, y);
  doc.close();
  doc.fillEvenOdd ? doc.fillEvenOdd() : doc.fill();
}

/**
 * Draw a horizontal rule with optional alpha blending.
 * Combines explicit opacity with any alpha baked into an 8-digit hex colour.
 */
export function drawHLine(
  doc: any,
  x: number,
  y: number,
  w: number,
  hPt: number,
  hex: string,
  opacity = 1,
): void {
  // Combine explicit opacity with any alpha baked into 8-digit hex (#RRGGBBAA)
  const alpha = Math.min(1, Math.max(0, opacity)) * hexAlpha(hex || "#aaaaaa");
  doc.setDrawColor(...hexRgb(hex || "#aaaaaa"));
  doc.setLineWidth(ptMm(hPt));
  if (alpha < 0.999) {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: alpha, "stroke-opacity": alpha }));
  }
  doc.line(x, y, x + w, y);
  if (alpha < 0.999) doc.restoreGraphicsState();
}

/**
 * Draw an image at (x,y,w,h) in mm, rotated rotDeg degrees clockwise around
 * its own centre.
 *
 * How it works:
 *   jsPDF addImage always converts its x/y/w/h to absolute PDF pts (ignoring any CTM).
 *   So we can't use setCurrentTransformationMatrix + addImage at (-w/2,-h/2) — those
 *   negative mm values get converted to garbage absolute coords.
 *
 *   Instead, we:
 *   1. Call addImage once at a hidden off-page position just to register the image and get its /Ixx index.
 *   2. Write a single `q ... cm ... /Ixx Do ... Q` block manually using the correct
 *      6-element CTM that encodes translate-to-centre x rotate x scale-to-size in one step.
 *
 *   Matrix derivation (PDF Y-up coords, CSS CW theta = negative PDF angle):
 *     M = T(cx_pt, cy_pt) . R(-theta) . S(w_pt, h_pt) . T(-0.5, -0.5)
 *   Collapsed to [a, b, c, d, e, f]:
 *     a = cos(theta).w_pt,  b = sin(theta).w_pt
 *     c = -sin(theta).h_pt, d = cos(theta).h_pt
 *     e = cx_pt - a/2 + sin(theta).h_pt/2
 *     f = cy_pt - b/2 - cos(theta).h_pt/2
 */
export function drawRotatedImage(
  doc: any,
  path: string,
  fmt: string,
  x: number,
  y: number,
  w: number,
  h: number,
  rotDeg: number,
): void {
  if (rotDeg === 0) {
    doc.addImage(path, fmt, x, y, w, h);
    return;
  }

  // Register image to get its /Ixx index (place it 10 000 mm off-page so it's invisible)
  const OFFPAGE = -10000;
  let imgIndex: number;
  try {
    doc.addImage(path, fmt, OFFPAGE, OFFPAGE, 0.01, 0.01);
    // The last registered image index
    const images =
      doc.internal.collections?.image ??
      (doc as any).__private__?.collections?.image;
    void images; // referenced for side-effect only
    // Simpler: parse the index from the last q...Do block we just wrote
    // jsPDF appends to the page stream — find the last /Ixx reference
    const pageStream: string[] = (doc as any).internal.pages[
      doc.internal.getCurrentPageInfo().pageNumber
    ];
    const lastLine = [...pageStream]
      .reverse()
      .find((l: string) => l && l.includes("/I") && l.includes("Do"));
    imgIndex = lastLine ? parseInt(lastLine.match(/\/I(\d+)/)?.[1] ?? "0") : 0;
  } catch {
    return;
  } // image load failed — skip silently

  const PT = 2.8346; // mm to pt
  const pageH_pt = doc.getPageHeight() * PT; // page height in pt (for Y-flip)
  const cx_pt = (x + w / 2) * PT;
  const cy_pt = pageH_pt - (y + h / 2) * PT; // Y-flip: PDF Y origin is bottom-left
  const w_pt = w * PT;
  const h_pt = h * PT;

  const theta = (rotDeg * Math.PI) / 180;
  const cosT = Math.cos(theta),
    sinT = Math.sin(theta);
  const f4 = (n: number) => n.toFixed(4);

  // CTM for CSS clockwise rotation (screen Y-down) around image centre in PDF Y-up space.
  // Visual TL corner = PDF local(0,1) -> screen mm verified against CSS CW formula.
  // Correct matrix: [c, -s, +s, c] with matching translation terms.
  const a = cosT * w_pt,
    b = -sinT * w_pt;
  const cc = sinT * h_pt,
    d = cosT * h_pt;
  const e = cx_pt + ((-cosT * w_pt) / 2 - (sinT * h_pt) / 2);
  const f = cy_pt + ((sinT * w_pt) / 2 - (cosT * h_pt) / 2);

  doc.internal.write("q");
  doc.internal.write(
    `${f4(a)} ${f4(b)} ${f4(cc)} ${f4(d)} ${f4(e)} ${f4(f)} cm`,
  );
  doc.internal.write(`/I${imgIndex} Do`);
  doc.internal.write("Q");
}
