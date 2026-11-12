import { toast } from "@/components/ui/toast";
import type { ApiResponse } from "@/lib/data-schemas";

export interface ResponseHandlerOptions {
  readonly silent?: boolean;
  readonly successTitle?: string;
  readonly successMessage?: string;
  readonly errorMessage?: string;
}

interface ToastPayload {
  title: string;
  description: string;
  type: "success" | "warning" | "error";
}

/**
 * Handles CBS response semantics according to banking specification 6.6.
 */
export function handleCbsResponseSemantics<T>(
  json: ApiResponse<T>,
  httpStatus: number,
  options?: ResponseHandlerOptions,
  recordId?: string,
): void {
  const isSuccess =
    httpStatus >= 200 &&
    httpStatus < 300 &&
    (json.status === "SUCCESS" || json.statusCode === 200 || json.statusCode === 201);

  if (isSuccess) {
    if (options?.successMessage && !options.silent) {
      toast.add({
        title: options.successTitle || (json.statusCode === 201 ? "Created" : "Success"),
        description: options.successMessage,
        type: "success",
      });
    }
    return;
  }

  if (options?.silent) return;

  const detail = json.errors?.length ? json.errors.join("; ") : "";
  const customOrMessage = options?.errorMessage || json.message;
  const statusCode = json.statusCode || httpStatus;

  const errorSpecs: Record<number, ToastPayload> = {
    401: {
      title: "Authentication Failed",
      description: json.message || "Session expired or invalid credentials. Please log in again.",
      type: "error",
    },
    404: {
      title: "Record Not Found",
      description:
        customOrMessage || `Record #${recordId || ""} not found. Please verify the identifier.`,
      type: "warning",
    },
    409: {
      title: "Duplicate Record",
      description:
        customOrMessage || "This transaction or record has already been applied or posted.",
      type: "warning",
    },
    422: {
      title: "Operation Rejected",
      description:
        customOrMessage ||
        detail ||
        "Business rule rejected this operation. Please do not retry unchanged.",
      type: "error",
    },
    400: {
      title: "Validation Error",
      description:
        customOrMessage || detail || "Validation or envelope error. Please correct the request.",
      type: "error",
    },
  };

  const current = errorSpecs[statusCode] || {
    title: "CBS Error",
    description: customOrMessage || detail || "Request failed",
    type: "error",
  };

  toast.add(current);
}
