"use client";

import { ChangePassword } from "@/features/settings/components/security-tab";
import { CobRegistryScreen } from "@/features/system/cob-registry";
import { EnquiryDesignerScreen } from "@/features/system/inquiry-designer";
import { MenuCatalogScreen } from "@/features/system/menu-catalog";
import { MenuDesignerScreen } from "@/features/system/menu-designer";
import { ModelConfigScreen } from "@/features/system/model-config";
import ReportStudio from "@/features/system/report-studio";
import { UserGroupScreen } from "@/features/system/user-group";
import { UserPassResetScreen } from "@/features/system/user-pass-reset";
import { FormScreen } from "./forms";
import { InquiryScreen } from "./inquiries";
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
  ),
  // System Configuration Screens
  "SC.MENU": MenuCatalogScreen,
  MENU: MenuCatalogScreen,
  "SC.MENU.DESIGN": MenuDesignerScreen,
  "MENU.DESIGN": MenuDesignerScreen,
  MD: MenuDesignerScreen,
  "SC.USER.GROUP": UserGroupScreen,
  "USER.GROUP": UserGroupScreen,
  "SC.MODEL.CONFIG": ModelConfigScreen,
  "MODEL.CONFIG": ModelConfigScreen,
  "SC.COB.REGISTRY": CobRegistryScreen,
  "COB.REGISTRY": CobRegistryScreen,
  COB: CobRegistryScreen,
  "SC.USER.PASS.RESET": UserPassResetScreen,
  "USER.PASS.RESET": UserPassResetScreen,
  "PASS.RESET": UserPassResetScreen,
  "SC.INQUIRY": EnquiryDesignerScreen,
  "INQUIRY.DESIGN": EnquiryDesignerScreen,
  "ENQUIRY.DESIGN": EnquiryDesignerScreen,
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
  if (cleanCmd.startsWith("INQ ") || cleanCmd.startsWith("INQUIRY")) {
    return function InquiryWrapper(props: { command: string; tabId?: string }) {
      return <InquiryScreen command={props.command || cleanCmd} tabId={props.tabId} />;
    };
  }

  // 3. Dynamic GMC Form Screen Fallback
  return function FormWrapper(props: { command: string; tabId?: string }) {
    return <FormScreen command={props.command || cleanCmd} tabId={props.tabId} />;
  };
}
