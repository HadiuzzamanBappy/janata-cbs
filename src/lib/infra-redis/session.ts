import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { serverConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import type { CurrentUser } from "@/lib/data-schemas";
import { cacheDelete, cacheKey, cacheRead, cacheSet } from "./client";

const sessionLogger = logger.withContext("SESSION");

export type { CurrentUser };

export interface SessionData {
  userId: string;
  token: string;
  currUser: CurrentUser;
  createdAt: number;
  lastActiveAt: number;
}

type SessionPatch = Partial<Omit<SessionData, "createdAt" | "currUser">> & {
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

/*
 * Storage rule: Redis is the source of truth whenever it is reachable, so a Redis miss means the
 * session is gone (logged out, superseded or expired), even if another copy exists somewhere.
 * Memory holds only what Redis couldn't store (cache disabled, or Redis down), and such an entry
 * moves back to Redis on the first read after recovery.
 */
async function load<T>(redisKey: string, memory: Map<string, T>, id: string): Promise<T | null> {
  const stored = await cacheRead<T>(redisKey);
  if (stored === undefined) return memory.get(id) ?? null; // Redis disabled or unavailable
  if (stored !== null) return stored;

  const pending = memory.get(id); // written while Redis was unavailable
  if (pending === undefined) return null;
  if (await cacheSet(redisKey, pending, TTL_SECONDS)) memory.delete(id);
  return pending;
}

async function save<T>(redisKey: string, memory: Map<string, T>, id: string, value: T) {
  if (await cacheSet(redisKey, value, TTL_SECONDS)) {
    memory.delete(id);
    return;
  }
  memory.set(id, value);
  pruneExpiredMemorySessions();
}

async function drop<T>(redisKey: string, memory: Map<string, T>, id: string): Promise<void> {
  memory.delete(id);
  await cacheDelete(redisKey);
}

/** Memory sessions are not swept by a Redis TTL, so expired ones are removed here. */
function pruneExpiredMemorySessions(): void {
  const cutoff = Date.now() - TTL_SECONDS * 1000;
  for (const [id, session] of memoryStore) {
    if (session.lastActiveAt < cutoff) {
      memoryStore.delete(id);
      if (memoryUserSessionStore.get(session.userId) === id) {
        memoryUserSessionStore.delete(session.userId);
      }
    }
  }
}

/** Options for the session cookies set below (HTTP-only). */
const COOKIE_OPTS = {
  httpOnly: true,
  secure: !serverConfig.isDev && serverConfig.useHttps,
  sameSite: "lax" as const,
  path: "/",
};

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
  const existingSessionId = await load(userKey, memoryUserSessionStore, data.userId);

  if (existingSessionId) {
    sessionLogger.info(
      `Revoking previous active session ${existingSessionId} for user ${data.userId} to enforce single login`,
    );
    await drop(getSessionRedisKey(existingSessionId), memoryStore, existingSessionId);
  }

  // Also clean up old session from current cookie if it differed
  if (oldId && oldId !== existingSessionId) {
    await drop(getSessionRedisKey(oldId), memoryStore, oldId);
  }

  const id = randomUUID();
  const now = Date.now();
  const payload: SessionData = { ...data, createdAt: now, lastActiveAt: now };

  await save(getSessionRedisKey(id), memoryStore, id, payload);

  // 2. Index this session as the user's active session
  await save(userKey, memoryUserSessionStore, data.userId, id);

  // Session cookie: omit maxAge so the cookie persists for the active browser session.
  // Redis TTL and session.lastActiveAt strictly govern the sliding inactivity window.
  store.set(COOKIE_NAME, id, COOKIE_OPTS);

  if (payload.currUser.initLogin) {
    store.set(serverConfig.auth.initLoginCookie, "true", COOKIE_OPTS);
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

  const sessionKey = getSessionRedisKey(id);
  const session = await load(sessionKey, memoryStore, id);
  if (!session) return null;

  // Single Active Login Check: Ensure this session is still the active session for this user
  const userKey = getUserSessionRedisKey(session.userId);
  const activeSessionId = await load(userKey, memoryUserSessionStore, session.userId);

  if (activeSessionId && activeSessionId !== id) {
    sessionLogger.warn(
      `Session ${id} superseded: user ${session.userId} has logged in from another browser or device`,
    );
    await drop(sessionKey, memoryStore, id);
    return null;
  }

  const maxInactiveMs = TTL_SECONDS * 1000;
  const now = Date.now();

  if (session.lastActiveAt && now - session.lastActiveAt > maxInactiveMs) {
    const timeoutMin = Math.floor(TTL_SECONDS / 60);
    sessionLogger.warn(`Session ${id} expired due to inactivity (> ${timeoutMin}m)`);
    await drop(sessionKey, memoryStore, id);
    if (activeSessionId === id) {
      await drop(userKey, memoryUserSessionStore, session.userId);
    }
    return null;
  }

  session.lastActiveAt = now;
  await save(sessionKey, memoryStore, id, session);

  // Refresh user session index TTL alongside active session
  await save(userKey, memoryUserSessionStore, session.userId, id);

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
async function updateSession(patch: SessionPatch): Promise<SessionData | null> {
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

  await save(getSessionRedisKey(id), memoryStore, id, next);
  return next;
}

/**
 * Updates the active user's branch code and name in the session (the branch every proxied
 * request is sent with).
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
    const sessionKey = getSessionRedisKey(id);
    const session = await load(sessionKey, memoryStore, id);
    if (session?.userId) {
      const userKey = getUserSessionRedisKey(session.userId);
      if ((await load(userKey, memoryUserSessionStore, session.userId)) === id) {
        await drop(userKey, memoryUserSessionStore, session.userId);
      }
    }
    await drop(sessionKey, memoryStore, id);
  }

  const store = await cookies();
  store.delete(COOKIE_NAME);
  store.delete(serverConfig.auth.initLoginCookie);
}
