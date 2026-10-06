import { toast } from "@/components/ui/toast";
import { appConfig } from "@/lib/config";
import type { ApiResponse } from "@/types";
import type { CbsWirePayload } from "../types/wire";

export interface SendCbsOptions {
  /** If true, silences default toast notifications */
  silent?: boolean;
  /** Toast success title / description */
  successTitle?: string;
  successMessage?: string;
  /** Toast error override */
  errorMessage?: string;
  /** Optional AbortSignal to cancel in-flight requests (e.g. on unmount or keystroke) */
  signal?: AbortSignal;
}

/**
 * Universal type-safe fetch client for CBS backend communication.
 * Automatically handles serialization, 401 unauthenticated states, and toast notifications.
 */
export async function sendCbsRequest<T = unknown>(
  payload: CbsWirePayload,
  options?: SendCbsOptions,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(appConfig.routes.api.proxy, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: options?.signal,
      body: JSON.stringify({
        servicePath: payload.servicePath || "default",
        requestType: payload.requestType,
        controlName: payload.controlName ?? "",
        recordFunction: payload.recordFunction || "S",
        recordId: payload.recordId || "",
        authLevel: payload.authLevel ?? 1,
        data: payload.data ?? {},
      }),
    });

    if (res.status === 401) {
      toast.add({
        title: "Session Expired",
        description: "Your session has expired. Please log in again to continue.",
        type: "error",
      });
      throw new Error("UNAUTHORIZED");
    }

    const json = (await res.json()) as ApiResponse<T>;

    if (res.ok && json.status === "SUCCESS") {
      if (options?.successMessage && !options.silent) {
        toast.add({
          title: options.successTitle || "Success",
          description: options.successMessage,
          type: "success",
        });
      }
    } else if (json.status === "RECORD_NOT_FOUND") {
      if (!options?.silent) {
        toast.add({
          title: "Record Not Found",
          description: json.message || `Record #${payload.recordId || ""} not found.`,
          type: "warning",
        });
      }
    } else if (!options?.silent) {
      toast.add({
        title: "CBS Error",
        description:
          options?.errorMessage ||
          json.message ||
          (json.errors && json.errors.length > 0 ? json.errors.join(", ") : "Request failed"),
        type: "error",
      });
    }

    return json;
  } catch (err: unknown) {
    // If request was intentionally aborted, don't trigger error toasts
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }

    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      throw err;
    }

    if (!options?.silent) {
      toast.add({
        title: "Network Error",
        description:
          options?.errorMessage ||
          (err instanceof Error ? err.message : "CBS Gateway Communication Failed"),
        type: "error",
      });
    }
    throw err;
  }
}
