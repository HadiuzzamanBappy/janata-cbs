"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { registerCommandAdapter } from "@/lib/cbs-command";

/**
 * Binds the headless `notifyUser()` slot of the command adapter bus (used by `src/lib`) to the
 * Base UI toast manager. Mount once, next to `<Toaster />`.
 */
export function AppNotifier() {
  React.useEffect(
    () =>
      registerCommandAdapter({
        notify: (notification) => {
          toast.add(notification);
        },
      }),
    [],
  );
  return null;
}
