import type { MenuCatalogRecord } from "@/lib/data-schemas/menu-catalog-schema";

/**
 * SC_MENU Table Master (PREFIX: SC, TABLE: MENU)
 * Stores individual registered menu catalog action items and commands.
 */
export const SC_MENU_LIVE: Record<string, MenuCatalogRecord> = {
  "1": {
    recordId: "1",
    label: "Account Opening",
    command: "ACCOUNT I",
    menuType: "SCREEN",
    description: "Customer savings and current account opening",
    isActive: true,
    auditData: {
      recStatus: "LIVE",
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
    label: "Account Overview",
    command: "ACCOUNT S",
    menuType: "SCREEN",
    description: "Account summary and ledger inquiry",
    isActive: true,
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-10 09:35:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-10 09:36:00",
      recBranchCode: "JB9999",
    },
  },
  "3": {
    recordId: "3",
    label: "Customer Onboarding",
    command: "CUSTOMER I",
    menuType: "SCREEN",
    description: "New individual & corporate customer master record",
    isActive: true,
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 2,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-12 11:20:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-12 11:25:00",
      recBranchCode: "JB9999",
    },
  },
  "4": {
    recordId: "4",
    label: "Customer Inquiry",
    command: "CUSTOMER S",
    menuType: "SCREEN",
    description: "Customer 360 view and demographic details",
    isActive: true,
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-01-15 14:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-01-15 14:05:00",
      recBranchCode: "JB9999",
    },
  },
  "5": {
    recordId: "5",
    label: "Balance Inquiry",
    command: "INQ ACCT.BAL",
    menuType: "INQUIRY",
    description: "Realtime core ledger balance inquiry",
    isActive: true,
    auditData: {
      recStatus: "LIVE",
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
    label: "Model Configuration",
    command: "SC.MODEL.CONFIG",
    menuType: "SCREEN",
    description: "CBS Data Dictionary and Schema Designer",
    isActive: true,
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 4,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-01 16:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-01 16:10:00",
      recBranchCode: "JB9999",
    },
  },
  "7": {
    recordId: "7",
    label: "Menu Item Catalog",
    command: "MENU",
    menuType: "SCREEN",
    description: "System Action Catalog Administration",
    isActive: true,
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 1,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-05 10:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-05 10:05:00",
      recBranchCode: "JB9999",
    },
  },
  "8": {
    recordId: "8",
    label: "Menu Hierarchy Designer",
    command: "MENU.DESIGN",
    menuType: "SCREEN",
    description: "Interactive Navigation Tree Builder",
    isActive: true,
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 2,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-10 11:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-10 11:05:00",
      recBranchCode: "JB9999",
    },
  },
  "9": {
    recordId: "9",
    label: "User Group & Permissions",
    command: "USER.GROUP",
    menuType: "SCREEN",
    description: "Role-based access control and security groups",
    isActive: true,
    auditData: {
      recStatus: "LIVE",
      recCurrNumber: 3,
      recInputter: "SYSADMIN",
      recInputTime: "2026-02-15 13:00:00",
      recAuthorizer: "SUPV01",
      recAuthTime: "2026-02-15 13:10:00",
      recBranchCode: "JB9999",
    },
  },
};

export const SC_MENU_TABLE = SC_MENU_LIVE;
export const SC_MENU_LIST: MenuCatalogRecord[] = Object.values(SC_MENU_LIVE);

export function getMenuCatalogRecord(id: string): MenuCatalogRecord | null {
  const cleanId = id.trim();
  return SC_MENU_LIVE[cleanId] ?? null;
}

export function listMenuCatalogSummaries() {
  return SC_MENU_LIST.map((m) => ({
    id: m.recordId,
    label: m.label,
    details: `${m.command} • ${m.menuType}`,
    record: m,
  }));
}
