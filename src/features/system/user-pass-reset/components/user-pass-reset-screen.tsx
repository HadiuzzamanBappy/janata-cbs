"use client";

import { KeyRound, Layers, RefreshCw, ShieldAlert, Unlock, UserCheck } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormHeader } from "@/features/screens/forms/components/form-header";
import type { ScreenProps } from "@/features/screens/types";
import { useUserPassReset } from "../hooks/use-user-pass-reset";
import type { UserPassResetRecord } from "../types";

export function UserPassResetScreen({ command }: ScreenProps) {
  const initialId = React.useMemo(() => {
    const parts = (command || "").trim().split(/\s+/);
    return parts.length > 1 ? parts[1] : undefined;
  }, [command]);

  const {
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
  } = useUserPassReset(initialId);

  const isReadOnly = mode === "VIEW";

  const availableUsers = React.useMemo(
    () =>
      usersPool.map((u) => ({
        id: u.id,
        label: u.label,
        details: u.details,
      })),
    [usersPool],
  );

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden select-none font-sans">
      {/* 1. CBS FORM HEADER */}
      <FormHeader
        title="User Password Reset & Account Security"
        commandCode="USER.PASS.RESET"
        recordId={recordId}
        onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
        onRecordSearch={(searchedId) => fetchRecord(searchedId, "EDIT")}
        onCreateNew={handleCreateNew}
        onReturnToSearch={resetToIdle}
        onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "TELLER01") : undefined}
        onSubmit={mode !== "IDLE" && !isReadOnly ? handleSubmit : undefined}
        onAuthorizeReverse={mode !== "IDLE" ? handleAuthorize : undefined}
        onView={() => recordId && fetchRecord(recordId, "VIEW")}
        onAmend={() => recordId && setMode("EDIT")}
        mode={mode}
        submitting={submitting || loading}
        availableItems={availableUsers}
        moreActions={[
          {
            label: "Unlock Account",
            onClick: handleUnlockAccount,
            requiredRight: "A",
          },
          {
            label: "Generate Temp Password",
            onClick: handleGenerateTempPassword,
            requiredRight: "A",
          },
        ]}
      />

      {/* 2. BODY: IDLE vs USER SECURITY PROFILE */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col">
        {mode === "IDLE" ? (
          /* EXACT FORM IDLE STATE */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/10">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Layers className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              User Password Reset & Account Unlock (USER.PASS.RESET)
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Unlock locked bank teller accounts, issue temporary login credentials, and manage
              credential expiration for staff. Select an active profile or enter a User ID.
            </p>

            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-md">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => fetchRecord(u.id, "EDIT")}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-card border border-border/80 hover:border-primary/50 hover:bg-accent text-foreground transition-all flex items-center gap-1"
                >
                  <KeyRound className="size-3 text-primary" />
                  {u.id} - {u.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE SECURITY PROFILE */
          <div className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full space-y-4 py-4">
            {/* Status Banner */}
            <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formData.accountStatus === "LOCKED" ? (
                  <ShieldAlert className="size-5 text-destructive" />
                ) : formData.accountStatus === "PASSWORD_EXPIRED" ? (
                  <RefreshCw className="size-5 text-amber-500" />
                ) : (
                  <UserCheck className="size-5 text-emerald-500" />
                )}
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    Account Status: {formData.accountStatus}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Failed login attempts: {formData.failedAttempts} | Last changed:{" "}
                    {formData.lastPasswordChange || "Never"}
                  </div>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  {formData.accountStatus === "LOCKED" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleUnlockAccount}
                      className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                    >
                      <Unlock className="size-3.5" /> Unlock Account
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateTempPassword}
                    className="h-7 text-xs gap-1"
                  >
                    <KeyRound className="size-3.5" /> Generate Temp Password
                  </Button>
                </div>
              )}
            </div>

            {/* Field Grid */}
            <div className="space-y-3 p-4 rounded-lg border border-border bg-card/50">
              {/* Field 1: User ID */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Label className="w-44 text-xs font-medium text-foreground">
                  User ID (recordId)
                </Label>
                <Input
                  value={formData.recordId}
                  disabled
                  className="h-8 max-w-xs font-mono text-xs bg-muted/30"
                />
              </div>

              {/* Field 2: Bank ID */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Label className="w-44 text-xs font-medium text-foreground">Staff Bank ID</Label>
                <Input
                  value={formData.bankId}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bankId: e.target.value.toUpperCase() }))
                  }
                  placeholder="e.g. B-10029"
                  className="h-8 max-w-xs font-mono text-xs"
                />
              </div>

              {/* Field 3: Full Name */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Label className="w-44 text-xs font-medium text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.fullName}
                  disabled={isReadOnly}
                  onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="h-8 flex-1 text-xs"
                />
              </div>

              {/* Field 4: Branch & Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <Label className="w-44 text-xs font-medium text-foreground">Branch Code</Label>
                  <Input
                    value={formData.branchCode}
                    disabled={isReadOnly}
                    onChange={(e) => setFormData((p) => ({ ...p, branchCode: e.target.value }))}
                    className="h-8 font-mono text-xs flex-1"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <Label className="w-24 text-xs font-medium text-foreground">User Group</Label>
                  <Input
                    value={formData.userGroup}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, userGroup: e.target.value.toUpperCase() }))
                    }
                    className="h-8 font-mono text-xs flex-1"
                  />
                </div>
              </div>

              {/* Field 5: Account Status Selection */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Label className="w-44 text-xs font-medium text-foreground">Security Status</Label>
                <Select
                  value={formData.accountStatus}
                  disabled={isReadOnly}
                  onValueChange={(val) => {
                    if (val)
                      setFormData((p) => ({
                        ...p,
                        accountStatus: val as UserPassResetRecord["accountStatus"],
                      }));
                  }}
                >
                  <SelectTrigger className="h-8 text-xs max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE" className="text-xs text-emerald-500">
                      ACTIVE
                    </SelectItem>
                    <SelectItem value="LOCKED" className="text-xs text-destructive">
                      LOCKED
                    </SelectItem>
                    <SelectItem value="PASSWORD_EXPIRED" className="text-xs text-amber-500">
                      PASSWORD_EXPIRED
                    </SelectItem>
                    <SelectItem value="SUSPENDED" className="text-xs text-muted-foreground">
                      SUSPENDED
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Field 6: Temporary Password (if generated) */}
              {formData.temporaryPassword && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2.5 rounded border border-primary/30 bg-primary/5">
                  <Label className="w-44 text-xs font-semibold text-primary">
                    Temporary Password
                  </Label>
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={formData.temporaryPassword}
                      readOnly
                      className="h-8 font-mono font-bold text-xs bg-background text-primary"
                    />
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                      Must change on login
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
