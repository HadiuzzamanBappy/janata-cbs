"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { appConfig } from "@/lib/config";
import type { MenuRef, Role, UserGroupRecord, UserGroupScreenMode } from "../types";
import { userGroupRecordSchema } from "../types";

const INITIAL_GROUP: UserGroupRecord = {
  recordId: "",
  groupLabel: "",
  menuIds: [],
  roleIds: [],
  isActive: true,
};

// Demo fallback catalogs
const DEMO_MENUS: MenuRef[] = [
  { menuId: "1", label: "Open Customer Account", command: "ACCOUNT I" },
  { menuId: "2", label: "Account Overview & Balances", command: "ACCOUNT S" },
  { menuId: "3", label: "Customer Master Onboarding", command: "CUSTOMER I" },
  { menuId: "4", label: "Funds Transfer Initiation", command: "FUNDS.TRANSFER I" },
  { menuId: "5", label: "Realtime Ledger Inquiry", command: "INQ ACCT.BAL" },
  { menuId: "6", label: "Teller Cash Deposit", command: "TELLER.TXN,CASH.DEP I" },
  { menuId: "7", label: "Fixed Term Deposit Contract", command: "LD.LOANS.AND.DEPOSITS I" },
  { menuId: "8", label: "Loan Contract Initiation", command: "AA.ARRANGEMENT.ACTIVITY I" },
  { menuId: "9", label: "Close of Business Monitor", command: "COB.MONITOR S" },
];

const DEMO_ROLES: Role[] = [
  { roleId: "1", roleCode: "MAKER", roleDesc: "Initiate & capture transactions" },
  { roleId: "2", roleCode: "CHECKER", roleDesc: "Authorize & verify transactions" },
  { roleId: "3", roleCode: "TELLER", roleDesc: "Branch cash counter operator" },
  { roleId: "4", roleCode: "SUPERVISOR", roleDesc: "Branch operations supervisor" },
  { roleId: "5", roleCode: "AUDITOR", roleDesc: "Read-only compliance & audit" },
  { roleId: "6", roleCode: "SYSADMIN", roleDesc: "Full administrative access" },
];

const DEMO_GROUPS: { id: string; label: string; details: string; record: UserGroupRecord }[] = [
  {
    id: "TELLER.GRP",
    label: "Branch Frontline Tellers",
    details: "Cashier, Transfers, Inquiries",
    record: {
      recordId: "TELLER.GRP",
      groupLabel: "Branch Frontline Tellers",
      menuIds: ["1", "2", "4", "5", "6"],
      roleIds: ["1", "3"],
      isActive: true,
    },
  },
  {
    id: "SUPERVISOR.GRP",
    label: "Branch Authorizers & Supervisors",
    details: "Verification, Authorization, Overrides",
    record: {
      recordId: "SUPERVISOR.GRP",
      groupLabel: "Branch Authorizers & Supervisors",
      menuIds: ["1", "2", "3", "4", "5", "6", "7"],
      roleIds: ["2", "4"],
      isActive: true,
    },
  },
  {
    id: "ADMIN.GRP",
    label: "System & Core Administrators",
    details: "All system tables & batch monitoring",
    record: {
      recordId: "ADMIN.GRP",
      groupLabel: "System & Core Administrators",
      menuIds: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
      roleIds: ["1", "2", "6"],
      isActive: true,
    },
  },
];

