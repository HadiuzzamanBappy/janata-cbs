import "server-only";

import { appConfig } from "@/lib/core-config/server";
import {
  getMockBranchesPayload,
  getMockControlsPayload,
  getMockFormPayload,
  getMockInquiryPayload,
  getMockMenuPayload,
  getMockProxyResponse,
} from "./mock-service";

/**
 * Single source of truth for runtime mode check.
 */
export const isStaticMode = (): boolean => appConfig.modelSource === "static";

/**
 * Single, simple function to fetch static data by controlName and requestType.
 */
export function getStaticData(controlName: string, recordId = "", requestType = "GET"): unknown {
  const clean = controlName.trim().toUpperCase();

  if (requestType === "GUM" || clean === "MENU" || clean === "MENU.TREE") {
    return getMockMenuPayload();
  }
  if (clean === "BRANCH") {
    return getMockBranchesPayload();
  }
  if (clean === "CONTROL") {
    return getMockControlsPayload();
  }
  if (requestType === "INQ" || clean === "INQUIRY") {
    return getMockInquiryPayload(recordId || clean);
  }
  if (requestType === "GMC") {
    return getMockFormPayload(recordId || clean);
  }

  return getMockProxyResponse(requestType, clean, recordId);
}
