import "server-only";
import { env } from "@/lib/env";

export interface ServiceDef {
  url: string;
}

/**
 * Microservice Endpoint Registry for CBS core & REST services.
 */
export const SERVICES: Record<string, ServiceDef> = {
  default: { url: env.GRPC_ADDRESS_DEFAULT || env.GRPC_ADDRESS },
  defaultdev: { url: env.GRPC_ADDRESS_DEFAULTDEV },
  customer: { url: env.SERVICE_URL_CUSTOMER },
  finxurm: { url: env.SERVICE_URL_FINXURM },
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
