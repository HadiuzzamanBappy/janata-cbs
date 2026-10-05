"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { appConfig } from "@/lib/config";
import type { CatalogScreenMode, MenuCatalogItem } from "../types";
import { menuCatalogItemSchema } from "../types";

const INITIAL_ITEM: MenuCatalogItem = {
  recordId: "",
  label: "",
  command: "",
  description: "",
  isActive: true,
};

export function useMenuCatalog(initialId?: string) {
  const [recordId, setRecordId] = React.useState<string>(initialId || "");
  const [mode, setMode] = React.useState<CatalogScreenMode>(initialId ? "EDIT" : "IDLE");
  const [formData, setFormData] = React.useState<MenuCatalogItem>(INITIAL_ITEM);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [itemsPool, setItemsPool] = React.useState<MenuCatalogItem[]>([]);

  // 1. Fetch available items from MENU table
  const fetchItems = React.useCallback(async () => {
    try {
      const res = await fetch(appConfig.routes.api.proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "GRL",
          controlName: "MENU",
          recordFunction: "L",
        }),
      });
      const json = await res.json();
      if (json.status === "SUCCESS" && json.data) {
        const records = Array.isArray(json.data) ? json.data : json.data.records || [];
        setItemsPool(records);
      } else {
        // Demo fallback records
        setItemsPool([
          {
            recordId: "1",
            label: "Open Customer Account",
            command: "ACCOUNT I",
            description: "Customer account opening",
            isActive: true,
          },
          {
            recordId: "2",
            label: "Account Overview",
            command: "ACCOUNT S",
            description: "Account inquiry overview",
            isActive: true,
          },
          {
            recordId: "3",
            label: "Customer Onboarding",
            command: "CUSTOMER I",
            description: "New customer master record",
            isActive: true,
          },
          {
            recordId: "4",
            label: "Funds Transfer",
            command: "FUNDS.TRANSFER I",
            description: "Interbank & intrabank transfers",
            isActive: true,
          },
          {
            recordId: "5",
            label: "Balance Inquiry",
            command: "INQ ACCT.BAL",
            description: "Realtime ledger balances",
            isActive: true,
          },
        ]);
      }
    } catch {
      setItemsPool([
        {
          recordId: "1",
          label: "Open Customer Account",
          command: "ACCOUNT I",
          description: "Customer account opening",
          isActive: true,
        },
        {
          recordId: "2",
          label: "Account Overview",
          command: "ACCOUNT S",
          description: "Account inquiry overview",
          isActive: true,
        },
        {
          recordId: "3",
          label: "Customer Onboarding",
          command: "CUSTOMER I",
          description: "New customer master record",
          isActive: true,
        },
        {
          recordId: "4",
          label: "Funds Transfer",
          command: "FUNDS.TRANSFER I",
          description: "Interbank & intrabank transfers",
          isActive: true,
        },
      ]);
    }
  }, []);

  // 2. Fetch specific record by ID
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: CatalogScreenMode = "EDIT") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);

      // Look up from local items pool first
      const found = itemsPool.find((i) => i.recordId.toUpperCase() === cleanId);
      if (found) {
        setFormData(found);
        setMode(targetMode);
        setLoading(false);
        toast.add({
          title: "Record Loaded",
          description: `Loaded menu item #${cleanId}`,
          type: "success",
        });
        return;
      }

      try {
        const res = await fetch(appConfig.routes.api.proxy, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            servicePath: "default",
            requestType: "GET",
            controlName: "MENU",
            recordFunction: "S",
            recordId: cleanId,
          }),
        });
        const json = await res.json();
        if (json.status === "SUCCESS" && json.data) {
          setFormData(json.data);
          setMode(targetMode);
        } else {
          setFormData({ ...INITIAL_ITEM, recordId: cleanId });
          setMode("CREATE");
        }
      } catch {
        setFormData({ ...INITIAL_ITEM, recordId: cleanId });
        setMode("CREATE");
      } finally {
        setLoading(false);
      }
    },
    [itemsPool],
  );

  // 3. Create fresh item
  const handleCreateNew = React.useCallback(() => {
    const nextId = String(itemsPool.length + 101);
    setRecordId(nextId);
    setFormData({ ...INITIAL_ITEM, recordId: nextId });
    setMode("CREATE");
  }, [itemsPool]);

  // 4. Save record (PUT to MENU table)
  const handleSubmit = React.useCallback(async () => {
    const validation = menuCatalogItemSchema.safeParse(formData);
    if (!validation.success) {
      toast.add({
        title: "Validation Error",
        description: validation.error.issues[0]?.message || "Invalid record",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(appConfig.routes.api.proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "PUT",
          controlName: "MENU",
          recordFunction: "I",
          recordId: formData.recordId,
          data: validation.data,
        }),
      });

      const json = await res.json();
      if (json.status === "SUCCESS" || res.ok) {
        toast.add({
          title: "Menu Item Committed",
          description: `Saved #${formData.recordId} to MENU table`,
          type: "success",
        });
        setItemsPool((prev) => {
          const exists = prev.some((p) => p.recordId === formData.recordId);
          return exists
            ? prev.map((p) => (p.recordId === formData.recordId ? validation.data : p))
            : [...prev, validation.data];
        });
        setMode("EDIT");
      }
    } catch (err) {
      toast.add({
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Error saving",
        type: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  // 5. Authorize record (AUT to MENU table)
  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      await fetch(appConfig.routes.api.proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "AUT",
          controlName: "MENU",
          recordFunction: "A",
          recordId,
        }),
      });
      toast.add({
        title: "Record Authorized",
        description: `Authorized menu action #${recordId}`,
        type: "success",
      });
      setMode("VIEW");
    } finally {
      setSubmitting(false);
    }
  }, [recordId]);

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
    setRecordId("");
    setFormData(INITIAL_ITEM);
  }, []);

  React.useEffect(() => {
    fetchItems();
    if (initialId) {
      fetchRecord(initialId);
    }
  }, [fetchItems, fetchRecord, initialId]);

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
    fetchRecord,
    handleCreateNew,
    handleSubmit,
    handleAuthorize,
    resetToIdle,
  };
}
