import { CbsControlTable } from "@/types";
import { createModelPayloads } from "./payloads/base-model";
import { formConfigPayloads } from "./payloads/form-config";
import { inquiryPayloads } from "./payloads/inquiry";
import { menuTreePayloads } from "./payloads/menu-tree";
import { modelConfigPayloads } from "./payloads/model-config";
import { userSecurityPayloads } from "./payloads/user-security";
import { lookupQueries } from "./queries/lookups";
import { SCHEMA_ROOT_KEYS, schemaQueries } from "./queries/schemas";
import { cbsAuth } from "./transport/auth-client";
import { type SendCbsOptions, sendCbsRequest } from "./transport/proxy-client";

export type { BranchDirectoryItem, ModelLookupPayload } from "./queries/lookups";
export type { ResolvedFormSchemaData } from "./queries/schemas";
export type { SendCbsOptions };
export { cbsAuth };

/**
 * Unified TanStack v5 queryOptions facade:
 * - `schemas`: Blueprints, forms, inquiries, metamodels & nav hierarchy
 * - `lookups`: Reference directories, system catalogs & form dropdown options
 */
export const cbsQueries = {
  model: (controlName: CbsControlTable | string) => ({
    lookup: () => lookupQueries.modelLookup(controlName),
  }),

  // Reference directories
  branch: {
    list: lookupQueries.branchList,
  },

  // Navigation & Menu
  menu: {
    list: lookupQueries.menuList,
  },
  menuTree: {
    active: schemaQueries.menuTreeActive,
  },

  // Meta-configuration designers & operational blueprints
  modelConfig: {
    record: schemaQueries.modelConfigRecord,
  },
  formConfig: {
    schemaRootKey: SCHEMA_ROOT_KEYS.formConfig,
    schema: schemaQueries.formConfigSchema,
  },
  inquiryConfig: {
    schemaRootKey: SCHEMA_ROOT_KEYS.inquiryConfig,
    schema: schemaQueries.inquiryConfigSchema,
  },
} as const;

/**
 * Universal CBS client facade for wire transport and payload factories.
 */
export const cbs = {
  send: sendCbsRequest,
  model: createModelPayloads,

  // Fixed system directories
  branch: createModelPayloads(CbsControlTable.BRANCH),
  control: createModelPayloads(CbsControlTable.CONTROL),
  menu: createModelPayloads(CbsControlTable.MENU),
  menuTree: menuTreePayloads,

  // Meta-configuration designers
  modelConfig: modelConfigPayloads,
  formConfig: formConfigPayloads,
  inquiryConfig: createModelPayloads(CbsControlTable.INQUIRY_CONFIG),

  // Query & security engines
  inquiry: inquiryPayloads,
  userSecurity: userSecurityPayloads,
} as const;

export default cbs;
