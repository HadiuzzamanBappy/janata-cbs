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
  initialData?: Record<string, any>;
  onSuccess?: (response: any) => void;
  className?: string;
}

export interface FormRendererProps {
  schema: FormSchema;
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  readOnly?: boolean;
}
