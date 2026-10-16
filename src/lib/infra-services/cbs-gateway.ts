import "server-only";

import { appConfig } from "@/lib/core-config/server";
import {
  getMockBranchesPayload,
  getMockControlsPayload,
  getMockFormPayload,
  getMockInquiryPayload,
  getMockMenuPayload,
  getMockProxyResponse,
  getMockUserResponse,
} from "./mock-service";

/**
 * Single source of truth for runtime mode check.
 */
export const isStaticMode = (): boolean => appConfig.dataSource === "static";

/**
 * Single, simple function to fetch static data by controlName and requestType.
 */
export function getStaticData(
  controlName: string,
  recordId = "",
  requestType = "GET",
  data?: Record<string, unknown>,
): unknown {
  const clean = controlName.trim().toUpperCase();

  // 1. Direct Domain Service Dispatches
  if (clean === "AUTH") return getMockUserResponse(recordId);
  if (clean === "MENU") return getMockMenuPayload();
  if (clean === "BRANCH") return getMockBranchesPayload();
  if (clean === "CONTROL") return getMockControlsPayload();
  if (clean === "FORM" || requestType === "GMC") return getMockFormPayload(recordId);
  if (clean === "INQUIRY" || requestType === "INQ") return getMockInquiryPayload(recordId || clean);

  // 2. Dynamic Transaction & Record Proxy (GET, PUT, GRL, etc.)
  return getMockProxyResponse(requestType, clean, recordId, data);
}
