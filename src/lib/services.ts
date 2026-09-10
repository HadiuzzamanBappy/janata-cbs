import "server-only";
import { env } from "@/lib/env";

export interface ServiceDef {
  url: string;
}

/**
 * Microservice Endpoint Registry driven 100% by validated environment variables.
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
  return SERVICES[serviceKey]?.url || env.GRPC_ADDRESS;
}
