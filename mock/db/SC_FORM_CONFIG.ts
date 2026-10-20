import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";
import type { CbsVersionedTable } from "./types";

/**
 * SC_FORM_CONFIG Database Table (PREFIX: SC, TABLE: FORM_CONFIG)
 * Simple key-value dictionary keyed by <MODEL>,<VERSION>.
 * All parsing, key decomposition, and hydration happen in @mock/core.
 */
export const SC_FORM_CONFIG_LIVE: Record<string, FormConfigRecord> = {
  "ACCOUNT,1.0.0": {
    title: "Retail Account Opening Form",
    description:
      "Modular canvas demonstration with root variables, card containers, object groups, and tab groups",
    presentation: {
      steps: [],
      sections: [
        {
          id: "sec_core_info",
          title: "Account Identification",
          description: "Top-level attributes placed directly on screen without a card wrapper",
          type: "standard",
          zone: "standard",
          layoutStyle: "plain",
          columns: 1,
          collapsible: false,
          isCollapsed: false,
          fields: [
            {
              id: "f_account_type",
              fieldKey: "accountType",
              label: "Account Type",
              widget: "select",
              colSpan: 8,
              required: true,
              options: ["SAVINGS", "CURRENT", "FIXED_DEPOSIT"],
            },
            {
              id: "f_currency",
              fieldKey: "currency",
              label: "Currency",
              widget: "radio-group",
              colSpan: 6,
              required: true,
              options: ["BDT", "USD", "EUR"],
            },
          ],
        },
        {
          id: "sec_card_terms",
          title: "Operating Parameters",
          description: "Card container grouping numeric values, date picker, and switch",
          type: "standard",
          zone: "standard",
          layoutStyle: "card",
          columns: 1,
          collapsible: false,
          isCollapsed: false,
          fields: [
            {
              id: "f_opening_date",
              fieldKey: "openingDate",
              label: "Opening Date",
              widget: "date",
              colSpan: 6,
              required: true,
            },
            {
              id: "f_interest_rate",
              fieldKey: "interestRate",
              label: "Interest Rate (%)",
              widget: "number",
              colSpan: 4,
              placeholder: "7.50",
            },
            {
              id: "f_cheque_facility",
              fieldKey: "enableChequeBook",
              label: "Cheque Book",
              widget: "switch",
              colSpan: 4,
              helperText: "Enable automatic issuance",
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
          columns: 1,
          collapsible: true,
          isCollapsed: false,
          fields: [
            {
              id: "f_street",
              fieldKey: "street",
              label: "Street Address",
              widget: "text",
              colSpan: 6,
              required: true,
              placeholder: "e.g. Road 12, House 45",
            },
            {
              id: "f_city",
              fieldKey: "city",
              label: "City / District",
              widget: "text",
              colSpan: 6,
              required: true,
              placeholder: "e.g. Dhaka",
            },
            {
              id: "f_postal_code",
              fieldKey: "postalCode",
              label: "Postal Code",
              widget: "text",
              colSpan: 6,
              placeholder: "e.g. 1212",
            },
          ],
        },
        {
          id: "sec_tab_remarks",
          title: "Operational Remarks",
          description: "Operational instructions and compliance declarations",
          type: "standard",
          zone: "tab",
          tabGroupId: "tabgrp_remarks",
          tabTitle: "Operational Remarks",
          layoutStyle: "card",
          columns: 1,
          collapsible: false,
          isCollapsed: false,
          fields: [
            {
              id: "f_pep_status",
              fieldKey: "pepStatus",
              label: "PEP Status",
              widget: "radio-group",
              colSpan: 4,
              required: true,
              options: ["NO", "YES"],
            },
            {
              id: "f_tax_exempt",
              fieldKey: "taxExempt",
              label: "Tax Exemption",
              widget: "switch",
              colSpan: 6,
              helperText: "TIN validated",
            },
            {
              id: "f_special_instructions",
              fieldKey: "specialInstructions",
              label: "Instructions",
              widget: "textarea",
              colSpan: 8,
              placeholder: "Enter signing limits, operational mandate, or branch remarks...",
            },
          ],
        },
        {
          id: "sec_tab_compliance",
          title: "Compliance & Branch",
          description: "Branch mandate and initial deposit limits",
          type: "standard",
          zone: "tab",
          tabGroupId: "tabgrp_remarks",
          tabTitle: "Compliance & Branch",
          layoutStyle: "card",
          columns: 1,
          collapsible: false,
          isCollapsed: false,
          fields: [
            {
              id: "f_branch_code",
              fieldKey: "branchCode",
              label: "Branch Code",
              widget: "text",
              colSpan: 8,
              required: true,
              placeholder: "0001",
            },
            {
              id: "f_initial_deposit",
              fieldKey: "initialDeposit",
              label: "Initial Deposit",
              widget: "amount",
              currencyPrefix: "BDT",
              colSpan: 4,
              placeholder: "25000",
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
    presentation: {
      steps: [],
      sections: [
        {
          id: "sec_user_identity",
          title: "User Identity",
          type: "standard",
          zone: "standard",
          layoutStyle: "card",
          columns: 2,
          collapsible: false,
          isCollapsed: false,
          fields: [
            {
              id: "f_userId",
              fieldKey: "userId",
              label: "User Signon ID",
              widget: "text",
              colSpan: 6,
              required: true,
            },
            {
              id: "f_fullName",
              fieldKey: "fullName",
              label: "Full Name",
              widget: "text",
              colSpan: 6,
              required: true,
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
  LIVE: SC_FORM_CONFIG_LIVE,
  INAU: SC_FORM_CONFIG_INAU,
  HIS: SC_FORM_CONFIG_HIS,
  DEL: SC_FORM_CONFIG_DEL,
};

export const SC_FORM_CONFIG_LIST: FormConfigRecord[] = Object.values(SC_FORM_CONFIG_LIVE);
