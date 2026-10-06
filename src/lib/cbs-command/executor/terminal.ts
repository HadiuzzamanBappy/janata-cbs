/**
 * Terminal Command Executor: The Heart of the Command Gateway
 * Handles Parse -> Validate -> Target Routing -> Tab / Popup Spawning
 */

import { toast } from "@/components/ui/toast";
import { getActiveSessionStore, getActiveWorkbenchStore } from "@/store";
import type { ParsedCommand } from "../contracts/command";
import type { ExecutionOptions } from "../contracts/execution";
import { parseCbsCommand } from "../engine/grammar";
import { validateSecurityPermissions } from "../engine/validator";
import { dispatchSystemAction } from "./action";
import { spawnDetachedPopupWindow } from "./popup";

/**
 * Universal Command Execution Function
 * Can be called from anywhere: Command Palette, Sidebar, Action Buttons, Tables, Keyboard Shortcuts.
 */
export function executeCbsCommand(rawInput: string, options?: ExecutionOptions): ParsedCommand {
  const parsed = parseCbsCommand(rawInput);

  // 1. Syntax Validation
  if (!parsed.isValid) {
    if (!options?.silent) {
      toast.add({
        title: "Invalid Command",
        description: parsed.error || `Command "${rawInput}" does not follow CBS syntax rules.`,
        type: "error",
      });
    }
    return parsed;
  }

  // 2. Pre-Execution RBAC Security Guard
  const sessionStore = getActiveSessionStore();
  const currentUser = sessionStore?.getState().user;
  const security = validateSecurityPermissions(parsed, currentUser);

  if (!security.allowed) {
    if (!options?.silent) {
      toast.add({
        title: "Access Denied",
        description: security.reason || "You do not have permissions to execute this command.",
        type: "error",
      });
    }
    return { ...parsed, isValid: false, error: security.reason };
  }

  // 3. System Actions / Settings Modal Dispatch
  if (parsed.type === "SETTINGS" || parsed.type === "ACTION") {
    const handled = dispatchSystemAction(parsed);
    if (handled) return parsed;
  }

  // 4. Detached Multi-Monitor Popup Target
  if (options?.target === "popup") {
    spawnDetachedPopupWindow(parsed, options);
    return parsed;
  }

  // 5. Workspace Tab Target (Always opens duplicate tab as requested)
  const workbenchStore = getActiveWorkbenchStore();
  const screenTitle = options?.title || parsed.title;
  const targetMode = options?.screenMode || parsed.screenMode;
  const targetRecordId = options?.searchRecordId || parsed.recordId;

  if (workbenchStore) {
    const screenId = parsed.type === "INQUIRY" ? `INQ ${parsed.application}` : parsed.application;

    workbenchStore.getState().addTab({
      screenId,
      title: screenTitle,
      componentName: parsed.type === "INQUIRY" ? "INQUIRY_SCREEN" : "DYNAMIC_FORM",
      screenMode: targetMode,
      searchRecordId: targetRecordId,
      enquiryState:
        parsed.type === "INQUIRY"
          ? {
              step: options?.step,
              criteria: options?.criteria,
              currentPage: options?.currentPage,
              pageSize: options?.pageSize,
            }
          : undefined,
      formData: options?.formData,
    });
  } else if (typeof window !== "undefined") {
    const screenId = parsed.type === "INQUIRY" ? `INQ ${parsed.application}` : parsed.application;
    // Fallback event in case store is hydrating
    window.dispatchEvent(
      new CustomEvent("cbs:open-tab", {
        detail: {
          command: screenId,
          title: screenTitle,
          screenMode: targetMode,
          searchRecordId: targetRecordId,
          formData: options?.formData,
        },
      }),
    );
  }

  return parsed;
}
