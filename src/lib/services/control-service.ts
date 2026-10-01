import "server-only";
import { appConfig } from "@/lib/config";
import type { SystemCommandItem } from "@/lib/core/commands";
import { getOrSet } from "@/lib/redis";
import { getControlProvider } from "./providers";

const CONTROLS_TTL_SECONDS = appConfig.redis.menuTtlSeconds;

export async function getControlsData(token?: string): Promise<SystemCommandItem[]> {
  const cacheKey = "controls:list";
  const provider = getControlProvider();
  return getOrSet(cacheKey, () => provider.fetchControls(token), CONTROLS_TTL_SECONDS);
}
