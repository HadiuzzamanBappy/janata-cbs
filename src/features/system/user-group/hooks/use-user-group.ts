"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import {
  parseUserGroupList,
  parseUserGroupRecord,
  serializeUserGroupToWireJson,
} from "@/lib/parsers";
import {
  type MenuRef,
  type Role,
  type UserGroupValidationError,
  type UserGroupScreenMode,
  userGroupRecordSchema,
} from "@/lib/schemas/user-group-schema";
import { mapUserGroupZodIssues } from "./user-group-validation";
import {
  INITIAL_USER_GROUP,
  useUserGroupPersistence,
} from "./use-user-group-persistence";

// Core banking role catalog
const DEFAULT_ROLES: Role[] = [
  { roleId: "1", roleCode: "MAKER", roleDesc: "Initiate & capture transactions" },
  { roleId: "2", roleCode: "CHECKER", roleDesc: "Authorize & verify transactions" },
  { roleId: "3", roleCode: "TELLER", roleDesc: "Branch cash counter operator" },
  { roleId: "4", roleCode: "SUPERVISOR", roleDesc: "Branch operations supervisor" },
  { roleId: "5", roleCode: "AUDITOR", roleDesc: "Read-only compliance & audit" },
  { roleId: "6", roleCode: "SYSADMIN", roleDesc: "Full administrative access" },
];

