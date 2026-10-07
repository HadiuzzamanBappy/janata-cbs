import { GripVertical } from "lucide-react";
import { type CSSProperties, useRef, useState } from "react";
import { COLUMN_DATA_KEY_MAP, PREVIEW_DATA_ROWS } from "../../constants/preview-data";
import { resolveCompData } from "../../data/resolveCompData";
import type { AppState } from "../../types/app-state";
import type { BodyComponent } from "../../types/body";
import type { Column } from "../../types/table";
import { deepClone } from "../../utils/deepClone";
import { formatColNumber, formatCurrency } from "../../utils/number-format";

/**
 * Canvas-side preview of a TABLE component.
 *
 * Renders the live table the way the PDF would, plus interaction:
 *   - HTML5 drag-and-drop column reordering with drop-target highlight.
 *   - Column-width handles on the right edge of every header (except the
 *     last) — drag to resize, value is rounded to 0.1 mm.
 *   - Conditional-formatting evaluation via `new Function("value", "return " + cond.when)`.
 *
 * Aggregate row appears at the bottom whenever any column declares one.
 *
 * `availableHeightPx` lets the canvas tell the preview how much vertical
 * space it has so we can clip to a row count that fits exactly. Without
 * this the canvas truncated rows past the slot bottom.
 */
