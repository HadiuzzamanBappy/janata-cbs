/**
 * PdfPreviewModal — React shell for the PDF generation and preview workflow.
 *
 * Responsibilities:
 *   - Load jsPDF from CDN
 *   - Call buildPdf() to generate the document
 *   - Render preview via <object> with fallback card
 *   - Expose Download button (re-runs buildPdf)
 *   - Show loading/error states
 *
 * All rendering logic lives in:
 *   @pdf/helpers          — pure PDF drawing utilities
 *   @pdf/renderers        — table, text-block, chart, band (zone) renderers
 */

import { useEffect, useRef, useState } from "react";
import {
  FileImage,
  RefreshCw,
  FileJson,
} from "@/features/system/report-studio/theme/icons";
import type { AppState } from "../types/app-state";
import { ptMm } from "@/features/system/report-studio/pdf/helpers";
import { fillRect } from "@/features/system/report-studio/pdf/helpers";
import { renderTable } from "@/features/system/report-studio/pdf/renderers/renderTable";
import { renderTextBlock } from "@/features/system/report-studio/pdf/renderers/renderTextBlock";
import { renderChart } from "@/features/system/report-studio/pdf/renderers/renderChart";
import {
  renderZone,
  shouldRenderZone,
} from "@/features/system/report-studio/pdf/renderers/renderBand";
import { resolveCompData } from "@/features/system/report-studio/data/resolveCompData";
import { deltaToParas } from "@/features/system/report-studio/data/deltaToParas";
import {
  PREVIEW_DATA_ROWS,
  COLUMN_DATA_KEY_MAP,
} from "@/features/system/report-studio/constants/preview-data";

export { COLUMN_DATA_KEY_MAP };

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
  LETTER: [216, 279],
  LEGAL: [216, 356],
};