export function useUserGroup(initialId?: string, tabId?: string) {
  const {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    resolvedInitialId,
    resolvedInitialMode,
  } = useUserGroupPersistence(initialId, tabId);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [menus, setMenus] = React.useState<MenuRef[]>([]);
  const [roles] = React.useState<Role[]>(DEFAULT_ROLES);
  const [groupsPool, setGroupsPool] = React.useState<
    { id: string; label: string; details: string }[]
  >([]);
  const [validationErrors, setValidationErrors] = React.useState<UserGroupValidationError[]>([]);

  // 1. Fetch available menus from MENU table
  const fetchMenus = React.useCallback(async () => {
    try {
      const json = await cbs.send<unknown>(cbs.menu.getCatalogList(), { silent: true });
      if (json.status === "SUCCESS" && json.data) {
        const rawList = Array.isArray(json.data)
          ? json.data
          : (json.data as { records?: unknown[] }).records || [];
        const mapped: MenuRef[] = (rawList as Record<string, unknown>[]).map((r) => ({
          menuId: String(r.recordId || r.id || ""),
          label: String(r.label || "Action"),
          command: String(r.command || ""),
          menuType: r.menuType ? String(r.menuType) : undefined,
        }));
        if (mapped.length > 0) {
          setMenus(mapped);
          return;
        }
      }
      // Demo fallback menus
      setMenus([
        { menuId: "1", label: "Open Customer Account", command: "ACCOUNT I" },
        { menuId: "2", label: "Account Overview & Balances", command: "ACCOUNT S" },
        { menuId: "3", label: "Customer Master Onboarding", command: "CUSTOMER I" },
        { menuId: "4", label: "Funds Transfer Initiation", command: "FUNDS.TRANSFER I" },
        { menuId: "5", label: "Realtime Ledger Inquiry", command: "INQ ACCT.BAL" },
        { menuId: "6", label: "Model Configuration", command: "MODEL.CONFIG" },
      ]);
    } catch {
      setMenus([
        { menuId: "1", label: "Open Customer Account", command: "ACCOUNT I" },
        { menuId: "2", label: "Account Overview & Balances", command: "ACCOUNT S" },
        { menuId: "3", label: "Customer Master Onboarding", command: "CUSTOMER I" },
        { menuId: "4", label: "Funds Transfer Initiation", command: "FUNDS.TRANSFER I" },
        { menuId: "5", label: "Realtime Ledger Inquiry", command: "INQ ACCT.BAL" },
      ]);
    }
  }, []);

  // 2. Fetch available groups pool from USER.GROUP table
  const fetchGroups = React.useCallback(async () => {
    try {
      const json = await cbs.send<unknown>(
        cbs.userGroup.getGroup(""), // Empty ID returns record list
        { silent: true },
      );
      if (json.status === "SUCCESS" && json.data) {
        const parsed = parseUserGroupList(json.data);
        if (parsed.success && parsed.data.length > 0) {
          setGroupsPool(
            parsed.data.map((g) => ({
              id: g.recordId,
              label: g.groupLabel,
              details: `${g.menuIds.length} menus • ${g.roleIds.length} roles`,
            })),
          );
          return;
        }
      }
      setGroupsPool([
        { id: "TELLER.GRP", label: "Branch Frontline Tellers", details: "5 menus • 2 roles" },
        { id: "SUPERVISOR.GRP", label: "Branch Authorizers & Supervisors", details: "7 menus • 2 roles" },
        { id: "ADMIN.GRP", label: "System & Core Administrators", details: "9 menus • 3 roles" },
      ]);
    } catch {
      setGroupsPool([
        { id: "TELLER.GRP", label: "Branch Frontline Tellers", details: "5 menus • 2 roles" },
        { id: "SUPERVISOR.GRP", label: "Branch Authorizers & Supervisors", details: "7 menus • 2 roles" },
      ]);
    }
  }, []);

  // 3. Fetch specific group record by ID
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: UserGroupScreenMode = "EDIT") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);

      try {
        const json = await cbs.send<unknown>(cbs.userGroup.getGroup(cleanId), {
          silent: true,
        });
        if (json.status === "SUCCESS" && json.data) {
          const parsed = parseUserGroupRecord(json.data);
          if (parsed.success) {
            setFormData(parsed.data);
            setMode(targetMode);
            toast.add({
              title: "User Group Loaded",
              description: `Loaded security profile #${cleanId}`,
              type: "success",
            });
            return;
          }
        }
        // Fallback for new draft or uncommitted ID
        setFormData({
          ...INITIAL_USER_GROUP,
          recordId: cleanId,
        });
        setMode("CREATE");
      } catch {
        setFormData({
          ...INITIAL_USER_GROUP,
          recordId: cleanId,
        });
        setMode("CREATE");
      } finally {
        setLoading(false);
      }
    },
    [setFormData, setMode, setRecordId],
  );

  // 4. Create new user group
  const handleCreateNew = React.useCallback(() => {
    const nextId = `GRP.${Date.now().toString().slice(-4)}`;
    setRecordId(nextId);
    setFormData({
      ...INITIAL_USER_GROUP,
      recordId: nextId,
    });
    setMode("CREATE");
  }, [setFormData, setMode, setRecordId]);

  // 5. Validate user group
  const handleValidate = React.useCallback((): boolean => {
    const validation = userGroupRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errs = mapUserGroupZodIssues(validation.error.issues);
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
      description: "User group configuration and label are valid.",
      type: "success",
    });
    return true;
  }, [formData]);

  // 6. Submit user group (PUT to USER.GROUP)
  const handleSubmit = React.useCallback(async () => {
    const validation = userGroupRecordSchema.safeParse(formData);
    if (!validation.success) {
      const errs = mapUserGroupZodIssues(validation.error.issues);
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
      const wireData = serializeUserGroupToWireJson(validation.data);
      const json = await cbs.send(
        cbs.userGroup.saveGroup(
          validation.data.recordId,
          wireData as Record<string, unknown>,
        ),
        {
          successTitle: "User Group Committed",
          successMessage: `Saved security group #${validation.data.recordId}`,
        },
      );
      if (json.status === "SUCCESS") {
        setMode("EDIT");
        fetchGroups();
      }
    } catch {
      // Toast error handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [formData, setMode, fetchGroups]);

  // 7. Authorize user group (AUT to USER.GROUP)
  const handleAuthorize = React.useCallback(async () => {
    if (!recordId.trim()) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.userGroup.authorizeGroup(recordId.trim().toUpperCase()), {
        successTitle: "User Group Authorized",
        successMessage: `Authorized security profile #${recordId}`,
      });
      if (json.status === "SUCCESS") {
        setMode("VIEW");
      }
    } catch {
      // Toast error handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [recordId, setMode]);

  // Matrix manipulation helpers
  const toggleMenu = React.useCallback(
    (menuId: string) => {
      setFormData((prev) => {
        const exists = prev.menuIds.includes(menuId);
        return {
          ...prev,
          menuIds: exists ? prev.menuIds.filter((id) => id !== menuId) : [...prev.menuIds, menuId],
        };
      });
    },
    [setFormData],
  );

  const setMenusBulk = React.useCallback(
    (targetMenuIds: string[], select: boolean) => {
      setFormData((prev) => {
        if (select) {
          const union = new Set([...prev.menuIds, ...targetMenuIds]);
          return { ...prev, menuIds: Array.from(union) };
        }
        const removeSet = new Set(targetMenuIds);
        return { ...prev, menuIds: prev.menuIds.filter((id) => !removeSet.has(id)) };
      });
    },
    [setFormData],
  );

  const toggleRole = React.useCallback(
    (roleId: string) => {
      setFormData((prev) => {
        const exists = prev.roleIds.includes(roleId);
        return {
          ...prev,
          roleIds: exists ? prev.roleIds.filter((id) => id !== roleId) : [...prev.roleIds, roleId],
        };
      });
    },
    [setFormData],
  );

  const resetToIdle = React.useCallback(() => {
    setMode("IDLE");
    setRecordId("");
    setFormData(INITIAL_USER_GROUP);
    setValidationErrors([]);
  }, [setFormData, setMode, setRecordId]);

  React.useEffect(() => {
    fetchMenus();
    fetchGroups();
  }, [fetchMenus, fetchGroups]);

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
    menus,
    roles,
    groupsPool,
    validationErrors,
    fetchRecord,
    handleCreateNew,
    handleValidate,
    handleSubmit,
    handleAuthorize,
    toggleMenu,
    setMenusBulk,
    toggleRole,
    resetToIdle,
  };
}
