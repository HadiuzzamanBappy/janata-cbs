"use client";

import * as React from "react";
import { cbs, type SendCbsOptions } from "@/lib/cbs-client";
import { generateIdempotencyKey } from "@/lib/core-utils";
import type { ApiResponse, CbsWirePayload } from "@/lib/data-schemas";
import { isCbsMutationRequest } from "@/types";
import { useCbsAuthLevel } from "../cbs-auth-level";

interface PendingAttempt {
  fingerprint: string;
  key: string;
}

function buildPayloadFingerprint(payload: CbsWirePayload): string {
  return JSON.stringify([
    (payload.requestType || "").trim().toUpperCase(),
    payload.controlName ?? "",
    payload.recordFunction ?? "",
    payload.recordId ?? "",
    payload.data ?? null,
  ]);
}

/**
 * Manages attempt-scoped UUIDv4 idempotency keys for banking mutations at the UI origin.
 * Reuses the exact same UUID across retries after network/5xx failures on unchanged payloads,
 * and rotates/clears the key once a definitive outcome arrives or the payload changes.
 * Every mutation carries the screen's authorization level (`useCbsAuthLevel`), so a zero-auth
 * screen (trailing comma) is honoured by the core without per-screen code.
 */
export function useIdempotentSend() {
  const attemptRef = React.useRef<PendingAttempt | null>(null);
  const authLevel = useCbsAuthLevel();

  const resetAttempt = React.useCallback(() => {
    attemptRef.current = null;
  }, []);

  const sendMutation = React.useCallback(
    async <T = unknown>(
      payload: CbsWirePayload,
      options?: SendCbsOptions<T>,
    ): Promise<ApiResponse<T>> => {
      if (!isCbsMutationRequest(payload.requestType)) {
        return cbs.send<T>(payload, options);
      }

      const fingerprint = buildPayloadFingerprint(payload);
      const idempotencyKey =
        payload.idempotencyKey ||
        (attemptRef.current?.fingerprint === fingerprint
          ? attemptRef.current.key
          : generateIdempotencyKey());

      attemptRef.current = { fingerprint, key: idempotencyKey };

      const res = await cbs.send<T>(
        { ...payload, authLevel: payload.authLevel ?? authLevel, idempotencyKey },
        options,
      );

      // Clear only on definitive outcome (success or 4xx); keep on 5xx or thrown network errors so retry reuses key
      if (!res.statusCode || res.statusCode < 500) {
        attemptRef.current = null;
      }

      return res;
    },
    [authLevel],
  );

  return { sendMutation, resetAttempt };
}
