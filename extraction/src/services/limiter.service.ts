export class OutboundRateLimiter {
  private timestamps: number[] = [];
  private limitPerMinute: number;

  constructor(limitPerMinute = 30) {
    this.limitPerMinute = limitPerMinute;
  }

  public tryAcquire(): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    const windowStart = now - 60_000;

    // Prune timestamps older than 60 seconds
    this.timestamps = this.timestamps.filter((t) => t > windowStart);

    if (this.timestamps.length >= this.limitPerMinute) {
      const oldestInWindow = this.timestamps[0];
      const retryAfterMs = oldestInWindow + 60_000 - now;
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000))
      };
    }

    this.timestamps.push(now);
    return { allowed: true };
  }

  public getStats() {
    const now = Date.now();
    const activeRequests = this.timestamps.filter((t) => t > now - 60_000).length;
    return {
      activeRequestsLastMinute: activeRequests,
      limitPerMinute: this.limitPerMinute,
      availableSlots: Math.max(0, this.limitPerMinute - activeRequests)
    };
  }
}

const limit = parseInt(process.env.OUTBOUND_RATE_LIMIT_PER_MINUTE || '30', 10);
export const outboundLimiter = new OutboundRateLimiter(limit);
