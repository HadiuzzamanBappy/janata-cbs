import type { MenuItem } from "@/lib/schema/schemas";

/**
 * Offline development mock menu hierarchy tree.
 */
export const STATIC_MENU: MenuItem[] = [
  {
    id: "user-management",
    menuId: 1,
    label: "User Management",
    children: [
      {
        id: "user-create",
        menuId: 5,
        label: "Create User",
        command: "USER.CREATE",
      },
      {
        id: "user-list",
        menuId: 6,
        label: "User List",
        command: "USER.LIST",
      },
    ],
  },
  {
    id: "account-manage",
    menuId: 2,
    label: "Account Manage",
    children: [
      {
        id: "account-create",
        menuId: 7,
        label: "Create Account",
        command: "ACCOUNT",
      },
    ],
  },
  {
    id: "funds-manage",
    menuId: 3,
    label: "Funds Manage",
    children: [
      {
        id: "funds-transfer",
        menuId: 8,
        label: "Funds Transfer",
        command: "FUNDS.TRANSFER",
      },
    ],
  },
  {
    id: "daily-report",
    menuId: 4,
    label: "Daily Report",
    children: [
      {
        id: "txn-entry",
        menuId: 9,
        label: "Today Txn Entry",
        command: "REPORT.TXN.ENTRY",
      },
      {
        id: "txn-report",
        menuId: 10,
        label: "Today Txn Report",
        command: "REPORT.TXN.DAILY",
      },
    ],
  },
];
