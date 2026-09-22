import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Raw gRPC Payload Schemas (Boundary Validation)                             */
/* -------------------------------------------------------------------------- */

export const rawPropertyRecordSchema = z.object({
  NAME: z.string().optional(),
  LABEL: z.string().optional(),
  TYPE: z.string().optional(),
  REQUIRED: z.union([z.boolean(), z.string()]).optional(),
  DISABLED: z.union([z.boolean(), z.string()]).optional(),
  LENGTH: z.number().optional(),
  DATASOURCE: z.array(z.string()).optional(),
});

export type RawPropertyRecord = z.infer<typeof rawPropertyRecordSchema>;

export type RawPropertyConfigRecord = {
  record?: RawPropertyConfigRecord;
  DESCRIPTION?: string;
  TABLENAME?: string;
  IDDEF?: { IDPREFIX?: string };
  PROPERTIES?: RawPropertyRecord[];
};

export const rawPropertyConfigSchema: z.ZodType<RawPropertyConfigRecord> =
  z.lazy(() =>
    z.object({
      record: rawPropertyConfigSchema.optional(),
      DESCRIPTION: z.string().optional(),
      TABLENAME: z.string().optional(),
      IDDEF: z.object({ IDPREFIX: z.string().optional() }).optional(),
      PROPERTIES: z.array(rawPropertyRecordSchema).optional(),
    }),
  );

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

/* -------------------------------------------------------------------------- */
/* Canonical Internal UI Schemas (Form & Field Specs)                         */
/* -------------------------------------------------------------------------- */

export const fieldTypeSchema = z.enum(["text", "number", "date", "select"]);
export type FieldType = z.infer<typeof fieldTypeSchema>;

export const fieldWidthSchema = z.enum(["xs", "sm", "md", "lg"]);
export type FieldWidth = z.infer<typeof fieldWidthSchema>;

export const formFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: fieldTypeSchema.default("text"),
  width: fieldWidthSchema.default("md"),
  required: z.boolean().default(false),
  readOnly: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;

export const formSchemaSchema = z.object({
  code: z.string(),
  title: z.string(),
  idPrefix: z.string(),
  fields: z.array(formFieldSchema),
});

export type FormSchema = z.infer<typeof formSchemaSchema>;

export const menuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    menuId: z.number(),
    label: z.string(),
    command: z.string().optional(),
    children: z.array(menuItemSchema).optional(),
  }),
);

export interface MenuItem {
  id: string;
  menuId: number;
  label: string;
  command?: string;
  children?: MenuItem[];
}
