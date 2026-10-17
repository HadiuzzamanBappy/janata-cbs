import type { UserGroupRecord } from "@/lib/data-schemas/user-group-schema";

/**
 * SC_USER_GROUP Table Master (PREFIX: SC, TABLE: USER_GROUP)
 * Holds security role and menu authorization mapping groups.
 */
export const SC_USER_GROUP_LIVE: Record<string, UserGroupRecord> = {
  "TELLER.GRP": {
    recordId: "TELLER.GRP",
    groupLabel: "Branch Frontline Tellers",
    menuIds: ["1", "4", "5", "6", "8", "9", "10"],
    roleIds: ["1", "3"],
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 10:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
  },
  "SUPERVISOR.GRP": {
    recordId: "SUPERVISOR.GRP",
    groupLabel: "Branch Authorizers & Supervisors",
    menuIds: ["1", "3", "4", "5", "6", "8", "9", "10", "11", "12"],
    roleIds: ["2", "4"],
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 10:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
  },
  "ADMIN.GRP": {
    recordId: "ADMIN.GRP",
    groupLabel: "System & Core Administrators",
    menuIds: [
      "1",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "32",
      "33",
      "34",
      "35",
      "36",
      "37",
      "38",
      "39",
      "40",
      "41",
      "42",
    ],
    roleIds: ["1", "2", "6"],
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 10:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
  },
  "AUDITOR.GRP": {
    recordId: "AUDITOR.GRP",
    groupLabel: "Internal Audit & Compliance",
    menuIds: ["2", "23", "29"],
    roleIds: ["5"],
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSTEM",
      recInputTime: "2026-01-01 10:00:00",
      recAuthorizer: "SYSTEM",
      recAuthTime: "2026-01-01 10:05:00",
      recBranchCode: "JB9999",
    },
  },
};

export const SC_USER_GROUP_LIST: UserGroupRecord[] = Object.values(SC_USER_GROUP_LIVE);

export function getUserGroupRecord(id: string): UserGroupRecord | null {
  const cleanId = id.trim().toUpperCase();
  return SC_USER_GROUP_LIVE[cleanId] ?? null;
}
