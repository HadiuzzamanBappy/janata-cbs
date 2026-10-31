import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import type { CbsVersionedTable } from "./types";

/**
 * SC_FORM_CONFIG Database Table (PREFIX: SC, TABLE: FORM_CONFIG)
 * Keyed by <MODEL>,<VERSION>.
 * Revised to sparse CBS enterprise standards:
 * - Omits empty/dead PARAMETER fields (modelName/codeField on static options)
 * - Assigns canonical FormWidgetType (select, date, amount, switch, text)
 * - Employs semantic width tokens (sm, md, lg, xl, full)
 * - Pure sparse representation without noise
 */
export const SC_FORM_CONFIG: Record<string, FormConfigRecord> = {
  "ACCOUNT,1.0.0": {
    title: "Retail Account Opening Form",
    description:
      "Modular canvas layout with root account selectors, address object group, and operational tab containers",
    authNumber: 1.0,
    frmElements: {
      steps: [],
      sections: [
        {
          id: "sec_root_fields",
          title: "",
          description: "Root canvas fields without card box",
          type: "standard",
          zone: "standard",
          layoutStyle: "plain",
          columns: 1,
          fields: [
            {
              SN: "1",
              NAME: "accountType",
              LABEL: "Account Type",
              TYPE: "Text",
              WIDGET: "select",
              LENGTH: 20,
              STRUCTURE: "S",
              REQUIRED: true,
              WIDTH: "md",
              DEFAULTVALUE: "SAVINGS",
              ENRICHTEXT: "Select category of account (e.g. Savings, Current, Term Deposit)",
              PARAMETER: {
                type: "O",
                data: ["SAVINGS", "CURRENT", "FIXED_DEPOSIT"],
              },
            },
            {
              SN: "2",
              NAME: "customerId",
              LABEL: "Customer ID",
              TYPE: "Text",
              WIDGET: "text",
              LENGTH: 20,
              STRUCTURE: "S",
              REQUIRED: true,
              WIDTH: "md",
              ENRICHTEXT: "Unique 9-digit Core Banking Customer Information File (CIF)",
              TEXT_CONFIG: {
                textTransform: "uppercase",
                maskPattern: "",
                autoTrim: true,
              },
            },
            {
              SN: "3",
              NAME: "currency",
              LABEL: "Currency",
              TYPE: "Text",
              WIDGET: "select",
              LENGTH: 3,
              STRUCTURE: "S",
              REQUIRED: true,
              WIDTH: "sm",
              DEFAULTVALUE: "BDT",
              ENRICHTEXT: "ISO currency denominator for account ledger balances",
              PARAMETER: {
                type: "O",
                data: ["BDT", "USD", "EUR"],
              },
            },
          ],
        },
        {
          id: "sec_group_address",
          title: "Present Address",
          description: "Nested object group bound to presentAddress coordinates",
          type: "object-group",
          zone: "standard",
          layoutStyle: "card",
          bindKey: "presentAddress",
          structure: "S",
          columns: 1,
          fields: [
            {
              SN: "17_1",
              NAME: "street",
              LABEL: "Street Address",
              TYPE: "Text",
              WIDGET: "text",
              LENGTH: 100,
              STRUCTURE: "S",
              REQUIRED: true,
              WIDTH: "lg",
            },
            {
              SN: "17_2",
              NAME: "city",
              LABEL: "City / District",
              TYPE: "Text",
              WIDGET: "text",
              LENGTH: 50,
              STRUCTURE: "S",
              REQUIRED: true,
              WIDTH: "md",
              DEFAULTVALUE: "Dhaka",
            },
            {
              SN: "17_3",
              NAME: "postalCode",
              LABEL: "Postal Code",
              TYPE: "Text",
              WIDGET: "text",
              LENGTH: 10,
              STRUCTURE: "S",
              WIDTH: "sm",
              DEFAULTVALUE: "1212",
            },
          ],
        },
        {
          id: "sec_tab_details",
          title: "Account Details",
          description: "Operational instructions and parameters",
          type: "standard",
          zone: "tab",
          tabGroupId: "tabgrp_account",
          tabTitle: "Account Details",
          layoutStyle: "card",
          columns: 1,
          fields: [
            {
              SN: "4",
              NAME: "openingDate",
              LABEL: "Opening Date",
              TYPE: "Date",
              WIDGET: "date",
              LENGTH: 10,
              STRUCTURE: "S",
              REQUIRED: true,
              WIDTH: "sm",
              ENRICHTEXT: "Value date on which the account contract becomes operational",
            },
            {
              SN: "5",
              NAME: "initialDeposit",
              LABEL: "Initial Deposit",
              TYPE: "Number",
              WIDGET: "amount",
              LENGTH: 18,
              STRUCTURE: "S",
              REQUIRED: true,
              WIDTH: "md",
              DEFAULTVALUE: "25000",
              ENRICHTEXT: "Minimum mandatory initial deposit credited at account opening",
              NUMBER_CONFIG: {
                isCurrency: true,
                currencyCode: "BDT",
                decimals: 2,
                allowNegative: false,
              },
            },
          ],
        },
        {
          id: "sec_tab_services",
          title: "Services & Flags",
          description: "Ancillary banking channels and delivery services",
          type: "standard",
          zone: "tab",
          tabGroupId: "tabgrp_account",
          tabTitle: "Services & Flags",
          layoutStyle: "card",
          columns: 1,
          fields: [
            {
              SN: "13",
              NAME: "enableChequeBook",
              LABEL: "Cheque Book",
              TYPE: "Text",
              WIDGET: "switch",
              LENGTH: 1,
              STRUCTURE: "S",
              WIDTH: "sm",
              DEFAULTVALUE: "Y",
              BOOLEAN_CONFIG: {
                widgetStyle: "switch",
                trueValue: "Y",
                falseValue: "N",
                activeLabel: "Enabled",
                inactiveLabel: "Disabled",
              },
            },
            {
              SN: "14",
              NAME: "enableDebitCard",
              LABEL: "Debit Card",
              TYPE: "Text",
              WIDGET: "switch",
              LENGTH: 1,
              STRUCTURE: "S",
              WIDTH: "sm",
              DEFAULTVALUE: "Y",
              BOOLEAN_CONFIG: {
                widgetStyle: "switch",
                trueValue: "Y",
                falseValue: "N",
                activeLabel: "Enabled",
                inactiveLabel: "Disabled",
              },
            },
          ],
        },
      ],
    },
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "CBS.ADMIN",
      recInputTime: "2026-10-13 01:25",
      recAuthorizer: "CBS.MANAGER",
      recAuthTime: "2026-10-13 01:26",
      recBranchCode: "0001",
    },
  },
  "USER,1.0.0": {
    title: "User Management Registration Form",
    description: "Standard operator creation and credential provisioning form",
    authNumber: 1.0,
    frmElements: {
      steps: [],
      sections: [
        {
          id: "sec_user_identity",
          title: "User Identity",
          type: "standard",
          zone: "standard",
          layoutStyle: "card",
          columns: 2,
          fields: [
            {
              SN: "1",
              NAME: "userId",
              LABEL: "User Signon ID",
              TYPE: "Text",
              WIDGET: "text",
              LENGTH: 20,
              STRUCTURE: "S",
              REQUIRED: true,
              WIDTH: "md",
              TEXT_CONFIG: {
                textTransform: "uppercase",
                maskPattern: "",
                autoTrim: true,
              },
            },
            {
              SN: "2",
              NAME: "fullName",
              LABEL: "Full Name",
              TYPE: "Text",
              WIDGET: "text",
              LENGTH: 100,
              STRUCTURE: "S",
              REQUIRED: true,
              WIDTH: "lg",
            },
          ],
        },
      ],
    },
    auditData: {
      recStatus: "AU",
      recCurrNumber: 1,
      recInputter: "CBS.ADMIN",
      recInputTime: "2026-10-13 01:25",
      recAuthorizer: "CBS.MANAGER",
      recAuthTime: "2026-10-13 01:26",
      recBranchCode: "0001",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Versioned CBS Table Associates (INAU, HIS, DEL)                            */
/* -------------------------------------------------------------------------- */

export const SC_FORM_CONFIG_INAU: Record<string, FormConfigRecord> = {};
export const SC_FORM_CONFIG_HIS: Record<string, FormConfigRecord[]> = {};
export const SC_FORM_CONFIG_DEL: Record<string, FormConfigRecord> = {};

export const SC_FORM_CONFIG_TABLE: CbsVersionedTable<FormConfigRecord> = {
  LIVE: SC_FORM_CONFIG,
  INAU: SC_FORM_CONFIG_INAU,
  HIS: SC_FORM_CONFIG_HIS,
  DEL: SC_FORM_CONFIG_DEL,
};

export const SC_FORM_CONFIG_LIST: FormConfigRecord[] = Object.values(SC_FORM_CONFIG);
