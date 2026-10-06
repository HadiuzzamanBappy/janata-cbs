"use client";

import React, { useState, useRef } from "react";
import type { AppState } from "../types/app-state";
import type { BodyComponent, BodyRow, BodyCompType } from "../types/body";
import type { Column } from "../types/table";
import {
  X,
  LayoutGrid,
  Lock,
  Unlock,
  GripHorizontal,
  Plus,
} from "@/features/reportstudio/theme/icons";
import { BODY_COMP_META } from "@/features/reportstudio/features/body/meta";
import { TablePreviewCanvas } from "@/features/reportstudio/features/table/TablePreviewCanvas";
import { ChartPreview } from "@/features/reportstudio/features/chart/ChartPreview";
import { ImagePreview } from "@/features/reportstudio/features/image/ImagePreview";
import { TextBlockRichEditor } from "@/features/reportstudio/features/text-block/TextBlockRichEditor";
import { CanvasAddRowStrip } from "./CanvasAddRowStrip";
import type { BodyCtxMenu } from "./types";

export type { BodyCtxMenu };

export function BodyCanvas({
  reportState,
  scale,
  selId,
  selRowId,
  selColId,
  snapGrid,
  onSelComp,
  onSelRow,
  onSelCol,
  onReorder: _onReorder,
  onReorderCols: _onReorderCols,
  onUpdateComp,
  onUpdateRow,
  onAddComp,
  onAddRow,
  onBodyCtxMenu,
}: {
  reportState: AppState;
  scale: number;
  selId: string | null;
  selRowId: string | null;
  selColId: string | null;
  snapGrid?: boolean;
  onSelComp: (id: string) => void;
  onSelRow: (id: string) => void;
  onSelCol: (id: string) => void;
  onReorder: (comps: BodyComponent[]) => void;
  onReorderCols: (cols: Column[]) => void;
  onUpdateComp: (c: BodyComponent) => void;
  onUpdateRow: (r: BodyRow) => void;
  onAddComp: (type: BodyCompType, rowId: string, slot: number) => void;
  onAddRow: (cols: number) => void;
  onBodyCtxMenu: (m: BodyCtxMenu) => void;
}) {
  const allRows = reportState.bodyRows || [];
  const allComps = reportState.bodyComponents || [];
  const toPx = (v: number) => Math.round(v * scale);
  const toMm = (px: number) => Math.round(px / scale);
  // ref to the body container, used for free-position drag coordinates
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Compute available inner height (px) for a TABLE component ──
     row.height and comp.height are in mm → use toPx.
     row/comp padding is also in mm. Returns undefined when no constraint. */
  const getTableAvailableHeight = (comp: BodyComponent): number | undefined => {
    if (comp.height) {
      const pad = comp.padding || { top: 0, bottom: 0, left: 0, right: 0 };
      return Math.max(
        0,
        toPx(comp.height) - toPx((pad.top || 0) + (pad.bottom || 0)),
      );
    }
    const row = allRows.find((r) => r._id === comp.rowId);
    if (row?.height) {
      const rpad = row.padding || { top: 4, bottom: 4, left: 0, right: 0 };
      const cpad = comp.padding || { top: 0, bottom: 0, left: 0, right: 0 };
      return Math.max(
        0,
        toPx(row.height) -
          toPx((rpad.top || 0) + (rpad.bottom || 0)) -
          toPx((cpad.top || 0) + (cpad.bottom || 0)),
      );
    }
    return undefined; // no height constraint → show all rows
  };

  /* ── Canvas inline "add component" picker state ── */
  const [canvasAddTarget, setCanvasAddTarget] = useState<{
    rowId: string;
    slot: number;
  } | null>(null);
  const COMP_TYPES_CANVAS: BodyCompType[] = [
    "TABLE",
    "CHART",
    "IMAGE",
    "TEXT_BLOCK",
  ];

  /* ── Resize handles: N/S=height, E/W=width, corners=both ── */
  const onHandleMouseDown = (
    e: React.MouseEvent,
    comp: BodyComponent,
    dir: string,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const startCX = e.clientX,
      startCY = e.clientY;

    // Measure the component's actual rendered size in mm — this is the source of truth.
    // When a comp is flex-sized (no explicit width) or row-sized (no explicit height),
    // falling back to stored values like `comp.width || 120` causes a sudden snap on first
    // mouse move. Reading the DOM rect avoids that.
    const compEl = (e.currentTarget as HTMLElement).closest(
      `[data-comp-id="${comp._id}"]`,
    ) as HTMLElement | null;
    const rect = compEl?.getBoundingClientRect();
    const measuredWmm = rect ? rect.width / scale : null;
    const measuredHmm = rect ? rect.height / scale : null;

    // For IMAGE components, use imageWidth/imageHeight instead of width/height
    const isImage = comp.type === "IMAGE";

    // Prefer measured size; fall back to stored / defaults
    const startW = comp.freePosition
      ? (comp.freeWidth ?? measuredWmm ?? 120)
      : isImage
        ? (comp.imageWidth ?? measuredWmm ?? 80)
        : (comp.width ?? measuredWmm ?? 120);
    const startH = isImage
      ? (comp.imageHeight ?? measuredHmm ?? 60)
      : (comp.height ?? measuredHmm ?? 60);
    const startFX = comp.freeX || 0,
      startFY = comp.freeY || 0;
    const ratio = startH / Math.max(startW, 1); // height-to-width ratio
    const compId = comp._id;

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startCX) / scale; // unrounded mm for smooth drag
      const dy = (me.clientY - startCY) / scale;
      const latest = allCompsRef.current.find((c) => c._id === compId);
      if (!latest) return;
      const lock = latest.aspectLock || me.shiftKey; // Shift key also locks ratio
      const next = { ...latest };

      const hasE = dir.includes("e");
      const hasW = dir.includes("w");
      const hasS = dir.includes("s");
      const hasN = dir.includes("n");

      // ── Width ──
      if (hasE) {
        const newW = Math.max(10, Math.round(startW + dx));
        if (latest.freePosition) {
          next.freeWidth = newW;
        } else if (isImage) {
          next.imageWidth = newW;
        } else {
          next.width = newW;
        }
        if (lock) {
          const newH = Math.max(10, Math.round(newW * ratio));
          if (isImage) next.imageHeight = newH;
          else next.height = newH;
        }
      } else if (hasW) {
        const newW = Math.max(10, Math.round(startW - dx));
        if (latest.freePosition) {
          next.freeWidth = newW;
          next.freeX = Math.max(0, Math.round(startFX + startW - newW));
        } else if (isImage) {
          next.imageWidth = newW;
        } else {
          next.width = newW;
        }
        if (lock) {
          const newH = Math.max(10, Math.round(newW * ratio));
          if (isImage) next.imageHeight = newH;
          else next.height = newH;
        }
      }

      // ── Height (only if not ratio-locked via width) ──
      if (!lock || (!hasE && !hasW)) {
        if (hasS) {
          const newH = Math.max(10, Math.round(startH + dy));
          if (isImage) next.imageHeight = newH;
          else next.height = newH;
        }
        if (hasN) {
          const newH = Math.max(10, Math.round(startH - dy));
          if (isImage) next.imageHeight = newH;
          else next.height = newH;
          if (latest.freePosition)
            next.freeY = Math.max(0, Math.round(startFY + dy));
        }
      }

      onUpdateComp(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /* ── Free-position drag — delta from mousedown start ── */
  const freeDragRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startFX: number;
    startFY: number;
  } | null>(null);
  const allCompsRef = useRef(allComps);
  allCompsRef.current = allComps; // keep ref fresh each render
  const onFreeDragMouseDown = (e: React.MouseEvent, comp: BodyComponent) => {
    e.stopPropagation();
    e.preventDefault();
    freeDragRef.current = {
      id: comp._id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startFX: comp.freeX || 0,
      startFY: comp.freeY || 0,
    };
    const onMove = (me: MouseEvent) => {
      if (!freeDragRef.current) return;
      const { id, startClientX, startClientY, startFX, startFY } =
        freeDragRef.current;
      const latest = allCompsRef.current.find((c) => c._id === id);
      if (!latest) return;
      let newFX = Math.max(0, startFX + toMm(me.clientX - startClientX));
      let newFY = Math.max(0, startFY + toMm(me.clientY - startClientY));
      if (snapGrid) {
        newFX = Math.round(newFX / 5) * 5;
        newFY = Math.round(newFY / 5) * 5;
      }
      onUpdateComp({ ...latest, freeX: newFX, freeY: newFY });
    };
    const onUp = () => {
      freeDragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /* ── Row resize: bottom-edge height drag ── */
  const allRowsRef = useRef(allRows);
  allRowsRef.current = allRows;
  const onRowHeightDragMouseDown = (e: React.MouseEvent, row: BodyRow) => {
    e.stopPropagation();
    e.preventDefault();
    const startCY = e.clientY;
    const startH = row.height ?? 40;
    const rowId = row._id;
    const onMove = (me: MouseEvent) => {
      const dh = toMm(me.clientY - startCY);
      const latest = allRowsRef.current.find((r) => r._id === rowId);
      if (!latest) return;
      onUpdateRow({ ...latest, height: Math.max(8, startH + dh) });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /* ── Slot divider drag: adjusts adjacent slot flexBasis ── */
  const onSlotDividerMouseDown = (
    e: React.MouseEvent,
    row: BodyRow,
    leftSlot: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const rowEl = (e.currentTarget as HTMLElement).closest(
      "[data-row-id]",
    ) as HTMLElement | null;
    if (!rowEl) return;
    const startCX = e.clientX;
    const rowW = rowEl.getBoundingClientRect().width;
    // Snapshot current flexBasis for all slots in this row
    const snapComps = allCompsRef.current.filter(
      (c) => c.rowId === row._id && !c.freePosition,
    );
    const totalSlots = row.cols;
    // Build equal basis array if not set
    const getB = (slot: number) => {
      const c = snapComps.find((cc) => cc.slotIndex === slot);
      return c?.flexBasis ?? 100 / totalSlots;
    };
    const startLeft = getB(leftSlot);
    const startRight = getB(leftSlot + 1);
    const combined = startLeft + startRight;
    const onMove = (me: MouseEvent) => {
      const dxPct = ((me.clientX - startCX) / rowW) * 100;
      const newLeft = Math.max(5, Math.min(combined - 5, startLeft + dxPct));
      const newRight = combined - newLeft;
      const latestLeft = allCompsRef.current.find(
        (c) =>
          c.rowId === row._id && c.slotIndex === leftSlot && !c.freePosition,
      );
      const latestRight = allCompsRef.current.find(
        (c) =>
          c.rowId === row._id &&
          c.slotIndex === leftSlot + 1 &&
          !c.freePosition,
      );
      if (latestLeft)
        onUpdateComp({
          ...latestLeft,
          flexBasis: Math.round(newLeft * 10) / 10,
        });
      if (latestRight)
        onUpdateComp({
          ...latestRight,
          flexBasis: Math.round(newRight * 10) / 10,
        });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /* ── 8 resize handles definition ── */
  const HANDLES: { dir: string; style: React.CSSProperties }[] = [
    { dir: "nw", style: { top: -5, left: -5, cursor: "nwse-resize" } },
    {
      dir: "n",
      style: { top: -5, left: "calc(50% - 4px)", cursor: "ns-resize" },
    },
    { dir: "ne", style: { top: -5, right: -5, cursor: "nesw-resize" } },
    {
      dir: "e",
      style: { top: "calc(50% - 4px)", right: -5, cursor: "ew-resize" },
    },
    { dir: "se", style: { bottom: -5, right: -5, cursor: "nwse-resize" } },
    {
      dir: "s",
      style: { bottom: -5, left: "calc(50% - 4px)", cursor: "ns-resize" },
    },
    { dir: "sw", style: { bottom: -5, left: -5, cursor: "nesw-resize" } },
    {
      dir: "w",
      style: { top: "calc(50% - 4px)", left: -5, cursor: "ew-resize" },
    },
  ];

  /* ── Render a single component cell ── */
  const renderComp = (comp: BodyComponent, opts: { inRow?: boolean } = {}) => {
    const m = BODY_COMP_META[comp.type];
    const isSel = comp._id === selId;
    // Margin (space outside the component box)
    const mg = comp.margin || { top: 0, bottom: 6, left: 0, right: 0 };
    // Padding (space inside the component box, between border and content)
    const pad = comp.padding || { top: 0, bottom: 0, left: 0, right: 0 };
    // For IMAGE, use imageHeight; for others use height
    const H =
      comp.type === "IMAGE"
        ? comp.imageHeight
          ? toPx(comp.imageHeight)
          : undefined
        : comp.height
          ? toPx(comp.height)
          : undefined;
    const selColor = m.color;

    // For free-position: absolute placement, ignore row flex
    const isAbsolute = !!comp.freePosition;
    // Free-position width (use freeWidth if set, else type defaults)
    const freeWidthPx = toPx(
      comp.freeWidth || (comp.type === "IMAGE" ? comp.imageWidth || 80 : 120),
    );
    const wrapStyle: React.CSSProperties = isAbsolute
      ? {
          position: "absolute",
          left: toPx(comp.freeX || 0),
          top: toPx(comp.freeY || 0),
          width: freeWidthPx,
          zIndex: comp.imageRotation ? 2 : 1,
        }
      : {
          position: "relative",
          // If explicit width set, use it; otherwise flex
          width: comp.width ? toPx(comp.width) : undefined,
          flex: !comp.width
            ? comp.flexBasis
              ? `0 0 calc(${comp.flexBasis}% - ${toPx(mg.left) + toPx(mg.right)}px)`
              : opts.inRow
                ? "1 1 0"
                : undefined
            : undefined,
          marginTop: toPx(mg.top),
          marginBottom: toPx(mg.bottom),
          marginLeft: toPx(mg.left),
          marginRight: toPx(mg.right),
          minWidth: 0,
        };

    return (
      <div
        key={comp._id}
        data-comp-id={comp._id}
        style={{ ...wrapStyle, userSelect: "none" }}
        onClick={(e) => {
          e.stopPropagation();
          onSelComp(comp._id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelComp(comp._id);
          onBodyCtxMenu({
            x: e.clientX,
            y: e.clientY,
            compId: comp._id,
            compType: comp.type,
          });
        }}
      >
        {/* Visual box */}
        <div
          style={{
            position: "relative",
            outline: isSel ? `2px solid ${selColor}` : "1px solid #e8edf2",
            outlineOffset: 1,
            borderRadius: 4,
            background:
              comp.type === "CHART"
                ? comp.chartBg || "#fff"
                : comp.type === "TEXT_BLOCK"
                  ? comp.textBg || "transparent"
                  : "transparent",
            opacity: comp.hidden ? 0.4 : 1,
            overflow: "hidden",
          }}
        >
          {/* Label badge + ratio-lock button when selected */}
          {isSel && (
            <div
              style={{
                position: "absolute",
                top: -18,
                left: 0,
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                gap: 3,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  background: selColor,
                  color: "#fff",
                  fontSize: 7,
                  padding: "1px 7px",
                  borderRadius: "3px 3px 0 0",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <m.Icon size={7} />
                {m.label}
                {isAbsolute ? " · FREE" : ""}
              </div>
              {/* Ratio-lock toggle */}
              <div
                style={{
                  pointerEvents: "all",
                  cursor: "pointer",
                  background: comp.aspectLock ? selColor : "#fff",
                  border: `1px solid ${selColor}`,
                  color: comp.aspectLock ? "#fff" : selColor,
                  borderRadius: "3px 3px 0 0",
                  padding: "1px 5px",
                  fontSize: 7,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateComp({ ...comp, aspectLock: !comp.aspectLock });
                }}
                title="Lock aspect ratio"
              >
                {comp.aspectLock ? <Lock size={7} /> : <Unlock size={7} />}
                {comp.aspectLock ? "ratio locked" : "lock ratio"}
              </div>
            </div>
          )}

          {/* Padding wrapper + content */}
          <div
            style={{
              padding: `${toPx(pad.top)}px ${toPx(pad.right)}px ${toPx(pad.bottom)}px ${toPx(pad.left)}px`,
              height: H,
              overflow: "hidden",
              boxSizing: "border-box",
              minHeight:
                comp.type === "TEXT_BLOCK" ? undefined : (H ?? toPx(20)),
            }}
          >
            {comp.type === "TABLE" && (
              <TablePreviewCanvas
                comp={comp}
                reportState={reportState}
                scale={scale}
                selColId={selColId}
                onSelCol={onSelCol}
                availableHeightPx={getTableAvailableHeight(comp)}
                onReorderCols={(cols) =>
                  onUpdateComp({ ...comp, tableColumns: cols })
                }
              />
            )}
            {comp.type === "CHART" && (
              <ChartPreview
                comp={comp}
                scale={scale}
                selected={false}
                onClick={() => {}}
                componentDataSources={reportState.componentDataSources}
                centralData={reportState.centralData}
              />
            )}
            {comp.type === "IMAGE" && (
              <ImagePreview
                comp={comp}
                scale={scale}
                selected={false}
                onClick={() => {}}
              />
            )}
            {comp.type === "TEXT_BLOCK" && (
              <TextBlockRichEditor
                comp={comp}
                onUpdate={onUpdateComp}
                reportVariables={reportState.reportVariables}
                componentDataSources={reportState.componentDataSources}
                centralData={reportState.centralData}
              />
            )}
          </div>

          {/* 8 resize handles — only non-table when selected */}
          {isSel &&
            comp.type !== "TABLE" &&
            !comp.locked &&
            HANDLES.map((h) => (
              <div
                key={h.dir}
                onMouseDown={(e) => onHandleMouseDown(e, comp, h.dir)}
                style={{
                  position: "absolute",
                  width: 8,
                  height: 8,
                  background: "#fff",
                  border: `2px solid ${selColor}`,
                  borderRadius: 2,
                  zIndex: 30,
                  pointerEvents: "all",
                  ...h.style,
                }}
              />
            ))}

          {/* Free-pos drag bar (shows on top of comp when selected+free) */}
          {isSel && isAbsolute && !comp.locked && (
            <div
              onMouseDown={(e) => onFreeDragMouseDown(e, comp)}
              style={{
                position: "absolute",
                top: 0,
                left: 8,
                right: 8,
                height: 14,
                background: `${selColor}44`,
                cursor: "move",
                borderRadius: "3px 3px 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 25,
              }}
            >
              <GripHorizontal size={9} color={selColor} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const freeComps = allComps.filter((c) => c.freePosition && !c.hidden);

  if (allRows.length === 0)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "24px 16px",
          color: "#94a3b8",
          fontSize: 10,
        }}
      >
        <LayoutGrid
          size={22}
          color="#cbd5e1"
          style={{ display: "block", margin: "0 auto 8px" }}
        />
        Body is empty — create rows in the Body tab
      </div>
    );

  return (
    <div ref={containerRef} style={{ position: "relative", paddingBottom: 12 }}>
      {/* Render each BodyRow */}
      {allRows
        .filter((row) => !row.hidden)
        .map((row) => {
          const isRowSel = row._id === selRowId;
          const mg = row.margin || { top: 0, bottom: 8, left: 0, right: 0 };
          const pad = row.padding || { top: 4, bottom: 4, left: 0, right: 0 };
          const gap = row.gap ?? 8;
          const rowH = row.height ? toPx(row.height) : undefined;
          return (
            <div
              key={row._id}
              data-row-id={row._id}
              onClick={(e) => {
                e.stopPropagation();
                onSelRow(row._id);
              }}
              style={{
                position: "relative",
                marginTop: toPx(mg.top),
                marginBottom: toPx(mg.bottom),
                marginLeft: toPx(mg.left),
                marginRight: toPx(mg.right),
                outline: isRowSel ? "2px solid #059669" : "1px dashed #e2e8f0",
                outlineOffset: 2,
                borderRadius: 6,
                background: row.background || "transparent",
                padding: `${toPx(pad.top)}px ${toPx(pad.right)}px ${toPx(pad.bottom)}px ${toPx(pad.left)}px`,
                height: rowH,
                boxSizing: "border-box" as const,
                overflow: rowH ? "hidden" : undefined,
                opacity: row.hidden ? 0.4 : 1,
                cursor: row.locked ? "not-allowed" : "default",
              }}
            >
              {/* Row label (only when selected) */}
              {isRowSel && (
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: 0,
                    zIndex: 20,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      background: "#059669",
                      color: "#fff",
                      fontSize: 7,
                      padding: "1px 6px",
                      borderRadius: "3px 3px 0 0",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <LayoutGrid size={7} />
                    {row.label} · {row.cols} col{row.cols > 1 ? "s" : ""}
                    {row.height ? ` · ${row.height}mm` : ""}
                  </div>
                </div>
              )}
              {/* Slots */}
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  alignItems: "stretch",
                  height: "100%",
                }}
              >
                {Array.from({ length: row.cols }).map((_, slot) => {
                  const comp = allComps.find(
                    (c) =>
                      c.rowId === row._id &&
                      c.slotIndex === slot &&
                      !c.freePosition,
                  );
                  const isLastSlot = slot === row.cols - 1;
                  return (
                    <React.Fragment key={slot}>
                      <div
                        style={{
                          flex: comp?.flexBasis
                            ? `0 0 calc(${comp.flexBasis}% - ${toPx((gap * (row.cols - 1)) / row.cols)}px)`
                            : "1 1 0",
                          minWidth: 0,
                        }}
                      >
                        {comp ? (
                          renderComp(comp, { inRow: row.cols > 1 })
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelRow(row._id);
                              setCanvasAddTarget({ rowId: row._id, slot });
                            }}
                            style={{
                              minHeight: toPx(28),
                              height: "100%",
                              borderRadius: 4,
                              border: `1.5px dashed ${canvasAddTarget?.rowId === row._id && canvasAddTarget?.slot === slot ? "#059669" : "#cbd5e1"}`,
                              background:
                                canvasAddTarget?.rowId === row._id &&
                                canvasAddTarget?.slot === slot
                                  ? "#ecfdf5"
                                  : "#f8fafc",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              gap: toPx(3),
                              transition: "all .15s",
                            }}
                          >
                            <div
                              style={{
                                width: toPx(14),
                                height: toPx(14),
                                borderRadius: "50%",
                                background:
                                  canvasAddTarget?.rowId === row._id &&
                                  canvasAddTarget?.slot === slot
                                    ? "#059669"
                                    : "#cbd5e1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "background .15s",
                              }}
                            >
                              <Plus
                                size={toPx(8)}
                                color="#fff"
                                strokeWidth={3}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: toPx(7),
                                color:
                                  canvasAddTarget?.rowId === row._id &&
                                  canvasAddTarget?.slot === slot
                                    ? "#059669"
                                    : "#cbd5e1",
                                fontWeight: 600,
                              }}
                            >
                              Add
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Slot divider handle — between columns, only when row is selected */}
                      {!isLastSlot && isRowSel && !row.locked && (
                        <div
                          onMouseDown={(e) =>
                            onSlotDividerMouseDown(e, row, slot)
                          }
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: "relative",
                            width: toPx(gap),
                            flexShrink: 0,
                            cursor: "col-resize",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 15,
                          }}
                        >
                          <div
                            style={{
                              width: 4,
                              height: 32,
                              borderRadius: 3,
                              background: "#059669",
                              opacity: 0.7,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                width: 1,
                                height: 16,
                                background: "#fff",
                                borderRadius: 1,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Gap spacer when row not selected */}
                      {!isLastSlot && (!isRowSel || row.locked) && (
                        <div style={{ width: toPx(gap), flexShrink: 0 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Bottom-edge height resize handle — always visible on selected row */}
              {isRowSel && !row.locked && (
                <div
                  onMouseDown={(e) => onRowHeightDragMouseDown(e, row)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    bottom: -5,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 48,
                    height: 10,
                    cursor: "ns-resize",
                    zIndex: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 3,
                      background: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 2,
                        background: "rgba(255,255,255,.7)",
                        borderRadius: 1,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      {/* Free-position items */}
      {freeComps.map((comp) => renderComp(comp, {}))}

      {/* ── Canvas inline component-type picker ── */}
      {canvasAddTarget &&
        (() => {
          const slotNum = canvasAddTarget.slot;
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.3)",
                zIndex: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setCanvasAddTarget(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: 20,
                  minWidth: 280,
                  boxShadow: "0 16px 48px rgba(0,0,0,.22)",
                  border: "1px solid #e2e8f0",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#1e293b",
                      }}
                    >
                      Add Component
                    </div>
                    <div
                      style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}
                    >
                      Slot {slotNum + 1} of selected row
                    </div>
                  </div>
                  <button
                    onClick={() => setCanvasAddTarget(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: 4,
                      borderRadius: 5,
                      display: "flex",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                {/* Type grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {COMP_TYPES_CANVAS.map((type) => {
                    const m = BODY_COMP_META[type];
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          onAddComp(
                            type,
                            canvasAddTarget.rowId,
                            canvasAddTarget.slot,
                          );
                          setCanvasAddTarget(null);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "12px 12px",
                          borderRadius: 9,
                          cursor: "pointer",
                          border: `1.5px solid ${m.color}44`,
                          background: `${m.color}0d`,
                          color: m.color,
                          fontWeight: 700,
                          fontSize: 10.5,
                          transition: "all .12s",
                        }}
                      >
                        <m.Icon size={17} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── Add Row strip (always shown below last row) ── */}
      <CanvasAddRowStrip scale={scale} onAddRow={onAddRow} />
    </div>
  );
}
