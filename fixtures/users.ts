import type { GrpcResponse } from "@/lib/infra-grpc/generated/service";

/**
 * STATIC_USER_RESPONSES mirrors the normalized CBS authentication responses (matching .response/user.normalized.json).
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
      userId: "ZZ0284590",
      fullName: "MD. HADIUZZAMAN BAPPY",
      accessibility: "RIDASH",
      userRole: ["USER"],
      commandLine: true,
      branchName: "CENTRAL OFFICE, HO, DHAKA   ",
      branchCode: "JB9999",
      txnDate: "2026-01-07",
      userStatus: 1,
      authenticated: true,
      token:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJaWjAyODQ1OTAiLCJpYXQiOjE3OTA4NDU2MzUsImV4cCI6MTc5MDkzMjAzNX0.54uGYTHHZYvUSJ1h4wW6Z7qHYv08RAsntswJ8Pk7GD0",
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
      userId: "AD0284590",
      fullName: "System Administrator",
      accessibility: "RIDASH",
      userRole: ["ADMIN"],
      commandLine: true,
      branchName: "CENTRAL OFFICE, HO, DHAKA   ",
      branchCode: "JB9999",
      txnDate: "2026-01-07",
      userStatus: 1,
      authenticated: true,
      token:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJBRDAyODQ1OTAiLCJpYXQiOjE3OTA4NDU2MzUsImV4cCI6MTc5MDkzMjAzNX0.admin_signature_token_cbs",
    },
  },

  // Staff / Standard user (Signon: ST028459, User ID: ST0284590)
  ST028459: {
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "",
    errors: [],
    timestamp: "2026-10-01T09:07:15.421489436Z",
    data: {
      userId: "ST0284590",
      fullName: "New Staff Member",
      accessibility: "RS",
      userRole: ["USER"],
      commandLine: false,
      branchName: "Gulshan Branch",
      branchCode: "JB1002",
      txnDate: "2026-01-07",
      userStatus: 1,
      authenticated: true,
      token:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJTVDAyODQ1OTAiLCJpYXQiOjE3OTA4NDU2MzUsImV4cCI6MTc5MDkzMjAzNX0.new_user_signature_token_cbs",
    },
  },
};
