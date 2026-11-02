import { CbsControlTable } from "@/types";
import { createModelPayloads } from "./payloads/base-model";
import { formConfigPayloads } from "./payloads/form-config";
import { inquiryPayloads } from "./payloads/inquiry";
import { modelConfigPayloads } from "./payloads/model-config";
import { userSecurityPayloads } from "./payloads/user-security";
import { type SendCbsOptions, sendCbsRequest } from "./transport/proxy-client";

/* -------------------------------------------------------------------------- */
/* Public Type Exports                                                        */
/* -------------------------------------------------------------------------- */

export type { SendCbsOptions };

/* -------------------------------------------------------------------------- */
/* Canonical CBS Client Facade Singleton                                      */
/* -------------------------------------------------------------------------- */

/**
 * Universal CBS Micro-Client facade.
 * Provides unified, type-safe access to wire transport and payload factories
 * while completely eliminating hardcoded control table names across the UI.
 */
export const cbs = {
  /** Core wire transport dispatcher (`/api/proxy`) */
  send: sendCbsRequest,

  /** Universal model factory for dynamic runtime tables (e.g., CUSTOMER, ACCOUNT, TELLER) */
  model: createModelPayloads,

  // --- Fixed System Directories & Navigation ---
  /** Branch directory (`SC_BRANCH`) */
  branch: createModelPayloads(CbsControlTable.BRANCH),
  /** System command catalog (`SC_CONTROL`) */
  control: createModelPayloads(CbsControlTable.CONTROL),
  /** Menu catalog items (`SC_MENU`) */
  menu: createModelPayloads(CbsControlTable.MENU),
  /** Hierarchical navigation menu trees (`SC_MENU_TREE`) */
  menuTree: createModelPayloads(CbsControlTable.MENU_TREE),

  // --- Meta-Configuration Designers (Dedicated Wire Protocol Verbs) ---
  /** Model Config Designer (`MODEL.CONFIG` via `GMC`, `SMC`, `AMC`) */
  modelConfig: modelConfigPayloads,
  /** Form Config Designer (`CONFIG.FORM` via `GFC`, `SFC`) */
  formConfig: formConfigPayloads,
  /** Dynamic Inquiry Config Definitions (`INQUIRY`) */
  inquiryConfig: createModelPayloads(CbsControlTable.INQUIRY_CONFIG),

  // --- Runtime Query & Security Engines ---
  /** Runtime tabular inquiry query executor (`INQ`) */
  inquiry: inquiryPayloads,
  /** Operator credentials & sign-on security (`CPW`, `CUN`) */
  userSecurity: userSecurityPayloads,
} as const;

export default cbs;
