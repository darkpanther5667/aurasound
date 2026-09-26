import { execFile } from 'child_process';
import { promisify } from 'util';
import { ResolvedAudioStream, SearchResultItem } from '../types/index.js';

const execFileAsync = promisify(execFile);
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

// Maximum allowed duration for regular music track searches (15 minutes).
// Excludes full DJ sets, live sessions, podcasts, and long mixes.
export const MAX_TRACK_DURATION_SECONDS = 900;

export class YtdlError extends Error {
  public code: 'VIDEO_UNAVAILABLE' | 'AGE_RESTRICTED' | 'RATE_LIMITED' | 'EXTRACTION_FAILED';

  constructor(message: string, code: 'VIDEO_UNAVAILABLE' | 'AGE_RESTRICTED' | 'RATE_LIMITED' | 'EXTRACTION_FAILED') {
    super(message);
    this.name = 'YtdlError';
    this.code = code;
  }
}

export class YtdlService {
  /**
   * Resolves playable audio stream URL and metadata for a given YouTube video ID
   */
  public async resolveAudioStream(videoId: string): Promise<ResolvedAudioStream> {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const args = [
      '--no-playlist',
      '-f',
      'bestaudio/best',
      '--dump-single-json',
      '--no-warnings',
      videoUrl
    ];

    try {
      const { stdout } = await execFileAsync(YT_DLP_PATH, args, {
        timeout: 25000,
        maxBuffer: 10 * 1024 * 1024
      });

      const data = JSON.parse(stdout);
      const streamUrl = data.url;

      if (!streamUrl) {
        throw new YtdlError("Couldn't load this track", 'EXTRACTION_FAILED');
      }

      // Extract real expiration timestamp from YouTube's URL expire parameter
      let expiresAt: string;
      const expireMatch = streamUrl.match(/[?&]expire=(\d+)/);
      if (expireMatch && expireMatch[1]) {
        const expireEpochSeconds = parseInt(expireMatch[1], 10);
        expiresAt = new Date(expireEpochSeconds * 1000).toISOString();
      } else {
        // Fallback default: 4 hours from now
        expiresAt = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
      }

      const coverUrl =
        data.thumbnail ||
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

      return {
        id: videoId,
        source: 'youtube',
        title: data.title || 'Unknown Title',
        artist: data.uploader || data.channel || data.creator || 'YouTube Artist',
        coverUrl,
        durationSeconds: Math.round(data.duration || 0),
        streamUrl,
        expiresAt
      };
    } catch (err: any) {
      this.classifyError(err);
    }
  }

  /**
   * Fast search metadata retrieval without stream resolution
   * Filters out channel IDs (non-11 char IDs), zero/missing duration items,
   * and long-form content (> MAX_TRACK_DURATION_SECONDS, e.g. DJ sets, live streams)
   */
  public async search(query: string, limit = 10): Promise<SearchResultItem[]> {
    // Request extra items to ensure limit is met after filtering out channels, 0-duration videos, and long sets
    const fetchLimit = Math.max(limit * 3, 20);
    const args = [
      '--no-playlist',
      '--flat-playlist',
      '--dump-json',
      '--no-warnings',
      `ytsearch${fetchLimit}:${query}`
    ];

    try {
      const { stdout } = await execFileAsync(YT_DLP_PATH, args, {
        timeout: 20000,
        maxBuffer: 10 * 1024 * 1024
      });

      const lines = stdout.trim().split('\n').filter(Boolean);
      const results: SearchResultItem[] = [];

      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          const isValidId = item.id && /^[a-zA-Z0-9_-]{11}$/.test(item.id);
          const duration = Math.round(item.duration || 0);

          // Exclude channel IDs (non-11 chars), zero/missing duration, and long-form sets (> MAX_TRACK_DURATION_SECONDS)
          if (isValidId && duration > 0 && duration <= MAX_TRACK_DURATION_SECONDS) {
            results.push({
              videoId: item.id,
              title: item.title || 'Untitled',
              artist: item.uploader || item.channel || 'YouTube Artist',
              coverUrl:
                item.thumbnail ||
                (item.thumbnails && item.thumbnails[0]?.url) ||
                `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
              durationSeconds: duration
            });

            if (results.length >= limit) break;
          }
        } catch {
          // Skip invalid JSON lines
        }
      }

      return results;
    } catch (err: any) {
      this.classifyError(err);
    }
  }

  /**
   * Health and version telemetry check
   */
  public async getVersion(): Promise<string> {
    try {
      const { stdout } = await execFileAsync(YT_DLP_PATH, ['--version']);
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  private classifyError(err: any): never {
    const rawError = (err.stderr || err.message || '').toString();
    // Log raw stderr to server-side logs only
    console.error('[yt-dlp raw error]:', rawError);

    const errorLower = rawError.toLowerCase();

    if (
      errorLower.includes('video unavailable') ||
      errorLower.includes('private video') ||
      errorLower.includes('this video has been removed') ||
      errorLower.includes('does not exist') ||
      errorLower.includes('incomplete youtube id') ||
      errorLower.includes('is not a valid url')
    ) {
      throw new YtdlError('This track is no longer available', 'VIDEO_UNAVAILABLE');
    }

    if (
      errorLower.includes('sign in to confirm your age') ||
      errorLower.includes('age-restricted')
    ) {
      throw new YtdlError("This track can't be played", 'AGE_RESTRICTED');
    }

    if (
      errorLower.includes('http error 429') ||
      errorLower.includes('too many requests') ||
      errorLower.includes('sign in to confirm you’re not a bot')
    ) {
      throw new YtdlError('Too many requests, try again shortly', 'RATE_LIMITED');
    }

    throw new YtdlError("Couldn't load this track", 'EXTRACTION_FAILED');
  }
}

export const ytdlService = new YtdlService();
