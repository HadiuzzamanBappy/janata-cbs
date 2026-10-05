import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * Canonical CBS Menu Hierarchy Fixture.
 * Formatted exactly as returned by CBS gRPC (matching .response/menu.json 1:1).
 * Zero legacy support: 1:1 GrpcResponse envelope with Protobuf struct payload.
 */
export const STATIC_MENU: GrpcResponse = {
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
                  id: { string_value: "n_1786858616121_0" },
                  menuId: { number_value: 1 },
                  label: { string_value: "Operational" },
                  command: { string_value: "" },
                  isVisible: { bool_value: true },
                  children: {
                    list_value: {
                      values: [
                        {
                          struct_value: {
                            fields: {
                              id: { string_value: "n_1786858624172_1" },
                              menuId: { number_value: 13 },
                              label: { string_value: "User Management" },
                              command: { string_value: "" },
                              isVisible: { bool_value: true },
                              children: {
                                list_value: {
                                  values: [
                                    {
                                      struct_value: {
                                        fields: {
                                          id: { string_value: "n_1786858673775_5" },
                                          menuId: { number_value: 14 },
                                          label: { string_value: "User Request" },
                                          command: { string_value: "" },
                                          isVisible: { bool_value: true },
                                          children: {
                                            list_value: {
                                              values: [
                                                {
                                                  struct_value: {
                                                    fields: {
                                                      id: { string_value: "n_1787137168951_1" },
                                                      menuId: { number_value: 29 },
                                                      label: { string_value: "User Request" },
                                                      command: { string_value: "INQ S GET.EMP.INFO" },
                                                      isVisible: { bool_value: true },
                                                      children: { list_value: { values: [] } },
                                                    },
                                                  },
                                                },
                                                {
                                                  struct_value: {
                                                    fields: {
                                                      id: { string_value: "n_1786858700779_6" },
                                                      menuId: { number_value: 15 },
                                                      label: {
                                                        string_value: "Create User Request",
                                                      },
                                                      command: { string_value: "USER.MGT,NEW1" },
                                                      isVisible: { bool_value: true },
                                                      children: { list_value: { values: [] } },
                                                    },
                                                  },
                                                },
                                                {
                                                  struct_value: {
                                                    fields: {
                                                      id: { string_value: "n_1786858707338_7" },
                                                      menuId: { number_value: 16 },
                                                      label: {
                                                        string_value:
                                                          "Unauthrized User Request List",
                                                      },
                                                      command: { string_value: "INQ S GET.USER.MGT" },
                                                      isVisible: { bool_value: true },
                                                      children: { list_value: { values: [] } },
                                                    },
                                                  },
                                                },
                                              ],
                                            },
                                          },
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        },
                        {
                          struct_value: {
                            fields: {
                              id: { string_value: "n_1786858625499_2" },
                              menuId: { number_value: 3 },
                              label: { string_value: "Customer Manage" },
                              command: { string_value: "" },
                              isVisible: { bool_value: true },
                              children: {
                                list_value: {
                                  values: [
                                    {
                                      struct_value: {
                                        fields: {
                                          id: { string_value: "n_1786859112388_8" },
                                          menuId: { number_value: 6 },
                                          label: { string_value: "Create Customer" },
                                          command: { string_value: "CUSTOMER" },
                                          isVisible: { bool_value: true },
                                          children: { list_value: { values: [] } },
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        },
                        {
                          struct_value: {
                            fields: {
                              id: { string_value: "n_1786858625931_3" },
                              menuId: { number_value: 4 },
                              label: { string_value: "Account Manage" },
                              command: { string_value: "" },
                              isVisible: { bool_value: true },
                              children: {
                                list_value: {
                                  values: [
                                    {
                                      struct_value: {
                                        fields: {
                                          id: { string_value: "n_1786859119420_9" },
                                          menuId: { number_value: 7 },
                                          label: { string_value: "Create Accouont" },
                                          command: { string_value: "ACCOUNT" },
                                          isVisible: { bool_value: true },
                                          children: { list_value: { values: [] } },
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        },
                        {
                          struct_value: {
                            fields: {
                              id: { string_value: "n_1786858648899_4" },
                              menuId: { number_value: 5 },
                              label: { string_value: "Funds Manage" },
                              command: { string_value: "" },
                              isVisible: { bool_value: true },
                              children: {
                                list_value: {
                                  values: [
                                    {
                                      struct_value: {
                                        fields: {
                                          id: { string_value: "n_1786859124995_10" },
                                          menuId: { number_value: 8 },
                                          label: { string_value: "Funds Transfer" },
                                          command: { string_value: "FUNDS.TRANSFER" },
                                          isVisible: { bool_value: true },
                                          children: { list_value: { values: [] } },
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        },
                        {
                          struct_value: {
                            fields: {
                              id: { string_value: "n_1786862427083_1" },
                              menuId: { number_value: 10 },
                              label: { string_value: "Daily Inquiry" },
                              command: { string_value: "" },
                              isVisible: { bool_value: true },
                              children: {
                                list_value: {
                                  values: [
                                    {
                                      struct_value: {
                                        fields: {
                                          id: { string_value: "n_1786862443210_2" },
                                          menuId: { number_value: 17 },
                                          label: { string_value: "Today Txn Report" },
                                          command: { string_value: "INQ S GET.TO.TXN" },
                                          isVisible: { bool_value: true },
                                          children: { list_value: { values: [] } },
                                        },
                                      },
                                    },
                                    {
                                      struct_value: {
                                        fields: {
                                          id: { string_value: "n_1786862453089_3" },
                                          menuId: { number_value: 19 },
                                          label: { string_value: "Today Txn Entry" },
                                          command: { string_value: "INQ S GET.TODAY.ENTRY" },
                                          isVisible: { bool_value: true },
                                          children: { list_value: { values: [] } },
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        },
                      ],
                    },
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
