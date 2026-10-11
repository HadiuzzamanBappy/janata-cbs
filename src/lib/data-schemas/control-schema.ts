import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Raw gRPC Payload Schemas (Boundary Validation for Controls)                */
/* -------------------------------------------------------------------------- */

export const rawControlRecordSchema = z.object({
  recordId: z.string(),
  controlName: z.string().optional(),
  description: z.string().optional(),
  auditData: auditDataSchema.optional(),
});

export type RawControlRecord = z.infer<typeof rawControlRecordSchema>;

/* -------------------------------------------------------------------------- */
/* Canonical Domain Command / Control Action Types                            */
/* -------------------------------------------------------------------------- */

export const commandActionTypeSchema = z.enum(["SCREEN", "SETTINGS", "THEME", "LOGOUT"]);
export type CommandActionType = z.infer<typeof commandActionTypeSchema>;

/* -------------------------------------------------------------------------- */
/* Lean CBS Command Item & Navigation Contract                                */
/* -------------------------------------------------------------------------- */

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
