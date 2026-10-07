import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Frame,
  Italic,
  Layers,
  Maximize2,
  Minus,
  Move,
  Ruler,
  Sliders,
  SlidersHorizontal,
  Type,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { SpacingInput } from "../../components/form/SpacingInput";
import { Swatch } from "../../components/form/Swatch";
import { PALETTE } from "../../constants/preview-data";
import { inputStyle } from "../../theme/inputStyle";
import { T } from "../../theme/tokens";
import type { Spacing } from "../../types/primitives";
import type { ZoneElement } from "../../types/zone";
import { deepClone } from "../../utils/deepClone";
import { getPageWidthMm } from "../../utils/units";

/**
 * Right-rail panel shown when more than one zone element is selected. Lets
 * the user bulk-edit style (font, color, bold/italic, alignment, margin,
 * padding) plus bulk-arrange free-position elements (align, distribute,
 * equal gap, uniform width).
 *
 * Local `<Sec/>`, `<Row/>`, `<Btn/>` helpers are defined inside the function
 * — extracted from the monolith's IIFE-style inline helpers and intentionally
 * kept local because they close over `T`, `commit`, and the bulk-operation
 * dispatch. Lifting them to module-level would add prop noise without any
 * stale-closure benefit (the component is itself stable).
 */
export function MultiSelectPanel({
  ids,
  zone: _zone,
  elements,
  pageMargin,
  pageOrientation,
  pageSize,
  onCommit,
  onSetSelection,
}: {
  ids: string[];
  zone: "header" | "footer";
  elements: ZoneElement[];
  pageMargin: Spacing;
  pageOrientation: string;
  pageSize: string;
  onCommit: (updated: ZoneElement[]) => void;
  onSetSelection: (sel: any) => void;
}) {
  const selected = elements.filter((e) => ids.includes(e._id));
  const textSel = selected.filter(
    (e) => e.type === "TEXT" || e.type === "DATE_TIME" || e.type === "PAGE_NUMBER",
  );
  const flexSel = selected.filter((e) => e.config?.flexmove && e.type !== "LOGO");

  const hasText = textSel.length > 0;
  const hasFlex = flexSel.length > 0;

  const pgW =
    getPageWidthMm(pageSize || "A4", pageOrientation) -
    (pageMargin.left || 0) -
    (pageMargin.right || 0);

  const [uniformW, setUniformW] = useState(80);
  const [gapH, setGapH] = useState(5);
  const [gapV, setGapV] = useState(5);

  const allBold = hasText && textSel.every((e) => !!e.config?.bold);
  const allItalic = hasText && textSel.every((e) => !!e.config?.italic);
  const allUnder = hasText && textSel.every((e) => !!e.config?.underline);
  const commonAlign =
    hasText && textSel.every((e) => e.config?.align === textSel[0].config?.align)
      ? (textSel[0].config?.align as string)
      : "";
  const commonColor =
    hasText && textSel.every((e) => e.config?.fontColor === textSel[0].config?.fontColor)
      ? (textSel[0].config?.fontColor as string)
      : "";
  const commonFont =
    hasText && textSel.every((e) => e.config?.font === textSel[0].config?.font)
      ? (textSel[0].config?.font as string)
      : "";
  const commonFs =
    hasText && textSel.every((e) => e.config?.fontSize === textSel[0].config?.fontSize)
      ? (textSel[0].config?.fontSize as number)
      : null;
  const [fontSize, setFontSize] = useState<number>(commonFs ?? 10);

  const refMargin = (hasText ? textSel[0].config?.margin : null) ?? {
    top: 2,
    bottom: 2,
    left: 0,
    right: 0,
  };
  const refPadding = (hasText ? textSel[0].config?.box?.padding : null) ?? {
    top: 4,
    bottom: 4,
    left: 6,
    right: 6,
  };
  const [marginVal, setMarginVal] = useState<Spacing>(refMargin);
  const [paddingVal, setPaddingVal] = useState<Spacing>(refPadding);

  if (selected.length < 2) {
    return (
      <div
        style={{
          color: "#94a3b8",
          fontSize: 10.5,
          padding: "16px 0",
          textAlign: "center",
          lineHeight: 1.8,
        }}
      >
        <Layers size={28} style={{ color: "#e2e8f0", display: "block", margin: "0 auto 10px" }} />
        <strong style={{ color: "#cbd5e1", fontSize: 11 }}>Multi-Select</strong>
        <br />
        Ctrl+Click on any elements
        <br />
        to edit them together
      </div>
    );
  }

  const commit = (targets: ZoneElement[], fn: (e: ZoneElement) => ZoneElement) => {
    const tids = new Set(targets.map((e) => e._id));
    onCommit(elements.filter((e) => tids.has(e._id)).map((e) => fn(deepClone(e))));
  };
  const styleAll = (fn: (e: ZoneElement) => ZoneElement) => commit(textSel, fn);
  const posAll = (fn: (e: ZoneElement) => ZoneElement) => commit(flexSel, fn);

  const xs = flexSel.map((e) => e.config.x || 0);
  const ys = flexSel.map((e) => e.config.y || 0);
  const ws = flexSel.map((e) => e.config.width || 80);
  const minX = flexSel.length ? Math.min(...xs) : 0;
  const maxX = flexSel.length ? Math.max(...flexSel.map((_, i) => xs[i] + ws[i])) : 0;
  const minY = flexSel.length ? Math.min(...ys) : 0;
  const maxY = flexSel.length
    ? Math.max(
        ...ys.map(
          (y, i) => y + (flexSel[i].config.fontSize ? flexSel[i].config.fontSize * 0.353 : 5),
        ),
      )
    : 0;
  const maxW = flexSel.length ? Math.max(...ws) : 0;
  const minW = flexSel.length ? Math.min(...ws) : 0;
  const maxFs = flexSel.length
    ? Math.max(...flexSel.filter((e) => e.type !== "SEPARATOR").map((e) => e.config.fontSize || 12))
    : 12;

  // Inline helpers — local to MultiSelectPanel by design (close over T).
  const Sec = ({
    label,
    color = "#0891b2",
    icon,
    desc,
  }: {
    label: string;
    color?: string;
    icon?: ReactNode;
    desc?: string;
  }) => (
    <div
      style={{
        marginTop: 10,
        marginBottom: 5,
        paddingBottom: 4,
        borderBottom: `1.5px solid ${color}1a`,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          color: T.text,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <div style={{ width: 3, height: 12, background: color, borderRadius: 2, flexShrink: 0 }} />
        {icon && <span style={{ color, display: "flex" }}>{icon}</span>}
        {label}
      </div>
      {desc && (
        <div style={{ fontSize: 8, color: T.muted, marginTop: 2, paddingLeft: 9 }}>{desc}</div>
      )}
    </div>
  );
  const Row = ({ children, cols }: { children: ReactNode; cols?: number }) => {
    const count = cols ?? (Array.isArray(children) ? children.filter(Boolean).length : 1);
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${count},1fr)`,
          gap: 4,
          marginBottom: 5,
        }}
      >
        {children}
      </div>
    );
  };
  const Btn = ({
    onClick,
    title,
    children,
    bg = T.bg2,
    border = T.border,
    fg = T.label,
    active = false,
  }: {
    onClick: () => void;
    title: string;
    children: ReactNode;
    bg?: string;
    border?: string;
    fg?: string;
    active?: boolean;
  }) => (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: "6px 4px",
        borderRadius: 5,
        border: `1.5px solid ${active ? "#2563eb" : border}`,
        background: active ? "#eff6ff" : bg,
        color: active ? "#2563eb" : fg,
        cursor: "pointer",
        fontSize: 9,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        whiteSpace: "nowrap",
        transition: "all .12s",
        width: "100%",
      }}
    >
      {children}
    </button>
  );
  const Divider = () => <div style={{ borderTop: `1px solid ${T.border}`, margin: "6px 0" }} />;

  return (
    <div style={{ fontSize: 11 }}>
      <div
        style={{
          background: "#f5f3ff",
          border: "1px solid #ede9fe",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "#7c3aed22",
              border: "1.5px solid #7c3aed55",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7c3aed",
              flexShrink: 0,
            }}
          >
            <Layers size={14} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
              {selected.length} Selected
            </div>
            <div style={{ fontSize: 8.5, color: "#7c3aed99", marginTop: 1 }}>
              Ctrl+Click to add / remove
            </div>
          </div>
          <button
            onClick={() => onSetSelection(null)}
            title="Clear"
            style={{
              width: 22,
              height: 22,
              background: "#fff",
              border: "1px solid #ede9fe",
              borderRadius: 5,
              color: "#7c3aed",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={11} />
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 8 }}>
          {selected.map((e) => {
            const p = PALETTE.find((pt) => pt.type === e.type) as any;
            const Icon = p?.Icon;
            const isText = e.type === "TEXT" || e.type === "DATE_TIME" || e.type === "PAGE_NUMBER";
            return (
              <div
                key={e._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  background: isText ? "#eff6ff" : "#f8fafc",
                  border: `1px solid ${isText ? "#bfdbfe" : "#e2e8f0"}`,
                  borderRadius: 4,
                  padding: "2px 7px",
                  fontSize: 8,
                  color: isText ? "#1d4ed8" : "#64748b",
                  fontWeight: 600,
                }}
              >
                {Icon && <Icon size={8} strokeWidth={2.5} />}
                {e.config?.text
                  ? `"${String(e.config.text).slice(0, 12)}${String(e.config.text).length > 12 ? "…" : ""}"`
                  : e.type}
              </div>
            );
          })}
        </div>
      </div>

      {hasText && (
        <>
          <Sec label={`Style · ${textSel.length} text`} color="#2563eb" icon={<Type size={10} />} />

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 5, marginBottom: 6 }}
          >
            <div>
              <div style={{ fontSize: 8, color: T.muted, marginBottom: 2 }}>Font</div>
              <select
                value={commonFont}
                onChange={(e) =>
                  styleAll((el) => {
                    el.config.font = e.target.value;
                    return el;
                  })
                }
                style={{ ...inputStyle, fontSize: 10 }}
              >
                <option value="">— mixed —</option>
                <option value="HELVETICA">Helvetica</option>
                <option value="TIMES">Times</option>
                <option value="COURIER">Courier</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 8, color: T.muted, marginBottom: 2 }}>Size (pt)</div>
              <input
                type="number"
                value={fontSize}
                min={6}
                max={96}
                onChange={(e) => setFontSize(+e.target.value)}
                onBlur={() =>
                  styleAll((el) => {
                    el.config.fontSize = fontSize;
                    return el;
                  })
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  styleAll((el) => {
                    el.config.fontSize = fontSize;
                    return el;
                  })
                }
                style={{ ...inputStyle, textAlign: "center" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 9.5, color: T.label, minWidth: 80, flexShrink: 0 }}>
              Color
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
              <Swatch
                value={commonColor || "#000000"}
                onChange={(c) =>
                  styleAll((el) => {
                    el.config.fontColor = c;
                    return el;
                  })
                }
                title="Font color"
              />
              <span style={{ fontSize: 9, fontFamily: "monospace", color: T.muted }}>
                {commonColor || "— mixed —"}
              </span>
            </div>
          </div>

          <Row cols={3}>
            <Btn
              title="Bold"
              active={allBold}
              onClick={() =>
                styleAll((el) => {
                  el.config.bold = !allBold;
                  return el;
                })
              }
            >
              <Bold size={11} />
              Bold
            </Btn>
            <Btn
              title="Italic"
              active={allItalic}
              onClick={() =>
                styleAll((el) => {
                  el.config.italic = !allItalic;
                  return el;
                })
              }
            >
              <Italic size={11} />
              Italic
            </Btn>
            <Btn
              title="Underline"
              active={allUnder}
              onClick={() =>
                styleAll((el) => {
                  el.config.underline = !allUnder;
                  return el;
                })
              }
            >
              <span style={{ textDecoration: "underline", fontSize: 12, fontWeight: 700 }}>U</span>
            </Btn>
          </Row>

          <Row cols={4}>
            <Btn
              title="Left"
              active={commonAlign === "LEFT"}
              onClick={() =>
                styleAll((el) => {
                  el.config.align = "LEFT";
                  return el;
                })
              }
            >
              <AlignLeft size={11} />
            </Btn>
            <Btn
              title="Center"
              active={commonAlign === "CENTER"}
              onClick={() =>
                styleAll((el) => {
                  el.config.align = "CENTER";
                  return el;
                })
              }
            >
              <AlignCenter size={11} />
            </Btn>
            <Btn
              title="Right"
              active={commonAlign === "RIGHT"}
              onClick={() =>
                styleAll((el) => {
                  el.config.align = "RIGHT";
                  return el;
                })
              }
            >
              <AlignRight size={11} />
            </Btn>
            <Btn
              title="Justify"
              active={commonAlign === "JUSTIFIED"}
              onClick={() =>
                styleAll((el) => {
                  el.config.align = "JUSTIFIED";
                  return el;
                })
              }
            >
              <AlignJustify size={11} />
            </Btn>
          </Row>

          <div
            style={{
              fontSize: 8.5,
              fontWeight: 700,
              color: "#d97706",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Frame size={9} color="#d97706" />
            Margin <span style={{ fontSize: 7.5, fontWeight: 400, color: T.muted }}>(pt)</span>
          </div>
          <SpacingInput
            label="Margin"
            value={marginVal}
            unit="pt"
            onChange={(v) => {
              setMarginVal(v);
              styleAll((el) => {
                el.config.margin = v;
                return el;
              });
            }}
          />

          <div
            style={{
              fontSize: 8.5,
              fontWeight: 700,
              color: "#059669",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Frame size={9} color="#059669" />
            Padding <span style={{ fontSize: 7.5, fontWeight: 400, color: T.muted }}>(pt)</span>
          </div>
          <SpacingInput
            label="Padding"
            value={paddingVal}
            unit="pt"
            color="#059669"
            onChange={(v) => {
              setPaddingVal(v);
              styleAll((el) => {
                if (!el.config.box) el.config.box = {};
                el.config.box.padding = v;
                return el;
              });
            }}
          />
        </>
      )}

      {hasFlex && hasText && <Divider />}

      {hasFlex && (
        <>
          <Sec
            label={`Position · ${flexSel.length} free`}
            color="#7c3aed"
            icon={<Move size={10} />}
            desc="Align free-position elements"
          />

          <div
            style={{
              fontSize: 8,
              color: T.muted,
              marginBottom: 3,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Within group
          </div>
          <Row>
            <Btn
              title="Align left edges"
              onClick={() =>
                posAll((e) => {
                  e.config.x = minX;
                  return e;
                })
              }
            >
              <AlignLeft size={11} />L
            </Btn>
            <Btn
              title="Align centers H"
              onClick={() =>
                posAll((e) => {
                  const cx = (minX + maxX) / 2;
                  e.config.x = Math.round(cx - (e.config.width || 80) / 2);
                  return e;
                })
              }
            >
              <AlignCenter size={11} />C
            </Btn>
            <Btn
              title="Align right edges"
              onClick={() =>
                posAll((e) => {
                  e.config.x = maxX - (e.config.width || 80);
                  return e;
                })
              }
            >
              <AlignRight size={11} />R
            </Btn>
            <Btn
              title="Align top edges"
              onClick={() =>
                posAll((e) => {
                  e.config.y = minY;
                  return e;
                })
              }
            >
              <ArrowUp size={11} />T
            </Btn>
            <Btn
              title="Align midlines V"
              onClick={() =>
                posAll((e) => {
                  e.config.y = Math.round((minY + maxY) / 2);
                  return e;
                })
              }
            >
              <Minus size={11} />M
            </Btn>
            <Btn
              title="Align bottom edges"
              onClick={() =>
                posAll((e) => {
                  e.config.y = maxY;
                  return e;
                })
              }
            >
              <ArrowDown size={11} />B
            </Btn>
          </Row>

          <div
            style={{
              fontSize: 8,
              color: T.muted,
              marginBottom: 3,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Snap to band
          </div>
          <Row>
            <Btn
              title="Snap left"
              onClick={() =>
                posAll((e) => {
                  e.config.x = 0;
                  return e;
                })
              }
            >
              <AlignLeft size={11} />
              Left
            </Btn>
            <Btn
              title="Snap center"
              onClick={() =>
                posAll((e) => {
                  e.config.x = Math.round((pgW - (e.config.width || 80)) / 2);
                  return e;
                })
              }
            >
              <AlignCenter size={11} />
              Ctr
            </Btn>
            <Btn
              title="Snap right"
              onClick={() =>
                posAll((e) => {
                  e.config.x = Math.round(pgW - (e.config.width || 80));
                  return e;
                })
              }
            >
              <AlignRight size={11} />
              Right
            </Btn>
          </Row>

          <Divider />

          <Sec label="Distribute Evenly" color="#0891b2" icon={<SlidersHorizontal size={10} />} />
          <Row>
            <Btn
              title="Distribute H"
              onClick={() => {
                if (flexSel.length < 2) return;
                const sorted = [...flexSel].sort((a, b) => (a.config.x || 0) - (b.config.x || 0));
                const totalW = sorted.reduce((s, e) => s + (e.config.width || 80), 0);
                const space = (pgW - totalW) / (sorted.length - 1);
                let x = 0;
                const map: Record<string, number> = {};
                sorted.forEach((e) => {
                  map[e._id] = Math.round(x);
                  x += (e.config.width || 80) + space;
                });
                posAll((e) => {
                  if (map[e._id] != null) e.config.x = map[e._id];
                  return e;
                });
              }}
            >
              <SlidersHorizontal size={11} />
              Horizontal
            </Btn>
            <Btn
              title="Distribute V"
              onClick={() => {
                if (flexSel.length < 2) return;
                const sorted = [...flexSel].sort((a, b) => (a.config.y || 0) - (b.config.y || 0));
                const totalH = sorted.reduce(
                  (s, e) => s + (e.config.fontSize ? e.config.fontSize * 0.353 : 5),
                  0,
                );
                const space = (20 - totalH) / (sorted.length - 1);
                let y = 0;
                const map: Record<string, number> = {};
                sorted.forEach((e) => {
                  map[e._id] = Math.round(y);
                  y += (e.config.fontSize ? e.config.fontSize * 0.353 : 5) + space;
                });
                posAll((e) => {
                  if (map[e._id] != null) e.config.y = map[e._id];
                  return e;
                });
              }}
            >
              <Sliders size={11} />
              Vertical
            </Btn>
          </Row>

          <Sec label="Equal Gap" color="#d97706" icon={<Ruler size={10} />} />
          <div style={{ display: "flex", gap: 6, marginBottom: 5, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: T.label, minWidth: 32 }}>H gap</span>
            <input
              type="number"
              value={gapH}
              min={0}
              max={100}
              onChange={(e) => setGapH(+e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <span style={{ fontSize: 9, color: T.muted }}>mm</span>
            <Btn
              title="Apply H gap"
              onClick={() => {
                const sorted = [...flexSel].sort((a, b) => (a.config.x || 0) - (b.config.x || 0));
                let x = sorted[0].config.x || 0;
                const map: Record<string, number> = {};
                sorted.forEach((e) => {
                  map[e._id] = Math.round(x);
                  x += (e.config.width || 80) + gapH;
                });
                posAll((e) => {
                  if (map[e._id] != null) e.config.x = map[e._id];
                  return e;
                });
              }}
            >
              Apply
            </Btn>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: T.label, minWidth: 32 }}>V gap</span>
            <input
              type="number"
              value={gapV}
              min={0}
              max={100}
              onChange={(e) => setGapV(+e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <span style={{ fontSize: 9, color: T.muted }}>mm</span>
            <Btn
              title="Apply V gap"
              onClick={() => {
                const sorted = [...flexSel].sort((a, b) => (a.config.y || 0) - (b.config.y || 0));
                let y = sorted[0].config.y || 0;
                const map: Record<string, number> = {};
                sorted.forEach((e) => {
                  map[e._id] = Math.round(y);
                  y += (e.config.fontSize ? e.config.fontSize * 0.353 : 5) + gapV;
                });
                posAll((e) => {
                  if (map[e._id] != null) e.config.y = map[e._id];
                  return e;
                });
              }}
            >
              Apply
            </Btn>
          </div>

          <Sec label="Make Equal Size" color="#059669" icon={<Maximize2 size={10} />} />
          <Row>
            <Btn
              title={`Match widest (${maxW}mm)`}
              onClick={() =>
                posAll((e) => {
                  e.config.width = maxW;
                  return e;
                })
              }
            >
              <Maximize2 size={10} />
              Max W
            </Btn>
            <Btn
              title={`Match narrowest (${minW}mm)`}
              onClick={() =>
                posAll((e) => {
                  e.config.width = minW;
                  return e;
                })
              }
            >
              <Minus size={10} />
              Min W
            </Btn>
            <Btn
              title={`Match largest font (${maxFs}pt)`}
              onClick={() =>
                posAll((e) => {
                  if (e.type !== "SEPARATOR") e.config.fontSize = maxFs;
                  return e;
                })
              }
            >
              <Type size={10} />= H
            </Btn>
          </Row>

          <Sec label="Set Uniform Width" color="#475569" icon={<Ruler size={10} />} />
          <div style={{ display: "flex", gap: 3, marginBottom: 5, flexWrap: "wrap" }}>
            {(
              [
                ["Full", pgW],
                ["½", pgW / 2],
                ["⅓", pgW / 3],
              ] as const
            ).map(([lbl, w]) => (
              <button
                key={String(lbl)}
                title={`${lbl} width (${Math.round(Number(w))}mm)`}
                onClick={() => {
                  const v = Math.round(Number(w));
                  setUniformW(v);
                  posAll((e) => {
                    e.config.width = v;
                    return e;
                  });
                }}
                style={{
                  flex: "0 0 auto",
                  padding: "4px 8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 5,
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: 8.5,
                  fontWeight: 700,
                }}
              >
                {lbl}{" "}
                <span style={{ fontSize: 7.5, color: "#94a3b8" }}>{Math.round(Number(w))}mm</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 4 }}>
            <input
              type="number"
              value={uniformW}
              min={5}
              max={300}
              onChange={(e) => setUniformW(+e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <span style={{ fontSize: 9, color: T.muted, flexShrink: 0 }}>mm</span>
            <button
              onClick={() =>
                posAll((e) => {
                  e.config.width = uniformW;
                  return e;
                })
              }
              style={{
                padding: "5px 10px",
                background: "#334155",
                border: "none",
                borderRadius: 5,
                color: "#fff",
                cursor: "pointer",
                fontSize: 9.5,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Apply
            </button>
          </div>
        </>
      )}
    </div>
  );
}
