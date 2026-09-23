"use client";

import { Calendar, MapPin, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/components/providers/session-provider";

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
    <div className="max-w-2xl space-y-6">
      {/* Primary Info Card */}
      <div className="bg-background rounded-lg border border-border/50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-border/60">
            <User className="size-8" />
          </div>
          <div className="flex-1 space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">
              {user.fullName || "Unknown User"}
            </h2>
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <span className="font-mono">{user.userId || "No ID"}</span>
              <span>&bull;</span>
              <span className="text-primary">
                {user.userStatus === 1 ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {(user.userRole || []).map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="font-mono text-[10px]"
                >
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Branch Info */}
        <div className="bg-background rounded-lg border border-border/50 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="size-4 text-muted-foreground" />
            Branch Assignment
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-sm font-medium">
              {user.branchName || "Unknown Branch"}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {user.branchCode || "N/A"}
            </p>
          </div>
        </div>

        {/* Date Info */}
        <div className="bg-background rounded-lg border border-border/50 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="size-4 text-muted-foreground" />
            Session Dates
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-sm">
              Txn Date:{" "}
              <span className="font-mono">{user.txnDate || "N/A"}</span>
            </p>
            {user.lastTxnDate && (
              <p className="text-xs text-muted-foreground">
                Last Txn: <span className="font-mono">{user.lastTxnDate}</span>
              </p>
            )}
            {user.nextDate && (
              <p className="text-xs text-muted-foreground">
                Next Date: <span className="font-mono">{user.nextDate}</span>
              </p>
            )}
          </div>
        </div>

        {/* Access Info */}
        <div className="bg-background rounded-lg border border-border/50 p-5 shadow-sm space-y-3 md:col-span-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="size-4 text-muted-foreground" />
            System Privileges
          </div>
          <div className="pl-6 flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Accessibility:</span>
              <Badge variant="outline">{user.accessibility || "N/A"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Command Line:</span>
              <Badge variant={user.commandLine ? "default" : "secondary"}>
                {user.commandLine ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Initial Login:</span>
              <Badge variant={user.initLogin ? "destructive" : "secondary"}>
                {user.initLogin ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
