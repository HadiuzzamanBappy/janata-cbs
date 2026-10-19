import type { MenuTreeNode, MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";
import type { CbsVersionedTable } from "./types";

/**
 * SC_MENU_TREE Table Master (PREFIX: SC, TABLE: MENU_TREE)
 */
export const SC_MENU_TREE_LIVE: Record<string, MenuTreeRecord> = {
  "MENU.MAIN": {
    recordId: "MENU.MAIN",
    treeDescription: "Primary Core Banking Navigation Tree",
    isActive: true,
    menuTree: [
      {
        id: "n_1786858616121_0",
        menuId: 1,
        label: "Operational",
        command: "",
        isVisible: true,
        orderIndex: 1,
        children: [
          {
            id: "n_1786858624172_1",
            menuId: 13,
            label: "User Management",
            command: "",
            isVisible: true,
            orderIndex: 1,
            children: [
              {
                id: "n_1786858673775_5",
                menuId: 14,
                label: "User Request",
                command: "",
                isVisible: true,
                orderIndex: 1,
                children: [
                  {
                    id: "n_1787137168951_1",
                    menuId: 29,
                    label: "User Request",
                    command: "INQ S GET.EMP.INFO",
                    isVisible: true,
                    orderIndex: 1,
                    children: [],
                  },
                  {
                    id: "n_1791696187922_3",
                    menuId: 23,
                    label: "Unauthorize User List",
                    command: "INQ S USER.MGT.NAU.LIST",
                    isVisible: true,
                    orderIndex: 2,
                    children: [],
                  },
                  {
                    id: "n_1786858700779_6",
                    menuId: 15,
                    label: "Create User Request",
                    command: "USER.MGT,NEW1",
                    isVisible: true,
                    orderIndex: 3,
                    children: [],
                  },
                  {
                    id: "n_1786858707338_7",
                    menuId: 16,
                    label: "Unauthrized User Request List",
                    command: "INQ S GET.USER.MGT",
                    isVisible: true,
                    orderIndex: 4,
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            id: "n_1786858625499_2",
            menuId: 3,
            label: "Customer Manage",
            command: "",
            isVisible: true,
            orderIndex: 2,
            children: [
              {
                id: "n_1786859112388_8",
                menuId: 24,
                label: "Open / Edit General Customer ",
                command: "CUSTOMER,GENERAL",
                isVisible: true,
                orderIndex: 1,
                children: [],
              },
              {
                id: "n_1791358772946_1",
                menuId: 6,
                label: "Open / Edit Corporate Customer",
                command: "CUSTOMER,CORPORATE",
                isVisible: true,
                orderIndex: 2,
                children: [],
              },
              {
                id: "n_1791707614652_1",
                menuId: 41,
                label: "Create / Edit Govt.  Customer",
                command: "CUSTOMER,GOVERNMENT",
                isVisible: true,
                orderIndex: 3,
                children: [],
              },
              {
                id: "n_1791713757585_1",
                menuId: 42,
                label: "Open / Edit Staff Customer",
                command: "CUSTOMER,STAFF",
                isVisible: true,
                orderIndex: 4,
                children: [],
              },
            ],
          },
          {
            id: "n_1786858625931_3",
            menuId: 4,
            label: "Account Manage",
            command: "",
            isVisible: true,
            orderIndex: 3,
            children: [
              {
                id: "n_1786859119420_9",
                menuId: 7,
                label: "Create Accouont",
                command: "ACCOUNT",
                isVisible: true,
                orderIndex: 1,
                children: [],
              },
            ],
          },
          {
            id: "n_1786858648899_4",
            menuId: 5,
            label: "Funds Manage",
            command: "",
            isVisible: true,
            orderIndex: 4,
            children: [
              {
                id: "n_1786859124995_10",
                menuId: 8,
                label: "Funds Transfer",
                command: "FUNDS.TRANSFER",
                isVisible: true,
                orderIndex: 1,
                children: [],
              },
            ],
          },
          {
            id: "n_1786862427083_1",
            menuId: 10,
            label: "Daily Inquiry",
            command: "",
            isVisible: true,
            orderIndex: 5,
            children: [
              {
                id: "n_1786862443210_2",
                menuId: 17,
                label: "Today Txn Report",
                command: "INQ S GET.TO.TXN",
                isVisible: true,
                orderIndex: 1,
                children: [],
              },
              {
                id: "n_1786862453089_3",
                menuId: 19,
                label: "Today Txn Entry",
                command: "INQ S GET.TODAY.ENTRY",
                isVisible: true,
                orderIndex: 2,
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "n_1791699482794_1",
        menuId: 31,
        label: "Development Utility",
        command: "",
        isVisible: true,
        orderIndex: 2,
        children: [
          {
            id: "n_1791699737289_3",
            menuId: 32,
            label: "Model Builder",
            command: "SC.MODEL.BUILDER",
            isVisible: true,
            orderIndex: 1,
            children: [],
          },
          {
            id: "n_1791699755769_4",
            menuId: 33,
            label: "Form Builder",
            command: "SC.FORM.BUILDER",
            isVisible: true,
            orderIndex: 2,
            children: [],
          },
          {
            id: "n_1791699756201_5",
            menuId: 34,
            label: "Inquiry Designer",
            command: "SC.INQUIRY",
            isVisible: true,
            orderIndex: 3,
            children: [],
          },
          {
            id: "n_1791699756626_7",
            menuId: 36,
            label: "Menu",
            command: "SC.MENU",
            isVisible: true,
            orderIndex: 4,
            children: [],
          },
          {
            id: "n_1791699756418_6",
            menuId: 35,
            label: "Menu Designer",
            command: "SC.MENU.DESIGN",
            isVisible: true,
            orderIndex: 5,
            children: [],
          },
          {
            id: "n_1791699756817_8",
            menuId: 37,
            label: "User Group Setup",
            command: "SC.USER.GROUP",
            isVisible: true,
            orderIndex: 6,
            children: [],
          },
          {
            id: "n_1791699828305_10",
            menuId: 39,
            label: "Report Builder",
            command: "SC.REPORT.BUILDER",
            isVisible: true,
            orderIndex: 8,
            children: [],
          },
        ],
      },
    ],
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
    menuTree: [
      {
        id: "sec_node_100",
        menuId: 100,
        label: "Quick Operations",
        command: "",
        isVisible: true,
        orderIndex: 1,
        children: [
          {
            id: "sec_node_101",
            menuId: 101,
            label: "Account Master",
            command: "ACCOUNT",
            isVisible: true,
            orderIndex: 1,
            children: [],
          },
          {
            id: "sec_node_102",
            menuId: 102,
            label: "Customer Master",
            command: "CUSTOMER,GENERAL",
            isVisible: true,
            orderIndex: 2,
            children: [],
          },
          {
            id: "sec_node_103",
            menuId: 103,
            label: "Today's Transaction Journal",
            command: "INQ S GET.TODAY.ENTRY",
            isVisible: true,
            orderIndex: 3,
            children: [],
          },
        ],
      },
    ],
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

export const CBS_MAIN_NAV_TREE: MenuTreeNode[] = SC_MENU_TREE_LIVE["MENU.MAIN"].menuTree;
export const CBS_SECONDARY_NAV_TREE: MenuTreeNode[] = SC_MENU_TREE_LIVE["MENU.SECONDARY"].menuTree;

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const SC_MENU_TREE_INAU: Record<string, MenuTreeRecord> = {};
export const SC_MENU_TREE_HIS: Record<string, MenuTreeRecord[]> = {};
export const SC_MENU_TREE_DEL: Record<string, MenuTreeRecord> = {};

export const SC_MENU_TREE_TABLE: CbsVersionedTable<MenuTreeRecord> = {
  LIVE: SC_MENU_TREE_LIVE,
  INAU: SC_MENU_TREE_INAU,
  HIS: SC_MENU_TREE_HIS,
  DEL: SC_MENU_TREE_DEL,
};

export const SC_MENU_TREE_LIST: MenuTreeRecord[] = Object.values(SC_MENU_TREE_LIVE);
