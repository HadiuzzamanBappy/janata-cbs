import "server-only";
import type { MenuItem } from "@/features/screens";
import { appConfig } from "@/lib/config";
import { getOrSet } from "@/lib/redis";
import { getMenuProvider } from "./providers";

const MENU_TTL_SECONDS = appConfig.redis.menuTtlSeconds;
const DEFAULT_MENU_CONTROL = "MAIN_MENU";

export async function getMenuData(
  token?: string,
  controlName: string = DEFAULT_MENU_CONTROL,
): Promise<MenuItem[]> {
  const cacheKey = `menu:${controlName}`;
  const provider = getMenuProvider();
  return getOrSet(cacheKey, () => provider.fetchMenu(controlName, token), MENU_TTL_SECONDS);
}
