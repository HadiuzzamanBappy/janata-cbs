import type { CSSProperties } from "react";
import type { FormFieldItem, FormSection } from "@/lib/data-schemas/form-config-schema";
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
  style?: CSSProperties;
  className?: string;
}

export interface FormRendererProps {
  frmElements?: {
    steps?: unknown[];
    sections: FormSection[];
  };
  presentation?: {
    steps?: unknown[];
    sections: FormSection[];
  };
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  mode?: CbsScreenMode;
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

export interface UnifiedFieldFactoryProps {
  field: FormFieldItem;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
  mode?: CbsScreenMode;
  labelOverride?: string;
  labelSuffix?: React.ReactNode;
  actionBeforeColon?: React.ReactNode;
}
