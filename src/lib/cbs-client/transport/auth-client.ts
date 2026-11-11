import { clientConfig } from "@/lib/core-config";
import type { ApiResponse, CurrentUser } from "@/lib/data-schemas";

/**
 * Standardized client-side auth & session transport facade.
 * Encapsulates all calls to `/api/session` and `/api/logout`.
 */
export const cbsAuth = {
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
  async updateBranch(branchCode: string, branchName: string): Promise<ApiResponse<unknown>> {
    const res = await fetch(clientConfig.routes.api.session, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchCode, branchName }),
    });
    return res.json();
  },

  /**
   * Invalidates server session and clears session cookies via `/api/logout`.
   */
  async logout(): Promise<ApiResponse<unknown>> {
    const res = await fetch(clientConfig.routes.api.logout, {
      method: "POST",
    });
    return res.json();
  },
} as const;
