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
  description: z.string().optional().default(""),
  command: z.string(),
  aliases: z.array(z.string()).optional().default([]),
  recordId: z.string().optional(),
  controlName: z.string().optional(),
  componentName: z.string().optional(),
  allowedRoles: z.array(z.string()).optional().default(["*"]),
  actionType: commandActionTypeSchema.optional().default("SCREEN"),
  settingsTabId: z.string().optional(),
});

export interface SystemCommandItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  command: string;
  aliases?: string[];
  recordId?: string;
  controlName?: string;
  componentName?: string;
  allowedRoles?: string[];
  actionType?: CommandActionType;
  settingsTabId?: string;
}

export type ControlRecord = SystemCommandItem;
