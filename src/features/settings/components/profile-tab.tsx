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
    <div className="max-w-2xl space-y-5">
      {/* Primary User Header Card */}
      <div className="bg-background rounded-lg border border-border/50 p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-border/60">
              <User className="size-6" />
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg font-semibold tracking-tight truncate">
                {user.fullName}
              </h2>
              <div className="flex items-center text-xs text-muted-foreground gap-2">
                <span className="font-mono text-foreground font-medium">{user.userId}</span>
                <span>&bull;</span>
                <span className={user.userStatus === 1 ? "text-emerald-500 font-medium" : "text-muted-foreground"}>
                  {user.userStatus === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* User Roles placed on the right */}
          {Array.isArray(user.userRole) && user.userRole.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 pt-0.5">
              {user.userRole.map((role) => (
                <Badge key={role} variant="secondary" className="font-mono text-[10px] px-2 py-0.5">
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Real Properties Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Branch Info */}
        <div className="bg-background rounded-lg border border-border/50 p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <MapPin className="size-3.5 text-primary" />
            Branch
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{user.branchName}</p>
            <p className="text-xs text-muted-foreground font-mono">Code: {user.branchCode}</p>
          </div>
        </div>

        {/* Transaction Date */}
        <div className="bg-background rounded-lg border border-border/50 p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Calendar className="size-3.5 text-primary" />
            Business Transaction Date
          </div>
          <div>
            <p className="text-sm font-mono font-medium text-foreground">{user.txnDate}</p>
          </div>
        </div>

        {/* Privileges & Access Rights */}
        <div className="bg-background rounded-lg border border-border/50 p-4 shadow-xs space-y-3 sm:col-span-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Shield className="size-3.5 text-primary" />
            Access & Security
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex flex-col gap-1 p-2.5 rounded-md bg-muted/30 border border-border/40">
              <span className="text-muted-foreground text-[11px]">Accessibility</span>
              <span className="font-mono font-semibold text-foreground">{user.accessibility}</span>
            </div>

            <div className="flex flex-col gap-1 p-2.5 rounded-md bg-muted/30 border border-border/40">
              <span className="text-muted-foreground text-[11px]">Command Line</span>
              <span className="font-medium text-foreground">
                {user.commandLine ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="flex flex-col gap-1 p-2.5 rounded-md bg-muted/30 border border-border/40">
              <span className="text-muted-foreground text-[11px]">Initial Login</span>
              <span className="font-medium text-foreground">
                {user.initLogin ? "Required" : "No"}
              </span>
            </div>
          </div>

          {/* Function Rights (if present on session) */}
          {Array.isArray(user.functionRights) && user.functionRights.length > 0 && (
            <div className="pt-1 space-y-1.5">
              <span className="text-[11px] text-muted-foreground">Function Rights:</span>
              <div className="flex flex-wrap gap-1">
                {user.functionRights.map((right) => (
                  <Badge key={right} variant="outline" className="font-mono text-[10px] px-1.5 py-0">
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
