import { z } from "zod";

/**
 * Menu Reference Schema (items loaded from MENU table)
 */
export const menuRefSchema = z.object({
  menuId: z.string(),
  label: z.string(),
  command: z.string().default(""),
});

export type MenuRef = z.infer<typeof menuRefSchema>;

/**
 * Role Schema (security roles)
 */
export const roleSchema = z.object({
  roleId: z.string(),
  roleCode: z.string(),
  roleDesc: z.string(),
});

export type Role = z.infer<typeof roleSchema>;

/**
 * User Group Record Schema (persisted in USER.GROUP table)
 */
export const userGroupRecordSchema = z.object({
  recordId: z.string().min(1, "Group ID is required"),
  groupLabel: z.string().min(1, "Group Label is required"),
  menuIds: z.array(z.string()).default([]),
  roleIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  auditData: z
    .object({
      recStatus: z.string().optional(),
      recCurrNumber: z.number().optional(),
      recInputter: z.string().optional(),
      recInputTime: z.string().optional(),
      recAuthorizer: z.string().optional(),
      recAuthTime: z.string().optional(),
      recBranchCode: z.string().optional(),
    })
    .optional(),
});

export type UserGroupRecord = z.infer<typeof userGroupRecordSchema>;

export type UserGroupScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";
