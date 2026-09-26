import type * as React from "react";
import { DynamicForm } from "@/features/engine";
import { getRegisteredCommand } from "@/lib/core/commands";

/**
 * Resolves a React component for a given command.
 * 1. Checks statically registered custom component from single source of truth core registry.
 * 2. If not registered, falls back to schema-driven DynamicForm engine.
 */
export function resolveControl(
  command: string,
): React.ComponentType<{ command: string; tabId?: string }> {
  const cleanCmd = command.split(",")[0].trim().toUpperCase();

  // 1. Check statically registered component from single source of truth registry
  const registered = getRegisteredCommand(cleanCmd);
  if (registered?.component) {
    return registered.component;
  }

  // 2. Dynamic API Schema Fallback via DynamicForm engine
  return function DynamicFormWrapper(props: { command: string; tabId?: string }) {
    return <DynamicForm command={props.command || cleanCmd} tabId={props.tabId} />;
  };
}