export function useUserGroup(initialId?: string) {
  const [recordId, setRecordId] = React.useState<string>(initialId || "");
  const [mode, setMode] = React.useState<UserGroupScreenMode>(initialId ? "EDIT" : "IDLE");
  const [formData, setFormData] = React.useState<UserGroupRecord>(INITIAL_GROUP);
  const [menus, setMenus] = React.useState<MenuRef[]>(DEMO_MENUS);
  const [roles] = React.useState<Role[]>(DEMO_ROLES);
  const [groupsPool, setGroupsPool] = React.useState(DEMO_GROUPS);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // 1. Fetch available menus (from MENU table)
  const fetchMenus = React.useCallback(async () => {
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
        setMenus(
          records.map(
            (r: { recordId?: string; id?: string; label?: string; command?: string }) => ({
              menuId: String(r.recordId || r.id || ""),
              label: r.label || "Action",
              command: r.command || "",
            }),
          ),
        );
      }
    } catch {
      // keep DEMO_MENUS fallback
    }
  }, []);

  // 2. Fetch specific group record by ID
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: UserGroupScreenMode = "EDIT") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);

      // Look up locally first
      const found = groupsPool.find((g) => g.id.toUpperCase() === cleanId);
      if (found) {
        setFormData(found.record);
        setMode(targetMode);
        setLoading(false);
        toast.add({
          title: "Group Loaded",
          description: `Loaded permissions for ${cleanId}`,
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
            controlName: "USER.GROUP",
            recordFunction: "S",
            recordId: cleanId,
          }),
        });
        const json = await res.json();
        if (json.status === "SUCCESS" && json.data) {
          setFormData(json.data);
          setMode(targetMode);
        } else {
          setFormData({ ...INITIAL_GROUP, recordId: cleanId });
          setMode("CREATE");
        }
      } catch {
        setFormData({ ...INITIAL_GROUP, recordId: cleanId });
        setMode("CREATE");
      } finally {
        setLoading(false);
      }
    },
    [groupsPool],
  );

  // 3. Create fresh group
  const handleCreateNew = React.useCallback(() => {
    const nextId = `GRP.${Date.now().toString().slice(-4)}`;
    setRecordId(nextId);
    setFormData({ ...INITIAL_GROUP, recordId: nextId, groupLabel: "New Access Group" });
    setMode("CREATE");
  }, []);

  // 4. Save group record (PUT to USER.GROUP)
  const handleSubmit = React.useCallback(async () => {
    const validation = userGroupRecordSchema.safeParse(formData);
    if (!validation.success) {
      toast.add({
        title: "Validation Error",
        description: validation.error.issues[0]?.message || "Invalid group definition",
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
          controlName: "USER.GROUP",
          recordFunction: "I",
          recordId: formData.recordId,
          data: validation.data,
        }),
      });
      const json = await res.json();
      if (json.status === "SUCCESS" || res.ok) {
        toast.add({
          title: "Group Saved",
          description: `Committed group #${formData.recordId} to USER.GROUP`,
          type: "success",
        });
        setGroupsPool((prev) => {
          const item = {
            id: validation.data.recordId,
            label: validation.data.groupLabel,
            details: `${validation.data.menuIds.length} menus, ${validation.data.roleIds.length} roles`,
            record: validation.data,
          };
          const exists = prev.some((p) => p.id === item.id);
          return exists ? prev.map((p) => (p.id === item.id ? item : p)) : [...prev, item];
        });
        setMode("EDIT");
      }
    } catch (err) {
      toast.add({
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Error saving group",
        type: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  // 5. Authorize group record
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
          controlName: "USER.GROUP",
          recordFunction: "A",
          recordId,
        }),
      });
      toast.add({
        title: "Group Authorized",
        description: `Authorized user group #${recordId}`,
        type: "success",
      });
      setMode("VIEW");
    } finally {
      setSubmitting(false);
    }
  }, [recordId]);

  // Checklist helper toggles
  const toggleMenu = React.useCallback((menuId: string) => {
    setFormData((prev) => {
      const has = prev.menuIds.includes(menuId);
      return {
        ...prev,
        menuIds: has ? prev.menuIds.filter((id) => id !== menuId) : [...prev.menuIds, menuId],
      };
    });
  }, []);

  const setMenusBulk = React.useCallback((ids: string[], checked: boolean) => {
    setFormData((prev) => {
      const set = new Set(prev.menuIds);
      for (const id of ids) {
        if (checked) set.add(id);
        else set.delete(id);
      }
      return { ...prev, menuIds: [...set] };
    });
  }, []);

  const toggleRole = React.useCallback((roleId: string) => {
    setFormData((prev) => {
      const has = prev.roleIds.includes(roleId);
      return {
        ...prev,
        roleIds: has ? prev.roleIds.filter((id) => id !== roleId) : [...prev.roleIds, roleId],
      };
    });
  }, []);

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
    setRecordId("");
    setFormData(INITIAL_GROUP);
  }, []);

  React.useEffect(() => {
    fetchMenus();
    if (initialId) {
      fetchRecord(initialId);
    }
  }, [fetchMenus, fetchRecord, initialId]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    menus,
    roles,
    groupsPool,
    loading,
    submitting,
    fetchRecord,
    handleCreateNew,
    handleSubmit,
    handleAuthorize,
    toggleMenu,
    setMenusBulk,
    toggleRole,
    resetToIdle,
  };
}
