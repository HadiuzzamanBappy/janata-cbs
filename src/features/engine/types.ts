import type {
  FieldType,
  FieldWidth,
  FormField,
  FormSchema,
  RawPropertyConfigRecord,
  RawPropertyRecord,
} from "./schema/schemas";

export type {
  FieldType,
  FieldWidth,
  FormField,
  FormSchema,
  RawPropertyConfigRecord,
  RawPropertyRecord,
};

export interface DynamicFormProps {
  command: string;
  initialData?: Record<string, unknown>;
  onSuccess?: (response: unknown) => void;
  className?: string;
}

export interface FormRendererProps {
  schema: FormSchema;
  values: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  readOnly?: boolean;
}
