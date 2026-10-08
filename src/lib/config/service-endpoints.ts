import "server-only";
import { appConfig } from "@/lib/config";

export type ServiceProtocol = "grpc" | "rest";

export interface ServiceDef {
  url: string;
  protocol: ServiceProtocol;
}

/**
 * Microservice Endpoint Registry with transport protocol metadata.
 * Scales dynamically to any number of gRPC or REST microservices without code changes.
 */
export const SERVICES: Record<string, ServiceDef> = {
  default: { url: appConfig.grpc.host, protocol: "grpc" },
  customer: { url: appConfig.services.customerBaseUrl, protocol: "grpc" },
  urm: { url: appConfig.services.urmBaseUrl, protocol: "grpc" },
};

/**
 * Domain-specific requestType overrides based on control keywords.
 * Decouples business transaction overrides from the low-level transport layer.
 */
export const REQUEST_TYPE_OVERLAYS: Record<string, Record<string, string>> = {
  USER: {
    AUT: "UAU",
  },
  "FUNDS.TRANSFER": {
    PUT: "AFT",
    AUT: "AFT",
    REV: "AFT",
  },
  "CASH.TRANSFER": {
    PUT: "ACT",
    AUT: "ACT",
    REV: "ACT",
  },
};

export function getServices(): Record<string, ServiceDef> {
  return SERVICES;
}

export function getService(serviceKey: string = "default"): ServiceDef | undefined {
  const targetKey = serviceKey || "default";
  return SERVICES[targetKey] || SERVICES.default;
}

export function getServiceUrl(serviceKey: string = "default"): string {
  return getService(serviceKey)?.url || SERVICES.default.url;
}

