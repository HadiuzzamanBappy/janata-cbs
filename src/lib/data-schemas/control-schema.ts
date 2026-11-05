import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* 1. Canonical Domain Command / Control Action Types                         */
/* -------------------------------------------------------------------------- */

/**
 * Canonical Action Type classification for CBS Commands and Controls:
 * - SCREEN: Standard Workspace Tab
 * - POPUP: Multi-monitor Detached Window
 * - SETTINGS: Application Settings Dialog
 */
export const commandActionTypeSchema = z.enum(["SCREEN", "POPUP", "SETTINGS"]);
export type CommandActionType = z.infer<typeof commandActionTypeSchema>;

/* -------------------------------------------------------------------------- */
/* 2. Unified Control & System Command Schema                                 */
/* -------------------------------------------------------------------------- */

/**
 * Universal runtime command & control schema.
 * Sanitizes both static UI catalog items and commands retrieved from SC_CONTROL.
 * Pure navigation/command contract containing strictly what the search bar &
 * terminal router need (command, title, aliases, actionType).
 * Form engines handle their own audit data when the actual form opens.
 */
export const controlCommandSchema = z.object({
  command: z.string().trim().min(1, "Command identifier is required"),
  title: z.string().trim().min(1, "Command title is required"),
  aliases: z.array(z.string()).default([]),
  actionType: commandActionTypeSchema.default("SCREEN"),
});

export type ControlCommand = z.infer<typeof controlCommandSchema>;
