import "server-only";
import { appConfig } from "@/lib/config";
import { getOrSet } from "@/lib/redis";
import type { BranchMock } from "@fixtures";
import { getBranchProvider } from "./providers";

const BRANCH_TTL_SECONDS = appConfig.redis.specTtlSeconds;

export async function getBranchData(token?: string): Promise<BranchMock[]> {
  const cacheKey = "branches:directory";
  const provider = getBranchProvider();
  return getOrSet(cacheKey, () => provider.fetchBranches(token), BRANCH_TTL_SECONDS);
}

export const getBranchesData = getBranchData;

