"use client";

import { AlertCircle, Building2, Check, ChevronsUpDown, RefreshCw } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { appConfig } from "@/lib/config";
import { cn, toTitleCase } from "@/lib/utils";
import { useSessionStore } from "@/store";

interface BranchSwitcherProps {
  className?: string;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
}

export function BranchSwitcher({
  className,
  triggerClassName,
  align = "end",
}: BranchSwitcherProps = {}) {
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
    fetch(appConfig.routes.api.branches)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setBranches(
            json.data.map((b: { recordId: string; branchTitle: string }) => ({
              code: b.recordId,
              name: b.branchTitle,
              type: b.recordId === appConfig.centralBranch ? "Head Office" : "General",
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

  const activeBranchCode = currentBranch ?? appConfig.centralBranch;
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
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 px-2 border-border/80 hover:bg-accent min-w-0 flex items-center justify-between w-full text-xs font-normal rounded",
                triggerClassName,
              )}
            />
          }
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
            {branchLoading ? (
              <Skeleton className="h-3.5 w-32 rounded" />
            ) : (
              <span className="truncate text-xs font-medium">
                {branchError
                  ? "Branch Error"
                  : activeBranchObj
                    ? toTitleCase(activeBranchObj.name)
                    : `[${activeBranchCode}]`}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-1 size-3 shrink-0 opacity-40" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="w-64 p-1 rounded border border-border/80 shadow-md"
        >
          {/* Minimal Search Input */}
          <div className="p-1">
            <Input
              placeholder="Search branch..."
              className="h-7 text-xs bg-muted/40 rounded border-border/80"
              value={branchSearch}
              onChange={(e) => setBranchSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              disabled={Boolean(branchError)}
            />
          </div>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuGroup className="max-h-56 overflow-y-auto p-0.5 space-y-0.5 scrollbar-thin">
            {branchLoading ? (
              <div className="py-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <RefreshCw className="size-3 animate-spin text-primary" />
                <span>Loading...</span>
              </div>
            ) : branchError ? (
              <div className="p-2 text-center text-xs space-y-1.5">
                <div className="flex items-center justify-center gap-1 text-destructive font-medium text-[11px]">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>Failed to load branches</span>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => loadBranches()}
                  className="h-6 text-[11px] gap-1 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <RefreshCw className="size-2.5" />
                  <span>Retry</span>
                </Button>
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="py-2 text-center text-[11px] text-muted-foreground">
                No branches found
              </div>
            ) : (
              filteredBranches.map((b) => (
                <DropdownMenuItem
                  key={b.code}
                  onSelect={() => handleBranchSwitch(b.code, b.name)}
                  className="flex items-center justify-between py-1.5 px-2 cursor-pointer focus:bg-accent text-xs gap-1.5 rounded"
                >
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1 py-0.2 rounded shrink-0">
                      {b.code}
                    </span>
                    <span className="truncate text-xs font-normal">{toTitleCase(b.name)}</span>
                  </div>
                  {activeBranchCode === b.code && (
                    <Check className="size-3 shrink-0 text-primary" />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
