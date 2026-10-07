"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import {
  parseMenuCatalogList,
  parseMenuCatalogRecord,
  serializeMenuCatalogToWireJson,
} from "@/lib/parsers";
import {
  type MenuCatalogRecord,
  type MenuCatalogScreenMode,
  menuCatalogRecordSchema,
  type MenuValidationErrorItem,
} from "@/lib/schemas/menu-catalog-schema";
import { mapMenuZodIssues } from "./menu-catalog-validation";
import {
  INITIAL_MENU_ITEM,
  useMenuCatalogPersistence,
} from "./use-menu-catalog-persistence";

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
      const json = await cbs.send<unknown>(
        cbs.menu.getCatalogList(),
        { silent: true },
      );
      if (json.status === "SUCCESS" && json.data) {
        const parsed = parseMenuCatalogList(json.data);
        if (parsed.success && parsed.data.length > 0) {
          setItemsPool(parsed.data);
          return;
        }
      }
      // High quality demo fallback records matching MODEL.CONFIG MENU properties
      setItemsPool([
        {
          recordId: "1",
          label: "Open Customer Account",
          command: "ACCOUNT I",
          menuType: "SCREEN",
          description: "Customer savings and current account opening",
          isActive: true,
        },
        {
          recordId: "2",
          label: "Account Overview",
          command: "ACCOUNT S",
          menuType: "SCREEN",
          description: "Account summary and ledger inquiry",
          isActive: true,
        },
        {
          recordId: "3",
          label: "Customer Onboarding",
          command: "CUSTOMER I",
          menuType: "SCREEN",
          description: "New individual & corporate customer master record",
          isActive: true,
        },
        {
          recordId: "4",
          label: "Funds Transfer",
          command: "FUNDS.TRANSFER I",
          menuType: "SCREEN",
          description: "Interbank & intrabank clearing transfers",
          isActive: true,
        },
        {
          recordId: "5",
          label: "Balance Inquiry",
          command: "INQ ACCT.BAL",
          menuType: "INQUIRY",
          description: "Realtime core ledger balance inquiry",
          isActive: true,
        },
        {
          recordId: "6",
          label: "Model Configuration",
          command: "MODEL.CONFIG",
          menuType: "SCREEN",
          description: "CBS Data Dictionary and Schema Designer",
          isActive: true,
        },
      ]);
    } catch {
      // Demo fallback records
      setItemsPool([
        {
          recordId: "1",
          label: "Open Customer Account",
          command: "ACCOUNT I",
          menuType: "SCREEN",
          description: "Customer account opening",
          isActive: true,
        },
        {
          recordId: "2",
          label: "Account Overview",
          command: "ACCOUNT S",
          menuType: "SCREEN",
          description: "Account inquiry overview",
          isActive: true,
        },
        {
          recordId: "3",
          label: "Customer Onboarding",
          command: "CUSTOMER I",
          menuType: "SCREEN",
          description: "New customer master record",
          isActive: true,
        },
        {
          recordId: "4",
          label: "Funds Transfer",
          command: "FUNDS.TRANSFER I",
          menuType: "SCREEN",
          description: "Interbank & intrabank transfers",
          isActive: true,
        },
        {
          recordId: "5",
          label: "Balance Inquiry",
          command: "INQ ACCT.BAL",
          menuType: "INQUIRY",
          description: "Realtime ledger balances",
          isActive: true,
        },
        {
          recordId: "6",
          label: "Model Configuration",
          command: "MODEL.CONFIG",
          menuType: "SCREEN",
          description: "CBS Data Dictionary and Schema Designer",
          isActive: true,
        },
      ]);
    }
  }, []);

  // 2. Fetch specific record by ID
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: MenuCatalogScreenMode = "EDIT") => {
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
        // Check local items pool
        const local = itemsPool.find((item) => item.recordId.toUpperCase() === cleanId);
        if (local) {
          setFormData(local);
          setMode(targetMode);
        } else {
          setFormData({ ...INITIAL_MENU_ITEM, recordId: cleanId });
          setMode("CREATE");
        }
      } catch {
        const local = itemsPool.find((item) => item.recordId.toUpperCase() === cleanId);
        if (local) {
          setFormData(local);
          setMode(targetMode);
        } else {
          setFormData({ ...INITIAL_MENU_ITEM, recordId: cleanId });
          setMode("CREATE");
        }
      } finally {
        setLoading(false);
      }
    },
    [itemsPool, setFormData, setMode, setRecordId],
  );

  // 3. Create new record
  const handleCreateNew = React.useCallback(() => {
    const nextId = String(Date.now().toString().slice(-4));
    setRecordId(nextId);
    setFormData({
      ...INITIAL_MENU_ITEM,
      recordId: nextId,
    });
    setMode("CREATE");
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
        cbs.menu.saveMenuItem(
          formData.recordId,
          wireData as unknown as Record<string, unknown>,
        ),
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
        setMode("EDIT");
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
        setMode("VIEW");
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

  React.useEffect(() => {
    if (resolvedInitialId) {
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
