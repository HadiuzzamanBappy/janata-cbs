// ============================================================================
// Core CBS Screen Blueprint & Scaffold Contracts
//
// Defines layout models, tabs, audit footers, validation errors, and
// component signatures for all CBS screens and workbenches.
// ============================================================================

import type * as React from "react";
import type { z } from "zod";
import type { AuditData } from "@/lib/data-schemas";
import type { CbsRecordFunction, CbsScreenMode } from "@/types";

export type { CbsScreenMode };

export interface MoreActionItem {
  readonly label: string;
  readonly command?: string;
  readonly onClick: () => void;
  readonly requiredRight?: CbsRecordFunction;
}

export interface CbsScreenValidationError<TTab extends string = string> {
  readonly id: string;
  readonly tab: TTab;
  readonly fieldKey: string;
  readonly message: string;
  readonly nodeId?: string;
}

export type CbsAuditRawData = AuditData & {
  readonly [key: string]: unknown;
};

export interface CbsPersistenceOptions<TRecord> {
  initialId?: string;
  tabId?: string;
  initialData: TRecord;
  schema?: z.ZodType<TRecord>;
  fallbackMode?: CbsScreenMode;
}

export type CbsScreenLayoutVariant = "admin-tabs" | "form" | "inquiry" | "custom";

export interface CbsScreenTab<TTab extends string = string> {
  id: TTab;
  label: string;
  icon?: React.ReactNode;
  badgeCount?: number;
  content: React.ReactNode;
}

export interface CbsScreenScaffoldProps<TTab extends string = string> {
  // 1. Header Props
  title: string;
  commandCode: string;
  recordId?: string;
  mode?: CbsScreenMode;
  onRecordIdChange?: (id: string) => void;
  onRecordSearch?: (id: string) => void;
  onCreateNew?: () => void;
  onReturnToSearch?: () => void;
  onReset?: () => void;
  onValidate?: () => void;
  onSubmit?: () => void;
  onHold?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onAmend?: () => void;
  onPerformAction?: () => void;
  onAuthorizeReverse?: () => void;
  onProcessAction?: () => void;
  submitting?: boolean;
  availableItems?: Array<{ id: string; label?: string; details?: string }>;
  moreActions?: MoreActionItem[];

  // 1.1 Inquiry Variant Header Props
  inquiryStep?: "SELECTION" | "RESULTS";
  onInquiryBackToSelection?: () => void;
  onInquiryRefresh?: () => void;
  onInquiryPrintLocal?: () => void;
  onInquiryPrintServer?: () => void;
  onInquiryExportCSV?: () => void;
  onInquiryExportHTML?: () => void;
  onInquiryExportXML?: () => void;

  // 2. Idle State Configuration
  idleMessage?: string;

  // 3. Admin Tabs Variant Configuration
  variant?: CbsScreenLayoutVariant;
  tabs?: CbsScreenTab<TTab>[];
  activeTab?: TTab;
  onActiveTabChange?: (tab: TTab) => void;
  validationErrors?: CbsScreenValidationError<TTab>[];
  rightTabContent?: React.ReactNode;

  // 4. Children for "form", "inquiry" or "custom" variants
  children?: React.ReactNode;
  className?: string;
}

/** Standard props passed to any CBS Screen container/component by the screen resolver */
export interface CbsScreenProps {
  command: string;
  tabId?: string;
  className?: string;
}

export type CbsScreenComponent = React.ComponentType<CbsScreenProps>;
