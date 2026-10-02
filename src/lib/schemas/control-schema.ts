import { z } from "zod";

/**
 * Universal Command / Control Action Types
 */
export const commandActionTypeSchema = z.enum(["SCREEN", "SETTINGS", "THEME", "LOGOUT"]);
export type CommandActionType = z.infer<typeof commandActionTypeSchema>;

/**
 * Universal CBS Control Record & System Command Domain Schema
 */
export const systemCommandItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  command: z.string(),
  componentName: z.string().optional(),
  allowedRoles: z.array(z.string()).default(["*"]),
  actionType: commandActionTypeSchema.default("SCREEN"),
  settingsTabId: z.string().optional(),
});

export type SystemCommandItem = z.infer<typeof systemCommandItemSchema>;
export type ControlRecord = SystemCommandItem;
