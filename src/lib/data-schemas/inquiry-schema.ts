import { z } from "zod";
import { auditDataSchema, enquiryColumnSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Raw gRPC Payload Schemas for Enquiry                                       */
/* -------------------------------------------------------------------------- */

/** Validates raw CBS enquiry header metadata (`INQInfo`) from gRPC responses. */
export const rawInqInfoSchema = z.object({
  description: z.string().nullable().optional(),
  pageOrientation: z.string().nullable().optional(),
  perpageItem: z.union([z.string(), z.number()]).nullable().optional(),
  showSerial: z.boolean().nullable().optional(),
  showPagination: z.boolean().nullable().optional(),
  showBranchWise: z.boolean().nullable().optional(),
  inqType: z.string().nullable().optional(),
  controllerName: z.string().nullable().optional(),
  rptControllerName: z.string().nullable().optional(),
  fixedSelection: z.string().nullable().optional(),
  inqServicePath: z.string().nullable().optional(),
  cmdFromInternal: z.boolean().nullable().optional(),
  cmdFieldName: z.string().nullable().optional(),
});

export type RawInqInfo = z.infer<typeof rawInqInfoSchema>;

/** Validates raw criteria selection filter fields (`INQSelectField`). */
export const rawInqSelectFieldSchema = z.object({
  selectFieldName: z.string(),
  selectFieldType: z.string().optional(),
  selectFieldOperator: z.string().optional(),
  selectFieldOperatorFixed: z.string().optional(),
  selectFieldDisplay: z.string().optional(),
  selectFieldValue: z.string().optional(),
  selectFieldRequired: z.boolean().optional(),
});

export type RawInqSelectField = z.infer<typeof rawInqSelectFieldSchema>;

/** Validates raw column definitions (`INQDef`) returned by the inquiry engine. */
export const rawInqDefSchema = z.object({
  fieldName: z.string(),
  fieldType: z.string().optional(),
  fieldFunc: z.string().optional(),
  fieldRowCol: z.string().optional(),
  fieldLength: z.string().optional(),
  fieldDisplay: z.string().optional(),
  dataPassable: z.union([z.boolean(), z.null()]).optional(),
});

export type RawInqDef = z.infer<typeof rawInqDefSchema>;

/** Validates raw row-level drilldown command buttons (`INQCmds`). */
export const rawInqCmdSchema = z.object({
  cmdFor: z.string().optional(),
  cmdButton: z.string().optional(),
});

export type RawInqCmd = z.infer<typeof rawInqCmdSchema>;

/** Complete top-level raw wire envelope for CBS Enquiry responses. */
export const rawEnquiryWireSchema = z.object({
  recordId: z.string(),
  auditData: auditDataSchema.optional(),
  INQInfo: rawInqInfoSchema.optional(),
  INQSelectField: z.array(rawInqSelectFieldSchema).optional(),
  INQDef: z.array(rawInqDefSchema).optional(),
  INQCmds: z.array(rawInqCmdSchema).optional(),
});

export type RawEnquiryWire = z.infer<typeof rawEnquiryWireSchema>;

/* -------------------------------------------------------------------------- */
/* Canonical Internal UI & Domain Schemas for Enquiry                          */
/* -------------------------------------------------------------------------- */

/**
 * Supported comparison filter operators for inquiry criteria.
 * (EQ: Equal, LK: Like, RG: Range, NE: Not Equal, GT: Greater, LT: Less, CT: Contains).
 */
export const selectionOperandSchema = z.enum(["EQ", "LK", "RG", "NE", "GT", "LT", "CT"]);
export type SelectionOperand = z.infer<typeof selectionOperandSchema>;

/** Canonical user filter field displayed in the search panel of an enquiry screen. */
export const selectionFieldSchema = z.object({
  id: z.string().default(""),
  label: z.string().default(""),
  type: z.enum(["text", "select", "date", "number"]),
  operand: selectionOperandSchema,
  value: z.string().default(""),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  required: z.boolean().optional(),
});

export type SelectionField = z.infer<typeof selectionFieldSchema>;

/** Action command button attached to inquiry result rows for drilldown execution. */
export const enquiryCommandSchema = z.object({
  cmdButton: z.string(),
  cmdFor: z.string().optional(),
});

export type EnquiryCommand = z.infer<typeof enquiryCommandSchema>;

/** Dynamic tabular data row returned by the CBS Enquiry execution engine. */
export const enquiryRowSchema = z
  .object({
    id: z.string(),
  })
  .passthrough();

export type EnquiryRow = z.infer<typeof enquiryRowSchema> & {
  [key: string]: unknown;
};

/** Full canonical specification contract for a CBS Enquiry workspace screen. */
export const enquirySchemaSchema = z.object({
  code: z.string(),
  title: z.string(),
  description: z.string().optional(),
  controllerName: z.string().optional(),
  inqServicePath: z.string().optional(),
  perpageItem: z.number().default(30),
  showSerial: z.boolean().default(true),
  showPagination: z.boolean().default(true),
  showBranchWise: z.boolean().default(false),
  selectionFields: z.array(selectionFieldSchema),
  columns: z.array(enquiryColumnSchema),
  commands: z.array(enquiryCommandSchema).optional(),
  sampleData: z.array(enquiryRowSchema).optional(),
});

export type EnquirySchema = z.infer<typeof enquirySchemaSchema>;
