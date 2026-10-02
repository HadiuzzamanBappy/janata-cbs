import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * STATIC_USER_RESPONSES mirrors the exact CBS authentication wire responses (matching .response/user.json 1:1).
 * Number sequence remains identical (028459 -> 0284590).
 * Prefix letters vary by role/department (ZZ = Teller/Lead, AD = Administrator, ST = Staff).
 */
export const STATIC_USER_RESPONSES: Record<string, GrpcResponse> = {
  // Primary Teller / Lead (Signon: ZZ028459, User ID: ZZ0284590)
  ZZ028459: {
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "",
    errors: [],
    timestamp: "2026-10-01T09:07:15.421489436Z",
    data: {
      fields: {
        userId: {
          string_value: "ZZ0284590",
        },
        fullName: {
          string_value: "MD. HADIUZZAMAN BAPPY",
        },
        accessibility: {
          string_value: "RIDASH",
        },
        userRole: {
          null_value: "NULL_VALUE",
        },
        commandLine: {
          bool_value: true,
        },
        branchName: {
          string_value: "CENTRAL OFFICE, HO, DHAKA   ",
        },
        branchCode: {
          string_value: "JB9999",
        },
        txnDate: {
          string_value: "2026-01-07",
        },
        userStatus: {
          number_value: 1,
        },
        authenticated: {
          bool_value: true,
        },
        token: {
          string_value:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJaWjAyODQ1OTAiLCJpYXQiOjE3OTA4NDU2MzUsImV4cCI6MTc5MDkzMjAzNX0.54uGYTHHZYvUSJ1h4wW6Z7qHYv08RAsntswJ8Pk7GD0",
        },
      },
    },
  },

  // Supervisor / Administrator (Signon: AD028459, User ID: AD0284590)
  AD028459: {
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "",
    errors: [],
    timestamp: "2026-10-01T09:07:15.421489436Z",
    data: {
      fields: {
        userId: {
          string_value: "AD0284590",
        },
        fullName: {
          string_value: "System Administrator",
        },
        accessibility: {
          string_value: "RIDASH",
        },
        userRole: {
          null_value: "NULL_VALUE",
        },
        commandLine: {
          bool_value: true,
        },
        branchName: {
          string_value: "CENTRAL OFFICE, HO, DHAKA   ",
        },
        branchCode: {
          string_value: "JB9999",
        },
        txnDate: {
          string_value: "2026-01-07",
        },
        userStatus: {
          number_value: 1,
        },
        authenticated: {
          bool_value: true,
        },
        token: {
          string_value:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJBRDAyODQ1OTAiLCJpYXQiOjE3OTA4NDU2MzUsImV4cCI6MTc5MDkzMjAzNX0.admin_signature_token_cbs",
        },
      },
    },
  },

  // Staff / First-time user (Signon: ST028459, User ID: ST0284590)
  ST028459: {
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "",
    errors: [],
    timestamp: "2026-10-01T09:07:15.421489436Z",
    data: {
      fields: {
        userId: {
          string_value: "ST0284590",
        },
        fullName: {
          string_value: "New Staff Member",
        },
        accessibility: {
          string_value: "RS",
        },
        userRole: {
          null_value: "NULL_VALUE",
        },
        commandLine: {
          bool_value: false,
        },
        branchName: {
          string_value: "Gulshan Branch",
        },
        branchCode: {
          string_value: "JB1002",
        },
        txnDate: {
          string_value: "2026-01-07",
        },
        userStatus: {
          number_value: 1,
        },
        authenticated: {
          bool_value: true,
        },
        token: {
          string_value:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJTVDAyODQ1OTAiLCJpYXQiOjE3OTA4NDU2MzUsImV4cCI6MTc5MDkzMjAzNX0.new_user_signature_token_cbs",
        },
      },
    },
  },
};
