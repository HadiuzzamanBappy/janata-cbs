/**
 * Canonical CBS UI Screen & Workspace Presentation Modes
 */

import { CbsRecordFunction } from "./access";

/**
 * Resulting UI screen display mode:
 * "IDLE" or standard RIDASHL code ("S" | "I" | "D" | "A" | "R" | "H" | "L")
 */
export const CBS_SCREEN_MODES = ["IDLE", ...Object.values(CbsRecordFunction)] as const;
export type CbsScreenMode = "IDLE" | CbsRecordFunction;

/**
 * Workspace rendering display targets:
 *  - panel: Embedded inside workbench tabbed interface
 *  - window: Detached standalone browser popup window
 */
export const WORKSPACE_DISPLAY_MODES = ["panel", "window"] as const;
export type WorkspaceDisplayMode = (typeof WORKSPACE_DISPLAY_MODES)[number];
