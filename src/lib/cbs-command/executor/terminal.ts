import { toast } from "@/components/ui/toast";
import { findCommandHandler, parseCbsCommand } from "../engine/grammar";
import { validateSecurityPermissions } from "../engine/validator";
import { resolveCommandTitle } from "../registry/alias";
import { CBS_SCREEN_COMPONENTS, type ExecutionOptions, type ParsedCommand } from "../types";
import { getCommandAdapter, resolveScreenId } from "./adapter";
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

  // 3. Delegate to protocol handler's custom execution hook if implemented
  const handler = findCommandHandler(parsed.raw);
  if (handler.execute?.(parsed, options)) {
    return parsed;
  }

  // 4. Detached Multi-Monitor Popup Target
  if (options?.target === "popup") {
    spawnDetachedPopupWindow(parsed, options);
    return parsed;
  }

  // 5. Workspace Tab Target
  const catalogTitle = resolveCommandTitle(parsed.application);
  const screenTitle = options?.title || catalogTitle || parsed.title;
  const targetMode = options?.screenMode || parsed.screenMode;
  const targetRecordId = options?.recordId || parsed.recordId;

  if (adapter.openTab) {
    const screenId = resolveScreenId(parsed);

    adapter.openTab({
      screenId,
      title: screenTitle,
      componentName:
        parsed.type === "INQUIRY"
          ? CBS_SCREEN_COMPONENTS.INQUIRY_SCREEN
          : CBS_SCREEN_COMPONENTS.DYNAMIC_FORM,
      screenMode: targetMode,
      searchRecordId: targetRecordId,
      enquiryState: parsed.type === "INQUIRY" ? options?.inquiryState : undefined,
      formData: options?.formData,
    });
  }

  return parsed;
}
