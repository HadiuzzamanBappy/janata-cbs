/**
 * AC_ACCOUNT Database Table (PREFIX: AC, TABLE: ACCOUNT)
 * Stores core retail and corporate banking accounts.
 */
export const AC_ACCOUNT_LIVE: Record<string, Record<string, unknown>> = {
  AC1001: {
    recordId: "AC1001",
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
    recordId: "AC1002",
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
    recordId: "AC1003",
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

export const AC_ACCOUNT_ENQUIRY_ROWS = [
  {
    id: "AC1001",
    accountNumber: "AC1001",
    category: "SAVINGS",
    currency: "BDT",
    branch: "JB1001",
    status: "LIVE",
  },
  {
    id: "AC1002",
    accountNumber: "AC1002",
    category: "CURRENT",
    currency: "BDT",
    branch: "JB1001",
    status: "LIVE",
  },
  {
    id: "AC1003",
    accountNumber: "AC1003",
    category: "SAVINGS",
    currency: "USD",
    branch: "JB9999",
    status: "LIVE",
  },
];

export const AC_ACCOUNT_TABLE = AC_ACCOUNT_LIVE;
export const AC_ACCOUNT_LIST = Object.values(AC_ACCOUNT_LIVE);

export function getAccountRecord(recordId: string): Record<string, unknown> | null {
  const cleanId = recordId.trim().toUpperCase();
  return AC_ACCOUNT_LIVE[cleanId] ?? null;
}
