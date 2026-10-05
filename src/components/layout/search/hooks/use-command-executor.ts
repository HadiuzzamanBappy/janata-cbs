"use client";

import { toast } from "@/components/ui/toast";
import { launchScreen } from "@/features/screens";
import {
  parseCbsCommand,
  validateCommandForUser,
  type SystemCommandItem,
} from "@/lib/core";
import type { CurrentUser } from "@/lib/schemas";

interface UseCommandExecutorOptions {
  user: CurrentUser | null;
  allCommands: SystemCommandItem[];
  addTab: (tab: any) => void;
  openSettingsTab?: (tabId: string) => void;
  logout: () => void;
  confirm: (alert: any) => void;
  onClose: () => void;
}

export function useCommandExecutor({
  user,
  allCommands,
  addTab,
  openSettingsTab,
  logout,
  confirm,
  onClose,
}: UseCommandExecutorOptions) {
  const handleSelectCommand = (cmd: SystemCommandItem) => {
    onClose();

    launchScreen({
      id: cmd.command ?? cmd.id,
      title: cmd.title,
      componentName: cmd.componentName,
      addTab,
      openSettingsTab,
      clearSession: logout,
      confirmAlert: confirm,
    });
  };

  const handleExecuteRawInput = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const parsed = parseCbsCommand(trimmed);

    // 1. Validate syntax
    if (!parsed.isValid) {
      toast.add({
        title: "Invalid Command",
        description: parsed.error || `Command "${trimmed}" does not follow CBS syntax rules.`,
        type: "error",
      });
      return;
    }

    // 2. Validate user permissions & RIDASH function rights
    const validation = validateCommandForUser(parsed, user);
    if (!validation.allowed) {
      toast.add({
        title: "Permission Denied",
        description: validation.reason || "You do not have permission to execute this command.",
        type: "error",
      });
      return;
    }

    // 3. Execution succeeded
    onClose();

    if (parsed.type === "SETTINGS") {
      openSettingsTab?.(parsed.settingsTabId || "profile");
      return;
    }

    if (parsed.type === "ACTION") {
      if (parsed.actionId === "logout") {
        confirm({
          title: "Sign Out Confirmation",
          message: "Are you sure you want to terminate your current active session?",
          variant: "destructive",
          confirmText: "Sign Out",
          onConfirm: () => logout(),
        });
      } else if (parsed.actionId === "toggle_theme") {
        document.documentElement.classList.toggle("dark");
      }
      return;
    }

    // Screen Execution (Form / Enquiry)
    const matchingCmd = allCommands.find(
      (c) =>
        c.command.toUpperCase() === parsed.application.toUpperCase() ||
        c.aliases?.some((a) => a.toUpperCase() === parsed.application.toUpperCase()),
    );

    const targetId = matchingCmd?.componentName || matchingCmd?.command || parsed.application;
    const targetTitle = matchingCmd?.title || parsed.title;

    launchScreen({
      id: targetId,
      title: targetTitle,
      screenMode: parsed.screenMode,
      searchRecordId: parsed.recordId,
      componentName: parsed.type === "INQUIRY" ? "DYNAMIC_ENQUIRY" : "DYNAMIC_FORM",
      addTab,
      openSettingsTab,
      clearSession: logout,
      confirmAlert: confirm,
    });
  };

  return {
    handleSelectCommand,
    handleExecuteRawInput,
  };
}
