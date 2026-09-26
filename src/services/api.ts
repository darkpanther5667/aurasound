import { Track } from '../types';

export const BACKEND_URL = ((import.meta as any).env?.VITE_BACKEND_URL as string) || 'http://127.0.0.1:4000';

export interface BackendTrackItem {
  id: string;
  source: 'audius' | 'youtube';
  externalId: string;
  title: string;
  artist: string;
  coverUrl: string;
  durationSeconds: number;
  streamUrl?: string;
  genre?: string;
}

export interface StreamResolutionData {
  id: string;
  source: 'audius' | 'youtube';
  externalId: string;
  title: string;
  artist: string;
  coverUrl: string;
  durationSeconds: number;
  streamUrl: string;
  expiresAt?: string | null;
}

export class StreamResolutionError extends Error {
  public code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'StreamResolutionError';
    this.code = code;
  }
}

function normalizeBackendTrack(t: BackendTrackItem, idx = 0): Track {
  return {
    id: t.id || t.externalId,
    source: t.source,
    externalId: t.externalId,
    title: t.title || `Track ${idx + 1}`,
    artist: t.artist || 'AuraSound Artist',
    duration: t.durationSeconds || 180,
    coverUrl: t.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    audioUrl: t.streamUrl
      ? (t.streamUrl.startsWith('http') ? t.streamUrl : `${BACKEND_URL}${t.streamUrl}`)
      : `${BACKEND_URL}/tracks/${t.id || t.externalId}/stream`,
    genre: t.genre || '',
    colorAccent: '#8B5CF6'
  };
}

/**
 * Search tracks across Audius & YouTube via AuraSound Gateway
 */
export async function searchTracks(query: string, limit = 25): Promise<Track[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const res = await fetch(`${BACKEND_URL}/tracks/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Couldn't load search results");
  }

  const json = await res.json();
  const rawTracks: BackendTrackItem[] = json?.data?.tracks || [];
  return rawTracks.map((t, idx) => normalizeBackendTrack(t, idx));
}

/**
 * Fetch trending tracks from AuraSound Gateway (proxied and cached)
 */
export async function fetchTrendingTracks(limit = 20): Promise<Track[]> {
  const res = await fetch(`${BACKEND_URL}/tracks/trending?limit=${limit}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Couldn't load trending tracks");
  }

  const json = await res.json();
  const rawTracks: BackendTrackItem[] = json?.data?.tracks || [];
  return rawTracks.map((t, idx) => normalizeBackendTrack(t, idx));
}

/**
 * Resolve playable audio stream URL for any track (Audius or YouTube)
 */
export async function resolveTrackStream(trackId: string): Promise<StreamResolutionData> {
  const res = await fetch(`${BACKEND_URL}/tracks/${encodeURIComponent(trackId)}/stream`);
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    const sanitizedError = json.error || "Couldn't load this track";
    const errorCode = json.code || (res.status === 404 ? 'VIDEO_UNAVAILABLE' : 'EXTRACTION_FAILED');
    throw new StreamResolutionError(sanitizedError, errorCode);
  }

  const data = json.data as StreamResolutionData;
  if (data.streamUrl && data.streamUrl.startsWith('/')) {
    data.streamUrl = `${BACKEND_URL}${data.streamUrl}`;
  }

  return data;
}

/**
 * Fetch saved favorites from backend
 */
