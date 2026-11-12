"use client";

import * as React from "react";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import { type DragPayload, isContainerPayload, isTabGroupPayload } from "./tab-group-types";

export interface TabGroupDropParams {
  groupId: string;
  tabSections: FormSection[];
  activeSection?: FormSection;
  disabled?: boolean;
  onConvertSectionZone?: (
    sectionId: string,
    targetType: "card" | "tab",
    opts?: { groupId?: string; groupTitle?: string },
  ) => void;
  onMergeTabGroup?: (sourceGroupId: string, targetGroupId: string) => void;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string) => void;
}

export function useTabGroupDrop({
  groupId,
  tabSections,
  activeSection,
  disabled,
  onConvertSectionZone,
  onMergeTabGroup,
  onDropPaletteItem,
}: TabGroupDropParams) {
  const [dropZone, setDropZone] = React.useState<"header" | "body" | null>(null);

  const handleHeaderDragOver = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setDropZone("header");
    },
    [disabled],
  );

  const handleHeaderDragLeave = React.useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropZone((z) => (z === "header" ? null : z));
    }
  }, []);

  const handleHeaderDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDropZone(null);
      if (disabled) return;
      try {
        const dataStr = e.dataTransfer.getData("application/json");
        if (!dataStr) return;
        const parsed = JSON.parse(dataStr) as DragPayload;

        if (parsed.type === "canvas-tab" && typeof parsed.sectionId === "string") {
          const itemGroupId = parsed.groupId || parsed.tabGroupId;
          if (itemGroupId === groupId) return;
          onConvertSectionZone?.(parsed.sectionId, "tab", {
            groupId: groupId,
            groupTitle:
              typeof parsed.groupTitle === "string"
                ? parsed.groupTitle
                : typeof parsed.title === "string"
                  ? parsed.title
                  : undefined,
          });
          return;
        }

        if (parsed.type === "canvas-section" && typeof parsed.sectionId === "string") {
          onConvertSectionZone?.(parsed.sectionId, "tab", {
            groupId: groupId,
            groupTitle:
              typeof parsed.groupTitle === "string"
                ? parsed.groupTitle
                : typeof parsed.title === "string"
                  ? parsed.title
                  : undefined,
          });
          return;
        }

        const itemGroupId = parsed.groupId || parsed.tabGroupId;
        if (isTabGroupPayload(parsed) && itemGroupId !== groupId) {
          if (itemGroupId) {
            onMergeTabGroup?.(String(itemGroupId), groupId);
            return;
          }
        }

        if (onDropPaletteItem) {
          const n = tabSections.length + 1;
          const title = String(parsed.title || parsed.groupTitle || `Tab ${n}`);
          onDropPaletteItem(
            { ...parsed, containerType: "tab", groupId, title, groupTitle: title },
            "new-tab-in-group",
          );
        }
      } catch {
        /* ignore */
      }
    },
    [
      disabled,
      groupId,
      onConvertSectionZone,
      onMergeTabGroup,
      onDropPaletteItem,
      tabSections.length,
    ],
  );

  const handleBodyDragOver = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setDropZone("body");
    },
    [disabled],
  );

  const handleBodyDragLeave = React.useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropZone((z) => (z === "body" ? null : z));
    }
  }, []);

  const handleBodyDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDropZone(null);
      if (disabled || !onDropPaletteItem) return;
      try {
        const dataStr = e.dataTransfer.getData("application/json");
        if (!dataStr) return;
        const parsed = JSON.parse(dataStr) as DragPayload;

        const itemGroupId = parsed.groupId || parsed.tabGroupId;
        if (isTabGroupPayload(parsed) && itemGroupId !== groupId) {
          if (itemGroupId) {
            onMergeTabGroup?.(String(itemGroupId), groupId);
            return;
          }
        }

        if (isContainerPayload(parsed)) {
          const n = tabSections.length + 1;
          const title = String(parsed.title || `Tab ${n}`);
          onDropPaletteItem(
            {
              ...parsed,
              type: "palette-container",
              containerType: "tab",
              groupId: groupId,
              title,
              groupTitle: title,
            },
            "new-tab-in-group",
          );
          return;
        }

        onDropPaletteItem(parsed, activeSection?.id);
      } catch {
        /* ignore */
      }
    },
    [disabled, groupId, onMergeTabGroup, onDropPaletteItem, tabSections.length, activeSection?.id],
  );

  return {
    dropZone,
    setDropZone,
    handleHeaderDragOver,
    handleHeaderDragLeave,
    handleHeaderDrop,
    handleBodyDragOver,
    handleBodyDragLeave,
    handleBodyDrop,
  };
}
