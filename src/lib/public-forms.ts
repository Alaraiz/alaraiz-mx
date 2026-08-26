import { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function hasSpamTrap(body: Record<string, unknown>) {
  return Boolean(String(body.website || body.company || body.url || "").trim());
}

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, remaining: options.limit - 1 };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    ok: current.count <= options.limit,
    remaining: Math.max(options.limit - current.count, 0),
  };
}
