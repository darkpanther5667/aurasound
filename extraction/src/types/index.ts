export interface ResolvedAudioStream {
  id: string;
  source: 'youtube';
  title: string;
  artist: string;
  coverUrl: string;
  durationSeconds: number;
  streamUrl: string;
  expiresAt: string; // ISO 8601
}

export interface SearchResultItem {
  videoId: string;
  title: string;
  artist: string;
  coverUrl: string;
  durationSeconds: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: 'INVALID_PARAMS' | 'VIDEO_UNAVAILABLE' | 'AGE_RESTRICTED' | 'RATE_LIMITED' | 'EXTRACTION_FAILED' | 'INTERNAL_ERROR';
}
