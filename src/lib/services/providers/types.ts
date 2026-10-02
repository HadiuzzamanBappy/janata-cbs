import "server-only";
import type { FormSchema } from "@/features/screens";
import type { MenuItem } from "@/features/screens";
import type { SystemCommandItem } from "@/lib/core/commands";
import type { BranchMock } from "@fixtures";

export interface ModelProvider {
  fetchSchema(command: string, token?: string): Promise<FormSchema | null>;
}

export interface MenuProvider {
  fetchMenu(controlName?: string, token?: string): Promise<MenuItem[]>;
}

export interface BranchProvider {
  fetchBranches(token?: string): Promise<BranchMock[]>;
}

export interface ControlProvider {
  fetchControls(token?: string): Promise<SystemCommandItem[]>;
}
