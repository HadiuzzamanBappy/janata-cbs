import type * as React from "react";
import type { z } from "zod";
import type { MoreActionItem } from "./components/action-more-menu";

export type CbsScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";

export interface CbsScreenValidationError<TTab extends string = string> {
  id: string;
  tab: TTab;
  fieldKey: string;
  message: string;
  nodeId?: string;
}

export interface CbsAuditRawData {
  recStatus?: string;
  recCurrNumber?: number;
  recInputter?: string;
  recInputTime?: string;
  recAuthorizer?: string;
  recAuthTime?: string;
  recBranchCode?: string;
  [key: string]: unknown;
}

export interface CbsAuditFooterData {
  recordStatus?: string;
  currNo?: number;
  inputter?: string;
  dateTime?: string;
  authoriser?: string;
  coCode?: string;
}

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
  recordId: string;
  mode: CbsScreenMode;
  onRecordIdChange: (id: string) => void;
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

  // 2. Idle State Configuration
  idleMessage?: string;

  // 3. Admin Tabs Variant Configuration
  variant?: CbsScreenLayoutVariant;
  tabs?: CbsScreenTab<TTab>[];
  activeTab?: TTab;
  onActiveTabChange?: (tab: TTab) => void;
  validationErrors?: CbsScreenValidationError<TTab>[];
  rightTabContent?: React.ReactNode;

  // 4. Audit Footer
  auditData?: CbsAuditFooterData | CbsAuditRawData;

  // 5. Children for "form", "inquiry" or "custom" variants
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
