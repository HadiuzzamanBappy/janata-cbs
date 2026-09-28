import { getRegisteredCommand } from "@/lib/core/commands";
import { EnquiryScreen } from "./enquiries";
import { FormScreen } from "./forms";
import type { ScreenComponent } from "./types";

/**
 * Universal Screen Resolver.
 * 1. Checks statically registered custom component (from core command registry).
 * 2. If command starts with ENQ or ENQUIRY, resolves to EnquiryScreen.
 * 3. Fallbacks to schema-driven FormScreen engine.
 */
export function resolveScreen(command: string): ScreenComponent {
  const decodedCmd = decodeURIComponent(command || "");
  const cleanCmd = decodedCmd.split(",")[0].trim().toUpperCase();

  // 1. Check statically registered custom component
  const registered = getRegisteredCommand(cleanCmd);
  if (registered?.component) {
    return registered.component;
  }

  // 2. Check if command is a Temenos Enquiry screen
  if (cleanCmd.startsWith("ENQ ") || cleanCmd.startsWith("ENQUIRY")) {
    return function EnquiryWrapper(props: { command: string; tabId?: string }) {
      return <EnquiryScreen command={props.command || cleanCmd} tabId={props.tabId} />;
    };
  }

  // 3. Dynamic GMC Form Screen Fallback
  return function FormWrapper(props: { command: string; tabId?: string }) {
    return <FormScreen command={props.command || cleanCmd} tabId={props.tabId} />;
  };
}
