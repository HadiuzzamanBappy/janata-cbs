"use client";

import * as React from "react";
import type { FormConfigRecord } from "@/lib/data-schemas/form-config-schema";

export function useFcSectionZones(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
) {
  const convertSectionZone = React.useCallback(
    (
      sectionId: string,
      targetType: "card" | "plain" | "tab",
      opts?: { groupId?: string; groupTitle?: string },
    ) => {
      setFormData((prev) => {
        const sections = prev.frmElements?.sections || [];

        return {
          ...prev,
          frmElements: {
            sections: sections.map((sec, idx) => {
              if (sec.id !== sectionId) return sec;
              if (targetType === "tab") {
                const grpId = opts?.groupId || `tabgrp_${idx + 1}`;
                const title = opts?.groupTitle || sec.title || `Tab ${idx + 1}`;
                return {
                  ...sec,
                  containerType: "tab" as const,
                  groupId: grpId,
                  groupTitle: title,
                  title,
                };
              }
              return {
                ...sec,
                containerType: targetType as "card" | "plain",
                groupId: undefined,
                groupTitle: undefined,
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
            sections: sections.map((sec) => {
              if (sec.containerType === "tab" && sec.groupId === sourceGroupId) {
                return {
                  ...sec,
                  groupId: targetGroupId,
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

  return { convertSectionZone, mergeTabGroups };
}
