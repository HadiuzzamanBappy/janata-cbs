"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCbsHotkeys } from "@/lib/cbs-hotkeys";
import type { CbsAuditFooterData, CbsScreenScaffoldProps } from "../types";
import { formatAuditFooterData } from "../utils/audit-adapter";
import { CbsAuditFooter } from "./cbs-audit-footer";
import { CbsFormHeader } from "./cbs-form-header";
import { CbsIdleState } from "./cbs-idle-state";
import { CbsInquiryHeader } from "./cbs-inquiry-header";

export function CbsScreenScaffold<TTab extends string = string>({
  title,
  commandCode,
  recordId = "",
  mode = "IDLE",
  onRecordIdChange,
  onRecordSearch,
  onCreateNew,
  onReturnToSearch,
  onReset,
  onValidate,
  onSubmit,
  onHold,
  onDelete,
  onView,
  onAmend,
  onAuthorizeReverse,
  onProcessAction,
  submitting = false,
  availableItems = [],
  moreActions = [],
  inquiryStep,
  onInquiryBackToSelection,
  onInquiryRefresh,
  onInquiryPrintLocal,
  onInquiryPrintServer,
  onInquiryExportCSV,
  onInquiryExportHTML,
  onInquiryExportXML,
  idleMessage,
  variant = "admin-tabs",
  tabs = [],
  activeTab,
  onActiveTabChange,
  validationErrors = [],
  rightTabContent,
  auditData,
  children,
  className = "",
}: CbsScreenScaffoldProps<TTab>) {
  const isReadOnly = mode === "S" || mode === "A" || mode === "D" || mode === "H" || mode === "R";

  // Universal terminal hotkeys: F2 (New), F3/Esc (Return), F5/Ctrl+S (Commit), F6 (Hold), F7 (Validate), F8 (Auth), F9 (Process), F10 (Delete)
  useCbsHotkeys({
    enabled: true,
    handlers: {
      onCreateNew,
      onCommit: !isReadOnly ? onSubmit : undefined,
      onHold: !isReadOnly ? onHold : undefined,
      onValidate: !isReadOnly ? onValidate : undefined,
      onAuthorize: onAuthorizeReverse,
      onProcessAction,
      onDelete: !isReadOnly ? onDelete : undefined,
      onReturn: onReturnToSearch,
    },
  });

  const resolvedAuditFooter = React.useMemo((): CbsAuditFooterData | undefined => {
    if (!auditData) return undefined;
    if ("recordStatus" in auditData || "currNo" in auditData) {
      return auditData as CbsAuditFooterData;
    }
    return formatAuditFooterData(auditData as import("../types").CbsAuditRawData);
  }, [auditData]);

  return (
    <div
      className={`flex flex-col h-full w-full bg-background overflow-hidden select-none font-sans ${className}`}
    >
      {/* 1. CBS HEADER: Inquiry Header for Inquiry screens, Form Header for others */}
      {variant === "inquiry" ? (
        inquiryStep === "RESULTS" ? (
          <CbsInquiryHeader
            title={title}
            commandCode={commandCode}
            step={inquiryStep}
            onBackToSelection={onInquiryBackToSelection}
            onRefresh={onInquiryRefresh}
            onPrintLocal={onInquiryPrintLocal}
            onPrintServer={onInquiryPrintServer}
            onExportCSV={onInquiryExportCSV}
            onExportHTML={onInquiryExportHTML}
            onExportXML={onInquiryExportXML}
            validationErrors={validationErrors}
          />
        ) : null
      ) : (
        <CbsFormHeader
          title={title}
          commandCode={commandCode}
          recordId={recordId}
          onRecordIdChange={(newId) => onRecordIdChange?.(newId.toUpperCase())}
          onRecordSearch={(searchedId) => {
            if (onRecordSearch) {
              onRecordSearch(searchedId.toUpperCase());
            } else {
              onRecordIdChange?.(searchedId.toUpperCase());
            }
          }}
          onCreateNew={onCreateNew}
          onReturnToSearch={onReturnToSearch}
          onReset={onReset}
          onValidate={!isReadOnly ? onValidate : undefined}
          onSubmit={!isReadOnly ? onSubmit : undefined}
          onHold={!isReadOnly ? onHold : undefined}
          onDelete={!isReadOnly ? onDelete : undefined}
          onView={onView}
          onAmend={onAmend}
          onAuthorizeReverse={onAuthorizeReverse}
          onProcessAction={onProcessAction}
          mode={mode}
          submitting={submitting}
          availableItems={availableItems}
          moreActions={moreActions}
          validationErrors={validationErrors}
          onSelectValidationTab={(tab) => onActiveTabChange?.(tab as TTab)}
        />
      )}

      {/* 2. MAIN BODY CANVAS */}
      <div className="flex-1 overflow-hidden p-2 flex flex-col min-h-0">
        {mode === "IDLE" && variant !== "inquiry" ? (
          <div className="h-full flex flex-col items-center justify-center">
            <CbsIdleState
              title={title}
              code={commandCode}
              customMessage={
                idleMessage ||
                `Manage ${title} records (${commandCode}). Enter or select a Record ID in the toolbar above, or click + to create a new entry.`
              }
            />
          </div>
        ) : variant === "admin-tabs" ? (
          <div className="flex flex-col h-full overflow-hidden min-h-0">
            <Tabs
              value={activeTab || tabs[0]?.id}
              onValueChange={(val) => onActiveTabChange?.(val as TTab)}
              className="flex-1 flex flex-col overflow-hidden min-h-0 gap-1.5"
            >
              {/* TAB ROW STRIP */}
              <div className="border-b border-border/70 pb-1 flex items-center justify-between shrink-0">
                <TabsList className="h-7 bg-muted/60 p-0.5 rounded">
                  {tabs.map((tab) => {
                    const errorCount =
                      tab.badgeCount !== undefined
                        ? tab.badgeCount
                        : validationErrors.filter((e) => e.tab === tab.id).length;

                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="h-6 px-2.5 text-xs rounded gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium cursor-pointer"
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {errorCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-1 h-3.5 min-w-3.5 px-1 text-[9px] rounded-full"
                          >
                            {errorCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* Right toolbar item: domain items (e.g. status tags) */}
                {rightTabContent && (
                  <div className="flex items-center gap-2 pr-1">{rightTabContent}</div>
                )}
              </div>

              {/* TAB CONTENTS */}
              {tabs.map((tab) => (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="flex-1 h-full flex flex-col overflow-hidden min-h-0 m-0"
                >
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : (
          /* Form / Inquiry / Custom Body */
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">{children}</div>
        )}
      </div>

      {/* 3. AUDIT FOOTER */}
      {mode !== "IDLE" && resolvedAuditFooter && <CbsAuditFooter audit={resolvedAuditFooter} />}
    </div>
  );
}
