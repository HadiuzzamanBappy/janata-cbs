import type { RawPropertyConfigRecord } from "@/features/engine";

/**
 * Offline development mock specs matching the GMC backend schema.
 */
export const STATIC_SPECS: Record<string, RawPropertyConfigRecord> = {
  "FUNDS.TRANSFER": {
    DESCRIPTION: "Funds Transfer",
    TABLENAME: "FUNDS.TRANSFER",
    IDDEF: { IDPREFIX: "FT" },
    PROPERTIES: [
      {
        NAME: "TXN.CODE",
        LABEL: "Txn Code",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 4,
      },
      {
        NAME: "DEBIT.ACCOUNT",
        LABEL: "Debit Account",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 16,
      },
      {
        NAME: "DEBIT.CURRENCY",
        LABEL: "Debit Currency",
        TYPE: "VARCHAR",
        LENGTH: 3,
      },
      {
        NAME: "CREDIT.ACCOUNT",
        LABEL: "Credit Account",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 16,
      },
      {
        NAME: "CREDIT.CURRENCY",
        LABEL: "Credit Currency",
        TYPE: "VARCHAR",
        LENGTH: 3,
      },
      {
        NAME: "AMOUNT",
        LABEL: "Transaction Amount",
        TYPE: "NUMERIC",
        REQUIRED: true,
        LENGTH: 15,
      },
      { NAME: "VALUE.DATE", LABEL: "Value Date", TYPE: "DATE", REQUIRED: true },
      { NAME: "TXN.DATE", LABEL: "Transaction Date", TYPE: "DATE" },
      {
        NAME: "DEBIT.BRANCH",
        LABEL: "Debit Branch",
        TYPE: "VARCHAR",
        LENGTH: 6,
      },
      {
        NAME: "CREDIT.BRANCH",
        LABEL: "Credit Branch",
        TYPE: "VARCHAR",
        LENGTH: 6,
      },
      {
        NAME: "DEBIT.DETAILS",
        LABEL: "Debit Details",
        TYPE: "VARCHAR",
        LENGTH: 50,
      },
      {
        NAME: "CREDIT.DETAILS",
        LABEL: "Credit Details",
        TYPE: "VARCHAR",
        LENGTH: 50,
      },
      {
        NAME: "ENTRY.ID.1",
        LABEL: "Account Entry Id 1",
        TYPE: "VARCHAR",
        LENGTH: 35,
      },
      {
        NAME: "RECORD.STATUS",
        LABEL: "Record Status",
        TYPE: "VARCHAR",
        DISABLED: true,
        LENGTH: 4,
      },
      {
        NAME: "CURR.NUMBER",
        LABEL: "Curr Number",
        TYPE: "NUMERIC",
        DISABLED: true,
        LENGTH: 4,
      },
    ],
  },

  ACCOUNT: {
    DESCRIPTION: "Create Account",
    TABLENAME: "ACCOUNT.OPEN",
    IDDEF: { IDPREFIX: "AC" },
    PROPERTIES: [
      {
        NAME: "CUSTOMER.ID",
        LABEL: "Customer Id",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 12,
      },
      {
        NAME: "CATEGORY",
        LABEL: "Category",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 6,
      },
      {
        NAME: "PRODUCT",
        LABEL: "Product",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 20,
        DATASOURCE: ["Savings", "Current", "Term Deposit", "Staff Savings"],
      },
      {
        NAME: "CURRENCY",
        LABEL: "Currency",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 3,
      },
      { NAME: "BRANCH", LABEL: "Branch", TYPE: "VARCHAR", LENGTH: 6 },
      { NAME: "OPENING.DATE", LABEL: "Opening Date", TYPE: "DATE" },
      {
        NAME: "ACCOUNT.TITLE",
        LABEL: "Account Title",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 50,
      },
      {
        NAME: "MAILING.ADDRESS",
        LABEL: "Mailing Address",
        TYPE: "VARCHAR",
        LENGTH: 100,
      },
      {
        NAME: "RECORD.STATUS",
        LABEL: "Record Status",
        TYPE: "VARCHAR",
        DISABLED: true,
        LENGTH: 4,
      },
    ],
  },

  "USER.CREATE": {
    DESCRIPTION: "Create User",
    TABLENAME: "USER.CREATE",
    IDDEF: { IDPREFIX: "US" },
    PROPERTIES: [
      {
        NAME: "SIGN.ON.NAME",
        LABEL: "Sign On Name",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 15,
      },
      {
        NAME: "FULL.NAME",
        LABEL: "Full Name",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 15,
      },
      {
        NAME: "ROLE",
        LABEL: "Role",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 20,
        DATASOURCE: ["Teller", "Officer", "Supervisor", "Administrator"],
      },
      {
        NAME: "BRANCH",
        LABEL: "Branch",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 6,
      },
      { NAME: "START.DATE", LABEL: "Start Date", TYPE: "DATE" },
      { NAME: "END.DATE", LABEL: "End Date", TYPE: "DATE" },
      {
        NAME: "RECORD.STATUS",
        LABEL: "Record Status",
        TYPE: "VARCHAR",
        DISABLED: true,
        LENGTH: 4,
      },
    ],
  },

  "USER.LIST": {
    DESCRIPTION: "User List",
    TABLENAME: "USER.LIST",
    IDDEF: { IDPREFIX: "UL" },
    PROPERTIES: [
      { NAME: "BRANCH", LABEL: "Branch", TYPE: "VARCHAR", LENGTH: 6 },
      {
        NAME: "STATUS",
        LABEL: "Status",
        TYPE: "VARCHAR",
        LENGTH: 15,
        DATASOURCE: ["All", "Active", "Locked", "Closed"],
      },
      { NAME: "AS.OF.DATE", LABEL: "As Of Date", TYPE: "DATE" },
    ],
  },

  "REPORT.TXN.ENTRY": {
    DESCRIPTION: "Today Txn Entry",
    TABLENAME: "REPORT.TXN.ENTRY",
    IDDEF: { IDPREFIX: "TE" },
    PROPERTIES: [
      {
        NAME: "BRANCH",
        LABEL: "Branch",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 6,
      },
      { NAME: "TELLER", LABEL: "Teller Id", TYPE: "VARCHAR", LENGTH: 12 },
      { NAME: "FROM.TIME", LABEL: "From Time", TYPE: "VARCHAR", LENGTH: 8 },
      { NAME: "TO.TIME", LABEL: "To Time", TYPE: "VARCHAR", LENGTH: 8 },
      {
        NAME: "TXN.DATE",
        LABEL: "Transaction Date",
        TYPE: "DATE",
        REQUIRED: true,
      },
    ],
  },

  "REPORT.TXN.DAILY": {
    DESCRIPTION: "Today Txn Report",
    TABLENAME: "REPORT.TXN.DAILY",
    IDDEF: { IDPREFIX: "TR" },
    PROPERTIES: [
      {
        NAME: "BRANCH",
        LABEL: "Branch",
        TYPE: "VARCHAR",
        REQUIRED: true,
        LENGTH: 6,
      },
      {
        NAME: "FORMAT",
        LABEL: "Output Format",
        TYPE: "VARCHAR",
        LENGTH: 10,
        DATASOURCE: ["Screen", "PDF", "CSV"],
      },
      {
        NAME: "REPORT.DATE",
        LABEL: "Report Date",
        TYPE: "DATE",
        REQUIRED: true,
      },
      { NAME: "CURRENCY", LABEL: "Currency", TYPE: "VARCHAR", LENGTH: 3 },
    ],
  },
};
