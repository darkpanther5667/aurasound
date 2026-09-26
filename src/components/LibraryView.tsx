import React, { useState, useEffect } from 'react';
import {
  Heart,
  ListOrdered,
  LayoutGrid,
  List,
  GripVertical,
  Trash2,
  Play,
  Pause,
  Compass,
  Search,
  Music,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { TrackCard } from './TrackCard';
import { TrackTable } from './TrackTable';

export const LibraryView: React.FC = () => {
  const {
    favorites,
    queue,
    currentTrack,
    isPlaying,
    isLoadingTrack,
    loadingTrackId,
    playTrack,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    setActiveTab,
    setSearchQuery,
    fetchFavorites,
    fetchQueue
  } = useMusicStore();

  const [librarySubTab, setLibrarySubTab] = useState<'favorites' | 'queue'>('favorites');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Drag and drop state for Queue
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchFavorites();
    fetchQueue();
  }, [fetchFavorites, fetchQueue]);

  const totalQueueDuration = queue.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalMinutes = Math.floor(totalQueueDuration / 60);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.dataTransfer.setData) {
      e.dataTransfer.setData('text/plain', `${index}`);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderQueue(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveQueueItem = (from: number, direction: 'up' | 'down') => {
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to >= 0 && to < queue.length) {
      reorderQueue(from, to);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
            Collection
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Library
          </h1>
        </div>

        {/* Sub-Tabs: Apple Music Capsule Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setLibrarySubTab('favorites')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              librarySubTab === 'favorites'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${librarySubTab === 'favorites' ? 'fill-current text-black' : ''}`} />
            <span>Favorites</span>
            <span className="text-[10px] font-mono opacity-60">({favorites.length})</span>
          </button>

          <button
            onClick={() => setLibrarySubTab('queue')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              librarySubTab === 'queue'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Up Next</span>
            <span className="text-[10px] font-mono opacity-60">({queue.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-VIEW 1: FAVORITES                                    */}
      {/* ========================================================= */}
      {librarySubTab === 'favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
            <span className="text-xs text-zinc-400">
              {favorites.length} saved {favorites.length === 1 ? 'track' : 'tracks'}
            </span>

            {favorites.length > 0 && (
              <div className="flex items-center gap-1 p-0.5 bg-white/[0.04] border border-white/[0.06] rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="p-12 sm:p-16 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                <Heart className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">
                  Start building your favorites
                </h3>
                <p className="text-xs text-zinc-400">
                  Tap the heart icon on any track to save it here for instant access.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-black text-xs font-semibold shadow-sm transition-all"
                >
                  Explore Listen Now
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favorites.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          ) : (
            <TrackTable tracks={favorites} />
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 2: UP NEXT / QUEUE                              */}
      {/* ========================================================= */}
      {librarySubTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
            <span className="text-xs text-zinc-400 font-mono">
              {queue.length} tracks · ~{totalMinutes} min total
            </span>

            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-red-500/10 hover:text-red-400 text-zinc-400 text-xs transition-colors"
                title="Clear all tracks from queue"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Queue</span>
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="p-12 sm:p-16 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                <ListOrdered className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">
                  Your queue is empty
                </h3>
                <p className="text-xs text-zinc-400">
                  Add tracks from Listen Now or Search to line up your next stream.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-black text-xs font-semibold shadow-sm transition-all"
                >
                  Explore Tracks
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {queue.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                const isBeingDragged = draggedIndex === idx;
                const isDragTarget = dragOverIndex === idx && draggedIndex !== idx;
                const isLoadingThis = isLoadingTrack && loadingTrackId === track.id;

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={() => handleDragLeave(idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-150 ${
                      isBeingDragged
                        ? 'opacity-30 bg-white/5 border-white/20'
                        : isDragTarget
                        ? 'border-white/40 bg-white/10'
                        : isCurrent
                        ? 'bg-white/[0.06] border-white/10'
                        : 'bg-white/[0.01] hover:bg-white/[0.04] border-transparent'
                    }`}
                  >
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-zinc-600 group-hover:text-zinc-400 p-0.5 shrink-0"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Position */}
                    <span className="w-5 text-center text-xs font-mono text-zinc-500 shrink-0">
                      {idx + 1}
                    </span>

                    {/* Artwork */}
                    <div
                      onClick={() => playTrack(track)}
                      className="relative w-10 h-10 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0 cursor-pointer shadow-sm"
                    >
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-4 h-4 text-white/30" />
                        </div>
                      )}

                      <div
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-current" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Track Info */}
                    <div
                      onClick={() => playTrack(track)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <h4
                        className={`text-xs sm:text-sm font-medium truncate ${
                          isCurrent ? 'text-white font-semibold' : 'text-zinc-200 group-hover:text-white'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>

                    {/* Micro Bump Buttons */}
                    <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveQueueItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-zinc-500 hover:text-white disabled:opacity-20"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveQueueItem(idx, 'down')}
                        disabled={idx === queue.length - 1}
                        className="p-1 rounded text-zinc-500 hover:text-white disabled:opacity-20"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Duration */}
                    <span className="text-xs font-mono text-zinc-500 shrink-0">
                      {formatDuration(track.duration)}
                    </span>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromQueue(track.id)}
                      className="p-1.5 rounded text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
