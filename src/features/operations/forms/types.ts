export interface DynamicFormProps {
  command: string;
  tabId?: string;
  initialData?: Record<string, unknown>;
  onSuccess?: (response: unknown) => void;
  className?: string;
}
