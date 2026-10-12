"use client";

import { Sparkles } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, evaluateFormula } from "@/lib/core-utils";
import type { FormConfigRecord, FormFieldItem } from "@/lib/data-schemas/form-config-schema";

export interface FcPreviewTabProps {
  formData: FormConfigRecord;
}

export function FcPreviewTab({ formData }: FcPreviewTabProps) {
  const { presentation } = formData;
  const [activePreviewTabId, setActivePreviewTabId] = React.useState<string>("");
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>({
    accountType: "SAVINGS",
    currency: "BDT",
    initialDeposit: "25000",
    interestRate: "7.5",
  });

  const handleInputChange = (key: string, val: unknown) => {
    setFormValues((prev) => {
      const next = { ...prev, [key]: val };

      // Re-evaluate formulas across all fields in real-time
      presentation.sections.forEach((sec) => {
        sec.fields.forEach((f) => {
          if (f.formula) {
            const calculated = evaluateFormula(f.formula, next);
            if (calculated !== undefined) {
              next[f.fieldKey] = calculated;
            }
          }
        });
      });

      return next;
    });
  };

  const renderFieldItem = (field: FormFieldItem) => {
    // Width mapping matching general tab conventions (w-28, max-w-xs, max-w-md)
    const inputWidthClass =
      field.widget === "switch"
        ? "w-auto"
        : field.colSpan === 3
          ? "w-28"
          : field.colSpan === 4
            ? "max-w-xs flex-1"
            : field.colSpan === 6
              ? "max-w-md flex-1"
              : "max-w-lg flex-1";

    return (
      <div key={field.id} className="flex items-center gap-2">
        {/* Scanline Label - 1:1 match with General Tab */}
        <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none truncate">
          {field.label}
          {field.required && <span className="text-destructive font-bold ml-1">*</span>}
        </Label>

        {/* Monospaced Colon Separator */}
        <span className="text-muted-foreground/60 font-mono text-xs shrink-0 select-none">:</span>

        {/* Scanline Input / Control */}
        {field.widget === "switch" ? (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(formValues[field.fieldKey])}
              onChange={(e) => handleInputChange(field.fieldKey, e.target.checked)}
              className="rounded border-border size-3.5"
            />
            <span className="text-xs text-muted-foreground">
              {field.helperText || "Enable / Active"}
            </span>
          </label>
        ) : field.widget === "select" ? (
          <div className={inputWidthClass}>
            <Select
              value={String(formValues[field.fieldKey] || "")}
              onValueChange={(val) => handleInputChange(field.fieldKey, val)}
            >
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent className="text-xs">
                {(field.options || []).map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : field.widget === "radio-group" ? (
          <div className="inline-flex rounded border border-border/80 bg-muted/40 p-0.5 gap-0.5">
            {(field.options && field.options.length > 0 ? field.options : ["YES", "NO"]).map(
              (opt) => {
                const isSelected = formValues[field.fieldKey] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleInputChange(field.fieldKey, opt)}
                    className={cn(
                      "px-2.5 py-0.5 text-xs rounded transition-all cursor-pointer font-medium border-0",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50 bg-transparent",
                    )}
                  >
                    {opt}
                  </button>
                );
              },
            )}
          </div>
        ) : field.widget === "radio" ? (
          <div className="flex items-center gap-3">
            {(field.options && field.options.length > 0
              ? field.options
              : ["Option 1", "Option 2"]
            ).map((opt) => (
              <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={formValues[field.fieldKey] === opt}
                  onChange={() => handleInputChange(field.fieldKey, opt)}
                  className="size-3.5 text-primary focus:ring-primary/40 border-border"
                />
                <span className="text-foreground">{opt}</span>
              </label>
            ))}
          </div>
        ) : field.widget === "checkbox-group" ? (
          <div className="flex flex-wrap gap-1.5">
            {(field.options && field.options.length > 0 ? field.options : ["TAG_A", "TAG_B"]).map(
              (opt) => {
                const currentArr = Array.isArray(formValues[field.fieldKey])
                  ? (formValues[field.fieldKey] as string[])
                  : [];
                const isChecked = currentArr.includes(opt);
                return (
                  <label
                    key={opt}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs cursor-pointer transition-colors",
                      isChecked
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border/80 bg-background text-muted-foreground hover:border-foreground/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const nextArr = e.target.checked
                          ? [...currentArr, opt]
                          : currentArr.filter((item) => item !== opt);
                        handleInputChange(field.fieldKey, nextArr);
                      }}
                      className="sr-only"
                    />
                    <span>{opt}</span>
                  </label>
                );
              },
            )}
          </div>
        ) : field.widget === "textarea" ? (
          <div className={inputWidthClass}>
            <textarea
              rows={2}
              placeholder={field.placeholder}
              value={String(formValues[field.fieldKey] ?? "")}
              onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
              className="w-full text-xs bg-background rounded border border-border/80 p-2 font-sans focus:outline-none focus:ring-1 focus:ring-ring resize-y"
            />
          </div>
        ) : field.widget === "amount" ? (
          <div className={cn("relative flex items-center", inputWidthClass)}>
            {field.currencyPrefix && (
              <span className="absolute left-2 text-[10px] font-mono text-muted-foreground select-none">
                {field.currencyPrefix}
              </span>
            )}
            <Input
              type="text"
              value={String(formValues[field.fieldKey] ?? "")}
              onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
              className={cn(
                "h-7 text-xs font-mono bg-background rounded border-border/80",
                field.currencyPrefix && "pl-9",
              )}
            />
          </div>
        ) : (
          <div className={inputWidthClass}>
            <Input
              type={
                field.widget === "number" ? "number" : field.widget === "date" ? "date" : "text"
              }
              placeholder={field.placeholder}
              value={String(formValues[field.fieldKey] ?? "")}
              onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
              className="h-7 text-xs bg-background rounded border-border/80"
            />
          </div>
        )}
      </div>
    );
  };

  // Partition sections into Fixed Master Header, Body Tabs, and Standard flowing cards
  const headerSections = React.useMemo(
    () => presentation.sections.filter((s) => s.zone === "header"),
    [presentation.sections],
  );

  const tabSections = React.useMemo(
    () => presentation.sections.filter((s) => s.zone === "tab"),
    [presentation.sections],
  );

  const standardSections = React.useMemo(
    () => presentation.sections.filter((s) => !s.zone || s.zone === "standard"),
    [presentation.sections],
  );

  // Set default active tab for body tabs
  React.useEffect(() => {
    if (tabSections.length > 0 && !tabSections.some((t) => t.id === activePreviewTabId)) {
      setActivePreviewTabId(tabSections[0].id);
    }
  }, [tabSections, activePreviewTabId]);

  const activeTabSection = tabSections.find((t) => t.id === activePreviewTabId);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto p-2.5 select-none">
      <div className="w-full space-y-2.5">
        {/* Live Preview Header Notice */}
        <div className="px-2.5 py-1.5 rounded border border-border/80 bg-muted/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3 text-primary" />
            <span className="font-semibold text-foreground">{formData.title}</span>
            <Badge variant="outline" className="text-[9px] uppercase font-mono h-4 px-1.5">
              {formData.targetModel}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">LIVE PREVIEW</span>
        </div>

        {/* Dynamic Stepper Header (if step sections exist) */}

        {/* 1. FIXED MASTER HEADER ZONE */}
        {headerSections.map((sec) => (
          <div
            key={sec.id}
            className="rounded border border-amber-500/40 bg-card/80 p-3 shadow-2xs space-y-2.5 ring-1 ring-amber-500/10"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {sec.title}
                </h4>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] uppercase font-mono h-4 px-1 text-amber-500 border-amber-500/30"
              >
                FIXED HEADER
              </Badge>
            </div>
            <div className="space-y-2 text-xs">
              {sec.fields.map((field) => renderFieldItem(field))}
            </div>
          </div>
        ))}

        {/* 2. BODY TABS ZONE (if tab sections exist) */}
        {tabSections.length > 0 && (
          <div className="rounded border border-border/80 bg-card/60 overflow-hidden shadow-2xs">
            {/* Tab navigation headers */}
            <div className="flex items-center border-b border-border/70 bg-muted/30 px-2 gap-1 overflow-x-auto">
              {tabSections.map((tab) => {
                const isTabActive = tab.id === activePreviewTabId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePreviewTabId(tab.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer border-transparent bg-transparent",
                      isTabActive
                        ? "border-primary text-primary font-bold bg-background/50"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.tabTitle || tab.title}
                  </button>
                );
              })}
            </div>

            {/* Active Tab Body */}
            {activeTabSection && (
              <div className="p-3 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {activeTabSection.title}
                  </span>
                  {activeTabSection.type === "object-group" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {activeTabSection.bindKey && (
                        <span className="text-[10px] font-mono text-muted-foreground/70">
                          &rarr; {activeTabSection.bindKey}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase font-mono h-4 px-1 border-purple-500/40 text-purple-400 bg-purple-500/10"
                      >
                        OBJECT-GROUP
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  {activeTabSection.fields.map((field) => renderFieldItem(field))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. FLOWING SECTIONS & CARDS */}
        {standardSections.length > 0 && (
          <div className="space-y-3">
            {standardSections.map((sec) => {
              const isPlain = sec.layoutStyle === "plain";

              return (
                <div
                  key={sec.id}
                  className={cn(
                    "rounded shadow-2xs space-y-2.5",
                    isPlain
                      ? "p-2 bg-transparent"
                      : sec.type === "object-group"
                        ? "border border-purple-500/30 bg-purple-500/5 ring-1 ring-purple-500/10 p-3"
                        : "border border-border/80 bg-card/60 p-3",
                  )}
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                    <div className="flex items-center gap-2">
                      {sec.type === "object-group" && (
                        <span className="size-2 rounded-full bg-purple-500 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {sec.title}
                        </h4>
                        {sec.description && (
                          <p className="text-[11px] text-muted-foreground">{sec.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {sec.bindKey && (
                        <span className="text-[10px] font-mono text-muted-foreground/70">
                          &rarr; {sec.bindKey}
                        </span>
                      )}
                      {sec.type !== "standard" && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase font-mono h-4 px-1",
                            sec.type === "object-group" &&
                              "border-purple-500/40 text-purple-400 bg-purple-500/10",
                          )}
                        >
                          {sec.type}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {sec.fields.map((field) => renderFieldItem(field))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
