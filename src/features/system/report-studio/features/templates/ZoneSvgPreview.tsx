import type { ZoneRow } from "../../types/zone";
import type { ReportTemplate } from "../../constants/preview-data";

/**
 * SVG thumbnail of a zone (header or footer) used by `TemplateModal`'s
 * cards. Renders LOGO placeholders, flow text, and separators at a small
 * scale so users can pick a template by sight.
 *
 * Two layout branches:
 *   - rows-based (modern templates)  — laid out row-by-row, each row split
 *     into N columns matching the template's column count.
 *   - flow (legacy / no rows)        — LOGOs absolutely-placed, text flows
 *     top-to-bottom honouring margin.top / margin.bottom.
 *
 * Pure presentation — no event handlers, no internal state. Safe to render
 * inside a grid of dozens of cards.
 */
export function ZoneSvgPreview({
  zone,
  accent,
  width = 240,
  scale = 0.38,
}: {
  zone: ReportTemplate["header"] | ReportTemplate["footer"];
  accent: string;
  width?: number;
  scale?: number;
}) {
  const PAD_T = (zone.padding?.top ?? 8) * scale;
  const PAD_L = (zone.padding?.left ?? 0) * scale;
  const zoneH = ((zone as any).minHeight ?? (zone as any).height ?? 60) * scale;
  const svgH = Math.max(zoneH + PAD_T * 2, 20);

  const fontCol = (cfg: any) => cfg.fontColor || zone.fontColor || "#333";

  if ((zone as any).rows && (zone as any).rows.length > 0) {
    const rows = (zone as any).rows as ZoneRow[];
    let currentY = PAD_T;

    return (
      <svg
        viewBox={`0 0 ${width} ${svgH}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%" }}
      >
        <rect width={width} height={svgH} fill={zone.background || "#ffffff"} />
        {rows.map(row => {
          const rowHeight = (row.height || 40) * scale;
          const columnWidth = width / row.cols;
          const rowElements = (zone.elements || []).filter((el: any) => el.rowId === row._id);
          const rowY = currentY;
          currentY += rowHeight;
          return (
            <g key={row._id}>
              {row.background && row.background !== "transparent" && (
                <rect x={0} y={rowY} width={width} height={rowHeight} fill={row.background} />
              )}
              {row.cols > 1 &&
                Array.from({ length: row.cols - 1 }, (_, i) => {
                  const x = (i + 1) * columnWidth;
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1={rowY}
                      x2={x}
                      y2={rowY + rowHeight}
                      stroke="#cbd5e1"
                      strokeWidth={0.5}
                      strokeDasharray="3 3"
                      opacity={0.5}
                    />
                  );
                })}
              {rowElements.map((el: any, elIdx: number) => {
                const cfg = el.config || {};
                const elX = PAD_L + (cfg.x || 0) * scale;
                const elY = rowY + (cfg.y || 0) * scale;
                if (el.type === "LOGO") {
                  const lw = (cfg.width || 50) * scale;
                  const lh = (cfg.height || 20) * scale;
                  return (
                    <g key={elIdx}>
                      <rect
                        x={elX}
                        y={elY}
                        width={lw}
                        height={lh}
                        rx="2"
                        fill={accent + "22"}
                        stroke={accent + "55"}
                        strokeWidth="0.5"
                      />
                      <text
                        x={elX + lw / 2}
                        y={elY + lh / 2 + 2.5}
                        fontSize={lh * 0.28}
                        fill={accent}
                        textAnchor="middle"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                      >
                        LOGO
                      </text>
                    </g>
                  );
                }
                const fontSize = (cfg.fontSize || 10) * scale * 0.9;
                let label =
                  el.type === "TEXT"
                    ? cfg.text || "Text"
                    : el.type === "PAGE_NUMBER"
                      ? "Page 1"
                      : el.type === "DATE_TIME"
                        ? "2026-01-15"
                        : "";
                if (label.length > 28) label = label.slice(0, 26) + "…";
                return (
                  <text
                    key={elIdx}
                    x={elX}
                    y={elY + fontSize}
                    fontSize={fontSize}
                    fill={fontCol(cfg)}
                    fontWeight={cfg.bold ? "bold" : "normal"}
                    fontStyle={cfg.italic ? "italic" : "normal"}
                    fontFamily={cfg.font === "TIMES" ? "Georgia,serif" : "Arial,sans-serif"}
                  >
                    {label}
                  </text>
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  }

  // Flow layout (no rows).
  let flowY = PAD_T;
  const flowEls = (zone.elements || []).filter(e => e.type !== "LOGO");
  const flowPositions: { el: any; y: number; h: number }[] = [];
  for (const el of flowEls) {
    const cfg = el.config || {};
    const mgT = (cfg.margin?.top ?? 0) * scale;
    const mgB = (cfg.margin?.bottom ?? 0) * scale;
    let elH = 0;
    if (el.type === "SEPARATOR") {
      elH = Math.max((cfg.height ?? 0.8) * scale, 1);
    } else {
      elH = (cfg.fontSize ?? 10) * scale * 1.0;
    }
    flowY += mgT;
    flowPositions.push({ el, y: flowY, h: elH });
    flowY += elH + mgB;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%" }}
    >
      <rect width={width} height={svgH} fill={zone.background || "#ffffff"} />
      {(zone.elements || [])
        .filter(e => e.type === "LOGO")
        .map((el, i) => {
          const cfg = (el as any).config || {};
          const lx = PAD_L + (cfg.x ?? 8) * scale;
          const ly = PAD_T + (cfg.y ?? 4) * scale;
          const lw = (cfg.width ?? 60) * scale;
          const lh = (cfg.height ?? 45) * scale;
          return (
            <g key={i}>
              <rect x={lx} y={ly} width={lw} height={lh} rx="2" fill={accent + "22"} stroke={accent + "55"} strokeWidth="0.5" />
              <text
                x={lx + lw / 2}
                y={ly + lh / 2 + 2.5}
                fontSize={lh * 0.28}
                fill={accent}
                textAnchor="middle"
                fontFamily="sans-serif"
                fontWeight="bold"
              >
                LOGO
              </text>
            </g>
          );
        })}
      {flowPositions.map(({ el, y, h }, i) => {
        const cfg = (el as any).config || {};
        const mgL = (cfg.margin?.left ?? 0) * scale;
        const mgR = (cfg.margin?.right ?? 0) * scale;
        const aln = cfg.align || "LEFT";
        const col = fontCol(cfg);
        const fw = cfg.bold ? "bold" : "normal";
        const fs = (cfg.fontSize ?? 10) * scale * 0.9;

        if (el.type === "SEPARATOR") {
          return (
            <line
              key={i}
              x1={mgL || 0}
              y1={y + h / 2}
              x2={width - mgR}
              y2={y + h / 2}
              stroke={cfg.color || accent}
              strokeWidth={Math.max(h, 0.5)}
            />
          );
        }

        let tx = mgL || PAD_L;
        let anchor = "start";
        if (aln === "CENTER" || aln === "JUSTIFIED") {
          tx = width / 2;
          anchor = "middle";
        } else if (aln === "RIGHT") {
          tx = width - (mgR || 0);
          anchor = "end";
        }

        let label = "";
        if (el.type === "TEXT") label = cfg.text || "";
        else if (el.type === "DATE_TIME") label = (cfg.text || "") + "2026-01-15";
        else if (el.type === "PAGE_NUMBER") label = "Page 1 of 1";

        if (label.length > 28) label = label.slice(0, 26) + "…";

        return (
          <text
            key={i}
            x={tx}
            y={y + h * 0.85}
            fontSize={Math.max(fs, 4.5)}
            fill={col}
            textAnchor={anchor as any}
            fontWeight={fw}
            fontStyle={cfg.italic ? "italic" : "normal"}
            fontFamily={cfg.font === "TIMES" ? "Georgia,serif" : "Arial,sans-serif"}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
