/**
 * @fileoverview Property Inspector Field Specifications for MODEL.CONFIG
 * @module features/system/model-config/fields/mc-property-fields
 *
 * Core Invariants:
 * - Direct 1:1 binding with modelPropertySchema (SN, NAME, TYPE, STRUCTURE, LENGTH, REQUIRED).
 * - Property types derived dynamically from canonical PROPERTY_TYPES.
 * - Zero backward-compatibility shims (no legacy DATA or itemCode/itemLabel).
 */

import {
  DEFAULT_PROPERTY_LENGTH,
  FIXED_PROPERTY_LENGTHS,
  type FormSection,
  PROPERTY_TYPES,
  SUB_PROPERTY_TYPES,
} from "@/lib/data-schemas";

const FIXED_LENGTH_TYPES = Object.keys(FIXED_PROPERTY_LENGTHS);

/**
 * Builds standard Form Sections definition for the selected Model Property inspector.
 * Sub-properties exclude `Array` because nested arrays inside arrays are not supported.
 */
export function getPropertyInspectorSections(isSubProperty: boolean = false): FormSection[] {
  const allowedTypes = isSubProperty ? SUB_PROPERTY_TYPES : PROPERTY_TYPES;

  return [
    {
      id: "sec_prop_definition",
      title: "Column Definition",
      containerType: "card",
      columns: 1,
      fields: [
        {
          SN: "1",
          NAME: "NAME",
          LABEL: "Field Name",
          TYPE: "String",
          STRUCTURE: "S",
          LENGTH: 35,
          REQUIRED: true,
          WIDTH: "md",
          TRANSFORM: "stripWhitespace",
          ENRICHTEXT:
            "Database column identifier in strict camelCase (e.g. accountNumber, openingDate).",
        },
        {
          SN: "2",
          NAME: "TYPE",
          LABEL: "Data Type",
          TYPE: "String",
          STRUCTURE: "S",
          LENGTH: 20,
          WIDGET: "segmented",
          DEFAULTVALUE: "String",
          PARAMETER: {
            type: "O",
            data: allowedTypes.map((t) => ({ code: t, label: t })),
          },
          CASCADE: [
            {
              when: "Date",
              set: { LENGTH: FIXED_PROPERTY_LENGTHS.Date, PROP: undefined, MODELNAME: "" },
            },
            {
              when: "DateTime",
              set: { LENGTH: FIXED_PROPERTY_LENGTHS.DateTime, PROP: undefined, MODELNAME: "" },
            },
            {
              when: "Time",
              set: { LENGTH: FIXED_PROPERTY_LENGTHS.Time, PROP: undefined, MODELNAME: "" },
            },
            { when: "Number", set: { LENGTH: 15, PROP: undefined, MODELNAME: "" } },
            { when: "String", set: { LENGTH: DEFAULT_PROPERTY_LENGTH, PROP: undefined } },
            {
              when: "Boolean",
              set: {
                LENGTH: FIXED_PROPERTY_LENGTHS.Boolean,
                STRUCTURE: "S",
                PROP: undefined,
                MODELNAME: "",
              },
            },
            {
              when: "Array",
              set: { LENGTH: FIXED_PROPERTY_LENGTHS.Array, PROP: [], MODELNAME: "" },
            },
          ],
          ENRICHTEXT: isSubProperty
            ? "Physical sub-column data type (nested Array is not supported)."
            : "Physical database column data type: String, Number, Boolean, Date, DateTime, Time, or Array.",
        },
        {
          SN: "3",
          NAME: "STRUCTURE",
          LABEL: "Structure",
          TYPE: "String",
          STRUCTURE: "S",
          LENGTH: 5,
          WIDGET: "segmented",
          DEFAULTVALUE: "S",
          PARAMETER: {
            type: "O",
            data: [
              { code: "S", label: "Single (S)" },
              { code: "M", label: "Multi-Value (M)" },
            ],
          },
          DISABLED_WHEN: {
            field: "TYPE",
            operator: "eq",
            value: "Boolean",
          },
          ENRICHTEXT:
            "Single (S) scalar value or Multi-Value (M) repeating primitive array (strictly Single for Boolean).",
        },
        {
          SN: "4",
          NAME: "LENGTH",
          LABEL: "Length",
          TYPE: "Number",
          STRUCTURE: "S",
          LENGTH: 4,
          WIDTH: "xs",
          DEFAULTVALUE: String(DEFAULT_PROPERTY_LENGTH),
          DISABLED_WHEN: {
            field: "TYPE",
            operator: "in",
            value: FIXED_LENGTH_TYPES,
          },
          ENRICHTEXT:
            "Maximum character storage limit or numerical precision (not applicable for Array, fixed for Boolean/Date/Time).",
        },
        {
          SN: "5",
          NAME: "REQUIRED",
          LABEL: "Required",
          TYPE: "Boolean",
          STRUCTURE: "S",
          LENGTH: 1,
          WIDGET: "checkbox",
          ENRICHTEXT: "Whether this column enforces non-null constraint at database commit.",
        },
        {
          SN: "6",
          NAME: "MODELNAME",
          LABEL: "Model Name",
          TYPE: "String",
          STRUCTURE: "S",
          LENGTH: 35,
          WIDTH: "md",
          WIDGET: "select",
          TRANSFORM: "uppercase",
          PARAMETER: {
            type: "M",
            modelName: "MODEL.CONFIG",
            data: [],
          },
          DISABLED_WHEN: {
            field: "TYPE",
            operator: "neq",
            value: "String",
          },
          ENRICHTEXT:
            "Target CBS model/table for lookup (e.g. CUSTOMER, BRANCH, CURRENCY). Select from registered models or type a table name.",
        },
      ],
    },
  ];
}
