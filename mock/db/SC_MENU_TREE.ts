import type { MenuTreeNode, MenuTreeRecord } from "@/lib/data-schemas/menu-designer-schema";
import type { CbsVersionedTable } from "./types";

/**
 * SC_MENU_TREE Table Master (PREFIX: SC, TABLE: MENU_TREE)
 */
export const SC_MENU_TREE: Record<string, MenuTreeRecord> = {
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
                command: "ACCOUNT,1.0.0",
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
                label: "Customer Directory Inquiry",
                command: "INQ S GET.CUSTOMER",
                menuType: "POPUP",
                isVisible: true,
                orderIndex: 1,
                children: [],
              },
              {
                id: "n_1786862453089_30",
                menuId: 7,
                label: "Branch Directory Inquiry",
                command: "INQ S GET.BRANCH",
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
            id: "n_1791699756418_6",
            menuId: 11,
            label: "Menu Designer",
            command: "SC.MENU.DESIGN",
            isVisible: true,
            orderIndex: 4,
            children: [],
          },
        ],
      },
    ],
    auditData: {
      recStatus: "AU",
      recCurrNumber: 5,
      recInputter: "SYSADMIN",
      recInputTime: "2026-08-12 10:36:40",
      recAuthorizer: "SYSADMIN",
      recAuthTime: "2026-08-12 10:36:51",
      recBranchCode: "JB9999",
    },
  },
};

export const CBS_MAIN_NAV_TREE: MenuTreeNode[] = SC_MENU_TREE["MENU.MAIN"].menuTree;

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const SC_MENU_TREE_INAU: Record<string, MenuTreeRecord> = {};
export const SC_MENU_TREE_HIS: Record<string, MenuTreeRecord[]> = {};
export const SC_MENU_TREE_DEL: Record<string, MenuTreeRecord> = {};

export const SC_MENU_TREE_TABLE: CbsVersionedTable<MenuTreeRecord> = {
  LIVE: SC_MENU_TREE,
  INAU: SC_MENU_TREE_INAU,
  HIS: SC_MENU_TREE_HIS,
  DEL: SC_MENU_TREE_DEL,
};

export const SC_MENU_TREE_LIST: MenuTreeRecord[] = Object.values(SC_MENU_TREE);
