"use client";

import { AlertCircle, Building2, Check, ChevronsUpDown, RefreshCw } from "lucide-react";
import * as React from "react";
import { useSessionStore } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export function BranchSwitcher() {
  const [branchSearch, setBranchSearch] = React.useState("");
  const [branches, setBranches] = React.useState<
    Array<{ code: string; name: string; type: string }>
  >([]);
  const [branchLoading, setBranchLoading] = React.useState(true);
  const [branchError, setBranchError] = React.useState<string | null>(null);

  const { currentBranch, setBranch } = useSessionStore();

  const loadBranches = React.useCallback(() => {
    setBranchLoading(true);
    setBranchError(null);
    fetch("/api/branches")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setBranches(
            json.data.map((b: { recordId: string; branchTitle: string }) => ({
              code: b.recordId,
              name: b.branchTitle,
              type: b.recordId === "JB9999" ? "Head Office" : "General",
            })),
          );
        } else {
          setBranchError(json.error || "Failed to load branch list");
        }
      })
      .catch((err) => {
        setBranchError(err?.message || "Failed to connect to branch service");
      })
      .finally(() => {
        setBranchLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const activeBranchCode = currentBranch ?? "JB9999";
  const activeBranchObj =
    branches.find((b) => b.code === activeBranchCode) ?? (branches.length > 0 ? branches[0] : null);

  const filteredBranches = React.useMemo(() => {
    if (!branchSearch.trim()) return branches;
    const q = branchSearch.trim().toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q),
    );
  }, [branchSearch, branches]);

  const handleBranchSwitch = (code: string, name: string) => {
    setBranch(code);
    toast.add({
      title: "Branch Context Switched",
      description: `Active session roaming changed to ${name} [${code}].`,
      type: "success",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 sm:px-3 border-border/80 hover:bg-accent min-w-0"
          />
        }
      >
        <Building2 className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate max-w-[140px] sm:max-w-[220px] text-xs font-medium">
          {branchLoading
            ? "Loading..."
            : branchError
              ? "Branch Load Error"
              : activeBranchObj
                ? `[${activeBranchObj.code}] ${activeBranchObj.name}`
                : `[${activeBranchCode}]`}
        </span>
        <ChevronsUpDown className="ml-2 size-3 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px]">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="text-xs text-muted-foreground mb-2">Switch Active Branch</div>
          <Input
            placeholder="Search by code or name..."
            className="h-8 text-xs bg-muted/50"
            value={branchSearch}
            onChange={(e) => setBranchSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            disabled={Boolean(branchError)}
          />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
          {branchLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="size-3.5 animate-spin text-primary" />
              <span>Loading branches...</span>
            </div>
          ) : branchError ? (
            <div className="p-3 text-center text-xs space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-destructive font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>Failed to load branches</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight px-1">{branchError}</p>
              <Button
                variant="outline"
                size="xs"
                onClick={() => loadBranches()}
                className="mt-1 h-7 text-xs gap-1.5 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="size-3" />
                <span>Refresh / Retry</span>
              </Button>
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="p-2 text-center text-xs text-muted-foreground">No branches found</div>
          ) : (
            filteredBranches.map((b) => (
              <DropdownMenuItem
                key={b.code}
                onSelect={() => handleBranchSwitch(b.code, b.name)}
                className="flex items-center justify-between py-2 px-2.5 cursor-pointer focus:bg-accent text-xs gap-2"
              >
                <span className="truncate flex items-center gap-1.5 font-medium">
                  <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded shrink-0">
                    [{b.code}]
                  </span>
                  <span className="truncate">{b.name}</span>
                </span>
                {activeBranchCode === b.code && (
                  <Check className="size-3.5 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
