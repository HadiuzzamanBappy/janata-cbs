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
        menuId: 100,
        label: "Operational",
        command: "",
        isVisible: true,
        orderIndex: 1,
        children: [
          {
            id: "n_1786858625499_2",
            menuId: 101,
            label: "Customer Manage",
            command: "",
            isVisible: true,
            orderIndex: 1,
            children: [
              {
                id: "n_1786859112388_8",
                menuId: 2,
                label: "Customer Master",
                command: "CUSTOMER",
                isVisible: true,
                orderIndex: 1,
                children: [],
              },
            ],
          },
          {
            id: "n_1786858625931_3",
            menuId: 102,
            label: "Account Manage",
            command: "",
            isVisible: true,
            orderIndex: 2,
            children: [
              {
                id: "n_1786859119420_9",
                menuId: 1,
                label: "Account Maintenance",
                command: "ACCOUNT",
                isVisible: true,
                orderIndex: 1,
                children: [],
              },
              {
                id: "n_1786862443210_20",
                menuId: 4,
                label: "Account Directory Inquiry",
                command: "INQ S GET.ACCOUNT",
                isVisible: true,
                orderIndex: 2,
                children: [],
              },
            ],
          },
          {
            id: "n_1786858624172_1",
            menuId: 103,
            label: "User Management",
            command: "",
            isVisible: true,
            orderIndex: 3,
            children: [
              {
                id: "n_1786858700779_25",
                menuId: 3,
                label: "User Profile Setup",
                command: "USER",
                isVisible: true,
                orderIndex: 1,
                children: [],
              },
              {
                id: "n_1787137168951_1",
                menuId: 6,
                label: "Employee Directory Inquiry",
                command: "INQ S GET.EMP.INFO",
                isVisible: true,
                orderIndex: 2,
                children: [],
              },
            ],
          },
          {
            id: "n_1786862427083_1",
            menuId: 104,
            label: "Daily Inquiry",
            command: "",
            isVisible: true,
            orderIndex: 4,
            children: [
              {
                id: "n_1786862453089_3",
                menuId: 5,
                label: "Daily Transaction Journal",
                command: "INQ S GET.TODAY.ENTRY",
                menuType: "POPUP",
                isVisible: true,
                orderIndex: 1,
                children: [],
              },
              {
                id: "n_1786862453089_30",
                menuId: 7,
                label: "Department Directory Inquiry",
                command: "INQ S GET.DEP.LIST",
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
        menuId: 105,
        label: "Development Utility",
        command: "",
        isVisible: true,
        orderIndex: 2,
        children: [
          {
            id: "n_1791699737289_3",
            menuId: 8,
            label: "Model Builder",
            command: "SC.MODEL.BUILDER",
            isVisible: true,
            orderIndex: 1,
            children: [],
          },
          {
            id: "n_1791699755769_4",
            menuId: 9,
            label: "Form Builder",
            command: "SC.FORM.BUILDER",
            isVisible: true,
            orderIndex: 2,
            children: [],
          },
          {
            id: "n_1791699756201_5",
            menuId: 10,
            label: "Inquiry Designer",
            command: "SC.INQUIRY",
            isVisible: true,
            orderIndex: 3,
            children: [],
          },
          {
            id: "n_1791699756626_7",
            menuId: 12,
            label: "Menu Item Catalog",
            command: "SC.MENU",
            isVisible: true,
            orderIndex: 4,
            children: [],
          },
          {
            id: "n_1791699756418_6",
            menuId: 11,
            label: "Menu Designer",
            command: "SC.MENU.DESIGN",
            isVisible: true,
            orderIndex: 5,
            children: [],
          },
          {
            id: "n_1791699756817_8",
            menuId: 13,
            label: "User Group Setup",
            command: "SC.USER.GROUP",
            isVisible: true,
            orderIndex: 6,
            children: [],
          },
          {
            id: "n_1791699828305_10",
            menuId: 14,
            label: "Report Studio",
            command: "SC.REPORT.BUILDER",
            isVisible: true,
            orderIndex: 7,
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
        menuId: 200,
        label: "Quick Operations",
        command: "",
        isVisible: true,
        orderIndex: 1,
        children: [
          {
            id: "sec_node_101",
            menuId: 1,
            label: "Account Maintenance",
            command: "ACCOUNT",
            isVisible: true,
            orderIndex: 1,
            children: [],
          },
          {
            id: "sec_node_102",
            menuId: 2,
            label: "Customer Master",
            command: "CUSTOMER",
            isVisible: true,
            orderIndex: 2,
            children: [],
          },
          {
            id: "sec_node_103",
            menuId: 5,
            label: "Daily Transaction Journal",
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
