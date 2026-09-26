import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track, RepeatMode, VisualizerMode, ActiveTab, SpatialMode, EqPreset, SocialFriend } from '../types';
import { audioEngine } from '../services/audioEngine';
import { INITIAL_TRACKS, SOCIAL_FRIENDS } from '../data/mockTracks';
import {
  searchTracks as searchTracksApi,
  fetchTrendingTracks,
  resolveTrackStream,
  fetchFavoritesApi,
  addFavoriteApi,
  removeFavoriteApi,
  fetchQueueApi,
  updateQueueApi,
  clearQueueApi
} from '../services/api';

let searchDebounceTimeout: any = null;
let toastTimeout: any = null;

interface MusicStoreState {
  // Playback state
  allTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoadingTrack: boolean;
  loadingTrackId: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  previousVolume: number;
  isMuted: boolean;

  // Toast notification state
  toast: { message: string; code?: string } | null;

  // Search state
  searchResults: Track[];
  isSearching: boolean;

  // Audio Engine DSP State
  spatialMode: SpatialMode;
  eqPreset: EqPreset;
  isEqWidgetOpen: boolean;

  // Queue & Navigation
  queue: Track[];
  queueIndex: number;
  history: Track[];
  favorites: Track[];
  socialFriends: SocialFriend[];

  // Settings & Modes
  shuffle: boolean;
  repeatMode: RepeatMode;
  visualizerMode: VisualizerMode;
  activeTab: ActiveTab;
  searchQuery: string;
  selectedGenre: string;
  isVisualizerFullscreen: boolean;

  // Actions
  setAllTracks: (tracks: Track[]) => void;
  fetchCatalog: () => Promise<void>;
  search: (query: string) => Promise<void>;
  showToast: (message: string, code?: string) => void;
  dismissToast: () => void;
  playTrack: (track: Track) => Promise<void>;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setSpatialMode: (mode: SpatialMode) => void;
  setEqPreset: (preset: EqPreset) => void;
  setEqWidgetOpen: (open: boolean) => void;
  addToQueue: (track: Track, playNext?: boolean) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  toggleFavorite: (track: Track) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSearchQuery: (query: string) => void;
  setSelectedGenre: (genre: string) => void;
  setVisualizerFullscreen: (fullscreen: boolean) => void;
  syncTime: (current: number, duration: number) => void;
  syncPlaying: (isPlaying: boolean) => void;
  fetchFavorites: () => Promise<void>;
  fetchQueue: () => Promise<void>;
}

