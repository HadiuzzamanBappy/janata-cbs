import {
  CbsControlTable,
  CbsRequestType,
  type CbsWirePayload,
  DEFAULT_SERVICE_PATH,
} from "@/types";
import { createModelPayloads } from "./base-model";

const base = createModelPayloads(CbsControlTable.USER_PASS_RESET);

export const userSecurityPayloads = {
  ...base,

  changeSignOnName: (params: {
    oldUserName: string;
    newUserName: string;
    password: string;
    servicePath?: string;
  }): CbsWirePayload => ({
    servicePath: params.servicePath || DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.CUN,
    controlName: "",
    data: params,
  }),

  changePassword: (params: {
    currPass: string;
    newPass: string;
    servicePath?: string;
  }): CbsWirePayload => ({
    servicePath: params.servicePath || DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.CPW,
    controlName: "",
    data: params,
  }),
};
