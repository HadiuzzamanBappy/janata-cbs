import { z } from "zod";

/**
 * CBS Branch Record Schema & Domain Model
 */
export const branchRecordSchema = z.object({
  recordId: z.string(),
  branchTitle: z.string(),
  branchAddress: z.string(),
  branchOpenDate: z.string(),
  currTxnDate: z.string(),
  divCode: z.string(),
  areaCode: z.string(),
});

export type BranchRecord = z.infer<typeof branchRecordSchema>;
