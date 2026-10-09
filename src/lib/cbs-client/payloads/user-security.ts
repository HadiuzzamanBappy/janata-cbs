import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsControlTable } from "../types/control-tables";
import { CbsRequestType } from "../types/request-types";

/**
 * Domain payload builders for Staff Password Reset and Account Security.
 */
export const userSecurityPayloads = {
  /**
   * Fetch staff security profile by user ID.
   *
   * @param userId - Staff user ID
   */
  getUserProfile: (userId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.SEE,
    recordId: userId.trim().toUpperCase(),
  }),

  /**
   * Commit credential reset or unlock update.
   *
   * @param userId - Staff user ID
   * @param data - Updated profile or reset payload
   */
  saveUserProfile: (userId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: userId.trim().toUpperCase(),
    data,
  }),

  /**
   * Authorize credential reset (Maker-Checker approval step).
   *
   * @param userId - Staff user ID to authorize
   */
  authorizeUserProfile: (userId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: userId.trim().toUpperCase(),
  }),

  /**
   * Delete or cancel a credential reset request.
   *
   * @param userId - Staff user ID
   */
  deleteUserProfile: (userId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.USER_PASS_RESET,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: userId.trim().toUpperCase(),
  }),

  /**
   * Change sign-on / username (CUN verb).
   *
   * @param params - Current credentials and target username
   */
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

  /**
   * Change staff user password (CPW verb).
   *
   * @param params - Current password and new password
   */
  changePassword: (params: { currPass: string; newPass: string }): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.CHANGE_PASSWORD,
    controlName: "",
    data: params,
  }),
};
