"use client";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { useAlertStore } from "@/components/providers/alert-provider";

export function AppAlert() {
  const { isConfirmOpen, confirmOptions, closeConfirm } = useAlertStore();

  return (
    <ConfirmDialog
      open={isConfirmOpen}
      onOpenChange={(open) => {
        if (!open) closeConfirm();
      }}
      title={confirmOptions?.title || ""}
      description={confirmOptions?.message || ""}
      confirmText={confirmOptions?.confirmText}
      cancelText={confirmOptions?.cancelText}
      variant={confirmOptions?.variant}
      onConfirm={async () => {
        if (confirmOptions?.onConfirm) {
          await confirmOptions.onConfirm();
        }
      }}
    />
  );
}
