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
 * Model Configuration Record Schema (stored in MODEL.CONFIG or SC_MODEL_DEFINITION)
 * Mirrors real Core Banking table dictionary metadata.
 */
export const modelConfigRecordSchema = z.object({
  recordId: z.string().min(1, "Model Table ID is required"),
  tableName: z.string().default(""),
  description: z.string().min(1, "Description is required"),
  prefix: z.string().default(""),
  category: z.string().default(""),
  servicePath: z.string().default(""),
  userDefineId: z.boolean().default(false),
  predefineId: z.boolean().default(false),
  access: z.string().default(""),
  searchable: z.boolean().default(false),
  readOnly: z.boolean().default(false),
  authorize: z.boolean().default(false),
  associates: z.array(z.string()).default([]),
  devBy: z.string().default(""),
  devDate: z.string().default(""),
  idDef: z
    .object({
      idPrefix: z.string().default(""),
      idPattern: z.string().default(""),
      sequenceLength: z.union([z.number(), z.string()]).optional(),
      sequenceReset: z.boolean().default(false),
    })
    .default({ idPrefix: "", idPattern: "", sequenceReset: false }),
  properties: z.array(modelPropertySchema).default([]),
  isActive: z.boolean().default(false),
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
