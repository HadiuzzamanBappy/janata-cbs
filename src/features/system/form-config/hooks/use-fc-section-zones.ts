"use client";

import * as React from "react";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

export function useFcSectionZones(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
) {
  const convertSectionZone = React.useCallback(
    (
      sectionId: string,
      targetZone: "standard" | "tab",
      opts?: { tabGroupId?: string; tabTitle?: string },
    ) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];

        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
            sections: sections.map((sec, idx) => {
              if (sec.id !== sectionId) return sec;
              if (targetZone === "tab") {
                const grpId = opts?.tabGroupId || `tabgrp_${idx + 1}`;
                const title = opts?.tabTitle || sec.title || `Tab ${idx + 1}`;
                return {
                  ...sec,
                  zone: "tab" as const,
                  tabGroupId: grpId,
                  tabTitle: title,
                  title,
                  layoutStyle: "card" as const,
                };
              }
              return {
                ...sec,
                zone: "standard" as const,
                tabGroupId: undefined,
                tabTitle: undefined,
                layoutStyle: "card" as const,
              };
            }),
          },
        };
      });
    },
    [setFormData],
  );

  const mergeTabGroups = React.useCallback(
    (sourceGroupId: string, targetGroupId: string) => {
      if (!sourceGroupId || !targetGroupId || sourceGroupId === targetGroupId) return;
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];
        return {
          ...prev,
          frmElements: {
            steps: prev.frmElements?.steps || [],
            sections: sections.map((sec) => {
              if (sec.zone === "tab" && sec.tabGroupId === sourceGroupId) {
                return {
                  ...sec,
                  tabGroupId: targetGroupId,
                };
              }
              return sec;
            }),
          },
        };
      });
    },
    [setFormData],
  );

  return {
    convertSectionZone,
    mergeTabGroups,
  };
}
