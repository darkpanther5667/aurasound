import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  ListMusic,
  Sliders,
  Loader2,
  Music,
  Sparkles
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

interface PlayerBarProps {
  onToggleQueue: () => void;
  isQueueOpen: boolean;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({ onToggleQueue, isQueueOpen }) => {
  const {
    currentTrack,
    isPlaying,
    isLoadingTrack,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    favorites,
    spatialMode,
    eqPreset,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    setEqWidgetOpen,
    isEqWidgetOpen
  } = useMusicStore();

  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);

  const isFav = currentTrack ? favorites.some((f) => f.id === currentTrack.id) : false;

  const formatTimecode = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl rounded-full px-4 sm:px-6 py-2.5 sm:py-3 bg-[#0E1017]/85 backdrop-blur-3xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex items-center justify-between gap-3 sm:gap-6 transition-all duration-300">
      {/* Specular Top Reflection Line */}
      <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none rounded-full" />

      {/* Left: Track Information & Glass Thumbnail */}
      <div className="flex items-center gap-3 w-1/4 min-w-[170px] sm:min-w-[210px] shrink-0">
        <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/20 bg-black/60 shadow-lg">
          {currentTrack?.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'animate-[spin_18s_linear_infinite]' : ''
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-4 h-4 text-white/40" />
            </div>
          )}
          {/* Vinyl Center Hole */}
          <div className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-[#0E1017] border border-white/30" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight truncate">
            {currentTrack?.title || 'TuneTrek Spatial'}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate">
            {currentTrack?.artist || 'Ready to stream'}
          </p>
        </div>

        {currentTrack && (
          <button
            onClick={() => toggleFavorite(currentTrack)}
            className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
              isFav ? 'text-pink-400' : 'text-zinc-500 hover:text-white'
            }`}
            title={isFav ? 'Liked' : 'Like'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Center: visionOS Transport Controls & Micro-Scrubber */}
      <div className="flex-1 max-w-md flex flex-col items-center gap-1">
        {/* Buttons */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={toggleShuffle}
            className={`p-1 transition-colors ${
              shuffle ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={prevTrack}
            className="p-1 text-zinc-300 hover:text-white transition-colors active:scale-95"
            title="Previous"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Floating Pure White Play Button */}
          <button
            onClick={togglePlay}
            disabled={isLoadingTrack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-zinc-100 text-black flex items-center justify-center shadow-[0_4px_20px_rgba(255,255,255,0.35)] hover:scale-106 active:scale-95 transition-all duration-150"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoadingTrack ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-black" />
            ) : (
              <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-1 text-zinc-300 hover:text-white transition-colors active:scale-95"
            title="Next"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-1 transition-colors ${
              repeatMode !== 'off' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-3.5 h-3.5 text-white" />
            ) : (
              <Repeat className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Timeline */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-400 w-7 text-right shrink-0">
            {formatTimecode(currentTime)}
          </span>

          <div
            className="relative flex-1 h-1 rounded-full bg-white/10 group cursor-pointer"
            onMouseEnter={() => setIsHoveringTimeline(true)}
            onMouseLeave={() => setIsHoveringTimeline(false)}
          >
            <div
              className={`h-full rounded-full transition-colors ${
                isHoveringTimeline ? 'bg-white' : 'bg-zinc-300'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
            {/* Scrubber thumb */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md transition-opacity pointer-events-none ${
                isHoveringTimeline ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ left: `calc(${Math.min(100, Math.max(0, progressPercent))}% - 5px)` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeekChange}
              aria-label="Seek Track"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <span className="text-[10px] font-mono text-zinc-400 w-7 shrink-0">
            {formatTimecode(duration)}
          </span>
        </div>
      </div>

      {/* Right: visionOS Spatial Pill, Volume, & Queue */}
      <div className="flex items-center gap-2.5 w-1/4 justify-end shrink-0">
        {/* Spatial Audio Badge */}
        <div
          onClick={() => setEqWidgetOpen(!isEqWidgetOpen)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 cursor-pointer text-[10px] font-medium text-zinc-200 transition-all"
          title="Spatial Audio Engine"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="tracking-wider uppercase">Spatial</span>
        </div>

        {/* Queue Drawer Button */}
        <button
          onClick={onToggleQueue}
          className={`p-2 rounded-full border transition-all ${
            isQueueOpen
              ? 'bg-white text-black border-white shadow-md'
              : 'bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border-white/10'
          }`}
          title="Queue"
        >
          <ListMusic className="w-3.5 h-3.5" />
        </button>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="relative w-16 h-1 rounded-full bg-white/10 group cursor-pointer">
            <div
              className="h-full rounded-full bg-zinc-300 group-hover:bg-white transition-colors"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
