import axios from 'axios';

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  artist: string;
  coverUrl: string;
  durationSeconds: number;
}

export interface YouTubeResolvedStream {
  id: string;
  source: 'youtube';
  title: string;
  artist: string;
  coverUrl: string;
  durationSeconds: number;
  streamUrl: string;
  expiresAt: string;
}

export class ExtractionClientError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string, status = 502) {
    super(message);
    this.name = 'ExtractionClientError';
    this.code = code;
    this.status = status;
  }
}

export class YouTubeExtractionService {
  private get baseUrl(): string {
    return process.env.EXTRACTION_SERVICE_URL || 'http://127.0.0.1:4001';
  }

  /**
   * Search YouTube via extraction microservice
   * Filters out channel IDs and zero duration items
   * Degrades gracefully on timeout or service unreachability
   */
  public async search(query: string, limit = 10): Promise<YouTubeSearchResult[]> {
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await axios.get(url, { timeout: 15000 });

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Enforce strict 11-char ID and positive duration filter
        return response.data.data.filter(
          (item: YouTubeSearchResult) =>
            item.videoId &&
            /^[a-zA-Z0-9_-]{11}$/.test(item.videoId) &&
            typeof item.durationSeconds === 'number' &&
            item.durationSeconds > 0
        );
      }
      return [];
    } catch (err: any) {
      console.warn(
        `[YouTube Service] Extraction microservice search failed (${err.code || err.message}). Gracefully degrading.`
      );
      return [];
    }
  }

  /**
   * Resolve playable YouTube stream URL with sanitized user-facing error messages
   */
  public async resolveStream(videoId: string): Promise<YouTubeResolvedStream> {
    try {
      const url = `${this.baseUrl}/resolve?videoId=${encodeURIComponent(videoId)}`;
      const response = await axios.get(url, { timeout: 25000 });

      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new ExtractionClientError("Couldn't load this track", 'EXTRACTION_FAILED', 502);
    } catch (err: any) {
      if (err instanceof ExtractionClientError) {
        throw err;
      }

      if (err.response && err.response.data) {
        const errorData = err.response.data;
        const code = errorData.code || 'EXTRACTION_FAILED';

        // Map strictly to user-facing error messages (no raw stderr/stdout)
        const cleanMessage =
          code === 'VIDEO_UNAVAILABLE'
            ? 'This track is no longer available'
            : code === 'AGE_RESTRICTED'
            ? "This track can't be played"
            : code === 'RATE_LIMITED'
            ? 'Too many requests, try again shortly'
            : "Couldn't load this track";

        const status =
          code === 'VIDEO_UNAVAILABLE'
            ? 404
            : code === 'AGE_RESTRICTED'
            ? 403
            : code === 'RATE_LIMITED'
            ? 429
            : 502;

        throw new ExtractionClientError(cleanMessage, code, status);
      }

      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        throw new ExtractionClientError(
          "Couldn't load this track",
          'EXTRACTION_FAILED',
          502
        );
      }

      throw new ExtractionClientError("Couldn't load this track", 'EXTRACTION_FAILED', 502);
    }
  }
}

export const youtubeService = new YouTubeExtractionService();
