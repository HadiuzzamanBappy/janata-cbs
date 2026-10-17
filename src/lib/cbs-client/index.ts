export * from "./payloads";
export * from "./transport/proxy-client";

import { CbsControlTable } from "@/types";
import { createModelPayloads } from "./payloads/base-model";
import { formPayloads } from "./payloads/form";
import { inquiryPayloads } from "./payloads/inquiry";
import { menuPayloads } from "./payloads/menu";
import { userSecurityPayloads } from "./payloads/user-security";
import { sendCbsRequest } from "./transport/proxy-client";

/* -------------------------------------------------------------------------- */
/* Canonical CBS Client Facade Singleton                                      */
/* -------------------------------------------------------------------------- */

/**
 * Universal CBS Micro-Client facade.
 * Provides unified access to payload factories and transport layer.
 */
export const cbs = {
  send: sendCbsRequest,
  model: createModelPayloads,
  formConfig: createModelPayloads(CbsControlTable.FORM_CONFIG),
  inquiryConfig: createModelPayloads(CbsControlTable.INQUIRY_CONFIG),
  modelConfig: createModelPayloads(CbsControlTable.MODEL_CONFIG),
  userGroup: createModelPayloads(CbsControlTable.USER_GROUP),
  menu: menuPayloads,
  userSecurity: userSecurityPayloads,
  inquiry: inquiryPayloads,
  form: formPayloads,
} as const;

export default cbs;
