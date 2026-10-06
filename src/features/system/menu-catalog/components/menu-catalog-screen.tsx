"use client";

import { Terminal } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CbsFormHeader, CbsIdleState } from "@/features/screens/shared";
import type { ScreenProps } from "@/features/screens/types";
import { useMenuCatalog } from "../hooks/use-menu-catalog";

export function MenuCatalogScreen({ command }: ScreenProps) {
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
    loading,
    submitting,
    itemsPool,
    fetchRecord,
    handleCreateNew,
    handleSubmit,
    handleAuthorize,
    resetToIdle,
  } = useMenuCatalog(initialId);

  const availableItems = React.useMemo(
    () =>
      itemsPool.map((item) => ({
        id: item.recordId,
        label: item.label,
        details: `Command: ${item.command} | Status: LIVE`,
      })),
    [itemsPool],
  );

  const isReadOnly = mode === "VIEW";

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden select-none font-sans">
      {/* 1. EXACT CBS FORM HEADER STRIP */}
      <CbsFormHeader
        title="Menu Item Catalog"
        commandCode="MENU"
        recordId={recordId}
        onRecordIdChange={(newId) => setRecordId(newId.toUpperCase())}
        onRecordSearch={(searchedId) => fetchRecord(searchedId, "EDIT")}
        onCreateNew={handleCreateNew}
        onReturnToSearch={resetToIdle}
        onReset={mode !== "IDLE" ? () => fetchRecord(recordId || "1") : undefined}
        onSubmit={mode !== "IDLE" && !isReadOnly ? handleSubmit : undefined}
        onAuthorizeReverse={mode !== "IDLE" ? handleAuthorize : undefined}
        onView={() => recordId && fetchRecord(recordId, "VIEW")}
        onAmend={() => recordId && setMode("EDIT")}
        mode={mode}
        submitting={submitting || loading}
        availableItems={availableItems}
        moreActions={[
          {
            label: "Toggle Active Status",
            onClick: () => setFormData((p) => ({ ...p, isActive: !p.isActive })),
            requiredRight: "A",
          },
        ]}
      />

      {/* 2. MAIN SCREEN BODY (Exact Form IDLE vs Input Fields) */}
      <div className="flex-1 overflow-auto p-3">
        {mode === "IDLE" ? (
          <div className="h-full flex flex-col items-center justify-center">
            <CbsIdleState title="Menu Item Catalog" code="MENU" />
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-md -mt-8 mb-4">
              {availableItems.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => fetchRecord(item.id, "EDIT")}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-card border border-border/80 hover:border-primary/50 hover:bg-accent text-foreground transition-all"
                >
                  #{item.id} - {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* FORM INPUT GRID */
          <div className="max-w-3xl mx-auto space-y-4 py-4">
            {/* Field 1: Record ID */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="w-48 text-xs font-medium text-foreground">Record ID (menuId)</Label>
              <Input
                value={formData.recordId}
                disabled
                className="h-8 max-w-xs font-mono text-xs bg-muted/30"
              />
            </div>

            {/* Field 2: Label */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="w-48 text-xs font-medium text-foreground">
                Action Label <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.label}
                disabled={isReadOnly}
                onChange={(e) => setFormData((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Open Savings Account"
                className="h-8 flex-1 text-xs"
              />
            </div>

            {/* Field 3: Target Command */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="w-48 text-xs font-medium text-foreground">
                Target Command <span className="text-destructive">*</span>
              </Label>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={formData.command}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, command: e.target.value.toUpperCase() }))
                  }
                  placeholder="e.g. ACCOUNT,SAVINGS I or INQ ACCT.BAL"
                  className="h-8 flex-1 font-mono text-xs"
                />
                <Badge variant="outline" className="h-6 font-mono text-[10px] gap-1 shrink-0">
                  <Terminal className="size-3" /> CBS
                </Badge>
              </div>
            </div>

            {/* Field 4: Description */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="w-48 text-xs font-medium text-foreground">Description</Label>
              <Input
                value={formData.description || ""}
                disabled={isReadOnly}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Detailed description of banking action"
                className="h-8 flex-1 text-xs"
              />
            </div>

            {/* Field 5: Status */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="w-48 text-xs font-medium text-foreground">Active Status</Label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  disabled={isReadOnly}
                  onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  className="size-4 rounded accent-primary"
                />
                <span className={formData.isActive ? "text-emerald-500 font-medium" : ""}>
                  {formData.isActive ? "Active (Live in catalog)" : "Inactive (Deprecated)"}
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
