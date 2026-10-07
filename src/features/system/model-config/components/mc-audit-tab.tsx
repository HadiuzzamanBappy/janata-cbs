"use client";

import { Calendar, Code2, Hash, Shield, ShieldAlert, ShieldCheck, User } from "lucide-react";
import {
  AUDIT_FIELD_REGISTRY,
  AUDIT_SECTIONS,
  getAuditFieldValue,
  type AuditFieldDef,
} from "../config/audit-fields";
import type { ModelConfigRecord } from "../types";

interface McAuditTabProps {
  formData: ModelConfigRecord;
}

function renderFieldIcon(icon: AuditFieldDef["icon"]) {
  switch (icon) {
    case "user":
      return <User className="size-3 text-muted-foreground/70" />;
    case "shield":
      return <ShieldCheck className="size-3 text-muted-foreground/70" />;
    case "calendar":
      return <Calendar className="size-3 text-muted-foreground/70" />;
    case "hash":
      return <Hash className="size-3 text-muted-foreground/70" />;
    case "code":
      return <Code2 className="size-3 text-muted-foreground/70" />;
    case "alert":
      return <ShieldAlert className="size-3 text-muted-foreground/70" />;
    default:
      return <Hash className="size-3 text-muted-foreground/70" />;
  }
}

export function McAuditTab({ formData }: McAuditTabProps) {
  const audit = formData.auditData;

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="max-w-3xl space-y-2">
        {AUDIT_SECTIONS.map((section) => {
          const fields = AUDIT_FIELD_REGISTRY.filter((f) => f.section === section.id);

          // Section: DEVELOPMENT
          if (section.id === "DEVELOPMENT") {
            return (
              <div
                key={section.id}
                className="rounded border border-border/80 bg-card/60 p-2.5 shadow-2xs"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 mb-2 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Code2 className="size-3.5 text-primary" />
                    <span>{section.title}</span>
                  </div>
                  {section.wireTag && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {section.wireTag}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {fields.map((field) => {
                    const val = getAuditFieldValue(formData, field.path);
                    return (
                      <div
                        key={field.path}
                        className="flex items-center justify-between p-2 rounded border border-border/50 bg-background/50"
                      >
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          {renderFieldIcon(field.icon)}
                          {field.label} ({field.wireName})
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {val ? String(val) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Section: LEDGER
          if (section.id === "LEDGER") {
            return (
              <div
                key={section.id}
                className="rounded border border-border/80 bg-card/60 p-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <Shield className="size-3.5 text-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      {section.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      audit?.recStatus === "AU" || audit?.recStatus === "LIVE"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : audit?.recStatus === "HLD"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-muted text-muted-foreground border-border/60"
                    }`}
                  >
                    STATUS: {audit?.recStatus || "NEW / DRAFT"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {fields.map((field) => {
                    const val = getAuditFieldValue(formData, field.path);
                    const isRevision = field.wireName === "recCurrNumber";
                    return (
                      <div
                        key={field.path}
                        className="flex items-center justify-between p-2 rounded border border-border/50 bg-background/50"
                      >
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          {renderFieldIcon(field.icon)}
                          {field.label} ({field.wireName})
                        </span>
                        <span
                          className={`font-mono font-semibold ${
                            isRevision ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {isRevision ? `#${val ?? 1}` : val ? String(val) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Section: PERSONNEL SIGN-OFF
          if (section.id === "PERSONNEL") {
            return (
              <div
                key={section.id}
                className="rounded border border-border/80 bg-card/60 p-2.5 shadow-2xs"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 mb-2 border-b border-border/60">
                  {section.title}
                </div>

                <div className="space-y-1.5 text-xs">
                  {fields.map((field) => {
                    const isAuthorizer = field.wireName === "recAuthorizer";
                    const userVal = isAuthorizer
                      ? audit?.recAuthorizer || "SYSUSER"
                      : audit?.recInputter || "SYSUSER";
                    const timeVal = isAuthorizer ? audit?.recAuthTime : audit?.recInputTime;

                    return (
                      <div
                        key={field.path}
                        className="p-2 rounded border border-border/60 bg-background/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`size-5 rounded flex items-center justify-center shrink-0 ${
                              isAuthorizer
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {isAuthorizer ? (
                              <ShieldCheck className="size-3" />
                            ) : (
                              <User className="size-3" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {field.label} ({field.wireName})
                            </div>
                            {field.description && (
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {field.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="sm:text-right font-mono">
                          <div className="font-semibold text-foreground">{userVal}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 sm:justify-end">
                            <Calendar className="size-2.5" />
                            {timeVal || "—"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
