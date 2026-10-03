import type { Align, Font, Spacing } from "./primitives";

/**
 * Zone-element configuration shapes.
 *
 * Each element kind (TEXT, LOGO, SEPARATOR, DATE_TIME, PAGE_NUMBER) has its
 * own config object. The `ZoneElement` envelope (see `./zone.ts`) carries
 * the `type` discriminator plus an `any`-typed `config` — keep that loose
 * shape because palette presets, templates, and legacy reports may carry
 * extra optional fields.
 */

export interface TextCfg {
  text: string;
  font: Font;
  bold: boolean;
  italic: boolean;
  fontSize: number;
  fontColor: string;
  align: Align;
  margin: Spacing;
  flexmove?: boolean;
  x?: number;
  y?: number;
  rotation?: number;
}

export interface LogoCfg {
  path: string;
  width: number;
  height: number;
  align: "LEFT" | "CENTER" | "RIGHT";
  margin: Spacing;
  x?: number;
  y?: number;
  rotation?: number;
  flexmove?: boolean;
}

export interface SepCfg {
  show: boolean;
  height: number;
  color: string;
  margin: Spacing;
  flexmove?: boolean;
  x?: number;
  y?: number;
  width?: number;
}

export interface DtCfg {
  text: string;
  format: string;
  font: Font;
  fontSize: number;
  fontColor: string;
  align: Align;
  margin: Spacing;
  flexmove?: boolean;
  x?: number;
  y?: number;
  rotation?: number;
}

export interface PnCfg {
  font: Font;
  fontSize: number;
  fontColor: string;
  align: Align;
  margin: Spacing;
  flexmove?: boolean;
  x?: number;
  y?: number;
  rotation?: number;
}

export type ElConfig = TextCfg | LogoCfg | SepCfg | DtCfg | PnCfg;
