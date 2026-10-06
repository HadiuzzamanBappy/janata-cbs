"use client";

import { Calendar, MapPin, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/store";

export function ProfileTab() {
  const { user } = useSessionStore();

  if (!user) {
    return (
      <div className="max-w-2xl">
        <div className="bg-background rounded-lg border border-border/50 p-6 flex items-center justify-center h-40 shadow-sm">
          <p className="text-muted-foreground text-sm animate-pulse">
            Loading profile information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-3">
      {/* Primary User Header Card */}
      <div className="bg-background rounded-lg border border-border/50 p-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <User className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight truncate">{user.fullName}</h2>
              <div className="flex items-center text-[11px] text-muted-foreground gap-1.5">
                <span className="font-mono text-foreground font-medium">{user.userId}</span>
                <span>&bull;</span>
                <span
                  className={
                    user.userStatus === 1 ? "text-emerald-500 font-medium" : "text-muted-foreground"
                  }
                >
                  {user.userStatus === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* User Roles placed on the right */}
          {Array.isArray(user.userRole) && user.userRole.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
              {user.userRole.map((role) => (
                <Badge key={role} variant="secondary" className="font-mono text-[9px] px-1.5 py-0">
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Real Properties Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Branch Info */}
        <div className="bg-background rounded-lg border border-border/50 p-3 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <MapPin className="size-3 text-primary" />
            Branch
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground truncate">{user.branchName}</p>
            <p className="text-[11px] text-muted-foreground font-mono">Code: {user.branchCode}</p>
          </div>
        </div>

        {/* Transaction Date */}
        <div className="bg-background rounded-lg border border-border/50 p-3 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Calendar className="size-3 text-primary" />
            Business Date
          </div>
          <div>
            <p className="text-xs font-mono font-medium text-foreground">{user.txnDate}</p>
          </div>
        </div>

        {/* Privileges & Access Rights */}
        <div className="bg-background rounded-lg border border-border/50 p-3 shadow-xs space-y-2 sm:col-span-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Shield className="size-3 text-primary" />
            Access & Security
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col gap-0.5 p-2 rounded-md bg-muted/20 border border-border/40">
              <span className="text-muted-foreground text-[10px]">Accessibility</span>
              <span className="font-mono font-medium text-foreground text-xs">
                {user.accessibility}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 p-2 rounded-md bg-muted/20 border border-border/40">
              <span className="text-muted-foreground text-[10px]">Command Line</span>
              <span className="font-medium text-foreground text-xs">
                {user.commandLine ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 p-2 rounded-md bg-muted/20 border border-border/40">
              <span className="text-muted-foreground text-[10px]">Initial Login</span>
              <span className="font-medium text-foreground text-xs">
                {user.initLogin ? "Required" : "No"}
              </span>
            </div>
          </div>

          {/* Function Rights (if present on session) */}
          {Array.isArray(user.functionRights) && user.functionRights.length > 0 && (
            <div className="pt-0.5 space-y-1">
              <span className="text-[10px] text-muted-foreground">Function Rights:</span>
              <div className="flex flex-wrap gap-1">
                {user.functionRights.map((right) => (
                  <Badge key={right} variant="outline" className="font-mono text-[9px] px-1.5 py-0">
                    {right}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
