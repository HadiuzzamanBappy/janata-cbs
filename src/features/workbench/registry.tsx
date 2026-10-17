"use client";

import { FormScreen } from "@/features/operations/forms";
import { InquiryScreen } from "@/features/operations/inquiries";
import { SysFormConfig } from "@/features/system/form-config";
import { SysInquiryConfig } from "@/features/system/inquiry-config";
import { SysMenuCatalog } from "@/features/system/menu-catalog";
import { SysMenuDesigner } from "@/features/system/menu-designer";
import { SysModelConfig } from "@/features/system/model-config";
import ReportStudio from "@/features/system/report-studio";
import { SysUserGroup } from "@/features/system/user-group";
import { getCanonicalScreenKey } from "@/lib/cbs-command";
import type { ScreenComponent } from "./types";

/**
 * Dedicated registry for custom/bespoke React screen components.
 * Only canonical command keys are registered here; shorthand aliases
 * (e.g. MD, PWD) are automatically resolved via `getCanonicalScreenKey`.
 */
const BESPOKE_SCREENS: Record<string, ScreenComponent> = {
  "SC.MENU": SysMenuCatalog,
  "SC.MENU.DESIGN": SysMenuDesigner,
  "SC.USER.GROUP": SysUserGroup,
  "SC.MODEL.CONFIG": SysModelConfig,
  "SC.FORM.CONFIG": SysFormConfig,
  "SC.INQUIRY.CONFIG": SysInquiryConfig,
  "SC.REPORT.BUILDER": () => (
    <div className="w-full h-full overflow-hidden">
      <ReportStudio />
    </div>
  ),
};

/**
 * Checks if a command corresponds to a bespoke system/admin screen.
 */
export function isSystemScreen(command: string): boolean {
  const cleanCmd = (command || "").split(",")[0].trim().toUpperCase();
  const canonicalKey = getCanonicalScreenKey(cleanCmd) || cleanCmd;
  return Boolean(BESPOKE_SCREENS[canonicalKey]);
}

/**
 * Universal Screen Resolver.
 * 1. Checks canonical key via CBS Command Gateway alias map.
 * 2. If command starts with INQ or INQUIRY, resolves to InquiryScreen.
 * 3. Fallbacks to schema-driven FormScreen engine.
 */
export function resolveScreen(command: string): ScreenComponent {
  const decodedCmd = decodeURIComponent(command || "");
  const cleanCmd = decodedCmd.split(",")[0].trim().toUpperCase();

  // 1. Check canonical screen key via gateway
  const canonicalKey = getCanonicalScreenKey(cleanCmd) || cleanCmd;
  if (BESPOKE_SCREENS[canonicalKey]) {
    return BESPOKE_SCREENS[canonicalKey];
  }

  // 2. Check if command is an Inquiry screen
  if (cleanCmd.startsWith("INQ ") || cleanCmd.startsWith("INQUIRY")) {
    const inqCommand = cleanCmd.startsWith("INQ ") ? cleanCmd : `INQ ${cleanCmd}`;
    return function InquiryWrapper(props: { command: string; tabId?: string }) {
      return <InquiryScreen command={props.command || inqCommand} tabId={props.tabId} />;
    };
  }

  // 3. Dynamic GMC Form Screen Fallback
  return function FormWrapper(props: { command: string; tabId?: string }) {
    return <FormScreen command={props.command || cleanCmd} tabId={props.tabId} />;
  };
}
