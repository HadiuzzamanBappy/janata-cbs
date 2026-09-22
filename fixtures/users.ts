import type { CurrentUser } from "@/lib/core/redis-session";

export const STATIC_USERS: Record<string, CurrentUser> = {
  // A standard teller login (Username: ZZ028459)
  zz028459: {
    userId: "ZZ028459",
    fullName: "Teller User",
    userRole: ["TELLER"],
    accessibility: "STANDARD",
    branchCode: "JB1001",
    branchName: "Motijheel Branch",
    txnDate: new Date().toISOString().split("T")[0],
    isLoggedIn: true,
    commandLine: false,
    initLogin: false,
    userStatus: 1,
  },
  // An admin login (Username: ZZ028460)
  zz028460: {
    userId: "ZZ028460",
    fullName: "System Administrator",
    userRole: ["ADMIN"],
    accessibility: "FULL",
    branchCode: "JB9999",
    branchName: "Head Office",
    txnDate: new Date().toISOString().split("T")[0],
    isLoggedIn: true,
    commandLine: true,
    initLogin: false,
    userStatus: 1,
  },
  // A new user that must change their password (Username: ZZ028461)
  zz028461: {
    userId: "ZZ028461",
    fullName: "New Staff Member",
    userRole: ["TELLER"],
    accessibility: "STANDARD",
    branchCode: "JB1002",
    branchName: "Gulshan Branch",
    txnDate: new Date().toISOString().split("T")[0],
    isLoggedIn: true,
    commandLine: false,
    initLogin: true, // This triggers the redirect to /change-password
    userStatus: 1,
  },
};
