import type * as React from "react";
import { DynamicForm } from "@/features/engine";
import { EnquiryScreen } from "@/features/enquiries";
import { getRegisteredCommand } from "@/lib/core/commands";

/**
 * Resolves a React component for a given command.
 * 1. Checks statically registered custom component from single source of truth core registry.
 * 2. If command starts with ENQ or ENQUIRY, resolves to EnquiryScreen.
 * 3. Fallback to schema-driven DynamicForm engine.
 */
export function resolveControl(
  command: string,
): React.ComponentType<{ command: string; tabId?: string }> {
  const decodedCmd = decodeURIComponent(command || "");
  const cleanCmd = decodedCmd.split(",")[0].trim().toUpperCase();

  // 1. Check statically registered component from single source of truth registry
  const registered = getRegisteredCommand(cleanCmd);
  if (registered?.component) {
    return registered.component;
  }

  // 2. Check if command is a Temenos Enquiry screen (e.g. ENQ USER.LIST, ENQ STMT.ENT.BOOK)
  if (cleanCmd.startsWith("ENQ ") || cleanCmd.startsWith("ENQUIRY")) {
    return function EnquiryWrapper(props: { command: string; tabId?: string }) {
      return <EnquiryScreen command={props.command || cleanCmd} tabId={props.tabId} />;
    };
  }

  // 3. Dynamic API Schema Fallback via DynamicForm engine
  return function DynamicFormWrapper(props: { command: string; tabId?: string }) {
    return <DynamicForm command={props.command || cleanCmd} tabId={props.tabId} />;
  };
}