export const useMusicStore = create<MusicStoreState>()(
  persist(
    (set, get) => ({
      allTracks: INITIAL_TRACKS,
      currentTrack: INITIAL_TRACKS[0],
      isPlaying: false,
      isLoadingTrack: false,
      loadingTrackId: null,
      currentTime: 0,
      duration: INITIAL_TRACKS[0]?.duration || 215,
      volume: 0.85,
      previousVolume: 0.85,
      isMuted: false,

      toast: null,
      searchResults: [],
      isSearching: false,

      spatialMode: 'stereo',
      eqPreset: 'reference',
      isEqWidgetOpen: false,

      queue: INITIAL_TRACKS.slice(0, 5),
      queueIndex: 0,
      history: [],
      favorites: [INITIAL_TRACKS[0], INITIAL_TRACKS[1]],
      socialFriends: SOCIAL_FRIENDS,

      shuffle: false,
      repeatMode: 'all',
      visualizerMode: 'monochrome-bars',
      activeTab: 'discover',
      searchQuery: '',
      selectedGenre: 'ALL VIBES',
      isVisualizerFullscreen: false,

      setAllTracks: (tracks) => set({ allTracks: tracks }),

      showToast: (message: string, code?: string) => {
        if (toastTimeout) clearTimeout(toastTimeout);
        set({ toast: { message, code } });
        toastTimeout = setTimeout(() => {
          set({ toast: null });
        }, 4500);
      },

      dismissToast: () => {
        if (toastTimeout) clearTimeout(toastTimeout);
        set({ toast: null });
      },

      fetchCatalog: async () => {
        try {
          const tracks = await fetchTrendingTracks(20);
          if (tracks.length > 0) {
            set((state) => {
              const hasCurrent = tracks.some((t) => t.id === state.currentTrack?.id);
              return {
                allTracks: tracks,
                currentTrack: hasCurrent ? state.currentTrack : tracks[0],
                queue:
                  state.queue.length > 0 && !state.queue[0]?.id.startsWith('track-')
                    ? state.queue
                    : tracks.slice(0, 5)
              };
            });
          }
        } catch (err) {
          console.warn('Backend catalog proxy fetch fallback:', err);
        }
      },

      search: async (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) {
          set({ searchResults: [], isSearching: false });
          return;
        }

        set({ isSearching: true });
        try {
          const results = await searchTracksApi(trimmed, 25);
          set({ searchResults: results, isSearching: false });
        } catch (err: any) {
          console.error('Search error:', err);
          set({ searchResults: [], isSearching: false });
          get().showToast(err.message || "Couldn't load search results");
        }
      },

      playTrack: async (track: Track) => {
        const { queue } = get();
        let newQueue = [...queue];
        let newIndex = newQueue.findIndex((t) => t.id === track.id);

        if (newIndex === -1) {
          newQueue.push(track);
          newIndex = newQueue.length - 1;
        }

        // Show brief loading state on play button during stream resolution
        set({
          isLoadingTrack: true,
          loadingTrackId: track.id,
          currentTrack: track,
          queue: newQueue,
          queueIndex: newIndex,
          currentTime: 0,
          duration: track.duration || 180
        });

        try {
          let resolvedStreamUrl = track.audioUrl;
          let resolvedDuration = track.duration;

          // Resolve current streamUrl via GET /tracks/:id/stream for backend tracks
          if (!track.id.startsWith('track-') || !track.audioUrl) {
            try {
              const resolved = await resolveTrackStream(track.id);
              resolvedStreamUrl = resolved.streamUrl;
              resolvedDuration = resolved.durationSeconds || track.duration;
            } catch (resolveErr: any) {
              if (!track.audioUrl) {
                throw resolveErr;
              }
            }
          }

          const playableTrack: Track = {
            ...track,
            audioUrl: resolvedStreamUrl,
            duration: resolvedDuration
          };

          set({
            currentTrack: playableTrack,
            duration: playableTrack.duration,
            isPlaying: true,
            isLoadingTrack: false,
            loadingTrackId: null
          });

          await audioEngine.playTrack(playableTrack, 0);
        } catch (err: any) {
          console.warn(`[Stream Resolution Error for ${track.id}]:`, err);

          set({
            isLoadingTrack: false,
            loadingTrackId: null,
            isPlaying: false
          });

          // Show short inline toast with error message (e.g. VIDEO_UNAVAILABLE, AGE_RESTRICTED, RATE_LIMITED, EXTRACTION_FAILED)
          const errorMsg = err.message || "Couldn't load this track";
          get().showToast(errorMsg, err.code);

          // Automatically skip to next track in queue rather than leaving playback stuck
          const currentQueue = get().queue;
          if (currentQueue.length > 1) {
            get().nextTrack();
          }
        }
      },

      togglePlay: () => {
        const { isPlaying, currentTrack, isLoadingTrack } = get();
        if (isLoadingTrack) return;

        if (!currentTrack) {
          const first = get().allTracks[0];
          if (first) {
            get().playTrack(first);
          }
          return;
        }

        if (isPlaying) {
          audioEngine.pause();
          set({ isPlaying: false });
        } else {
          // If stream has not yet been resolved or is a relative URL, resolve it first
          if (!currentTrack.audioUrl || currentTrack.audioUrl.startsWith('/tracks/') || currentTrack.audioUrl.endsWith('/stream')) {
            get().playTrack(currentTrack);
          } else {
            audioEngine.resume();
            set({ isPlaying: true });
          }
        }
      },

      nextTrack: () => {
        const { queue, queueIndex, shuffle, repeatMode, currentTrack } = get();
        if (queue.length === 0) return;

        if (repeatMode === 'one' && currentTrack) {
          get().playTrack(currentTrack);
          return;
        }

        let nextIdx: number;
        if (shuffle) {
          nextIdx = Math.floor(Math.random() * queue.length);
        } else {
          nextIdx = queueIndex + 1;
          if (nextIdx >= queue.length) {
            if (repeatMode === 'all') {
              nextIdx = 0;
            } else {
              set({ isPlaying: false });
              audioEngine.pause();
              return;
            }
          }
        }

        const nextT = queue[nextIdx];
        if (nextT) {
          get().playTrack(nextT);
        }
      },

      prevTrack: () => {
        const { queue, queueIndex, currentTime } = get();
        if (currentTime > 3) {
          get().seek(0);
          return;
        }

        if (queue.length === 0) return;
        let prevIdx = queueIndex - 1;
        if (prevIdx < 0) {
          prevIdx = queue.length - 1;
        }

        const prevT = queue[prevIdx];
        if (prevT) {
          get().playTrack(prevT);
        }
      },

      seek: (seconds) => {
        audioEngine.seek(seconds);
        set({ currentTime: seconds });
      },

      setVolume: (vol) => {
        const clamped = Math.max(0, Math.min(1, vol));
        audioEngine.setVolume(clamped);
        set({
          volume: clamped,
          isMuted: clamped === 0,
          previousVolume: clamped > 0 ? clamped : get().previousVolume
        });
      },

      toggleMute: () => {
        const { isMuted, volume, previousVolume } = get();
        if (isMuted) {
          const restore = previousVolume > 0 ? previousVolume : 0.85;
          audioEngine.setVolume(restore);
          set({ isMuted: false, volume: restore });
        } else {
          audioEngine.setVolume(0);
          set({ isMuted: true, previousVolume: volume, volume: 0 });
        }
      },

      setSpatialMode: (mode) => {
        audioEngine.setSpatialMode(mode);
        set({ spatialMode: mode });
      },

      setEqPreset: (preset) => {
        audioEngine.setEqPreset(preset);
        set({ eqPreset: preset });
      },

      setEqWidgetOpen: (open) => set({ isEqWidgetOpen: open }),

      addToQueue: (track, playNext = false) => {
        const { queue, queueIndex } = get();
        const filtered = queue.filter((t) => t.id !== track.id);

        let newQueue: Track[];
        let newIndex = queueIndex;

        if (playNext && queueIndex >= 0 && queueIndex < filtered.length) {
          newQueue = [
            ...filtered.slice(0, queueIndex + 1),
            track,
            ...filtered.slice(queueIndex + 1)
          ];
        } else {
          newQueue = [...filtered, track];
        }

        set({ queue: newQueue, queueIndex: newIndex });
        updateQueueApi(newQueue).catch(() => {});
      },

      removeFromQueue: (trackId) => {
        const { queue, queueIndex, currentTrack } = get();
        const newQueue = queue.filter((t) => t.id !== trackId);
        let newIndex = queueIndex;

        if (currentTrack && currentTrack.id === trackId && newQueue.length > 0) {
          newIndex = Math.min(queueIndex, newQueue.length - 1);
          get().playTrack(newQueue[newIndex]);
        } else if (newIndex >= newQueue.length) {
          newIndex = Math.max(0, newQueue.length - 1);
        }

        set({ queue: newQueue, queueIndex: newIndex });
        updateQueueApi(newQueue).catch(() => {});
      },

      clearQueue: () => {
        const { currentTrack } = get();
        const newQueue = currentTrack ? [currentTrack] : [];
        set({ queue: newQueue, queueIndex: 0 });
        if (newQueue.length === 0) {
          clearQueueApi().catch(() => {});
        } else {
          updateQueueApi(newQueue).catch(() => {});
        }
      },

      reorderQueue: (fromIndex, toIndex) => {
        const { queue } = get();
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= queue.length || toIndex >= queue.length) return;

        const updated = [...queue];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);

        const current = get().currentTrack;
        const newIdx = current ? updated.findIndex((t) => t.id === current.id) : 0;
        set({ queue: updated, queueIndex: Math.max(0, newIdx) });
        updateQueueApi(updated).catch(() => {});
      },

      toggleFavorite: (track) => {
        const { favorites } = get();
        const exists = favorites.some((t) => t.id === track.id);
        if (exists) {
          const updated = favorites.filter((t) => t.id !== track.id);
          set({ favorites: updated });
          removeFavoriteApi(track.id).catch(() => {});
        } else {
          const updated = [track, ...favorites];
          set({ favorites: updated });
          addFavoriteApi(track).catch(() => {});
        }
      },

      fetchFavorites: async () => {
        try {
          const backendFavs = await fetchFavoritesApi();
          if (backendFavs && backendFavs.length > 0) {
            set({ favorites: backendFavs });
          }
        } catch (err) {
          console.warn('Failed to load favorites from backend:', err);
        }
      },

      fetchQueue: async () => {
        try {
          const backendQueue = await fetchQueueApi();
          if (backendQueue && backendQueue.length > 0) {
            set({ queue: backendQueue });
          }
        } catch (err) {
          console.warn('Failed to load queue from backend:', err);
        }
      },

      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

      toggleRepeat: () =>
        set((s) => {
          const order: RepeatMode[] = ['off', 'all', 'one'];
          const next = order[(order.indexOf(s.repeatMode) + 1) % order.length];
          return { repeatMode: next };
        }),

      setVisualizerMode: (mode) => set({ visualizerMode: mode }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      setSearchQuery: (query) => {
        set({ searchQuery: query });
        if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout);
        if (!query.trim()) {
          set({ searchResults: [], isSearching: false });
          return;
        }
        set({ isSearching: true });
        searchDebounceTimeout = setTimeout(() => {
          get().search(query);
        }, 300);
      },

      setSelectedGenre: (genre) => set({ selectedGenre: genre }),
      setVisualizerFullscreen: (fullscreen) => set({ isVisualizerFullscreen: fullscreen }),

      syncTime: (currentTime, duration) => {
        set({
          currentTime,
          duration: duration > 0 ? duration : get().duration
        });
      },

      syncPlaying: (isPlaying) => set({ isPlaying })
    }),
    {
      name: 'aurasound-storage',
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        queueIndex: state.queueIndex,
        favorites: state.favorites,
        volume: state.volume,
        repeatMode: state.repeatMode,
        shuffle: state.shuffle,
        visualizerMode: state.visualizerMode,
        spatialMode: state.spatialMode,
        eqPreset: state.eqPreset
      })
    }
  )
);

// Subscribe audio engine events to the store
audioEngine.onTimeUpdate((curr, dur) => {
  useMusicStore.getState().syncTime(curr, dur);
});

audioEngine.onEnded(() => {
  useMusicStore.getState().nextTrack();
});

audioEngine.onPlayStateChange((isPlaying) => {
  useMusicStore.getState().syncPlaying(isPlaying);
});
