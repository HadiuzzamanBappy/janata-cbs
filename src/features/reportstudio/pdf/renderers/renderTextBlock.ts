/**
 * renderTextBlock -- rich-text paragraph renderer for PDF.
 *
 * Extracted from PdfPreviewModal. Handles:
 *   - Plain paragraphs (with run-level variable substitution)
 *   - Inline tables (isTable + tableData paragraphs)
 *   - Justify / center / right / left alignment
 *   - Page-break support via pageCtx
 */

import {
  hexRgb,
  ptMm,
  sanitizeForPdf,
  fillRect,
} from "@/features/reportstudio/pdf/helpers";
import { setFont } from "@/features/reportstudio/pdf/helpers";
import { LH } from "@/features/reportstudio/pdf/text/textEngine";
import { resolveVariablesToRuns } from "@/features/reportstudio/data/resolveVariablesToRuns";
import type { AppState } from "@/features/reportstudio/types/app-state";
import type {
  ParagraphRun,
  VariableRun,
  VarStyle,
} from "@/features/reportstudio/types/text-block";

/**
 * Page-break context passed by the body renderer.
 */
export interface PageCtx {
  ensureSpace: (curY: number, needed: number) => number;
  bodyBottom: number;
}

/** PT_TO_MM constant used for width computations in this module. */
const PT_TO_MM = 25.4 / 72;

/**
 * Render a TEXT_BLOCK body component onto the PDF document.
 *
 * @param doc          - Live jsPDF instance
 * @param comp         - TEXT_BLOCK body component object
 * @param x            - Left edge X in mm
 * @param y            - Top edge Y in mm
 * @param w            - Available width in mm
 * @param reportState  - Full AppState (needed for datasource lookups and variables)
 * @param deltaToParas - deltaToParas function from @data/deltaToParas
 * @param rowOverride  - Optional current data row (for repeat mode)
 * @param pageCtx      - Optional page-break context
 * @returns            The new curY after the last rendered paragraph (including padB)
 */
