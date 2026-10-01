import "server-only";
import { type FormSchema, type MenuItem, parseGMC, parseMNU } from "@/features/screens";
import { appConfig } from "@/lib/config";
import type { SystemCommandItem } from "@/lib/core/commands";
import { getServiceUrl } from "@/lib/core/services";
import {
  extractStringField,
  getItemFields,
  grpcProcess,
  unwrapRecordsPayload,
} from "@/lib/grpc";
import { getSession } from "@/lib/redis";
import type { BranchMock } from "@fixtures";
import type {
  ModelProvider,
  MenuProvider,
  BranchProvider,
  ControlProvider,
} from "../types";

const MODEL_REQUEST_TYPE = "GMC";
const MODEL_CONTROL_NAME = "?";
const MODEL_RECORD_FUNCTION = "S";

const MENU_REQUEST_TYPE = "GUM";
const DEFAULT_MENU_CONTROL = "MAIN_MENU";
const MENU_RECORD_FUNCTION = "L";

const BRANCH_REQUEST_TYPE = "GRL";
const BRANCH_CONTROL_NAME = "BRANCH";
const BRANCH_RECORD_FUNCTION = "L";

const CONTROL_REQUEST_TYPE = "GRL";
const CONTROL_CONTROL_NAME = "CONTROL";
const CONTROL_RECORD_FUNCTION = "L";

export const grpcModelProvider: ModelProvider = {
  async fetchSchema(command: string, tokenParam?: string): Promise<FormSchema | null> {
    const cleanCmd = command.split(",")[0].trim().toUpperCase();

    const session = await getSession();
    const token = tokenParam || session?.token;
    if (!token) {
      throw new Error(
        `UNAUTHENTICATED: No valid session token available for gRPC schema fetch (${cleanCmd})`,
      );
    }

    const userId = session?.userId || session?.currUser?.userId || "SYSUSER";
    const branchCode = session?.currUser?.branchCode || appConfig.centralBranch;
    const address = getServiceUrl("default");

    const res = await grpcProcess(
      address,
      "nonfinancial",
      {
        idempotencyKey: "",
        clientId: appConfig.grpc.clientId,
        requestType: MODEL_REQUEST_TYPE,
        controlName: MODEL_CONTROL_NAME,
        recordFunction: MODEL_RECORD_FUNCTION,
        recordId: cleanCmd,
        branchCode,
        authLevel: 1,
        userId,
        data: {},
      },
      { token },
    );

    if (res.statusCode !== 200 || !res.data) {
      throw new Error(
        `gRPC GMC fetch failed for ${cleanCmd} with status code ${res.statusCode}: ${res.message || "No data returned"}`,
      );
    }

    const parsed = parseGMC(res.data, cleanCmd);
    if (!parsed.success) {
      throw new Error(`gRPC GMC schema parsing failed for ${cleanCmd}: ${parsed.error}`);
    }

    return parsed.data;
  },
};

export const grpcMenuProvider: MenuProvider = {
  async fetchMenu(
    controlName: string = DEFAULT_MENU_CONTROL,
    tokenParam?: string,
  ): Promise<MenuItem[]> {
    const session = await getSession();
    const token = tokenParam || session?.token;
    if (!token) {
      throw new Error("UNAUTHENTICATED: No valid session token available for gRPC menu fetch");
    }

    const userId = session?.userId || session?.currUser?.userId || "SYSUSER";
    const branchCode = session?.currUser?.branchCode || appConfig.centralBranch;
    const address = getServiceUrl("default");

    const res = await grpcProcess(
      address,
      "nonfinancial",
      {
        idempotencyKey: "",
        clientId: appConfig.grpc.clientId,
        requestType: MENU_REQUEST_TYPE,
        controlName,
        recordFunction: MENU_RECORD_FUNCTION,
        recordId: "",
        branchCode,
        authLevel: 1,
        userId,
        data: {},
      },
      { token },
    );

    if (res.statusCode !== 200 || !res.data) {
      throw new Error(
        `gRPC menu fetch failed with status code ${res.statusCode}: ${res.message || "No data returned"}`,
      );
    }

    const parsed = parseMNU(res.data);
    if (!parsed.success) {
      throw new Error(`gRPC menu schema parsing failed: ${parsed.error}`);
    }

    return parsed.data;
  },
};

