import type { MenuCatalogRecord } from "@/lib/data-schemas/menu-catalog-schema";
import type { CbsVersionedTable } from "./types";

/**
 * SC_MENU Table Master (PREFIX: SC, TABLE: MENU)
 * Stores individual registered menu catalog action items and commands.
 * Normalized and synchronized with fixtures/.response/menu.normalized.json
 */
export const SC_MENU_LIVE: Record<string, MenuCatalogRecord> = {
  // --- Operational Dynamic GMC Forms ---
  "1": {
    label: "Account Maintenance",
    command: "ACCOUNT",
    menuType: "SCREEN",
    description: "Customer savings and current account management",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-10 09:30:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-10 09:32:00",
      recBranchCode: "JB9999",
    },
  },
  "2": {
    label: "Customer Master",
    command: "CUSTOMER",
    menuType: "SCREEN",
    description: "Customer onboarding, KYC, and profile maintenance",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-12 11:20:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-12 11:25:00",
      recBranchCode: "JB9999",
    },
  },
  "3": {
    label: "User Profile Setup",
    command: "USER",
    menuType: "SCREEN",
    description: "User operator profile provisioning and maintenance",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-12 11:20:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-12 11:25:00",
      recBranchCode: "JB9999",
    },
  },

  // --- Valid CBS Inquiries (Executed via INQ command) ---
  "4": {
    label: "Account Directory Inquiry",
    command: "INQ S GET.ACCOUNT",
    menuType: "SCREEN",
    description: "Account enquiry with customer balances and status",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-18 10:15:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-18 10:20:00",
      recBranchCode: "JB9999",
    },
  },
  "5": {
    label: "Daily Transaction Journal",
    command: "INQ S GET.TODAY.ENTRY",
    menuType: "POPUP",
    description: "Daily transaction journal entries inquiry (Detached Multi-Monitor Popup Window)",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-18 10:15:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-18 10:20:00",
      recBranchCode: "JB9999",
    },
  },
  "6": {
    label: "Employee Directory Inquiry",
    command: "INQ S GET.EMP.INFO",
    menuType: "SCREEN",
    description: "Employee information and profile inquiry",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-12 11:20:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-12 11:25:00",
      recBranchCode: "JB9999",
    },
  },
  "7": {
    label: "Department Directory Inquiry",
    command: "INQ S GET.DEP.LIST",
    menuType: "SCREEN",
    description: "Department master list and organizational units inquiry",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-18 10:15:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-18 10:20:00",
      recBranchCode: "JB9999",
    },
  },

  // --- Development & Administrative Utilities ---
  "8": {
    label: "Model Builder",
    command: "SC.MODEL.BUILDER",
    menuType: "SCREEN",
    description: "CBS Data Dictionary and Schema Designer",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-01 16:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-01 16:10:00",
      recBranchCode: "JB9999",
    },
  },
  "9": {
    label: "Form Builder",
    command: "SC.FORM.BUILDER",
    menuType: "SCREEN",
    description: "Dynamic Form Designer and Layout Studio",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-01 16:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-01 16:10:00",
      recBranchCode: "JB9999",
    },
  },
  "10": {
    label: "Inquiry Designer",
    command: "SC.INQUIRY",
    menuType: "SCREEN",
    description: "Inquiry and Query Definition Designer",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-01 16:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-01 16:10:00",
      recBranchCode: "JB9999",
    },
  },
  "11": {
    label: "Menu Designer",
    command: "SC.MENU.DESIGN",
    menuType: "SCREEN",
    description: "Interactive Navigation Tree Builder",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-10 11:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-10 11:05:00",
      recBranchCode: "JB9999",
    },
  },
  "12": {
    label: "Menu Item Catalog",
    command: "SC.MENU",
    menuType: "SCREEN",
    description: "Menu item and action catalog administration",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-10 11:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-10 11:05:00",
      recBranchCode: "JB9999",
    },
  },
  "13": {
    label: "User Group Setup",
    command: "SC.USER.GROUP",
    menuType: "SCREEN",
    description: "Role-based access control and user groups",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-15 13:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-15 13:10:00",
      recBranchCode: "JB9999",
    },
  },
  "14": {
    label: "Report Studio",
    command: "SC.REPORT.BUILDER",
    menuType: "SCREEN",
    description: "Custom report and financial statement generator",
    isActive: true,
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-15 13:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-15 13:10:00",
      recBranchCode: "JB9999",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const SC_MENU_INAU: Record<string, MenuCatalogRecord> = {};
export const SC_MENU_HIS: Record<string, MenuCatalogRecord[]> = {};
export const SC_MENU_DEL: Record<string, MenuCatalogRecord> = {};

export const SC_MENU_TABLE: CbsVersionedTable<MenuCatalogRecord> = {
  LIVE: SC_MENU_LIVE,
  INAU: SC_MENU_INAU,
  HIS: SC_MENU_HIS,
  DEL: SC_MENU_DEL,
};

export const SC_MENU_LIST: MenuCatalogRecord[] = Object.values(SC_MENU_LIVE);
