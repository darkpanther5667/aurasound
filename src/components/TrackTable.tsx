import React, { useState } from 'react';
import { Play, Pause, Heart, Plus, Loader2, Music } from 'lucide-react';
import { Track } from '../types';
import { useMusicStore } from '../store/useMusicStore';

interface TrackTableProps {
  tracks: Track[];
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

const TableTrackRow: React.FC<{ track: Track; idx: number }> = ({ track, idx }) => {
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

  const [imgFailed, setImgFailed] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isLoadingThis = isLoadingTrack && loadingTrackId === track.id;
  const isFav = favorites.some((f) => f.id === track.id);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <tr
      className={`group hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] ${
        isCurrent ? 'bg-white/[0.04]' : ''
      }`}
    >
      {/* Index / Play Button */}
      <td className="py-3 px-3 w-10 text-center">
        <div className="flex items-center justify-center">
          {isLoadingThis ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          ) : isCurrent && isPlaying ? (
            <button onClick={togglePlay} className="text-white hover:opacity-80">
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
                <span className="w-0.5 h-3 bg-white rounded-full animate-pulse delay-75" />
                <span className="w-0.5 h-1.5 bg-white rounded-full animate-pulse delay-150" />
              </div>
            </button>
          ) : (
            <>
              <span className="group-hover:hidden text-zinc-500 font-mono text-xs">
                {idx + 1}
              </span>
              <button
                onClick={() => {
                  if (isCurrent) togglePlay();
                  else playTrack(track);
                }}
                className="hidden group-hover:inline-block text-white hover:scale-110 transition-transform"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </>
          )}
        </div>
      </td>

      {/* Track Details & Full Color Thumbnail */}
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shadow-sm">
            {imgFailed || !track.coverUrl ? (
              <Music className="w-4 h-4 text-white/30" />
            ) : (
              <img
                src={track.coverUrl}
                alt={track.title}
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>

          <div className="min-w-0 max-w-xs sm:max-w-md">
            <h4
              onClick={() => playTrack(track)}
              className={`text-xs sm:text-sm font-medium truncate cursor-pointer transition-colors ${
                isCurrent ? 'text-white font-semibold' : 'text-zinc-200 group-hover:text-white'
              }`}
            >
              {track.title}
            </h4>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {track.artist}
            </p>
          </div>
        </div>
      </td>

      {/* Genre Tag */}
      <td className="py-3 px-3 hidden md:table-cell text-xs text-zinc-400">
        {isRealGenre(track.genre) ? (
          <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-zinc-300 font-medium">
            {track.genre}
          </span>
        ) : (
          <span className="text-zinc-600">—</span>
        )}
      </td>

      {/* Duration */}
      <td className="py-3 px-3 text-right font-mono text-xs text-zinc-500 whitespace-nowrap">
        {formatDuration(track.duration)}
      </td>

      {/* Actions */}
      <td className="py-3 px-3 w-16 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => toggleFavorite(track)}
            className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${
              isFav ? 'text-pink-400' : 'text-zinc-400 hover:text-white'
            }`}
            title={isFav ? 'Liked' : 'Like'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => addToQueue(track)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Queue"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const TrackTable: React.FC<TrackTableProps> = ({ tracks }) => {
  if (tracks.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 text-xs">
        No tracks in this view.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/[0.06] text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <th className="py-2.5 px-3 w-10 text-center">#</th>
            <th className="py-2.5 px-3">Title</th>
            <th className="py-2.5 px-3 hidden md:table-cell">Genre</th>
            <th className="py-2.5 px-3 text-right">Duration</th>
            <th className="py-2.5 px-3 w-16 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, idx) => (
            <TableTrackRow key={`${track.id}-${idx}`} track={track} idx={idx} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
