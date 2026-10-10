"use client";

import type { MenuRef, Role } from "@/lib/schemas/user-group-schema";
import { MenuPermissionPanel } from "./matrix/menu-permission-panel";
import { RolePermissionPanel } from "./matrix/role-permission-panel";

interface UserGroupMatrixTabProps {
  menus: MenuRef[];
  roles: Role[];
  selectedMenuIds: string[];
  selectedRoleIds: string[];
  onToggleMenu: (menuId: string) => void;
  onSetMenusBulk: (menuIds: string[], select: boolean) => void;
  onToggleRole: (roleId: string) => void;
  isReadOnly?: boolean;
}

export function UserGroupMatrixTab({
  menus,
  roles,
  selectedMenuIds,
  selectedRoleIds,
  onToggleMenu,
  onSetMenusBulk,
  onToggleRole,
  isReadOnly,
}: UserGroupMatrixTabProps) {
  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-3 overflow-hidden p-0">
      {/* 60% Left Panel: Authorized Menus Checklist */}
      <MenuPermissionPanel
        menus={menus}
        selectedMenuIds={selectedMenuIds}
        onToggleMenu={onToggleMenu}
        onSetMenusBulk={onSetMenusBulk}
        isReadOnly={isReadOnly}
      />

      {/* 40% Right Panel: Security Roles Matrix */}
      <RolePermissionPanel
        roles={roles}
        selectedRoleIds={selectedRoleIds}
        onToggleRole={onToggleRole}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
