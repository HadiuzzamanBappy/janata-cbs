"use client";

import { Search, ShieldCheck } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Role } from "@/lib/schemas/user-group-schema";
import { cn } from "@/lib/utils";

interface RolePermissionPanelProps {
  roles: Role[];
  selectedRoleIds: string[];
  onToggleRole: (roleId: string) => void;
  isReadOnly?: boolean;
}

export function RolePermissionPanel({
  roles,
  selectedRoleIds,
  onToggleRole,
  isReadOnly,
}: RolePermissionPanelProps) {
  const [filter, setFilter] = React.useState("");

  const filteredRoles = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.roleCode.toLowerCase().includes(q) ||
        r.roleDesc.toLowerCase().includes(q) ||
        r.roleId.toLowerCase().includes(q),
    );
  }, [roles, filter]);

  const selectedIdSet = React.useMemo(() => new Set(selectedRoleIds), [selectedRoleIds]);

  return (
    <div className="w-full lg:w-96 border border-border/80 rounded-lg bg-card/40 flex flex-col overflow-hidden min-h-0 shrink-0">
      {/* Panel Header */}
      <div className="p-2.5 border-b border-border/80 flex items-center justify-between gap-2 bg-card/60 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-500" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Security Roles
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono px-1.5 py-0 text-emerald-500 border-emerald-500/30"
          >
            {selectedRoleIds.length} assigned
          </Badge>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-border/60 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search roles..."
            className="pl-8 h-7 text-xs bg-background/60"
          />
        </div>
      </div>

      {/* Roles List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredRoles.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No security roles match query.
          </div>
        ) : (
          <ul className="space-y-1.5 list-none p-0 m-0">
            {filteredRoles.map((r) => {
              const isChecked = selectedIdSet.has(r.roleId);
              return (
                <li key={r.roleId}>
                  <label
                    className={cn(
                      "flex items-start gap-2.5 p-2 rounded-md text-xs cursor-pointer transition-all border select-none",
                      isChecked
                        ? "bg-emerald-500/10 border-emerald-500/30 text-foreground shadow-2xs"
                        : "border-transparent hover:bg-muted/40 text-muted-foreground",
                      isReadOnly && "cursor-default",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isReadOnly}
                      onChange={() => onToggleRole(r.roleId)}
                      className="size-3.5 rounded accent-emerald-500 shrink-0 mt-0.5 cursor-pointer disabled:cursor-default"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground truncate">{r.roleCode}</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono px-1 py-0 h-3.5 text-muted-foreground border-border/60"
                        >
                          #{r.roleId}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                        {r.roleDesc}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
