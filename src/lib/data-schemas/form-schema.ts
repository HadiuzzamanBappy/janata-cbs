import { z } from "zod";
import { type EnquiryColumn, enquiryColumnSchema } from "./common-schema";
import { formFieldItemSchema } from "./form-config-schema";

/* -------------------------------------------------------------------------- */
/* Raw gRPC Wire Payload Schemas (Boundary Validation for GMC)                */
/* -------------------------------------------------------------------------- */

/**
 * Validates raw field property definitions emitted by the CBS GMC backend.
 * These are wire-level types — do NOT use them as UI field descriptors.
 * UI field descriptors live in form-config-schema.ts (FormFieldItem).
 */
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
 * Wire-level only — parsed by form-parser.ts into FormFieldItem[].
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
/* Canonical Parsed Form Data Schema (Output of GMC Parser)                    */
/* -------------------------------------------------------------------------- */

export const parsedFormDataSchema = z.object({
  code: z.string(),
  title: z.string(),
  idPrefix: z.string().optional(),
  fields: z.array(formFieldItemSchema),
  columns: z.array(enquiryColumnSchema).optional(),
});

export type ParsedFormData = z.infer<typeof parsedFormDataSchema>;
