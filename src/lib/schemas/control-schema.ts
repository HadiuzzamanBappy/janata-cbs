import { z } from "zod";

/**
 * Universal Command / Control Action Types
 */
export const commandActionTypeSchema = z.enum(["SCREEN", "SETTINGS", "THEME", "LOGOUT"]);
export type CommandActionType = z.infer<typeof commandActionTypeSchema>;

/**
 * Lean MVP CBS Command Item
 * Single source of truth:
 * - id: unique identifier
 * - title: user-facing title
 * - category: grouping header
 * - command: canonical command (e.g. "SC.MODEL.CONFIG", "ACCOUNT")
 * - aliases: max 1-2 shorthand aliases (e.g. ["MC"])
 * - actionType: "SCREEN" | "SETTINGS" | "THEME" | "LOGOUT"
 * - settingsTabId: optional tab for settings
 */
export const systemCommandItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  command: z.string(),
  aliases: z.array(z.string()).optional().default([]),
  actionType: commandActionTypeSchema.optional().default("SCREEN"),
  settingsTabId: z.string().optional(),
});

export type SystemCommandItem = z.infer<typeof systemCommandItemSchema>;
export type ControlRecord = SystemCommandItem;
