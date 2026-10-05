/**
 * renderBand — header/footer zone renderer.
 *
 * Extracted from PdfPreviewModal. Handles:
 *   - Zone background (with per-corner radius)
 *   - Sequential flow elements (TEXT, DATE_TIME, PAGE_NUMBER, SEPARATOR)
 *   - Absolute-position LOGO elements
 *   - Free-position (flexmove) elements with rotation and box borders
 *   - Row-based zone layouts
 *   - Page-visibility guard (shouldRenderZone)
 */

import {
  hexRgb,
  ptMm,
  sanitizeForPdf,
  fillRect,
  fillRoundedRect,
  drawHLine,
  drawRotatedImage,
  setFont,
  fmtDate,
} from "@/features/reportstudio/pdf/helpers";
import type { ZonePageVisibility } from "@/features/reportstudio/types/zone";

// ── Line-height factor ────────────────────────────────────────────────────────

/** Matches Quill .ql-editor { line-height: 1.6 } */
const LH = 1.6;

/** Rendered height of one text line in mm at the given font size. */
const thMm = (fsPt: number): number => ptMm(fsPt) * LH;

// ── Page-visibility guard ─────────────────────────────────────────────────────

/**
 * Return true if the zone should be rendered on the given page.
 */
export function shouldRenderZone(
  zone: any,
  pageNum: number,
  totalPages: number
): boolean {
  const vis: ZonePageVisibility | undefined = zone?.pageVisibility;
  if (!vis || vis.showOn === "all") return true;
  switch (vis.showOn) {
    case "first_only":
      return pageNum === 1;
    case "last_only":
      return pageNum === totalPages;
    case "except_first":
      return pageNum !== 1;
    case "except_last":
      return pageNum !== totalPages;
    case "odd_pages":
      return pageNum % 2 !== 0;
    case "even_pages":
      return pageNum % 2 === 0;
    case "custom": {
      const pages = (vis.customPages ?? []).map(Number);
      return pages.includes(pageNum);
    }
    default:
      return true;
  }
}

// ── Free-position element renderer ───────────────────────────────────────────

/**
 * Draw a free-position text element (flexmove) with full feature parity to the canvas.
 * Uses a SINGLE CTM block so border and text share the exact same rotation pivot,
 * matching CSS transformOrigin:center center exactly.
 */
