"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import {
  parseMenuTreeList,
  parseMenuTreeRecord,
  serializeMenuTreeToWireJson,
} from "@/lib/data-parsers";
import {
  type MenuCatalogActionItem,
  type MenuDesignerValidationError,
  type MenuTreeNode,
  menuTreeRecordSchema,
} from "@/lib/data-schemas/menu-designer-schema";
import type { CbsScreenMode } from "@/types";
import { mapMenuDesignerZodIssues } from "./menu-designer-validation";
import { INITIAL_MENU_TREE, useMenuDesignerPersistence } from "./use-menu-designer-persistence";
import { useTreeOperations } from "./use-tree-operations";

const DEMO_CATALOG_ITEMS: MenuCatalogActionItem[] = [
  {
    id: "1",
    label: "Open Customer Account",
    command: "ACCOUNT I",
    description: "Customer account opening",
  },
  {
    id: "2",
    label: "Account Overview & Balances",
    command: "ACCOUNT S",
    description: "Inquiry overview",
  },
  {
    id: "3",
    label: "Customer Master Onboarding",
    command: "CUSTOMER I",
    description: "New customer master record",
  },
  {
    id: "4",
    label: "Funds Transfer Initiation",
    command: "FUNDS.TRANSFER I",
    description: "Interbank & intrabank transfers",
  },
  {
    id: "5",
    label: "Realtime Ledger Inquiry",
    command: "INQ ACCT.BAL",
    description: "Realtime balance inquiry",
  },
  {
    id: "6",
    label: "Model Configuration",
    command: "MODEL.CONFIG",
    description: "CBS Schema and Model Designer",
  },
];

const DEMO_AVAILABLE_TREES = [
  {
    id: "MAIN.MENU",
    label: "Core Enterprise Main Navigation",
    details: "Active Core Navigation",
  },
  { id: "ADMIN.NAV", label: "System Administration & Ops", details: "Superuser Tree" },
  { id: "TELLER.MENU", label: "Branch Frontline Teller Menu", details: "Cashier Operations" },
];

