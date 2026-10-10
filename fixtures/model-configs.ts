import { parseModelConfig } from "@/lib/data-parsers";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

/**
 * Clean, modern canonical camelCase JSON definitions for Model Configuration.
 * Formatted directly as built by the UI designer (1:1 storage format).
 */
export const RAW_MODEL_CONFIGS: Record<string, ModelConfigRecord> = {
  MENU_TREE: {
    recordId: "MENU_TREE",
    tableName: "MENU_TREE",
    description: "Menu Tree",
    prefix: "SC",
    category: "SYSTEM",
    servicePath: "default",
    userDefineId: true,
    predefineId: false,
    access: "G",
    readOnly: false,
    searchable: false,
    authorize: false,
    associates: ["HIS", "DEL", "UNA"],
    devBy: "System",
    devDate: "2025-09-04",
    idDef: {
      idPrefix: "SC",
      idPattern: "",
      sequenceReset: false,
    },
    isActive: true,
    properties: [
      {
        sn: "1",
        name: "treeDescription",
        label: "Description",
        type: "Text",
        length: 300,
        structure: "S",
        required: true,
        disabled: false,
        status: "ACTIVE",
        enrichText: "Tree node title and description",
      },
      {
        sn: "2",
        name: "isActive",
        label: "Is Active",
        type: "Boolean",
        length: 1,
        structure: "S",
        required: false,
        disabled: false,
        status: "ACTIVE",
        enrichText: "Operational lifecycle status",
        defaultValue: false,
      },
      {
        sn: "3",
        name: "menuTree",
        label: "Menu Tree",
        type: "Text",
        length: 50,
        structure: "M",
        required: true,
        disabled: false,
        status: "ACTIVE",
        enrichText: "Sub-items list hierarchy keys",
      },
    ],
    auditData: {
      recStatus: "AU",
      recCurrNumber: 5,
      recInputter: "SYSUSER",
      recInputTime: "2026-08-12 10:36:40",
      recAuthorizer: "SYSUSER",
      recAuthTime: "2026-08-12 10:36:51",
      recBranchCode: "JB9999",
    },
  },

  MENU: {
    recordId: "MENU",
    tableName: "MENU",
    description: "Menu List",
    prefix: "SC",
    category: "SYSTEM",
    servicePath: "default",
    userDefineId: false,
    predefineId: false,
    access: "G",
    readOnly: false,
    searchable: true,
    authorize: false,
    associates: ["HIS"],
    devBy: "System",
    devDate: "2025-09-04",
    idDef: {
      idPrefix: "",
      idPattern: "IS",
      sequenceReset: false,
    },
    isActive: true,
    properties: [
      {
        sn: "1",
        name: "label",
        label: "Menu Label",
        type: "Text",
        length: 250,
        structure: "S",
        required: true,
        disabled: false,
        status: "ACTIVE",
        enrichText: "Display title for the navigation item",
      },
      {
        sn: "2",
        name: "command",
        label: "Target Command",
        type: "Text",
        length: 250,
        structure: "S",
        required: true,
        disabled: false,
        status: "ACTIVE",
        pattern: "^[A-Z0-9_. ,]+$",
        enrichText: "CBS transaction command code (e.g. MODEL.CONFIG, ACCOUNT I)",
      },
      {
        sn: "3",
        name: "menuType",
        label: "Menu Type",
        type: "Text",
        length: 50,
        structure: "S",
        required: false,
        disabled: false,
        status: "ACTIVE",
        enrichText:
          "Classification of screen or menu node (SCREEN, INQUIRY, REPORT, SUBMENU, EXTERNAL)",
        defaultValue: "SCREEN",
      },
      {
        sn: "4",
        name: "description",
        label: "Description",
        type: "Text",
        length: 500,
        structure: "S",
        required: false,
        disabled: false,
        status: "ACTIVE",
        enrichText: "Operational summary and navigation tooltip documentation",
      },
      {
        sn: "5",
        name: "isActive",
        label: "Active Status",
        type: "Boolean",
        length: 1,
        structure: "S",
        required: false,
        disabled: false,
        status: "ACTIVE",
        defaultValue: true,
        enrichText: "Operational lifecycle visibility status",
      },
    ],
    auditData: {
      recStatus: "AU",
      recCurrNumber: 7,
      recInputter: "SYSUSER",
      recInputTime: "2026-08-16 11:40:38",
      recAuthorizer: "SYSUSER",
      recAuthTime: "2026-08-16 11:40:44",
      recBranchCode: "JB9999",
    },
  },
};

/**
 * STATIC_MODEL_CONFIGS: Keyed dictionary by table key matching STATIC_INQUIRY_DATA pattern.
 * Uses parseModelConfig to guarantee validation passes cleanly.
 */
export const STATIC_MODEL_CONFIGS: Record<string, ModelConfigRecord> = Object.fromEntries(
  Object.entries(RAW_MODEL_CONFIGS).map(([key, raw]) => {
    const res = parseModelConfig(raw);
    if (!res.success) {
      throw new Error(`Failed to parse model config for ${key}: ${res.error}`);
    }
    return [key, res.data];
  }),
);

export const STATIC_MODEL_CONFIG_LIST: ModelConfigRecord[] = Object.values(STATIC_MODEL_CONFIGS);
