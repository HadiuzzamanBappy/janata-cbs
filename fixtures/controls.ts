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
          ],
        },
      },
    },
  },
};

export const STATIC_COMMANDS = STATIC_CONTROL_RESPONSE;
