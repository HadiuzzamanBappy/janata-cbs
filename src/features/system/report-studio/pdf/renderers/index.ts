/**
 * Barrel re-export for all PDF renderer modules.
 */
export { renderChart, type PageCtx as ChartPageCtx } from "./renderChart";
export { renderTable, type PageCtx as TablePageCtx } from "./renderTable";
export { renderTextBlock, type PageCtx as TextBlockPageCtx } from "./renderTextBlock";
export { renderZone, shouldRenderZone } from "./renderBand";
