import { toast } from "@/components/ui/toast";
import type { ApiResponse } from "@/lib/data-schemas";

export interface ResponseHandlerOptions {
  readonly silent?: boolean;
  readonly successTitle?: string;
  readonly successMessage?: string;
  readonly errorMessage?: string;
}

/**
 * Handles CBS Response status semantics according to Banking Specification 6.6:
 * - 200 / 201: Operation completed / Created -> Proceed
 * - 401: Authentication failed -> Re-authenticate
 * - 404: Record not found -> Verify identifier
 * - 409: Duplicate — already posted -> Treat as already applied
 * - 422: Business rule rejected -> Do not retry unchanged
 * - 400: Validation or envelope error -> Correct the request
 * - 500+: CBS Host / Server failure
 */
export function handleCbsResponseSemantics<T>(
  json: ApiResponse<T>,
  httpStatus: number,
  options?: ResponseHandlerOptions,
  recordId?: string,
): void {
  const statusCode = json.statusCode || httpStatus;
  const isSuccess =
    (httpStatus >= 200 && httpStatus < 300 && json.status === "SUCCESS") ||
    statusCode === 200 ||
    statusCode === 201;

  if (isSuccess) {
    if (options?.successMessage && !options.silent) {
      toast.add({
        title: options.successTitle || (statusCode === 201 ? "Created" : "Success"),
        description: options.successMessage,
        type: "success",
      });
    }
    return;
  }

  if (options?.silent) return;

  const detailError = json.errors && json.errors.length > 0 ? json.errors.join("; ") : "";

  switch (statusCode) {
    case 401:
      toast.add({
        title: "Authentication Failed",
        description: json.message || "Session expired or invalid credentials. Please log in again.",
        type: "error",
      });
      break;

    case 404:
      toast.add({
        title: "Record Not Found",
        description:
          options?.errorMessage ||
          json.message ||
          `Record #${recordId || ""} not found. Please verify the identifier.`,
        type: "warning",
      });
      break;

    case 409:
      toast.add({
        title: "Duplicate Record",
        description:
          options?.errorMessage ||
          json.message ||
          "This transaction or record has already been applied or posted.",
        type: "warning",
      });
      break;

    case 422:
      toast.add({
        title: "Operation Rejected",
        description:
          options?.errorMessage ||
          json.message ||
          detailError ||
          "Business rule rejected this operation. Please do not retry unchanged.",
        type: "error",
      });
      break;

    case 400:
      toast.add({
        title: "Validation Error",
        description:
          options?.errorMessage ||
          json.message ||
          detailError ||
          "Validation or envelope error. Please correct the request.",
        type: "error",
      });
      break;

    default:
      toast.add({
        title: "CBS Error",
        description: options?.errorMessage || json.message || detailError || "Request failed",
        type: "error",
      });
      break;
  }
}
