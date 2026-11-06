import type { AuditData } from "@/lib/data-schemas/common-schema";
import type { CbsVersionedTable } from "./types";

/**
 * MenuRecord: The canonical database table schema for SC_MENU (matching SC_MODEL_CONFIG MENU).
 */
export interface MenuRecord {
  label: string;
  command: string;
  menuType: string;
  menuAction?: string;
  auditData?: AuditData;
}

/**
 * SC_MENU Table Master (PREFIX: SC, TABLE: MENU)
 * Stores individual registered menu catalog action items and commands.
 * Corresponds to Temenos HELPTEXT.MENU / leaf item definitions.
 */
export const SC_MENU_LIVE: Record<string, MenuRecord> = {
  // --- Operational Dynamic GMC Forms ---
  "1": {
    label: "Account Maintenance",
    command: "ACCOUNT",
    menuType: "FORM",
    menuAction: "SCREEN",
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
    menuType: "FORM",
    menuAction: "SCREEN",
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
    menuType: "FORM",
    menuAction: "SCREEN",
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
  "12": {
    label: "Enterprise User Master",
    command: "USERS,1.0.0",
    menuType: "FORM",
    menuAction: "SCREEN",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-03-01 10:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-03-01 10:05:00",
      recBranchCode: "JB9999",
    },
  },

  // --- Valid CBS Inquiries (Executed via INQ command) ---
  "4": {
    label: "Account Directory Inquiry",
    command: "INQ S GET.ACCOUNT",
    menuType: "INQUIRY",
    menuAction: "SCREEN",
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
    label: "Customer Directory Inquiry",
    command: "INQ GET.CUSTOMER",
    menuType: "INQUIRY",
    menuAction: "POPUP",
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
    command: "INQ GET.EMP.INFO",
    menuType: "INQUIRY",
    menuAction: "SCREEN",
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
    label: "Branch Directory Inquiry",
    command: "INQ GET.BRANCH",
    menuType: "INQUIRY",
    menuAction: "SCREEN",
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
    label: "Model Config",
    command: "SC.MODEL.CONFIG",
    menuType: "FORM",
    menuAction: "SCREEN",
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
    label: "Form Config",
    command: "SC.FORM.CONFIG",
    menuType: "FORM",
    menuAction: "SCREEN",
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
    label: "Inquiry Config",
    command: "SC.INQUIRY.CONFIG",
    menuType: "FORM",
    menuAction: "SCREEN",
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
    menuType: "FORM",
    menuAction: "SCREEN",
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

  // --- Standard Menu Groups & Navigation Folders ---
  "100": {
    label: "Operational",
    command: "",
    menuType: "GROUP",
    menuAction: "SCREEN",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-01 08:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-01 08:05:00",
      recBranchCode: "JB9999",
    },
  },
  "101": {
    label: "Customer Manage",
    command: "",
    menuType: "GROUP",
    menuAction: "SCREEN",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-01 08:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-01 08:05:00",
      recBranchCode: "JB9999",
    },
  },
  "102": {
    label: "Account Manage",
    command: "",
    menuType: "GROUP",
    menuAction: "SCREEN",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-01 08:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-01 08:05:00",
      recBranchCode: "JB9999",
    },
  },
  "103": {
    label: "User Management",
    command: "",
    menuType: "GROUP",
    menuAction: "SCREEN",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-01 08:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-01 08:05:00",
      recBranchCode: "JB9999",
    },
  },
  "104": {
    label: "Daily Inquiry",
    command: "",
    menuType: "GROUP",
    menuAction: "SCREEN",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-01 08:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-01 08:05:00",
      recBranchCode: "JB9999",
    },
  },
  "105": {
    label: "Development Utility",
    command: "",
    menuType: "GROUP",
    menuAction: "SCREEN",
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-01 08:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-01 08:05:00",
      recBranchCode: "JB9999",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const SC_MENU_INAU: Record<string, MenuRecord> = {};
export const SC_MENU_HIS: Record<string, MenuRecord[]> = {};
export const SC_MENU_DEL: Record<string, MenuRecord> = {};

export const SC_MENU_TABLE: CbsVersionedTable<MenuRecord> = {
  LIVE: SC_MENU_LIVE,
  INAU: SC_MENU_INAU,
  HIS: SC_MENU_HIS,
  DEL: SC_MENU_DEL,
};

export const SC_MENU_LIST: MenuRecord[] = Object.values(SC_MENU_LIVE);
