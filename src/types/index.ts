export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  genre: string;
  bpm?: number;
  musicalKey?: string;
  audioFormat?: string; // e.g. "24-BIT / 96KHZ FLAC"
  colorAccent?: string;
  isSynthesizedFallback?: boolean;
  source?: 'audius' | 'youtube';
  externalId?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';
export type VisualizerMode = 'monochrome-bars' | 'precision-fft' | 'oscilloscope' | 'stereo-field';
export type ActiveTab = 'library' | 'discover' | 'broadcast' | 'soundlab' | 'queue' | 'settings';
export type SpatialMode = 'stereo' | 'binaural' | 'mono';
export type EqPreset = 'reference' | 'warm-analog' | 'club-sub' | 'vocal-air';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}

export type AudioQuality = 'lossless-flac' | 'high-320' | 'standard-192' | 'data-saver';

export interface PlaybackSettings {
  audioQuality: AudioQuality;
  autoplay: boolean;
  defaultEqPreset: EqPreset;
}

export interface PrivacySettings {
  showActivityToFriends: boolean;
  friendRequestScope: 'everyone' | 'nobody';
}

export interface NotificationSettings {
  friendActivity: boolean;
  newFollowers: boolean;
  newReleases: boolean;
}

export interface UserSettings {
  playback: PlaybackSettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
}

export interface SocialFriend {
  id: string;
  name: string;
  avatar: string;
  currentTrack: string;
  artist: string;
  isLive: boolean;
  syncedTime?: string;
  city?: string;
}

export interface AudioFrequencyData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  averageFrequency: number;
  bassLevel: number;
}
