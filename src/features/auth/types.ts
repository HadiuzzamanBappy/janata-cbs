import type { CurrentUser } from "@/lib/data-schemas";

export interface LoginFormProps {
  onSuccess?: (user: CurrentUser) => void;
  className?: string;
}

export interface ChangePasswordProps {
  onSuccess?: () => void;
  className?: string;
}
