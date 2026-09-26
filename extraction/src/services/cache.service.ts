import { ResolvedAudioStream } from '../types/index.js';

interface CacheEntry {
  data: ResolvedAudioStream;
  expiresAtMs: number;
  cachedAt: number;
}

export class StreamCacheService {
  private cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  public get(videoId: string): ResolvedAudioStream | null {
    const entry = this.cache.get(videoId);
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    // 5 minutes buffer before actual expiration to prevent serving a link that dies during playback
    if (now >= entry.expiresAtMs - 300_000) {
      this.cache.delete(videoId);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  public set(videoId: string, data: ResolvedAudioStream): void {
    const expiresAtMs = new Date(data.expiresAt).getTime();
    this.cache.set(videoId, {
      data,
      expiresAtMs: Number.isNaN(expiresAtMs) ? Date.now() + 4 * 3600 * 1000 : expiresAtMs,
      cachedAt: Date.now()
    });
  }

  public getStats() {
    // Clean up expired items during stats check
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAtMs - 300_000) {
        this.cache.delete(key);
      }
    }

    return {
      cachedItems: this.cache.size,
      cacheHits: this.hits,
      cacheMisses: this.misses
    };
  }
}

export const streamCache = new StreamCacheService();
