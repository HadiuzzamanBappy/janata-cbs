"use client";

import { Calendar, Code2, Hash, Shield, ShieldAlert, ShieldCheck, User } from "lucide-react";
import {
  AUDIT_FIELD_REGISTRY,
  AUDIT_SECTIONS,
  getAuditFieldValue,
  type AuditFieldDef,
} from "../config/audit-fields";
import type { ModelConfigRecord } from "@/lib/schemas/model-config-schema";

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
    <div className="h-full overflow-y-auto p-3">
      <div className="max-w-3xl space-y-3">
        {AUDIT_SECTIONS.map((section) => {
          const fields = AUDIT_FIELD_REGISTRY.filter((f) => f.section === section.id);

          // Section: DEVELOPMENT
          if (section.id === "DEVELOPMENT") {
            return (
              <div
                key={section.id}
                className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
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

                <div className="space-y-1.5 text-xs">
                  {fields.map((field) => {
                    const val = getAuditFieldValue(formData, field.path);
                    return (
                      <div
                        key={field.path}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded border border-border/50 bg-background/40 hover:bg-background/70 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {renderFieldIcon(field.icon)}
                          <span className="font-medium text-foreground text-xs whitespace-nowrap">
                            {field.label}
                          </span>
                          {field.wireName && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted/70 text-muted-foreground border border-border/50">
                              {field.wireName}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs font-semibold text-foreground shrink-0 pl-3">
                          {val ? String(val) : "—"}
                        </div>
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
                className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <Shield className="size-3.5 text-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      {section.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
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

                <div className="space-y-1.5 text-xs">
                  {fields.map((field) => {
                    const val = getAuditFieldValue(formData, field.path);
                    const isRevision = field.wireName === "recCurrNumber";
                    return (
                      <div
                        key={field.path}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded border border-border/50 bg-background/40 hover:bg-background/70 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {renderFieldIcon(field.icon)}
                          <span className="font-medium text-foreground text-xs whitespace-nowrap">
                            {field.label}
                          </span>
                          {field.wireName && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted/70 text-muted-foreground border border-border/50">
                              {field.wireName}
                            </span>
                          )}
                        </div>
                        <div
                          className={`font-mono text-xs font-semibold shrink-0 pl-3 ${
                            isRevision && val ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {isRevision ? (val ? `#${val}` : "—") : val ? String(val) : "—"}
                        </div>
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
                className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">
                  {section.title}
                </div>

                <div className="space-y-2 text-xs">
                  {fields.map((field) => {
                    const isAuthorizer = field.wireName === "recAuthorizer";
                    const userVal = isAuthorizer
                      ? audit?.recAuthorizer || ""
                      : audit?.recInputter || "";
                    const timeVal = isAuthorizer ? audit?.recAuthTime : audit?.recInputTime;

                    return (
                      <div
                        key={field.path}
                        className="py-2 px-2.5 rounded border border-border/50 bg-background/40 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`size-6 rounded flex items-center justify-center shrink-0 ${
                              isAuthorizer
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {isAuthorizer ? (
                              <ShieldCheck className="size-3.5" />
                            ) : (
                              <User className="size-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground text-xs whitespace-nowrap">
                                {field.label}
                              </span>
                              {field.wireName && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted/70 text-muted-foreground border border-border/50">
                                  {field.wireName}
                                </span>
                              )}
                            </div>
                            {field.description && (
                              <div className="text-[10px] text-muted-foreground truncate">
                                {field.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0 pl-2">
                          <div
                            className={
                              userVal
                                ? "font-semibold text-foreground text-xs"
                                : "text-muted-foreground text-xs"
                            }
                          >
                            {userVal || "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                            <Calendar className="size-2.5" />
                            <span>{timeVal || "—"}</span>
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