export function useMenuDesigner(initialId?: string, tabId?: string) {
  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    resolvedInitialId,
    resolvedInitialMode,
  } = useMenuDesignerPersistence(initialId, tabId);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [validationErrors, setValidationErrors] = React.useState<MenuDesignerValidationError[]>([]);

  // 1. Fetch available action items from MENU table catalog via TanStack Query
  const { data: catalogItems = DEMO_CATALOG_ITEMS, isLoading: catalogLoading } = useQuery<
    MenuCatalogActionItem[]
  >({
    queryKey: ["cbs", "menu-designer", "catalog"],
    queryFn: async () => {
      try {
        const json = await cbs.send<unknown>(cbs.menu.getCatalogList(), { silent: true });
        if (json.status === "SUCCESS" && json.data) {
          const rawList = Array.isArray(json.data)
            ? json.data
            : (json.data as { records?: unknown[] }).records || [];
          const mapped: MenuCatalogActionItem[] = (rawList as Record<string, unknown>[]).map(
            (r) => ({
              id: String(r.recordId || r.id || ""),
              label: String(r.label || "Action"),
              command: String(r.command || ""),
              menuType: r.menuType ? String(r.menuType) : undefined,
              description: r.description ? String(r.description) : undefined,
            }),
          );
          if (mapped.length > 0) return mapped;
        }
      } catch {
        // Fallback to demo items
      }
      return DEMO_CATALOG_ITEMS;
    },
  });

  // 2. Fetch available tree records (MENU.TREE) via TanStack Query
  const { data: availableTrees = DEMO_AVAILABLE_TREES, refetch: refetchTrees } = useQuery<
    Array<{ id: string; label: string; details: string }>
  >({
    queryKey: ["cbs", "menu-designer", "trees"],
    queryFn: async () => {
      try {
        const json = await cbs.send<unknown>(cbs.menu.getTreeList(), { silent: true });
        if (json.status === "SUCCESS" && json.data) {
          const parsed = parseMenuTreeList(json.data);
          if (parsed.success && parsed.data.length > 0) {
            return parsed.data.map((t) => ({
              id: t.recordId,
              label: t.treeDescription || `Menu Tree ${t.recordId}`,
              details: `Hierarchy: ${t.recordId} (${t.menuTree.length} roots)`,
            }));
          }
        }
      } catch {
        // Fallback to demo items
      }
      return DEMO_AVAILABLE_TREES;
    },
  });

  // Tree nodes setter bridging formData.menuTree
  const setNodes = React.useCallback(
    (updater: (prev: MenuTreeNode[]) => MenuTreeNode[]) => {
      setFormData((prev) => ({
        ...prev,
        menuTree: updater(prev.menuTree),
      }));
    },
    [setFormData],
  );

  const treeOps = useTreeOperations(formData.menuTree, setNodes);

  // 3. Fetch specific tree record by ID
  const fetchTreeRecord = React.useCallback(
    async (targetId: string, targetMode: CbsScreenMode = "I") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);
      setValidationErrors([]);

      try {
        const json = await cbs.send<unknown>(cbs.menu.getMenuTree(cleanId), {
          silent: true,
        });
        if (json.status === "SUCCESS" && json.data) {
          const parsed = parseMenuTreeRecord(json.data);
          if (parsed.success) {
            setFormData(parsed.data);
            setMode(targetMode);
            toast.add({
              title: "Navigation Tree Loaded",
              description: `Loaded menu hierarchy #${cleanId}`,
              type: "success",
            });
            return;
          }
        }
        // Clean draft initialization when record is not in backend
        setFormData({
          recordId: cleanId,
          treeDescription: "",
          isActive: true,
          menuTree: [],
        });
        setMode("I");
      } catch {
        setFormData({
          recordId: cleanId,
          treeDescription: "",
          isActive: true,
          menuTree: [],
        });
        setMode("I");
      } finally {
        setLoading(false);
      }
    },
    [setFormData, setMode, setRecordId],
  );

  // 4. Create new tree
  const handleCreateNew = React.useCallback(() => {
    const nextId = `TREE.${Date.now().toString().slice(-4)}`;
    setRecordId(nextId);
    setValidationErrors([]);
    setFormData({
      recordId: nextId,
      treeDescription: "",
      isActive: true,
      menuTree: [],
    });
    setMode("I");
  }, [setFormData, setMode, setRecordId]);

  // 5. Validate tree
  const handleValidate = React.useCallback((): boolean => {
    const validation = menuTreeRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errs = mapMenuDesignerZodIssues(validation.error.issues);
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
      description: "Navigation tree structure and description are valid.",
      type: "success",
    });
    return true;
  }, [formData]);

  // 6. Submit tree record (PUT to MENU.TREE)
  const handleSubmit = React.useCallback(async () => {
    const validation = menuTreeRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errs = mapMenuDesignerZodIssues(validation.error.issues);
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
      const wireData = serializeMenuTreeToWireJson(validation.data);
      const json = await cbs.send(
        cbs.menu.saveMenuTree(validation.data.recordId, wireData as unknown as unknown[]),
        {
          successTitle: "Navigation Tree Committed",
          successMessage: `Saved hierarchy ${validation.data.recordId} to MENU.TREE`,
        },
      );
      if (json.status === "SUCCESS") {
        setMode("I");
        refetchTrees();
      }
    } catch {
      // Toast error handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [formData, setMode, refetchTrees]);

  // 7. Authorize tree record (AUT to MENU.TREE)
  const handleAuthorize = React.useCallback(async () => {
    if (!recordId.trim()) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.menu.authorizeMenuTree(recordId.trim().toUpperCase()), {
        successTitle: "Navigation Tree Authorized",
        successMessage: `Authorized live menu tree #${recordId}`,
      });
      if (json.status === "SUCCESS") {
        setMode("S");
      }
    } catch {
      // Toast error handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [recordId, setMode]);

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
    setRecordId("");
    setFormData(INITIAL_MENU_TREE);
    setValidationErrors([]);
  }, [setFormData, setMode, setRecordId]);

  // Clear validation errors whenever switching away from edit mode
  React.useEffect(() => {
    if (mode !== "I") {
      setValidationErrors([]);
    }
  }, [mode]);

  const hasLoadedInitialRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasLoadedInitialRef.current && resolvedInitialId) {
      hasLoadedInitialRef.current = true;
      fetchTreeRecord(resolvedInitialId, resolvedInitialMode);
    }
  }, [fetchTreeRecord, resolvedInitialId, resolvedInitialMode]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    loading,
    submitting,
    catalogItems,
    catalogLoading,
    availableTrees,
    treeOps,
    fetchTreeRecord,
    handleCreateNew,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    validationErrors,
    resetToIdle,
  };
}
