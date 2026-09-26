import React, { useState, useEffect } from 'react';
import { Play, Pause, Heart, Plus, Music, Loader2 } from 'lucide-react';
import { Track } from '../types';
import { useMusicStore } from '../store/useMusicStore';

interface TrackCardProps {
  track: Track;
}

const GENERIC_GENRES = new Set([
  'music',
  'youtube audio',
  'youtube',
  'audio',
  'unknown',
  'general',
  'other',
  'none',
  'all workstations',
  'all vibes'
]);

function isRealGenre(genre?: string): boolean {
  if (!genre) return false;
  const trimmed = genre.trim().toLowerCase();
  return trimmed.length > 0 && !GENERIC_GENRES.has(trimmed);
}

function getPlaceholderGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    'from-zinc-900 to-zinc-800',
    'from-slate-900 to-zinc-900',
    'from-neutral-900 to-stone-900',
    'from-zinc-950 to-neutral-900',
    'from-stone-900 to-zinc-950'
  ];
  return palettes[Math.abs(hash) % palettes.length];
}

export const TrackCard: React.FC<TrackCardProps> = ({ track }) => {
  const {
    currentTrack,
    isPlaying,
    isLoadingTrack,
    loadingTrackId,
    playTrack,
    togglePlay,
    addToQueue,
    toggleFavorite,
    favorites
  } = useMusicStore();

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [track.coverUrl]);

  const isCurrent = currentTrack?.id === track.id;
  const isLoadingThis = isLoadingTrack && loadingTrackId === track.id;
  const isFav = favorites.some((f) => f.id === track.id);

  const handlePlayClick = () => {
    if (isLoadingThis) return;
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  return (
    <div
      className={`group relative flex flex-col p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border transition-all duration-200 ${
        isCurrent
          ? 'border-white/20 bg-white/[0.06] shadow-xl'
          : 'border-white/[0.04] hover:border-white/[0.1]'
      }`}
    >
      {/* Album Artwork */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-black/60 border border-white/[0.08] shadow-md">
        {imgError || !track.coverUrl ? (
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getPlaceholderGradient(
              track.title
            )}`}
          >
            <Music className="w-8 h-8 text-white/30" />
          </div>
        ) : (
          <img
            src={track.coverUrl}
            alt={track.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Subtle Playing Status Indicator */}
        {isCurrent && isPlaying && (
          <div className="absolute top-2.5 left-2.5 flex items-end gap-0.5 px-2 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10">
            <span className="w-1 h-2.5 bg-white rounded-full animate-pulse" />
            <span className="w-1 h-3.5 bg-white rounded-full animate-pulse delay-75" />
            <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
          </div>
        )}

        {/* Floating Play Button on Artwork Hover */}
        <button
          onClick={handlePlayClick}
          disabled={isLoadingThis}
          aria-label={`Play ${track.title}`}
          className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-108 active:scale-95 transition-all duration-200 ${
            (isCurrent && isPlaying) || isLoadingThis
              ? 'opacity-100 scale-100'
              : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'
          }`}
        >
          {isLoadingThis ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 fill-current text-black" />
          ) : (
            <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
          )}
        </button>

        {/* Subtle Genre Tag */}
        {isRealGenre(track.genre) && (
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-zinc-300 border border-white/10">
              {track.genre}
            </span>
          </div>
        )}
      </div>

      {/* Track Information */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3
            className={`text-xs sm:text-sm font-medium truncate cursor-pointer transition-colors ${
              isCurrent ? 'text-white font-semibold' : 'text-zinc-200 group-hover:text-white'
            }`}
            onClick={handlePlayClick}
          >
            {track.title}
          </h3>
          <p className="text-xs text-zinc-400 truncate mt-0.5 font-normal">
            {track.artist}
          </p>
        </div>

        {/* Subtle Micro-Actions (Like & Queue) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => toggleFavorite(track)}
            className={`p-1 rounded-md hover:bg-white/10 transition-colors ${
              isFav ? 'text-pink-400' : 'text-zinc-400 hover:text-white'
            }`}
            title={isFav ? 'Liked' : 'Like'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => addToQueue(track)}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Queue"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
