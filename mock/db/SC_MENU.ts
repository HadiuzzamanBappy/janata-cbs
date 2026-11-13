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
  // ============================================================================
  // Actionable Command Leaf Items (IDs 1 - 20)
  // ============================================================================
  "1": {
    label: "User Request",
    command: "INQ GET.EMP.INFO",
    menuType: "INQUIRY",
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
  "2": {
    label: "Unauthorize User List",
    command: "INQ USER.MGT.NAU.LIST",
    menuType: "INQUIRY",
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
  "3": {
    label: "Create User",
    command: "INQ GET.USER.MGT.AUTH",
    menuType: "INQUIRY",
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
  "4": {
    label: "Authorise/Delete User Unauth List",
    command: "INQ GET.USER.UNAU.LIST",
    menuType: "INQUIRY",
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
  "5": {
    label: "Password Reset",
    command: "PASSWORD.RESET,NEW N",
    menuType: "FORM",
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
  "6": {
    label: "Authorise/Delete Password Reset Unauth List",
    command: "INQ S GET.USR.PASS.RST.UN.LIST",
    menuType: "INQUIRY",
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
  "7": {
    label: "User Inactive Request",
    command: "INQ INQ.USER.MGT.AUTH.LIST",
    menuType: "INQUIRY",
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
  "8": {
    label: "List of User",
    command: "INQ GET.USER.LIST",
    menuType: "INQUIRY",
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
  "9": {
    label: "Open / Edit General Customer ",
    command: "CUSTOMER,GENERAL",
    menuType: "FORM",
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
  "10": {
    label: "Open / Edit Corporate Customer",
    command: "CUSTOMER,CORPORATE",
    menuType: "FORM",
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
  "11": {
    label: "Create / Edit Govt.  Customer",
    command: "CUSTOMER,GOVERNMENT",
    menuType: "FORM",
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
  "12": {
    label: "Open / Edit Staff Customer",
    command: "CUSTOMER,STAFF",
    menuType: "FORM",
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
  "13": {
    label: "Create Accouont",
    command: "ACCOUNT",
    menuType: "FORM",
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
  "14": {
    label: "Funds Transfer",
    command: "FUNDS.TRANSFER",
    menuType: "FORM",
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
  "15": {
    label: "Today Txn Report",
    command: "INQ GET.TO.TXN",
    menuType: "INQUIRY",
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
  "16": {
    label: "Today Txn Entry",
    command: "INQ GET.TODAY.ENTRY",
    menuType: "INQUIRY",
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
  "17": {
    label: "Model Config",
    command: "SC.MODEL.CONFIG",
    menuType: "FORM",
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
  "18": {
    label: "Form Config",
    command: "SC.FORM.CONFIG",
    menuType: "FORM",
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
  "19": {
    label: "Inquiry Config",
    command: "SC.INQUIRY.CONFIG",
    menuType: "FORM",
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
  "20": {
    label: "Menu Designer",
    command: "SC.MENU.DESIGN",
    menuType: "FORM",
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

  // ============================================================================
  // Navigation Groups & Submenu Folders (IDs 100 - 111)
  // ============================================================================
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
  "102": {
    label: "User Request",
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
    label: "User Creation",
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
    label: "User Password Reset",
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
    label: "User Amendment Request",
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
  "106": {
    label: "Report",
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
  "107": {
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
  "108": {
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
  "109": {
    label: "Funds Manage",
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
  "110": {
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
  "111": {
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
