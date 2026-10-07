import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * STATIC_CONTROL_RESPONSE contains core banking command controls (.response/control.json)
 * with bespoke system commands removed (handled by custom feature screens).
 * Pure data constant only — no parsers or business logic.
 */
export const STATIC_CONTROL_RESPONSE: GrpcResponse = {
  errors: [],
  status: "SUCCESS",
  statusCode: 200,
  idempotencyKey: "",
  message: "record successfully processed!",
  timestamp: "2026-10-01T09:07:15.421489436Z",
  data: {
    fields: {
      records: {
        list_value: {
          values: [
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "AC.GROUP.ID",
                  },
                  description: {
                    string_value: "Account Group ID",
                  },
                  controlName: {
                    string_value: "AC.GROUP.ID",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "ACCOUNT",
                  },
                  description: {
                    string_value: "Account",
                  },
                  controlName: {
                    string_value: "ACCOUNT",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "ACCOUNT.ENTRY",
                  },
                  description: {
                    string_value: "Accounting Entry",
                  },
                  controlName: {
                    string_value: "ACCOUNT.ENTRY",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "AE",
                  },
                  description: {
                    string_value: "Accounting Entry",
                  },
                  controlName: {
                    string_value: "ACCOUNT.ENTRY",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "BANK.DATE",
                  },
                  description: {
                    string_value: "Bank Date",
                  },
                  controlName: {
                    string_value: "BANK.DATE",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "BRANCH",
                  },
                  description: {
                    string_value: "Branch",
                  },
                  controlName: {
                    string_value: "BRANCH",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CASH.TRANSFER",
                  },
                  description: {
                    string_value: "Cash Transfer",
                  },
                  controlName: {
                    string_value: "CASH.TRANSFER",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CATEGORY",
                  },
                  description: {
                    string_value: "Category",
                  },
                  controlName: {
                    string_value: "CATEGORY",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CLIENT.ACTIVITY",
                  },
                  description: {
                    string_value: "Control for CLIENT.ACTIVITY",
                  },
                  controlName: {
                    string_value: "CLIENT.ACTIVITY",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CMD",
                  },
                  description: {
                    string_value: "Command Control List",
                  },
                  controlName: {
                    string_value: "SC.CONTROL.LIST",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "COA.TREE",
                  },
                  description: {
                    string_value: "COA TREE",
                  },
                  controlName: {
                    string_value: "COA.TREE",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "COB.REGISTRY",
                  },
                  description: {
                    string_value: "COB Service Registry",
                  },
                  controlName: {
                    string_value: "SC.COB.REGISTRY",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CONTROL",
                  },
                  description: {
                    string_value: "All Control",
                  },
                  controlName: {
                    string_value: "CONTROL",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "COUNTRY",
                  },
                  description: {
                    string_value: "Country",
                  },
                  controlName: {
                    string_value: "COUNTRY",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CURRENCY",
                  },
                  description: {
                    string_value: "Control for CURRENCY",
                  },
                  controlName: {
                    string_value: "CURRENCY",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CURRENCY.MARKET",
                  },
                  description: {
                    string_value: "Control for CURRENCY.MARKET",
                  },
                  controlName: {
                    string_value: "CURRENCY.MARKET",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CUST",
                  },
                  description: {
                    string_value: "Test",
                  },
                  controlName: {
                    string_value: "CUST",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CUSTOMER",
                  },
                  description: {
                    string_value: "Customer",
                  },
                  controlName: {
                    string_value: "CUSTOMER",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CUSTOMER.STATUS",
                  },
                  description: {
                    string_value: "Control for CUSTOMER.STATUS",
                  },
                  controlName: {
                    string_value: "CUSTOMER.STATUS",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "CUSTOMER2",
                  },
                  description: {
                    string_value: "Test Customer",
                  },
                  controlName: {
                    string_value: "CUSTOMER2",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "D2",
                  },
                  description: {
                    string_value: "New Layout",
                  },
                  controlName: {
                    string_value: "SC.DYNAMIC2",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "DATE",
                  },
                  description: {
                    string_value: "Date Information",
                  },
                  controlName: {
                    string_value: "SC.DATE",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "DEPARTMENT",
                  },
                  description: {
                    string_value: "create control for department",
                  },
                  controlName: {
                    string_value: "DEPARTMENT",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "DEPT.ACCT.OFFICER",
                  },
                  description: {
                    string_value: "Control for DEPT.ACCT.OFFICER",
                  },
                  controlName: {
                    string_value: "DEPT.ACCT.OFFICER",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "DEPTEST",
                  },
                  description: {
                    string_value: "create control for department",
                  },
                  controlName: {
                    string_value: "DEPARTMENT",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "DF",
                  },
                  description: {
                    string_value: "DF",
                  },
                  controlName: {
                    string_value: "DF",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "DISTRICT",
                  },
                  description: {
                    string_value: "District List",
                  },
                  controlName: {
                    string_value: "DISTRICT",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "DIVISION",
                  },
                  description: {
                    string_value: "Devision List",
                  },
                  controlName: {
                    string_value: "DIVISION",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "FD",
                  },
                  description: {
                    string_value: "Test",
                  },
                  controlName: {
                    string_value: "FORM.DESIGN",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "FT",
                  },
                  description: {
                    string_value: "Test",
                  },
                  controlName: {
                    string_value: "FUNDS.TRANSFER",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "FUNDS.TRANSFER",
                  },
                  description: {
                    string_value: "Funds Transfer",
                  },
                  controlName: {
                    string_value: "FUNDS.TRANSFER",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "GIR",
                  },
                  description: {
                    string_value: "Generate Inquiry Report",
                  },
                  controlName: {
                    string_value: "GIR",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "GLOBAL.LIST",
                  },
                  description: {
                    string_value: "Global List",
                  },
                  controlName: {
                    string_value: "GLOBAL.LIST",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "HRDP01",
                  },
                  description: {
                    string_value: "Test",
                  },
                  controlName: {
                    string_value: "HRDP01",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "INQ",
                  },
                  description: {
                    string_value: "Inquiry",
                  },
                  controlName: {
                    string_value: "INQ",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "JB.AREA",
                  },
                  description: {
                    string_value: "Area",
                  },
                  controlName: {
                    string_value: "JB.AREA",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "JB.DIVISION",
                  },
                  description: {
                    string_value: "Division",
                  },
                  controlName: {
                    string_value: "JB.DIVISION",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "LOAN.CLASS",
                  },
                  description: {
                    string_value: "Loan Class",
                  },
                  controlName: {
                    string_value: "LOAN.CLASS",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "MENU.MAIN",
                  },
                  description: {
                    string_value: "Main Menu",
                  },
                  controlName: {
                    string_value: "MENU.MAIN",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "MM",
                  },
                  description: {
                    string_value: "Main Menu",
                  },
                  controlName: {
                    string_value: "MENU.MAIN",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "NEWLAYOUT",
                  },
                  description: {
                    string_value: "New Layout",
                  },
                  controlName: {
                    string_value: "NEWLAYOUT",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "POST.OFFICE",
                  },
                  description: {
                    string_value: "Control for POST.OFFICE",
                  },
                  controlName: {
                    string_value: "POST.OFFICE",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "RELATION",
                  },
                  description: {
                    string_value: "Customer",
                  },
                  controlName: {
                    string_value: "RELATION",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "RL",
                  },
                  description: {
                    string_value: "Report Line",
                  },
                  controlName: {
                    string_value: "SC.REPORT.LINE",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "RM",
                  },
                  description: {
                    string_value: "Root Menu Info",
                  },
                  controlName: {
                    string_value: "MENU.ROOT",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "RMT",
                  },
                  description: {
                    string_value: "REMITTANCE",
                  },
                  controlName: {
                    string_value: "REMITTANCE",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "RPTRENDER",
                  },
                  description: {
                    string_value: "TEST",
                  },
                  controlName: {
                    string_value: "RPTRENDER",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "SC.INQUIRY",
                  },
                  description: {
                    string_value: "INQUIRY",
                  },
                  controlName: {
                    string_value: "SC.INQUIRY",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "SECTOR",
                  },
                  description: {
                    string_value: "Sectory",
                  },
                  controlName: {
                    string_value: "SECTOR",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "SERVICE",
                  },
                  description: {
                    string_value: "Application Services",
                  },
                  controlName: {
                    string_value: "SERVICE",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "SERVICE.AGENT",
                  },
                  description: {
                    string_value: "Service Agent",
                  },
                  controlName: {
                    string_value: "SERVICE.AGENT",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "SERVICE.MASTER",
                  },
                  description: {
                    string_value: "Service Master",
                  },
                  controlName: {
                    string_value: "SERVICE.MASTER",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "SIM",
                  },
                  description: {
                    string_value: "Search In Model",
                  },
                  controlName: {
                    string_value: "SC.SEARCH",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "SIR",
                  },
                  description: {
                    string_value: "Show Inquiry Report",
                  },
                  controlName: {
                    string_value: "SIR",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "SR",
                  },
                  description: {
                    string_value: "Screen Render",
                  },
                  controlName: {
                    string_value: "SC.SCREEN.RENDER",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "T",
                  },
                  description: {
                    string_value: "Temp",
                  },
                  controlName: {
                    string_value: "TEMP",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "TARGET",
                  },
                  description: {
                    string_value: "Customer Target",
                  },
                  controlName: {
                    string_value: "TARGET",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "TE",
                  },
                  description: {
                    string_value: "TODAY ENTRY",
                  },
                  controlName: {
                    string_value: "TODAY.TXN.ENTRY",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "TEMPLATE",
                  },
                  description: {
                    string_value: "New Component",
                  },
                  controlName: {
                    string_value: "TEMPLATE",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "THANA",
                  },
                  description: {
                    string_value: "Police Station",
                  },
                  controlName: {
                    string_value: "THANA",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "TTE",
                  },
                  description: {
                    string_value: "Today Txn Entry",
                  },
                  controlName: {
                    string_value: "TODAY.TXN.ENTRY",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "UPAZILA",
                  },
                  description: {
                    string_value: "Upazila List",
                  },
                  controlName: {
                    string_value: "UPAZILA",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "USER",
                  },
                  description: {
                    string_value: "User Info",
                  },
                  controlName: {
                    string_value: "USER",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "USER.MGT",
                  },
                  description: {
                    string_value: "User migration",
                  },
                  controlName: {
                    string_value: "USER.MGT",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "USER.ROLE",
                  },
                  description: {
                    string_value: "User Role",
                  },
                  controlName: {
                    string_value: "USER.ROLE",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "USERS",
                  },
                  description: {
                    string_value: "Control record for USERS",
                  },
                  controlName: {
                    string_value: "USERS",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "USERS.BANKID.UNA",
                  },
                  description: {
                    string_value: "USERS.BANKID.UNA",
                  },
                  controlName: {
                    string_value: "USERS.BANKID.UNA",
                  },
                },
              },
            },
          ],
        },
      },
    },
  },
};

export const STATIC_COMMANDS = STATIC_CONTROL_RESPONSE;
