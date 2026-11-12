"use client";

import { useQuery } from "@tanstack/react-query";
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
import { cbsAuth, cbsQueries } from "@/lib/cbs-client";
import { clientConfig } from "@/lib/core-config";
import { cn, toTitleCase } from "@/lib/core-utils";
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
  const [open, setOpen] = React.useState(false);
  const [branchSearch, setBranchSearch] = React.useState("");
  const selectedItemRef = React.useRef<HTMLDivElement | null>(null);
  const { currentBranch, setBranch, user } = useSessionStore();

  const {
    data: branches = [],
    isLoading: branchLoading,
    error: queryError,
    refetch,
  } = useQuery(cbsQueries.branch.list());

  const branchError =
    queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;
  const loadBranches = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const activeBranchCode = currentBranch ?? user?.branchCode ?? clientConfig.centralBranch;
  const activeBranchObj =
    branches.find(
      (b) =>
        b.code === activeBranchCode ||
        (activeBranchCode && b.code.replace(/\D/g, "") === activeBranchCode.replace(/\D/g, "")),
    ) ?? (branches.length > 0 ? branches[0] : null);

  // Focus and scroll active branch into view when menu opens
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (selectedItemRef.current) {
          selectedItemRef.current.scrollIntoView({ block: "nearest" });
          selectedItemRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
    setBranchSearch("");
  }, [open]);

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

  const handleBranchSwitch = async (code: string, name: string) => {
    // 1. Immediately update client store and cookie
    setBranch(code);

    toast.add({
      title: "Branch Context Switched",
      description: `Active session roaming changed to ${name} [${code}].`,
      type: "success",
    });

    // 2. Synchronize to server session and Redis store
    try {
      await cbsAuth.updateBranch(code, name);
    } catch {
      // Graceful: client cookie and wire payload resolution still guarantee correct branch context
    }
  };

  return (
    <div className={className}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 px-2 border-border/80 hover:bg-accent min-w-0 flex items-center justify-between w-full text-xs font-normal",
                triggerClassName,
              )}
            />
          }
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
            {branchLoading ? (
              <Skeleton className="h-3.5 w-32" />
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
        <DropdownMenuContent align={align} className="w-64 p-1 border border-border/80 shadow-md">
          {/* Minimal Search Input */}
          <div className="p-1">
            <Input
              placeholder="Search branch..."
              className="h-7 text-xs bg-muted/40 border-border/80"
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
              filteredBranches.map((b) => {
                const isSelected = activeBranchObj?.code === b.code;
                return (
                  <DropdownMenuItem
                    key={b.code}
                    ref={isSelected ? selectedItemRef : undefined}
                    onClick={() => {
                      handleBranchSwitch(b.code, b.name);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between py-1.5 px-2 cursor-pointer focus:bg-accent text-xs gap-1.5",
                      isSelected && "bg-accent/60 font-medium",
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1 py-0.2 rounded-xs shrink-0">
                        {b.code}
                      </span>
                      <span className="truncate text-xs font-normal">{toTitleCase(b.name)}</span>
                    </div>
                    {isSelected && <Check className="size-3 shrink-0 text-primary" />}
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
