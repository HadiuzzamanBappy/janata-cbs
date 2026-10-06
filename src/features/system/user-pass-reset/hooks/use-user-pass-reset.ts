"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { cbs } from "@/lib/cbs-client";
import type { UserPassResetRecord, UserPassResetScreenMode } from "../types";
import { userPassResetRecordSchema } from "../types";

const INITIAL_USER: UserPassResetRecord = {
  recordId: "",
  bankId: "",
  username: "",
  fullName: "",
  email: "",
  branchCode: "0101",
  userGroup: "TELLER.GRP",
  accountStatus: "ACTIVE",
  failedAttempts: 0,
  temporaryPassword: "",
  requirePasswordChange: true,
};

const DEMO_USERS: { id: string; label: string; details: string; record: UserPassResetRecord }[] = [
  {
    id: "TELLER01",
    label: "John Doe (Branch Teller)",
    details: "Branch 0101 | Status: LOCKED (3 failed attempts)",
    record: {
      recordId: "TELLER01",
      bankId: "B-10029",
      username: "jdoe",
      fullName: "John Doe",
      email: "jdoe@finxbank.com",
      branchCode: "0101",
      userGroup: "TELLER.GRP",
      accountStatus: "LOCKED",
      failedAttempts: 3,
      lastPasswordChange: "2026-09-12",
      temporaryPassword: "",
      requirePasswordChange: true,
    },
  },
  {
    id: "SUPV02",
    label: "Sarah Jenkins (Operations Supervisor)",
    details: "Branch 0101 | Status: ACTIVE",
    record: {
      recordId: "SUPV02",
      bankId: "B-10014",
      username: "sjenkins",
      fullName: "Sarah Jenkins",
      email: "sjenkins@finxbank.com",
      branchCode: "0101",
      userGroup: "SUPERVISOR.GRP",
      accountStatus: "ACTIVE",
      failedAttempts: 0,
      lastPasswordChange: "2026-08-01",
      temporaryPassword: "",
      requirePasswordChange: false,
    },
  },
  {
    id: "ADMIN01",
    label: "Core System Administrator",
    details: "Head Office | Status: PASSWORD_EXPIRED",
    record: {
      recordId: "ADMIN01",
      bankId: "B-10001",
      username: "sysadmin",
      fullName: "Core System Administrator",
      email: "admin@finxbank.com",
      branchCode: "0001",
      userGroup: "ADMIN.GRP",
      accountStatus: "PASSWORD_EXPIRED",
      failedAttempts: 0,
      lastPasswordChange: "2026-01-15",
      temporaryPassword: "",
      requirePasswordChange: true,
    },
  },
];

export function useUserPassReset(initialId?: string) {
  const [recordId, setRecordId] = React.useState<string>(initialId || "");
  const [mode, setMode] = React.useState<UserPassResetScreenMode>(initialId ? "EDIT" : "IDLE");
  const [formData, setFormData] = React.useState<UserPassResetRecord>(INITIAL_USER);
  const [usersPool, setUsersPool] = React.useState(DEMO_USERS);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // 1. Fetch user record
  const fetchRecord = React.useCallback(
    async (targetId: string, targetMode: UserPassResetScreenMode = "EDIT") => {
      if (!targetId.trim()) return;
      setLoading(true);
      const cleanId = targetId.trim().toUpperCase();
      setRecordId(cleanId);

      const found = usersPool.find((u) => u.id.toUpperCase() === cleanId);
      if (found) {
        setFormData(found.record);
        setMode(targetMode);
        setLoading(false);
        toast.add({
          title: "User Profile Loaded",
          description: `Loaded security profile for ${cleanId}`,
          type: "success",
        });
        return;
      }

      try {
        const json = await cbs.send<UserPassResetRecord>(cbs.userSecurity.getUserProfile(cleanId), {
          silent: true,
        });
        if (json.status === "SUCCESS" && json.data) {
          setFormData(json.data);
          setMode(targetMode);
        } else {
          setFormData({ ...INITIAL_USER, recordId: cleanId, username: cleanId.toLowerCase() });
          setMode("CREATE");
        }
      } catch {
        setFormData({ ...INITIAL_USER, recordId: cleanId, username: cleanId.toLowerCase() });
        setMode("CREATE");
      } finally {
        setLoading(false);
      }
    },
    [usersPool],
  );

  // 2. Create fresh user
  const handleCreateNew = React.useCallback(() => {
    const nextId = `USER.${Date.now().toString().slice(-4)}`;
    setRecordId(nextId);
    setFormData({
      ...INITIAL_USER,
      recordId: nextId,
      bankId: `B-${nextId}`,
      username: nextId.toLowerCase(),
      fullName: "New Staff Member",
    });
    setMode("CREATE");
  }, []);

  // 3. Reset password & Unlock helpers
  const handleUnlockAccount = React.useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      accountStatus: "ACTIVE",
      failedAttempts: 0,
    }));
    toast.add({
      title: "Account Unlocked",
      description: "Failed login attempts reset to 0. Status set to ACTIVE.",
      type: "success",
    });
  }, []);

  const handleGenerateTempPassword = React.useCallback(() => {
    const temp = `P@ss-${Math.random().toString(36).slice(-6).toUpperCase()}!`;
    setFormData((prev) => ({
      ...prev,
      temporaryPassword: temp,
      requirePasswordChange: true,
      accountStatus: "ACTIVE",
      failedAttempts: 0,
    }));
    toast.add({
      title: "Temporary Password Generated",
      description: `Temporary password: ${temp}`,
      type: "info",
    });
  }, []);

  // 4. Submit record (PUT)
  const handleSubmit = React.useCallback(async () => {
    const validation = userPassResetRecordSchema.safeParse(formData);
    if (!validation.success) {
      toast.add({
        title: "Validation Error",
        description: validation.error.issues[0]?.message || "Invalid user profile",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const json = await cbs.send(
        cbs.userSecurity.saveUserProfile(
          formData.recordId,
          validation.data as Record<string, unknown>,
        ),
        {
          successTitle: "User Profile Updated",
          successMessage: `Committed security credentials for #${formData.recordId}`,
        },
      );
      if (json.status === "SUCCESS") {
        setUsersPool((prev) => {
          const item = {
            id: validation.data.recordId,
            label: `${validation.data.fullName} (${validation.data.username})`,
            details: `Status: ${validation.data.accountStatus}`,
            record: validation.data,
          };
          const exists = prev.some((p) => p.id === item.id);
          return exists ? prev.map((p) => (p.id === item.id ? item : p)) : [...prev, item];
        });
        setMode("EDIT");
      }
    } catch {
      // Toast error handled by cbs.send
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  // 5. Authorize record (AUT)
  const handleAuthorize = React.useCallback(async () => {
    if (!recordId) return;
    setSubmitting(true);
    try {
      const json = await cbs.send(cbs.userSecurity.authorizeUserProfile(recordId), {
        successTitle: "Security Update Authorized",
        successMessage: `Authorized password reset for user #${recordId}`,
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
    setFormData(INITIAL_USER);
  }, []);

  React.useEffect(() => {
    if (initialId) {
      fetchRecord(initialId);
    }
  }, [fetchRecord, initialId]);

  return {
    recordId,
    setRecordId,
    mode,
    setMode,
    formData,
    setFormData,
    usersPool,
    loading,
    submitting,
    fetchRecord,
    handleCreateNew,
    handleUnlockAccount,
    handleGenerateTempPassword,
    handleSubmit,
    handleAuthorize,
    resetToIdle,
  };
}
