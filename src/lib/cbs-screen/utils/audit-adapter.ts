import type { CbsAuditFooterData, CbsAuditRawData } from "../types";

/**
 * Normalizes raw record audit data into standard CbsAuditFooter props
 */
export function formatAuditFooterData(
  raw?: CbsAuditRawData | null,
): CbsAuditFooterData | undefined {
  if (!raw) return undefined;
  return {
    recordStatus: raw.recStatus,
    currNo: raw.recCurrNumber,
    inputter: raw.recInputter,
    dateTime: raw.recAuthTime || raw.recInputTime,
    authoriser: raw.recAuthorizer,
    coCode: raw.recBranchCode,
  };
}
