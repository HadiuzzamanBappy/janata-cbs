import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * STATIC_CONTROL_RESPONSE is 1:1 identical to live CBS wire response format (.response/control.json).
 * Contains representative core banking commands.
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
                  recordId: { string_value: "ACCOUNT" },
                  description: { string_value: "Account Opening & Maintenance" },
                  controlName: { string_value: "ACCOUNT" },
                },
              },
            },
            {
              struct_value: {
                fields: {
                  recordId: { string_value: "FUNDS.TRANSFER" },
                  description: { string_value: "Funds Transfer Operation" },
                  controlName: { string_value: "FUNDS.TRANSFER" },
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
                  recordId: { string_value: "GET.EMP.INFO" },
                  description: { string_value: "Employee Information Enquiry" },
                  controlName: { string_value: "GET.EMP.INFO" },
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
                  recordId: { string_value: "AC.GROUP.ID" },
                  description: { string_value: "Account Group ID" },
                  controlName: { string_value: "AC.GROUP.ID" },
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