export const grpcBranchProvider: BranchProvider = {
  async fetchBranches(tokenParam?: string): Promise<BranchMock[]> {
    const session = await getSession();
    const token = tokenParam || session?.token;
    if (!token) {
      throw new Error("UNAUTHENTICATED: No valid session token available for gRPC branch fetch");
    }

    const userId = session?.userId || session?.currUser?.userId || "SYSUSER";
    const branchCode = session?.currUser?.branchCode || appConfig.centralBranch;
    const address = getServiceUrl("default");

    const res = await grpcProcess(
      address,
      "nonfinancial",
      {
        idempotencyKey: "",
        clientId: appConfig.grpc.clientId,
        requestType: BRANCH_REQUEST_TYPE,
        controlName: BRANCH_CONTROL_NAME,
        recordFunction: BRANCH_RECORD_FUNCTION,
        recordId: "",
        branchCode,
        authLevel: 1,
        userId,
        data: {},
      },
      { token },
    );

    if (res.statusCode !== 200 || !res.data) {
      throw new Error(
        `gRPC branch fetch failed with status code ${res.statusCode}: ${res.message || "No data returned"}`,
      );
    }

    const rawList = unwrapRecordsPayload(res.data);
    return rawList.map((item) => {
      const f = getItemFields(item);
      return {
        recordId: extractStringField(f, "recordId"),
        branchTitle: extractStringField(f, "branchTitle"),
        branchAddress: extractStringField(f, "branchAddress"),
        branchOpenDate: extractStringField(f, "branchOpenDate"),
        currTxnDate: extractStringField(f, "currTxnDate"),
        divCode: extractStringField(f, "divCode"),
        areaCode: extractStringField(f, "areaCode"),
      };
    });
  },
};

export const grpcControlProvider: ControlProvider = {
  async fetchControls(tokenParam?: string): Promise<SystemCommandItem[]> {
    const session = await getSession();
    const token = tokenParam || session?.token;
    if (!token) {
      throw new Error("UNAUTHENTICATED: No valid session token available for gRPC controls fetch");
    }

    const userId = session?.userId || session?.currUser?.userId || "SYSUSER";
    const branchCode = session?.currUser?.branchCode || appConfig.centralBranch;
    const address = getServiceUrl("default");

    const res = await grpcProcess(
      address,
      "nonfinancial",
      {
        idempotencyKey: "",
        clientId: appConfig.grpc.clientId,
        requestType: CONTROL_REQUEST_TYPE,
        controlName: CONTROL_CONTROL_NAME,
        recordFunction: CONTROL_RECORD_FUNCTION,
        recordId: "",
        branchCode,
        authLevel: 1,
        userId,
        data: {},
      },
      { token },
    );

    if (res.statusCode !== 200 || !res.data) {
      throw new Error(
        `gRPC controls fetch failed with status code ${res.statusCode}: ${res.message || "No data returned"}`,
      );
    }

    const rawList = unwrapRecordsPayload(res.data);
    const result: SystemCommandItem[] = [];

    for (const item of rawList) {
      const fields = getItemFields(item);
      const cmdName =
        extractStringField(fields, "controlName") || extractStringField(fields, "recordId");
      const desc = extractStringField(fields, "description") || cmdName;

      if (cmdName) {
        result.push({
          id: cmdName,
          title: desc || cmdName,
          category: "System Controls & Commands",
          description: desc,
          command: cmdName,
          allowedRoles: ["*"],
          actionType: "SCREEN",
        });
      }
    }

    return result;
  },
};
