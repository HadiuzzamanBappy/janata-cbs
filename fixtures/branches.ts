import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * STATIC_BRANCH_RESPONSE is 1:1 identical to live CBS wire response format (.response/branch.json).
 * Contains 4 canonical representative branches (Head Office, Corporate, and Regional Branches).
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
                  recordId: { string_value: "JB9999" },
                  branchTitle: { string_value: "CENTRAL OFFICE, HO, DHAKA   " },
                  branchType: { string_value: "HO" },
                  branchContact: {
                    list_value: {
                      values: [
                        {
                          struct_value: {
                            fields: {
                              addressLine: { string_value: "Motijheel C/A, Dhaka" },
                              email: { string_value: "ho@janatabank-bd.com" },
                              phone: { string_value: "02-9560000" },
                            },
                          },
                        },
                      ],
                    },
                  },
                  openDate: { string_value: "20100101" },
                  isActive: { bool_value: true },
                  bbCode: { string_value: "0001" },
                  divCode: { string_value: "7001" },
                  areaCode: { string_value: "5035" },
                  gradeCode: { string_value: "01" },
                  countryCode: { string_value: "BD" },
                  routingNumber: { string_value: "135270001" },
                  swiftCode: { string_value: "JANBBDDHXXX " },
                  parentBranch: { string_value: "" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "JB0001" },
                  branchTitle: { string_value: "IMAMGONJ CORPORATE  " },
                  branchType: { string_value: "BR" },
                  branchContact: {
                    list_value: {
                      values: [
                        {
                          struct_value: {
                            fields: {
                              addressLine: { string_value: "Imamgonj, Dhaka" },
                              email: { null_value: "NULL_VALUE" },
                              phone: { null_value: "NULL_VALUE" },
                            },
                          },
                        },
                      ],
                    },
                  },
                  openDate: { string_value: "20250101" },
                  isActive: { bool_value: true },
                  bbCode: { string_value: "0373" },
                  divCode: { string_value: "7001" },
                  areaCode: { string_value: "5035" },
                  gradeCode: { string_value: "01" },
                  countryCode: { string_value: "BD" },
                  routingNumber: { string_value: "135272837" },
                  swiftCode: { string_value: "JANBBDDHIMA " },
                  parentBranch: { string_value: "" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "JB0002" },
                  branchTitle: { string_value: "LALDIGHI EAST CORP. " },
                  branchType: { string_value: "BR" },
                  branchContact: {
                    list_value: {
                      values: [
                        {
                          struct_value: {
                            fields: {
                              addressLine: { string_value: "Laldighi East, Chattogram" },
                              email: { null_value: "NULL_VALUE" },
                              phone: { null_value: "NULL_VALUE" },
                            },
                          },
                        },
                      ],
                    },
                  },
                  openDate: { string_value: "20250101" },
                  isActive: { bool_value: true },
                  bbCode: { string_value: "0083" },
                  divCode: { string_value: "7003" },
                  areaCode: { string_value: "5020" },
                  gradeCode: { string_value: "01" },
                  countryCode: { string_value: "BD" },
                  routingNumber: { string_value: "135154542" },
                  swiftCode: { string_value: "JANBBDDHLDE " },
                  parentBranch: { string_value: "" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "JB1002" },
                  branchTitle: { string_value: "GULSHAN BRANCH      " },
                  branchType: { string_value: "BR" },
                  branchContact: {
                    list_value: {
                      values: [
                        {
                          struct_value: {
                            fields: {
                              addressLine: { string_value: "Gulshan-2, Dhaka" },
                              email: { null_value: "NULL_VALUE" },
                              phone: { null_value: "NULL_VALUE" },
                            },
                          },
                        },
                      ],
                    },
                  },
                  openDate: { string_value: "20250101" },
                  isActive: { bool_value: true },
                  bbCode: { string_value: "0492" },
                  divCode: { string_value: "7001" },
                  areaCode: { string_value: "5035" },
                  gradeCode: { string_value: "01" },
                  countryCode: { string_value: "BD" },
                  routingNumber: { string_value: "135272999" },
                  swiftCode: { string_value: "JANBBDDHGUL " },
                  parentBranch: { string_value: "" },
                },
              },
            },
          ],
        },
      },
    },
  },
};
