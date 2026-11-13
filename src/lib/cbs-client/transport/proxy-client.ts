import type { z } from "zod";
import { toast } from "@/components/ui/toast";
import { clientConfig } from "@/lib/core-config";
import type { ApiResponse } from "@/lib/data-schemas";
import { type CbsWirePayload, cbsWirePayloadSchema } from "@/lib/data-schemas";
import { handleCbsResponseSemantics } from "./response-handler";

export interface SendCbsOptions<T = unknown> {
  readonly silent?: boolean;
  readonly successTitle?: string;
  readonly successMessage?: string;
  readonly errorMessage?: string;
  readonly signal?: AbortSignal;
  readonly responseSchema?: z.ZodType<T>;
}

function notifyError(title: string, description: string, silent?: boolean): void {
  if (!silent) {
    toast.add({ title, description, type: "error" });
  }
}

/**
 * Universal type-safe fetch client routing through `/api/proxy`.
 */
export async function sendCbsRequest<T = unknown>(
  rawPayload: CbsWirePayload,
  options?: SendCbsOptions<T>,
): Promise<ApiResponse<T>> {
  // Pre-flight wire payload validation
  const validation = cbsWirePayloadSchema.safeParse(rawPayload);
  if (!validation.success) {
    const errorMsg = validation.error.issues[0]?.message || "Invalid CBS wire payload structure";
    notifyError("Payload Error", errorMsg, options?.silent);
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
      if (typeof window !== "undefined") {
        if ("BroadcastChannel" in window) {
          try {
            const bus = new BroadcastChannel(clientConfig.storage.broadcast.workbenchBus);
            bus.postMessage({ type: "CBS_SESSION_EXPIRED", tabId: "global" });
            bus.close();
          } catch {
            // Safe fallback
          }
        }
        window.location.href = clientConfig.routes.login;
      }
      throw new Error("UNAUTHORIZED");
    }

    const json = (await res.json()) as ApiResponse<T>;

    // Optional response schema validation
    if (res.ok && json.status === "SUCCESS" && options?.responseSchema && json.data !== undefined) {
      const validated = options.responseSchema.safeParse(json.data);
      if (!validated.success) {
        const schemaErrorMsg =
          validated.error.issues[0]?.message || "Invalid server response structure";
        notifyError("Response Validation Failed", schemaErrorMsg, options.silent);
        throw new Error(`RESPONSE_SCHEMA_ERROR: ${schemaErrorMsg}`);
      }
    }

    handleCbsResponseSemantics(json, res.status, options, payload.recordId);

    return json;
  } catch (err: unknown) {
    const isExpectedBailout =
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && err.message === "UNAUTHORIZED");

    if (isExpectedBailout) {
      throw err;
    }

    const errorDesc =
      options?.errorMessage ||
      (err instanceof Error ? err.message : "CBS Gateway Communication Failed");
    notifyError("Network Error", errorDesc, options?.silent);
    throw err;
  }
}
