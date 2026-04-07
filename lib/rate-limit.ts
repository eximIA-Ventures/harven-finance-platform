/**
 * In-memory rate limiter with memory protection.
 * For production with multiple instances, replace with Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10000; // Prevent memory exhaustion

// Cleanup stale entries every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60 * 1000);
}

interface RateLimitOptions {
  max: number;
  windowSec: number;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  opts: RateLimitOptions = { max: 10, windowSec: 60 }
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // Memory protection: if store is too large, evict oldest
  if (!entry && store.size >= MAX_STORE_SIZE) {
    const firstKey = store.keys().next().value;
    if (firstKey) store.delete(firstKey);
  }

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowSec * 1000 });
    return { ok: true, remaining: opts.max - 1, resetAt: now + opts.windowSec * 1000 };
  }

  entry.count++;

  if (entry.count > opts.max) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { ok: true, remaining: opts.max - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

/**
 * Global rate limit — apply to any API route.
 * Returns 429 response if limit exceeded, null if OK.
 */
export function globalRateLimit(request: Request): Response | null {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`global:${ip}`, { max: 100, windowSec: 60 });
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "Muitas requisicoes. Tente novamente em breve." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }
  return null;
}
