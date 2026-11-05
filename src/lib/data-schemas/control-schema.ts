import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* 1. Canonical Domain Command / Control Action Types                         */
/* -------------------------------------------------------------------------- */

/**
 * Action target for CBS command controls:
 * - "SCREEN": opens inside an integrated Workspace Tab
 * - "POPUP": opens inside a multi-monitor detached popup window
 * - "SETTINGS": opens application settings modal dialog
 */
export const controlActionSchema = z.enum(["SCREEN", "POPUP", "SETTINGS"]);
export type ControlAction = z.infer<typeof controlActionSchema>;

/**
 * Visual / functional classification for executable CBS commands:
 * - "FORM": Interactive input/maintenance form (GMC screen)
 * - "INQUIRY": Read-only query / inquiry screen
 * - "REPORT": Analytical or ledger report screen
 * - "SETTINGS": System configuration / preferences dialog
 * (Note: "GROUP" is a folder container in menus, not an executable command).
 */
export const controlTypeSchema = z.enum(["FORM", "INQUIRY", "REPORT", "SETTINGS"]);
export type ControlType = z.infer<typeof controlTypeSchema>;

/**
 * Universal runtime command & control schema.
 * Sanitizes both static UI catalog items and commands retrieved from SC_CONTROL / SC_MENU.
 * Provides `controlAction` (matching menuAction / settings) and `controlType` (matching menuType)
 * for dynamic icon display and launch routing.
 */
export const controlCommandSchema = z.object({
  command: z.string().trim().min(1, "Command identifier is required"),
  title: z.string().trim().min(1, "Command title is required"),
  aliases: z.array(z.string()).default([]),
  controlAction: controlActionSchema.default("SCREEN"),
  controlType: controlTypeSchema.default("FORM"),
});

export type ControlCommand = z.infer<typeof controlCommandSchema>;
