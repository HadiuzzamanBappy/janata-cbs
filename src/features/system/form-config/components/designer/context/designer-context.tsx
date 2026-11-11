"use client";

import * as React from "react";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import { createNewFieldFromTemplate, dispatchPaletteDrop } from "../canvas/palette-drop-dispatcher";
import type { DesignerContextValue, DesignerProviderProps } from "./designer-context-types";

export type { DesignerContextValue, DesignerProviderProps };

const DesignerContext = React.createContext<DesignerContextValue | null>(null);

export function DesignerProvider({
  children,
  formTitle,
  formDescription,
  authNumber,
  rootColumns,
  rootDensity,
  onUpdateFormConfig,
  isCompact = false,
  targetModel,
  modelProperties,
  sections,
  selectedSectionId,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onAddFieldToSection,
  onUpdateField,
  onRemoveField,
  onReorderFields,
  onMoveFieldAcrossSections,
  onReorderSections,
  onConvertSectionZone,
  onMergeTabGroup,
  disabled,
}: DesignerProviderProps) {
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false);

  const activeSection = React.useMemo(() => {
    if (selectedSectionId) {
      return sections.find((s) => s.id === selectedSectionId) || null;
    }
    if (selectedFieldId) {
      return (
        sections.find((s) =>
          (s.fields || []).some((f) => f.SN === selectedFieldId || f.NAME === selectedFieldId),
        ) || null
      );
    }
    return null;
  }, [sections, selectedSectionId, selectedFieldId]);

  const activeField = React.useMemo(() => {
    return (
      sections
        .flatMap((s) => s.fields || [])
        .find((f) => f.SN === selectedFieldId || f.NAME === selectedFieldId) || null
    );
  }, [sections, selectedFieldId]);

  const usedFieldNames = React.useMemo(() => {
    return new Set(sections.flatMap((s) => (s.fields || []).map((f) => f.NAME)));
  }, [sections]);

  const togglePalette = React.useCallback(() => {
    setIsPaletteOpen((prev) => !prev);
    setIsInspectorOpen(false);
  }, []);

  const toggleInspector = React.useCallback(() => {
    setIsInspectorOpen((prev) => !prev);
    setIsPaletteOpen(false);
  }, []);

  const closeDrawers = React.useCallback(() => {
    setIsPaletteOpen(false);
    setIsInspectorOpen(false);
  }, []);

  const handlePaletteAddField = React.useCallback(
    (template: Partial<FormElement>) => {
      if (isCompact) {
        setIsPaletteOpen(false);
      }
      if (selectedSectionId) {
        const selSec = sections.find((s) => s.id === selectedSectionId);
        // Only add directly if selected section is an explicit container (Card with title or Tab)
        const isExplicitContainer =
          Boolean(selSec?.title?.trim()) || selSec?.containerType === "tab";
        if (isExplicitContainer) {
          onAddFieldToSection(selectedSectionId, template);
          return;
        }
      }
      const newField = createNewFieldFromTemplate(sections, template);
      onAddSection("card", [newField], "");
    },
    [isCompact, selectedSectionId, sections, onAddFieldToSection, onAddSection],
  );

  const handleDropPaletteItem = React.useCallback(
    (payload: unknown, targetSectionId?: string, insertIndex?: number) => {
      dispatchPaletteDrop({
        payload,
        sections,
        targetSectionId,
        insertIndex,
        onAddFieldToSection,
        onAddSection,
      });
    },
    [sections, onAddFieldToSection, onAddSection],
  );

  const handleHighlightField = React.useCallback(
    (fieldName: string) => {
      for (const sec of sections) {
        const match = (sec.fields || []).find((f) => f.NAME === fieldName || f.SN === fieldName);
        if (match) {
          onSelectSection(sec.id);
          onSelectField(match.SN || match.NAME);
          if (isCompact) {
            setIsPaletteOpen(false);
            setIsInspectorOpen(true);
          }
          break;
        }
      }
    },
    [sections, onSelectSection, onSelectField, isCompact],
  );

  const handleCanvasSelectField = React.useCallback(
    (sectionId: string | null, fieldId: string | null) => {
      if (sectionId) onSelectSection(sectionId);
      onSelectField(fieldId);
      if (isCompact && (fieldId || sectionId)) {
        setIsInspectorOpen(true);
        setIsPaletteOpen(false);
      }
    },
    [onSelectSection, onSelectField, isCompact],
  );

  const handleCanvasBackgroundClick = React.useCallback(() => {
    onSelectSection(null);
    onSelectField(null);
  }, [onSelectSection, onSelectField]);

  const hasSelection = Boolean(selectedFieldId || selectedSectionId);

  const value = React.useMemo<DesignerContextValue>(
    () => ({
      formTitle,
      formDescription,
      authNumber,
      rootColumns,
      rootDensity,
      onUpdateFormConfig,
      targetModel,
      modelProperties,
      sections,
      selectedSectionId,
      selectedFieldId,
      activeSection,
      activeField,
      usedFieldNames,
      disabled,
      isCompact,
      isPaletteOpen,
      isInspectorOpen,
      hasSelection,
      setIsPaletteOpen,
      setIsInspectorOpen,
      togglePalette,
      toggleInspector,
      closeDrawers,
      onSelectSection,
      onSelectField,
      handleHighlightField,
      handleCanvasSelectField,
      handleCanvasBackgroundClick,
      onAddSection,
      onUpdateSection,
      onRemoveSection,
      onAddFieldToSection,
      onUpdateField,
      onRemoveField,
      onReorderFields,
      onMoveFieldAcrossSections,
      onReorderSections,
      onConvertSectionZone,
      onMergeTabGroup,
      handlePaletteAddField,
      handleDropPaletteItem,
    }),
    [
      targetModel,
      modelProperties,
      sections,
      selectedSectionId,
      selectedFieldId,
      activeSection,
      activeField,
      usedFieldNames,
      disabled,
      isCompact,
      isPaletteOpen,
      isInspectorOpen,
      hasSelection,
      togglePalette,
      toggleInspector,
      closeDrawers,
      onSelectSection,
      onSelectField,
      handleHighlightField,
      handleCanvasSelectField,
      handleCanvasBackgroundClick,
      onAddSection,
      onUpdateSection,
      onRemoveSection,
      onAddFieldToSection,
      onUpdateField,
      onRemoveField,
      onReorderFields,
      onMoveFieldAcrossSections,
      onReorderSections,
      onConvertSectionZone,
      onMergeTabGroup,
      handlePaletteAddField,
      handleDropPaletteItem,
      formTitle,
      formDescription,
      authNumber,
      rootColumns,
      rootDensity,
      onUpdateFormConfig,
    ],
  );

  return <DesignerContext.Provider value={value}>{children}</DesignerContext.Provider>;
}

export function useOptionalDesignerContext(): DesignerContextValue | null {
  return React.useContext(DesignerContext);
}

export function useDesignerContext(): DesignerContextValue {
  const context = useOptionalDesignerContext();
  if (!context) {
    throw new Error("useDesignerContext must be used within a DesignerProvider");
  }
  return context;
}
