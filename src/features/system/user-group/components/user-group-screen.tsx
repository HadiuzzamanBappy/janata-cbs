"use client";

import { CheckSquare, Layers, ListChecks, Search, ShieldCheck, Square } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormHeader } from "@/features/screens/forms/components/form-header";
import type { ScreenProps } from "@/features/screens/types";
import { useUserGroup } from "../hooks/use-user-group";

export function UserGroupScreen({ command }: ScreenProps) {
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
  } = useUserGroup(initialId);

  const [menuFilter, setMenuFilter] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");

  const filteredMenus = React.useMemo(() => {
    const q = menuFilter.trim().toLowerCase();
    if (!q) return menus;
    return menus.filter(
      (m) =>
        m.menuId.toLowerCase().includes(q) ||
        m.label.toLowerCase().includes(q) ||
        m.command.toLowerCase().includes(q),
    );
  }, [menus, menuFilter]);

  const filteredRoles = React.useMemo(() => {
    const q = roleFilter.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.roleCode.toLowerCase().includes(q) ||
        r.roleDesc.toLowerCase().includes(q) ||
        r.roleId.toLowerCase().includes(q),
    );
  }, [roles, roleFilter]);

  const menuIdSet = React.useMemo(() => new Set(formData.menuIds), [formData.menuIds]);
  const roleIdSet = React.useMemo(() => new Set(formData.roleIds), [formData.roleIds]);
  const isReadOnly = mode === "VIEW";

  const availableGroups = React.useMemo(
    () =>
      groupsPool.map((g) => ({
        id: g.id,
        label: g.label,
        details: g.details,
      })),
    [groupsPool],
  );

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden select-none font-sans">
      {/* 1. CBS FORM HEADER */}
      <FormHeader
        title="User Group & Menu Permissions"
        commandCode="USER.GROUP"
        recordId={recordId}
        onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
        onRecordSearch={(searchedId) => fetchRecord(searchedId, "EDIT")}
        onCreateNew={handleCreateNew}
        onReturnToSearch={resetToIdle}
        onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "TELLER.GRP") : undefined}
        onSubmit={mode !== "IDLE" && !isReadOnly ? handleSubmit : undefined}
        onAuthorizeReverse={mode !== "IDLE" ? handleAuthorize : undefined}
        onView={() => recordId && fetchRecord(recordId, "VIEW")}
        onAmend={() => recordId && setMode("EDIT")}
        mode={mode}
        submitting={submitting || loading}
        availableItems={availableGroups}
        moreActions={[
          {
            label: "Toggle Active Status",
            onClick: () => setFormData((p) => ({ ...p, isActive: !p.isActive })),
            requiredRight: "A",
          },
        ]}
      />

      {/* 2. BODY: IDLE vs PERMISSION MATRIX */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col">
        {mode === "IDLE" ? (
          /* EXACT FORM IDLE STATE */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/10">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Layers className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              User Group & Menu Permissions (USER.GROUP)
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Configure Role-Based Access Control and authorize which menus each user group can
              access. Select an existing group or press <strong>+</strong> to define a new role
              profile.
            </p>

            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-md">
              {availableGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => fetchRecord(g.id, "EDIT")}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-card border border-border/80 hover:border-primary/50 hover:bg-accent text-foreground transition-all"
                >
                  {g.id} - {g.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* PERMISSION MATRIX EDITOR */
          <div className="flex flex-col h-full gap-3 overflow-hidden">
            {/* Top metadata strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg border border-border bg-card/50 shrink-0">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-20 shrink-0">
                  Group ID
                </Label>
                <Input
                  value={formData.recordId}
                  disabled
                  className="h-8 font-mono text-xs bg-muted/30"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground w-24 shrink-0">
                  Group Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.groupLabel}
                  disabled={isReadOnly}
                  onChange={(e) => setFormData((p) => ({ ...p, groupLabel: e.target.value }))}
                  placeholder="e.g. Branch Frontline Tellers"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    disabled={isReadOnly}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                    className="size-4 rounded accent-primary"
                  />
                  <span className={formData.isActive ? "text-emerald-500 font-medium" : ""}>
                    {formData.isActive ? "Active Group" : "Inactive"}
                  </span>
                </label>
              </div>
            </div>

            {/* Split Matrix: Left Menus Checklist + Right Roles Checklist */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-hidden">
              {/* Left Column: Authorized Menu Checklist (2/3 width) */}
              <div className="lg:col-span-2 border border-border rounded-lg bg-card/40 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border/80 flex items-center justify-between gap-2 bg-card/60">
                  <div className="flex items-center gap-2">
                    <ListChecks className="size-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Authorized Menus
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {formData.menuIds.length} selected
                    </Badge>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setMenusBulk(
                            filteredMenus.map((m) => m.menuId),
                            true,
                          )
                        }
                        className="h-6 text-[10px] px-2 gap-1"
                      >
                        <CheckSquare className="size-3" /> Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setMenusBulk(
                            filteredMenus.map((m) => m.menuId),
                            false,
                          )
                        }
                        className="h-6 text-[10px] px-2 gap-1 text-muted-foreground"
                      >
                        <Square className="size-3" /> Clear
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-2 border-b border-border/60">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      value={menuFilter}
                      onChange={(e) => setMenuFilter(e.target.value)}
                      placeholder="Filter menus by ID, label, or command..."
                      className="pl-8 h-7 text-xs bg-background/60"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  <ul className="space-y-1 list-none p-0 m-0">
                    {filteredMenus.map((m) => {
                      const isChecked = menuIdSet.has(m.menuId);
                      return (
                        <li key={m.menuId}>
                          <label
                            className={`flex items-center gap-2 p-1.5 rounded-md text-xs cursor-pointer transition-all border ${
                              isChecked
                                ? "bg-primary/5 border-primary/30 text-foreground"
                                : "border-transparent hover:bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isReadOnly}
                              onChange={() => toggleMenu(m.menuId)}
                              className="size-3.5 rounded accent-primary shrink-0"
                            />
                            <span className="font-mono font-bold text-primary w-8 shrink-0">
                              #{m.menuId}
                            </span>
                            <span className="font-medium text-foreground truncate flex-1">
                              {m.label}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded truncate shrink-0">
                              {m.command}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Right Column: Assigned Security Roles (1/3 width) */}
              <div className="border border-border rounded-lg bg-card/40 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border/80 flex items-center justify-between gap-2 bg-card/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Assigned Roles
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {formData.roleIds.length}
                    </Badge>
                  </div>
                </div>

                <div className="p-2 border-b border-border/60">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      placeholder="Filter roles..."
                      className="pl-8 h-7 text-xs bg-background/60"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  <ul className="space-y-1 list-none p-0 m-0">
                    {filteredRoles.map((r) => {
                      const isChecked = roleIdSet.has(r.roleId);
                      return (
                        <li key={r.roleId}>
                          <label
                            className={`flex items-start gap-2 p-1.5 rounded-md text-xs cursor-pointer transition-all border ${
                              isChecked
                                ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                                : "border-transparent hover:bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isReadOnly}
                              onChange={() => toggleRole(r.roleId)}
                              className="size-3.5 rounded accent-emerald-500 shrink-0 mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-foreground truncate">
                                {r.roleCode}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {r.roleDesc}
                              </div>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
