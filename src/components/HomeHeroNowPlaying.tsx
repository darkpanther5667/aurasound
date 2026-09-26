import React, { useState, useEffect } from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { extractDominantColor } from '../utils/colorExtractor';
import { Play, Pause, Heart, Plus, Sparkles, Loader2, Music, Disc3, Radio } from 'lucide-react';

interface HomeHeroNowPlayingProps {
  onOpenProAudio: () => void;
}

export const HomeHeroNowPlaying: React.FC<HomeHeroNowPlayingProps> = ({ onOpenProAudio }) => {
  const {
    currentTrack,
    isPlaying,
    isLoadingTrack,
    loadingTrackId,
    togglePlay,
    toggleFavorite,
    favorites,
    addToQueue
  } = useMusicStore();

  const [ambientColor, setAmbientColor] = useState<string>(
    currentTrack?.colorAccent || '#6366f1'
  );

  useEffect(() => {
    if (currentTrack?.coverUrl) {
      extractDominantColor(currentTrack.coverUrl, currentTrack.colorAccent || '#6366f1').then(
        (color) => {
          setAmbientColor(color);
        }
      );
    }
  }, [currentTrack?.coverUrl, currentTrack?.colorAccent]);

  if (!currentTrack) return null;

  const isFav = favorites.some((f) => f.id === currentTrack.id);
  const isLoadingHero = isLoadingTrack && (loadingTrackId === currentTrack.id || loadingTrackId === null);

  return (
    <div className="relative w-full py-6 sm:py-10 overflow-hidden rounded-[32px] p-6 sm:p-12 vision-glass">
      {/* Vision Pro Atmospheric Specular Glow (Dynamic to Album Art) */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-35 transition-all duration-1000"
        style={{ backgroundColor: ambientColor }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none opacity-25 transition-all duration-1000"
        style={{ backgroundColor: ambientColor }}
      />

      {/* Spatial 3D Layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 items-center">
        {/* Left: Floating 3D Artwork Stage */}
        <div className="md:col-span-5 lg:col-span-5 flex justify-center md:justify-start">
          <div className="relative group w-full max-w-[280px] sm:max-w-[340px] aspect-square rounded-[28px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/20 bg-black/70 transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-[0_30px_70px_rgba(0,0,0,0.95)]">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* Specular Edge Highlight */}
            <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/20 pointer-events-none" />

            {/* Floating Live Badge */}
            {isPlaying && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-xl border border-white/20 flex items-center gap-1.5 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-white tracking-widest uppercase font-mono">
                  Spatial Audio
                </span>
              </div>
            )}

            {/* Center Play Overlay Trigger */}
            <button
              onClick={togglePlay}
              disabled={isLoadingHero}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-xs"
            >
              <div className="w-18 h-18 rounded-full bg-white text-black flex items-center justify-center shadow-[0_4px_30px_rgba(255,255,255,0.4)] hover:scale-106 active:scale-95 transition-all">
                {isLoadingHero ? (
                  <Loader2 className="w-7 h-7 animate-spin text-black" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7 fill-current text-black" />
                ) : (
                  <Play className="w-7 h-7 fill-current text-black translate-x-0.5" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Right: Spatial Typography & Control Capsules */}
        <div className="md:col-span-7 lg:col-span-7 flex flex-col justify-center space-y-5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 text-[10px] font-semibold uppercase tracking-widest text-zinc-300">
              TuneTrek Featured
            </span>
            {currentTrack.genre && (
              <span className="px-3 py-1 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-[10px] font-medium text-zinc-400">
                {currentTrack.genre}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
              {currentTrack.title}
            </h1>
            <p className="text-base sm:text-xl text-zinc-300 font-medium">
              {currentTrack.artist}
            </p>
          </div>

          {/* Action Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={togglePlay}
              disabled={isLoadingHero}
              className="px-7 py-3 rounded-full bg-white hover:bg-zinc-100 active:scale-95 text-black font-semibold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-[0_4px_25px_rgba(255,255,255,0.35)] hover:scale-102 transition-all duration-150"
            >
              {isLoadingHero ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Loading...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current text-black" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
                  <span>Stream Now</span>
                </>
              )}
            </button>

            <button
              onClick={() => toggleFavorite(currentTrack)}
              className={`p-3 rounded-full border transition-all ${
                isFav
                  ? 'bg-pink-500/20 text-pink-400 border-pink-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                  : 'vision-pill text-zinc-300 hover:text-white'
              }`}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => addToQueue(currentTrack)}
              className="vision-pill px-5 py-3 rounded-full text-zinc-200 hover:text-white text-xs font-medium flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Queue</span>
            </button>

            <button
              onClick={onOpenProAudio}
              className="ml-auto hidden sm:flex items-center gap-2 vision-pill px-4 py-3 rounded-full text-xs font-medium text-zinc-200 hover:text-white"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Spatial DSP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
