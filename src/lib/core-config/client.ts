/**
 * Pure client-safe, isomorphic core configuration.
 *
 * This module contains zero server secrets and zero process.env lookups.
 * Safe to import in both Client Components ('use client') and Server contexts.
 */

export const clientConfig = {
  // 1. Client-exposed Config & Session
  centralBranch: process.env.NEXT_PUBLIC_CENTRAL_BRANCH ?? "JB9999",
  logoutTime: Number(process.env.NEXT_PUBLIC_LOGOUT_TIME ?? 10),

  // 2. Authentication UI & Session Invariants
  auth: {
    loginLimit: 3,
    userSource: "grpc" as const,
    rateLimitWindowSec: 60,
    cookieName: "sid",
    initLoginCookie: "initLogin",
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

  // 5. Client Storage & Sync Keys
  storageKeys: {
    lastActivity: "cbs:session:last_activity",
    workbenchTabs: "cbs:workbench:tabs",
    themeAccent: "cbs:theme:accent",
    sidebarState: "cbs:sidebar:state",
    idleWarningWindowMs: 60 * 1000, // 60s warning before timeout
  },
} as const;

export type ClientConfig = typeof clientConfig;
