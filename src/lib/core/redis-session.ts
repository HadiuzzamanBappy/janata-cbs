import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getRedisClient } from "@/lib/core/redis-client";

export interface CurrentUser {
  userId: string;
  fullName: string;
  userRole: string[];
  accessibility: string;
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
}

const COOKIE_NAME = "sid";
const SESSION_PREFIX = "sess:";
const TTL_SECONDS = 60 * 60 * 8; // 8-hour sliding window

const sessionKey = (id: string): string => `${SESSION_PREFIX}${id}`;

async function currentSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Creates a new session in Redis and sets the HTTP-only opaque cookie.
 */
export async function createSession(
  data: Omit<SessionData, "createdAt">
): Promise<string> {
  const store = await cookies();
  const oldId = store.get(COOKIE_NAME)?.value;
  const redis = getRedisClient();

  if (oldId && redis) {
    try {
      await redis.del(sessionKey(oldId));
    } catch {
      // Ignore Redis delete failure on cleanup
    }
  }

  const id = randomUUID();
  const payload: SessionData = { ...data, createdAt: Date.now() };
  const key = sessionKey(id);

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(payload), "EX", TTL_SECONDS);
    } catch (error) {
      console.warn("[session] Failed to persist session in Redis:", error);
    }
  }

  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.USE_HTTPS === "true",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });

  return id;
}

/**
 * Reads the session from Redis and resets its TTL (sliding window expiry).
 */
export async function getSession(): Promise<SessionData | null> {
  const id = await currentSessionId();
  if (!id) return null;

  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const raw = await redis.get(sessionKey(id));
    if (!raw) return null;

    await redis.expire(sessionKey(id), TTL_SECONDS);
    // TODO: [Step 4 - Auth Flow] Implement automatic JWT refresh token rotation on sliding session renewal.
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Utility to extract a single property from the current session.
 */
export async function getFromSession<K extends keyof SessionData>(
  key: K
): Promise<SessionData[K] | null> {
  const session = await getSession();
  return session ? session[key] : null;
}

/**
 * Patches the existing active session while preserving remaining TTL.
 */
export async function updateSession(
  patch: Partial<Omit<SessionData, "createdAt">>
): Promise<SessionData | null> {
  const id = await currentSessionId();
  if (!id) return null;

  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const raw = await redis.get(sessionKey(id));
    if (!raw) return null;

    const current = JSON.parse(raw) as SessionData;
    const next: SessionData = {
      ...current,
      ...patch,
      createdAt: current.createdAt,
      currUser: patch.currUser
        ? { ...current.currUser, ...patch.currUser }
        : current.currUser,
    };

    await redis.set(sessionKey(id), JSON.stringify(next), "EX", TTL_SECONDS);
    return next;
  } catch {
    return null;
  }
}

/**
 * Updates active user's branch code and branch name seamlessly.
 */
export async function updateBranchCodeAndName(
  branchCode: string,
  branchName: string
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
  }

  const store = await cookies();
  store.delete(COOKIE_NAME);
}
