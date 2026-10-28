import { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 3; // SPEC-AUTH-001 §4: 3 requests / 15 min per email
const MAX_PER_IP = 5; // SPEC-AUTH-001 §4: 5 requests / 15 min per IP
const RETRY_AFTER_SECONDS = '900';

const emailBuckets = new Map<string, number[]>();
const ipBuckets = new Map<string, number[]>();

function consume(buckets: Map<string, number[]>, key: string, max: number): boolean {
  const now = Date.now();
  const attempts = (buckets.get(key) ?? []).filter((ts) => now - ts < WINDOW_MS);
  if (attempts.length >= max) {
    buckets.set(key, attempts);
    return false;
  }
  attempts.push(now);
  buckets.set(key, attempts);
  return true;
}

/**
 * Rate-limiting middleware — runs before any business logic or database
 * queries (SPEC-AUTH-001 Scenario 3; cursorrules §3).
 */
export function passwordResetRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip ?? 'unknown';
  const email: unknown = req.body?.email;

  const ipAllowed = consume(ipBuckets, ip, MAX_PER_IP);
  const emailAllowed =
    typeof email === 'string'
      ? consume(emailBuckets, email.toLowerCase(), MAX_PER_EMAIL)
      : true;

  if (!ipAllowed || !emailAllowed) {
    res.status(429).set('Retry-After', RETRY_AFTER_SECONDS).json({
      error: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please try again later.',
    });
    return;
  }

  next();
}
