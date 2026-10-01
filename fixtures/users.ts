import type { CurrentUser } from "@/lib/redis";

/**
 * STATIC_USERS mirrors the CBS authentication response format.
 * Includes user credentials, authority level, accessibility rights,
 * branch assignment, and flags extracted from live CBS wire format (.response/user.json).
 */
export const STATIC_USERS: Record<string, CurrentUser> = {
  // Real CBS user payload replica matching .response/user.json
  zz0284590: {
    userId: "ZZ0284590",
    fullName: "MD. HADIUZZAMAN BAPPY",
    userRole: ["TELLER"],
    accessibility: "RIDASH",
    functionRights: ["R", "I", "D", "A", "S", "H"], // Read, Input, Delete, Amend, See, Hold
    branchCode: "JB9999",
    branchName: "CENTRAL OFFICE, HO, DHAKA",
    txnDate: "2026-01-07",
    isLoggedIn: true,
    commandLine: true,
    initLogin: false,
    userStatus: 1,
  },
  // Alias for ZZ028459 (convenience for development)
  zz028459: {
    userId: "ZZ028459",
    fullName: "MD. HADIUZZAMAN BAPPY",
    userRole: ["TELLER"],
    accessibility: "RIDASH",
    functionRights: ["R", "I", "D", "A", "S", "H"],
    branchCode: "JB9999",
    branchName: "CENTRAL OFFICE, HO, DHAKA",
    txnDate: "2026-01-07",
    isLoggedIn: true,
    commandLine: true,
    initLogin: false,
    userStatus: 1,
  },
  // Administrator / Supervisor profile
  admin: {
    userId: "ZZ028460",
    fullName: "System Administrator",
    userRole: ["ADMIN", "SUPERVISOR"],
    accessibility: "RIDASH",
    functionRights: ["R", "I", "D", "A", "S", "H"],
    branchCode: "JB9999",
    branchName: "CENTRAL OFFICE, HO, DHAKA",
    txnDate: "2026-01-07",
    isLoggedIn: true,
    commandLine: true,
    initLogin: false,
    userStatus: 1,
  },
  // First-time login user (testing password change redirect workflow)
  new_user: {
    userId: "ZZ028461",
    fullName: "New Staff Member",
    userRole: ["TELLER"],
    accessibility: "RS",
    functionRights: ["R", "S"],
    branchCode: "JB1002",
    branchName: "Gulshan Branch",
    txnDate: "2026-01-07",
    isLoggedIn: true,
    commandLine: false,
    initLogin: true, // Triggers redirect to /change-password
    userStatus: 1,
  },
};
