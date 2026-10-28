"use client";

import * as React from "react";
import type {
  INQCmd,
  InquiryConfigRecord,
} from "@/lib/data-schemas/inquiry-config-schema";

export function useIcActionOps(
  setFormData: React.Dispatch<React.SetStateAction<InquiryConfigRecord>>,
) {
  const addAction = React.useCallback(
    (action?: Partial<INQCmd>) => {
      setFormData((prev) => {
        const currentCmds = prev.INQCmds || [];
        const newCmd: INQCmd = {
          cmdButton: action?.cmdButton || "View",
          cmdFor: action?.cmdFor || `${prev.INQInfo?.controllerName || "RECORD"} S recordId`,
        };
        return {
          ...prev,
          INQCmds: [...currentCmds, newCmd],
        };
      });
    },
    [setFormData],
  );

  const updateAction = React.useCallback(
    (index: number, patch: Partial<INQCmd>) => {
      setFormData((prev) => {
        const nextCmds = [...(prev.INQCmds || [])];
        if (nextCmds[index]) {
          nextCmds[index] = { ...nextCmds[index], ...patch };
        }
        return {
          ...prev,
          INQCmds: nextCmds,
        };
      });
    },
    [setFormData],
  );

  const removeAction = React.useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        INQCmds: (prev.INQCmds || []).filter((_, i) => i !== index),
      }));
    },
    [setFormData],
  );

  const reorderActions = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      setFormData((prev) => {
        const items = [...(prev.INQCmds || [])];
        if (
          fromIndex < 0 ||
          fromIndex >= items.length ||
          toIndex < 0 ||
          toIndex >= items.length
        ) {
          return prev;
        }
        const [moved] = items.splice(fromIndex, 1);
        if (moved) {
          items.splice(toIndex, 0, moved);
        }
        return {
          ...prev,
          INQCmds: items,
        };
      });
    },
    [setFormData],
  );

  return {
    addAction,
    updateAction,
    removeAction,
    reorderActions,
  };
}

