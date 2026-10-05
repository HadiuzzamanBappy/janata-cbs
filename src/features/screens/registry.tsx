"use client";

import { ChangePassword } from "@/features/settings/components/security-tab";
import ReportStudio from "@/features/reportstudio";
import { EnquiryScreen } from "./enquiries";
import { FormScreen } from "./forms";
import type { ScreenComponent } from "./types";

/**
 * Dedicated registry for custom/bespoke React screen components.
 */
const BESPOKE_SCREENS: Record<string, ScreenComponent> = {
  "USER.CHANGE.PASS": ChangePassword,
  "SC.REPORT.DESIGN": () => (
    <div className="w-full h-full overflow-hidden">
      <ReportStudio />
    </div>
  )
};

/**
 * Universal Screen Resolver.
 * 1. Checks statically registered custom component.
 * 2. If command starts with ENQ or ENQUIRY, resolves to EnquiryScreen.
 * 3. Fallbacks to schema-driven FormScreen engine.
 */
export function resolveScreen(command: string): ScreenComponent {
  const decodedCmd = decodeURIComponent(command || "");
  const cleanCmd = decodedCmd.split(",")[0].trim().toUpperCase();

  // 1. Check statically registered custom component
  if (BESPOKE_SCREENS[cleanCmd]) {
    return BESPOKE_SCREENS[cleanCmd];
  }

  // 2. Check if command is an Inquiry screen
  if (
    cleanCmd.startsWith("INQ ") ||
    cleanCmd.startsWith("INQUIRY")
  ) {
    return function EnquiryWrapper(props: { command: string; tabId?: string }) {
      return <EnquiryScreen command={props.command || cleanCmd} tabId={props.tabId} />;
    };
  }

  // 3. Dynamic GMC Form Screen Fallback
  return function FormWrapper(props: { command: string; tabId?: string }) {
    return <FormScreen command={props.command || cleanCmd} tabId={props.tabId} />;
  };
}
