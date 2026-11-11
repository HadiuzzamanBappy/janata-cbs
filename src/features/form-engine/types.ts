import type { AuditData } from "@/lib/data-schemas";
import type { FormElementsContainer, FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { CbsScreenMode } from "@/types";

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

export interface UnifiedFieldFactoryProps {
  field: FormElement;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
  mode?: CbsScreenMode;
  labelOverride?: string;
  labelSuffix?: React.ReactNode;
  actionBeforeColon?: React.ReactNode;
  allValues?: Record<string, unknown>;
  errors?: Record<string, string>;
  hasKernel?: boolean;
}

export interface SectionCardProps {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
  hideHeader?: boolean;
}

export interface FormRendererProps {
  frmElements?: FormElementsContainer;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
  auditData?: AuditData | null;
  showAuditSection?: boolean;
  hideHeader?: boolean;
}
