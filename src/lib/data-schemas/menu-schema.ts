import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Raw gRPC Menu Schemas (Boundary Validation)                                */
/* -------------------------------------------------------------------------- */

export type RawMenuRecord = {
  id?: string | number | null;
  menuId?: string | number | null;
  code?: string | null;
  label?: string | null;
  description?: string | null;
  menuName?: string | null;
  command?: string | null;
  application?: string | null;
  isVisible?: boolean | null;
  children?: RawMenuRecord[] | null;
  items?: RawMenuRecord[] | null;
};

export const rawMenuRecordSchema: z.ZodType<RawMenuRecord> = z.lazy(() =>
  z.object({
    id: z.union([z.string(), z.number()]).nullable().optional(),
    menuId: z.union([z.string(), z.number()]).nullable().optional(),
    code: z.string().nullable().optional(),
    label: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    menuName: z.string().nullable().optional(),
    command: z.string().nullable().optional(),
    application: z.string().nullable().optional(),
    isVisible: z.boolean().nullable().optional(),
    children: z.array(rawMenuRecordSchema).nullable().optional(),
    items: z.array(rawMenuRecordSchema).nullable().optional(),
  }),
);

/* -------------------------------------------------------------------------- */
/* Canonical Domain Menu Item Schemas                                         */
/* -------------------------------------------------------------------------- */

export interface MenuItem {
  id: string;
  menuId: number;
  label: string;
  command?: string;
  children?: MenuItem[];
}

export const menuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    menuId: z.number(),
    label: z.string(),
    command: z.string().optional(),
    children: z.array(menuItemSchema).optional(),
  }),
);
