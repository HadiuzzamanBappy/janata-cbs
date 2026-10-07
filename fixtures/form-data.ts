import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * STATIC_FORM_DATA
 * Real CBS form database row fixtures mirroring .response/form-data.json.
 * Kept exclusively for form screens present in fixtures/forms.ts:
 * 1. ACCOUNT
 * 2. CUSTOMER
 * 3. FUNDS.TRANSFER
 * 4. USER.LIST
 */
export const STATIC_FORM_DATA: Record<
  string,
  {
    // Form records keyed by recordId (e.g. "AC1001", "CU2001", "FT9001")
    records: Record<string, Record<string, unknown>>;
    // Enquiry dataset rows
    enquiryRows?: Array<Record<string, unknown>>;
  }
> = {
  // 1. ACCOUNT Records
  ACCOUNT: {
    records: {
      AC1001: {
        "CUSTOMER.ID": "CU2001",
        CATEGORY: "1001",
        PRODUCT: "SAVINGS",
        CURRENCY: "BDT",
        "ACCOUNT.OFFICER": "OFF101",
        BRANCH: "JB1001",
        "OPENING.DATE": "2024-01-15",
        "ACCOUNT.TITLE": "Mohammad Rahman Savings Account",
        "MAILING.ADDRESS": "House 12, Road 5, Dhanmondi, Dhaka",
        "RECORD.STATUS": "LIVE",
      },
      AC1002: {
        "CUSTOMER.ID": "CU2002",
        CATEGORY: "1002",
        PRODUCT: "CURRENT",
        CURRENCY: "BDT",
        "ACCOUNT.OFFICER": "OFF102",
        BRANCH: "JB1001",
        "OPENING.DATE": "2024-02-20",
        "ACCOUNT.TITLE": "Fatima Begum Current Account",
        "MAILING.ADDRESS": "Plot 45, Gulshan Avenue, Dhaka",
        "RECORD.STATUS": "LIVE",
      },
      AC1003: {
        "CUSTOMER.ID": "CU2003",
        CATEGORY: "1001",
        PRODUCT: "SAVINGS",
        CURRENCY: "USD",
        "ACCOUNT.OFFICER": "OFF101",
        BRANCH: "JB9999",
        "OPENING.DATE": "2024-03-10",
        "ACCOUNT.TITLE": "Shahidul Islam Foreign Currency A/C",
        "MAILING.ADDRESS": "House 8, Sector 3, Uttara, Dhaka",
        "RECORD.STATUS": "LIVE",
      },
    },
    enquiryRows: [
      {
        id: "AC1001",
        accountNumber: "AC1001",
        customerName: "Mohammad Rahman",
        category: "SAVINGS",
        currency: "BDT",
        branch: "JB1001",
        status: "LIVE",
      },
      {
        id: "AC1002",
        accountNumber: "AC1002",
        customerName: "Fatima Begum",
        category: "CURRENT",
        currency: "BDT",
        branch: "JB1001",
        status: "LIVE",
      },
      {
        id: "AC1003",
        accountNumber: "AC1003",
        customerName: "Shahidul Islam",
        category: "SAVINGS",
        currency: "USD",
        branch: "JB9999",
        status: "LIVE",
      },
    ],
  },

  // 2. CUSTOMER Records
  CUSTOMER: {
    records: {
      CU2001: {
        "CUSTOMER.ID": "CU2001",
        "NAME.1": "Mohammad Rahman",
        "SHORT.NAME": "M. Rahman",
        SECTOR: "INDIVIDUAL",
        NATIONALITY: "BD",
        RESIDENCE: "BD",
        BRANCH: "JB1001",
        "CONTACT.NUMBER": "+8801711000111",
        "DATE.OF.BIRTH": "1988-06-15",
        OCCUPATION: "Salaried Professional",
        "RECORD.STATUS": "LIVE",
      },
      CU2002: {
        "CUSTOMER.ID": "CU2002",
        "NAME.1": "Fatima Begum",
        "SHORT.NAME": "F. Begum",
        SECTOR: "BUSINESS",
        NATIONALITY: "BD",
        RESIDENCE: "BD",
        BRANCH: "JB1001",
        "CONTACT.NUMBER": "+8801819222333",
        "DATE.OF.BIRTH": "1992-11-20",
        OCCUPATION: "Entrepreneur",
        "RECORD.STATUS": "LIVE",
      },
      CU2003: {
        "CUSTOMER.ID": "CU2003",
        "NAME.1": "Shahidul Islam",
        "SHORT.NAME": "S. Islam",
        SECTOR: "NRB",
        NATIONALITY: "BD",
        RESIDENCE: "AE",
        BRANCH: "JB9999",
        "CONTACT.NUMBER": "+8801911444555",
        "DATE.OF.BIRTH": "1980-04-05",
        OCCUPATION: "IT Consultant",
        "RECORD.STATUS": "LIVE",
      },
    },
    enquiryRows: [
      {
        id: "CU2001",
        name: "Mohammad Rahman",
        sector: "INDIVIDUAL",
        nationality: "BD",
        branch: "JB1001",
        contactNumber: "+8801711000111",
        status: "LIVE",
      },
      {
        id: "CU2002",
        name: "Fatima Begum",
        sector: "BUSINESS",
        nationality: "BD",
        branch: "JB1001",
        contactNumber: "+8801819222333",
        status: "LIVE",
      },
      {
        id: "CU2003",
        name: "Shahidul Islam",
        sector: "NRB",
        nationality: "BD",
        branch: "JB9999",
        contactNumber: "+8801911444555",
        status: "LIVE",
      },
    ],
  },

  // 3. FUNDS.TRANSFER Records
  "FUNDS.TRANSFER": {
    records: {
      FT9001: {
        "TXN.CODE": "FT01",
        "DEBIT.ACCOUNT": "AC1001",
        "DEBIT.CURRENCY": "BDT",
        "CREDIT.ACCOUNT": "AC1002",
        "CREDIT.CURRENCY": "BDT",
        AMOUNT: 50000,
        "VALUE.DATE": "2026-10-01",
        "TXN.DATE": "2026-10-01",
        "DEBIT.BRANCH": "JB1001",
        "CREDIT.BRANCH": "JB1001",
        "RECORD.STATUS": "LIVE",
      },
      FT9002: {
        "TXN.CODE": "FT01",
        "DEBIT.ACCOUNT": "AC1002",
        "DEBIT.CURRENCY": "BDT",
        "CREDIT.ACCOUNT": "AC1003",
        "CREDIT.CURRENCY": "BDT",
        AMOUNT: 125000,
        "VALUE.DATE": "2026-10-02",
        "TXN.DATE": "2026-10-02",
        "DEBIT.BRANCH": "JB1001",
        "CREDIT.BRANCH": "JB9999",
        "RECORD.STATUS": "LIVE",
      },
    },
    enquiryRows: [
      {
        id: "FT9001",
        txnCode: "FT01",
        debitAccount: "AC1001",
        creditAccount: "AC1002",
        amount: "50,000.00 BDT",
        date: "2026-10-01",
        status: "AUTHORIZED",
      },
      {
        id: "FT9002",
        txnCode: "FT01",
        debitAccount: "AC1002",
        creditAccount: "AC1003",
        amount: "125,000.00 BDT",
        date: "2026-10-02",
        status: "PENDING_AUTH",
      },
    ],
  },

  // 4. USER.LIST (Enquiry Model)
  "USER.LIST": {
    records: {},
    enquiryRows: [
      {
        id: "USR001",
        fullName: "Farhan Ahmed",
        userRole: "BRANCH_MAKER",
        branchCode: "JB1001",
        accessibility: "RIDASH",
        status: "ACTIVE",
      },
      {
        id: "USR002",
        fullName: "Nusrat Jahan",
        userRole: "BRANCH_CHECKER",
        branchCode: "JB1001",
        accessibility: "RS",
        status: "ACTIVE",
      },
      {
        id: "ADMIN01",
        fullName: "System Administrator",
        userRole: "ADMIN",
        branchCode: "JB9999",
        accessibility: "RIDASH",
        status: "ACTIVE",
      },
      {
        id: "AUDIT01",
        fullName: "Tariqul Alam",
        userRole: "AUDITOR",
        branchCode: "JB9999",
        accessibility: "S",
        status: "ACTIVE",
      },
    ],
  },
};

/**
 * Helper to build a standard wire GrpcResponse for a database select
 */
export function buildMockDatabaseResponse(recordData: Record<string, unknown>): GrpcResponse {
  // Convert JS object to Protobuf Struct fields
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(recordData)) {
    if (typeof value === "string") {
      fields[key] = { string_value: value };
    } else if (typeof value === "number") {
      fields[key] = { number_value: value };
    } else if (typeof value === "boolean") {
      fields[key] = { bool_value: value };
    }
  }

  return {
    errors: [],
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "Record fetched successfully",
    timestamp: new Date().toISOString(),
    data: {
      fields: {
        record: {
          struct_value: {
            fields,
          },
        },
      },
    },
  };
}
