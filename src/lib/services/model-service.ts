import "server-only";
import type { FormSchema } from "@/features/screens";
import { appConfig } from "@/lib/config";
import { getOrSet } from "@/lib/redis";
import { getModelProvider } from "./providers";

const SPEC_TTL_SECONDS = appConfig.redis.specTtlSeconds;

export async function getModelData(command: string, token?: string): Promise<FormSchema | null> {
  const cleanCommand = command.toUpperCase();
  const cacheKey = `spec:${cleanCommand}`;
  const provider = getModelProvider();
  return getOrSet(cacheKey, () => provider.fetchSchema(cleanCommand, token), SPEC_TTL_SECONDS);
}
