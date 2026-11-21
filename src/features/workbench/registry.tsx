"use client";

import { OpsForm } from "@/features/operations/forms";
import { OpsInquiry } from "@/features/operations/inquiries";
import { SysFormConfig } from "@/features/system/form-config";
import { SysInquiryConfig } from "@/features/system/inquiry-config";
import { SysMenuDesigner } from "@/features/system/menu-designer";
import { SysModelConfig } from "@/features/system/model-config";
import { cbsCommand, resolveCommandAlias } from "@/lib/cbs-command";
import type { CbsScreenComponent } from "@/lib/cbs-screen";

/**
 * Dedicated registry for custom/bespoke React screen components.
 * Only canonical command keys are registered here; shorthand aliases
 * (e.g. MD, IC, FC, MC) are automatically resolved via `resolveCommandAlias`.
 */
const BESPOKE_SCREENS: Record<string, CbsScreenComponent> = {
  "MENU.DESIGN": SysMenuDesigner,
  "MODEL.CONFIG": SysModelConfig,
  "FORM.CONFIG": SysFormConfig,
  "INQUIRY.CONFIG": SysInquiryConfig,
};

/** A command as typed: URL-decoded when it came from a `/screen/...` URL (a stray `%` is kept). */
function decodeCommand(command: string): string {
  try {
    return decodeURIComponent(command || "");
  } catch {
    return command || "";
  }
}

/**
 * Extracts and cleans the primary command token from raw input strings.
 */
function extractCleanCommand(command: string): string {
  return decodeCommand(command).split(",")[0].trim().toUpperCase();
}

/**
 * Determines whether a command targets an Inquiry screen (`INQ <NAME>` / `INQUIRY <NAME>`), by
 * the command grammar itself, so a model such as `INQUIRY.LOG` stays a form.
 */
export function isInquiryCommand(command: string): boolean {
  return cbsCommand.parse(decodeCommand(command)).type === "INQUIRY";
}

/**
 * Checks if a command corresponds to a registered bespoke system/admin screen.
 */
export function isSystemScreen(command: string): boolean {
  const cleanCmd = extractCleanCommand(command);
  const canonicalKey = resolveCommandAlias(cleanCmd);
  return Boolean(BESPOKE_SCREENS[canonicalKey]);
}

/**
 * Universal Screen Resolver.
 * Resolves screens strictly through canonical domain rules:
 * 1. Bespoke system screen registry (e.g. SC.MODEL.CONFIG, SC.FORM.CONFIG).
 * 2. Dynamic Inquiry screen (`OpsInquiry`) when prefixed with INQ or INQUIRY.
 * 3. Dynamic Form screen (`OpsForm`) for all transactional CBS records.
 */
export function resolveScreen(command: string): CbsScreenComponent {
  const cleanCmd = extractCleanCommand(command);

  // 1. Check canonical screen key via gateway
  const canonicalKey = resolveCommandAlias(cleanCmd);
  if (BESPOKE_SCREENS[canonicalKey]) {
    return BESPOKE_SCREENS[canonicalKey];
  }

  // 2. Check if command is an Inquiry screen
  if (isInquiryCommand(command)) {
    return OpsInquiry;
  }

  // 3. Dynamic Form Screen Fallback
  return OpsForm;
}
