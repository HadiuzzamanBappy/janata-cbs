import "server-only";
import { STATIC_MODELS, STATIC_MENU, STATIC_COMMANDS, STATIC_BRANCHES, type BranchMock } from "@fixtures";
import { type FormSchema, type MenuItem, parseGMC, parseMNU } from "@/features/screens";
import type { SystemCommandItem } from "@/lib/core/commands";
import { extractStringField, getItemFields, unwrapRecordsPayload } from "@/lib/grpc";
import type {
  ModelProvider,
  MenuProvider,
  BranchProvider,
  ControlProvider,
} from "../types";

function parseControlsPayload(data: unknown): SystemCommandItem[] {
  const rawList = unwrapRecordsPayload(data);
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
}

export const mockModelProvider: ModelProvider = {
  async fetchSchema(command: string): Promise<FormSchema | null> {
    const cleanCmd = command.split(",")[0].trim().toUpperCase();
    const rawMock = STATIC_MODELS[cleanCmd];
    if (!rawMock) return null;
    const parsed = parseGMC(rawMock, cleanCmd);
    return parsed.success ? parsed.data : null;
  },
};

export const mockMenuProvider: MenuProvider = {
  async fetchMenu(): Promise<MenuItem[]> {
    const parseResult = parseMNU(STATIC_MENU);
    if (!parseResult.success) {
      throw new Error(`Failed to parse static menu: ${parseResult.error}`);
    }
    return parseResult.data;
  },
};

export const mockBranchProvider: BranchProvider = {
  async fetchBranches(): Promise<BranchMock[]> {
    return STATIC_BRANCHES;
  },
};

export const mockControlProvider: ControlProvider = {
  async fetchControls(): Promise<SystemCommandItem[]> {
    return parseControlsPayload(STATIC_COMMANDS.data);
  },
};
