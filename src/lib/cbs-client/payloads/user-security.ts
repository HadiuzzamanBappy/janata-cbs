import type { CbsWirePayload } from "@/lib/data-schemas";
import { CbsRequestType, DEFAULT_SERVICE_PATH } from "@/types";
export const userSecurityPayloads = {
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
