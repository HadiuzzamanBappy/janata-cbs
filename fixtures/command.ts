export const STATIC_COMMANDS = {
  errors: [],
  status: "SUCCESS",
  statusCode: 200,
  idempotencyKey: "",
  message: "record successfully processed!",
  data: {
    fields: {
      records: {
        list_value: {
          values: [
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "AC.GROUP.ID" },
                  description: { string_value: "Account Group ID" },
                  controlName: { string_value: "AC.GROUP.ID" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "ACCOUNT" },
                  description: { string_value: "Account" },
                  controlName: { string_value: "ACCOUNT" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "ACCOUNT.ENTRY" },
                  description: { string_value: "Accounting Entry" },
                  controlName: { string_value: "ACCOUNT.ENTRY" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "FUNDS.TRANSFER" },
                  description: { string_value: "Funds Transfer" },
                  controlName: { string_value: "FUNDS.TRANSFER" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "USER.CREATE" },
                  description: { string_value: "User Creation" },
                  controlName: { string_value: "USER.CREATE" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "USER.LIST" },
                  description: { string_value: "User Directory List" },
                  controlName: { string_value: "USER.LIST" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "REPORT.TXN.ENTRY" },
                  description: { string_value: "Transaction Entry Report" },
                  controlName: { string_value: "REPORT.TXN.ENTRY" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "BRANCH" },
                  description: { string_value: "Branch Configuration" },
                  controlName: { string_value: "BRANCH" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "DEPARTMENT" },
                  description: { string_value: "Department Control" },
                  controlName: { string_value: "DEPARTMENT" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "ROLE" },
                  description: { string_value: "User Role Permission" },
                  controlName: { string_value: "ROLE" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "COUNTRY" },
                  description: { string_value: "Country Master" },
                  controlName: { string_value: "COUNTRY" },
                },
              },
            },
          ],
        },
      },
    },
  },
};
