import React, { useState } from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { AudioVisualizer } from './AudioVisualizer';
import { X, Sliders, Headphones, Cpu, Check, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { SpatialMode, EqPreset } from '../types';

interface ProAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProAudioModal: React.FC<ProAudioModalProps> = ({ isOpen, onClose }) => {
  const {
    spatialMode,
    setSpatialMode,
    eqPreset,
    setEqPreset,
    currentTrack,
    visualizerMode,
    setVisualizerMode
  } = useMusicStore();

  const [showAdvancedSpecs, setShowAdvancedSpecs] = useState(false);

  if (!isOpen) return null;

  const spatialOptions: { id: SpatialMode; label: string; desc: string }[] = [
    { id: 'stereo', label: 'Stereo Wide', desc: 'Standard dual-channel field' },
    { id: 'binaural', label: 'Binaural 3D', desc: 'Immersive headphone HRTF' },
    { id: 'mono', label: 'Mono Monitor', desc: 'Single-channel mix check' }
  ];

  const eqPresets: { id: EqPreset; label: string; gainDetail: string }[] = [
    { id: 'reference', label: 'Studio Flat', gainDetail: 'True neutral audio curve' },
    { id: 'warm-analog', label: 'Warm Vinyl', gainDetail: '+3.5dB Bass warmth' },
    { id: 'club-sub', label: 'Club Bass', gainDetail: '+5.8dB Deep sub punch' },
    { id: 'vocal-air', label: 'Crisp Vocals', gainDetail: '+4.2dB High clarity' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F111A]/95 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Dynamic Glow Accent */}
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[120px] pointer-events-none opacity-30"
          style={{ background: currentTrack?.colorAccent || '#8B5CF6' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                Pro Audio & Sound Lab
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                  DSP Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Studio-grade equalizer, spatial audio acoustics, and live visualizer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 relative z-10 pr-1">
          {/* Live Reactive Visualizer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-violet-400" />
                Live Frequency Visualizer
              </span>
              <span className="text-[11px] text-slate-400">4 Display Modes</span>
            </div>
            <AudioVisualizer height={150} showModeSelector={true} />
          </div>

          {/* Spatial Audio Mode */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Headphones className="w-3.5 h-3.5 text-violet-400" />
              <span>Spatial Audio Staging</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {spatialOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSpatialMode(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    spatialMode === opt.id
                      ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/30'
                      : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className={`text-[10px] mt-0.5 leading-tight ${spatialMode === opt.id ? 'text-violet-100' : 'text-slate-400'}`}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Equalizer Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span>Equalizer Presets (Biquad Filter Bank)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {eqPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setEqPreset(preset.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    eqPreset === preset.id
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-md'
                      : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold">{preset.label}</p>
                    {eqPreset === preset.id && <Check className="w-3.5 h-3.5 text-violet-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{preset.gainDetail}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Collapsed Pro / Advanced Technical Specs (Hidden by default!) */}
          <div className="pt-2 border-t border-white/[0.08]">
            <button
              onClick={() => setShowAdvancedSpecs(!showAdvancedSpecs)}
              className="w-full flex items-center justify-between p-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span>Advanced Hardware Telemetry (LUFS, Sample Rate, Buffer)</span>
              </div>
              {showAdvancedSpecs ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAdvancedSpecs && (
              <div className="mt-2 p-3 rounded-2xl bg-black/40 border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono animate-in fade-in">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Sample Rate</span>
                  <span className="text-slate-200 font-semibold">48.0 kHz</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Bit Depth</span>
                  <span className="text-slate-200 font-semibold">32-Bit Float</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Buffer Size</span>
                  <span className="text-slate-200 font-semibold">128 Samples</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Dynamic Range</span>
                  <span className="text-violet-400 font-semibold">-14.2 LUFS</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
