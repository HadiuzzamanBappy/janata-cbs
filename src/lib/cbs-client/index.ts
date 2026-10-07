export * from "./payloads";
export * from "./transport/proxy-client";
export * from "./types";

import { formPayloads } from "./payloads/form";
import { inquiryPayloads } from "./payloads/inquiry";
import { menuPayloads } from "./payloads/menu";
import { modelConfigPayloads } from "./payloads/model-config";
import { userGroupPayloads } from "./payloads/user-group";
import { userSecurityPayloads } from "./payloads/user-security";
import { sendCbsRequest } from "./transport/proxy-client";

/**
 * Universal CBS Micro-Client facade.
 * Provides unified access to payload factories and transport layer.
 */
export const cbs = {
  send: sendCbsRequest,
  menu: menuPayloads,
  userGroup: userGroupPayloads,
  userSecurity: userSecurityPayloads,
  modelConfig: modelConfigPayloads,
  inquiry: inquiryPayloads,
  form: formPayloads,
};

export default cbs;
