"use client";

import * as React from "react";
import type { FormSection } from "@/lib/data-schemas";
import { useDesignerContext } from "../../context/designer-context";
import { readDragPayload } from "../drag-payload";

export interface TabGroupDropParams {
  groupId: string;
  tabSections: FormSection[];
  activeSection?: FormSection;
}

/**
 * Native drops on a tab group. Header: a tab from another group joins this one, a container
 * preset becomes a new tab. Body: a container preset becomes a new tab, a field joins the active
 * tab.
 */
export function useTabGroupDrop({ groupId, tabSections, activeSection }: TabGroupDropParams) {
  const { disabled, onConvertSectionZone, handleDropPaletteItem } = useDesignerContext();
  const [dropZone, setDropZone] = React.useState<"header" | "body" | null>(null);
  const nextTabTitle = `Tab ${tabSections.length + 1}`;

  const handleHeaderDragOver = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
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
      const payload = disabled ? null : readDragPayload(e);
      if (!payload) return;

      if (payload.type === "canvas-tab") {
        if (payload.groupId === groupId) return;
        onConvertSectionZone?.(payload.sectionId, "tab", {
          groupId,
          groupTitle: payload.groupTitle ?? payload.title,
        });
        return;
      }
      if (payload.type === "palette-container") {
        handleDropPaletteItem(payload, {
          kind: "new-tab",
          groupId,
          title: payload.title || payload.groupTitle || nextTabTitle,
        });
      }
    },
    [disabled, groupId, onConvertSectionZone, handleDropPaletteItem, nextTabTitle],
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
      const payload = disabled ? null : readDragPayload(e);
      if (!payload || payload.type === "canvas-tab") return;

      if (payload.type === "palette-container") {
        handleDropPaletteItem(payload, {
          kind: "new-tab",
          groupId,
          title: payload.title || nextTabTitle,
        });
        return;
      }
      handleDropPaletteItem(
        payload,
        activeSection ? { kind: "section", sectionId: activeSection.id } : { kind: "canvas" },
      );
    },
    [disabled, groupId, handleDropPaletteItem, nextTabTitle, activeSection],
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
