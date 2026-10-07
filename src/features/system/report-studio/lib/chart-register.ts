import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend as ChartLegend,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  DoughnutController,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PieController,
  PointElement,
} from "chart.js";

/**
 * Module-level Chart.js component registration.
 *
 * Importing this module once anywhere in the app activates every controller
 * and element the studio uses (bar, line, pie, donut, plus their shared
 * helpers). The monolith did this side-effect at the top of the file; we
 * keep that semantics by exporting `ChartJS` from here so consumers can use
 * the same class instance.
 *
 * IMPORTANT: register only runs once at module load. Don't call it again.
 */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  ChartTitle,
  ChartTooltip,
  ChartLegend,
  Filler,
);

export { ChartJS };
