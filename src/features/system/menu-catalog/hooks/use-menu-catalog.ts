"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import {
  parseMenuCatalogList,
  parseMenuCatalogRecord,
  serializeMenuCatalogToWireJson,
} from "@/lib/data-parsers";
import {
  type MenuCatalogRecord,
  type MenuCatalogScreenMode,
  type MenuValidationErrorItem,
  menuCatalogRecordSchema,
} from "@/lib/data-schemas/menu-catalog-schema";
import { mapMenuZodIssues } from "./menu-catalog-validation";
import { INITIAL_MENU_ITEM, useMenuCatalogPersistence } from "./use-menu-catalog-persistence";

export function useMenuCatalog(initialId?: string, tabId?: string) {
  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    resolvedInitialId,
    resolvedInitialMode,
  } = useMenuCatalogPersistence(initialId, tabId);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [itemsPool, setItemsPool] = React.useState<MenuCatalogRecord[]>([]);
  const [validationErrors, setValidationErrors] = React.useState<MenuValidationErrorItem[]>([]);

  // 1. Fetch available items from MENU table
  const fetchItems = React.useCallback(async () => {
    try {
      const json = await cbs.send<unknown>(cbs.menu.getCatalogList(), { silent: true });
      if (json.status === "SUCCESS" && json.data) {
        const parsed = parseMenuCatalogList(json.data);
        if (parsed.success && parsed.data.length > 0) {
          setItemsPool(parsed.data);
          return;
        }
      }
      setItemsPool([]);
    } catch {
      setItemsPool([]);
    }
  }, []);

  // 2. Fetch specific record by ID
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: MenuCatalogScreenMode = "I") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);

      try {
        const json = await cbs.send<unknown>(cbs.menu.getMenuItem(cleanId), {
          silent: true,
        });
        if (json.status === "SUCCESS" && json.data) {
          const parsed = parseMenuCatalogRecord(json.data);
          if (parsed.success) {
            setFormData(parsed.data);
            setMode(targetMode);
            toast.add({
              title: "Menu Record Loaded",
              description: `Loaded menu catalog record #${cleanId}`,
              type: "success",
            });
            return;
          }
        }
        // Initialize clean empty draft when record does not exist
        setFormData({ ...INITIAL_MENU_ITEM, recordId: cleanId });
        setMode("I");
      } catch {
        setFormData({ ...INITIAL_MENU_ITEM, recordId: cleanId });
        setMode("I");
      } finally {
        setLoading(false);
      }
    },
    [setFormData, setMode, setRecordId],
  );

  // 3. Create new record
  const handleCreateNew = React.useCallback(() => {
    const nextId = String(Date.now().toString().slice(-4));
    setRecordId(nextId);
    setFormData({
      ...INITIAL_MENU_ITEM,
      recordId: nextId,
    });
    setMode("I");
  }, [setFormData, setMode, setRecordId]);

  // 4. Validate
  const handleValidate = React.useCallback((): boolean => {
    const validation = menuCatalogRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errs = mapMenuZodIssues(validation.error.issues);
      setValidationErrors(errs);
      toast.add({
        title: "Validation Issues",
        description: `${errs.length} issue${errs.length > 1 ? "s" : ""} need attention.`,
        type: "warning",
      });
      return false;
    }
    setValidationErrors([]);
    toast.add({
      title: "Validation Passed",
      description: "Menu item syntax and required fields valid.",
      type: "success",
    });
    return true;
  }, [formData]);

  // 5. Submit
  const handleSubmit = React.useCallback(async () => {
    const validation = menuCatalogRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errs = mapMenuZodIssues(validation.error.issues);
      setValidationErrors(errs);
      toast.add({
        title: "Validation Issues Found",
        description: `${errs.length} issue${errs.length > 1 ? "s" : ""} require attention before saving.`,
        type: "warning",
      });
      return;
    }

    setValidationErrors([]);
    setSubmitting(true);
    try {
      const wireData = serializeMenuCatalogToWireJson(validation.data);
      const json = await cbs.send(
        cbs.menu.saveMenuItem(formData.recordId, wireData as unknown as Record<string, unknown>),
        {
          successTitle: "Menu Item Saved",
          successMessage: `Saved menu action #${formData.recordId}`,
        },
      );
      if (json.status === "SUCCESS") {
        setItemsPool((prev) => {
          const exists = prev.some((p) => p.recordId === validation.data.recordId);
          return exists
            ? prev.map((p) => (p.recordId === validation.data.recordId ? validation.data : p))
            : [...prev, validation.data];
        });
        setMode("I");
      }
    } catch {
      // Toast handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [formData, setMode]);

  // 6. Authorize
  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.menu.authorizeMenuItem(recordId), {
        successTitle: "Menu Item Authorized",
        successMessage: `Authorized menu action #${recordId}`,
      });
      if (json.status === "SUCCESS") {
        setMode("S");
      }
    } catch {
      // Toast handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [recordId, setMode]);

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
    setRecordId("");
    setFormData(INITIAL_MENU_ITEM);
    setValidationErrors([]);
  }, [setFormData, setMode, setRecordId]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const hasLoadedInitialRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasLoadedInitialRef.current && resolvedInitialId) {
      hasLoadedInitialRef.current = true;
      fetchRecord(resolvedInitialId, resolvedInitialMode);
    }
  }, [fetchRecord, resolvedInitialId, resolvedInitialMode]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    loading,
    submitting,
    itemsPool,
    fetchItems,
    fetchRecord,
    handleCreateNew,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    validationErrors,
    resetToIdle,
  };
}
