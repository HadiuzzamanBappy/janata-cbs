"use client";

import { cbsCommand } from "@/lib/cbs-command";
import type { SystemCommandItem } from "@/lib/schemas";

interface UseCommandExecutorOptions {
  onClose: () => void;
  // Kept for backward-compatibility with caller prop types
  user?: unknown;
  allCommands?: SystemCommandItem[];
  addTab?: unknown;
  openSettingsTab?: (tabId: string) => void;
  logout?: () => void;
  confirm?: unknown;
}

export function useCommandExecutor({ onClose }: UseCommandExecutorOptions) {
  const handleSelectCommand = (cmd: SystemCommandItem) => {
    onClose();
    cbsCommand.execute(cmd.command || cmd.id, {
      title: cmd.title,
    });
  };

  const handleExecuteRawInput = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    onClose();
    cbsCommand.execute(trimmed);
  };

  return {
    handleSelectCommand,
    handleExecuteRawInput,
  };
}
