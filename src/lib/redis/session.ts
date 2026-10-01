import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { appConfig } from "@/lib/config";
import { getRedisClient } from "./client";

export interface CurrentUser {
  userId: string;
  fullName: string;
  userRole: string[];
  accessibility: string;
  functionRights?: string[];
  branchCode: string;
  branchName: string;
  txnDate: string;
  isLoggedIn: boolean;
  commandLine: boolean;
  initLogin: boolean;
  userStatus: number;
}

export interface SessionData {
  userId: string;
  token: string;
  currUser: CurrentUser;
  createdAt: number;
  lastActiveAt: number;
}

const COOKIE_NAME = appConfig.auth.cookieName;
const SESSION_PREFIX = appConfig.auth.sessionPrefix;
const TTL_SECONDS = appConfig.auth.sessionMaxAgeSeconds;

// In-memory fallback session store for offline / dev when Redis is disabled or unavailable
declare global {
  var __memorySessionStore: Map<string, SessionData> | undefined;
}
const memoryStore = (globalThis.__memorySessionStore ??= new Map<string, SessionData>());

const sessionKey = (id: string): string => `${SESSION_PREFIX}${id}`;

async function currentSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Creates a new session in Redis and sets the HTTP-only opaque cookie.
 */
export async function createSession(
  data: Omit<SessionData, "createdAt" | "lastActiveAt">,
): Promise<string> {
  const store = await cookies();
  const oldId = store.get(COOKIE_NAME)?.value;
  const redis = getRedisClient();

  if (oldId) {
    if (redis) {
      try {
        await redis.del(sessionKey(oldId));
      } catch {
        // Ignore Redis delete failure on cleanup
      }
    }
    memoryStore.delete(oldId);
  }

  const id = randomUUID();
  const now = Date.now();
  const payload: SessionData = { ...data, createdAt: now, lastActiveAt: now };
  const key = sessionKey(id);

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(payload), "EX", TTL_SECONDS);
    } catch (error) {
      console.warn("[session] Failed to persist session in Redis:", error);
    }
  }
  // Store in memory cache as reliable fallback
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

  const redis = getRedisClient();
  let session: SessionData | null = null;

  if (redis) {
    try {
      const raw = await redis.get(sessionKey(id));
      if (raw) {
        session = JSON.parse(raw) as SessionData;
      }
    } catch {
      // Fall through to memoryStore on Redis error
    }
  }

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
    console.warn(`[session] Session ${id} expired due to inactivity (> ${timeoutMinutes}m)`);
    await destroySession();
    return null;
  }

  // Refresh lastActiveAt and extend TTL
  session.lastActiveAt = now;
  if (redis) {
    try {
      await redis.set(sessionKey(id), JSON.stringify(session), "EX", TTL_SECONDS);
    } catch {
      // Ignore Redis update error
    }
  }
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

  const redis = getRedisClient();
  const session = await getSession();
  if (!session) return null;

  const next: SessionData = {
    ...session,
    ...patch,
    createdAt: session.createdAt,
    currUser: patch.currUser ? { ...session.currUser, ...patch.currUser } : session.currUser,
  };

  if (redis) {
    try {
      await redis.set(sessionKey(id), JSON.stringify(next), "EX", TTL_SECONDS);
    } catch {
      // Fallback
    }
  }
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
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(sessionKey(id));
      } catch {
        // Ignore deletion errors during logout
      }
    }
    memoryStore.delete(id);
  }

  const store = await cookies();
  store.delete(COOKIE_NAME);
  store.delete("initLogin");
}
