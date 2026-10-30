/**
 * Centralized Banking Theme & Accent Registry for Janata CBS.
 * Single source of truth for color presets, cookies, and tokens.
 */

import { clientConfig } from "./client";

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  previewColor: string;
}

export const CBS_THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: "color",
    name: "Janata Brand (Cyan)",
    description: "Core enterprise financial cyan",
    previewColor: "#00adee",
  },
  {
    id: "bw",
    name: "Monochrome (B&W)",
    description: "High contrast financial terminal",
    previewColor: "#18181b",
  },
] as const;

export type CbsThemeAccent = (typeof CBS_THEME_PRESETS)[number]["id"];

export const DEFAULT_THEME_ACCENT: CbsThemeAccent = "color";

export const THEME_COOKIE_NAME = clientConfig.storage.cookies.themeAccent;
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
