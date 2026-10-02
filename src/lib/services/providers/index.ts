import "server-only";
import { appConfig } from "@/lib/config";
import { grpcBranchProvider } from "./grpc";
import { mockBranchProvider } from "./mock";
import { grpcControlProvider } from "./grpc";
import { mockControlProvider } from "./mock";
import { grpcMenuProvider } from "./grpc";
import { mockMenuProvider } from "./mock";
import { grpcModelProvider } from "./grpc";
import { mockModelProvider } from "./mock";
import type {
  BranchProvider,
  ControlProvider,
  MenuProvider,
  ModelProvider,
} from "./types";

export * from "./types";

export function getModelProvider(): ModelProvider {
  return appConfig.modelSource === "static" ? mockModelProvider : grpcModelProvider;
}

export function getMenuProvider(): MenuProvider {
  return appConfig.modelSource === "static" ? mockMenuProvider : grpcMenuProvider;
}

export function getBranchProvider(): BranchProvider {
  return appConfig.modelSource === "static" ? mockBranchProvider : grpcBranchProvider;
}

export function getControlProvider(): ControlProvider {
  return appConfig.modelSource === "static" ? mockControlProvider : grpcControlProvider;
}
