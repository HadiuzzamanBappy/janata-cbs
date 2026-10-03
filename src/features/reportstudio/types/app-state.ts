import type { BodyComponent, BodyRow } from "./body";
import type { PageConfig } from "./report-page";
import type { ReportVariable } from "./text-block";

/** Top-level studio state — the `present` value managed by the undo/redo reducer. */
export interface AppState {
  compressLevel: number;
  memoryReduce: boolean;
  page: PageConfig;
  bodyRows: BodyRow[];
  bodyComponents: BodyComponent[];
  /**
   * v5 central data store — named arrays referenced by
   * `BodyComponent.dataSourceKey`. Optional; falls back to legacy
   * `tableDataRows` when undefined.
   */
  centralData?: Record<string, any[]>;
  /**
   * v5.1 per-component data — keyed by `BodyComponent._id`. Preferred over
   * `centralData` for most use cases as it auto-namespaces per component.
   */
  componentDataSources?: Record<string, any[]>;
  /** v6.3 named variables that map to datasource columns. */
  reportVariables?: ReportVariable[];
}

/** Active selection in the canvas. */
export type Sel =
  | { type: "element"; zone: "header" | "footer"; id: string }
  | { type: "zone"; zone: "header" | "footer" }
  | { type: "multi"; zone: "header" | "footer"; ids: string[] }
  | { type: "bodycomp"; id: string }
  | { type: "bodyrow"; id: string }
  | null;

/** Left-sidebar tab — determines which sub-tree is editable. */
export type LeftTab = "header" | "footer" | "body" | "page";

/** Context-menu envelopes (the menus themselves live in `features/context-menu`). */
export interface CtxMenu {
  x: number;
  y: number;
  elId: string;
  zone: "header" | "footer";
  elType?: string;
}

export interface BodyCtxMenu {
  x: number;
  y: number;
  compId: string;
  compType?: import("./body").BodyCompType;
}
