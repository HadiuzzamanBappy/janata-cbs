import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

export const STATIC_FORM_CONFIGS: Record<string, FormConfigRecord> = {
  ACCOUNT: {
    recordId: "ACCOUNT",
    title: "Retail Account Opening Form",
    targetModel: "ACCOUNT",
    version: "1.0.0",
    description:
      "Modular canvas demonstration with root variables, card containers, object groups, and tab groups",
    isActive: true,
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
};

export const STATIC_FORM_CONFIG_LIST: FormConfigRecord[] = Object.values(STATIC_FORM_CONFIGS);

export function findFormConfigFixture(recordId: string): FormConfigRecord | null {
  const cleanId = recordId.trim().toUpperCase();
  return (
    STATIC_FORM_CONFIGS[cleanId] ??
    STATIC_FORM_CONFIGS[cleanId.replace(/^(FC|SC)\./, "")] ??
    STATIC_FORM_CONFIGS[`FC.${cleanId}`] ??
    Object.values(STATIC_FORM_CONFIGS).find(
      (cfg) =>
        cfg.recordId?.toUpperCase() === cleanId ||
        cfg.targetModel?.toUpperCase() === cleanId ||
        cfg.recordId?.toUpperCase() === cleanId.replace(/^(FC|SC)\./, "") ||
        cfg.targetModel?.toUpperCase() === cleanId.replace(/^(FC|SC)\./, ""),
    ) ??
    null
  );
}

export function listFormConfigSummaries() {
  return STATIC_FORM_CONFIG_LIST.map((record) => ({
    id: record.recordId,
    label: `${record.title} (${record.targetModel})`,
    details: `${record.presentation.sections.length} sections • ${record.targetModel}`,
    record,
  }));
}
