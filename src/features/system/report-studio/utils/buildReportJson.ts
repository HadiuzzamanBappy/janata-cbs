import type { AppState } from "../types/app-state";
import type { Zone, ZoneRow, ZoneElement } from "../types/zone";
import type { BodyComponent } from "../types/body";
import type { Column } from "../types/table";
import { deepClone } from "./deepClone";
import { uid as generateId } from "./id";
import { mmToPt, MM_TO_PT } from "./units";
import { resolveCompData } from "../data/resolveCompData";
import { resolveVariables } from "../data/resolveVariables";
import { headerToDataKey } from "./string";
import { PREVIEW_DATA_ROWS } from "../constants/preview-data";

const PAGE_SIZE_PT: Record<string, [number, number]> = {
  A4: [595, 842],
  A3: [842, 1191],
  LETTER: [612, 792],
  LEGAL: [612, 1008],
};

/**
 * Builds a complete report JSON structure from application state.
 * Includes page setup, header/footer zones, and body components.
 * Used for JSON export and PDF generation.
 *
 * @param appState - Complete application state
 * @returns Report JSON object ready for export or PDF generation
 *
 * @example
 * const json = buildReportJson(currentState);
 * // Returns: { page: {...}, header: {...}, footer: {...}, bodyRows: [...], ... }
 */
