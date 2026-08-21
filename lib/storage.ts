/**
 * lib/storage.ts
 *
 * Unified storage layer for the Security Portal.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ENVIRONMENT               │  BACKEND USED                               │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  Local dev (no Redis URL)  │  In-memory Map — resets on restart          │
 * │  Production (Upstash set)  │  @upstash/redis — fully persistent          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Upstash Redis replaces the deprecated @vercel/kv.
 * It is the same underlying database — actively maintained, free tier available.
 *
 * Required env vars (set in Vercel dashboard or .env.local):
 *   UPSTASH_REDIS_REST_URL    – from upstash.com console
 *   UPSTASH_REDIS_REST_TOKEN  – from upstash.com console
 *
 * Data schema:
 *   portal:users              → JSON string of Record<email, User>
 *   portal:otp:<email>        → 3-digit OTP string, TTL 600s
 *   portal:logs               → JSON string of LogEntry[] (newest first)
 */

import { Redis } from '@upstash/redis';

export interface User {
  name: string;
  email: string;
}

export interface LogEntry {
  username: string;
  email: string;
  time: string;
  date: string;
}

// ─── In-Memory Fallback (Local Dev without Upstash) ──────────────────────────

const mem = {
  users: {} as Record<string, User>,
  otps: {} as Record<string, { value: string; expires: number }>,
  logs: [] as LogEntry[],
};

// ─── Detect Redis availability ────────────────────────────────────────────────

const useRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Lazily initialised Redis client — avoids crashing when env vars are absent
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

// ─── Low-level helpers ────────────────────────────────────────────────────────

async function redisGet<T>(key: string): Promise<T | null> {
  return getRedis().get<T>(key);
}

async function redisSet(key: string, value: unknown, ex?: number): Promise<void> {
  if (ex) {
    await getRedis().set(key, value, { ex });
  } else {
    await getRedis().set(key, value);
  }
}

async function redisDel(key: string): Promise<void> {
  await getRedis().del(key);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<Record<string, User>> {
  if (useRedis) {
    return (await redisGet<Record<string, User>>('portal:users')) ?? {};
  }
  return mem.users;
}

export async function addUser(user: User): Promise<void> {
  if (useRedis) {
    const users = await getUsers();
    users[user.email] = user;
    await redisSet('portal:users', users);
  } else {
    mem.users[user.email] = user;
  }
}

// ─── OTPs ─────────────────────────────────────────────────────────────────────

export async function setOtp(email: string, otp: string): Promise<void> {
  if (useRedis) {
    // TTL 600 seconds = 10 minutes
    await redisSet(`portal:otp:${email}`, otp, 600);
  } else {
    mem.otps[email] = { value: otp, expires: Date.now() + 600_000 };
  }
}

export async function getOtp(email: string): Promise<string | null> {
  if (useRedis) {
    return redisGet<string>(`portal:otp:${email}`);
  }
  const entry = mem.otps[email];
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    delete mem.otps[email];
    return null;
  }
  return entry.value;
}

export async function deleteOtp(email: string): Promise<void> {
  if (useRedis) {
    await redisDel(`portal:otp:${email}`);
  } else {
    delete mem.otps[email];
  }
}

// ─── Login Logs ───────────────────────────────────────────────────────────────

export async function getLogs(): Promise<LogEntry[]> {
  if (useRedis) {
    return (await redisGet<LogEntry[]>('portal:logs')) ?? [];
  }
  // Return newest first for display
  return [...mem.logs].reverse();
}

export async function addLog(entry: LogEntry): Promise<void> {
  if (useRedis) {
    const logs = await getLogs();
    logs.unshift(entry); // Prepend — newest always first
    await redisSet('portal:logs', logs);
  } else {
    mem.logs.push(entry);
  }
}
