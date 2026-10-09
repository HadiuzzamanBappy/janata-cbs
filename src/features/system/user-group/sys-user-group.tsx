"use client";

import { FileCode, FileText, History, Layers, ShieldCheck } from "lucide-react";
import * as React from "react";
import type { CbsScreenProps as ScreenProps } from "@/lib/cbs-screen";
import { CbsScreenScaffold, type CbsScreenTab, getDefaultMoreActions } from "@/lib/cbs-screen";
import { UserGroupAuditTab } from "./components/user-group-audit-tab";
import { UserGroupGeneralTab } from "./components/user-group-general-tab";
import { UserGroupJsonTab } from "./components/user-group-json-tab";
import { UserGroupMatrixTab } from "./components/user-group-matrix-tab";
import { useUserGroup } from "./hooks/use-user-group";

type UserGroupTabKey = "general" | "matrix" | "audit" | "json";

export function SysUserGroup({ command, tabId }: ScreenProps) {
  const initialId = React.useMemo(() => {
    const parts = (command || "").trim().split(/\s+/);
    return parts.length > 1 ? parts[1] : undefined;
  }, [command]);

  const {
    recordId,
    setRecordId,
    mode,
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
  } = useUserGroup(initialId, tabId);

  const [activeTab, setActiveTab] = React.useState<UserGroupTabKey>("general");
  const isReadOnly = mode !== "I";



  const availableItems = React.useMemo(
    () =>
      groupsPool.map((g) => ({
        id: g.id,
        label: g.label,
        details: g.details,
      })),
    [groupsPool],
  );

  const tabs: CbsScreenTab<UserGroupTabKey>[] = React.useMemo(
    () => [
      {
        id: "general",
        label: "General",
        icon: <FileText className="size-3 text-muted-foreground" />,
        content: (
          <UserGroupGeneralTab
            formData={formData}
            setFormData={setFormData}
            isReadOnly={isReadOnly}
            validationErrors={validationErrors}
          />
        ),
      },
      {
        id: "matrix",
        label: "Permissions Matrix",
        icon: <ShieldCheck className="size-3 text-emerald-500" />,
        content: (
          <UserGroupMatrixTab
            menus={menus}
            roles={roles}
            selectedMenuIds={formData.menuIds}
            selectedRoleIds={formData.roleIds}
            onToggleMenu={toggleMenu}
            onSetMenusBulk={setMenusBulk}
            onToggleRole={toggleRole}
            isReadOnly={isReadOnly}
          />
        ),
      },
      {
        id: "audit",
        label: "Audit Trail",
        icon: <History className="size-3 text-primary" />,
        content: <UserGroupAuditTab formData={formData} />,
      },
      {
        id: "json",
        label: "JSON Output",
        icon: <FileCode className="size-3 text-amber-500" />,
        content: <UserGroupJsonTab formData={formData} />,
      },
    ],
    [
      formData,
      isReadOnly,
      menus,
      roles,
      setFormData,
      setMenusBulk,
      toggleMenu,
      toggleRole,
      validationErrors,
    ],
  );

  return (
    <CbsScreenScaffold<UserGroupTabKey>
      title="User Group & Menu Permissions"
      commandCode="USER.GROUP"
      recordId={recordId}
      mode={mode}
      onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
      onRecordSearch={(searchedId) => setRecordId(searchedId.toUpperCase())}
      onCreateNew={handleCreateNew}
      onReturnToSearch={resetToIdle}
      onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "TELLER.GRP") : undefined}
      onValidate={handleValidate}
      onSubmit={handleSubmit}
      onAuthorizeReverse={handleAuthorize}
      onView={() => recordId && fetchRecord(recordId, "S")}
      onAmend={() => recordId && fetchRecord(recordId, "I")}
      submitting={submitting || loading}
      availableItems={availableItems}
      variant="admin-tabs"
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      validationErrors={validationErrors}
      auditData={formData.auditData}
      rightTabContent={
        <div className="text-[11px] font-mono text-muted-foreground hidden sm:flex items-center gap-1.5">
          <Layers className="size-3" />
          <span>SYS_USER_GROUP</span>
        </div>
      }
      moreActions={[
        {
          label: "Toggle Group Active Status",
          onClick: () => setFormData((p) => ({ ...p, isActive: !p.isActive })),
          requiredRight: "A",
        },
        ...getDefaultMoreActions("USER_GROUP"),
      ]}
    />
  );
}
