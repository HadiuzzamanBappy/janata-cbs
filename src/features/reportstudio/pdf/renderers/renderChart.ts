/**
 * renderChart — captures a live Chart.js canvas and embeds it in the PDF.
 *
 * This is the version of renderChartToBase64 that lives inside PdfPreviewModal
 * (not the standalone top-level one). It operates on an already-open jsPDF doc
 * and renders the chart directly at the target position.
 *
 * The function is NOT async — it reads from the live DOM synchronously via
 * canvas.toDataURL().
 */

import { fillRect, ptMm } from "@/features/reportstudio/pdf/helpers";

/**
 * Page-break context passed by the body renderer.
 */
export interface PageCtx {
  ensureSpace: (curY: number, needed: number) => number;
  bodyBottom: number;
}

/**
 * Render a CHART body component onto the PDF document.
 *
 * @param doc      - Live jsPDF instance
 * @param comp     - Chart body component object
 * @param iw       - Inner-content width in mm (after margins/padding stripped by renderComp)
 * @param ix       - Inner-content X in mm
 * @param iy       - Inner-content Y in mm
 * @param mT       - Component margin-top in mm (re-applied after page break)
 * @param pT       - Component padding-top in mm (re-applied after page break)
 * @param pB       - Component padding-bottom in mm
 * @param mB       - Component margin-bottom in mm
 * @param pageW    - Full page width in mm (used to derive mm-per-px scale)
 * @param pageSize - Page size key e.g. "A4"
 * @param orientation - "portrait" | "landscape"
 * @param PAGE_SIZES   - Record<string, [number, number]> of mm dimensions
 * @param pageCtx  - Optional page-break context
 * @returns        The new curY after rendering (including pB + mB)
 */
export function renderChart(
  doc: any,
  comp: any,
  iw: number,
  ix: number,
  iy: number,
  mT: number,
  pT: number,
  pB: number,
  mB: number,
  PAGE_SIZES: Record<string, [number, number]>,
  pageSize: string,
  orientation: string,
  pageCtx?: PageCtx,
): number {
  // Measure the chart's ACTUAL rendered size on the canvas preview so the PDF
  // matches exactly what the user sees, regardless of flex math / comp.width /
  // flexBasis / zoom level.
  const wrapper = document.querySelector(
    `[data-comp-id="${comp._id}"]`,
  ) as HTMLElement | null;
  const canvas = wrapper?.querySelector("canvas") as HTMLCanvasElement | null;

  // Default sizes (fallback if wrapper/canvas not in DOM) — stored in pt, convert to mm
  let cw = comp.width != null ? ptMm(comp.width) : iw;
  let ch = comp.height != null ? ptMm(comp.height) : ptMm(60);
  let chartX = ix + Math.max(0, (iw - cw) / 2);

  if (wrapper) {
    // Find the page-wrapper in the DOM to get the mm to px scale factor
    const pageEl = wrapper.closest("[data-page-root]") as HTMLElement | null;
    if (pageEl) {
      // Compute the current page's full width in mm so we can work out px-per-mm
      const [bw2, bh2] = PAGE_SIZES[pageSize || "A4"] || PAGE_SIZES.A4;
      const pageMmW = orientation === "landscape" ? bh2 : bw2;
      const pageRectW = pageEl.getBoundingClientRect().width;
      if (pageRectW > 0 && pageMmW > 0) {
        const pxPerMm = pageRectW / pageMmW;
        const wrapperRect = wrapper.getBoundingClientRect();
        const pageRect = pageEl.getBoundingClientRect();
        // Derive width/height in mm from the wrapper's rendered pixel size
        cw = wrapperRect.width / pxPerMm;
        ch = wrapperRect.height / pxPerMm;
        // X offset from page's left edge (in mm) matches the PDF's coord system
        chartX = (wrapperRect.left - pageRect.left) / pxPerMm;
      }
    }
  }

  // Page-break support: if the chart wouldn't fit on the current page, move
  // it to the next page before drawing. Preserve the comp's top padding on
  // the new page so spacing is consistent with what the user designed.
  // Reserve both the chart height AND the bottom padding so space is available
  // for whatever comes after the chart on the same page.
  let chartY = iy;
  if (pageCtx) {
    const newY = pageCtx.ensureSpace(iy, ch + pB);
    if (newY !== iy) {
      // `newY` is bodyTop of the new page. Re-apply comp.margin.top +
      // comp.padding.top so spacing is preserved on the new page.
      chartY = newY + mT + pT;
    }
  }

  if (canvas) {
    try {
      const chartInstance = (canvas as any).__chartInstance;

      // Strategy: render the chart at EXACTLY the pixel dimensions that map
      // to ~200 DPI in the PDF. This avoids the PDF viewer's jaggy nearest-
      // neighbor downscaling (which happens when the source PNG is much
      // larger than the displayed mm size, as with a flat 4x DPR boost).
      const targetDpi = 200;
      const pxPerMm2 = targetDpi / 25.4;
      const targetPxW = Math.round(cw * pxPerMm2);
      const targetPxH = Math.round(ch * pxPerMm2);

      const rect = canvas.getBoundingClientRect();
      const dprW = rect.width > 0 ? targetPxW / rect.width : 2;
      const dprH = rect.height > 0 ? targetPxH / rect.height : 2;
      const targetDpr = Math.max(dprW, dprH, 2); // at least 2x for retina

      const originalDpr = chartInstance?.options?.devicePixelRatio;
      if (chartInstance) {
        chartInstance.options.devicePixelRatio = targetDpr;
        chartInstance.resize();
        chartInstance.update("none");
      }

      // Paint the chart background FIRST — Chart.js canvases are transparent
      // by default, so without this the chartBg color is lost in the PDF.
      if (comp.chartBg && comp.chartBg !== "transparent") {
        fillRect(doc, chartX, chartY, cw, ch, comp.chartBg);
      }

      // Capture the canvas as a PNG and embed
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      doc.addImage(dataUrl, "PNG", chartX, chartY, cw, ch, undefined, "FAST");

      // Restore original DPR and re-render so the on-screen chart looks normal again
      if (chartInstance) {
        chartInstance.options.devicePixelRatio = originalDpr;
        chartInstance.resize();
        chartInstance.update("none");
      }
      return chartY + ch + pB + mB;
    } catch (err) {
      console.warn("Failed to capture chart canvas:", err);
    }
  }

  // Fallback placeholder — chart couldn't be captured
  if (comp.chartBg && comp.chartBg !== "#ffffff")
    fillRect(doc, chartX, chartY, cw, ch, comp.chartBg);
  doc.setDrawColor(200, 200, 200);
  doc.rect(chartX, chartY, cw, ch, "S");
  if (comp.chartTitle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(comp.chartTitle, chartX + cw / 2, chartY + 5, {
      align: "center",
      baseline: "top",
    });
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `[${(comp.chartType || "BAR").toUpperCase()} chart not captured]`,
    chartX + cw / 2,
    chartY + ch / 2,
    { align: "center", baseline: "middle" },
  );
  return chartY + ch + pB + mB;
}
