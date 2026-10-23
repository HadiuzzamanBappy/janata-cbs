import type { CbsVersionedTable } from "./types";

export type AccountRecord = Record<string, unknown>;

/**
 * AC_ACCOUNT Database Table (PREFIX: AC, TABLE: ACCOUNT)
 * Stores core retail and corporate banking accounts.
 */
export const AC_ACCOUNT_LIVE: Record<string, AccountRecord> = {
  AC1001: {
    accountType: "SAVINGS",
    currency: "BDT",
    openingDate: "2024-01-15",
    interestRate: 7.5,
    enableChequeBook: true,
    presentAddress: {
      street: "Road 12, House 45",
      city: "Dhaka",
      postalCode: "1212",
    },
    pepStatus: "NO",
    taxExempt: false,
    specialInstructions:
      "Standard retail savings account with biometric verification completed. Cheque book issued via branch mandate.",
    branchCode: "JB1001",
  },
  AC1002: {
    accountType: "CURRENT",
    currency: "BDT",
    openingDate: "2024-02-20",
    interestRate: 0.0,
    enableChequeBook: true,
    presentAddress: {
      street: "Gulshan Avenue 10, Suite 4B",
      city: "Dhaka",
      postalCode: "1212",
    },
    pepStatus: "NO",
    taxExempt: true,
    specialInstructions:
      "Commercial trade account with dual signatory requirement. Tax exemption certificate verified and archived.",
    branchCode: "JB1001",
  },
  AC1003: {
    accountType: "SAVINGS",
    currency: "USD",
    openingDate: "2024-03-10",
    interestRate: 4.25,
    enableChequeBook: false,
    presentAddress: {
      street: "Agrabad Commercial Area 14",
      city: "Chittagong",
      postalCode: "4000",
    },
    pepStatus: "NO",
    taxExempt: false,
    specialInstructions:
      "Foreign currency remittance account. Non-resident Bangladeshi remit mandate.",
    branchCode: "JB9999",
  },
};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const AC_ACCOUNT_INAU: Record<string, AccountRecord> = {};
export const AC_ACCOUNT_HIS: Record<string, AccountRecord[]> = {};
export const AC_ACCOUNT_DEL: Record<string, AccountRecord> = {};

export const AC_ACCOUNT_TABLE: CbsVersionedTable<AccountRecord> = {
  LIVE: AC_ACCOUNT_LIVE,
  INAU: AC_ACCOUNT_INAU,
  HIS: AC_ACCOUNT_HIS,
  DEL: AC_ACCOUNT_DEL,
};

export const AC_ACCOUNT_LIST: AccountRecord[] = Object.values(AC_ACCOUNT_LIVE);
