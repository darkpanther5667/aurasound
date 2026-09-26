import React from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { AudioVisualizer } from './AudioVisualizer';
import { Play, Pause, Disc, Radio, Flame, Sparkles, Layers } from 'lucide-react';

export const WorkstationHero: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay } = useMusicStore();

  if (!currentTrack) return null;

  return (
    <div className="rounded-xl bg-[#121417] border border-white/[0.08] p-5 md:p-7 relative overflow-hidden">
      {/* Asymmetrical Grid: Left Album Art & Kinetic Title / Right Waveform & Hardware Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: High-Contrast Album Art (4 cols) */}
        <div className="lg:col-span-4 flex items-center justify-center">
          <div className="relative group w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border border-white/[0.12] shadow-2xl bg-black">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
            />
            {/* Play Overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform">
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                )}
              </div>
            </button>

            {/* Micro Badge */}
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-mono text-white uppercase tracking-wider">
              {currentTrack.musicalKey || 'STEREO'} · {currentTrack.bpm || 128} BPM
            </div>
          </div>
        </div>

        {/* Center / Right: Kinetic Swiss Title & Precision Waveform (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          {/* Metadata Top Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-white/[0.08] border border-white/10 text-[10px] font-mono text-white font-bold uppercase tracking-widest">
              {currentTrack.audioFormat || 'LOSSLESS · 24-BIT / 96KHZ'}
            </span>
            <span className="text-[10px] font-mono text-studio-muted uppercase">
              {currentTrack.genre}
            </span>
            <span className="text-studio-dim">·</span>
            <span className="text-[10px] font-mono text-studio-accent uppercase font-bold">
              AUDIO WORKSTATION MK-IV
            </span>
          </div>

          {/* Bold Kinetic Swiss Header: 36pt+ (text-4xl / text-5xl) Tracking-Tight */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-none font-sans">
              {currentTrack.title}
            </h1>
            <p className="text-base md:text-lg text-studio-muted font-medium mt-1.5 tracking-tight">
              {currentTrack.artist} <span className="text-studio-dim">/</span> {currentTrack.album || 'Single Master'}
            </p>
          </div>

          {/* Waveform Visualizer Integration */}
          <div className="w-full">
            <AudioVisualizer height={100} showModeSelector={true} />
          </div>

          {/* Micro Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={togglePlay}
              className="px-5 py-2 rounded-lg bg-white text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-sm"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>PAUSE STREAM</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY MASTER</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-4 text-[11px] font-mono text-studio-muted px-2">
              <span>BPM: <strong className="text-white">{currentTrack.bpm || 128}</strong></span>
              <span>KEY: <strong className="text-white">{currentTrack.musicalKey || 'F# MIN'}</strong></span>
              <span>DYNAMIC RANGE: <strong className="text-studio-amber">14.2 LUFS</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