export function TablePreviewCanvas({
  comp,
  reportState,
  scale,
  selColId,
  onSelCol,
  onReorderCols,
  availableHeightPx,
}: {
  comp?: BodyComponent;
  reportState: AppState;
  scale: number;
  selColId: string | null;
  onSelCol: (id: string) => void;
  onReorderCols: (cols: Column[]) => void;
  availableHeightPx?: number;
}) {
  const DEFAULT_TS = {
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    borderStyle: "solid",
    horizontalBorderOnly: false,
    verticalBorderOnly: false,
    headerBorder: true,
    headerColor: "#1e40af",
    dataBorder: true,
    consistentCellAlignment: false,
    cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
  };
  const tableStyle = comp?.tableStyle ?? DEFAULT_TS;
  const columns = comp?.tableColumns ?? [];
  const oddRowBackground = comp?.tableOddRowBg ?? "#f8fafc";
  const allRows: any[] = resolveCompData(
    comp,
    reportState.centralData,
    reportState.componentDataSources,
    PREVIEW_DATA_ROWS as any[],
  );
  const toPx = (v: number) => Math.round(v * scale);

  const cpTop = (tableStyle.cellPadding?.top ?? 4) * scale;
  const cpBottom = (tableStyle.cellPadding?.bottom ?? 4) * scale;
  const cellPadV = cpTop + cpBottom;
  const bw = (tableStyle.borderWidth ?? 0.5) * scale;

  const headerRowPx = Math.round(8 * scale + cellPadV + bw);
  const dataRowPx = Math.round(7.5 * scale + cellPadV + bw);
  const aggRowPx = columns.some((c) => c.aggregate) ? Math.round(7 * scale + cellPadV + bw) : 0;

  const previewRows: any[] = (() => {
    if (!availableHeightPx || availableHeightPx <= 0) return allRows.slice(0, 5);
    const usable = availableHeightPx - headerRowPx - aggRowPx - bw;
    if (usable <= 0) return [];
    const maxRows = Math.max(0, Math.floor(usable / dataRowPx));
    return allRows.slice(0, maxRows);
  })();

  const colAlignMap: Record<string, string> = {
    LEFT: "left",
    CENTER: "center",
    RIGHT: "right",
    JUSTIFIED: "justify",
  };
  const [colDragId, setColDragId] = useState<string | null>(null);
  const [colOverId, setColOverId] = useState<string | null>(null);
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartW = useRef(0);

  const getVal = (col: Column, row: any) => {
    const k = col.dataKey || COLUMN_DATA_KEY_MAP[col.header];
    if (!k) return "—";
    const v = (row as any)[k];
    if (col.format === "currency" && typeof v === "number") return formatCurrency(v);
    return v ?? "-";
  };

  const getCond = (col: Column, row: any): CSSProperties | null => {
    if (!col.conditions) return null;
    const k = col.dataKey || COLUMN_DATA_KEY_MAP[col.header];
    const v = k ? (row as any)[k] : null;
    if (v === null && v !== 0) return null;
    for (const c of col.conditions) {
      try {
        if (new Function("value", "return " + c.when)(v)) {
          const style: any = {};
          if (c.fontColor) style.color = c.fontColor;
          else if (c.usePreset) {
            style.color = c.usePreset.includes("high")
              ? "#15803d"
              : c.usePreset.includes("low")
                ? "#b91c1c"
                : "#1d4ed8";
          }
          if (c.bold) style.fontWeight = "700";
          if (c.italic) style.fontStyle = "italic";
          if (c.bgColor) style.background = c.bgColor;
          return style;
        }
      } catch (_e) {
        /* swallow predicate errors so a broken row doesn't blank the table */
      }
    }
    return null;
  };

  const totalColumnWidth = columns.reduce((acc, col) => acc + col.width, 0) || 1;

  const drop = (tid: string) => {
    if (!colDragId || colDragId === tid) return;
    const cols = deepClone(columns);
    const fi = cols.findIndex((c: Column) => c._id === colDragId);
    const ti = cols.findIndex((c: Column) => c._id === tid);
    const [m] = cols.splice(fi, 1);
    cols.splice(ti, 0, m);
    onReorderCols(cols);
    setColDragId(null);
    setColOverId(null);
  };

  const startColResize = (e: React.MouseEvent, col: Column) => {
    e.stopPropagation();
    e.preventDefault();
    resizeStartX.current = e.clientX;
    resizeStartW.current = col.width;
    setResizingColId(col._id);
    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - resizeStartX.current) / scale;
      const newW = Math.max(0.5, Math.round((resizeStartW.current + dx) * 10) / 10);
      const cols = deepClone(columns);
      const idx = cols.findIndex((c: Column) => c._id === col._id);
      if (idx >= 0) {
        cols[idx].width = newW;
        onReorderCols(cols);
      }
    };
    const onUp = () => {
      setResizingColId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  if (columns.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: `${toPx(12)}px`,
          color: "#94a3b8",
          fontSize: toPx(9),
          borderTop: "1px solid #e2e8f0",
        }}
      >
        No columns — add from the left panel Table tab
      </div>
    );
  }

  return (
    <div
      style={{
        borderTop: `${tableStyle.borderWidth || 0.5}px solid ${
          tableStyle.borderColor || "#e2e8f0"
        }`,
        overflowX: "hidden",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: toPx(8.5),
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          {columns.map((c) => (
            <col key={c._id} style={{ width: `${(c.width / totalColumnWidth) * 100}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col, ci) => (
              <th
                key={col._id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("colId", col._id);
                  setColDragId(col._id);
                }}
                onDragEnd={() => {
                  setColDragId(null);
                  setColOverId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setColOverId(col._id);
                }}
                onDrop={() => drop(col._id)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelCol(col._id);
                }}
                style={{
                  position: "relative",
                  background:
                    col._id === selColId ? "#1d4ed8" : tableStyle.headerColor || "#1e40af",
                  color: "#fff",
                  textAlign: (colAlignMap[col.align] || "left") as any,
                  padding: `${toPx(tableStyle.cellPadding?.top || 4)}px ${toPx(
                    tableStyle.cellPadding?.right || 6,
                  )}px`,
                  fontWeight: 700,
                  fontSize: toPx(8),
                  cursor: "pointer",
                  userSelect: "none",
                  borderRight:
                    ci < columns.length - 1
                      ? `${tableStyle.borderWidth || 0.5}px solid rgba(255,255,255,.25)`
                      : undefined,
                  outline: col._id === colOverId ? "2px solid #93c5fd" : "none",
                  outlineOffset: -1,
                  opacity: col._id === colDragId ? 0.4 : 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <span
                  style={{
                    opacity: 0.4,
                    marginRight: 2,
                    display: "inline-flex",
                    verticalAlign: "middle",
                  }}
                >
                  <GripVertical size={toPx(7)} />
                </span>
                {col.header}
                {ci < columns.length - 1 && (
                  <span
                    onMouseDown={(e) => startColResize(e, col)}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 6,
                      cursor: "col-resize",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: resizingColId === col._id ? 1 : 0.3,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.opacity = resizingColId === col._id ? "1" : "0.3")
                    }
                  >
                    <div
                      style={{
                        width: 2,
                        height: "60%",
                        background: "rgba(255,255,255,.7)",
                        borderRadius: 1,
                      }}
                    />
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewRows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                background: ri % 2 === 1 ? oddRowBackground || "#f8fafc" : "#fff",
              }}
            >
              {columns.map((col, ci) => {
                const cc = getCond(col, row);
                return (
                  <td
                    key={col._id}
                    style={{
                      textAlign: (colAlignMap[col.align] || "left") as any,
                      padding: `${toPx(
                        tableStyle.cellPadding?.top || 4,
                      )}px ${toPx(tableStyle.cellPadding?.right || 6)}px`,
                      fontSize: toPx(7.5),
                      color: "#374151",
                      fontWeight: 400,
                      fontStyle: "normal",
                      borderBottom: tableStyle.dataBorder
                        ? `${tableStyle.borderWidth || 0.5}px solid ${
                            tableStyle.borderColor || "#e2e8f0"
                          }`
                        : "none",
                      borderRight:
                        !tableStyle.horizontalBorderOnly && ci < columns.length - 1
                          ? `${tableStyle.borderWidth || 0.5}px solid ${
                              tableStyle.borderColor || "#e2e8f0"
                            }`
                          : "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      ...(cc || {}),
                    }}
                  >
                    {getVal(col, row)}
                  </td>
                );
              })}
            </tr>
          ))}
          {columns.some((c) => c.aggregate) && (
            <tr style={{ background: "#f0f9ff" }}>
              {columns.map((col) => {
                if (!col.aggregate) {
                  return <td key={col._id} style={{ borderTop: "1px solid #bae6fd" }} />;
                }
                const k = col.dataKey || COLUMN_DATA_KEY_MAP[col.header];
                const vals = previewRows
                  .map((r: any) => r[k] as number)
                  .filter((v) => typeof v === "number");
                const fn = col.aggregate.function;
                let agg = "";
                const isNumFmt = col.format === "currency" || col.format === "number";
                if (fn === "sum") {
                  const s = vals.reduce((a, b) => a + b, 0);
                  agg = isNumFmt ? formatColNumber(s, col) : String(s);
                } else if (fn === "avg") {
                  const a = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                  agg = isNumFmt
                    ? formatColNumber(a, col)
                    : col.decimals !== undefined
                      ? a.toFixed(col.decimals)
                      : a.toFixed(1);
                } else if (fn === "count") {
                  agg = String(vals.length);
                } else if (fn === "min" && vals.length) {
                  const mn = Math.min(...vals);
                  agg = isNumFmt ? formatColNumber(mn, col) : String(mn);
                } else if (fn === "max" && vals.length) {
                  const mx = Math.max(...vals);
                  agg = isNumFmt ? formatColNumber(mx, col) : String(mx);
                }
                return (
                  <td
                    key={col._id}
                    style={{
                      textAlign: (colAlignMap[col.align] || "left") as any,
                      padding: `${toPx(
                        tableStyle.cellPadding?.top || 4,
                      )}px ${toPx(tableStyle.cellPadding?.right || 6)}px`,
                      fontSize: toPx(7),
                      color: col.aggregate.color || "#dc2626",
                      fontWeight: 700,
                      borderTop: "1px solid #bae6fd",
                    }}
                  >
                    {agg}
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
