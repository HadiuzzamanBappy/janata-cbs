import { CbsControlTable } from "../contracts/control-tables";
import type { CbsWirePayload } from "../contracts/envelope-schema";
import { CbsRecordFunction } from "../contracts/record-functions";
import { CbsRequestType } from "../contracts/request-types";

/**
 * Domain payload builders for User Security & RBAC Groups
 */
export const userGroupPayloads = {
  /** Fetch user group record */
  getGroup: (groupId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.SEE,
    recordId: groupId,
  }),

  /** Save / update user group permission matrix */
  saveGroup: (groupId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: groupId,
    data,
  }),

  /** Authorize user group (Maker-Checker cycle) */
  authorizeGroup: (groupId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: groupId,
  }),
};
