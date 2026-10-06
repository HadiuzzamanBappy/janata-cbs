import { CbsControlTable } from "../contracts/control-tables";
import type { CbsWirePayload } from "../contracts/envelope-schema";
import { CbsRecordFunction } from "../contracts/record-functions";
import { CbsRequestType } from "../contracts/request-types";

/**
 * Domain payload builders for Staff Password Reset and Account Security
 */
export const userSecurityPayloads = {
  /** Fetch user security profile */
  getUserProfile: (userId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.SEE,
    recordId: userId,
  }),

  /** Commit reset / unlock update */
  saveUserProfile: (userId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: userId,
    data,
  }),

  /** Authorize credential reset */
  authorizeUserProfile: (userId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: userId,
  }),

  /** Change sign-on name (CUN) */
  changeSignOnName: (params: {
    oldUserName: string;
    newUserName: string;
    password: string;
  }): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.CHANGE_USER_NAME,
    controlName: "?",
    data: params,
  }),

  /** Change user password (CPW) */
  changePassword: (params: { currPass: string; newPass: string }): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.CHANGE_PASSWORD,
    controlName: "?",
    data: params,
  }),
};
