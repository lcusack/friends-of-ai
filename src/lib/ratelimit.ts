import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

export type RateResult = { allowed: true } | { allowed: false; resetMs: number };

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (limiter) return limiter;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  limiter = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "foai:rl:verify",
    analytics: false,
  });
  return limiter;
}

export function clientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = (xff?.split(",")[0] ?? realIp ?? "unknown").trim();
  return ip || "unknown";
}

export async function rateLimit(key: string): Promise<RateResult> {
  const l = getLimiter();
  if (!l) return { allowed: true };
  const r = await l.limit(key);
  if (r.success) return { allowed: true };
  return { allowed: false, resetMs: r.reset - Date.now() };
}
