/**
 * Canonical CBS UI Screen & Workspace Presentation Modes
 */

import { CbsRecordFunction } from "./access";

/** Screen mode before any record function is chosen (search / landing state). */
export const CBS_IDLE_MODE = "IDLE" as const;
export type CbsIdleMode = typeof CBS_IDLE_MODE;

/**
 * Resulting UI screen display mode:
 * `CBS_IDLE_MODE` or standard RIDASHL code ("S" | "I" | "D" | "A" | "R" | "H" | "L")
 */
export const CBS_SCREEN_MODES = [CBS_IDLE_MODE, ...Object.values(CbsRecordFunction)] as const;
export type CbsScreenMode = CbsIdleMode | CbsRecordFunction;

/**
 * Workspace rendering display targets:
 *  - panel: Embedded inside workbench tabbed interface
 *  - window: Detached standalone browser popup window
 */
export const WORKSPACE_DISPLAY_MODES = ["panel", "window"] as const;
export type WorkspaceDisplayMode = (typeof WORKSPACE_DISPLAY_MODES)[number];
