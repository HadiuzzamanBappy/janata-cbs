import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * STATIC_CONTROL_RESPONSE contains core banking command controls with auditData preserved
 * from CBS normalized wire format (.response/control.normalized.json).
 * Pure data constant only — no parsers or business logic.
 */
export const STATIC_CONTROL_RESPONSE: GrpcResponse = {
  status: "SUCCESS",
  statusCode: 200,
  idempotencyKey: "",
  message: "record successfully processed!",
  errors: [],
  timestamp: "2026-10-01T09:07:15.421489436Z",
  data: {
    records: [
      {
        recordId: "AC.GROUP.ID",
        auditData: {
          recStatus: "",
          recCurrNumber: 0,
          recInputter: "",
          recInputTime: "",
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "",
        },
        description: "Account Group ID",
        controlName: "AC.GROUP.ID",
      },
      {
        recordId: "ACCOUNT",
        auditData: {
          recStatus: "",
          recCurrNumber: 0,
          recInputter: "",
          recInputTime: "",
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "",
        },
        description: "Account",
        controlName: "ACCOUNT",
      },
      {
        recordId: "ACCOUNT.ENTRY",
        auditData: {
          recStatus: "",
          recCurrNumber: 0,
          recInputter: "",
          recInputTime: "",
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "",
        },
        description: "Accounting Entry",
        controlName: "ACCOUNT.ENTRY",
      },
      {
        recordId: "AE",
        auditData: {
          recStatus: "",
          recCurrNumber: 0,
          recInputter: "",
          recInputTime: "",
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "",
        },
        description: "Accounting Entry",
        controlName: "ACCOUNT.ENTRY",
      },
      {
        recordId: "BANK.DATE",
        auditData: {
          recStatus: "",
          recCurrNumber: 0,
          recInputter: "",
          recInputTime: "",
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "",
        },
        description: "Bank Date",
        controlName: "BANK.DATE",
      },
      {
        recordId: "BRANCH",
        auditData: {
          recStatus: "",
          recCurrNumber: 0,
          recInputter: "",
          recInputTime: "",
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "",
        },
        description: "Branch",
        controlName: "BRANCH",
      },
      {
        recordId: "CASH.TRANSFER",
        auditData: {
          recStatus: "",
          recCurrNumber: 0,
          recInputter: "",
          recInputTime: "",
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "",
        },
        description: "Cash Transfer",
        controlName: "CASH.TRANSFER",
      },
      {
        recordId: "CATEGORY",
        auditData: {
          recStatus: "",
          recCurrNumber: 0,
          recInputter: "",
          recInputTime: "",
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "",
        },
        description: "Category",
        controlName: "CATEGORY",
      },
      {
        recordId: "CLIENT.ACTIVITY",
        auditData: {
          recStatus: "",
          recCurrNumber: 1,
          recInputter: "ADMIN02",
          recInputTime: "2026-07-21 06:29:03",
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "JB9999",
        },
        description: "Control for CLIENT.ACTIVITY",
        controlName: "CLIENT.ACTIVITY",
      },
      {
        recordId: "CMD",
        auditData: {
          recStatus: "",
          recCurrNumber: 0,
          recInputter: "",
          recInputTime: "",
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "",
        },
        description: "Command Control List",
        controlName: "SC.CONTROL.LIST",
      },
    ],
  },
};

export const STATIC_COMMANDS = STATIC_CONTROL_RESPONSE;
