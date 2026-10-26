export * from "./payloads";
export * from "./transport/proxy-client";

import { CbsControlTable } from "@/types";
import { createModelPayloads } from "./payloads/base-model";
import { formPayloads } from "./payloads/form";
import { formConfigPayloads } from "./payloads/form-config";
import { inquiryPayloads } from "./payloads/inquiry";
import { menuPayloads } from "./payloads/menu";
import { modelConfigPayloads } from "./payloads/model-config";
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
  formConfig: formConfigPayloads,
  inquiryConfig: createModelPayloads(CbsControlTable.INQUIRY_CONFIG),
  modelConfig: modelConfigPayloads,
  userSecurity: userSecurityPayloads,
  inquiry: inquiryPayloads,
  form: formPayloads,
  menu: menuPayloads,
} as const;

export default cbs;
