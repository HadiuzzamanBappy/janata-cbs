import { useEffect, useRef } from "react";
import { PREVIEW_DATA_ROWS } from "../../constants/preview-data";
import { resolveCompData } from "../../data/resolveCompData";
import { ChartJS } from "../../lib/chart-register";
import type { BodyComponent } from "../../types/body";
import { mockValuesForSeries } from "../../utils/rand";

/**
 * Canvas-side preview of a CHART body component.
 *
 * Driven by a single `useEffect` keyed on every config-affecting prop. The
 * effect:
 *   1. Resolves the actual datasource (falls back to seeded mock values),
 *   2. Builds the dataset(s) — Chart.js bar/line use one dataset per series,
 *      pie/donut use one dataset per ring with a per-slice palette,
 *   3. Wires the inline data-labels plugin (no extra dependency),
 *   4. Destroys the prior chart instance and creates a fresh one.
 *
 * The Chart instance is exposed on the canvas DOM node via
 * `__chartInstance` so the PDF builder can grab it at higher DPR — this is
 * the same back-door the monolith uses; renaming it would break the PDF
 * path's chart capture.
 */
export function ChartPreview({
  comp,
  scale,
  selected: _selected,
  onClick: _onClick,
  componentDataSources,
  centralData,
}: {
  comp: BodyComponent;
  scale: number;
  selected: boolean;
  onClick: () => void;
  componentDataSources?: Record<string, any[]>;
  centralData?: Record<string, any[]>;
}) {
  const toPx = (v: number) => Math.round(v * scale);
  const type = comp.chartType || "bar";
  const series = comp.chartSeries || [{ label: "Series A", dataKey: "value", color: "#2563eb" }];

  const actualData = resolveCompData(comp, centralData, componentDataSources, PREVIEW_DATA_ROWS);

  const categories =
    comp.chartCategories && comp.chartCategories.length > 0
      ? comp.chartCategories
      : actualData.map((row: any) => row.category || row.label || "").filter(Boolean).length > 0
        ? actualData.map((row: any) => row.category || row.label || "")
        : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  const mockValsBySeries = series.map((s, i) => {
    const actualVals = actualData.map((row: any) => Number(row[s.dataKey]) || 0);
    return actualVals.some((v) => v > 0)
      ? actualVals
      : mockValuesForSeries(`${s.dataKey || s.label || "series"}-${i}`, categories.length);
  });

  const pieVals =
    type === "pie" || type === "donut"
      ? (() => {
          const firstSeriesKey = series[0]?.dataKey || "value";
          const actualPieVals = actualData.map((row: any) => Number(row[firstSeriesKey]) || 0);
          return actualPieVals.some((v) => v > 0)
            ? actualPieVals
            : mockValsBySeries[0] || [42, 78, 35, 91, 55, 68];
        })()
      : mockValsBySeries[0] || [42, 78, 35, 91, 55, 68];

  // Palette for pie/donut slice colours — series colours first, then a
  // built-in fallback so each slice always gets a distinct fill.
  const PIE_PALETTE = [
    "#2563eb",
    "#059669",
    "#dc2626",
    "#d97706",
    "#7c3aed",
    "#0891b2",
    "#db2777",
    "#65a30d",
    "#ea580c",
    "#4f46e5",
    "#0f766e",
    "#b45309",
    "#9333ea",
    "#0284c7",
    "#be123c",
  ];
  const sliceColors = (n: number) =>
    Array.from({ length: n }, (_, i) => series[i]?.color || PIE_PALETTE[i % PIE_PALETTE.length]);

  const tickFS = Math.max(8, toPx(5.5));
  const legendFS = Math.max(8, toPx(6));
  const dlFS = Math.max(8, toPx(6));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const isCategorical = type === "bar" || type === "line";

    const datasets = isCategorical
      ? series.map((s, i) => ({
          label: s.label,
          data: mockValsBySeries[i],
          backgroundColor: type === "line" ? `${s.color}33` : s.color,
          borderColor: s.color,
          borderWidth: type === "line" ? 2 : 0,
          borderRadius: type === "bar" ? 2 : 0,
          fill: type === "line",
          tension: type === "line" ? 0.35 : 0,
          pointBackgroundColor: "#fff",
          pointBorderColor: s.color,
          pointBorderWidth: 1.5,
          pointRadius: 3,
        }))
      : series.map((_s, idx) => {
          const seriesData = mockValsBySeries[idx] || pieVals;
          const palette = sliceColors(categories.length);
          return {
            label: _s.label,
            data: seriesData,
            backgroundColor: palette,
            hoverBackgroundColor: palette.map((c) => c + "cc"),
            borderColor: "#fff",
            borderWidth: 2,
            hoverOffset: 4,
          };
        });

    // Inline data-labels plugin. Uses 2D canvas API directly — no extra
    // dependency, no separate Chart.js plugin to register.
    const showValues = !!comp.chartShowValues;
    const dataLabelsPlugin = {
      id: "inlineDataLabels",
      afterDatasetsDraw: (chart: ChartJS) => {
        if (!showValues) return;
        const ctx = (chart as any).ctx as CanvasRenderingContext2D;
        ctx.save();
        ctx.font = `bold ${dlFS}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        chart.data.datasets.forEach((dataset, di) => {
          const meta = chart.getDatasetMeta(di);
          meta.data.forEach((element: any, i) => {
            const val = (dataset.data as number[])[i];
            if (val == null) return;
            const pos = element.tooltipPosition
              ? element.tooltipPosition()
              : { x: element.x, y: element.y };

            if (type === "bar") {
              ctx.fillStyle = (dataset.backgroundColor as string) || "#334155";
              ctx.textBaseline = "bottom";
              ctx.fillText(String(val), pos.x, pos.y - 3);
            } else if (type === "line") {
              ctx.fillStyle = (dataset.borderColor as string) || "#334155";
              ctx.textBaseline = "bottom";
              ctx.fillText(String(val), pos.x, pos.y - 5);
            } else {
              // pie / donut — category name + value horizontally at slice centre.
              ctx.fillStyle = "#fff";
              ctx.font = `bold ${dlFS}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              const categoryName = categories[i] || "";
              const value = String(val);

              const arc = element as any;
              const startAngle = arc.startAngle || 0;
              const endAngle = arc.endAngle || 0;
              const midAngle = (startAngle + endAngle) / 2;

              const outerRadius = arc.outerRadius || 100;
              const innerRadius = arc.innerRadius || 0;
              const textRadius = (outerRadius + innerRadius) / 2;

              const centerX = arc.x;
              const centerY = arc.y;

              const textX = centerX + Math.cos(midAngle) * textRadius;
              const textY = centerY + Math.sin(midAngle) * textRadius;

              ctx.fillText(categoryName, textX, textY - dlFS * 0.6);

              ctx.font = `${dlFS - 1}px sans-serif`;
              ctx.fillText(value, textX, textY + dlFS * 0.5);
            }
          });
        });
        ctx.restore();
      },
    };

    const chartType: any = type === "donut" ? "doughnut" : type;
    const isPieOrDonut = type === "pie" || type === "donut";

    const config: any = {
      type: chartType,
      data: { labels: categories, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            display: !!comp.chartShowLegend,
            position: "bottom",
            labels: isPieOrDonut
              ? {
                  generateLabels: (_chart: any) => {
                    const palette = sliceColors(categories.length);
                    return categories.map((cat: string, i: number) => ({
                      text: cat,
                      fillStyle: palette[i % palette.length],
                      strokeStyle: "#fff",
                      lineWidth: 2,
                      hidden: false,
                      index: i,
                    }));
                  },
                  font: { size: legendFS },
                  color: "#475569",
                  boxWidth: legendFS,
                  boxHeight: legendFS,
                  padding: toPx(4),
                }
              : {
                  font: { size: legendFS },
                  color: "#475569",
                  boxWidth: legendFS,
                  boxHeight: legendFS,
                  padding: toPx(4),
                },
          },
          title: {
            display: !!comp.chartTitle,
            text: comp.chartTitle || "",
            font: {
              size: Math.max(9, Math.round((comp.chartTitleFontSize ?? 12) * scale * 0.75)),
              weight: (comp.chartTitleBold ?? true) ? "bold" : "normal",
              style: (comp.chartTitleItalic ?? false) ? "italic" : "normal",
            },
            color: comp.chartTitleColor ?? "#1e293b",
            align: comp.chartTitleAlign ?? "center",
            padding: { top: toPx(2), bottom: toPx(3) },
          },
          tooltip: { enabled: false },
        },
        ...(isCategorical && {
          scales: {
            x: {
              grid: { display: !!comp.chartShowGrid, color: "#e2e8f0" },
              ticks: { display: true, font: { size: tickFS }, color: "#64748b" },
              border: { display: false },
            },
            y: {
              display: !!comp.chartShowScale,
              beginAtZero: true,
              grid: { display: !!comp.chartShowGrid, color: "#e2e8f0" },
              ticks: {
                display: !!comp.chartShowScale,
                font: { size: tickFS },
                color: "#94a3b8",
                maxTicksLimit: 6,
                precision: 0,
              },
              border: { display: false },
            },
          },
        }),
        ...((type === "pie" || type === "donut") && {
          spacing: series.length > 1 ? 3 : 0,
          ...(type === "donut" && { cutout: "55%" }),
        }),
      },
      plugins: [dataLabelsPlugin],
    };

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new ChartJS(canvasRef.current, config);
    // Back-door for the PDF builder — preserved from the monolith. The PDF
    // path reads this off the canvas DOM node when capturing the chart at
    // higher DPR than the on-screen render.
    (canvasRef.current as any).__chartInstance = chartRef.current;

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    type,
    JSON.stringify(series),
    JSON.stringify(categories),
    comp.chartShowLegend,
    comp.chartShowGrid,
    comp.chartShowScale,
    comp.chartShowValues,
    comp.chartTitle,
    comp.chartTitleFontSize,
    comp.chartTitleBold,
    comp.chartTitleItalic,
    comp.chartTitleColor,
    comp.chartTitleAlign,
    comp.chartBg,
    tickFS,
    legendFS,
    dlFS,
    JSON.stringify(componentDataSources?.[comp._id]),
    JSON.stringify(centralData?.[comp.dataSourceKey || ""]),
  ]);

  return (
    <div
      style={{
        background: comp.chartBg || "#fff",
        borderRadius: 4,
        overflow: "hidden",
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: toPx(4),
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "relative", flex: 1, minHeight: 0, width: "100%" }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
