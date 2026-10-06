export * from "./contracts";
export * from "./payloads";
export * from "./transport/proxy-client";

import { cobPayloads } from "./payloads/cob-payloads";
import { formPayloads } from "./payloads/form-payloads";
import { inquiryPayloads } from "./payloads/inquiry-payloads";
import { menuPayloads } from "./payloads/menu-payloads";
import { modelConfigPayloads } from "./payloads/model-config-payloads";
import { userGroupPayloads } from "./payloads/user-group-payloads";
import { userSecurityPayloads } from "./payloads/user-security-payloads";
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
  cob: cobPayloads,
  modelConfig: modelConfigPayloads,
  inquiry: inquiryPayloads,
  form: formPayloads,
};

export default cbs;
