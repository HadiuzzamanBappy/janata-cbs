import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { appConfig } from "@/lib/core-config/server";
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

/* -------------------------------------------------------------------------- */
/* Configuration & In-Memory Fallback State                                   */
/* -------------------------------------------------------------------------- */

const COOKIE_NAME = appConfig.auth.cookieName;
const TTL_SECONDS = appConfig.auth.sessionMaxAgeSeconds;

declare global {
  var __memorySessionStore: Map<string, SessionData> | undefined;
}
if (!globalThis.__memorySessionStore) {
  globalThis.__memorySessionStore = new Map<string, SessionData>();
}
const memoryStore = globalThis.__memorySessionStore;

const getSessionRedisKey = (id: string): string => cacheKey("sess", id);

async function currentSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
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

  if (oldId) {
    await cacheDelete(getSessionRedisKey(oldId));
    memoryStore.delete(oldId);
  }

  const id = randomUUID();
  const now = Date.now();
  const payload: SessionData = { ...data, createdAt: now, lastActiveAt: now };

  await cacheSet(getSessionRedisKey(id), payload, TTL_SECONDS);
  memoryStore.set(id, payload);

  const isSecure = !appConfig.isDev && appConfig.useHttps;

  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });

  if (payload.currUser.initLogin) {
    store.set(appConfig.auth.initLoginCookie, "true", {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: TTL_SECONDS,
    });
  } else {
    store.delete(appConfig.auth.initLoginCookie);
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

  // Fallback to in-memory store if Redis was offline or disabled
  if (!session) {
    session = memoryStore.get(id) ?? null;
  }

  if (!session) return null;

  // Server-side Inactivity Guard
  const timeoutMinutes = appConfig.logoutTime;
  const maxInactiveMs = timeoutMinutes * 60 * 1000;
  const now = Date.now();

  if (session.lastActiveAt && now - session.lastActiveAt > maxInactiveMs) {
    sessionLogger.warn(`Session ${id} expired due to inactivity (> ${timeoutMinutes}m)`);
    await cacheDelete(getSessionRedisKey(id));
    memoryStore.delete(id);
    return null;
  }

  // Refresh lastActiveAt and extend TTL
  session.lastActiveAt = now;
  await cacheSet(getSessionRedisKey(id), session, TTL_SECONDS);
  memoryStore.set(id, session);

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
export async function updateSession(
  patch: Partial<Omit<SessionData, "createdAt">>,
): Promise<SessionData | null> {
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
 * Updates active user's branch code and branch name seamlessly.
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
 * Destroys active session in Redis and removes the HTTP-only cookie.
 */
export async function destroySession(): Promise<void> {
  const id = await currentSessionId();
  if (id) {
    await cacheDelete(getSessionRedisKey(id));
    memoryStore.delete(id);
  }

  const store = await cookies();
  store.delete(COOKIE_NAME);
  store.delete(appConfig.auth.initLoginCookie);
}
