import type { MenuTreeNode, MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";
import type { GrpcResponse } from "@/lib/infra-grpc/generated/service";

/**
 * Canonical Navigation Tree Nodes
 * Each leaf node references a mnemonic menu recordId (e.g. ACCOUNT.CREATE, CUST.CREATE)
 */
export const CBS_MAIN_NAV_TREE: MenuTreeNode[] = [
  {
    id: "n_operational",
    menuId: "GRP.OPERATIONAL",
    label: "Operational Banking",
    command: "",
    isVisible: true,
    orderIndex: 1,
    children: [
      {
        id: "n_acct_manage",
        menuId: "GRP.ACCOUNT",
        label: "Account Management",
        command: "",
        isVisible: true,
        orderIndex: 1,
        children: [
          {
            id: "n_acct_create",
            menuId: "ACCOUNT.CREATE",
            label: "Open Customer Account",
            command: "ACCOUNT I",
            isVisible: true,
            orderIndex: 1,
            children: [],
          },
          {
            id: "n_acct_view",
            menuId: "ACCOUNT.VIEW",
            label: "Account Overview & Details",
            command: "ACCOUNT S",
            isVisible: true,
            orderIndex: 2,
            children: [],
          },
        ],
      },
      {
        id: "n_cust_manage",
        menuId: "GRP.CUSTOMER",
        label: "Customer Management",
        command: "",
        isVisible: true,
        orderIndex: 2,
        children: [
          {
            id: "n_cust_create",
            menuId: "CUSTOMER.CREATE",
            label: "Customer Master Onboarding",
            command: "CUSTOMER I",
            isVisible: true,
            orderIndex: 1,
            children: [],
          },
          {
            id: "n_cust_view",
            menuId: "CUSTOMER.VIEW",
            label: "Customer KYC & 360 View",
            command: "CUSTOMER S",
            isVisible: true,
            orderIndex: 2,
            children: [],
          },
        ],
      },
      {
        id: "n_user_manage",
        menuId: "GRP.USER",
        label: "User Requests & HR",
        command: "",
        isVisible: true,
        orderIndex: 3,
        children: [
          {
            id: "n_emp_info",
            menuId: "USER.EMP.INFO",
            label: "Employee Directory Inquiry",
            command: "INQ S GET.EMP.INFO",
            isVisible: true,
            orderIndex: 1,
            children: [],
          },
          {
            id: "n_user_create",
            menuId: "USER.REQUEST.NEW",
            label: "Create User Request",
            command: "USER.MGT,NEW1",
            isVisible: true,
            orderIndex: 2,
            children: [],
          },
          {
            id: "n_user_unauth",
            menuId: "USER.UNAUTH.LIST",
            label: "Unauthorized User Requests",
            command: "INQ S GET.USER.MGT",
            isVisible: true,
            orderIndex: 3,
            children: [],
          },
        ],
      },
      {
        id: "n_daily_inquiry",
        menuId: "GRP.INQUIRY",
        label: "Ledger & Inquiries",
        command: "",
        isVisible: true,
        orderIndex: 4,
        children: [
          {
            id: "n_today_txn",
            menuId: "INQ.TODAY.TXN",
            label: "Today Transaction Entry",
            command: "INQ S GET.TODAY.ENTRY",
            isVisible: true,
            orderIndex: 1,
            children: [],
          },
          {
            id: "n_acct_bal",
            menuId: "INQ.ACCT.BAL",
            label: "Realtime Ledger Balance",
            command: "INQ ACCT.BAL",
            isVisible: true,
            orderIndex: 2,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "n_system_admin",
    menuId: "GRP.SYSADMIN",
    label: "System Administration",
    command: "",
    isVisible: true,
    orderIndex: 2,
    children: [
      {
        id: "n_model_config",
        menuId: "SYS.MODEL.CONFIG",
        label: "Data Model Config",
        command: "SC.MODEL.CONFIG",
        isVisible: true,
        orderIndex: 1,
        children: [],
      },
      {
        id: "n_form_config",
        menuId: "SYS.FORM.CONFIG",
        label: "Form Design Studio",
        command: "SC.FORM.CONFIG",
        isVisible: true,
        orderIndex: 2,
        children: [],
      },
      {
        id: "n_menu_designer",
        menuId: "SYS.MENU.DESIGN",
        label: "Menu Tree Designer",
        command: "SC.MENU.DESIGN",
        isVisible: true,
        orderIndex: 3,
        children: [],
      },
      {
        id: "n_menu_catalog",
        menuId: "SYS.MENU.CATALOG",
        label: "Menu Item Catalog",
        command: "MENU",
        isVisible: true,
        orderIndex: 4,
        children: [],
      },
      {
        id: "n_user_group",
        menuId: "SYS.USER.GROUP",
        label: "User Group & Permissions",
        command: "USER.GROUP",
        isVisible: true,
        orderIndex: 5,
        children: [],
      },
    ],
  },
];

/**
 * Secondary Operations & Administration Tree
 */
export const CBS_SECONDARY_NAV_TREE: MenuTreeNode[] = [
  CBS_MAIN_NAV_TREE[1], // System Administration branch
];

/**
 * SC_MENU_TREE Table Master (PREFIX: SC, TABLE: MENU_TREE)
 */
export const SC_MENU_TREE_LIVE: Record<string, MenuTreeRecord> = {
  "MENU.MAIN": {
    recordId: "MENU.MAIN",
    treeDescription: "Primary Core Banking Navigation Tree",
    isActive: true,
    menuTree: CBS_MAIN_NAV_TREE,
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 5,
      recInputter: "SYSADMIN",
      recInputTime: "2026-08-12 10:36:40",
      recAuthorizer: "SYSADMIN",
      recAuthTime: "2026-08-12 10:36:51",
      recBranchCode: "JB9999",
    },
  },
  "MENU.SECONDARY": {
    recordId: "MENU.SECONDARY",
    treeDescription: "Secondary Operations & Admin Tree",
    isActive: true,
    menuTree: CBS_SECONDARY_NAV_TREE,
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-09-01 10:00:00",
      recAuthorizer: "SYSADMIN",
      recAuthTime: "2026-09-01 10:05:00",
      recBranchCode: "JB9999",
    },
  },
};

export const SC_MENU_TREE_TABLE = SC_MENU_TREE_LIVE;
export const SC_MENU_TREE_LIST: MenuTreeRecord[] = Object.values(SC_MENU_TREE_LIVE);

/**
 * Wire response envelope for CBS application shell (defaults to primary MENU.MAIN).
 */
export const STATIC_MENU: GrpcResponse = {
  status: "SUCCESS",
  statusCode: 200,
  idempotencyKey: "",
  message: "record successfully processed!",
  errors: [],
  timestamp: "2026-10-01T09:08:40.738560187Z",
  data: {
    records: SC_MENU_TREE_LIVE["MENU.MAIN"].menuTree,
  },
};

export function getMenuTreeRecord(id: string): MenuTreeRecord | null {
  const cleanId = id.trim().toUpperCase();
  if (SC_MENU_TREE_LIVE[cleanId]) return SC_MENU_TREE_LIVE[cleanId];
  if (cleanId === "MAIN") return SC_MENU_TREE_LIVE["MENU.MAIN"];
  if (cleanId === "SECONDARY") return SC_MENU_TREE_LIVE["MENU.SECONDARY"];
  return null;
}

export function listMenuTreeSummaries() {
  return SC_MENU_TREE_LIST.map((tree) => ({
    id: tree.recordId,
    label: tree.treeDescription,
    details: `${tree.menuTree.length} root categories`,
    record: tree,
  }));
}