function drawFlexmoveElement(
  doc: any,
  el: any,
  zone: any,
  fx: number,
  fy: number,
  pageNum: number,
  totalPages: number
): void {
  const cfg = el.config || {};
  const box = cfg.box || {};
  const fsPt: number = cfg.fontSize ?? 10;
  const lineH = ptMm(fsPt) * LH;
  const elW = ptMm(cfg.width ?? 80);
  const rotDeg: number = cfg.rotation ?? 0;

  // Box padding (pt to mm)
  const bpT = box.enabled ? ptMm(box.padding?.top ?? 4) : 0;
  const bpR = box.enabled ? ptMm(box.padding?.right ?? 6) : 0;
  const bpB = box.enabled ? ptMm(box.padding?.bottom ?? 4) : 0;
  const bpL = box.enabled ? ptMm(box.padding?.left ?? 6) : 0;
  const bw = box.enabled ? ptMm(box.borderWidth ?? 1) : 0;

  // Box dimensions
  const fixedBoxH = box.enabled && box.height ? ptMm(box.height) : 0;
  const boxW = elW + bpL + bpR + bw * 2;
  const boxH = fixedBoxH > 0 ? fixedBoxH : lineH + bpT + bpB + bw * 2;

  // Vertical text offset within box (mm from box top)
  const vOffset =
    fixedBoxH > 0
      ? (box.verticalAlign || "top") === "bottom"
        ? fixedBoxH - bpB - bw - lineH
        : (box.verticalAlign || "top") === "middle"
        ? (fixedBoxH - lineH) / 2
        : bpT + bw
      : bpT + bw;

  const PT = 2.8346;
  const pageH_pt = doc.getPageHeight() * PT;

  // Element centre — rotation pivot (matches CSS transformOrigin:center center)
  const cx = fx + boxW / 2;
  const cy = fy + boxH / 2;

  // CTM: CSS clockwise rotation around centre in PDF Y-up space
  // CSS CW = [cos, sin, -sin, cos] in PDF Y-up with translation to centre pt
  const theta = (rotDeg * Math.PI) / 180;
  const cosTheta = Math.cos(theta),
    sinTheta = Math.sin(theta);
  const cx_pt = cx * PT;
  const cy_pt = pageH_pt - cy * PT;
  const f4 = (n: number) => n.toFixed(4);

  // Box dimensions in PDF pts
  const boxW_pt = boxW * PT,
    boxH_pt = boxH * PT;
  const bw_pt = bw * PT;
  const bpL_pt = bpL * PT,
    bpR_pt = bpR * PT;
  const vOff_pt = vOffset * PT;

  // In CTM local frame (origin = element centre, Y-up):
  // bottom-left of box = (-boxW_pt/2, -boxH_pt/2)
  const lx = -boxW_pt / 2;
  const ly = -boxH_pt / 2;

  doc.internal.write("q");
  // CSS CW rotation in PDF Y-up: [c, -s, s, c, cx_pt, cy_pt]
  doc.internal.write(
    `${f4(cosTheta)} ${f4(-sinTheta)} ${f4(sinTheta)} ${f4(cosTheta)} ${f4(
      cx_pt
    )} ${f4(cy_pt)} cm`
  );

  // ── Box border (drawn in local coordinates) ──
  if (box.enabled && bw > 0) {
    const [r, g, b_] = hexRgb(box.borderColor || "#2563eb");
    const bxAlpha = box.opacity ?? 1;
    if (bxAlpha < 0.999) {
      doc.internal.write(`q`);
      doc.internal.write(`${f4(bxAlpha)} ca ${f4(bxAlpha)} CA`);
    }
    doc.internal.write(`${f4(r / 255)} ${f4(g / 255)} ${f4(b_ / 255)} RG`);
    doc.internal.write(`${f4(bw_pt)} w`);

    const styleMap: Record<string, string> = {
      dashed: `[${f4(3 * PT)} ${f4(2 * PT)}] 0 d`,
      dotted: `[${f4(PT)} ${f4(1.5 * PT)}] 0 d`,
    };
    const dashCmd = styleMap[box.borderStyle || "solid"] ?? "";
    if (dashCmd) doc.internal.write(dashCmd);

    const sides: string[] = box.borderSides ?? [
      "top",
      "right",
      "bottom",
      "left",
    ];

    // Parse border radius (stored in pt -> convert to PDF pts = same unit in local frame)
    const bxRaw = box.radius;
    const bxR =
      bxRaw && typeof bxRaw === "object"
        ? {
            tl: (bxRaw.topLeft || 0) * PT,
            tr: (bxRaw.topRight || 0) * PT,
            br: (bxRaw.bottomRight || 0) * PT,
            bl: (bxRaw.bottomLeft || 0) * PT,
          }
        : {
            tl: (bxRaw || 0) * PT,
            tr: (bxRaw || 0) * PT,
            br: (bxRaw || 0) * PT,
            bl: (bxRaw || 0) * PT,
          };
    const hasRadius = bxR.tl > 0 || bxR.tr > 0 || bxR.br > 0 || bxR.bl > 0;

    // Clamp radii so two adjacent corners never exceed the side length
    const mxH = boxW_pt / 2,
      mxV = boxH_pt / 2;
    const tl = Math.min(bxR.tl, mxH, mxV),
      tr = Math.min(bxR.tr, mxH, mxV);
    const br = Math.min(bxR.br, mxH, mxV),
      bl = Math.min(bxR.bl, mxH, mxV);

    if (sides.length === 4 && hasRadius) {
      // Rounded rect via cubic bezier arcs (k approx 0.5523) in local Y-up PDF coords
      // Local: bottom-left=(lx,ly), top-left=(lx,ly+boxH_pt),
      //        top-right=(lx+boxW_pt,ly+boxH_pt), bottom-right=(lx+boxW_pt,ly)
      const k = 0.5523;
      const bx = lx,
        by = ly,
        bw2 = boxW_pt,
        bh = boxH_pt;
      // Start at top-left arc end (moving right along top edge)
      doc.internal.write(`${f4(bx + tl)} ${f4(by + bh)} m`);
      doc.internal.write(`${f4(bx + bw2 - tr)} ${f4(by + bh)} l`);
      // Top-right corner
      if (tr > 0)
        doc.internal.write(
          `${f4(bx + bw2 - tr + tr * k)} ${f4(by + bh)} ${f4(bx + bw2)} ${f4(
            by + bh - tr + tr * k
          )} ${f4(bx + bw2)} ${f4(by + bh - tr)} c`
        );
      else doc.internal.write(`${f4(bx + bw2)} ${f4(by + bh)} l`);
      doc.internal.write(`${f4(bx + bw2)} ${f4(by + br)} l`);
      // Bottom-right corner
      if (br > 0)
        doc.internal.write(
          `${f4(bx + bw2)} ${f4(by + br - br * k)} ${f4(
            bx + bw2 - br + br * k
          )} ${f4(by)} ${f4(bx + bw2 - br)} ${f4(by)} c`
        );
      else doc.internal.write(`${f4(bx + bw2)} ${f4(by)} l`);
      doc.internal.write(`${f4(bx + bl)} ${f4(by)} l`);
      // Bottom-left corner
      if (bl > 0)
        doc.internal.write(
          `${f4(bx + bl - bl * k)} ${f4(by)} ${f4(bx)} ${f4(
            by + bl - bl * k
          )} ${f4(bx)} ${f4(by + bl)} c`
        );
      else doc.internal.write(`${f4(bx)} ${f4(by)} l`);
      doc.internal.write(`${f4(bx)} ${f4(by + bh - tl)} l`);
      // Top-left corner
      if (tl > 0)
        doc.internal.write(
          `${f4(bx)} ${f4(by + bh - tl + tl * k)} ${f4(bx + tl - tl * k)} ${f4(
            by + bh
          )} ${f4(bx + tl)} ${f4(by + bh)} c`
        );
      else doc.internal.write(`${f4(bx)} ${f4(by + bh)} l`);
      doc.internal.write(`h S`);
    } else if (sides.length === 4) {
      doc.internal.write(
        `${f4(lx)} ${f4(ly)} ${f4(boxW_pt)} ${f4(boxH_pt)} re S`
      );
    } else {
      // Individual sides in local Y-up coords
      if (sides.includes("top"))
        doc.internal.write(
          `${f4(lx)} ${f4(ly + boxH_pt)} m ${f4(lx + boxW_pt)} ${f4(
            ly + boxH_pt
          )} l S`
        );
      if (sides.includes("bottom"))
        doc.internal.write(
          `${f4(lx)} ${f4(ly)} m ${f4(lx + boxW_pt)} ${f4(ly)} l S`
        );
      if (sides.includes("left"))
        doc.internal.write(
          `${f4(lx)} ${f4(ly)} m ${f4(lx)} ${f4(ly + boxH_pt)} l S`
        );
      if (sides.includes("right"))
        doc.internal.write(
          `${f4(lx + boxW_pt)} ${f4(ly)} m ${f4(lx + boxW_pt)} ${f4(
            ly + boxH_pt
          )} l S`
        );
    }
    if (dashCmd) doc.internal.write(`[] 0 d`);
    if (bxAlpha < 0.999) doc.internal.write(`Q`);
  }

  // ── Text (drawn in same local coordinate frame) ──
  const aln = (cfg.align || "LEFT").toLowerCase();
  let txt =
    el.type === "TEXT"
      ? cfg.text || ""
      : el.type === "DATE_TIME"
      ? (cfg.text || "") + fmtDate(cfg.format || "yyyy-MM-dd")
      : el.type === "PAGE_NUMBER"
      ? `Page ${pageNum} of ${totalPages}`
      : "";
  txt = sanitizeForPdf(txt);

  if (txt) {
    doc.setFontSize(fsPt);
    setFont(doc, cfg.font || "HELVETICA", !!cfg.bold, !!cfg.italic);
    const fontKey = doc.internal.getFont().id;
    const [tr, tg, tb] = hexRgb(cfg.fontColor || zone.fontColor || "#333333");

    // Text X in local frame (from left edge of box)
    const textLeft = lx + bw_pt + bpL_pt;
    const textRight = lx + boxW_pt - bw_pt - bpR_pt;
    let textLocalX = textLeft;
    if (aln === "center") textLocalX = lx + boxW_pt / 2;
    else if (aln === "right") textLocalX = textRight;

    // Text Y baseline in local Y-up frame:
    // top of box in local = ly + boxH_pt
    // vOff_pt = distance from box top to text top (already includes border width)
    // ascenderPt approx fsPt * 0.85 = distance from text top to baseline (matches jsPDF baseline:'top')
    const ascenderPt = fsPt * 0.85;
    const textLocalY = ly + boxH_pt - vOff_pt - ascenderPt;

    // Center/right: measure width and offset
    const txtW_pt = doc.getStringUnitWidth(txt) * fsPt;
    let adjX = textLocalX;
    if (aln === "center") adjX = textLocalX - txtW_pt / 2;
    else if (aln === "right") adjX = textLocalX - txtW_pt;

    doc.internal.write(`BT`);
    doc.internal.write(`${f4(tr / 255)} ${f4(tg / 255)} ${f4(tb / 255)} rg`);
    doc.internal.write(`/${fontKey} ${f4(fsPt)} Tf`);
    doc.internal.write(`1 0 0 1 ${f4(adjX)} ${f4(textLocalY)} Tm`);
    doc.internal.write(`(${txt}) Tj`);
    doc.internal.write(`ET`);
  }

  doc.internal.write("Q");
}

