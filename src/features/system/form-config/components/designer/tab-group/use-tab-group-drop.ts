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
    targetZone: "standard" | "tab",
    opts?: { tabGroupId?: string; tabTitle?: string },
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
          if (parsed.tabGroupId === groupId) return;
          onConvertSectionZone?.(parsed.sectionId, "tab", {
            tabGroupId: groupId,
            tabTitle:
              typeof parsed.tabTitle === "string"
                ? parsed.tabTitle
                : typeof parsed.title === "string"
                  ? parsed.title
                  : undefined,
          });
          return;
        }

        if (parsed.type === "canvas-section" && typeof parsed.sectionId === "string") {
          onConvertSectionZone?.(parsed.sectionId, "tab", {
            tabGroupId: groupId,
            tabTitle:
              typeof parsed.tabTitle === "string"
                ? parsed.tabTitle
                : typeof parsed.title === "string"
                  ? parsed.title
                  : undefined,
          });
          return;
        }

        if (isTabGroupPayload(parsed) && parsed.tabGroupId !== groupId) {
          if (parsed.tabGroupId) {
            onMergeTabGroup?.(String(parsed.tabGroupId), groupId);
            return;
          }
        }

        if (onDropPaletteItem) {
          const n = tabSections.length + 1;
          const title = String(parsed.title || parsed.tabTitle || `Tab ${n}`);
          onDropPaletteItem(
            { ...parsed, zone: "tab", tabGroupId: groupId, title, tabTitle: title },
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

        if (isTabGroupPayload(parsed) && parsed.tabGroupId !== groupId) {
          if (parsed.tabGroupId) {
            onMergeTabGroup?.(String(parsed.tabGroupId), groupId);
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
              containerType: parsed.containerType || "standard",
              zone: "tab",
              tabGroupId: groupId,
              title,
              tabTitle: title,
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
