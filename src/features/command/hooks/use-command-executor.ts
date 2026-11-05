"use client";

import { cbsCommand } from "@/lib/cbs-command";
import type { ControlCommand } from "@/lib/data-schemas";

interface UseCommandExecutorOptions {
  onClose: () => void;
}

export function useCommandExecutor({ onClose }: UseCommandExecutorOptions) {
  const handleSelectCommand = (cmd: ControlCommand) => {
    onClose();
    cbsCommand.execute(cmd.command, {
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
