"use client";

import {
  ListChecks,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MenuRef {
  menuId: string;
  label: string;
  command: string;
}
interface Role {
  roleId: string;
  roleCode: string;
  roleDesc: string;
}
interface Group {
  groupLabel: string;
  menuIds: string[];
  roleIds: string[];
}

export function UserGroups({ command: _command }: { command?: string }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [idText, setIdText] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(false);

  const [menus, setMenus] = React.useState<MenuRef[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [menuFilter, setMenuFilter] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [group, setGroup] = React.useState<Group | null>(null);

  React.useEffect(() => {
    // Fetch reference data on mount
    fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        servicePath: "default",
        requestType: "GRL",
        controlName: "MENU",
        recordFunction: "L",
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.statusCode === 200 && res.data?.records) {
          setMenus(
            res.data.records.map((m: any) => ({
              menuId: m.recordId,
              label: m.label,
              command: m.command,
            })),
          );
        }
      })
      .catch(() => {});

    fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        servicePath: "default",
        requestType: "GRL",
        controlName: "USER.ROLE",
        recordFunction: "L",
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.statusCode === 200 && res.data?.records) {
          setRoles(
            res.data.records.map((r: any) => ({
              roleId: r.recordId,
              roleCode: r.roleCode,
              roleDesc: r.roleDesc,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchGroup = async () => {
    if (!idText) {
      setError("An ID is required to get record details.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowForm(false);
    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "GET",
          controlName: "USER.GROUP",
          recordFunction: "S",
          recordId: idText,
        }),
      });
      const res = await response.json();
      if (response.ok && res.statusCode === 200) {
        setGroup(res.data || { groupLabel: "", menuIds: [], roleIds: [] });
        setShowForm(true);
        setIsLocked(true);
      } else if (res.statusCode === 404) {
        setGroup({ groupLabel: "", menuIds: [], roleIds: [] });
        setShowForm(true);
        setIsLocked(true);
      } else {
        setError(
          res.errors ? res.errors.join(", ") : "Failed to fetch record.",
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!group?.groupLabel) {
      setError("Group description is required");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "PUT",
          controlName: "USER.GROUP",
          recordFunction: "I",
          recordId: idText,
          data: group,
        }),
      });
      const res = await response.json();
      if (response.ok && (res.statusCode === 200 || res.statusCode === 201)) {
        setSuccess(res.message || "Group saved successfully.");
        setShowForm(false);
        setIdText("");
        setIsLocked(false);
      } else {
        setError(
          res.errors
            ? res.errors.join(", ")
            : res.message || "Failed to save group.",
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMenus = React.useMemo(() => {
    const q = menuFilter.toLowerCase();
    return q
      ? menus.filter(
          (m) =>
            m.label.toLowerCase().includes(q) ||
            m.command.toLowerCase().includes(q),
        )
      : menus;
  }, [menus, menuFilter]);

  const filteredRoles = React.useMemo(() => {
    const q = roleFilter.toLowerCase();
    return q
      ? roles.filter((r) => r.roleCode.toLowerCase().includes(q))
      : roles;
  }, [roles, roleFilter]);

  const toggleMenu = (id: string) =>
    setGroup((g) =>
      g
        ? {
            ...g,
            menuIds: g.menuIds.includes(id)
              ? g.menuIds.filter((x) => x !== id)
              : [...g.menuIds, id],
          }
        : g,
    );
  const toggleRole = (id: string) =>
    setGroup((g) =>
      g
        ? {
            ...g,
            roleIds: g.roleIds.includes(id)
              ? g.roleIds.filter((x) => x !== id)
              : [...g.roleIds, id],
          }
        : g,
    );

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!showForm || loading}
          >
            <Save className="w-4 h-4 mr-2 text-blue-500" /> Save
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm mr-2 text-gray-700 dark:text-gray-300">
            USER.GROUP
          </span>
          <div className="flex relative">
            <Input
              className="w-64 h-8 text-sm pr-8"
              placeholder="Enter Group ID (e.g. ADMIN)"
              value={idText}
              onChange={(e) => setIdText(e.target.value.toUpperCase())}
              disabled={isLocked || loading}
              onKeyDown={(e) => e.key === "Enter" && fetchGroup()}
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-0 h-8 w-8 p-0"
              onClick={fetchGroup}
              disabled={loading || isLocked}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
          {isLocked && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsLocked(false);
                setShowForm(false);
                setIdText("");
              }}
              className="h-8 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-green-500 text-green-700 bg-green-50">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {showForm && group && (
          <Tabs defaultValue="builder" className="w-full h-full flex flex-col">
            <TabsList className="w-auto self-start bg-gray-100/80 dark:bg-gray-900 p-1 rounded-md">
              <TabsTrigger value="builder" className="text-sm px-4">
                Tree Builder
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-sm px-4">
                Audit
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="builder"
              className="flex-1 mt-6 focus:outline-none"
            >
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-6 p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                  <Users className="text-blue-500" />
                  <div className="flex flex-col flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Group Description
                    </label>
                    <Input
                      className="border-0 border-b border-gray-200 rounded-none px-0 h-8 focus-visible:ring-0 text-base"
                      placeholder="E.g. System Administrator"
                      value={group.groupLabel}
                      onChange={(e) =>
                        setGroup({ ...group, groupLabel: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Menus */}
                  <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col h-[500px]">
                    <div className="flex items-center gap-2 mb-4">
                      <ListChecks size={18} className="text-gray-500" />
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        Menus ({group.menuIds.length})
                      </h3>
                    </div>
                    <Input
                      placeholder="Filter menus..."
                      value={menuFilter}
                      onChange={(e) => setMenuFilter(e.target.value)}
                      className="mb-4"
                    />
                    <div className="flex-1 overflow-auto space-y-1 pr-2">
                      {filteredMenus.map((m) => (
                        <label
                          key={m.menuId}
                          className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={group.menuIds.includes(m.menuId)}
                            onChange={() => toggleMenu(m.menuId)}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {m.label}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {m.command}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col h-[500px]">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck size={18} className="text-gray-500" />
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        Roles ({group.roleIds.length})
                      </h3>
                    </div>
                    <Input
                      placeholder="Filter roles..."
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="mb-4"
                    />
                    <div className="flex-1 overflow-auto space-y-1 pr-2">
                      {filteredRoles.map((r) => (
                        <label
                          key={r.roleId}
                          className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={group.roleIds.includes(r.roleId)}
                            onChange={() => toggleRole(r.roleId)}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {r.roleCode}
                            </span>
                            <span className="text-xs text-gray-500">
                              {r.roleDesc}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audit">
              <div className="p-4 text-sm text-gray-500">
                Audit logs are managed by the engine.
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
