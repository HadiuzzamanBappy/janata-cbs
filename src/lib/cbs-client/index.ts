import { CbsControlTable } from "@/types";
import { createModelPayloads } from "./payloads/base-model";
import { formConfigPayloads } from "./payloads/form-config";
import { inquiryPayloads } from "./payloads/inquiry";
import { menuTreePayloads } from "./payloads/menu-tree";
import { modelConfigPayloads } from "./payloads/model-config";
import { userSecurityPayloads } from "./payloads/user-security";
import { type SendCbsOptions, sendCbsRequest } from "./transport/proxy-client";

export type { SendCbsOptions };

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
