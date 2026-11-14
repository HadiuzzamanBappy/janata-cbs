/**
 * @fileoverview Container zone conversion and tab grouping hook for Form Designer.
 * Transforms sections between Card boxes and Tab Group panes.
 *
 * @module features/system/form-config/hooks/use-fc-section-zones
 */

"use client";

import * as React from "react";
import { generateClientToken } from "@/lib/core-utils";
import type { FormConfigRecord } from "@/lib/data-schemas";

export function useFcSectionZones(
  setFormData: React.Dispatch<React.SetStateAction<FormConfigRecord>>,
) {
  const convertSectionZone = React.useCallback(
    (
      sectionId: string,
      targetType: "card" | "tab",
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
                const grpId = opts?.groupId || generateClientToken("tabgrp");
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
                containerType: "card" as const,
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
