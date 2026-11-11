import type { CbsWirePayload } from "@/lib/data-schemas";
import { CbsRequestType } from "@/types";

export const userSecurityPayloads = {
  changePassword: (params: {
    currPass: string;
    newPass: string;
    servicePath?: string;
  }): CbsWirePayload => ({
    servicePath: params.servicePath,
    requestType: CbsRequestType.CPW,
    controlName: "",
    data: params,
  }),
};
