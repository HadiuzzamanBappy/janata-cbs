import type { EnquirySchema } from "@/features/screens/enquiries/types";

/**
 * Offline development mock enquiries data.
 */
export const STATIC_ENQUIRIES: Record<string, EnquirySchema> = {
  "ENQ USER.LIST": {
    code: "ENQ USER.LIST",
    title: "System Users List",
    description: "Enquiry listing active banking users and assigned function rights",
    selectionFields: [
      {
        id: "USER.ID",
        label: "User ID",
        type: "text",
        operand: "LK",
        value: "",
      },
      {
        id: "ROLE",
        label: "User Role",
        type: "select",
        operand: "EQ",
        value: "",
        options: [
          { label: "All Roles", value: "" },
          { label: "TELLER", value: "TELLER" },
          { label: "ADMIN", value: "ADMIN" },
          { label: "SUPERVISOR", value: "SUPERVISOR" },
        ],
      },
    ],
    columns: [
      {
        id: "id",
        label: "User ID",
        isMono: true,
        isDrilldown: true,
        drilldownTargetCommand: "USER.RECORD",
      },
      { id: "fullName", label: "Full Name" },
      { id: "userRole", label: "Role", align: "center" },
      { id: "branchName", label: "Branch" },
      { id: "functionRights", label: "Rights (RIDASH)", align: "center", isMono: true },
      { id: "status", label: "Status", align: "center" },
    ],
    sampleData: [
      {
        id: "ZZ028459",
        fullName: "Teller User",
        userRole: "TELLER",
        branchName: "Motijheel Branch",
        functionRights: "R I D A S H",
        status: "ACTIVE",
      },
      {
        id: "ZZ028460",
        fullName: "System Administrator",
        userRole: "ADMIN",
        branchName: "Head Office",
        functionRights: "R I D A S H",
        status: "ACTIVE",
      },
      {
        id: "ZZ028461",
        fullName: "New Staff Member",
        userRole: "TELLER",
        branchName: "Gulshan Branch",
        functionRights: "R S",
        status: "NEW LOGIN",
      },
      {
        id: "ZZ028462",
        fullName: "Branch Supervisor",
        userRole: "SUPERVISOR",
        branchName: "Agrabad Branch",
        functionRights: "R I D A S H",
        status: "ACTIVE",
      },
    ],
  },
  "ENQ STMT.ENT.BOOK": {
    code: "ENQ STMT.ENT.BOOK",
    title: "Account Statement Entries",
    description: "Booked statement entries enquiry for customer accounts",
    selectionFields: [
      {
        id: "ACCOUNT",
        label: "Account Number",
        type: "text",
        operand: "EQ",
        value: "",
      },
      {
        id: "CURRENCY",
        label: "Currency",
        type: "select",
        operand: "EQ",
        value: "",
        options: [
          { label: "All Currencies", value: "" },
          { label: "USD", value: "USD" },
          { label: "EUR", value: "EUR" },
          { label: "BDT", value: "BDT" },
        ],
      },
    ],
    columns: [
      {
        id: "id",
        label: "Txn Ref",
        isMono: true,
        isDrilldown: true,
        drilldownTargetCommand: "FUNDS.TRANSFER",
      },
      { id: "account", label: "Account No", isMono: true },
      { id: "bookingDate", label: "Booking Date", isMono: true },
      { id: "txnCode", label: "Txn Code", isMono: true, align: "center" },
      { id: "amount", label: "Amount", align: "right", isMono: true },
      { id: "currency", label: "Ccy", align: "center", isMono: true },
    ],
    sampleData: [
      {
        id: "FT2600109281",
        account: "1002003001",
        bookingDate: "2026-09-28",
        txnCode: "ACVI",
        amount: "+ 15,000.00",
        currency: "USD",
      },
      {
        id: "FT2600109282",
        account: "1002003002",
        bookingDate: "2026-09-27",
        txnCode: "ACVO",
        amount: "- 2,450.50",
        currency: "USD",
      },
      {
        id: "FT2600109283",
        account: "1002003001",
        bookingDate: "2026-09-26",
        txnCode: "ACVI",
        amount: "+ 50,000.00",
        currency: "BDT",
      },
    ],
  },
};
