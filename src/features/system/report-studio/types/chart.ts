/**
 * Chart-related types. The chart-rendering surface itself lives in
 * `features/chart/` and `pdf/renderers/renderChart.ts` — this file holds
 * only the small data shapes shared across modules.
 */

export type ChartType = "bar" | "line" | "pie" | "donut";

/** Title alignment uses lower-case strings (mirrors Chart.js' canvas API). */
export type ChartTitleAlign = "left" | "center" | "right";

export interface ChartSeries {
  label: string;
  dataKey: string;
  color: string;
}