export async function fetchFavoritesApi(): Promise<Track[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/favorites`);
    if (!res.ok) return [];
    const json = await res.json();
    const favs = json?.data?.favorites || [];
    return favs.map((f: any, idx: number) =>
      normalizeBackendTrack(
        {
          id: f.id,
          source: f.source,
          externalId: f.externalId,
          title: f.title,
          artist: f.artist,
          coverUrl: f.coverUrl,
          durationSeconds: f.durationSeconds,
          streamUrl: `/tracks/${f.id}/stream`
        },
        idx
      )
    );
  } catch (err) {
    console.error('Fetch favorites error:', err);
    return [];
  }
}

/**
 * Add track to backend favorites
 */
export async function addFavoriteApi(track: Track): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackId: track.id,
        externalId: track.externalId || track.id,
        source: track.source || 'audius',
        title: track.title,
        artist: track.artist,
        coverUrl: track.coverUrl,
        durationSeconds: track.duration
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Add favorite error:', err);
    return false;
  }
}

/**
 * Remove track from backend favorites
 */
export async function removeFavoriteApi(trackId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/favorites/${encodeURIComponent(trackId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.error('Remove favorite error:', err);
    return false;
  }
}

/**
 * Fetch current user playback queue from backend
 */
export async function fetchQueueApi(): Promise<Track[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/queue`);
    if (!res.ok) return [];
    const json = await res.json();
    const items = json?.data?.queue || [];
    return items.map((item: any, idx: number) =>
      normalizeBackendTrack(
        {
          id: item.track?.id,
          source: item.track?.source,
          externalId: item.track?.externalId,
          title: item.track?.title,
          artist: item.track?.artist,
          coverUrl: item.track?.coverUrl,
          durationSeconds: item.track?.durationSeconds,
          streamUrl: `/tracks/${item.track?.id}/stream`
        },
        idx
      )
    );
  } catch (err) {
    console.error('Fetch queue error:', err);
    return [];
  }
}

/**
 * Persist reordered or updated queue to backend
 */
export async function updateQueueApi(tracks: Track[]): Promise<boolean> {
  try {
    const payload = {
      tracks: tracks.map((t) => ({
        id: t.id,
        source: t.source || 'audius',
        externalId: t.externalId || t.id,
        title: t.title,
        artist: t.artist,
        coverUrl: t.coverUrl,
        durationSeconds: t.duration
      }))
    };
    const res = await fetch(`${BACKEND_URL}/queue`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error('Update queue error:', err);
    return false;
  }
}

/**
 * Clear playback queue on backend
 */
export async function clearQueueApi(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/queue`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.error('Clear queue error:', err);
    return false;
  }
}

/**
 * Authentication & Session Management
 */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('aurasound_jwt');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('aurasound_jwt', token);
    } else {
      localStorage.removeItem('aurasound_jwt');
    }
  } catch {}
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginApi(email: string, password: string): Promise<{ user: any; token: string }> {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Authentication failed');
  }
  setAuthToken(json.data.token);
  return json.data;
}

export async function signupApi(email: string, password: string): Promise<{ user: any; token: string }> {
  const res = await fetch(`${BACKEND_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Registration failed');
  }
  setAuthToken(json.data.token);
  return json.data;
}

export function logoutApi(): void {
  setAuthToken(null);
}

/**
 * User Profile API
 */
export async function fetchProfileApi(): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/profile`, {
    headers: getAuthHeaders()
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch user profile');
  }
  return json.data;
}

export async function updateProfileApi(data: { displayName?: string; avatarUrl?: string; bio?: string }): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to update user profile');
  }
  return json.data;
}

/**
 * User Settings API (Playback, Privacy, Notifications)
 */
export async function fetchSettingsApi(): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/settings`, {
    headers: getAuthHeaders()
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to load user settings');
  }
  return json.data;
}

export async function updateSettingsApi(settings: any): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to save settings');
  }
  return json.data;
}

/**
 * Account Management API
 */
export async function updateContactApi(data: { email?: string; phone?: string }): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/account/contact`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to update contact info');
  }
  return json.data;
}

export async function changePasswordApi(data: { currentPassword?: string; newPassword: string }): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/account/password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to change password');
  }
  return json.data;
}

export async function deleteAccountApi(): Promise<boolean> {
  const res = await fetch(`${BACKEND_URL}/account`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ confirmation: 'DELETE' })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to delete account');
  }
  logoutApi();
  return true;
}

