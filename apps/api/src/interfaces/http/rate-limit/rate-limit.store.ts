export interface RateLimitHit {
  allowed: boolean;
  /** Seconds before the window resets (Retry-After). */
  retryAfterSeconds: number;
}

interface Window {
  count: number;
  resetAt: number;
}

/** Expired windows are swept once the map grows past this size. */
const SWEEP_THRESHOLD = 10_000;

/**
 * Fixed-window counters, in memory: enough for a single API instance (the
 * beta). Several instances would need a shared store (Redis).
 */
export class RateLimitStore {
  private readonly windows = new Map<string, Window>();

  constructor(private readonly now: () => number = Date.now) {}

  hit(key: string, limit: number, windowMs: number): RateLimitHit {
    const now = this.now();
    let window = this.windows.get(key);
    if (!window || window.resetAt <= now) {
      if (this.windows.size >= SWEEP_THRESHOLD) this.sweep(now);
      window = { count: 0, resetAt: now + windowMs };
      this.windows.set(key, window);
    }
    window.count += 1;
    return {
      allowed: window.count <= limit,
      retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)),
    };
  }

  get size(): number {
    return this.windows.size;
  }

  private sweep(now: number): void {
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) this.windows.delete(key);
    }
  }
}
