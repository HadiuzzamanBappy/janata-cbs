import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Domain Command / Control Action Types                            */
/* -------------------------------------------------------------------------- */

/** Action classification for quick launcher and keyboard navigation commands. */
export const commandActionTypeSchema = z.enum(["SCREEN", "SETTINGS", "THEME", "LOGOUT"]);
export type CommandActionType = z.infer<typeof commandActionTypeSchema>;

/* -------------------------------------------------------------------------- */
/* Lean CBS Command Item & Navigation Contract (Runtime & UI)                 */
/* -------------------------------------------------------------------------- */

/**
 * Runtime command definition for CBS Command Bar and Terminal Launcher.
 * Clean, lean UI contract without database persistence fields.
 */
export const systemCommandItemSchema = z.object({
  command: z.string(),
  title: z.string(),
  aliases: z.array(z.string()),
  actionType: commandActionTypeSchema,
});

export type SystemCommandItem = z.infer<typeof systemCommandItemSchema>;

/* -------------------------------------------------------------------------- */
/* CBS Control Table Record Schema (Database Persistence)                     */
/* -------------------------------------------------------------------------- */

/**
 * Validates persistent control table records stored in database / gRPC (SC_CONTROL).
 * Extends the canonical command contract with CBS maker-checker auditData.
 */
export const rawControlRecordSchema = systemCommandItemSchema.extend({
  auditData: auditDataSchema,
});

export type RawControlRecord = z.infer<typeof rawControlRecordSchema>;
