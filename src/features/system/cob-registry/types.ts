import { z } from "zod";

/**
 * COB Stage Definition Schema
 */
export const cobStageRegistrySchema = z.object({
  cobStage: z.string(),
  description: z.string(),
  serviceName: z.array(z.string()).default([]),
});

export type CobStageRegistry = z.infer<typeof cobStageRegistrySchema>;

/**
 * COB Master Registry Record Schema (COB.REGISTRY table)
 */
export const cobRegistryRecordSchema = z.object({
  recordId: z.string().min(1, "Record ID is required"),
  description: z.string().default("Close of Business Batch Pipeline"),
  isActive: z.boolean().default(true),
  registries: z.array(cobStageRegistrySchema).default([]),
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

export type CobRegistryRecord = z.infer<typeof cobRegistryRecordSchema>;

export type CobScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";
