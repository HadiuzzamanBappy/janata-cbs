import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsControlTable } from "../types/control-tables";
import { CbsRequestType } from "../types/request-types";

/**
 * Domain payload builders for Staff Password Reset and Account Security
 */
export const userSecurityPayloads = {
  /** Fetch user security profile */
  getUserProfile: (userId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.SEE,
    recordId: userId.trim().toUpperCase(),
  }),

  /** Commit reset / unlock update */
  saveUserProfile: (userId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: userId.trim().toUpperCase(),
    data,
  }),

  /** Authorize credential reset */
  authorizeUserProfile: (userId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: userId.trim().toUpperCase(),
  }),

  /** Delete / Cancel credential reset request */
  deleteUserProfile: (userId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: userId.trim().toUpperCase(),
  }),

  /** Change sign-on name (CUN) */
  changeSignOnName: (params: {
    oldUserName: string;
    newUserName: string;
    password: string;
  }): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.CHANGE_USER_NAME,
    controlName: "",
    data: params,
  }),

  /** Change user password (CPW) */
  changePassword: (params: { currPass: string; newPass: string }): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.CHANGE_PASSWORD,
    controlName: "",
    data: params,
  }),
};
