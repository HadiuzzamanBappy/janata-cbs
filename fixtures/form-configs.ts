import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

/**
 * Concise, clean, canonical Form Configuration (UI Presentation Model).
 * Demonstrates how ANY form can be built using all CBS container types & widgets:
 *
 * 1. CONTAINER TYPES:
 *    - Standard Card (type: "standard", layoutStyle: "card")
 *    - Plain Block without Card (type: "standard", layoutStyle: "plain")
 *    - Object Group (type: "object-group", bindKey: "presentAddress")
 *    - Tabbed Page (zone: "tab", tabTitle)
 *
 * 2. ALL INPUT WIDGET TYPES:
 *    - select, radio-group, text, number, date, switch, textarea
 */
export const STATIC_FORM_CONFIGS: Record<string, FormConfigRecord> = {
  "FC.ACCOUNT.RETAIL": {
    recordId: "FC.ACCOUNT.RETAIL",
    title: "Retail Account Opening Form",
    targetModel: "ACCOUNT",
    version: "1.0.0",
    description: "Compact demonstration showing all UI container blocks and field widgets",
    isActive: true,
    presentation: {
      archetype: "scanline",
      density: "compact",
      steps: [],
      sections: [
        /* -------------------------------------------------------------------------- */
        /* 1. PLAIN BLOCK (Without Card - Flat & Borderless)                          */
        /* -------------------------------------------------------------------------- */
        {
          id: "sec_core_info",
          title: "Account Identification",
          description: "Top-level attributes placed directly on screen without a card wrapper",
          type: "standard",
          zone: "standard",
          layoutStyle: "plain",
          columns: 2,
          collapsible: false,
          isCollapsed: false,
          fields: [
            {
              id: "f_account_type",
              fieldKey: "accountType",
              label: "Account Type",
              widget: "select",
              colSpan: 4,
              required: true,
              options: ["SAVINGS", "CURRENT", "FIXED_DEPOSIT"],
            },
            {
              id: "f_currency",
              fieldKey: "currency",
              label: "Currency",
              widget: "radio-group",
              colSpan: 4,
              required: true,
              options: ["BDT", "USD", "EUR"],
            },
          ],
        },

        /* -------------------------------------------------------------------------- */
        /* 2. STANDARD CARD CONTAINER (Bordered Card Box)                             */
        /* -------------------------------------------------------------------------- */
        {
          id: "sec_card_terms",
          title: "Operating Parameters",
          description: "Card container grouping numeric values, date picker, and switch",
          type: "standard",
          zone: "standard",
          layoutStyle: "card",
          columns: 3,
          collapsible: false,
          isCollapsed: false,
          fields: [
            {
              id: "f_opening_date",
              fieldKey: "openingDate",
              label: "Opening Date",
              widget: "date",
              colSpan: 4,
              required: true,
            },
            {
              id: "f_interest_rate",
              fieldKey: "interestRate",
              label: "Interest Rate (%)",
              widget: "number",
              colSpan: 3,
              placeholder: "6.50",
            },
            {
              id: "f_cheque_facility",
              fieldKey: "enableChequeBook",
              label: "Cheque Book",
              widget: "switch",
              colSpan: 3,
              helperText: "Enable automatic issuance",
            },
          ],
        },

        /* -------------------------------------------------------------------------- */
        /* 3. OBJECT GROUP (Nested Object Binding)                                    */
        /* -------------------------------------------------------------------------- */
        {
          id: "sec_group_address",
          title: "Present Address",
          description: "Nested object group bound to presentAddress coordinates",
          type: "object-group",
          zone: "standard",
          layoutStyle: "card",
          bindKey: "presentAddress",
          columns: 2,
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
              colSpan: 4,
              required: true,
              placeholder: "e.g. Dhaka",
            },
            {
              id: "f_postal_code",
              fieldKey: "postalCode",
              label: "Postal Code",
              widget: "text",
              colSpan: 3,
              placeholder: "e.g. 1212",
            },
          ],
        },

        /* -------------------------------------------------------------------------- */
        /* 4. TABBED PAGE (In-Body Tab Navigation)                                    */
        /* -------------------------------------------------------------------------- */
        {
          id: "sec_tab_instructions",
          title: "Special Instructions",
          description: "Multi-line operational instructions and compliance declaration",
          type: "standard",
          zone: "tab",
          tabTitle: "Operational Remarks",
          layoutStyle: "card",
          columns: 2,
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
              colSpan: 4,
              helperText: "TIN validated",
            },
            {
              id: "f_special_instructions",
              fieldKey: "specialInstructions",
              label: "Instructions",
              widget: "textarea",
              colSpan: 12,
              placeholder: "Enter signing limits, operational mandate, or branch remarks...",
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

/**
 * Universal lookup helper for Form Configuration records.
 */
export function findFormConfigFixture(recordId: string): FormConfigRecord | null {
  const cleanId = recordId.trim().toUpperCase();
  return STATIC_FORM_CONFIGS[cleanId] ?? null;
}
