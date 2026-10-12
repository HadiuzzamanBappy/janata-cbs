import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Domain Schemas & Contracts for User Group & Permissions          */
/* Table: USER.GROUP (SYS_USER_GROUP)                                         */
/* -------------------------------------------------------------------------- */

/** Menu catalog item reference associated with a user security group. */
export const menuRefSchema = z.object({
  menuId: z.string().min(1, "Menu ID is required"),
  label: z.string().min(1, "Menu Label is required"),
  command: z.string().default(""),
  menuType: z.string().optional(),
});

export type MenuRef = z.infer<typeof menuRefSchema>;

/** Security role descriptor defining banking authorization scopes and function privileges. */
export const roleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
  roleCode: z.string().min(1, "Role Code is required"),
  roleDesc: z.string().min(1, "Role Description is required"),
});

export type Role = z.infer<typeof roleSchema>;

/* -------------------------------------------------------------------------- */
/* User Group Record Schema (Persisted in USER.GROUP control table)           */
/* -------------------------------------------------------------------------- */

/** User authorization group profile record persisted in the `USER.GROUP` control table. */
export const userGroupRecordSchema = z.object({
  recordId: z.string().min(1, "Group ID is required"),
  groupLabel: z.string().min(1, "Group Label is required"),
  menuIds: z.array(z.string()).default([]),
  roleIds: z.array(z.string()).default([]),
  isActive: z.boolean().optional(),
  auditData: auditDataSchema.optional(),
});

export type UserGroupRecord = z.infer<typeof userGroupRecordSchema>;

/* -------------------------------------------------------------------------- */
/* User Group Screen Validation Errors                                        */
/* -------------------------------------------------------------------------- */

/** User Group screen validation error mapped to tab headers and field keys. */
export interface UserGroupValidationError {
  id: string;
  tab: "general" | "matrix" | "audit";
  fieldKey: string;
  message: string;
}
