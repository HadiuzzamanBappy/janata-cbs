"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import type { MenuCatalogItem, MenuConfigurationRecord, MenuNode, MenuScreenMode } from "../types";
import { menuConfigurationRecordSchema } from "../types";
import { useTreeOperations } from "./use-tree-operations";

// Built-in demo navigation tree for fallback or quick showcase
const DEMO_TREE_DEFAULT: MenuNode[] = [
  {
    id: "grp_retail",
    menuId: 0,
    label: "Retail Banking Operations",
    command: "",
    isVisible: true,
    orderIndex: 1,
    children: [
      {
        id: "leaf_acc_open",
        menuId: 1,
        label: "Open Customer Account",
        command: "ACCOUNT I",
        isVisible: true,
        orderIndex: 1,
        children: [],
      },
      {
        id: "leaf_acc_inq",
        menuId: 2,
        label: "Account Overview & Balances",
        command: "ACCOUNT S",
        isVisible: true,
        orderIndex: 2,
        children: [],
      },
      {
        id: "leaf_cust_onboard",
        menuId: 3,
        label: "Customer Master Onboarding",
        command: "CUSTOMER I",
        isVisible: true,
        orderIndex: 3,
        children: [],
      },
    ],
  },
  {
    id: "grp_payments",
    menuId: 0,
    label: "Transfers & Clearing",
    command: "",
    isVisible: true,
    orderIndex: 2,
    children: [
      {
        id: "leaf_ft_new",
        menuId: 4,
        label: "Funds Transfer Initiation",
        command: "FUNDS.TRANSFER I",
        isVisible: true,
        orderIndex: 1,
        children: [],
      },
      {
        id: "leaf_ft_inq",
        menuId: 5,
        label: "Realtime Ledger Inquiry",
        command: "INQ ACCT.BAL",
        isVisible: true,
        orderIndex: 2,
        children: [],
      },
    ],
  },
];

