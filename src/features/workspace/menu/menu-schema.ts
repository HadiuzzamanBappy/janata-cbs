import { z } from "zod";

export type RawMenuRecord = {
  id?: string | number;
  menuId?: string | number;
  code?: string;
  label?: string;
  description?: string;
  menuName?: string;
  command?: string;
  application?: string;
  children?: RawMenuRecord[];
  items?: RawMenuRecord[];
};

export const rawMenuRecordSchema: z.ZodType<RawMenuRecord> = z.lazy(() =>
  z.object({
    id: z.union([z.string(), z.number()]).optional(),
    menuId: z.union([z.string(), z.number()]).optional(),
    code: z.string().optional(),
    label: z.string().optional(),
    description: z.string().optional(),
    menuName: z.string().optional(),
    command: z.string().optional(),
    application: z.string().optional(),
    children: z.array(rawMenuRecordSchema).optional(),
    items: z.array(rawMenuRecordSchema).optional(),
  }),
);

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
