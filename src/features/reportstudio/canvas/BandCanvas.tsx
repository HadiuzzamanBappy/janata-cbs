"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ZoneElement, ZoneRow } from "../types/zone";
import type { Align, Font } from "../types/primitives";
import { deepClone } from "@/features/reportstudio/utils/deepClone";
import { TEXT_ALIGN_MAP } from "@/features/reportstudio/constants/alignment";
import { FONT_FAMILY_MAP as _FM } from "@/features/reportstudio/constants/fonts";
import { PALETTE } from "@/features/reportstudio/constants/preview-data";
import {
  X,
  LayoutGrid,
  RotateCw,
  Move,
  Layers,
} from "@/features/reportstudio/theme/icons";
import type { BandCanvasProps } from "./types";

// Re-export for consumers
export type { BandCanvasProps };

// Use the fonts constant under a local alias to avoid conflict with alignment import
const FONT_MAP = _FM;

export function BandCanvas({
  zone,
  data,
  scale,
  selId,
  selRowId,
  isZoneSel,
  multiSelIds,
  onSelEl,
  onSelRow,
  onMultiSel,
  onSelZone,
  onUpdateEl,
  onUpdateElSilent,
  onCommitElDrag,
  onCommitMulti,
  onDeleteEl,
  onReorder,
  onCtxMenu,
}: BandCanvasProps) {
  const toPx = (v: number) => Math.round(v * scale);
  const r = data.radius || {
    topLeft: 0,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0,
  };
  const brd = (v: number) => `${toPx(v)}px`;

  const [dragSortId, setDragSortId] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [activeLogoDragId, setActiveLogoDragId] = useState<string | null>(null);
  const [activeResizeDragId, setActiveResizeDragId] = useState<string | null>(
    null,
  );
  const [activeFlexDragId, setActiveFlexDragId] = useState<string | null>(null);

  const bandContainerRef = useRef<HTMLDivElement>(null);
  const resizeDragStart = useRef({
    mouseX: 0,
    mouseY: 0,
    elemX: 0,
    elemY: 0,
    elemW: 0,
    elemH: 0,
    corner: "se",
  });

  // logo drag is handled inline in onMouseDown (see logoElements render)

  // flexmove drag is handled inline in onMouseDown (see flexmoveElements render)

  // resize handled inline in onMouseDown on resize handles

  // ── arrow-key nudge for selected flexmove/logo element ─────
  useEffect(() => {
    if (!selId) return;
    const el = data.elements.find((e) => e._id === selId);
    if (!el || (!el.config?.flexmove && el.type !== "LOGO")) return;

    const onKey = (e: KeyboardEvent) => {
      const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!ARROWS.includes(e.key)) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1; // Shift = 10mm, normal = 1mm
      const newEl = deepClone(el);
      if (e.key === "ArrowLeft") newEl.config.x = (newEl.config.x || 0) - step;
      if (e.key === "ArrowRight") newEl.config.x = (newEl.config.x || 0) + step;
      if (e.key === "ArrowUp") newEl.config.y = (newEl.config.y || 0) - step;
      if (e.key === "ArrowDown") newEl.config.y = (newEl.config.y || 0) + step;
      onUpdateEl(newEl);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selId, data.elements]); // re-attach when selection or elements change

  // ── logo resize effect ────────────────────────────
  useEffect(() => {
    if (!activeResizeDragId) return;
    const snap = data.elements.find((e) => e._id === activeResizeDragId);
    if (!snap) return;
    const {
      mouseX,
      mouseY,
      elemX: sx,
      elemY: sy,
      elemW: sw,
      elemH: sh,
      corner,
    } = resizeDragStart.current;

    const onMove = (e: MouseEvent) => {
      const rawDx = (e.clientX - mouseX) / scale;
      const rawDy = (e.clientY - mouseY) / scale;
      // Un-rotate delta into element-local space
      const rotRad = ((snap.config.rotation || 0) * Math.PI) / 180;
      const cosR = Math.cos(rotRad),
        sinR = Math.sin(rotRad);
      const dx = rawDx * cosR + rawDy * sinR;
      const dy = -rawDx * sinR + rawDy * cosR;
      const newEl = deepClone(snap);
      // SE: grow right+down
      if (corner === "se") {
        newEl.config.width = Math.max(5, Math.round(sw + dx));
        newEl.config.height = Math.max(5, Math.round(sh + dy));
      }
      // SW: grow left+down (move x, shrink width)
      else if (corner === "sw") {
        const nw = Math.max(5, Math.round(sw - dx));
        newEl.config.x = Math.max(0, Math.round(sx + sw - nw));
        newEl.config.width = nw;
        newEl.config.height = Math.max(5, Math.round(sh + dy));
      }
      // NE: grow right+up (move y, shrink height)
      else if (corner === "ne") {
        newEl.config.width = Math.max(5, Math.round(sw + dx));
        const nh = Math.max(5, Math.round(sh - dy));
        newEl.config.y = Math.max(0, Math.round(sy + sh - nh));
        newEl.config.height = nh;
      }
      // NW: grow left+up
      else if (corner === "nw") {
        const nw = Math.max(5, Math.round(sw - dx));
        const nh = Math.max(5, Math.round(sh - dy));
        newEl.config.x = Math.max(0, Math.round(sx + sw - nw));
        newEl.config.y = Math.max(0, Math.round(sy + sh - nh));
        newEl.config.width = nw;
        newEl.config.height = nh;
      }
      onUpdateEl(newEl);
    };
    const onUp = () => setActiveResizeDragId(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [activeResizeDragId]);

  const allElements = data.elements || [];
  // Sort by zIndex so user-controlled z-order is respected within each layer
  const sortByZ = (arr: ZoneElement[]) =>
    [...arr].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  const flowElements = sortByZ(
    allElements.filter((e) => e.type !== "LOGO" && !e.config?.flexmove),
  );
  const flexmoveElements = sortByZ(
    allElements.filter((e) => e.type !== "LOGO" && !!e.config?.flexmove),
  );
  const logoElements = sortByZ(allElements.filter((e) => e.type === "LOGO"));

  const hasRows = (data as any).rows && (data as any).rows.length > 0;

  return (
    <div
      ref={bandContainerRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelZone();
      }}
      style={{
        background: data.background || "#eee",
        borderRadius: `${brd(r.topLeft)} ${brd(r.topRight)} ${brd(r.bottomRight)} ${brd(r.bottomLeft)}`,
        padding: hasRows
          ? 0
          : `${brd(data.padding?.top || 5)} ${brd(data.padding?.right || 0)} ${brd(data.padding?.bottom || 5)} ${brd(data.padding?.left || 0)}`,
        margin: hasRows
          ? 0
          : `${brd(data.margin?.top || 0)} ${brd(data.margin?.right || 0)} ${brd(data.margin?.bottom || 0)} ${brd(data.margin?.left || 0)}`,
        minHeight: hasRows
          ? 0
          : toPx(
              data.minHeight || (zone === "footer" ? data.height || 28 : 20),
            ),
        position: "relative",
        cursor: "default",
        outline: isZoneSel ? "2px dashed #93c5fd" : "none",
        outlineOffset: -1,
      }}
    >
      {/* zone label badge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          background: zone === "header" ? "#2563eb" : "#7c3aed",
          color: "#fff",
          fontSize: 6.5,
          padding: "1px 6px",
          borderRadius: "0 0 4px 0",
          fontWeight: 800,
          opacity: 0.65,
          textTransform: "uppercase",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        {zone}
      </div>

      {/* ── FLOW elements (non-logo, non-flexmove) — direct elements only ── */}
      {flowElements
        .filter((el) => !el.rowId)
        .map((el) => {
          const idx = allElements.indexOf(el);
          const isItemSelected = selId === el._id;
          const isDragging = dragSortId === el._id;
          const isOver = dragOverIdx === idx;
          const cfg = el.config;
          const ml = toPx(cfg.margin?.left || 0),
            mr = toPx(cfg.margin?.right || 0),
            mt = toPx(cfg.margin?.top || 0),
            mb2 = toPx(cfg.margin?.bottom || 0);

          let body: React.ReactNode = null;
          const boxCfg = cfg.box || {};
          const bxW = `${boxCfg.borderWidth ?? 1}px`;
          const bxS = boxCfg.borderStyle || "solid";
          const bxC = boxCfg.borderColor || "#2563eb";
          const bxSides: string[] = boxCfg.borderSides ?? [
            "top",
            "right",
            "bottom",
            "left",
          ];
          const bxHas = (s: string) => bxSides.includes(s);
          const boxStyle: React.CSSProperties = boxCfg.enabled
            ? {
                borderTopWidth: bxHas("top") ? bxW : "0",
                borderRightWidth: bxHas("right") ? bxW : "0",
                borderBottomWidth: bxHas("bottom") ? bxW : "0",
                borderLeftWidth: bxHas("left") ? bxW : "0",
                borderTopStyle: bxHas("top") ? (bxS as any) : "none",
                borderRightStyle: bxHas("right") ? (bxS as any) : "none",
                borderBottomStyle: bxHas("bottom") ? (bxS as any) : "none",
                borderLeftStyle: bxHas("left") ? (bxS as any) : "none",
                borderTopColor: bxC,
                borderRightColor: bxC,
                borderBottomColor: bxC,
                borderLeftColor: bxC,
                borderRadius: (() => {
                  const r = boxCfg.radius;
                  if (!r || typeof r === "number") return r ?? 0;
                  return `${r.topLeft || 0}px ${r.topRight || 0}px ${r.bottomRight || 0}px ${r.bottomLeft || 0}px`;
                })(),
                opacity: boxCfg.opacity ?? 1,
                paddingTop: toPx(boxCfg.padding?.top ?? 4),
                paddingRight: toPx(boxCfg.padding?.right ?? 6),
                paddingBottom: toPx(boxCfg.padding?.bottom ?? 4),
                paddingLeft: toPx(boxCfg.padding?.left ?? 6),
                display: "inline-block",
                width: "100%",
                boxSizing: "border-box" as const,
              }
            : {};
          if (el.type === "TEXT" || el.type === "DATE_TIME") {
            const txt =
              el.type === "DATE_TIME"
                ? (cfg.text || "") + "2026-01-15 09:30"
                : cfg.text || "";
            const inner = (
              <div
                style={{
                  textAlign: (TEXT_ALIGN_MAP[cfg.align as Align] ||
                    "left") as any,
                  fontFamily: FONT_MAP[cfg.font as Font] || "Arial",
                  fontSize: toPx(cfg.fontSize || 12) * 0.76,
                  color: cfg.fontColor || "#333",
                  fontWeight: cfg.bold ? "bold" : "normal",
                  fontStyle: cfg.italic ? "italic" : "normal",
                  lineHeight: 1.3,
                }}
              >
                {txt}
              </div>
            );
            body = (
              <div
                style={{
                  marginTop: mt,
                  marginBottom: mb2,
                  marginLeft: ml,
                  marginRight: mr,
                }}
              >
                <div style={boxStyle}>{inner}</div>
              </div>
            );
          } else if (el.type === "PAGE_NUMBER") {
            const inner = (
              <div
                style={{
                  textAlign: (TEXT_ALIGN_MAP[cfg.align as Align] ||
                    "center") as any,
                  fontFamily: FONT_MAP[cfg.font as Font] || "Arial",
                  fontSize: toPx(cfg.fontSize || 9) * 0.76,
                  color: cfg.fontColor || "#666",
                }}
              >
                Page 1 of 1
              </div>
            );
            body = (
              <div
                style={{
                  marginTop: mt,
                  marginBottom: mb2,
                  marginLeft: ml,
                  marginRight: mr,
                }}
              >
                <div style={boxStyle}>{inner}</div>
              </div>
            );
          } else if (el.type === "SEPARATOR") {
            const wPct = cfg.widthPct ?? 100;
            const sepJustify =
              (
                {
                  LEFT: "flex-start",
                  CENTER: "center",
                  RIGHT: "flex-end",
                } as any
              )[cfg.align || "LEFT"] || "flex-start";
            body =
              cfg.show !== false ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: sepJustify,
                    marginTop: mt,
                    marginBottom: mb2,
                    marginLeft: ml,
                    marginRight: mr,
                  }}
                >
                  <div
                    style={{
                      borderTop: `${Math.max(cfg.height || 0.5, 0.3)}px solid ${cfg.color || "#ccc"}`,
                      width: `${wPct}%`,
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: 2,
                    marginTop: mt,
                    marginBottom: mb2,
                    marginLeft: ml,
                    marginRight: mr,
                    opacity: 0.3,
                    background:
                      "repeating-linear-gradient(90deg,#ccc 0,#ccc 4px,transparent 4px,transparent 8px)",
                  }}
                />
              );
          }

          return (
            <div
              key={el._id}
              draggable={!el.locked}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelEl(el._id);
                onCtxMenu({
                  x: e.clientX,
                  y: e.clientY,
                  elId: el._id,
                  zone,
                  elType: el.type,
                });
              }}
              onDragStart={(e) => {
                if (el.locked) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("sortId", el._id);
                setDragSortId(el._id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverIdx(idx);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const fid = dragSortId;
                setDragSortId(null);
                setDragOverIdx(null);
                if (!fid || fid === el._id) return;
                // work on a clone of ALL elements; only reorder within flow elements
                const arr = deepClone(allElements);
                const fromIdx = arr.findIndex(
                  (x: ZoneElement) => x._id === fid,
                );
                const toIdx = arr.findIndex(
                  (x: ZoneElement) => x._id === el._id,
                );
                if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
                const [moved] = arr.splice(fromIdx, 1);
                arr.splice(fromIdx < toIdx ? toIdx : toIdx, 0, moved);
                onReorder(arr);
              }}
              onDragEnd={() => {
                setDragSortId(null);
                setDragOverIdx(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (e.ctrlKey || e.metaKey) {
                  // Include existing single selection when starting multi-select
                  const cur = multiSelIds ?? (selId ? [selId] : []);
                  const next = cur.includes(el._id)
                    ? cur.filter((i) => i !== el._id)
                    : [...cur, el._id];
                  if (next.length === 0) {
                    onSelEl(el._id);
                  } else if (next.length === 1) {
                    onSelEl(next[0]);
                  } else {
                    onMultiSel?.(next);
                  }
                } else {
                  onSelEl(el._id);
                }
              }}
              style={{
                position: "relative",
                cursor: el.locked ? "not-allowed" : "grab",
                opacity: isDragging
                  ? 0.2
                  : el.hidden
                    ? 0.25
                    : (el.opacity ?? 1),
                zIndex: isItemSelected ? 100 : (el.zIndex ?? 0),
                borderTop: isOver
                  ? "2px solid #2563eb"
                  : "2px solid transparent",
                outline: isItemSelected
                  ? "2px solid #2563eb"
                  : (multiSelIds || []).includes(el._id)
                    ? "2px solid #7c3aed"
                    : "1px solid transparent",
                outlineOffset: 1,
                borderRadius: 2,
              }}
              onMouseEnter={(e) => {
                if (!isItemSelected && !(multiSelIds || []).includes(el._id))
                  (e.currentTarget as HTMLDivElement).style.outline =
                    "1px solid rgba(37,99,235,.3)";
              }}
              onMouseLeave={(e) => {
                if (!isItemSelected && !(multiSelIds || []).includes(el._id))
                  (e.currentTarget as HTMLDivElement).style.outline =
                    "1px solid transparent";
              }}
            >
              {body}
              {isItemSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    right: -1,
                    background: "#2563eb",
                    color: "#fff",
                    fontSize: 6.5,
                    padding: "1px 5px",
                    borderRadius: "0 2px 0 3px",
                    fontWeight: 800,
                    display: "flex",
                    gap: 5,
                    alignItems: "center",
                    zIndex: 10,
                  }}
                >
                  <span>{el.type}</span>
                  <span
                    style={{ cursor: "pointer", display: "flex" }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDeleteEl(el._id);
                    }}
                  >
                    <X size={9} />
                  </span>
                </div>
              )}
            </div>
          );
        })}

      {/* ── ROW / COLUMN GRID — same pattern as BodyCanvas, renders after direct elements ── */}
      {(data as any).rows &&
        (data as any).rows.length > 0 &&
        (() => {
          const rows: ZoneRow[] = (data as any).rows;
          const accentColor = zone === "header" ? "#2563eb" : "#7c3aed";
          return (
            <>
              {rows.map((row, ri) => {
                const rowEls = allElements.filter((el) => el.rowId === row._id);
                const isSelRow = selRowId === row._id;
                return (
                  <div
                    key={row._id}
                    style={{
                      width: "100%",
                      boxSizing: "border-box" as const,
                      paddingTop: toPx(row.margin?.top || 0),
                      paddingBottom: toPx(row.margin?.bottom || 0),
                      paddingLeft: toPx(row.margin?.left || 0),
                      paddingRight: toPx(row.margin?.right || 0),
                    }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelRow(row._id);
                      }}
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "row",
                        width: "100%",
                        outline: isSelRow
                          ? `2px solid ${accentColor}`
                          : `1px dashed #e2e8f0`,
                        outlineOffset: isSelRow ? -1 : 1,
                        background: row.background || "transparent",
                        boxSizing: "border-box" as const,
                        cursor: "pointer",
                      }}
                    >
                      {/* Row label when selected */}
                      {isSelRow && (
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
                              background: accentColor,
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
                            Row {ri + 1} · {row.cols} col
                            {row.cols > 1 ? "s" : ""}
                          </div>
                        </div>
                      )}
                      {/* Column slots */}
                      {Array.from({ length: row.cols }).map((_, ci) => {
                        const colW = 280 / row.cols;
                        const colEls = rowEls.filter((el) => {
                          const x = el.config?.x || 0;
                          return x >= ci * colW && x < (ci + 1) * colW;
                        });
                        const isLastCol = ci === row.cols - 1;
                        return (
                          <div
                            key={ci}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              borderRight: !isLastCol
                                ? `1px dashed ${accentColor}44`
                                : "none",
                              paddingTop: toPx(row.padding?.top || 0),
                              paddingBottom: toPx(row.padding?.bottom || 0),
                              paddingLeft: toPx(row.padding?.left || 0),
                              paddingRight: toPx(row.padding?.right || 0),
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              overflow: "hidden",
                              boxSizing: "border-box" as const,
                            }}
                          >
                            {colEls.map((el) => {
                              const cfg = el.config || {};
                              const isSel = selId === el._id;
                              const pe = PALETTE.find(
                                (p) => p.type === el.type,
                              );
                              let content: React.ReactNode = null;
                              if (el.type === "LOGO") {
                                const lw = toPx(cfg.width || 40);
                                const lh = toPx(cfg.height || 20);
                                content = (
                                  <div
                                    style={{
                                      width: lw,
                                      height: lh,
                                      background: accentColor + "22",
                                      border: `1px solid ${accentColor}55`,
                                      borderRadius: 2,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: toPx(6),
                                      color: accentColor,
                                      fontWeight: 700,
                                    }}
                                  >
                                    LOGO
                                  </div>
                                );
                              } else if (
                                el.type === "TEXT" ||
                                el.type === "DATE_TIME"
                              ) {
                                const txt =
                                  el.type === "DATE_TIME"
                                    ? "2026-01-15"
                                    : cfg.text || "Text";
                                content = (
                                  <div
                                    style={{
                                      textAlign: (TEXT_ALIGN_MAP[
                                        cfg.align as Align
                                      ] || "left") as any,
                                      fontFamily:
                                        FONT_MAP[cfg.font as Font] || "Arial",
                                      fontSize: toPx(cfg.fontSize || 10) * 0.76,
                                      color: cfg.fontColor || "#333",
                                      fontWeight: cfg.bold ? "bold" : "normal",
                                      fontStyle: cfg.italic
                                        ? "italic"
                                        : "normal",
                                    }}
                                  >
                                    {txt}
                                  </div>
                                );
                              } else if (el.type === "PAGE_NUMBER") {
                                content = (
                                  <div
                                    style={{
                                      textAlign: (TEXT_ALIGN_MAP[
                                        cfg.align as Align
                                      ] || "right") as any,
                                      fontSize: toPx(cfg.fontSize || 9) * 0.76,
                                      color: cfg.fontColor || "#666",
                                    }}
                                  >
                                    Page 1
                                  </div>
                                );
                              } else if (el.type === "SEPARATOR") {
                                content = (
                                  <div
                                    style={{
                                      borderTop: `${Math.max(cfg.height || 0.5, 0.3)}px solid ${cfg.color || "#ccc"}`,
                                      width: "100%",
                                    }}
                                  />
                                );
                              }
                              return (
                                <div
                                  key={el._id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelEl(el._id);
                                  }}
                                  style={{
                                    outline: isSel
                                      ? `2px solid ${accentColor}`
                                      : "none",
                                    outlineOffset: 1,
                                    borderRadius: 2,
                                    cursor: "pointer",
                                    position: "relative",
                                  }}
                                >
                                  {content}
                                  {isSel && (
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: -1,
                                        right: -1,
                                        background: accentColor,
                                        color: "#fff",
                                        fontSize: 5.5,
                                        padding: "1px 4px",
                                        borderRadius: "0 2px 0 2px",
                                        fontWeight: 800,
                                        display: "flex",
                                        gap: 3,
                                        alignItems: "center",
                                        zIndex: 10,
                                      }}
                                    >
                                      <span>{pe?.label || el.type}</span>
                                      <span
                                        style={{ cursor: "pointer" }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          onDeleteEl(el._id);
                                        }}
                                      >
                                        <X size={8} />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}

      {flowElements.length === 0 &&
        logoElements.length === 0 &&
        flexmoveElements.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: `${toPx(8)}px`,
              color: "rgba(0,0,0,.18)",
              fontSize: toPx(8),
              pointerEvents: "none",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
            }}
          >
            <Layers size={toPx(6)} style={{ opacity: 0.4 }} />
            Elements appear here
          </div>
        )}

      {/* ── LOGO elements — absolutely positioned, free 2D drag ── */}
      {logoElements.map((el) => {
        const isSelected = selId === el._id;
        const cfg = el.config;
        const logoW = toPx(cfg.width || 60);
        const logoH = toPx(cfg.height || 45);
        const logoX = toPx(cfg.x || 0);
        const logoY = toPx(cfg.y || 0);
        const rotDeg = cfg.rotation || 0;
        const isLogoDragging = activeLogoDragId === el._id;

        return (
          <div
            key={el._id}
            onClick={(e) => {
              e.stopPropagation();
              if (e.ctrlKey || e.metaKey) {
                // Ctrl+click: toggle into multi-select
                const cur = multiSelIds || [];
                const next = cur.includes(el._id)
                  ? cur.filter((i) => i !== el._id)
                  : [...cur, el._id];
                if (next.length === 0) {
                  onSelEl(el._id);
                } else if (next.length === 1) {
                  onSelEl(next[0]);
                } else {
                  onMultiSel?.(next);
                }
              } else {
                onSelEl(el._id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelEl(el._id);
              onCtxMenu({
                x: e.clientX,
                y: e.clientY,
                elId: el._id,
                zone,
                elType: el.type,
              });
            }}
            style={{
              position: "absolute",
              left: toPx(data.padding?.left || 0) + logoX,
              top: toPx(data.padding?.top || 0) + logoY,
              width: logoW,
              height: logoH,
              transform: `rotate(${rotDeg}deg)`,
              transformOrigin: "center center",
              cursor: el.locked
                ? "not-allowed"
                : isLogoDragging
                  ? "grabbing"
                  : "grab",
              zIndex: isSelected
                ? 200
                : rotDeg !== 0
                  ? 100
                  : 10 + (el.zIndex ?? 0),
              userSelect: "none",
              opacity: el.hidden ? 0.2 : (el.opacity ?? 1),
              outline: isSelected
                ? "2px solid #2563eb"
                : isLogoDragging
                  ? "2px dashed #2563eb"
                  : "1px dashed rgba(37,99,235,.35)",
              outlineOffset: 2,
              borderRadius: 3,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onSelEl(el._id);
              if (el.locked) return;
              const startMouseX = e.clientX;
              const startMouseY = e.clientY;
              const startX = cfg.x || 0;
              const startY = cfg.y || 0;
              // Un-rotate the screen-space delta so dragging always moves
              // the element along its own axes regardless of rotation angle.
              const rotRad = ((cfg.rotation || 0) * Math.PI) / 180;
              const cosR = Math.cos(rotRad),
                sinR = Math.sin(rotRad);
              const elSnap = deepClone(el);
              let lastEl = elSnap;
              setActiveLogoDragId(el._id);
              const onMove = (me: MouseEvent) => {
                const sdx = (me.clientX - startMouseX) / scale;
                const sdy = (me.clientY - startMouseY) / scale;
                // Inverse-rotate delta: rotate by -rotRad
                const dx = sdx * cosR + sdy * sinR;
                const dy = -sdx * sinR + sdy * cosR;
                const newEl = deepClone(elSnap);
                newEl.config.x = Math.max(0, Math.round(startX + dx));
                newEl.config.y = Math.max(0, Math.round(startY + dy));
                lastEl = newEl;
                onUpdateElSilent(newEl);
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
                setActiveLogoDragId(null);
                onCommitElDrag(deepClone(lastEl));
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          >
            {/* logo box — renders the actual image via CSS background when cfg.path
                is a real image source (data URL, http, or image filename); otherwise
                shows the branded gradient placeholder. Using a single element with
                background-image guarantees something is always visible. */}
            {(() => {
              const p = (cfg.path || "").trim();
              const hasDataUrl = p.startsWith("data:image/");
              const hasHttpUrl =
                p.startsWith("http://") || p.startsWith("https://");
              // Only treat "filename.ext" as an image if it's clearly a real path
              // (contains a slash) — otherwise defaults like "logo.png" would 404.
              const hasFilePath =
                /[/\\]/.test(p) && /\.(png|jpe?g|gif|webp|svg)$/i.test(p);
              const hasImage = hasDataUrl || hasHttpUrl || hasFilePath;
              const bgStyles: React.CSSProperties = hasImage
                ? {
                    backgroundImage: `url(${JSON.stringify(p)})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center center",
                    backgroundColor: "#fff",
                  }
                : {
                    background: "linear-gradient(135deg,#2563eb,#059669)",
                  };
              return (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: Math.max(toPx(7), 8),
                    color: "#fff",
                    fontWeight: 700,
                    boxShadow: isLogoDragging
                      ? "0 4px 16px rgba(37,99,235,.45)"
                      : "0 1px 4px rgba(0,0,0,.15)",
                    transition: isLogoDragging ? "none" : "box-shadow .15s",
                    ...bgStyles,
                  }}
                >
                  {!hasImage && "LOGO"}
                </div>
              );
            })()}

            {/* coords badge */}
            <div
              style={{
                position: "absolute",
                bottom: -14,
                left: 0,
                fontSize: 7,
                color: "#7c3aed",
                whiteSpace: "nowrap",
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              {cfg.x || 0},{cfg.y || 0} · {cfg.width || 60}×{cfg.height || 45}mm{" "}
              {rotDeg !== 0 ? `· ${rotDeg}°` : ""}
            </div>

            {/* selected controls */}
            {isSelected && (
              <>
                {/* delete btn */}
                <div
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    width: 16,
                    height: 16,
                    background: "#dc2626",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 30,
                    fontSize: 9,
                    color: "#fff",
                    fontWeight: 700,
                    boxShadow: "0 1px 4px rgba(0,0,0,.3)",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDeleteEl(el._id);
                  }}
                >
                  <X size={9} />
                </div>

                {/* resize handles — 4 corners */}
                {(["se", "sw", "ne", "nw"] as const).map((corner) => {
                  const cursors = {
                    se: "se-resize",
                    sw: "sw-resize",
                    ne: "ne-resize",
                    nw: "nw-resize",
                  };
                  const pos: Record<string, React.CSSProperties> = {
                    se: { bottom: -5, right: -5 },
                    sw: { bottom: -5, left: -5 },
                    ne: { top: -5, right: -5 },
                    nw: { top: -5, left: -5 },
                  };
                  return (
                    <div
                      key={corner}
                      title={`Resize (${corner.toUpperCase()})`}
                      style={{
                        position: "absolute",
                        ...pos[corner],
                        width: 10,
                        height: 10,
                        background: "#fff",
                        border: "2px solid #2563eb",
                        borderRadius: 2,
                        cursor: cursors[corner],
                        zIndex: 30,
                        boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActiveLogoDragId(null); // cancel any move drag
                        resizeDragStart.current = {
                          mouseX: e.clientX,
                          mouseY: e.clientY,
                          elemX: cfg.x || 0,
                          elemY: cfg.y || 0,
                          elemW: cfg.width || 60,
                          elemH: cfg.height || 45,
                          corner,
                        };
                        setActiveResizeDragId(el._id);
                      }}
                    />
                  );
                })}

                {/* rotate handle */}
                <div
                  title="Drag to rotate"
                  style={{
                    position: "absolute",
                    top: -22,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 14,
                    height: 14,
                    background: "#7c3aed",
                    borderRadius: "50%",
                    cursor: "crosshair",
                    zIndex: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,.3)",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!bandContainerRef.current) return;
                    // use zone ref to get centre of logo in screen coords
                    const bandRect =
                      bandContainerRef.current.getBoundingClientRect();
                    const padL = toPx(data.padding?.left || 0),
                      padT = toPx(data.padding?.top || 0);
                    const logoCenterX =
                      bandRect.left + padL + logoX + logoW / 2;
                    const logoCenterY = bandRect.top + padT + logoY + logoH / 2;
                    const startAngle =
                      (Math.atan2(
                        e.clientY - logoCenterY,
                        e.clientX - logoCenterX,
                      ) *
                        180) /
                      Math.PI;
                    const startRotDeg = cfg.rotation || 0;

                    const onMove = (me: MouseEvent) => {
                      const angle =
                        (Math.atan2(
                          me.clientY - logoCenterY,
                          me.clientX - logoCenterX,
                        ) *
                          180) /
                        Math.PI;
                      let deg = Math.round(startRotDeg + (angle - startAngle));
                      if (deg > 180) deg -= 360;
                      if (deg < -180) deg += 360;
                      const newEl = deepClone(el);
                      newEl.config.rotation = deg;
                      onUpdateEl(newEl);
                    };
                    const onUp = () => {
                      window.removeEventListener("mousemove", onMove);
                      window.removeEventListener("mouseup", onUp);
                    };
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }}
                >
                  <RotateCw size={9} />
                </div>
              </>
            )}
          </div>
        );
      })}
      {/* ── FLEXMOVE elements — absolutely positioned, freely draggable ── */}
      {flexmoveElements.map((el) => {
        const isSelected = selId === el._id;
        const cfg = el.config;
        const fmX = toPx(cfg.x || 0);
        const fmY = toPx(cfg.y || 0);
        const isFlexDragging = activeFlexDragId === el._id;
        const paletteEntry = PALETTE.find((p) => p.type === el.type);

        let body: React.ReactNode = null;
        const fmBoxCfg = cfg.box || {};
        const fmBxW = `${fmBoxCfg.borderWidth ?? 1}px`;
        const fmBxS = fmBoxCfg.borderStyle || "solid";
        const fmBxC = fmBoxCfg.borderColor || "#2563eb";
        const fmBxSides: string[] = fmBoxCfg.borderSides ?? [
          "top",
          "right",
          "bottom",
          "left",
        ];
        const fmBxHas = (s: string) => fmBxSides.includes(s);
        const fmBoxStyle: React.CSSProperties = fmBoxCfg.enabled
          ? {
              borderTopWidth: fmBxHas("top") ? fmBxW : "0",
              borderRightWidth: fmBxHas("right") ? fmBxW : "0",
              borderBottomWidth: fmBxHas("bottom") ? fmBxW : "0",
              borderLeftWidth: fmBxHas("left") ? fmBxW : "0",
              borderTopStyle: fmBxHas("top") ? (fmBxS as any) : "none",
              borderRightStyle: fmBxHas("right") ? (fmBxS as any) : "none",
              borderBottomStyle: fmBxHas("bottom") ? (fmBxS as any) : "none",
              borderLeftStyle: fmBxHas("left") ? (fmBxS as any) : "none",
              borderTopColor: fmBxC,
              borderRightColor: fmBxC,
              borderBottomColor: fmBxC,
              borderLeftColor: fmBxC,
              borderRadius: (() => {
                const r = fmBoxCfg.radius;
                if (!r || typeof r === "number") return r ?? 0;
                return `${r.topLeft || 0}px ${r.topRight || 0}px ${r.bottomRight || 0}px ${r.bottomLeft || 0}px`;
              })(),
              opacity: fmBoxCfg.opacity ?? 1,
              paddingTop: toPx(fmBoxCfg.padding?.top ?? 4),
              paddingRight: toPx(fmBoxCfg.padding?.right ?? 6),
              paddingBottom: toPx(fmBoxCfg.padding?.bottom ?? 4),
              paddingLeft: toPx(fmBoxCfg.padding?.left ?? 6),
              display: "inline-block",
              boxSizing: "border-box" as const,
            }
          : {};
        if (el.type === "TEXT" || el.type === "DATE_TIME") {
          const txt =
            el.type === "DATE_TIME"
              ? (cfg.text || "") + "2026-01-15 09:30"
              : cfg.text || "";
          const elW = cfg.width ? toPx(cfg.width) : undefined;
          const inner = (
            <div
              style={{
                textAlign: (TEXT_ALIGN_MAP[cfg.align as Align] ||
                  "left") as any,
                fontFamily: FONT_MAP[cfg.font as Font] || "Arial",
                fontSize: toPx(cfg.fontSize || 12) * 0.76,
                color: cfg.fontColor || "#333",
                fontWeight: cfg.bold ? "bold" : "normal",
                fontStyle: cfg.italic ? "italic" : "normal",
                lineHeight: 1.3,
                whiteSpace: elW ? "normal" : "nowrap",
                width: elW,
                wordBreak: elW ? "break-word" : undefined,
              }}
            >
              {txt}
            </div>
          );
          if (fmBoxCfg.enabled) {
            const boxH = fmBoxCfg.height ? toPx(fmBoxCfg.height) : undefined;
            const vAlign = fmBoxCfg.verticalAlign || "top";
            const flexAlign =
              vAlign === "bottom"
                ? "flex-end"
                : vAlign === "middle"
                  ? "center"
                  : "flex-start";
            body = (
              <div
                style={{
                  ...fmBoxStyle,
                  width: elW,
                  boxSizing: "border-box",
                  ...(boxH
                    ? {
                        height: boxH,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        justifyContent: flexAlign,
                      }
                    : {}),
                }}
              >
                {inner}
              </div>
            );
          } else {
            body = inner;
          }
        } else if (el.type === "PAGE_NUMBER") {
          const inner = (
            <div
              style={{
                textAlign: (TEXT_ALIGN_MAP[cfg.align as Align] ||
                  "center") as any,
                fontFamily: FONT_MAP[cfg.font as Font] || "Arial",
                fontSize: toPx(cfg.fontSize || 9) * 0.76,
                color: cfg.fontColor || "#666",
              }}
            >
              Page 1 of 1
            </div>
          );
          if (fmBoxCfg.enabled) {
            const boxH = fmBoxCfg.height ? toPx(fmBoxCfg.height) : undefined;
            const vAlign = fmBoxCfg.verticalAlign || "top";
            const flexAlign =
              vAlign === "bottom"
                ? "flex-end"
                : vAlign === "middle"
                  ? "center"
                  : "flex-start";
            body = (
              <div
                style={{
                  ...fmBoxStyle,
                  ...(boxH
                    ? {
                        height: boxH,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        justifyContent: flexAlign,
                      }
                    : {}),
                }}
              >
                {inner}
              </div>
            );
          } else {
            body = inner;
          }
        } else if (el.type === "SEPARATOR") {
          const sepW = toPx(cfg.width || 80);
          body =
            cfg.show !== false ? (
              <div
                style={{
                  borderTop: `${Math.max(cfg.height || 0.5, 0.3)}px solid ${cfg.color || "#ccc"}`,
                  width: sepW,
                  minWidth: sepW,
                }}
              />
            ) : (
              <div
                style={{
                  height: 2,
                  width: sepW,
                  minWidth: sepW,
                  opacity: 0.3,
                  background:
                    "repeating-linear-gradient(90deg,#ccc 0,#ccc 4px,transparent 4px,transparent 8px)",
                }}
              />
            );
        }

        const fmAlign = cfg.align || "LEFT";
        const fmJustify =
          fmAlign === "RIGHT"
            ? "flex-end"
            : fmAlign === "CENTER"
              ? "center"
              : "flex-start";

        return (
          <div
            key={el._id}
            data-fmid={el._id}
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              position: "absolute",
              left: toPx(data.padding?.left || 0) + fmX,
              top: toPx(data.padding?.top || 0) + fmY,
              display: "flex",
              justifyContent: fmJustify,
              width: cfg.width ? toPx(cfg.width) : undefined,
              minWidth: cfg.width
                ? toPx(cfg.width)
                : el.type === "SEPARATOR"
                  ? toPx(80)
                  : undefined,
              transform: cfg.rotation
                ? `rotate(${cfg.rotation}deg)`
                : undefined,
              transformOrigin: "center center",
              cursor: el.locked
                ? "not-allowed"
                : isFlexDragging
                  ? "grabbing"
                  : "grab",
              zIndex: isSelected
                ? 150
                : cfg.rotation
                  ? 90
                  : 12 + (el.zIndex ?? 0),
              userSelect: "none",
              opacity: el.hidden ? 0.2 : (el.opacity ?? 1),
              outline: isSelected
                ? `2px solid ${paletteEntry?.color || "#2563eb"}`
                : (multiSelIds || []).includes(el._id)
                  ? "2px solid #7c3aed"
                  : isFlexDragging
                    ? `2px dashed ${paletteEntry?.color || "#2563eb"}`
                    : "1px dashed rgba(37,99,235,.25)",
              outlineOffset: 2,
              borderRadius: 3,
              padding: "2px 4px",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              // Ctrl/Meta+click → toggle multi-select, no drag
              if (e.ctrlKey || e.metaKey) {
                const cur = multiSelIds || (selId ? [selId] : []);
                const next = cur.includes(el._id)
                  ? cur.filter((i) => i !== el._id)
                  : [...cur, el._id];
                if (next.length === 0) {
                  onSelEl(el._id);
                } else if (next.length === 1) {
                  onSelEl(next[0]);
                } else {
                  onMultiSel?.(next);
                }
                return; // no drag
              }
              if (el.locked) return;
              const isInMulti = (multiSelIds || []).includes(el._id);

              if (isInMulti && multiSelIds && multiSelIds.length > 1) {
                // ── Group drag: move all multi-selected elements together ──
                const startMouseX = e.clientX,
                  startMouseY = e.clientY;
                const snapGroup = (multiSelIds || [])
                  .map((id) => {
                    const found = data.elements.find((e2) => e2._id === id);
                    return found ? deepClone(found) : null;
                  })
                  .filter(Boolean) as ZoneElement[];
                let lastGroup = snapGroup.map(deepClone);
                setActiveFlexDragId(el._id);
                const onMove = (me: MouseEvent) => {
                  const dx = Math.round((me.clientX - startMouseX) / scale);
                  const dy = Math.round((me.clientY - startMouseY) / scale);
                  lastGroup = snapGroup.map((snap) => {
                    const n = deepClone(snap);
                    n.config.x = (snap.config.x || 0) + dx;
                    n.config.y = (snap.config.y || 0) + dy;
                    return n;
                  });
                  lastGroup.forEach((n) => onUpdateElSilent(n));
                };
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                  setActiveFlexDragId(null);
                  onCommitMulti?.(lastGroup.map(deepClone));
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              } else {
                // ── Single element drag ──
                onSelEl(el._id);
                const startMouseX = e.clientX,
                  startMouseY = e.clientY;
                const startX = cfg.x || 0,
                  startY = cfg.y || 0;
                // Un-rotate the screen-space delta so dragging works correctly after rotation
                const rotRad = ((cfg.rotation || 0) * Math.PI) / 180;
                const cosR = Math.cos(rotRad),
                  sinR = Math.sin(rotRad);
                const elSnap = deepClone(el);
                let lastEl = elSnap;
                setActiveFlexDragId(el._id);
                const onMove = (me: MouseEvent) => {
                  const sdx = (me.clientX - startMouseX) / scale;
                  const sdy = (me.clientY - startMouseY) / scale;
                  const dx = sdx * cosR + sdy * sinR;
                  const dy = -sdx * sinR + sdy * cosR;
                  const newEl = deepClone(elSnap);
                  newEl.config.x = Math.round(startX + dx);
                  newEl.config.y = Math.round(startY + dy);
                  lastEl = newEl;
                  onUpdateElSilent(newEl);
                };
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                  setActiveFlexDragId(null);
                  onCommitElDrag(deepClone(lastEl));
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }
            }}
          >
            {body}
            {/* Resize handles — left & right for SEPARATOR, right-only for TEXT/DATE_TIME */}
            {isSelected &&
              !el.locked &&
              (el.type === "SEPARATOR" ||
                el.type === "TEXT" ||
                el.type === "DATE_TIME") && (
                <>
                  {(el.type === "SEPARATOR"
                    ? (["left", "right"] as const)
                    : (["right"] as const)
                  ).map((side) => (
                    <div
                      key={side}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const startMouseX = e.clientX;
                        const startW = cfg.width || 80;
                        const startX = cfg.x || 0;
                        const elSnap = deepClone(el);
                        let lastEl = elSnap;
                        const onMove = (me: MouseEvent) => {
                          const rawDx = (me.clientX - startMouseX) / scale;
                          // Un-rotate into element-local horizontal axis
                          const rotRad = ((cfg.rotation || 0) * Math.PI) / 180;
                          const dx = rawDx * Math.cos(rotRad);
                          const newEl = deepClone(elSnap);
                          const raw =
                            side === "right" ? startW + dx : startW - dx;
                          newEl.config.width = Math.max(10, Math.round(raw));
                          if (side === "left") {
                            const dw = startW - newEl.config.width;
                            newEl.config.x = Math.round(startX + dw);
                          }
                          lastEl = newEl;
                          onUpdateElSilent(newEl);
                        };
                        const onUp = () => {
                          window.removeEventListener("mousemove", onMove);
                          window.removeEventListener("mouseup", onUp);
                          onCommitElDrag(deepClone(lastEl));
                        };
                        window.addEventListener("mousemove", onMove);
                        window.addEventListener("mouseup", onUp);
                      }}
                      style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        [side]: -5,
                        width: 10,
                        height: el.type === "SEPARATOR" ? 18 : 24,
                        background: "#fff",
                        border: `2px solid ${paletteEntry?.color || "#64748b"}`,
                        borderRadius: 3,
                        cursor: "ew-resize",
                        zIndex: 25,
                        boxShadow: "0 1px 3px rgba(0,0,0,.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 2,
                          height: 8,
                          background: paletteEntry?.color || "#64748b",
                          borderRadius: 1,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  ))}
                </>
              )}
            {/* coords + size badge */}
            <div
              style={{
                position: "absolute",
                bottom: -13,
                left: 0,
                fontSize: 7,
                color: paletteEntry?.color || "#0891b2",
                whiteSpace: "nowrap",
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              {cfg.x || 0},{cfg.y || 0}mm
              {isSelected &&
              (el.type === "SEPARATOR" ||
                el.type === "TEXT" ||
                el.type === "DATE_TIME")
                ? ` · w${cfg.width || 80}mm`
                : ""}
              {cfg.rotation && cfg.rotation !== 0 ? ` · ${cfg.rotation}°` : ""}
              {isSelected ? " · ↑↓←→" : ""}
            </div>
            {/* rotate handle — for TEXT/DATE_TIME/PAGE_NUMBER when flexmove */}
            {isSelected &&
              (el.type === "TEXT" ||
                el.type === "DATE_TIME" ||
                el.type === "PAGE_NUMBER") && (
                <div
                  title="Drag to rotate"
                  style={{
                    position: "absolute",
                    top: -22,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 14,
                    height: 14,
                    background: "#7c3aed",
                    borderRadius: "50%",
                    cursor: "crosshair",
                    zIndex: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,.3)",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!bandContainerRef.current) return;
                    const bandRect =
                      bandContainerRef.current.getBoundingClientRect();
                    const domEl = e.currentTarget.closest(
                      "[data-fmid]",
                    ) as HTMLElement | null;
                    const elRect = domEl
                      ? domEl.getBoundingClientRect()
                      : {
                          left: bandRect.left + fmX,
                          top: bandRect.top + fmY,
                          width: 0,
                          height: 0,
                        };
                    const cx = elRect.left + elRect.width / 2;
                    const cy = elRect.top + elRect.height / 2;
                    const startAngle =
                      (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) /
                      Math.PI;
                    const startRot = cfg.rotation ?? 0;
                    const onMove = (me: MouseEvent) => {
                      const angle =
                        (Math.atan2(me.clientY - cy, me.clientX - cx) * 180) /
                        Math.PI;
                      let deg = Math.round(startRot + (angle - startAngle));
                      if (deg > 180) deg -= 360;
                      if (deg < -180) deg += 360;
                      const newEl = deepClone(el);
                      newEl.config.rotation = deg;
                      onUpdateElSilent(newEl);
                    };
                    const onUp = () => {
                      const finalEl = data.elements.find(
                        (e2) => e2._id === el._id,
                      );
                      if (finalEl) onCommitElDrag(deepClone(finalEl));
                      window.removeEventListener("mousemove", onMove);
                      window.removeEventListener("mouseup", onUp);
                    };
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }}
                >
                  <RotateCw size={9} />
                </div>
              )}
            {/* selected label + delete */}
            {isSelected && (
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  right: -1,
                  background: paletteEntry?.color || "#2563eb",
                  color: "#fff",
                  fontSize: 6.5,
                  padding: "1px 5px",
                  borderRadius: "0 2px 0 3px",
                  fontWeight: 800,
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                  zIndex: 10,
                }}
              >
                <Move size={7} />
                <span
                  style={{ cursor: "pointer", display: "flex" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDeleteEl(el._id);
                  }}
                >
                  <X size={9} />
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
