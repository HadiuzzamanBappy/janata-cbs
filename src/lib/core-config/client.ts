/**
 * Pure client-safe, isomorphic core configuration.
 *
 * Contains zero server-only secrets. Only consumes build-time inlined
 * `NEXT_PUBLIC_*` variables and static banking invariants.
 * Safe to import in both Client Components ('use client') and Server contexts.
 */
const APP_PREFIX = process.env.NEXT_PUBLIC_APP_KEY || "cbs";

const COOKIES = {
  sid: `${APP_PREFIX}_sid`,
  branch: `${APP_PREFIX}_branch`,
  initLogin: `${APP_PREFIX}_init_login`,
} as const;

export const clientConfig = {
  // 1. Client-exposed Config & Session
  centralBranch: process.env.NEXT_PUBLIC_CENTRAL_BRANCH ?? "JB9999",
  logoutTime: Number(process.env.NEXT_PUBLIC_LOGOUT_TIME ?? 10),

  // 2. Workbench & MDI Workstation Tuning
  workbench: {
    maxOpenTabs: Number(process.env.NEXT_PUBLIC_MAX_OPEN_TABS ?? 15),
  },

  // 3. Authentication UI & Session Invariants
  auth: {
    loginLimit: 3,
    rateLimitWindowSec: 60,
    cookieName: COOKIES.sid,
    branchCookie: COOKIES.branch,
    initLoginCookie: COOKIES.initLogin,
    minPasswordLength: 6,
  },

  // 3. Core Banking Presentation & Formatting Standards
  format: {
    currency: "BDT",
    locale: "en-IN",
    dateLocale: "en-GB",
    accountNumberLength: 13,
  },

  // 4. Canonical Application Routes & Endpoints
  routes: {
    home: "/",
    dashboard: "/dashboard",
    screen: "/screen",
    login: "/login",
    changePassword: "/change-password",
    api: {
      login: "/api/login",
      logout: "/api/logout",
      session: "/api/session",
      proxy: "/api/proxy",
      cache: "/api/cache",
      form: "/api/form",
      inquiry: "/api/inquiry",
      menu: "/api/menu",
      controls: "/api/controls",
      branches: "/api/branches",
      changePassword: "/api/change-password",
    },
  },

  // 5. Client Storage & Sync Keys (Deterministic Namespaced Single Source of Truth)
  storage: {
    prefix: APP_PREFIX,
    local: {
      lastActivity: `${APP_PREFIX}:session:last_activity`,
      themeMode: `${APP_PREFIX}:theme:mode`,
      themeAccent: `${APP_PREFIX}:theme:accent`,
    },
    session: {
      sessionState: `${APP_PREFIX}:session:state`,
      workbenchTabs: `${APP_PREFIX}:workbench:tabs`,
      draft: (tabId: string) => `${APP_PREFIX}:draft:${tabId}`,
      criteria: (tabId: string) => `${APP_PREFIX}:criteria:${tabId}`,
    },
    cookies: COOKIES,
    broadcast: {
      workbenchBus: `${APP_PREFIX}_workbench_bus`,
    },
    idleWarningWindowMs: 60 * 1000, // 60s warning before timeout
  },
};

export type ClientConfig = typeof clientConfig;