export function PdfPreviewModal({
  reportState,
  onClose,
}: {
  reportState: AppState;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const jsPDFRef = useRef<any>(null);

  async function buildPdf(jsPDFClass: any): Promise<any> {
    const { page, bodyRows = [], bodyComponents = [] } = reportState;
    const { size = "A4", orientation = "portrait", margin } = page;
    const [bw, bh] = PAGE_SIZES[size] || PAGE_SIZES.A4;
    const pgW = orientation === "landscape" ? bh : bw;
    const pgH = orientation === "landscape" ? bw : bh;
    const mgT = ptMm(margin?.top ?? 20),
      mgB = ptMm(margin?.bottom ?? 20);
    const mgL = ptMm(margin?.left ?? 30),
      mgR = ptMm(margin?.right ?? 30);
    const contentW = pgW - mgL - mgR;

    const doc = new jsPDFClass({
      orientation: orientation === "landscape" ? "landscape" : "portrait",
      unit: "mm",
      format: [pgW, pgH],
    });

    const headerH = renderZone(doc, page.header, mgL, -9999, contentW, 1, 1);
    const footerActualH = renderZone(
      doc,
      page.footer,
      mgL,
      -9999,
      contentW,
      1,
      1
    );

    const bodyTopForPage = (pg: number, total: number) =>
      mgT + (shouldRenderZone(page.header, pg, total) ? headerH : 0);
    const footerYForPage = (pg: number, total: number) =>
      pgH -
      mgB -
      (shouldRenderZone(page.footer, pg, total) ? footerActualH : 0);
    const bodyBottomForPage = (pg: number, total: number) =>
      footerYForPage(pg, total) - 2;

    const LARGE = 9999;
    const bodyTop = bodyTopForPage(1, LARGE);
    const bodyBottom = bodyBottomForPage(1, LARGE);

    let curPage = 1;
    const pagesNeedingZones: number[] = [1];
    const pageBodyTop: Record<number, number> = { 1: bodyTop };
    const pageCtx = {
      bodyBottom,
      ensureSpace: (curY: number, needed: number): number => {
        const curBodyBottom = bodyBottomForPage(curPage, LARGE);
        if (curY + needed <= curBodyBottom) return curY;
        doc.addPage();
        curPage++;
        pagesNeedingZones.push(curPage);
        const newBodyTop = bodyTopForPage(curPage, LARGE);
        pageBodyTop[curPage] = newBodyTop;
        pageCtx.bodyBottom = bodyBottomForPage(curPage, LARGE);
        return newBodyTop;
      },
    };

    let curY = bodyTop;

    for (const row of bodyRows.filter((r: any) => !r.hidden)) {
      const rmt = ptMm(row.margin?.top ?? 0),
        rmb = ptMm(row.margin?.bottom ?? 8);
      const rml = ptMm(row.margin?.left ?? 0),
        rmr = ptMm(row.margin?.right ?? 0);
      const rpt = ptMm(row.padding?.top ?? 0),
        rpb = ptMm(row.padding?.bottom ?? 0);
      const rpl = ptMm(row.padding?.left ?? 0),
        rpr = ptMm(row.padding?.right ?? 0);
      const rowGap = ptMm(row.gap ?? 4);
      const rowHeightMm = row.height != null ? ptMm(row.height) : undefined;
      const rowX = mgL + rml + rpl,
        rowW = contentW - rml - rmr - rpl - rpr;
      curY += rmt + rpt;

      const minFirstChunk = Math.max(20, Math.min(rowHeightMm ?? 30, 60));
      const preY = curY;
      curY = pageCtx.ensureSpace(curY, minFirstChunk);
      if (curY !== preY) {
        curY += rmt + rpt;
      }

      if (row.background)
        fillRect(
          doc,
          mgL + rml,
          curY,
          contentW - rml - rmr,
          rowHeightMm ?? 30,
          row.background
        );

      const slotComps = Array.from({ length: row.cols }, (_, s) =>
        bodyComponents.find(
          (c: any) =>
            c.rowId === row._id && c.slotIndex === s && !c.freePosition
        )
      );
      const totalFlex = row.cols;
      const gapTotal = (row.cols - 1) * rowGap;
      const flexW = (rowW - gapTotal) / totalFlex;
      const colWidths = slotComps.map((c: any) =>
        c?.flexBasis != null ? (rowW * c.flexBasis) / 100 : flexW
      );

      let slotX = rowX,
        maxY = curY;
      for (let s = 0; s < row.cols; s++) {
        const comp = slotComps[s];
        const sw = colWidths[s] ?? flexW;
        if (comp) {
          if (
            comp.type === "TEXT_BLOCK" &&
            comp.repeatMode &&
            comp.repeatMode !== "none" &&
            comp.repeatDataSourceRef
          ) {
            let repeatRows: Record<string, any>[] = [];
            if (comp.repeatDataSourceRef.startsWith("comp:")) {
              repeatRows =
                reportState.componentDataSources?.[
                comp.repeatDataSourceRef.slice(5)
                ] || [];
            } else if (comp.repeatDataSourceRef.startsWith("central:")) {
              repeatRows =
                reportState.centralData?.[comp.repeatDataSourceRef.slice(8)] ||
                [];
            }

            const repeatGap = ptMm(comp.repeatGap ?? 4);
            const mT2 = ptMm(comp.margin?.top ?? 0),
              mB2 = ptMm(comp.margin?.bottom ?? 6);
            const pT2 = ptMm(comp.padding?.top ?? 0),
              pB2 = ptMm(comp.padding?.bottom ?? 0);
            const ix2 = slotX + ptMm(comp.margin?.left ?? 0) + pT2;
            const iw2 =
              sw -
              ptMm(comp.margin?.left ?? 0) -
              ptMm(comp.margin?.right ?? 0) -
              pT2 -
              ptMm(comp.padding?.right ?? 0);

            let repY = curY;
            for (let ri = 0; ri < repeatRows.length; ri++) {
              const dataRow = repeatRows[ri];

              if (comp.repeatMode === "new-page" && ri > 0) {
                repY = pageCtx.ensureSpace(repY + 9999, 20);
              } else if (comp.repeatMode === "inline" && ri > 0) {
                repY += repeatGap;
                repY = pageCtx.ensureSpace(repY, 20);
              }

              repY += mT2 + pT2;
              const endY = renderTextBlock(
                doc,
                comp,
                ix2,
                repY,
                iw2,
                reportState,
                deltaToParas,
                dataRow,
                pageCtx
              );
              repY = endY + pB2 + mB2;
            }
            if (repY > maxY) maxY = repY;
          } else {
            const cData = resolveCompData(
              comp,
              reportState.centralData,
              reportState.componentDataSources,
              PREVIEW_DATA_ROWS as any[]
            );
            const endY = renderComp(doc, comp, cData, slotX, curY, sw, pageCtx);
            if (endY > maxY) maxY = endY;
          }
        }
        slotX += sw + (s < row.cols - 1 ? rowGap : 0);
      }
      curY = maxY + rpb + rmb;
    }

    for (const comp of bodyComponents.filter(
      (c: any) => c.freePosition && !c.hidden
    )) {
      const fx = ptMm(comp.freeX ?? 0);
      const fy = ptMm(comp.freeY ?? 0);
      const fw = comp.freeWidth != null ? ptMm(comp.freeWidth) : contentW;
      renderComp(
        doc,
        comp,
        resolveCompData(
          comp,
          reportState.centralData,
          reportState.componentDataSources,
          PREVIEW_DATA_ROWS as any[]
        ),
        mgL + fx,
        pageBodyTop[1] + fy,
        fw
      );
    }

    const totalPages = curPage;
    for (const pg of pagesNeedingZones) {
      doc.setPage(pg);
      const pgFooterY = footerYForPage(pg, totalPages);
      if (shouldRenderZone(page.header, pg, totalPages))
        renderZone(doc, page.header, mgL, mgT, contentW, pg, totalPages);
      if (shouldRenderZone(page.footer, pg, totalPages))
        renderZone(doc, page.footer, mgL, pgFooterY, contentW, pg, totalPages);
    }

    return doc;
  }

  function renderComp(
    doc: any,
    comp: any,
    data: any[],
    x: number,
    y: number,
    w: number,
    pageCtx?: {
      ensureSpace: (curY: number, needed: number) => number;
      bodyBottom: number;
    }
  ): number {
    if (comp.hidden) return y;
    const mT = ptMm(comp.margin?.top ?? 0),
      mB = ptMm(comp.margin?.bottom ?? 6);
    const mL = ptMm(comp.margin?.left ?? 0),
      mR = ptMm(comp.margin?.right ?? 0);
    const pT = ptMm(comp.padding?.top ?? 0),
      pB = ptMm(comp.padding?.bottom ?? 0);
    const pL = ptMm(comp.padding?.left ?? 0),
      pR = ptMm(comp.padding?.right ?? 0);
    const ox = x + mL;
    const oy = y + mT;
    const ow = w - mL - mR;
    const ix = ox + pL;
    const iy = oy + pT;
    const iw = ow - pL - pR;

    if (comp.type === "TABLE")
      return renderTable(doc, comp, data, ix, iy, iw, pageCtx) + pB + mB;
    if (comp.type === "TEXT_BLOCK")
      return (
        renderTextBlock(
          doc,
          comp,
          ix,
          iy,
          iw,
          reportState,
          deltaToParas,
          undefined,
          pageCtx
        ) +
        pB +
        mB
      );
    if (comp.type === "IMAGE") {
      const iw2 = ptMm(comp.imageWidth ?? 80);
      const ih = ptMm(comp.imageHeight ?? 60);
      const aln = comp.imageAlign || "CENTER";
      let imgX = ix;
      if (aln === "CENTER") imgX = ix + (iw - iw2) / 2;
      else if (aln === "RIGHT") imgX = ix + iw - iw2;
      if (comp.imagePath) {
        try {
          const path = comp.imagePath;
          let fmt = "PNG";
          const dataMatch = path.match(/^data:image\/([a-zA-Z]+)/);
          if (dataMatch) {
            fmt = dataMatch[1].toUpperCase();
            if (fmt === "JPG") fmt = "JPEG";
          } else {
            const extMatch = path.match(/\.([a-zA-Z]+)(?:[?#]|$)/);
            if (extMatch) {
              fmt = extMatch[1].toUpperCase();
              if (fmt === "JPG") fmt = "JPEG";
            }
          }
          doc.addImage(path, fmt, imgX, iy, iw2, ih);
        } catch (_) {
          doc.setDrawColor(180, 180, 180);
          doc.rect(imgX, iy, iw2, ih, "S");
        }
      } else {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.rect(imgX, iy, iw2, ih, "FD");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("IMAGE", imgX + iw2 / 2, iy + ih / 2, {
          align: "center",
          baseline: "middle",
        });
      }
      return iy + ih + pB + mB;
    }
    if (comp.type === "CHART") {
      return renderChart(
        doc,
        comp,
        iw,
        ix,
        iy,
        mT,
        pT,
        pB,
        mB,
        PAGE_SIZES,
        reportState.page.size || "A4",
        reportState.page.orientation || "portrait",
        pageCtx
      );
    }
    return y;
  }

  useEffect(() => {
    setStatus("loading");

    const loadJsPDF = (): Promise<any> =>
      new Promise((resolve, reject) => {
        const existing = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
        if (existing) {
          resolve(existing);
          return;
        }

        const src =
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        const existingTag = Array.from(
          document.getElementsByTagName("script")
        ).find((s) => s.src === src);

        if (existingTag) {
          const start = Date.now();
          const poll = setInterval(() => {
            const cls = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
            if (cls) {
              clearInterval(poll);
              resolve(cls);
              return;
            }
            if (Date.now() - start > 10000) {
              clearInterval(poll);
              reject(new Error("Timeout loading jsPDF"));
            }
          }, 50);
          return;
        }

        const s = document.createElement("script");
        s.src = src;
        s.onload = () => {
          const cls = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
          cls
            ? resolve(cls)
            : reject(
              new Error("jsPDF loaded but jsPDF class not found on window")
            );
        };
        s.onerror = () => reject(new Error("Failed to load jsPDF from CDN"));
        document.head.appendChild(s);
      });

    (async () => {
      try {
        const jsPDFClass = await loadJsPDF();
        jsPDFRef.current = jsPDFClass;

        const doc = await buildPdf(jsPDFClass);
        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setStatus("ready");
      } catch (err: any) {
        console.error("PDF generation error:", err);
        setErrorMsg(err?.message || "Failed to generate PDF");
        setStatus("error");
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleDownload = async () => {
    try {
      const jsPDFClass =
        jsPDFRef.current ||
        (window as any).jspdf?.jsPDF ||
        (window as any).jsPDF;
      if (!jsPDFClass) throw new Error("jsPDF not loaded yet");
      const doc = await buildPdf(jsPDFClass);
      doc.save("report.pdf");
    } catch (err: any) {
      alert("Download failed: " + err?.message);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.6)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(960px,96vw)",
          height: "92vh",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid #e2e8f0",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileImage size={16} color="#7c3aed" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                PDF Preview
              </div>
              <div style={{ fontSize: 9, color: "#94a3b8" }}>
                {reportState.page.size} · {reportState.page.orientation}
              </div>
            </div>
            {status === "loading" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10,
                  color: "#7c3aed",
                }}
              >
                <RefreshCw
                  size={12}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Generating…
              </div>
            )}
            {status === "error" && (
              <div
                style={{
                  fontSize: 10,
                  color: "#dc2626",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                ⚠ {errorMsg}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {status === "ready" && pdfUrl && (
              <>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#2563eb",
                    padding: "5px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    textDecoration: "none",
                  }}
                >
                  <FileImage size={12} />
                  Open in New Tab
                </a>
                <button
                  onClick={handleDownload}
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#059669",
                    padding: "5px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <FileJson size={12} />
                  Download
                </button>
              </>
            )}
            <button
              onClick={onClose}
              style={{
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                width: 30,
                height: 30,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "#e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {status === "loading" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <RefreshCw
                size={28}
                color="#7c3aed"
                style={{ animation: "spin 1s linear infinite" }}
              />
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Building PDF with jsPDF…
              </div>
            </div>
          )}
          {status === "ready" && pdfUrl && (
            <object
              data={pdfUrl}
              type="application/pdf"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
              aria-label="PDF preview"
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "32px 32px 28px",
                    boxShadow: "0 4px 12px rgba(15,23,42,.08)",
                    border: "1px solid #e2e8f0",
                    textAlign: "center",
                    maxWidth: 460,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      margin: "0 auto 16px",
                      background:
                        "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)",
                      border: "1px solid #ddd6fe",
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileImage size={32} color="#7c3aed" strokeWidth={1.5} />
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#1e293b",
                      marginBottom: 4,
                    }}
                  >
                    Inline preview blocked
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      marginBottom: 20,
                      lineHeight: 1.5,
                    }}
                  >
                    Your browser is not allowing the inline PDF view here. The
                    PDF is ready — open it in a new tab or download it instead.
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#7c3aed",
                        color: "#fff",
                        padding: "10px 18px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        boxShadow: "0 2px 8px rgba(124,58,237,.3)",
                      }}
                    >
                      <FileImage size={14} />
                      Open in New Tab
                    </a>
                    <button
                      onClick={handleDownload}
                      style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        color: "#334155",
                        padding: "10px 18px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#fff")
                      }
                    >
                      <FileJson size={14} />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </object>
          )}
          {status === "error" && (
            <div
              style={{
                textAlign: "center",
                color: "#dc2626",
                fontSize: 12,
                padding: "24px",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 8 }}>⚠</div>
              {errorMsg}
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>
                Check the browser console for details.
              </div>
            </div>
          )}
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
