import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * STATIC_FORMS mirrors the GMC backend wire responses (.response/form.json).
 * Formatted exactly as GrpcResponse with Protobuf struct payload for Form UI rendering.
 * 100% pure wire data without custom classes or legacy baggage.
 */
export const STATIC_FORMS: Record<string, GrpcResponse> = {
  ACCOUNT: {
    errors: [],
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "record successfully processed!",
    timestamp: "2026-10-01T09:07:15.421489436Z",
    data: {
      fields: {
        record: {
          struct_value: {
            fields: {
              TABLENAME: { string_value: "ACCOUNT" },
              DESCRIPTION: { string_value: "Create Account" },
              IDDEF: {
                struct_value: {
                  fields: {
                    IDPREFIX: { string_value: "AC" },
                  },
                },
              },
              PROPERTIES: {
                list_value: {
                  values: [
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "CUSTOMER.ID" },
                          LABEL: { string_value: "Customer Id" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 12 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "CATEGORY" },
                          LABEL: { string_value: "Category" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 6 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "PRODUCT" },
                          LABEL: { string_value: "Product" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 20 },
                          DATASOURCE: {
                            list_value: {
                              values: [
                                { string_value: "Savings" },
                                { string_value: "Current" },
                                { string_value: "Term Deposit" },
                                { string_value: "Staff Savings" },
                              ],
                            },
                          },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "CURRENCY" },
                          LABEL: { string_value: "Currency" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 3 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "BRANCH" },
                          LABEL: { string_value: "Branch" },
                          TYPE: { string_value: "VARCHAR" },
                          LENGTH: { number_value: 6 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "OPENING.DATE" },
                          LABEL: { string_value: "Opening Date" },
                          TYPE: { string_value: "DATE" },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "ACCOUNT.TITLE" },
                          LABEL: { string_value: "Account Title" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 50 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "MAILING.ADDRESS" },
                          LABEL: { string_value: "Mailing Address" },
                          TYPE: { string_value: "VARCHAR" },
                          LENGTH: { number_value: 100 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "RECORD.STATUS" },
                          LABEL: { string_value: "Record Status" },
                          TYPE: { string_value: "VARCHAR" },
                          DISABLED: { bool_value: true },
                          LENGTH: { number_value: 4 },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },

  "FUNDS.TRANSFER": {
    errors: [],
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "record successfully processed!",
    timestamp: "2026-10-01T09:07:15.421489436Z",
    data: {
      fields: {
        record: {
          struct_value: {
            fields: {
              TABLENAME: { string_value: "FUNDS.TRANSFER" },
              DESCRIPTION: { string_value: "Funds Transfer" },
              IDDEF: {
                struct_value: {
                  fields: {
                    IDPREFIX: { string_value: "FT" },
                  },
                },
              },
              PROPERTIES: {
                list_value: {
                  values: [
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "TXN.CODE" },
                          LABEL: { string_value: "Txn Code" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 4 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "DEBIT.ACCOUNT" },
                          LABEL: { string_value: "Debit Account" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 16 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "DEBIT.CURRENCY" },
                          LABEL: { string_value: "Debit Currency" },
                          TYPE: { string_value: "VARCHAR" },
                          LENGTH: { number_value: 3 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "CREDIT.ACCOUNT" },
                          LABEL: { string_value: "Credit Account" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 16 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "CREDIT.CURRENCY" },
                          LABEL: { string_value: "Credit Currency" },
                          TYPE: { string_value: "VARCHAR" },
                          LENGTH: { number_value: 3 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "AMOUNT" },
                          LABEL: { string_value: "Transaction Amount" },
                          TYPE: { string_value: "NUMERIC" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 15 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "VALUE.DATE" },
                          LABEL: { string_value: "Value Date" },
                          TYPE: { string_value: "DATE" },
                          REQUIRED: { bool_value: true },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "TXN.DATE" },
                          LABEL: { string_value: "Transaction Date" },
                          TYPE: { string_value: "DATE" },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "DEBIT.BRANCH" },
                          LABEL: { string_value: "Debit Branch" },
                          TYPE: { string_value: "VARCHAR" },
                          LENGTH: { number_value: 6 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "CREDIT.BRANCH" },
                          LABEL: { string_value: "Credit Branch" },
                          TYPE: { string_value: "VARCHAR" },
                          LENGTH: { number_value: 6 },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },

  CUSTOMER: {
    errors: [],
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "record successfully processed!",
    timestamp: "2026-10-01T09:07:15.421489436Z",
    data: {
      fields: {
        record: {
          struct_value: {
            fields: {
              TABLENAME: { string_value: "CUSTOMER" },
              DESCRIPTION: { string_value: "Create Customer" },
              IDDEF: {
                struct_value: {
                  fields: {
                    IDPREFIX: { string_value: "CU" },
                  },
                },
              },
              PROPERTIES: {
                list_value: {
                  values: [
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "CUSTOMER.ID" },
                          LABEL: { string_value: "Customer Number" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 12 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "NAME.1" },
                          LABEL: { string_value: "Customer Name" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 35 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "SHORT.NAME" },
                          LABEL: { string_value: "Short Name" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 15 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "DATE.OF.BIRTH" },
                          LABEL: { string_value: "Date of Birth" },
                          TYPE: { string_value: "DATE" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },

  "USER.LIST": {
    errors: [],
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "record successfully processed!",
    timestamp: "2026-10-01T09:07:15.421489436Z",
    data: {
      fields: {
        record: {
          struct_value: {
            fields: {
              TABLENAME: { string_value: "USER.LIST" },
              DESCRIPTION: { string_value: "User List" },
              IDDEF: {
                struct_value: {
                  fields: {
                    IDPREFIX: { string_value: "UL" },
                  },
                },
              },
              PROPERTIES: {
                list_value: {
                  values: [
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "USER.ID" },
                          LABEL: { string_value: "User ID" },
                          TYPE: { string_value: "VARCHAR" },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "BRANCH" },
                          LABEL: { string_value: "Branch" },
                          TYPE: { string_value: "VARCHAR" },
                          LENGTH: { number_value: 6 },
                        },
                      },
                    },
                  ],
                },
              },
              COLUMNS: [
                {
                  id: "id",
                  label: "User ID",
                  isMono: true,
                  isDrilldown: true,
                  drilldownTargetCommand: "USER.MGT",
                },
                { id: "fullName", label: "Full Name" },
                { id: "userRole", label: "Role", align: "center" },
                { id: "branchCode", label: "Branch", align: "center" },
                { id: "accessibility", label: "Rights", align: "center", isMono: true },
                { id: "status", label: "Status", align: "center" },
              ],
            },
          },
        },
      },
    },
  },

  "USER.MGT": {
    errors: [],
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "record successfully processed!",
    timestamp: "2026-10-01T09:07:15.421489436Z",
    data: {
      fields: {
        record: {
          struct_value: {
            fields: {
              TABLENAME: { string_value: "USER.MGT" },
              DESCRIPTION: { string_value: "User Management" },
              IDDEF: {
                struct_value: {
                  fields: {
                    IDPREFIX: { string_value: "USR" },
                  },
                },
              },
              PROPERTIES: {
                list_value: {
                  values: [
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "USER.ID" },
                          LABEL: { string_value: "User ID" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 20 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "FULL.NAME" },
                          LABEL: { string_value: "Full Name" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 60 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "USER.ROLE" },
                          LABEL: { string_value: "User Role" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 20 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "BRANCH.CODE" },
                          LABEL: { string_value: "Branch Code" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 6 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "EMAIL" },
                          LABEL: { string_value: "Email Address" },
                          TYPE: { string_value: "VARCHAR" },
                          LENGTH: { number_value: 50 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "PHONE" },
                          LABEL: { string_value: "Mobile Phone" },
                          TYPE: { string_value: "VARCHAR" },
                          LENGTH: { number_value: 20 },
                        },
                      },
                    },
                    {
                      struct_value: {
                        fields: {
                          NAME: { string_value: "STATUS" },
                          LABEL: { string_value: "Status" },
                          TYPE: { string_value: "VARCHAR" },
                          REQUIRED: { bool_value: true },
                          LENGTH: { number_value: 10 },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
};