// ── Zone renderer ─────────────────────────────────────────────────────────────

/**
 * Render a header or footer zone onto the PDF document.
 *
 * @param doc        - Live jsPDF instance
 * @param zone       - Zone config object
 * @param zx         - Left edge X in mm
 * @param zy         - Top edge Y in mm  (pass -9999 for measurement-only pass)
 * @param zw         - Zone width in mm
 * @param pageNum    - Current page number (1-based)
 * @param totalPages - Total page count
 * @returns          The rendered zone height in mm
 */
export function renderZone(
  doc: any,
  zone: any,
  zx: number,
  zy: number,
  zw: number,
  pageNum: number,
  totalPages: number
): number {
  const padT = ptMm(zone.padding?.top ?? 5);
  const padB = ptMm(zone.padding?.bottom ?? 5);
  const padL = ptMm(zone.padding?.left ?? 0);
  const padR = ptMm(zone.padding?.right ?? 0);
  const cx = zx + padL;
  const cw = zw - padL - padR;

  const allEls: any[] = zone.elements || [];

  // ── Calculate zone height ──
  const hasZoneRows = zone.rows?.length > 0;

  // Helper: actual rendered height of a single element (pt to mm)
  const elRenderedH = (el: any): number => {
    const cfg = el.config || {};
    if (el.type === "LOGO") return ptMm(cfg.height ?? 0);
    if (el.type === "SEPARATOR") return ptMm(cfg.height ?? 0);
    return thMm(cfg.fontSize ?? 0);
  };

  // ── Zone height calculation ──
  // Strategy:
  //   - LOGO (flexmove/absolute): contributes via its bottom edge — max'd, not stacked
  //   - Flow elements (TEXT, DATE, SEP without rowId): stacked sequentially in flowH
  //   - Rows (hasZoneRows): stacked sequentially after flow elements
  //   - zoneH = max(logoBottom, flowH + rowsH) + padB already included in flowH

  let logoLb = 0; // absolute logo's bottom edge (from zone top)
  let flowH = padT + padB; // sequential flow height (includes padding)
  let rowsH = 0; // total height of all zone rows

  // Flow elements (direct, no rowId)
  for (const el of allEls) {
    if (el.hidden || el.rowId) continue;
    if (el.type === "ROW") {
      // handled below
    } else if (el.type === "LOGO") {
      // LOGO is absolute — record its bottom edge for max comparison
      const cfg = el.config || {};
      const lb = padT + ptMm((cfg.y ?? 0) + (cfg.height ?? 0)) + padB;
      if (lb > logoLb) logoLb = lb;
    } else if (!el.config?.flexmove) {
      // Sequential flow element — stacks height
      const cfg = el.config || {};
      flowH +=
        ptMm(cfg.margin?.top ?? 0) +
        elRenderedH(el) +
        ptMm(cfg.margin?.bottom ?? 0);
    }
  }

  // Rows
  if (hasZoneRows) {
    for (const row of zone.rows) {
      const mg = row.margin || { top: 0, bottom: 0 };
      const pad2 = row.padding || { top: 0, bottom: 0 };
      const rowEls = (zone.elements || []).filter(
        (e: any) => e.rowId === row._id && !e.hidden
      );
      const contentH = rowEls.reduce(
        (m: number, el: any) => Math.max(m, elRenderedH(el)),
        0
      );
      const autoH = contentH + ptMm(pad2.top ?? 0) + ptMm(pad2.bottom ?? 0);
      const rowH = autoH > 0 ? autoH : ptMm(row.height ?? 0);
      rowsH += ptMm(mg.top ?? 0) + rowH + ptMm(mg.bottom ?? 0);
    }
  }

  // Total: flow elements stack, rows stack after them.
  // LOGO is absolute so it only wins if it's taller than everything else.
  const calcH = Math.max(flowH + rowsH, logoLb);

  const zoneH = hasZoneRows
    ? calcH
    : Math.max(calcH, ptMm(zone.minHeight ?? zone.height ?? 0));

  // Draw zone background with per-corner radius (stored in pt -> convert to mm)
  const zr = zone.radius || {
    topLeft: 0,
    topRight: 0,
    bottomRight: 0,
    bottomLeft: 0,
  };
  fillRoundedRect(
    doc,
    zx,
    zy,
    zw,
    zoneH,
    zone.background,
    ptMm(zr.topLeft ?? 0),
    ptMm(zr.topRight ?? 0),
    ptMm(zr.bottomRight ?? 0),
    ptMm(zr.bottomLeft ?? 0)
  );

  let curY = zy + padT;

  const renderRowEl = (row: any, rowCols: any[]) => {
    const mg = row.margin || { top: 0, bottom: 0, left: 0, right: 0 };
    const pad2 = row.padding || { top: 0, bottom: 0, left: 0, right: 0 };
    const allColEls = rowCols.flatMap((col: any) => col.elements || []);
    const contentH = allColEls.reduce(
      (m: number, el: any) => Math.max(m, elRenderedH(el)),
      0
    );
    const autoH = contentH + ptMm(pad2.top ?? 0) + ptMm(pad2.bottom ?? 0);
    const rowH = autoH > 0 ? autoH : ptMm(row.height ?? 0);
    const rY = curY + ptMm(mg.top ?? 0);
    const rX = zx + ptMm(mg.left ?? 0);
    const rW = zw - ptMm(mg.left ?? 0) - ptMm(mg.right ?? 0);

    if (row.background && row.background !== "transparent")
      fillRect(doc, rX, rY, rW, rowH, row.background);

    const iX = rX + ptMm(pad2.left || 0);
    const iY = rY + ptMm(pad2.top || 0);
    const iW = rW - ptMm(pad2.left || 0) - ptMm(pad2.right || 0);
    const iH = rowH - ptMm(pad2.top || 0) - ptMm(pad2.bottom || 0);
    const cols = row.cols || rowCols.length || 1;
    const colW = iW / cols;
    const midY = iY + iH / 2;

    for (let ci = 0; ci < cols; ci++) {
      const colX = iX + ci * colW;
      const colEls: any[] = rowCols[ci]?.elements || [];
      for (const el of colEls) {
        if (el.hidden) continue;
        const cfg = el.config || {};
        if (el.type === "LOGO") {
          const lw = ptMm(cfg.width ?? 0),
            lh = ptMm(cfg.height ?? 0);
          const ly = iY + (iH - lh) / 2;
          if (cfg.path && cfg.path !== "logo.png") {
            try {
              let fmt = "PNG";
              const dm = cfg.path.match(/^data:image\/([a-zA-Z]+)/);
              if (dm) {
                fmt = dm[1].toUpperCase();
                if (fmt === "JPG") fmt = "JPEG";
              }
              drawRotatedImage(
                doc,
                cfg.path,
                fmt,
                colX,
                ly,
                lw,
                lh,
                cfg.rotation ?? 0
              );
            } catch (_) {
              doc.setDrawColor(180, 180, 180);
              doc.rect(colX, ly, lw, lh, "S");
            }
          } else {
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(203, 213, 225);
            doc.rect(colX, ly, lw, lh, "FD");
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.text("LOGO", colX + lw / 2, ly + lh / 2, {
              align: "center",
              baseline: "middle",
            });
          }
        } else if (el.type === "SEPARATOR") {
          const wPct = (cfg.widthPct ?? 100) / 100;
          const sepW = colW * wPct;
          const aln = (cfg.align || "LEFT").toUpperCase();
          const sx =
            aln === "RIGHT"
              ? colX + colW - sepW
              : aln === "CENTER"
              ? colX + (colW - sepW) / 2
              : colX;
          drawHLine(
            doc,
            sx,
            midY,
            sepW,
            cfg.height ?? 0,
            cfg.color,
            el.opacity ?? 1
          );
        } else {
          const fsPt = cfg.fontSize ?? 0;
          doc.setFontSize(fsPt);
          doc.setTextColor(
            ...hexRgb(cfg.fontColor || zone.fontColor || "#333333")
          );
          setFont(doc, cfg.font || "HELVETICA", !!cfg.bold, !!cfg.italic);
          const txt =
            el.type === "TEXT"
              ? cfg.text || ""
              : el.type === "DATE_TIME"
              ? (cfg.text || "") + fmtDate(cfg.format || "yyyy-MM-dd")
              : el.type === "PAGE_NUMBER"
              ? `Page ${pageNum} of ${totalPages}`
              : "";
          const aln = (cfg.align || "LEFT").toLowerCase();
          let tx = colX;
          const tOpts: any = { baseline: "middle" };
          if (aln === "center") {
            tx = colX + colW / 2;
            tOpts.align = "center";
          } else if (aln === "right") {
            tx = colX + colW;
            tOpts.align = "right";
          } else tOpts.align = "left";
          doc.text(sanitizeForPdf(txt), tx, midY, tOpts);
        }
      }
    }
    curY = rY + rowH + ptMm(mg.bottom || 0);
  };

  // Build a unified render sequence respecting element order.
  // Each item is either { kind:"row", row } or { kind:"el", el }.
  // Row position = index of its first element in zone.elements.
  // Direct elements (no rowId) keep their natural index.
  if (hasZoneRows) {
    const els: any[] = zone.elements || [];
    // Render order: direct flow elements first (in zone.elements order),
    // then rows (in zone.rows order). This matches how onReorder saves
    // elements: [...directEls, ...rowEls], and how the panel UI works.
    type RenderItem = { kind: "row"; row: any } | { kind: "el"; el: any };
    const sequence: RenderItem[] = [];
    // 1. Direct flow elements (no rowId), in their stored order
    for (const el of els) {
      if (el.hidden || el.rowId) continue;
      sequence.push({ kind: "el", el });
    }
    // 2. Rows in zone.rows order
    for (const row of zone.rows || []) {
      sequence.push({ kind: "row", row });
    }

    // Render in order
    const renderFlowEl = (el: any) => {
      const cfg = el.config || {};
      if (el.type === "LOGO") {
        // Absolute-positioned logo — skip during measurement pass
        if (zy > -9000) {
          const lx = zx + padL + ptMm(cfg.x ?? 0);
          const ly = zy + padT + ptMm(cfg.y ?? 0);
          const lw = ptMm(cfg.width ?? 0),
            lh = ptMm(cfg.height ?? 0);
          if (cfg.path && cfg.path !== "logo.png") {
            try {
              const path = cfg.path as string;
              let fmt = "PNG";
              const dm = path.match(/^data:image\/([a-zA-Z]+)/);
              if (dm) {
                fmt = dm[1].toUpperCase();
                if (fmt === "JPG") fmt = "JPEG";
              } else {
                const em = path.match(/\.([a-zA-Z]+)(?:[?#]|$)/);
                if (em) {
                  fmt = em[1].toUpperCase();
                  if (fmt === "JPG") fmt = "JPEG";
                }
              }
              drawRotatedImage(
                doc,
                path,
                fmt,
                lx,
                ly,
                lw,
                lh,
                cfg.rotation ?? 0
              );
            } catch (_) {
              doc.setDrawColor(180, 180, 180);
              doc.rect(lx, ly, lw, lh, "S");
              doc.setFontSize(6);
              doc.setTextColor(150, 150, 150);
              doc.text("LOGO", lx + lw / 2, ly + lh / 2, {
                align: "center",
                baseline: "middle",
              });
            }
          } else {
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(203, 213, 225);
            doc.rect(lx, ly, lw, lh, "FD");
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.text("LOGO", lx + lw / 2, ly + lh / 2, {
              align: "center",
              baseline: "middle",
            });
          }
        } // end zy > -9000
      } else if (cfg.flexmove) {
        // Free-positioned element — full feature render (rotation, box border, padding, opacity)
        // Skip during measurement pass (zy === -9999) since raw PDF operators bypass jsPDF clipping
        if (zy > -9000) {
          const fx = zx + padL + ptMm(cfg.x ?? 0);
          const fy = zy + padT + ptMm(cfg.y ?? 0);
          drawFlexmoveElement(doc, el, zone, fx, fy, pageNum, totalPages);
        }
      } else {
        // Sequential flow element — advances curY
        const mt = ptMm(cfg.margin?.top ?? 0),
          mb = ptMm(cfg.margin?.bottom ?? 0);
        const ml = ptMm(cfg.margin?.left ?? 0),
          mr = ptMm(cfg.margin?.right ?? 0);
        const ex = cx + ml,
          ew2 = cw - ml - mr;
        curY += mt;
        if (el.type === "SEPARATOR") {
          const sh = ptMm(cfg.height ?? 0);
          drawHLine(
            doc,
            ex,
            curY + sh / 2,
            ew2,
            cfg.height ?? 0,
            cfg.color,
            el.opacity ?? 1
          );
          curY += sh + mb;
        } else {
          const fsPt = cfg.fontSize ?? 0;
          const aln = (cfg.align || "LEFT").toLowerCase();
          doc.setFontSize(fsPt);
          doc.setTextColor(
            ...hexRgb(cfg.fontColor || zone.fontColor || "#333333")
          );
          setFont(doc, cfg.font || "HELVETICA", !!cfg.bold, !!cfg.italic);
          const txt =
            el.type === "TEXT"
              ? cfg.text || ""
              : el.type === "DATE_TIME"
              ? (cfg.text || "") + fmtDate(cfg.format || "yyyy-MM-dd")
              : el.type === "PAGE_NUMBER"
              ? `Page ${pageNum} of ${totalPages}`
              : "";
          let tx = ex;
          const tOpts: any = { baseline: "top" };
          if (aln === "center") {
            tx = ex + ew2 / 2;
            tOpts.align = "center";
          } else if (aln === "right") {
            tx = ex + ew2;
            tOpts.align = "right";
          } else tOpts.align = "left";
          doc.text(sanitizeForPdf(txt), tx, curY, tOpts);
          curY += thMm(fsPt) + mb;
        }
      }
    };

    for (const item of sequence) {
      if (item.kind === "row") {
        const row = (item as any).row;
        const ptPerCol = 280 / row.cols;
        const colEls: any[] = Array.from({ length: row.cols }, (_, ci) => ({
          elements: (zone.elements || []).filter((el: any) => {
            if (el.rowId !== row._id || el.hidden) return false;
            const x = el.config?.x || 0;
            return x >= ci * ptPerCol && x < (ci + 1) * ptPerCol;
          }),
        }));
        renderRowEl(row, colEls);
      } else {
        renderFlowEl(item.el);
      }
    }
  } else {
    // No rows — original single-pass render
    for (const el of allEls) {
      if (el.hidden) continue;
      if (el.rowId) continue; // belongs to a row — rendered below

      if (el.type === "ROW") {
        // Serialized ROW element (from JSON export)
        renderRowEl(el.config, el.columns || []);
      } else if (el.type === "LOGO") {
        if (zy > -9000) {
          const cfg = el.config || {};
          const lx = zx + padL + ptMm(cfg.x ?? 0);
          const ly = zy + padT + ptMm(cfg.y ?? 0);
          const lw = ptMm(cfg.width ?? 0),
            lh = ptMm(cfg.height ?? 0);
          if (cfg.path && cfg.path !== "logo.png") {
            try {
              const path = cfg.path as string;
              let fmt = "PNG";
              const dm = path.match(/^data:image\/([a-zA-Z]+)/);
              if (dm) {
                fmt = dm[1].toUpperCase();
                if (fmt === "JPG") fmt = "JPEG";
              } else {
                const em = path.match(/\.([a-zA-Z]+)(?:[?#]|$)/);
                if (em) {
                  fmt = em[1].toUpperCase();
                  if (fmt === "JPG") fmt = "JPEG";
                }
              }
              drawRotatedImage(
                doc,
                path,
                fmt,
                lx,
                ly,
                lw,
                lh,
                cfg.rotation ?? 0
              );
            } catch (_) {
              doc.setDrawColor(180, 180, 180);
              doc.rect(lx, ly, lw, lh, "S");
              doc.setFontSize(6);
              doc.setTextColor(150, 150, 150);
              doc.text("LOGO", lx + lw / 2, ly + lh / 2, {
                align: "center",
                baseline: "middle",
              });
            }
          } else {
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(203, 213, 225);
            doc.rect(lx, ly, lw, lh, "FD");
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.text("LOGO", lx + lw / 2, ly + lh / 2, {
              align: "center",
              baseline: "middle",
            });
          }
        } // end zy > -9000
      } else if (el.config?.flexmove) {
        // Free-positioned element — full feature render (rotation, box border, padding, opacity)
        // Skip during measurement pass (zy === -9999) since raw PDF operators bypass jsPDF clipping
        if (zy > -9000) {
          const cfg = el.config || {};
          const fx = zx + padL + ptMm(cfg.x ?? 0);
          const fy = zy + padT + ptMm(cfg.y ?? 0);
          drawFlexmoveElement(doc, el, zone, fx, fy, pageNum, totalPages);
        }
      } else {
        // Normal flow element (TEXT, DATE_TIME, PAGE_NUMBER, SEPARATOR)
        const cfg = el.config || {};
        const mt = ptMm(cfg.margin?.top ?? 0),
          mb = ptMm(cfg.margin?.bottom ?? 0);
        const ml = ptMm(cfg.margin?.left ?? 0),
          mr = ptMm(cfg.margin?.right ?? 0);
        const ex = cx + ml,
          ew = cw - ml - mr;
        curY += mt;
        if (el.type === "SEPARATOR") {
          const sh = ptMm(cfg.height ?? 0);
          drawHLine(
            doc,
            ex,
            curY + sh / 2,
            ew,
            cfg.height ?? 0,
            cfg.color,
            el.opacity ?? 1
          );
          curY += sh + mb;
        } else {
          const fsPt = cfg.fontSize ?? 0;
          const aln = (cfg.align || "LEFT").toLowerCase();
          doc.setFontSize(fsPt);
          doc.setTextColor(
            ...hexRgb(cfg.fontColor || zone.fontColor || "#333333")
          );
          setFont(doc, cfg.font || "HELVETICA", !!cfg.bold, !!cfg.italic);
          const txt =
            el.type === "TEXT"
              ? cfg.text || ""
              : el.type === "DATE_TIME"
              ? (cfg.text || "") + fmtDate(cfg.format || "yyyy-MM-dd")
              : el.type === "PAGE_NUMBER"
              ? `Page ${pageNum} of ${totalPages}`
              : "";
          let tx = ex;
          const tOpts: any = { baseline: "top" };
          if (aln === "center") {
            tx = ex + ew / 2;
            tOpts.align = "center";
          } else if (aln === "right") {
            tx = ex + ew;
            tOpts.align = "right";
          } else tOpts.align = "left";
          doc.text(sanitizeForPdf(txt), tx, curY, tOpts);
          curY += thMm(fsPt) + mb;
        }
      }
    }
  } // end else (no rows)

  return zoneH;
}
