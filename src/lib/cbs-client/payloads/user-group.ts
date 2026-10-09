import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsControlTable } from "../types/control-tables";
import { CbsRequestType } from "../types/request-types";

/**
 * Domain payload builders for User Security & RBAC Groups.
 */
export const userGroupPayloads = {
  /**
   * Fetch a user group record by ID (or empty string for group list).
   *
   * @param groupId - User group record ID
   */
  getGroup: (groupId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.SEE,
    recordId: groupId.trim().toUpperCase(),
  }),

  /**
   * Save or update user group permission matrix.
   *
   * @param groupId - User group record ID
   * @param data - Serialized user group record data
   */
  saveGroup: (groupId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: groupId.trim().toUpperCase(),
    data,
  }),

  /**
   * Authorize user group (Maker-Checker approval step).
   *
   * @param groupId - User group record ID to authorize
   */
  authorizeGroup: (groupId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: groupId.trim().toUpperCase(),
  }),

  /**
   * Delete or decommission user group.
   *
   * @param groupId - User group record ID to delete
   */
  deleteGroup: (groupId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.USER_GROUP,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: groupId.trim().toUpperCase(),
  }),
};
