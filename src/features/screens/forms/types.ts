import type { FormSchema } from "@/lib/schemas";

export interface DynamicFormProps {
  command: string;
  tabId?: string;
  initialData?: Record<string, unknown>;
  onSuccess?: (response: unknown) => void;
  className?: string;
}

export interface FormRendererProps {
  schema: FormSchema;
  values: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  readOnly?: boolean;
}
