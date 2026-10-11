/**
 * Terminal Command Executor: The Heart of the Command Gateway
 * Handles Parse -> Validate -> Target Routing -> Tab / Popup Spawning
 */

import { toast } from "@/components/ui/toast";
import { parseCbsCommand } from "../engine/grammar";
import { validateSecurityPermissions } from "../engine/validator";
import { resolveCommandTitle } from "../registry/alias";
import type { ParsedCommand } from "../types/command";
import type { ExecutionOptions } from "../types/execution";
import { dispatchSystemAction } from "./action";
import { getCommandAdapter } from "./adapter";
import { spawnDetachedPopupWindow } from "./popup";

/**
 * Universal Command Execution Function
 * Can be called from anywhere: Command Palette, Sidebar, Action Buttons, Tables, Keyboard Shortcuts.
 */
export function executeCbsCommand(rawInput: string, options?: ExecutionOptions): ParsedCommand {
  const parsed = parseCbsCommand(rawInput);

  // 1. Syntax Validation
  if (!parsed.isValid) {
    const errorMsg = parsed.error || `Command "${rawInput}" does not follow CBS syntax rules.`;
    options?.onError?.(errorMsg);
    if (!options?.silent) {
      toast.add({
        title: "Invalid Command",
        description: errorMsg,
        type: "error",
      });
    }
    return parsed;
  }

  // 2. Pre-Execution RBAC Security Guard
  const adapter = getCommandAdapter();
  const currentUser = options?.user ?? adapter.getCurrentUser?.();
  const security = validateSecurityPermissions(parsed, currentUser);

  if (!security.allowed) {
    const errorMsg = security.reason || "You do not have permissions to execute this command.";
    options?.onError?.(errorMsg);
    if (!options?.silent) {
      toast.add({
        title: "Access Denied",
        description: errorMsg,
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

  // 5. Workspace Tab Target
  const catalogTitle =
    resolveCommandTitle(parsed.application) || resolveCommandTitle(rawInput.trim().split(/\s+/)[0]);
  const screenTitle = options?.title || catalogTitle || parsed.title;
  const targetMode = options?.screenMode || parsed.screenMode;
  const targetRecordId = options?.searchRecordId || parsed.recordId;

  if (adapter.openTab) {
    const screenId = parsed.type === "INQUIRY" ? `INQ ${parsed.application}` : parsed.application;

    adapter.openTab({
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
    // Fallback: Dispatch a decoupled custom event if no direct adapter function is mounted
    window.dispatchEvent(
      new CustomEvent("cbs:open-command-tab", {
        detail: {
          command: parsed,
          options,
        },
      }),
    );
  }

  options?.onSuccess?.(parsed);
  return parsed;
}
