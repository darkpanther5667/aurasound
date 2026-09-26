// Replaced direct Audius discovery node calls with AuraSound backend gateway proxy
import { fetchTrendingTracks } from './api';
import { Track } from '../types';

export async function fetchTrendingAudiusTracks(): Promise<Track[]> {
  try {
    return await fetchTrendingTracks(15);
  } catch (err) {
    console.warn('Backend trending fetch fallback:', err);
    const { INITIAL_TRACKS } = await import('../data/mockTracks');
    return INITIAL_TRACKS;
  }
}
