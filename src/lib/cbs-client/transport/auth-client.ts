import { clientConfig } from "@/lib/core-config";
import {
  type ApiResponse,
  CBS_API_STATUS,
  type ChangePasswordInput,
  type CurrentUser,
  type LoginInput,
} from "@/lib/data-schemas";

/** POSTs JSON to a BFF route; a non-JSON reply (e.g. a gateway error page) becomes an ERROR envelope. */
async function postJson<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.json().catch(() => ({
    status: CBS_API_STATUS.ERROR,
    statusCode: res.status,
    message: `Request failed (HTTP ${res.status})`,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Standardized client-side auth & session transport facade.
 * Encapsulates all calls to `/api/login`, `/api/change-password`, `/api/session` and `/api/logout`.
 */
export const cbsAuth = {
  /** Authenticates credentials via `/api/login`. */
  login(credentials: LoginInput): Promise<ApiResponse<CurrentUser>> {
    return postJson(clientConfig.routes.api.login, credentials);
  },

  /** Changes the signed-in user's password via `/api/change-password`. */
  changePassword(input: ChangePasswordInput): Promise<ApiResponse> {
    return postJson(clientConfig.routes.api.changePassword, input);
  },

  /**
   * Hydrates active user profile from `/api/session`.
   */
  async getSession(): Promise<ApiResponse<CurrentUser>> {
    const res = await fetch(clientConfig.routes.api.session);
    return res.json();
  },

  /**
   * Synchronizes branch roaming context to Redis and cookies via `/api/session`.
   */
  updateBranch(branchCode: string, branchName: string): Promise<ApiResponse<unknown>> {
    return postJson(clientConfig.routes.api.session, { branchCode, branchName });
  },

  /**
   * Invalidates server session and clears session cookies via `/api/logout`.
   */
  logout(): Promise<ApiResponse<unknown>> {
    return postJson(clientConfig.routes.api.logout);
  },
} as const;
