import type { CbsVersionedTable } from "./types";

export type FundsTransferRecord = Record<string, unknown>;

/**
 * FT_FUNDS_TRANSFER Database Table (PREFIX: FT, TABLE: FUNDS_TRANSFER)
 * Stores retail & corporate intra-bank and inter-bank funds transfers.
 */
export const FT_FUNDS_TRANSFER: Record<string, FundsTransferRecord> = {
  FT260001: {
    transactionType: "AC",
    debitAccountId: "AC1001",
    debitCurrency: "BDT",
    debitAmount: 15000,
    creditAccountId: "AC1002",
    creditCurrency: "BDT",
    creditAmount: 15000,
    transactionDate: "2026-11-15",
    paymentDetails: "Invoice settlement for commercial goods",
    chargeAmount: 0,
    orderingCustomer: "MD. KAMRUL HASAN",
    beneficiaryCustomer: "NUSRAT JAHAN",
    branchCode: "JB1001",
    status: "ACTIVE",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 2,
      recInputter: "SYSADMIN",
      recInputTime: "2026-11-15 10:15:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-11-15 10:20:00",
      recBranchCode: "JB1001",
    },
  },
  FT260002: {
    transactionType: "AC",
    debitAccountId: "AC1002",
    debitCurrency: "BDT",
    debitAmount: 2500,
    creditAccountId: "AC1001",
    creditCurrency: "BDT",
    creditAmount: 2500,
    transactionDate: "2026-11-15",
    paymentDetails: "Monthly recurring subscription refund",
    chargeAmount: 0,
    orderingCustomer: "NUSRAT JAHAN",
    beneficiaryCustomer: "MD. KAMRUL HASAN",
    branchCode: "JB1001",
    status: "ACTIVE",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-11-15 11:30:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-11-15 11:35:00",
      recBranchCode: "JB1001",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const FT_FUNDS_TRANSFER_INAU: Record<string, FundsTransferRecord> = {
  FT260003: {
    transactionType: "AC",
    debitAccountId: "AC1001",
    debitCurrency: "BDT",
    debitAmount: 50000,
    creditAccountId: "AC1002",
    creditCurrency: "BDT",
    creditAmount: 50000,
    transactionDate: "2026-11-15",
    paymentDetails: "High value corporate transfer awaiting supervisor auth",
    chargeAmount: 50,
    orderingCustomer: "MD. KAMRUL HASAN",
    beneficiaryCustomer: "NUSRAT JAHAN",
    branchCode: "JB1001",
    status: "PENDING_AUTH",
    auditData: {
      recStatus: "UA",
      recCurrNumber: 1,
      recInputter: "ZZ_MAKER",
      recInputTime: "2026-11-15 14:30:00",
      recAuthorizer: "",
      recAuthTime: "",
      recBranchCode: "JB1001",
    },
  },
};

export const FT_FUNDS_TRANSFER_HIS: Record<string, FundsTransferRecord[]> = {
  FT260001: [
    {
      transactionType: "AC",
      debitAccountId: "AC1001",
      debitCurrency: "BDT",
      debitAmount: 15000,
      creditAccountId: "AC1002",
      creditCurrency: "BDT",
      creditAmount: 15000,
      transactionDate: "2026-11-15",
      paymentDetails: "Initial transfer request draft",
      chargeAmount: 0,
      orderingCustomer: "MD. KAMRUL HASAN",
      beneficiaryCustomer: "NUSRAT JAHAN",
      branchCode: "JB1001",
      status: "ACTIVE",
      auditData: {
        recStatus: "AU",
        recCurrNumber: 1,
        recInputter: "SYSADMIN",
        recInputTime: "2026-11-15 09:30:00",
        recAuthorizer: "SUPV01",
        recAuthTime: "2026-11-15 09:35:00",
        recBranchCode: "JB1001",
      },
    },
  ],
};

export const FT_FUNDS_TRANSFER_DEL: Record<string, FundsTransferRecord> = {
  FT260099: {
    transactionType: "AC",
    debitAccountId: "AC1001",
    debitCurrency: "BDT",
    debitAmount: 10000,
    creditAccountId: "AC1002",
    creditCurrency: "BDT",
    creditAmount: 10000,
    transactionDate: "2026-11-14",
    paymentDetails: "Erroneous transfer reversed by operations team",
    chargeAmount: 0,
    orderingCustomer: "MD. KAMRUL HASAN",
    beneficiaryCustomer: "NUSRAT JAHAN",
    branchCode: "JB1001",
    status: "REVERSED",
    auditData: {
      recStatus: "DEL",
      recCurrNumber: 2,
      recInputter: "ZZ_MAKER",
      recInputTime: "2026-11-14 16:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-11-14 16:15:00",
      recBranchCode: "JB1001",
    },
  },
};

export const FT_FUNDS_TRANSFER_TABLE: CbsVersionedTable<FundsTransferRecord> = {
  LIVE: FT_FUNDS_TRANSFER,
  INAU: FT_FUNDS_TRANSFER_INAU,
  HIS: FT_FUNDS_TRANSFER_HIS,
  DEL: FT_FUNDS_TRANSFER_DEL,
};
