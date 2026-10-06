import { z } from "zod";

export const propertyTypeSchema = z.enum([
  "Text",
  "Number",
  "Date",
  "Boolean",
  "Dropdown",
  "Checkbox",
  "Radio",
  "Textarea",
  "Object",
  "Array",
]);

export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const modelPropertySchema: z.ZodType<ModelPropertyOutput> = z.lazy(() =>
  z.object({
    sn: z.string(),
    name: z.string().min(1, "Field name is required"),
    label: z.string().min(1, "Field label is required"),
    type: propertyTypeSchema.default("Text"),
    structure: z.enum(["S", "M"]).default("S"), // S = Single value, M = Multi-value
    length: z.number().default(50),
    required: z.boolean().default(false),
    disabled: z.boolean().default(false),
    width: z.number().default(200),
    defaultValue: z.any().optional(),
    fixedValue: z.string().optional(),
    enrichText: z.string().optional(),
    options: z.array(z.string()).default([]), // For dropdowns/radios
    children: z.array(modelPropertySchema).default([]),
  }),
);

export type ModelPropertyOutput = {
  sn: string;
  name: string;
  label: string;
  type: PropertyType;
  structure: "S" | "M";
  length: number;
  required: boolean;
  disabled: boolean;
  width: number;
  defaultValue?: unknown;
  fixedValue?: string;
  enrichText?: string;
  options: string[];
  children: ModelPropertyOutput[];
};

export type ModelProperty = ModelPropertyOutput;

/**
 * Model Configuration Record Schema (stored in MODEL.CONFIG or SC.MODEL.CONFIG)
 */
export const modelConfigRecordSchema = z.object({
  recordId: z.string().min(1, "Model Table ID is required"),
  description: z.string().min(1, "Description is required"),
  tableName: z.string().default(""),
  category: z.string().default("APPLICATION"),
  properties: z.array(modelPropertySchema).default([]),
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

export type ModelConfigRecord = z.infer<typeof modelConfigRecordSchema>;

export type ModelConfigScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";
