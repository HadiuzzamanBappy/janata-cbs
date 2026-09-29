import "server-only";
import { env } from "@/lib/config";

export interface ServiceDef {
  url: string;
}

/**
 * Microservice Endpoint Registry for CBS core & REST services.
 */
export const SERVICES: Record<string, ServiceDef> = {
  default: { url: env.GRPC_HOST },
  customer: { url: env.SERVICE_CUSTOMER_BASE_URL },
  finxurm: { url: env.SERVICE_URM_BASE_URL },
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
