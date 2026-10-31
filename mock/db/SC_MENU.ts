import type { MenuCatalogRecord } from "@/lib/data-schemas/menu-catalog-schema";
import type { CbsVersionedTable } from "./types";

/**
 * SC_MENU Table Master (PREFIX: SC, TABLE: MENU)
 * Stores individual registered menu catalog action items and commands.
 * Corresponds to Temenos HELPTEXT.MENU / leaf item definitions.
 */
export const SC_MENU_LIVE: Record<string, MenuCatalogRecord> = {
  // --- Operational Dynamic GMC Forms ---
  "1": {
    recordId: "1",
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
    recordId: "2",
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
    recordId: "3",
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
    recordId: "4",
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
    recordId: "5",
    label: "Customer Directory Inquiry",
    command: "INQ S GET.CUSTOMER",
    menuType: "POPUP",
    description: "Customer directory inquiry (Detached Multi-Monitor Popup Window)",
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
    recordId: "6",
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
    recordId: "7",
    label: "Branch Directory Inquiry",
    command: "INQ S GET.BRANCH",
    menuType: "SCREEN",
    description: "Branch master list and organizational units inquiry",
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
    recordId: "8",
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
    recordId: "9",
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
    recordId: "10",
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
    recordId: "11",
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
