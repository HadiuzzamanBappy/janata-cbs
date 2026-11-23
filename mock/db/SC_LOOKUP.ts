import type { AuditData } from "@/lib/data-schemas";
import type { CbsVersionedTable } from "./types";

export interface LookupItem {
  itemCode: string;
  itemLabel: string;
  isActive: boolean;
}

export interface LookupRecord {
  itemArray: LookupItem[];
  auditData?: AuditData;
}

/**
 * SC_LOOKUP Database Table (PREFIX: SC, TABLE: LOOKUP)
 * Centralized banking lookup repository for multi-category dropdown codes.
 */
export const SC_LOOKUP: Record<string, LookupRecord> = {
  GENDER: {
    auditData: {
      recStatus: "AU",
      recCurrNumber: 2,
      recInputter: "SYSADMIN",
      recInputTime: "2026-11-23 08:17:17",
      recAuthorizer: "SYSADMIN",
      recAuthTime: "2026-11-23 08:17:42",
      recBranchCode: "JB9999",
    },
    itemArray: [
      {
        itemCode: "M",
        itemLabel: "MALE",
        isActive: false,
      },
      {
        itemCode: "F",
        itemLabel: "FEMALE",
        isActive: false,
      },
      {
        itemCode: "T",
        itemLabel: "THIRD GENDER",
        isActive: false,
      },
    ],
  },
};

export const SC_LOOKUP_INAU: Record<string, LookupRecord> = {};
export const SC_LOOKUP_HIS: Record<string, LookupRecord[]> = {};
export const SC_LOOKUP_DEL: Record<string, LookupRecord> = {};

export const SC_LOOKUP_TABLE: CbsVersionedTable<LookupRecord> = {
  LIVE: SC_LOOKUP,
  INAU: SC_LOOKUP_INAU,
  HIS: SC_LOOKUP_HIS,
  DEL: SC_LOOKUP_DEL,
};
