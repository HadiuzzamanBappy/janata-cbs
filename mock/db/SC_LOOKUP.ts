import type { AuditData } from "@/lib/data-schemas";
import type { CbsVersionedTable } from "./types";

export interface LookupRecord {
  category: string;
  lookupCode: string;
  description: string;
  status?: string;
  auditData?: AuditData;
}

/**
 * SC_LOOKUP Database Table (PREFIX: SC, TABLE: LOOKUP)
 * Centralized banking lookup repository for multi-category dropdown codes.
 */
export const SC_LOOKUP: Record<string, LookupRecord> = {
  "TITLE.MR": {
    category: "TITLE",
    lookupCode: "MR",
    description: "Mr.",
    status: "ACTIVE",
  },
  "TITLE.MRS": {
    category: "TITLE",
    lookupCode: "MRS",
    description: "Mrs.",
    status: "ACTIVE",
  },
  "TITLE.MS": {
    category: "TITLE",
    lookupCode: "MS",
    description: "Ms.",
    status: "ACTIVE",
  },
  "TITLE.DR": {
    category: "TITLE",
    lookupCode: "DR",
    description: "Dr.",
    status: "ACTIVE",
  },
  "MARITAL.SINGLE": {
    category: "MARITAL_STATUS",
    lookupCode: "SINGLE",
    description: "Single",
    status: "ACTIVE",
  },
  "MARITAL.MARRIED": {
    category: "MARITAL_STATUS",
    lookupCode: "MARRIED",
    description: "Married",
    status: "ACTIVE",
  },
  "MARITAL.DIVORCED": {
    category: "MARITAL_STATUS",
    lookupCode: "DIVORCED",
    description: "Divorced",
    status: "ACTIVE",
  },
  "MARITAL.WIDOWED": {
    category: "MARITAL_STATUS",
    lookupCode: "WIDOWED",
    description: "Widowed",
    status: "ACTIVE",
  },
  "GENDER.M": {
    category: "GENDER",
    lookupCode: "M",
    description: "Male",
    status: "ACTIVE",
  },
  "GENDER.F": {
    category: "GENDER",
    lookupCode: "F",
    description: "Female",
    status: "ACTIVE",
  },
  "GENDER.O": {
    category: "GENDER",
    lookupCode: "O",
    description: "Other",
    status: "ACTIVE",
  },
  "SECTOR.RETAIL": {
    category: "SECTOR_CODE",
    lookupCode: "1001",
    description: "Retail Individual",
    status: "ACTIVE",
  },
  "SECTOR.CORP": {
    category: "SECTOR_CODE",
    lookupCode: "2001",
    description: "Corporate & Commercial",
    status: "ACTIVE",
  },
  "SECTOR.AGRI": {
    category: "SECTOR_CODE",
    lookupCode: "3001",
    description: "Agriculture & Rural",
    status: "ACTIVE",
  },
  "SECTOR.SME": {
    category: "SECTOR_CODE",
    lookupCode: "4001",
    description: "Small & Medium Enterprise",
    status: "ACTIVE",
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

export const SC_LOOKUP_LIST: LookupRecord[] = Object.values(SC_LOOKUP);