export function renderTextBlock(
  doc: any,
  comp: any,
  x: number,
  y: number,
  w: number,
  reportState: AppState,
  deltaToParas: (delta: any) => any[],
  rowOverride?: Record<string, any> | null,
  pageCtx?: PageCtx,
): number {
  const padT = comp.textPadding?.top ?? 4,
    padB = comp.textPadding?.bottom ?? 4;
  const padL = comp.textPadding?.left ?? 0,
    padR = comp.textPadding?.right ?? 0;
  const innerW = w - padL - padR;
  let curY = y + padT;
  if (comp.textBg && comp.textBg !== "transparent")
    fillRect(doc, x, y, w, comp.height ?? 20, comp.textBg);

  // rowOverride lets the repeat-renderer inject a specific data row
  const dsRows = reportState.componentDataSources?.[comp._id];
  const dsFirstRow: Record<string, any> | null =
    rowOverride !== undefined ? rowOverride : (dsRows?.[0] ?? null);
  const reportVars = reportState.reportVariables;

  // Build rowOverrideMap: for each variable's dataSourceRef, if rowOverride covers it,
  // use rowOverride instead of rows[0]. This makes repeat mode render the correct row
  // for ALL variables, not just the component's own datasource.
  const rowOverrideMap: Record<string, Record<string, any>> = {};
  if (rowOverride && comp.repeatDataSourceRef) {
    // The repeat datasource ref is the one whose rows we're iterating --
    // inject rowOverride for that ref so variables bound to it use the current row
    rowOverrideMap[comp.repeatDataSourceRef] = rowOverride;
  }

  // Always re-derive from quillDelta so tables (isTable:true) are fresh
  const paragraphs: any[] = comp.quillDelta?.ops
    ? (deltaToParas(comp.quillDelta) as any[])
    : comp.paragraphs || [];

  for (const p of paragraphs) {
    // -- Table paragraph -------------------------------------------------------
    if ((p as any).isTable && (p as any).tableData) {
      const staticTableData: string[][] = (p as any).tableData;
      if (staticTableData.length === 0) continue;

      // Find which table index this is (count isTable paragraphs before this one)
      const tableIdx = paragraphs
        .slice(0, paragraphs.indexOf(p))
        .filter((q: any) => q.isTable).length;
      const binding = (comp.tableBindings || {})[tableIdx];

      // Read visual style -- from tableBindings.style (set via Apply button, reliable)
      // Falls back to tableStyle in Delta op (legacy) then to defaults
      let ts = {
        borderColor: "#94a3b8",
        borderWidth: "1.5",
        borderStyle: "solid",
        headerBg: "#f1f5f9",
        headerColor: "#1e293b",
        headerBold: true,
        cellBg: "#ffffff",
        cellColor: "#374151",
        altRowBg: "",
        cellPadding: "6px 9px",
        fontSize: "12",
        tableDsRef: "",
      };
      try {
        if (binding?.style) ts = { ...ts, ...binding.style };
        else if ((p as any).tableStyle)
          ts = { ...ts, ...(p as any).tableStyle };
      } catch (_) {}

      // Build final tableData using index-based colMap with name-match fallback
      let tableData: string[][] = staticTableData;
      if (binding?.dsRef && binding?.arrayField) {
        let parentRows: any[] = [];
        if (binding.dsRef.startsWith("comp:")) {
          parentRows =
            reportState.componentDataSources?.[binding.dsRef.slice(5)] || [];
        } else if (binding.dsRef.startsWith("central:")) {
          parentRows = reportState.centralData?.[binding.dsRef.slice(8)] || [];
        }
        // In repeat mode, rowOverride IS the current parent row -- use it directly
        const firstParentRow =
          rowOverride !== undefined && rowOverride !== null
            ? rowOverride
            : (parentRows[0] ?? null);
        const childRows: any[] = Array.isArray(
          firstParentRow?.[binding.arrayField],
        )
          ? firstParentRow[binding.arrayField]
          : [];

        if (childRows.length > 0) {
          const headerRow = staticTableData[0] || [];
          const colMapArr: string[] = Array.isArray(binding.colMap)
            ? binding.colMap
            : [];
          const childCols = Object.keys(childRows[0]);
          const numCols = headerRow.length;

          // Resolve field for each column:
          // 1. Use colMap[ci] if set
          // 2. Try name-match between header text and child field names
          // 3. Fall back to positional match
          const resolveField = (ci: number): string => {
            if (colMapArr[ci]) return colMapArr[ci];
            const header = (headerRow[ci] || "")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            const byName = childCols.find(
              (c) => c.toLowerCase().replace(/[^a-z0-9]/g, "") === header,
            );
            if (byName) return byName;
            return childCols[ci] || "";
          };

          const dataRows: string[][] = childRows.map((row) =>
            Array.from({ length: numCols }, (_, ci) => {
              const field = resolveField(ci);
              if (!field) return "";
              const val = row[field];
              return val !== undefined && val !== null ? String(val) : "";
            }),
          );
          tableData = [headerRow, ...dataRows];
        }
      }
      const fsPt = parseFloat(ts.fontSize) || 9;
      const bw = Math.max(0.1, parseFloat(ts.borderWidth) || 1.5) * 0.35; // px to mm approx
      const numCols = Math.max(...tableData.map((r) => r.length), 1);
      const colW = innerW / numCols;
      const cellPH = 2.0; // horizontal padding mm
      const cellPV = 1.5; // vertical padding mm
      const minRowH = ptMm(fsPt) + cellPV * 2;

      for (let ri = 0; ri < tableData.length; ri++) {
        const row = tableData[ri];
        const isHeader = ri === 0;
        const isAlt = !isHeader && !!ts.altRowBg && ri % 2 === 1;
        const rowBg = isHeader ? ts.headerBg : isAlt ? ts.altRowBg : ts.cellBg;
        const rowFg = isHeader ? ts.headerColor : ts.cellColor;
        const rowBold = isHeader && ts.headerBold;

        // Calculate row height for text wrapping
        let rowH = minRowH;
        setFont(doc, "HELVETICA", rowBold, false);
        doc.setFontSize(fsPt);
        for (let ci = 0; ci < numCols; ci++) {
          const raw = resolveVariablesToRuns(
            row[ci] ?? "",
            reportVars,
            dsFirstRow,
            reportState.componentDataSources,
            reportState.centralData,
            rowOverrideMap,
          )
            .map((r) => r.text)
            .join("");
          const lns = doc.splitTextToSize(
            sanitizeForPdf(raw) || " ",
            colW - cellPH * 2,
          );
          const cellH = lns.length * ptMm(fsPt) * 1.35 + cellPV * 2;
          if (cellH > rowH) rowH = cellH;
        }

        curY = pageCtx ? pageCtx.ensureSpace(curY, rowH) : curY;

        let cx = x + padL;
        for (let ci = 0; ci < numCols; ci++) {
          // Cell background
          if (rowBg && rowBg !== "transparent" && rowBg !== "#ffffff") {
            fillRect(doc, cx, curY, colW, rowH, rowBg);
          }
          // Cell border
          doc.setDrawColor(...hexRgb(ts.borderColor));
          doc.setLineWidth(bw);
          doc.rect(cx, curY, colW, rowH);

          // Cell text
          const raw = resolveVariablesToRuns(
            row[ci] ?? "",
            reportVars,
            dsFirstRow,
            reportState.componentDataSources,
            reportState.centralData,
            rowOverrideMap,
          )
            .map((r) => r.text)
            .join("");
          setFont(doc, "HELVETICA", rowBold, false);
          doc.setFontSize(fsPt);
          doc.setTextColor(...hexRgb(rowFg || "#374151"));
          const wrapped = doc.splitTextToSize(
            sanitizeForPdf(raw) || " ",
            colW - cellPH * 2,
          );
          let ty = curY + cellPV;
          for (const ln of wrapped) {
            doc.text(ln, cx + cellPH, ty, { baseline: "top" });
            ty += ptMm(fsPt) * 1.35;
          }
          cx += colW;
        }
        curY += rowH;
      }
      curY += p.spacingAfter || 6;
      continue;
    }

    const paraFsPt = p.fontSize || 13; // match Quill 13px default
    const paraFont = p.font || "HELVETICA";
    const paraBold = !!p.bold;
    const paraItal = !!p.italic;
    const paraColor = p.fontColor || "#374151";
    const aln = (p.align || "LEFT").toLowerCase();
    const lh = ptMm(paraFsPt) * LH;

    // Split paragraph text into plain + variable runs.
    //
    // When the paragraph carries `inlineRuns` (populated by deltaToParas from
    // Quill Delta ops), we expand each inline run through resolveVariablesToRuns
    // so that:
    //   - per-run font sizes / bold / colour from the Quill editor are preserved
    //   - variable tokens inside each run are still substituted correctly
    //
    // The variable-token varStyle always wins over the inline-run style, matching
    // the right-panel "style overrides" priority.
    const runs: VariableRun[] = (() => {
      const iruns: ParagraphRun[] | undefined = (p as any).inlineRuns;
      if (iruns && iruns.length > 0) {
        return iruns.flatMap((ir: ParagraphRun): VariableRun[] => {
          const subRuns = resolveVariablesToRuns(
            ir.text,
            reportVars,
            dsFirstRow,
            reportState.componentDataSources,
            reportState.centralData,
            rowOverrideMap,
          );
          return subRuns.map((vr: VariableRun): VariableRun => {
            // Inline run style is the baseline; varStyle overrides it.
            const merged: VarStyle = {
              fontSize: ir.fontSize ?? undefined,
              bold: ir.bold ?? undefined,
              italic: ir.italic ?? undefined,
              underline: ir.underline ?? undefined,
              color: ir.color ?? undefined,
              ...(vr.varStyle ?? {}),
            };
            const hasOverride =
              (merged.fontSize != null && merged.fontSize !== paraFsPt) ||
              (merged.bold != null && merged.bold !== paraBold) ||
              (merged.italic != null && merged.italic !== paraItal) ||
              merged.underline != null ||
              (merged.color != null && merged.color !== paraColor) ||
              merged.background != null;
            return {
              text: vr.text,
              varStyle: hasOverride ? merged : vr.varStyle,
            };
          });
        });
      }
      // Legacy path: no inlineRuns -- resolve variables on the full paragraph text.
      return resolveVariablesToRuns(
        p.text || "",
        reportVars,
        dsFirstRow,
        reportState.componentDataSources,
        reportState.centralData,
        rowOverrideMap,
      );
    })();

    const fullText = runs.map((r) => r.text).join("");

    // Empty paragraph (user pressed Enter -> blank line)
    // Advance same lh as a text line -- matches Quill editor exactly
    if (!fullText.trim()) {
      curY += lh;
      continue;
    }

    // Use bold font for splitTextToSize if paragraph is bold (more accurate wrap)
    setFont(doc, paraFont, paraBold, paraItal);
    doc.setFontSize(paraFsPt);
    const lines: string[] = doc.splitTextToSize(
      sanitizeForPdf(fullText),
      innerW,
    );

    // For each line, render using runs with x-cursor
    let runIdx = 0;
    let runOffset = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const isLastLine = lineIdx === lines.length - 1;

      // For justify: manual word-space distribution clamped within innerW
      const isJustify =
        (aln === "justify" || aln === "justified") && !isLastLine;

      if (isJustify) {
        setFont(doc, paraFont, paraBold, paraItal);
        doc.setFontSize(paraFsPt);
        doc.setTextColor(...hexRgb(paraColor));

        // Split line into words (no empty strings)
        const words = line.trimEnd().split(/\s+/).filter(Boolean);
        if (words.length <= 1) {
          // Single word or empty -- just left-align
          if (words[0]) doc.text(words[0], x + padL, curY, { baseline: "top" });
        } else {
          // Measure each word width
          const wordWidths = words.map(
            (w) =>
              doc.getStringUnitWidth(sanitizeForPdf(w)) * paraFsPt * PT_TO_MM,
          );
          const totalWordW = wordWidths.reduce((a, b) => a + b, 0);
          const gap = Math.max(0, (innerW - totalWordW) / (words.length - 1));
          let wx = x + padL;
          for (let wi = 0; wi < words.length; wi++) {
            doc.text(sanitizeForPdf(words[wi]), wx, curY, { baseline: "top" });
            wx += wordWidths[wi] + (wi < words.length - 1 ? gap : 0);
          }
        }

        // Advance run pointers past this line
        let lineCharsLeft = line.length;
        while (lineCharsLeft > 0 && runIdx < runs.length) {
          const take = Math.min(
            lineCharsLeft,
            runs[runIdx].text.length - runOffset,
          );
          runOffset += take;
          lineCharsLeft -= take;
          if (runOffset >= runs[runIdx].text.length) {
            runIdx++;
            runOffset = 0;
          }
        }
        if (
          runIdx < runs.length &&
          runOffset < runs[runIdx].text.length &&
          runs[runIdx].text[runOffset] === " "
        )
          runOffset++;
      } else {
        // Non-justify: render run by run with alignment
        setFont(doc, paraFont, paraBold, paraItal);
        doc.setFontSize(paraFsPt);
        const lineW = doc.getStringUnitWidth(line) * paraFsPt * PT_TO_MM;
        let curX = x + padL;
        if (aln === "center") curX = x + padL + (innerW - lineW) / 2;
        else if (aln === "right") curX = x + padL + innerW - lineW;

        let lineCharsLeft = line.length;
        // Non-justify: render run by run
        while (lineCharsLeft > 0 && runIdx < runs.length) {
          const run = runs[runIdx];
          const take = Math.min(lineCharsLeft, run.text.length - runOffset);
          const chunk = run.text.substr(runOffset, take);
          const sanitized = sanitizeForPdf(chunk);
          if (sanitized) {
            const vs = run.varStyle;
            const fsPt = vs?.fontSize ?? paraFsPt;
            const bold = vs?.bold ?? paraBold;
            const ital = vs?.italic ?? paraItal;
            const color = vs?.color ?? paraColor;
            setFont(doc, paraFont, bold, ital);
            doc.setFontSize(fsPt);
            doc.setTextColor(...hexRgb(color));
            if (vs?.background && vs.background !== "transparent") {
              const cw = doc.getStringUnitWidth(sanitized) * fsPt * PT_TO_MM;
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
            if (vs?.underline ?? p.underline) {
              const uw = doc.getStringUnitWidth(sanitized) * fsPt * PT_TO_MM;
              doc.setDrawColor(...hexRgb(color));
              doc.setLineWidth(Math.max(0.2, ptMm(fsPt) * 0.07));
              doc.line(
                curX,
                curY + ptMm(fsPt) * 0.92,
                curX + uw,
                curY + ptMm(fsPt) * 0.92,
              );
            }
            curX += doc.getStringUnitWidth(sanitized) * fsPt * PT_TO_MM;
          }
          runOffset += take;
          lineCharsLeft -= take;
          if (runOffset >= run.text.length) {
            runIdx++;
            runOffset = 0;
          }
        }
        // Skip trailing space between lines
        if (
          runIdx < runs.length &&
          runOffset < runs[runIdx].text.length &&
          runs[runIdx].text[runOffset] === " "
        )
          runOffset++;
      }

      curY += lh;
    }
    curY += p.spacingAfter || 0;
  }
  return curY + padB;
}