export function buildReportJson(appState: AppState) {

  const landscape = appState.page.orientation === "landscape";
  const [baseW, baseH] = PAGE_SIZE_PT[appState.page.size] || PAGE_SIZE_PT.A4;
  const pageWpt = landscape ? baseH : baseW;
  const pageHpt = landscape ? baseW : baseH;

  // Page margin is already in pt (canvas renders margin*canvasZoom px directly)
  const mgT = appState.page.margin?.top ?? 20;
  const mgB = appState.page.margin?.bottom ?? 20;
  const mgL = appState.page.margin?.left ?? 30;
  const mgR = appState.page.margin?.right ?? 30;
  const contentWpt = pageWpt - mgL - mgR;

  // ── Zone element serialiser ──────────────────────────────────────
  // All zone values (fontSize, x, y, margin, padding, width, height) are in pt — pass through as-is.
  // For flexmove TEXT/DATE_TIME/PAGE_NUMBER elements we compute and attach an absolute
  // position block so iText can place them precisely using absolute positioning.
  function serializeElement(el: ZoneElement, z?: Zone) {
    const cfg: any = { ...el.config };
    delete cfg.fixedPosition;

    if (el.type === "LOGO") {
      cfg.x = cfg.x ?? 0;
      cfg.y = cfg.y ?? 0;
      cfg.rotation = cfg.rotation ?? 0;
      delete cfg.align;
    } else if (cfg.flexmove) {
      // Free-positioned text/datetime element:
      // x and y are already in pt (from top-left of zone content area).
      // Compute top/right/bottom/left for iText absolute positioning.
      if (z && (el.type === "TEXT" || el.type === "DATE_TIME" || el.type === "PAGE_NUMBER")) {
        const zPadL = z.padding?.left ?? 0;
        const zPadR = z.padding?.right ?? 0;
        const zPadT = z.padding?.top ?? 0;
        const zPadB = z.padding?.bottom ?? 0;
        const zoneH = z.height ?? z.minHeight ?? 60;           // pt
        const innerW = contentWpt - zPadL - zPadR;             // pt
        const innerH = zoneH - zPadT - zPadB;                  // pt

        const elX = cfg.x ?? 0;                             // pt from zone content left
        const elY = cfg.y ?? 0;                             // pt from zone content top
        const elW = cfg.width ?? Math.round(innerW * 0.4); // pt — default 40% of inner width
        const elH = cfg.height ?? Math.ceil((cfg.fontSize ?? 10) * 1.4); // pt — line height

        cfg.position = {
          top: Math.round(elY * 100) / 100,
          left: Math.round(elX * 100) / 100,
          right: Math.round((innerW - elX - elW) * 100) / 100,
          bottom: Math.round((innerH - elY - elH) * 100) / 100,
          width: Math.round(elW * 100) / 100,
          height: Math.round(elH * 100) / 100,
          // unit: pt — all coords relative to zone content area (after padding)
        };
        // x/y/width/height are now redundant — position block carries all placement info
        delete cfg.x; delete cfg.y; delete cfg.width; delete cfg.height;
      }
    } else {
      // Normal flow element — remove canvas-only position props
      delete cfg.x; delete cfg.y; delete cfg.rotation;
    }

    // cfg.fontSize, cfg.margin, cfg.padding all in pt ✓
    const out: any = { type: el.type, config: cfg };
    if (el.hidden) out.hidden = true;
    if (el.locked) out.locked = true;
    if (el.opacity !== undefined && el.opacity !== 1) out.opacity = el.opacity;
    if (el.zIndex !== undefined) out.zIndex = el.zIndex;
    return out;
  }

  // ── Zone serialiser ──────────────────────────────────────────────
  // Zone padding/margin/minHeight/height all in pt — pass through as-is
  function serializeZone(z: Zone) {
    const rows = (z as any).rows as ZoneRow[] | undefined;
    const colW = 280; // canvas width in pt

    // Build elements array in order: direct elements interspersed with ROW elements
    // Direct elements (no rowId)
    const directEls = z.elements.filter(el => !el.rowId).map(el => serializeElement(el, z));

    // ROW elements — each row becomes a single element of type "ROW"
    const rowEls = rows && rows.length > 0
      ? rows.map((row: ZoneRow) => {
        const ptPerCol = colW / row.cols;
        const columns = Array.from({ length: row.cols }).map((_, ci) => ({
          col: ci + 1,
          elements: z.elements
            .filter(el => {
              if (el.rowId !== row._id) return false;
              const x = el.config?.x || 0;
              return x >= ci * ptPerCol && x < (ci + 1) * ptPerCol;
            })
            .map(el => serializeElement(el, z)),
        }));
        return {
          type: "ROW",
          config: {
            cols: row.cols,
            ...(row.height ? { height: row.height } : {}),
            ...(row.background ? { background: row.background } : {}),
            ...(row.margin ? { margin: row.margin } : {}),
            ...(row.padding ? { padding: row.padding } : {}),
          },
          columns,
        };
      })
      : [];

    const out: any = {
      background: z.background,
      fontColor: z.fontColor,
      padding: z.padding,
      margin: z.margin,
      radius: z.radius,
      elements: [...directEls, ...rowEls],
    };
    if (z.minHeight !== undefined) out.minHeight = z.minHeight;
    if (z.height !== undefined) out.height = z.height;
    return out;
  }

  // ── Column serialiser ─────────────────────────────────────────────
  // col.width is a relative flex ratio — not a physical unit, pass through
  function serializeColumn(col: Column) {
    const out: any = {
      header: col.header,
      dataKey: col.dataKey || headerToDataKey(col.header),
      headerPreset: col.headerPreset ?? "header",
      align: col.align,
      width: col.width,  // flex ratio
    };
    if (col.dataPreset) out.dataPreset = col.dataPreset;
    if (col.format) out.format = col.format;
    if (col.decimals !== undefined) out.decimals = col.decimals;
    if (col.rounding && col.rounding !== "none") out.rounding = col.rounding;
    if (col.aggregate) out.aggregate = col.aggregate;
    if (col.conditions && col.conditions.length > 0) out.conditions = col.conditions;
    return out;
  }

  // ── Body component layout (mm → pt conversion) ────────────────────
  function compLayout(c: BodyComponent, out: any) {
    if (c.width !== undefined) out.width = mmToPt(c.width);    // mm → pt
    if (c.height !== undefined) out.height = mmToPt(c.height);   // mm → pt
    if (c.aspectLock) out.aspectLock = true;
    if (c.margin) out.margin = { top: mmToPt(c.margin.top), bottom: mmToPt(c.margin.bottom), left: mmToPt(c.margin.left), right: mmToPt(c.margin.right) };
    if (c.padding) out.padding = { top: mmToPt(c.padding.top), bottom: mmToPt(c.padding.bottom), left: mmToPt(c.padding.left), right: mmToPt(c.padding.right) };
    if (c.hidden) out.hidden = true;
    if (c.locked) out.locked = true;
  }

  // ── Body component serialiser ─────────────────────────────────────
  function serializeBodyComp(c: BodyComponent): any {

    if (c.type === "TABLE") {
      const ts = c.tableStyle ?? {
        borderWidth: 0.5, borderColor: "#e2e8f0", borderStyle: "solid",
        horizontalBorderOnly: false, verticalBorderOnly: false, headerBorder: true,
        headerColor: "#1e40af", dataBorder: true, consistentCellAlignment: false,
        cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      };
      const out: any = {
        type: "table",
        style: {
          borderWidth: ts.borderWidth,    // pt
          borderColor: ts.borderColor,
          borderStyle: ts.borderStyle,
          alternateBackground: c.tableOddRowBg ?? "#f8fafc",
          horizontalBorderOnly: ts.horizontalBorderOnly,
          verticalBorderOnly: ts.verticalBorderOnly,
          headerBorder: ts.headerBorder,
          headerColor: ts.headerColor,
          dataBorder: ts.dataBorder,
          consistentCellAlignment: ts.consistentCellAlignment,
          cellPadding: ts.cellPadding,    // pt
        },
        dataSource: {
          type: c.tableDataType ?? "list",
          data: c.tableDataRows ?? [],
          ...(c.tableDataType === "database" && c.tableDbQuery ? { query: c.tableDbQuery } : {}),
          ...(c.tableDataType === "api" && c.tableApiUrl ? {
            url: c.tableApiUrl,
            method: c.tableApiMethod ?? "GET",
            ...(c.tableApiBody ? { body: c.tableApiBody } : {}),
            ...(c.tableApiHeaders ? { headers: c.tableApiHeaders } : {}),
          } : {}),
        },
        columns: (c.tableColumns ?? []).map(serializeColumn),
      };
      compLayout(c, out);
      return out;
    }

    if (c.type === "CHART") {
      // Compute actual rendered width in pt
      const rows = appState.bodyRows ?? [];
      let widthPt: number;
      if (c.freePosition) {
        widthPt = mmToPt(c.freeWidth ?? c.width ?? 120);
      } else if (c.width !== undefined) {
        widthPt = mmToPt(c.width);
      } else {
        const row = rows.find(r => r._id === c.rowId);
        const cols = row?.cols ?? 1;
        const gapPt = mmToPt((row?.gap ?? 4) * (cols - 1));
        widthPt = c.flexBasis !== undefined
          ? Math.round(((contentWpt - gapPt) * c.flexBasis / 100) * 100) / 100
          : Math.round(((contentWpt - gapPt) / cols) * 100) / 100;
      }
      const heightPt = mmToPt(c.height ?? 60);

      // v5.2: Render chart to base64 for page export (actual config stays in _design)
      const chartBase64 = renderChartToBase64(c, widthPt, heightPt);

      const out: any = {
        type: "image",  // Export as image for PDF rendering
        path: chartBase64,  // Base64 PNG of rendered chart
        imgWidth: widthPt,
        imgHeight: heightPt,
        align: "center",
        rotation: 0,
        opacity: 1,
      };
      compLayout(c, out);
      // Override container dimensions so they always match the actual rendered
      // chart image size (imgWidth/imgHeight). compLayout may write a stale
      // comp.width/comp.height (e.g. when the chart is flex-sized inside a row
      // and comp.width is undefined or reflects a different slot width).
      // iText7 must draw the chart at exactly imgWidth × imgHeight — any mismatch
      // would stretch or squash the image relative to what the canvas shows.
      out.width  = widthPt;
      out.height = heightPt;
      return out;
    }

    if (c.type === "IMAGE") {
      const out: any = {
        type: "image",
        path: c.imagePath ?? "",  // Keep base64 or URL as-is
        imgWidth: mmToPt(c.imageWidth ?? 80),   // mm → pt
        imgHeight: mmToPt(c.imageHeight ?? 60),   // mm → pt
        align: (c.imageAlign ?? "CENTER").toLowerCase(),
        rotation: c.imageRotation ?? 0,
        opacity: c.imageOpacity ?? 1,
      };
      if (c.imageCaption) out.caption = {
        text: c.imageCaption,
        color: c.imageCaptionColor ?? "#64748b",
        size: c.imageCaptionSize ?? 8,  // pt
        align: c.imageCaptionAlign ?? "center",
      };
      if (c.imageBorder?.enabled) out.border = {
        color: c.imageBorder.color ?? "#cbd5e1",
        width: c.imageBorder.width ?? 1,   // pt
        style: c.imageBorder.style ?? "solid",
      };
      if (c.imageRadius) out.radius = c.imageRadius;  // pt
      compLayout(c, out);
      // Override container dimensions to match the actual image draw size
      // (imgWidth × imgHeight). The canvas renders the image at imageWidth ×
      // imageHeight (mm), while comp.width/comp.height is the row-slot container
      // which can differ. Using the container size for iText7 would stretch the
      // image to fill the slot rather than preserving the designed proportions.
      out.width  = out.imgWidth;
      out.height = out.imgHeight;
      return out;
    }

    if (c.type === "TEXT_BLOCK") {
      const tp = c.textPadding ?? { top: 4, bottom: 4, left: 0, right: 0 };
      // Resolve variables in paragraph text for the JSON export.
      // The first data row from this component's datasource is used (same priority
      // as the PDF renderer): componentDataSources[comp._id] → first row.
      const dsRows = appState.componentDataSources?.[c._id];
      const dsFirstRow: Record<string, any> | null = dsRows && dsRows.length > 0 ? dsRows[0] : null;
      const reportVars = appState.reportVariables;
      const out: any = {
        type: "textBlock",
        paragraphs: (c.paragraphs ?? []).map((p: any) => {
          const { _id, ...rest } = p;
          // Emit both raw (for round-trip) and resolved (for iText) text
          return {
            ...rest,
            text: resolveVariables(rest.text || "", reportVars, dsFirstRow, appState.componentDataSources, appState.centralData),
            rawText: rest.text,  // original with tokens — useful for re-editing
          };
        }),
        background: c.textBg ?? "transparent",
        innerPadding: { top: mmToPt(tp.top), bottom: mmToPt(tp.bottom), left: mmToPt(tp.left), right: mmToPt(tp.right) },
      };
      if (c.textBorderEnabled) out.border = {
        color: c.textBorderColor ?? "#e2e8f0",
        width: c.textBorderWidth ?? 1,   // pt
        style: c.textBorderStyle ?? "solid",
      };
      if (c.textRadius) out.radius = c.textRadius;  // pt
      compLayout(c, out);
      return out;
    }

    const out: any = { type: (c.type as string).toLowerCase() };
    compLayout(c, out);
    return out;
  }

  // Helper: Render chart to base64 PNG for export
  function renderChartToBase64(comp: BodyComponent, widthPt: number, heightPt: number): string {
    try {
      // Create offscreen canvas
      const canvas = document.createElement('canvas');
      const dpi = 2; // 2x for better quality
      canvas.width = widthPt * dpi;
      canvas.height = heightPt * dpi;
      const ctx = canvas.getContext('2d');
      if (!ctx) return "";

      // Scale for DPI
      ctx.scale(dpi, dpi);

      // Background
      ctx.fillStyle = comp.chartBg || "#ffffff";
      ctx.fillRect(0, 0, widthPt, heightPt);

      // Get data for this chart
      const data = resolveCompData(comp, appState.centralData, appState.componentDataSources, PREVIEW_DATA_ROWS);

      // Simple chart rendering (basic bar chart for now)
      const series = comp.chartSeries || [];
      const labelKey = comp.chartLabelKey || "label";
      const categories = data.map((row: any) => row[labelKey] || "");

      const margin = { top: 40, right: 20, bottom: 30, left: 50 };
      const chartW = widthPt - margin.left - margin.right;
      const chartH = heightPt - margin.top - margin.bottom;

      // Title
      if (comp.chartTitle) {
        ctx.fillStyle = comp.chartTitleColor || "#1e293b";
        ctx.font = `${comp.chartTitleBold ? 'bold ' : ''}${comp.chartTitleFontSize || 12}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(comp.chartTitle, widthPt / 2, 20);
      }

      // Find max value across all series
      let maxVal = 0;
      series.forEach((s: any) => {
        data.forEach((row: any) => {
          const val = Number(row[s.dataKey]) || 0;
          if (val > maxVal) maxVal = val;
        });
      });

      if (maxVal === 0) maxVal = 100; // Prevent division by zero

      // Draw bars
      const barGroupWidth = chartW / Math.max(categories.length, 1);
      const barWidth = Math.min(barGroupWidth / (series.length + 0.5), 40);

      data.forEach((row: any, i: number) => {
        const x = margin.left + i * barGroupWidth;
        series.forEach((s: any, si: number) => {
          const val = Number(row[s.dataKey]) || 0;
          const barH = (val / maxVal) * chartH;
          const barX = x + si * barWidth + barWidth * 0.25;
          const barY = margin.top + chartH - barH;

          ctx.fillStyle = s.color || "#2563eb";
          ctx.fillRect(barX, barY, barWidth * 0.9, barH);
        });

        // Category label
        ctx.fillStyle = "#374151";
        ctx.font = "9px Arial";
        ctx.textAlign = "center";
        ctx.fillText(String(categories[i] || ""), x + barGroupWidth / 2, heightPt - 10);
      });

      // Y-axis
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, margin.top + chartH);
      ctx.stroke();

      // X-axis
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top + chartH);
      ctx.lineTo(margin.left + chartW, margin.top + chartH);
      ctx.stroke();

      // Convert to base64
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error("Chart render error:", err);
      return "";
    }
  }

  // ── Build page.body ───────────────────────────────────────────────
  const rows = appState.bodyRows ?? [];
  const comps = appState.bodyComponents ?? [];
  const freeComps = comps.filter(c => c.freePosition);

  const bodyRows = rows.map(row => {
    const rowOut: any = {
      cols: row.cols,
      // row margin/padding stored in mm → convert to pt
      margin: { top: mmToPt(row.margin?.top ?? 0), bottom: mmToPt(row.margin?.bottom ?? 8), left: mmToPt(row.margin?.left ?? 0), right: mmToPt(row.margin?.right ?? 0) },
      padding: { top: mmToPt(row.padding?.top ?? 0), bottom: mmToPt(row.padding?.bottom ?? 0), left: mmToPt(row.padding?.left ?? 0), right: mmToPt(row.padding?.right ?? 0) },
    };
    if (row.height !== undefined) rowOut.height = mmToPt(row.height);   // mm → pt
    if (row.gap !== undefined) rowOut.gap = mmToPt(row.gap);      // mm → pt
    if (row.background) rowOut.background = row.background;
    if (row.hidden) rowOut.hidden = true;
    if (row.locked) rowOut.locked = true;

    rowOut.columns = Array.from({ length: row.cols }, (_, slot) => {
      const comp = comps.find(c => c.rowId === row._id && c.slotIndex === slot && !c.freePosition);
      if (!comp) return null;
      const serialized = serializeBodyComp(comp);
      if (comp.flexBasis !== undefined) serialized.flexBasis = comp.flexBasis;
      return serialized;
    });
    return rowOut;
  });

  const freeItems = freeComps.map(c => {
    const s = serializeBodyComp(c);
    s.freePosition = true;
    s.freeX = mmToPt(c.freeX ?? 0);   // mm → pt
    s.freeY = mmToPt(c.freeY ?? 0);   // mm → pt
    if (c.freeWidth !== undefined) s.freeWidth = mmToPt(c.freeWidth);
    return s;
  });

  const pageOut: any = {
    size: appState.page.size,
    orientation: appState.page.orientation,
    widthPt: pageWpt,
    heightPt: pageHpt,
    contentWidthPt: contentWpt,
    contentHeightPt: pageHpt - mgT - mgB,
    margin: { top: mgT, bottom: mgB, left: mgL, right: mgR },  // pt
    header: serializeZone(appState.page.header),
    body: bodyRows,
    footer: serializeZone(appState.page.footer),
  };
  if (freeItems.length > 0) pageOut.freeComponents = freeItems;

  // ── _design block: raw AppState in original units for round-trip import ──
  // Clone state but strip redundant data to avoid duplication
  const rawState = deepClone(appState);

  // Strip base64 logos from header/footer (stored in main page export only)
  const stripBase64Logos = (zone: Zone) => {
    zone.elements.forEach(el => {
      if (el.type === "LOGO" && el.config?.path && el.config.path.startsWith("data:image/")) {
        el.config.path = ""; // Clear base64, will restore from main page export on import
      }
    });
  };
  stripBase64Logos(rawState.page.header);
  stripBase64Logos(rawState.page.footer);

  // v5.2: Strip image base64 from body components (already in page export)
  rawState.bodyComponents.forEach((comp: BodyComponent) => {
    if (comp.type === "IMAGE" && comp.imagePath && comp.imagePath.startsWith("data:image/")) {
      comp.imagePath = ""; // Clear base64, will restore from page export on import
    }
    // Chart data stays in _design for editing, but rendered output goes to page export as image
  });

  return {
    _meta: {
      generator: "Report Studio",
      type: "design",
      version: "2.0",
      savedAt: new Date().toISOString(),
      units: "pt",
      ptPerMm: parseFloat(MM_TO_PT.toFixed(6)),
      pageSize: appState.page.size,
      orientation: appState.page.orientation,
      bodyRows: (appState.bodyRows ?? []).length,
      bodyComponents: (appState.bodyComponents ?? []).length,
      headerElements: appState.page.header.elements.length,
      footerElements: appState.page.footer.elements.length,
      note: "All iText measurements are in pt. _design block contains raw AppState (original mm units) for full round-trip restore. Base64 logo data stored only in main page export to avoid duplication.",
    },
    compressLevel: appState.compressLevel,
    memoryReduce: appState.memoryReduce,
    page: pageOut,
    // Raw AppState preserved for full design restore (original units, no conversion)
    _design: {
      page: rawState.page,
      bodyRows: rawState.bodyRows,
      bodyComponents: rawState.bodyComponents,
      componentDataSources: rawState.componentDataSources,  // v5.2: per-component data
      centralData: rawState.centralData,           // v5: central data store
      reportVariables: rawState.reportVariables,   // v6.4: variable → column mappings
    },
  };
}

/* buildDesignJson merged into buildReportJson — use buildReportJson() for both export and design save */

// Re-export generateId for callers that need it alongside buildReportJson
export { generateId };
