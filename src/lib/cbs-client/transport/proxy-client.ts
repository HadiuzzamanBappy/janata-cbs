import type { z } from "zod";
import { toast } from "@/components/ui/toast";
import { clientConfig } from "@/lib/core-config";
import type { ApiResponse } from "@/lib/data-schemas";
import { type CbsWirePayload, cbsWirePayloadSchema } from "@/lib/data-schemas";
import { handleCbsResponseSemantics } from "./response-handler";

/* -------------------------------------------------------------------------- */
/* Client Request Options Contract                                            */
/* -------------------------------------------------------------------------- */

/**
 * Configuration options for dispatching a CBS request.
 */
export interface SendCbsOptions<T = unknown> {
  /** If true, suppresses automatic toast notifications */
  readonly silent?: boolean;
  /** Toast title to display upon SUCCESS response */
  readonly successTitle?: string;
  /** Toast description to display upon SUCCESS response */
  readonly successMessage?: string;
  /** Toast description override to display upon error */
  readonly errorMessage?: string;
  /** Optional AbortSignal to cancel in-flight requests (e.g., on unmount or keystroke) */
  readonly signal?: AbortSignal;
  /** Optional runtime Zod schema to validate response data */
  readonly responseSchema?: z.ZodType<T>;
}

/* -------------------------------------------------------------------------- */
/* Universal HTTP Proxy Dispatcher                                            */
/* -------------------------------------------------------------------------- */

/**
 * Universal type-safe fetch client for CBS backend communication.
 *
 * Automatically routes through `/api/proxy`, handles session expiration (401),
 * validates wire parameters pre-flight, and renders UI toast alerts via response-handler.
 *
 * @param rawPayload - Standard wire payload describing the target operation.
 * @param options - Toast behavior, abort signal, and response validation options.
 * @returns Resolves with the standard ApiResponse envelope from the proxy.
 */
export async function sendCbsRequest<T = unknown>(
  rawPayload: CbsWirePayload,
  options?: SendCbsOptions<T>,
): Promise<ApiResponse<T>> {
  // 1. Client-Side Pre-Flight Validation (Fail-Fast before network call)
  const validation = cbsWirePayloadSchema.safeParse(rawPayload);
  if (!validation.success) {
    const errorMsg = validation.error.issues[0]?.message || "Invalid CBS wire payload structure";
    if (!options?.silent) {
      toast.add({
        title: "Payload Error",
        description: errorMsg,
        type: "error",
      });
    }
    throw new Error(`CLIENT_VALIDATION_ERROR: ${errorMsg}`);
  }

  const payload = validation.data;

  try {
    const res = await fetch(clientConfig.routes.api.proxy, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: options?.signal,
      body: JSON.stringify(payload),
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
    const statusCode = json.statusCode || res.status;

    // 2. Client-Side Runtime Schema Validation (optional)
    if (res.ok && json.status === "SUCCESS" && options?.responseSchema && json.data !== undefined) {
      const validated = options.responseSchema.safeParse(json.data);
      if (!validated.success) {
        const schemaErrorMsg =
          validated.error.issues[0]?.message || "Invalid server response structure";
        if (!options.silent) {
          toast.add({
            title: "Response Validation Failed",
            description: schemaErrorMsg,
            type: "error",
          });
        }
        throw new Error(`RESPONSE_SCHEMA_ERROR: ${schemaErrorMsg}`);
      }
    }

    // 3. Status Semantics & Toast Alerts (Section 6.6)
    handleCbsResponseSemantics(json, res.status, options, payload.recordId);

    if (statusCode === 401) {
      throw new Error("UNAUTHORIZED");
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
