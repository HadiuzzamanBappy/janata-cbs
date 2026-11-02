import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* 1. SELECTION / FILTER FIELDS (INQSelectField)                              */
/* ========================================================================== */

export const inqSelectFieldSchema = z.object({
  selectFieldName: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  selectFieldType: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v : "text")),
  selectFieldOperator: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v : "EQ")),
  selectFieldOperatorFixed: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  selectFieldDisplay: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  selectFieldValue: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  selectFieldRequired: z
    .union([z.boolean(), z.string()])
    .nullish()
    .transform((v) => v === true || v === "true" || v === "Y"),
});

export type INQSelectField = z.infer<typeof inqSelectFieldSchema>;

/* ========================================================================== */
/* 2. COLUMN DEFINITION (INQDef)                                             */
/* ========================================================================== */

export const inqDefSchema = z.object({
  fieldName: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  fieldType: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v : "CH")),
  fieldFunc: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  fieldRowCol: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v : "1,1")),
  fieldLength: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v : "20,L")),
  fieldDisplay: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v : "")),
  dataPassable: z
    .union([z.string(), z.boolean()])
    .nullish()
    .transform((v) => (v == null ? null : v === true || v === "true" || v === "Y")),
});

export type INQDef = z.infer<typeof inqDefSchema>;

/* ========================================================================== */
/* 3. COMMAND ACTIONS (INQCmds)                                               */
/* ========================================================================== */

export const inqCmdSchema = z.object({
  cmdFor: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  cmdButton: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
});

export type INQCmd = z.infer<typeof inqCmdSchema>;

/* ========================================================================== */
/* 4. GENERAL INQUIRY INFO (INQInfo)                                          */
/* ========================================================================== */

export const inqInfoSchema = z.object({
  description: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  pageOrientation: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v : "Portrait")),
  perpageItem: z
    .union([z.string(), z.number()])
    .nullish()
    .transform((val) => (val != null && String(val).trim() !== "" ? String(val) : "30")),
  showSerial: z
    .union([z.boolean(), z.string()])
    .nullish()
    .transform((v) => v === true || v === "true" || v === "Y"),
  showPagination: z
    .union([z.boolean(), z.string()])
    .nullish()
    .transform((v) => v === true || v === "true" || v === "Y"),
  showBranchWise: z
    .union([z.boolean(), z.string()])
    .nullish()
    .transform((v) => v === true || v === "true" || v === "Y"),
  inqType: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v : "DFT")),
  controllerName: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  rptControllerName: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  fixedSelection: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  inqServicePath: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v : "default")),
  cmdFromInternal: z
    .union([z.boolean(), z.string()])
    .nullish()
    .transform((v) => v === true || v === "true" || v === "Y"),
  cmdFieldName: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
});

export type INQInfo = z.infer<typeof inqInfoSchema>;

/* ========================================================================== */
/* 5. CANONICAL INQUIRY RECORD SCHEMA (INQUIRY / INQUIRY.CONFIG)              */
/* ========================================================================== */

/**
 * 1:1 Canonical CBS Wire Data Schema matching actual backend inquiry table records.
 */
export const inquiryConfigRecordSchema = z
  .object({
    INQInfo: inqInfoSchema.default(() => ({
      description: "",
      pageOrientation: "Portrait",
      perpageItem: "30",
      showSerial: false,
      showPagination: false,
      showBranchWise: false,
      inqType: "DFT",
      controllerName: "",
      rptControllerName: "",
      fixedSelection: "",
      inqServicePath: "default",
      cmdFromInternal: false,
      cmdFieldName: "",
    })),
    INQSelectField: z
      .array(inqSelectFieldSchema)
      .nullish()
      .transform((v) => v ?? []),
    INQDef: z
      .array(inqDefSchema)
      .nullish()
      .transform((v) => v ?? []),
    INQCmds: z
      .array(inqCmdSchema)
      .nullish()
      .transform((v) => v ?? []),
    auditData: auditDataSchema.optional(),
    auditFields: auditDataSchema.optional(),
  })
  .transform((data) => {
    // Normalize auditFields into auditData if auditData is absent
    const audit = data.auditData ?? data.auditFields;
    return {
      INQInfo: data.INQInfo,
      INQSelectField: data.INQSelectField,
      INQDef: data.INQDef,
      INQCmds: data.INQCmds,
      ...(audit ? { auditData: audit } : {}),
    };
  });

export type InquiryConfigRecord = z.infer<typeof inquiryConfigRecordSchema>;

/* ========================================================================== */
/* 6. DATASET ROW / RESULT SCHEMA                                             */
/* ========================================================================== */

export const enquiryRowSchema = z.looseObject({
  id: z.string(),
});

export type EnquiryRow = z.infer<typeof enquiryRowSchema> & {
  [key: string]: unknown;
};
