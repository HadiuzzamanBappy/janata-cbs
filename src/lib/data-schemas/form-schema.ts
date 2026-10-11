import { z } from "zod";
import { type EnquiryColumn, enquiryColumnSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Raw gRPC Payload Schemas (Boundary Validation for GMC)                     */
/* -------------------------------------------------------------------------- */

/** Validates raw field property definitions emitted by the CBS GMC backend. */
export const rawPropertyRecordSchema = z.object({
  name: z.string().optional(),
  label: z.string().optional(),
  type: z.string().optional(),
  required: z.union([z.boolean(), z.string()]).optional(),
  disabled: z.union([z.boolean(), z.string()]).optional(),
  length: z.union([z.number(), z.string()]).optional(),
  structure: z.string().optional(),
  width: z.union([z.number(), z.string()]).optional(),
  position: z.string().optional(),
  parameter: z.string().optional(),
  enrichText: z.string().optional(),
  value: z.unknown().optional(),
  isOpen: z.boolean().optional(),
  isLoading: z.boolean().optional(),
  prop: z.array(z.unknown()).optional(),
  datasource: z.array(z.string()).optional(),
  sn: z.union([z.string(), z.number()]).optional(),
});

export type RawPropertyRecord = z.infer<typeof rawPropertyRecordSchema>;

/**
 * Recursive raw configuration envelope for Generic Model Configuration (GMC).
 * Holds data dictionary attributes, ID generation specs, and property lists.
 */
export type RawPropertyConfigRecord = {
  record?: RawPropertyConfigRecord;
  devBy?: string;
  devDate?: string;
  description?: string;
  prefix?: string;
  tableName?: string;
  userDefineId?: boolean;
  access?: string;
  readOnly?: boolean;
  searchable?: boolean;
  associates?: string[];
  authorize?: boolean;
  servicePath?: string;
  idDef?: {
    idPrefix?: string;
    sequenceLength?: string | number;
    sequenceReset?: boolean;
    idPattern?: string;
  };
  properties?: RawPropertyRecord[];
  columns?: EnquiryColumn[];
  auditData?: Record<string, unknown>;
};

export const rawPropertyConfigSchema: z.ZodType<RawPropertyConfigRecord> = z.lazy(() =>
  z.object({
    record: rawPropertyConfigSchema.optional(),
    devBy: z.string().optional(),
    devDate: z.string().optional(),
    description: z.string().optional(),
    prefix: z.string().optional(),
    tableName: z.string().optional(),
    userDefineId: z.boolean().optional(),
    access: z.string().optional(),
    readOnly: z.boolean().optional(),
    searchable: z.boolean().optional(),
    associates: z.array(z.string()).optional(),
    authorize: z.boolean().optional(),
    servicePath: z.string().optional(),
    idDef: z
      .object({
        idPrefix: z.string().optional(),
        sequenceLength: z.union([z.string(), z.number()]).optional(),
        sequenceReset: z.boolean().optional(),
        idPattern: z.string().optional(),
      })
      .optional(),
    properties: z.array(rawPropertyRecordSchema).optional(),
    columns: z.array(enquiryColumnSchema).optional(),
    auditData: z.record(z.string(), z.unknown()).optional(),
  }),
);

/* -------------------------------------------------------------------------- */
/* Canonical Internal UI & Domain Schemas (Form & Enquiry Specs)              */
/* -------------------------------------------------------------------------- */

/** Supported input field types for generic dynamic forms. */
export const fieldTypeSchema = z.enum(["text", "number", "date", "select"]);
export type FieldType = z.infer<typeof fieldTypeSchema>;

/** Responsive grid column width allocation for dynamic form fields. */
export const fieldWidthSchema = z.enum(["xs", "sm", "md", "lg"]);
export type FieldWidth = z.infer<typeof fieldWidthSchema>;

/** Canonical UI specification for a single dynamic input field. */
export const formFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: fieldTypeSchema.default("text"),
  width: fieldWidthSchema.default("md"),
  required: z.boolean().default(false),
  readOnly: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;

/** Complete canonical UI form definition for CBS maintenance screens. */
export const formSchemaSchema = z.object({
  code: z.string(),
  title: z.string(),
  idPrefix: z.string(),
  fields: z.array(formFieldSchema),
  columns: z.array(enquiryColumnSchema).optional(),
});

export type FormSchema = z.infer<typeof formSchemaSchema>;
