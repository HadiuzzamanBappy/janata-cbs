import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { serverConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import type { CurrentUser } from "@/lib/data-schemas";
import { cacheDelete, cacheGet, cacheKey, cacheSet } from "./client";

const sessionLogger = logger.withContext("SESSION");

export type { CurrentUser };

export interface SessionData {
  userId: string;
  token: string;
  currUser: CurrentUser;
  createdAt: number;
  lastActiveAt: number;
}

export type SessionPatch = Partial<Omit<SessionData, "createdAt" | "currUser">> & {
  currUser?: Partial<CurrentUser>;
};

/* -------------------------------------------------------------------------- */
/* Configuration & In-Memory Fallback State                                   */
/* -------------------------------------------------------------------------- */

const COOKIE_NAME = serverConfig.auth.cookieName;
const TTL_SECONDS = serverConfig.auth.sessionMaxAgeSeconds;

declare global {
  var __memorySessionStore: Map<string, SessionData> | undefined;
  var __memoryUserSessionStore: Map<string, string> | undefined;
}
if (!globalThis.__memorySessionStore) {
  globalThis.__memorySessionStore = new Map<string, SessionData>();
}
if (!globalThis.__memoryUserSessionStore) {
  globalThis.__memoryUserSessionStore = new Map<string, string>();
}
const memoryStore = globalThis.__memorySessionStore;
const memoryUserSessionStore = globalThis.__memoryUserSessionStore;

const getSessionRedisKey = (id: string): string =>
  cacheKey(serverConfig.redis.cacheKeys.session(id));

const getUserSessionRedisKey = (userId: string): string =>
  cacheKey(serverConfig.redis.cacheKeys.userSession(userId));

const cookieOpts = (httpOnly = true, maxAge?: number) => ({
  httpOnly,
  secure: !serverConfig.isDev && serverConfig.useHttps,
  sameSite: "lax" as const,
  path: "/",
  ...(maxAge !== undefined ? { maxAge } : {}),
});

async function currentSessionId(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Public Session Lifecycle API                                               */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new session in Redis and sets the HTTP-only opaque cookie.
 */
export async function createSession(
  data: Omit<SessionData, "createdAt" | "lastActiveAt">,
): Promise<string> {
  const store = await cookies();
  const oldId = store.get(COOKIE_NAME)?.value;

  // 1. Single Active Login: Invalidate any prior active session for this user across all devices
  const userKey = getUserSessionRedisKey(data.userId);
  const existingSessionId =
    (await cacheGet<string>(userKey)) ?? memoryUserSessionStore.get(data.userId);

  if (existingSessionId) {
    sessionLogger.info(
      `Revoking previous active session ${existingSessionId} for user ${data.userId} to enforce single login`,
    );
    await cacheDelete(getSessionRedisKey(existingSessionId));
    memoryStore.delete(existingSessionId);
  }

  // Also clean up old session from current cookie if it differed
  if (oldId && oldId !== existingSessionId) {
    await cacheDelete(getSessionRedisKey(oldId));
    memoryStore.delete(oldId);
  }

  const id = randomUUID();
  const now = Date.now();
  const payload: SessionData = { ...data, createdAt: now, lastActiveAt: now };

  await cacheSet(getSessionRedisKey(id), payload, TTL_SECONDS);
  memoryStore.set(id, payload);

  // 2. Index this session as the user's active session
  await cacheSet(userKey, id, TTL_SECONDS);
  memoryUserSessionStore.set(data.userId, id);

  // Session cookie: omit maxAge so the cookie persists for the active browser session.
  // Redis TTL and session.lastActiveAt strictly govern the sliding inactivity window.
  store.set(COOKIE_NAME, id, cookieOpts(true));

  if (payload.currUser.branchCode) {
    store.set(serverConfig.auth.branchCookie, payload.currUser.branchCode, cookieOpts(false));
  }

  if (payload.currUser.initLogin) {
    store.set(serverConfig.auth.initLoginCookie, "true", cookieOpts(true));
  } else {
    store.delete(serverConfig.auth.initLoginCookie);
  }

  return id;
}

/**
 * Reads the session from Redis (or in-memory fallback) and validates the inactivity window.
 */
export async function getSession(): Promise<SessionData | null> {
  const id = await currentSessionId();
  if (!id) return null;

  let session = await cacheGet<SessionData>(getSessionRedisKey(id));
  if (!session) {
    session = memoryStore.get(id) ?? null;
  }
  if (!session) return null;

  // Single Active Login Check: Ensure this session is still the active session for this user
  const userKey = getUserSessionRedisKey(session.userId);
  const activeSessionId =
    (await cacheGet<string>(userKey)) ?? memoryUserSessionStore.get(session.userId);

  if (activeSessionId && activeSessionId !== id) {
    sessionLogger.warn(
      `Session ${id} superseded: user ${session.userId} has logged in from another browser or device`,
    );
    await cacheDelete(getSessionRedisKey(id));
    memoryStore.delete(id);
    return null;
  }

  const maxInactiveMs = TTL_SECONDS * 1000;
  const now = Date.now();

  if (session.lastActiveAt && now - session.lastActiveAt > maxInactiveMs) {
    const timeoutMin = Math.floor(TTL_SECONDS / 60);
    sessionLogger.warn(`Session ${id} expired due to inactivity (> ${timeoutMin}m)`);
    await cacheDelete(getSessionRedisKey(id));
    memoryStore.delete(id);
    if (activeSessionId === id) {
      await cacheDelete(userKey);
      memoryUserSessionStore.delete(session.userId);
    }
    return null;
  }

  session.lastActiveAt = now;
  await cacheSet(getSessionRedisKey(id), session, TTL_SECONDS);
  memoryStore.set(id, session);

  // Refresh user session index TTL alongside active session
  await cacheSet(userKey, id, TTL_SECONDS);
  memoryUserSessionStore.set(session.userId, id);

  return session;
}

/**
 * Utility to extract a single property from the current session.
 */
export async function getFromSession<K extends keyof SessionData>(
  key: K,
): Promise<SessionData[K] | null> {
  const session = await getSession();
  return session ? session[key] : null;
}

/**
 * Patches the existing active session while preserving remaining TTL.
 */
export async function updateSession(patch: SessionPatch): Promise<SessionData | null> {
  const id = await currentSessionId();
  if (!id) return null;

  const session = await getSession();
  if (!session) return null;

  const next: SessionData = {
    ...session,
    ...patch,
    createdAt: session.createdAt,
    currUser: patch.currUser ? { ...session.currUser, ...patch.currUser } : session.currUser,
  };

  await cacheSet(getSessionRedisKey(id), next, TTL_SECONDS);
  memoryStore.set(id, next);
  return next;
}

/**
 * Updates active user's branch code and branch name and synchronizes the branch cookie.
 */
export async function updateBranchCodeAndName(
  branchCode: string,
  branchName: string,
): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  const next = await updateSession({
    currUser: { ...session.currUser, branchCode, branchName },
  });

  if (next?.currUser) {
    const store = await cookies();
    store.set(serverConfig.auth.branchCookie, branchCode, cookieOpts(false));
  }

  return next?.currUser ?? null;
}

/**
 * Completes the first-time login lifecycle by clearing the initLogin requirement.
 */
export async function clearInitialLoginRequirement(): Promise<void> {
  await updateSession({ currUser: { initLogin: false } });
  const store = await cookies();
  store.delete(serverConfig.auth.initLoginCookie);
}

/**
 * Destroys active session in Redis and removes all session cookies.
 */
export async function destroySession(): Promise<void> {
  const id = await currentSessionId();
  if (id) {
    let session = await cacheGet<SessionData>(getSessionRedisKey(id));
    if (!session) {
      session = memoryStore.get(id) ?? null;
    }
    if (session?.userId) {
      const userKey = getUserSessionRedisKey(session.userId);
      const activeSessionId =
        (await cacheGet<string>(userKey)) ?? memoryUserSessionStore.get(session.userId);
      if (activeSessionId === id) {
        await cacheDelete(userKey);
        memoryUserSessionStore.delete(session.userId);
      }
    }
    await cacheDelete(getSessionRedisKey(id));
    memoryStore.delete(id);
  }

  const store = await cookies();
  store.delete(COOKIE_NAME);
  store.delete(serverConfig.auth.initLoginCookie);
  store.delete(serverConfig.auth.branchCookie);
}
