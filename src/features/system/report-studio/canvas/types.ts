import type { BodyCompType } from "../types/body";
import type { Zone, ZoneElement } from "../types/zone";

/**
 * Context-menu payload for header/footer zone element interactions.
 */
export interface CtxMenu {
  x: number;
  y: number;
  elId: string;
  zone: "header" | "footer";
  elType?: string;
}

/**
 * Context-menu payload for body component interactions.
 */
export interface BodyCtxMenu {
  x: number;
  y: number;
  compId: string;
  compType?: BodyCompType;
}

/**
 * Props for the BandCanvas component.
 */
export interface BandCanvasProps {
  zone: "header" | "footer";
  data: Zone;
  scale: number;
  selId: string | null;
  selRowId?: string | null;
  isZoneSel: boolean;
  multiSelIds?: string[];
  onSelEl: (id: string) => void;
  onSelRow: (rowId: string) => void;
  onMultiSel?: (ids: string[]) => void;
  onSelZone: () => void;
  onUpdateEl: (el: ZoneElement) => void;
  onUpdateElSilent: (el: ZoneElement) => void;
  onCommitElDrag: (el: ZoneElement) => void;
  onCommitMulti?: (els: ZoneElement[]) => void;
  onDeleteEl: (id: string) => void;
  onReorder: (els: ZoneElement[]) => void;
  onCtxMenu: (m: CtxMenu) => void;
}
