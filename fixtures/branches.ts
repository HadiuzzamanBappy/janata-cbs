import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * STATIC_BRANCH_RESPONSE contains 4 representative branches from CBS wire format (.response/branch.json)
 * with auditData stripped for clean, lightweight fixture loading.
 * Pure data constant only — no parsers or business logic.
 */
export const STATIC_BRANCH_RESPONSE: GrpcResponse = {
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
                    string_value: "JB0001",
                  },
                  branchTitle: {
                    string_value: "IMAMGONJ CORPORATE  ",
                  },
                  branchType: {
                    string_value: "BR",
                  },
                  branchContact: {
                    list_value: {
                      values: [
                        {
                          struct_value: {
                            fields: {
                              addressLine: { null_value: "NULL_VALUE" },
                              email: { null_value: "NULL_VALUE" },
                              phone: { null_value: "NULL_VALUE" },
                            },
                          },
                        },
                      ],
                    },
                  },
                  openDate: {
                    string_value: "20250101",
                  },
                  isActive: {
                    bool_value: true,
                  },
                  bbCode: {
                    string_value: "0373",
                  },
                  divCode: {
                    string_value: "7001",
                  },
                  areaCode: {
                    string_value: "5035",
                  },
                  gradeCode: {
                    string_value: "01",
                  },
                  countryCode: {
                    string_value: "BD",
                  },
                  routingNumber: {
                    string_value: "135272837",
                  },
                  swiftCode: {
                    string_value: "JANBBDDHIMA ",
                  },
                  parentBranch: {
                    string_value: "",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "JB0002",
                  },
                  branchTitle: {
                    string_value: "LALDIGHI EAST CORP. ",
                  },
                  branchType: {
                    string_value: "BR",
                  },
                  branchContact: {
                    list_value: {
                      values: [
                        {
                          struct_value: {
                            fields: {
                              addressLine: { null_value: "NULL_VALUE" },
                              email: { null_value: "NULL_VALUE" },
                              phone: { null_value: "NULL_VALUE" },
                            },
                          },
                        },
                      ],
                    },
                  },
                  openDate: {
                    string_value: "20250101",
                  },
                  isActive: {
                    bool_value: true,
                  },
                  bbCode: {
                    string_value: "0083",
                  },
                  divCode: {
                    string_value: "7003",
                  },
                  areaCode: {
                    string_value: "5020",
                  },
                  gradeCode: {
                    string_value: "01",
                  },
                  countryCode: {
                    string_value: "BD",
                  },
                  routingNumber: {
                    string_value: "135154542",
                  },
                  swiftCode: {
                    string_value: "JANBBDDHLDE ",
                  },
                  parentBranch: {
                    string_value: "",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "JB0003",
                  },
                  branchTitle: {
                    string_value: "NETAIGONJ CORP.  ",
                  },
                  branchType: {
                    string_value: "BR",
                  },
                  branchContact: {
                    list_value: {
                      values: [
                        {
                          struct_value: {
                            fields: {
                              addressLine: { null_value: "NULL_VALUE" },
                              email: { null_value: "NULL_VALUE" },
                              phone: { null_value: "NULL_VALUE" },
                            },
                          },
                        },
                      ],
                    },
                  },
                  openDate: {
                    string_value: "20250101",
                  },
                  isActive: {
                    bool_value: true,
                  },
                  bbCode: {
                    string_value: "0570",
                  },
                  divCode: {
                    string_value: "7001",
                  },
                  areaCode: {
                    string_value: "5025",
                  },
                  gradeCode: {
                    string_value: "02",
                  },
                  countryCode: {
                    string_value: "BD",
                  },
                  routingNumber: {
                    string_value: "135671270",
                  },
                  swiftCode: {
                    string_value: "JANBBDDHNGN ",
                  },
                  parentBranch: {
                    string_value: "",
                  },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: {
                    string_value: "JB0004",
                  },
                  branchTitle: {
                    string_value: "KHULNA CORP. ",
                  },
                  branchType: {
                    string_value: "BR",
                  },
                  branchContact: {
                    list_value: {
                      values: [
                        {
                          struct_value: {
                            fields: {
                              addressLine: { null_value: "NULL_VALUE" },
                              email: { null_value: "NULL_VALUE" },
                              phone: { null_value: "NULL_VALUE" },
                            },
                          },
                        },
                      ],
                    },
                  },
                  openDate: {
                    string_value: "20250101",
                  },
                  isActive: {
                    bool_value: true,
                  },
                  bbCode: {
                    string_value: "0794",
                  },
                  divCode: {
                    string_value: "7004",
                  },
                  areaCode: {
                    string_value: "5073",
                  },
                  gradeCode: {
                    string_value: "01",
                  },
                  countryCode: {
                    string_value: "BD",
                  },
                  routingNumber: {
                    string_value: "135471759",
                  },
                  swiftCode: {
                    string_value: "JANBBDDHKDA ",
                  },
                  parentBranch: {
                    string_value: "",
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
