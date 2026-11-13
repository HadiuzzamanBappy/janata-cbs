/**
 * @fileoverview Unified Form Engine Component Contracts & Type Definitions
 * @module form-engine/types
 *
 * Core Invariants:
 * - Direct 1:1 alignment with FormElement and FormSection domain schemas.
 * - Centralized interface contracts for widgets, field factories, containers, and orchestrators.
 * - Zero duplicated schema definitions; reuses canonical types from @/lib/data-schemas.
 */

import type { ReactNode } from "react";
import type { AuditData } from "@/lib/data-schemas";
import type { FormElementsContainer, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { CbsScreenMode } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Widget Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface WidgetOption {
  code: string;
  label: string;
}

export interface BaseWidgetProps {
  id: string;
  fieldKey: string;
  value: unknown;
  onChange: (val: unknown) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

export interface WidgetRendererProps {
  widget: string;
  field: FormElement;
  fieldKey: string;
  rowId: string;
  value: unknown;
  onChange: (next: unknown) => void;
  isReadOnly: boolean;
  error?: string;
  placeholder?: string;
  resolvedOptions: WidgetOption[];
  modelLoading: boolean;
  effectiveLabel: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Field Factory & Atom Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface UnifiedFieldFactoryProps {
  field: FormElement;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
  mode?: CbsScreenMode;
  labelOverride?: string;
  labelSuffix?: ReactNode;
  actionBeforeColon?: ReactNode;
  allValues?: Record<string, unknown>;
  errors?: Record<string, string>;
  hasKernel?: boolean;
}

export interface FieldAtomProps {
  field: FormElement;
  mode?: CbsScreenMode;
  disabled?: boolean;
  labelOverride?: string;
  labelSuffix?: ReactNode;
  actionBeforeColon?: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Container & Orchestrator Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionCardProps {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
  hideHeader?: boolean;
  layout?: "horizontal" | "stacked";
}

export interface FormRendererProps {
  frmElements?: FormElementsContainer;
  values: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  onRecordChange?: (nextValues: Record<string, unknown>) => void;
  onValuesChange?: (values: Record<string, unknown>) => void;
  errors?: Record<string, string>;
  externalErrors?: Record<string, string>;
  autoValidate?: boolean;
  disabled?: boolean;
  mode?: CbsScreenMode;
  auditData?: AuditData | null;
  showAuditSection?: boolean;
  auditVariant?: "inline" | "card";
  hideHeader?: boolean;
  layout?: "horizontal" | "stacked";
}
