import "server-only";
import { appConfig } from "@/lib/config";

export interface ServiceDef {
  url: string;
}

/**
 * Microservice Endpoint Registry for CBS core & REST downstream services.
 */
export const SERVICES: Record<string, ServiceDef> = {
  default: { url: appConfig.grpc.host },
  customer: { url: appConfig.services.customerBaseUrl },
  urm: { url: appConfig.services.urmBaseUrl },
};

export function getServices(): Record<string, ServiceDef> {
  return SERVICES;
}

export function getServiceUrl(serviceKey: string = "default"): string {
  const targetKey = serviceKey || "default";
  return SERVICES[targetKey]?.url || SERVICES.default.url;
}

export function resolveServiceUrl(servicePath: string): {
  statusCode: number;
  url: string;
  err?: string;
} {
  const url = getServiceUrl(servicePath);
  if (!url) {
    return {
      statusCode: 404,
      url: "",
      err: `Unknown service path "${servicePath}" requested.`,
    };
  }
  return { statusCode: 200, url };
}
