"use client";

import { FormScreen } from "@/features/operations/forms";
import { InquiryScreen } from "@/features/operations/inquiries";
import { SysFormConfig } from "@/features/system/form-config";
import { SysInquiryConfig } from "@/features/system/inquiry-config";
import { SysMenuDesigner } from "@/features/system/menu-designer";
import { SysModelConfig } from "@/features/system/model-config";
import { getCanonicalScreenKey } from "@/lib/cbs-command";
import type { CbsScreenComponent } from "@/lib/cbs-screen";

/**
 * Dedicated registry for custom/bespoke React screen components.
 * Only canonical command keys are registered here; shorthand aliases
 * (e.g. MD, IC, FC, MC) are automatically resolved via `getCanonicalScreenKey`.
 */
const BESPOKE_SCREENS: Record<string, CbsScreenComponent> = {
  "SC.MENU.DESIGN": SysMenuDesigner,
  "SC.MODEL.CONFIG": SysModelConfig,
  "SC.FORM.CONFIG": SysFormConfig,
  "SC.INQUIRY.CONFIG": SysInquiryConfig,
};

/**
 * Extracts and cleans the primary command token from raw input strings.
 */
export function extractCleanCommand(command: string): string {
  const decoded = decodeURIComponent(command || "");
  return decoded.split(",")[0].trim().toUpperCase();
}

/**
 * Determines whether a command targets an Inquiry screen.
 */
export function isInquiryCommand(command: string): boolean {
  const cleanCmd = extractCleanCommand(command);
  return cleanCmd.startsWith("INQ ") || cleanCmd.startsWith("INQUIRY");
}

/**
 * Checks if a command corresponds to a registered bespoke system/admin screen.
 */
export function isSystemScreen(command: string): boolean {
  const cleanCmd = extractCleanCommand(command);
  const canonicalKey = getCanonicalScreenKey(cleanCmd) || cleanCmd;
  return Boolean(BESPOKE_SCREENS[canonicalKey]);
}

/**
 * Universal Screen Resolver.
 * Resolves screens strictly through canonical domain rules:
 * 1. Bespoke system screen registry (e.g. SC.MODEL.CONFIG, SC.FORM.CONFIG).
 * 2. Dynamic Inquiry screen (`InquiryScreen`) when prefixed with INQ or INQUIRY.
 * 3. Dynamic Form screen (`FormScreen`) for all transactional CBS records.
 */
export function resolveScreen(command: string): CbsScreenComponent {
  const cleanCmd = extractCleanCommand(command);

  // 1. Check canonical screen key via gateway
  const canonicalKey = getCanonicalScreenKey(cleanCmd) || cleanCmd;
  if (BESPOKE_SCREENS[canonicalKey]) {
    return BESPOKE_SCREENS[canonicalKey];
  }

  // 2. Check if command is an Inquiry screen
  if (isInquiryCommand(command)) {
    return InquiryScreen;
  }

  // 3. Dynamic Form Screen Fallback
  return FormScreen;
}