export function useMenuDesigner(initialId?: string) {
  const [recordId, setRecordId] = React.useState<string>(initialId || "");
  const [mode, setMode] = React.useState<MenuScreenMode>(initialId ? "EDIT" : "IDLE");
  const [description, setDescription] = React.useState<string>("");
  const [isActive, setIsActive] = React.useState<boolean>(true);
  const [nodes, setNodes] = React.useState<MenuNode[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // Catalog item pool fetched from MENU table
  const [catalogItems, setCatalogItems] = React.useState<MenuCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = React.useState<boolean>(false);

  // Available trees index for quick pills
  const [availableTrees, setAvailableTrees] = React.useState<
    { id: string; label: string; details: string }[]
  >([]);

  // Tree manipulation methods
  const treeOps = useTreeOperations(setNodes);

  // 1. Fetch available items from MENU table (read-only reference)
  const fetchCatalogItems = React.useCallback(async () => {
    setCatalogLoading(true);
    try {
      const json = await cbs.send<MenuCatalogItem[] | { records: MenuCatalogItem[] }>(
        cbs.menu.getCatalogList(),
        { silent: true },
      );
      if (json.status === "SUCCESS" && json.data) {
        const records = Array.isArray(json.data) ? json.data : json.data.records || [];
        setCatalogItems(
          records.map(
            (r: {
              recordId?: string;
              id?: string;
              label?: string;
              command?: string;
              description?: string;
            }) => ({
              id: String(r.recordId || r.id || ""),
              code: String(r.recordId || r.id || ""),
              label: r.label || "Action",
              command: r.command || "",
              description: r.description,
            }),
          ),
        );
      } else {
        // Fallback catalog
        setCatalogItems([
          {
            id: "1",
            code: "1",
            label: "Open Customer Account",
            command: "ACCOUNT I",
            description: "Customer account opening",
          },
          {
            id: "2",
            code: "2",
            label: "Account Overview & Balances",
            command: "ACCOUNT S",
            description: "Inquiry overview",
          },
          {
            id: "3",
            code: "3",
            label: "Customer Master Onboarding",
            command: "CUSTOMER I",
            description: "New customer master record",
          },
          {
            id: "4",
            code: "4",
            label: "Funds Transfer Initiation",
            command: "FUNDS.TRANSFER I",
            description: "Interbank & intrabank transfers",
          },
          {
            id: "5",
            code: "5",
            label: "Realtime Ledger Inquiry",
            command: "INQ ACCT.BAL",
            description: "Realtime balance inquiry",
          },
          {
            id: "6",
            code: "6",
            label: "Teller Cash Deposit",
            command: "TELLER.TXN,CASH.DEP I",
            description: "Counter cash deposit",
          },
          {
            id: "7",
            code: "7",
            label: "Fixed Term Deposit Contract",
            command: "LD.LOANS.AND.DEPOSITS I",
            description: "Term deposit contracts",
          },
        ]);
      }
    } catch {
      setCatalogItems([
        { id: "1", code: "1", label: "Open Customer Account", command: "ACCOUNT I" },
        { id: "2", code: "2", label: "Account Overview & Balances", command: "ACCOUNT S" },
        { id: "3", code: "3", label: "Customer Master Onboarding", command: "CUSTOMER I" },
        { id: "4", code: "4", label: "Funds Transfer Initiation", command: "FUNDS.TRANSFER I" },
        { id: "5", code: "5", label: "Realtime Ledger Inquiry", command: "INQ ACCT.BAL" },
      ]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  // 2. Fetch list of available tree records (MENU.TREE)
  const fetchAvailableTrees = React.useCallback(async () => {
    try {
      interface TreeListItem {
        recordId?: string;
        id?: string;
        treeDescription?: string;
      }
      const json = await cbs.send<{ records?: TreeListItem[] } | TreeListItem[]>(
        cbs.menu.getTreeList(),
        { silent: true },
      );
      if (json.status === "SUCCESS" && json.data) {
        const list = Array.isArray(json.data) ? json.data : json.data.records || [];
        setAvailableTrees(
          list.map((t) => ({
            id: String(t.recordId || t.id || ""),
            label: t.treeDescription || `Menu Tree ${t.recordId || t.id}`,
            details: `Tree Config: ${t.recordId || t.id}`,
          })),
        );
      } else {
        setAvailableTrees([
          {
            id: "MAIN.NAV",
            label: "Core Enterprise Main Navigation",
            details: "Active Core Navigation",
          },
          {
            id: "TELLER.MENU",
            label: "Branch Frontline Teller Menu",
            details: "Cashier Operations",
          },
          { id: "ADMIN.NAV", label: "System Administration & Ops", details: "Superuser Tree" },
        ]);
      }
    } catch {
      setAvailableTrees([
        {
          id: "MAIN.NAV",
          label: "Core Enterprise Main Navigation",
          details: "Active Core Navigation",
        },
        { id: "TELLER.MENU", label: "Branch Frontline Teller Menu", details: "Cashier Operations" },
      ]);
    }
  }, []);

  // 3. Fetch specific tree record by ID
  const fetchTreeRecord = React.useCallback(
    async (targetId: string, targetMode: MenuScreenMode = "EDIT") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);

      try {
        const json = await cbs.send<MenuConfigurationRecord>(cbs.menu.getMenuTree(cleanId), {
          silent: true,
        });
        if (json.status === "SUCCESS" && json.data) {
          const rec = json.data;
          setDescription(rec.treeDescription || "");
          setIsActive(rec.isActive ?? true);
          setNodes(rec.menuTree || []);
          setMode(targetMode);
          toast.add({
            title: "Navigation Tree Loaded",
            description: `Loaded menu hierarchy #${cleanId}`,
            type: "success",
          });
        } else {
          // Demo fallback if target record not in backend
          setDescription(`Hierarchy: ${cleanId}`);
          setIsActive(true);
          setNodes(DEMO_TREE_DEFAULT);
          setMode(targetMode);
          toast.add({
            title: "Demo Tree Initialized",
            description: `Loaded demo tree for #${cleanId}`,
            type: "info",
          });
        }
      } catch {
        setDescription(`Hierarchy: ${cleanId}`);
        setIsActive(true);
        setNodes(DEMO_TREE_DEFAULT);
        setMode(targetMode);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 4. Create new tree record
  const handleCreateNew = React.useCallback(() => {
    const nextId = `TREE.${Date.now().toString().slice(-4)}`;
    setRecordId(nextId);
    setDescription("New Enterprise Navigation Tree");
    setIsActive(true);
    setNodes([]);
    setMode("CREATE");
  }, []);

  // 5. Submit tree record (PUT to MENU.TREE)
  const handleSubmit = React.useCallback(async () => {
    if (!recordId.trim()) {
      toast.add({
        title: "Validation Error",
        description: "Record ID is required",
        type: "warning",
      });
      return;
    }
    const payload: MenuConfigurationRecord = {
      recordId: recordId.trim().toUpperCase(),
      treeDescription: description.trim() || `Menu Tree ${recordId}`,
      isActive,
      menuTree: nodes,
    };

    const parsed = menuConfigurationRecordSchema.safeParse(payload);
    if (!parsed.success) {
      toast.add({
        title: "Validation Error",
        description: parsed.error.issues[0]?.message || "Invalid navigation tree schema",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.menu.saveMenuTree(payload.recordId, parsed.data.menuTree), {
        successTitle: "Navigation Tree Committed",
        successMessage: `Saved hierarchy ${payload.recordId} to MENU.TREE`,
      });
      if (json.status === "SUCCESS") {
        setMode("EDIT");
        fetchAvailableTrees();
      }
    } catch {
      // Toast error handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [recordId, description, isActive, nodes, fetchAvailableTrees]);

  // 6. Authorize tree record (AUT to MENU.TREE)
  const handleAuthorize = React.useCallback(async () => {
    if (!recordId.trim()) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.menu.authorizeMenuTree(recordId.trim().toUpperCase()), {
        successTitle: "Navigation Tree Authorized",
        successMessage: `Authorized live menu tree #${recordId}`,
      });
      if (json.status === "SUCCESS") {
        setMode("VIEW");
      }
    } catch {
      // Toast error handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [recordId]);

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
    setRecordId("");
    setDescription("");
    setIsActive(true);
    setNodes([]);
  }, []);

  React.useEffect(() => {
    fetchCatalogItems();
    fetchAvailableTrees();
    if (initialId) {
      fetchTreeRecord(initialId);
    }
  }, [fetchCatalogItems, fetchAvailableTrees, fetchTreeRecord, initialId]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    description,
    setDescription,
    isActive,
    setIsActive,
    nodes,
    setNodes,
    loading,
    submitting,
    catalogItems,
    catalogLoading,
    availableTrees,
    treeOps,
    fetchTreeRecord,
    handleCreateNew,
    handleSubmit,
    handleAuthorize,
    resetToIdle,
  };
}
