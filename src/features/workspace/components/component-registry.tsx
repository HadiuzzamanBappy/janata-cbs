import type * as React from "react";
import { DynamicForm } from "@/features/engine/dynamic-form";
import { SecurityTab } from "@/features/settings";

/**
 * Registry mapping bespoke screen command keys to React components.
 * If a command key is NOT in this map, it falls back to the DynamicForm engine.
 */
export const BESPOKE_COMPONENTS: Record<
  string,
  React.ComponentType<{ command: string }>
> = {
  // Auth & Admin Screens
  "USER.CHANGE.PASS": SecurityTab,
};

export function resolveControl(
  command: string,
): React.ComponentType<{ command: string }> {
  const cleanCmd = command.split(",")[0].trim().toUpperCase();
  const bespoke = BESPOKE_COMPONENTS[cleanCmd];
  if (bespoke) return bespoke;

  // Fallback to schema-driven DynamicForm engine
  return function DynamicFormWrapper(props: { command: string }) {
    return <DynamicForm command={props.command || cleanCmd} />;
  };
}
