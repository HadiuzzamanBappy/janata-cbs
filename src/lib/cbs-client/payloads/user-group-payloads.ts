import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsControlTable } from "../types/control-tables";
import { CbsRequestType } from "../types/request-types";

/**
 * Domain payload builders for User Security & RBAC Groups
 */
export const userGroupPayloads = {
  /** Fetch user group record */
  getGroup: (groupId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.SEE,
    recordId: groupId.trim().toUpperCase(),
  }),

  /** Save / update user group permission matrix */
  saveGroup: (groupId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: groupId.trim().toUpperCase(),
    data,
  }),

  /** Authorize user group (Maker-Checker cycle) */
  authorizeGroup: (groupId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: groupId.trim().toUpperCase(),
  }),

  /** Delete / Decommission user group */
  deleteGroup: (groupId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: groupId.trim().toUpperCase(),
  }),
};
