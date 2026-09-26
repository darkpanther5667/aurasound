import React from 'react';
import { Sliders, Cpu, Activity, Headphones, Zap, Check } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { SpatialMode, EqPreset } from '../types';

export const AudioEngineWidget: React.FC = () => {
  const {
    spatialMode,
    setSpatialMode,
    eqPreset,
    setEqPreset,
    isEqWidgetOpen,
    setEqWidgetOpen,
    currentTrack
  } = useMusicStore();

  const spatialOptions: { id: SpatialMode; label: string; desc: string }[] = [
    { id: 'stereo', label: 'Stereo Wide', desc: 'Standard 2-channel field' },
    { id: 'binaural', label: 'Binaural 3D', desc: 'Headphone HRTF immersion' },
    { id: 'mono', label: 'Mono Monitor', desc: 'Phase-check studio sum' }
  ];

  const eqPresets: { id: EqPreset; label: string; gainDetail: string }[] = [
    { id: 'reference', label: 'Studio Ref', gainDetail: 'Flat 0.0dB response' },
    { id: 'warm-analog', label: 'Warm Vinyl', gainDetail: '+3.5dB Bass / -1.5dB Air' },
    { id: 'club-sub', label: 'Club Sub', gainDetail: '+5.8dB @ 60Hz Punch' },
    { id: 'vocal-air', label: 'Crisp Air', gainDetail: '+4.2dB High Shelf' }
  ];

  return (
    <div className="relative">
      {/* Contextual Toggle Pill in Header/Toolbar */}
      <button
        onClick={() => setEqWidgetOpen(!isEqWidgetOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
          isEqWidgetOpen
            ? 'bg-[#181A1F] border-studio-accent text-white shadow-sm'
            : 'bg-[#121417] border-white/10 text-studio-muted hover:text-white hover:border-white/20'
        }`}
        title="DSP Audio Engine Settings"
      >
        <Cpu className="w-3.5 h-3.5 text-studio-accent" />
        <span className="uppercase tracking-wider font-semibold text-[11px]">DSP ENGINE</span>
        <span className="text-[10px] text-studio-dim hidden sm:inline">|</span>
        <span className="text-[10px] text-studio-muted hidden sm:inline uppercase">
          {spatialMode} · {eqPreset}
        </span>
      </button>

      {/* Popout Panel */}
      {isEqWidgetOpen && (
        <div className="absolute right-0 top-10 mt-1 w-80 sm:w-96 z-50 bg-[#121417] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-studio-accent" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-100 font-bold">
                Audio Engine & DSP Specs
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ACTIVE · 48 KHZ
            </span>
          </div>

          {/* Lossless Spec Banner */}
          <div className="my-3 p-2.5 rounded-lg bg-[#181A1F] border border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-studio-dim uppercase">Stream Decoder</p>
              <p className="text-xs font-mono text-white font-bold tracking-tight">
                {currentTrack?.audioFormat || 'LOSSLESS · 24-BIT / 96KHZ FLAC'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-studio-dim uppercase">Latency</p>
              <p className="text-xs font-mono text-studio-amber font-semibold">4.8ms</p>
            </div>
          </div>

          {/* Spatial Audio Selector */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Headphones className="w-3.5 h-3.5 text-studio-muted" />
              <span className="text-[11px] font-mono uppercase text-studio-muted tracking-wider">
                Spatial Rendering Mode
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {spatialOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSpatialMode(opt.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                    spatialMode === opt.id
                      ? 'bg-studio-accent/15 border-studio-accent text-white'
                      : 'bg-[#181A1F] border-white/[0.06] text-studio-muted hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-semibold">{opt.label}</span>
                  <span className="text-[9px] font-mono text-studio-dim mt-0.5 leading-tight">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Graphic EQ Presets */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-studio-muted" />
              <span className="text-[11px] font-mono uppercase text-studio-muted tracking-wider">
                Biquad Filter DSP Presets
              </span>
            </div>
            <div className="space-y-1.5">
              {eqPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setEqPreset(preset.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                    eqPreset === preset.id
                      ? 'bg-white/[0.06] border-studio-amber/50 text-white'
                      : 'bg-[#181A1F] border-white/[0.06] text-studio-muted hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{preset.label}</span>
                    <span className="text-[10px] font-mono text-studio-dim">
                      ({preset.gainDetail})
                    </span>
                  </div>
                  {eqPreset === preset.id && (
                    <Check className="w-3.5 h-3.5 text-studio-amber" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Close button */}
          <div className="mt-4 pt-3 border-t border-white/[0.08] flex justify-end">
            <button
              onClick={() => setEqWidgetOpen(false)}
              className="text-xs font-mono text-studio-muted hover:text-white px-3 py-1 rounded bg-white/5 hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
