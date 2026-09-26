import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VisualizerMode } from '../types';
import { useMusicStore } from '../store/useMusicStore';
import { BarChart3, LineChart, Activity, Crosshair } from 'lucide-react';

interface AudioVisualizerProps {
  mode?: VisualizerMode;
  height?: number;
  className?: string;
  showModeSelector?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  height = 140,
  className = '',
  showModeSelector = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { isPlaying, visualizerMode, setVisualizerMode } = useMusicStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resize();
    window.addEventListener('resize', resize);

    // Peak levels array for decay
    const peaks: number[] = new Array(64).fill(0);
    let idleCounter = 0;

    const render = () => {
      if (!canvas || !ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const audioData = audioEngine.getAudioData();
      const freq = audioData.frequencyData;
      const time = audioData.timeData;

      idleCounter += 0.04;

      // Draw subtle background workstation dB grid
      drawWorkstationGrid(ctx, w, h);

      if (visualizerMode === 'monochrome-bars') {
        renderMonochromeBars(ctx, w, h, freq, peaks, isPlaying, idleCounter);
      } else if (visualizerMode === 'precision-fft') {
        renderPrecisionFft(ctx, w, h, freq, isPlaying, idleCounter);
      } else if (visualizerMode === 'oscilloscope') {
        renderOscilloscope(ctx, w, h, time, isPlaying, idleCounter);
      } else if (visualizerMode === 'stereo-field') {
        renderStereoField(ctx, w, h, time, isPlaying, idleCounter);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [visualizerMode, isPlaying]);

  // Subtle Workstation dB Grid
  const drawWorkstationGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    // Horizontal dB lines
    const dbLevels = [0.15, 0.35, 0.6, 0.85];
    dbLevels.forEach((pct) => {
      const y = h * pct;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    });

    // Vertical Frequency divisions
    const freqSteps = 8;
    for (let i = 1; i < freqSteps; i++) {
      const x = (w / freqSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  };

  // 1. Swiss Monochrome Digital Frequency Bars
  const renderMonochromeBars = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    freq: Uint8Array,
    peaks: number[],
    playing: boolean,
    phase: number
  ) => {
    const numBars = 44;
    const gap = 3;
    const barWidth = (w - (numBars - 1) * gap) / numBars;

    for (let i = 0; i < numBars; i++) {
      const binIdx = Math.floor((i / numBars) * (freq.length * 0.7));
      let rawVal = playing ? freq[binIdx] || 0 : Math.sin(phase + i * 0.25) * 12 + 16;

      // Logarithmic emphasis
      const normalized = Math.min(1, Math.max(0, rawVal / 255));
      const barHeight = Math.max(2, normalized * (h * 0.88));

      // Peak decay
      if (barHeight > peaks[i]) {
        peaks[i] = barHeight;
      } else {
        peaks[i] = Math.max(2, peaks[i] - 1.5);
      }

      const x = i * (barWidth + gap);
      const y = h - barHeight;

      // Monochrome white / warm accent bar segments
      const segmentHeight = 4;
      const segmentGap = 1.5;
      const totalSegments = Math.floor(barHeight / (segmentHeight + segmentGap));

      for (let s = 0; s < totalSegments; s++) {
        const segY = h - (s + 1) * (segmentHeight + segmentGap);
        // Top 2 segments warm amber warning indicator
        if (s > totalSegments - 2 && s > 14) {
          ctx.fillStyle = '#FF5A36';
        } else if (s > totalSegments - 4 && s > 10) {
          ctx.fillStyle = '#F59E0B';
        } else {
          ctx.fillStyle = '#E2E8F0'; // Clean crisp phosphor
        }
        ctx.fillRect(x, segY, barWidth, segmentHeight);
      }

      // Discrete single-pixel peak cap
      const peakY = h - peaks[i] - 3;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, Math.max(0, peakY), barWidth, 1.5);
    }
  };

  // 2. Precision FFT Curve
  const renderPrecisionFft = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    freq: Uint8Array,
    playing: boolean,
    phase: number
  ) => {
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFFFFF';

    const step = w / 64;
    for (let i = 0; i < 64; i++) {
      const val = playing ? freq[i] || 0 : 15 + Math.sin(phase + i * 0.15) * 12;
      const y = h - (val / 255) * (h * 0.85);
      const x = i * step;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Subtle fill beneath
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fill();
  };

  // 3. Monochrome Vector Oscilloscope
  const renderOscilloscope = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: Uint8Array,
    playing: boolean,
    phase: number
  ) => {
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFFFFF';

    const slice = w / (time.length - 1);
    for (let i = 0; i < time.length; i++) {
      let v = playing ? time[i] / 128.0 : 1.0 + Math.sin(phase + i * 0.1) * 0.18;
      const y = (v * h) / 2;
      const x = i * slice;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };

  // 4. Stereo Phase Correlation
  const renderStereoField = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: Uint8Array,
    playing: boolean,
    phase: number
  ) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.38;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;

    const count = Math.min(64, time.length);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const raw = playing ? (time[i] - 128) / 128 : Math.sin(phase + i * 0.2) * 0.25;
      const rad = r + raw * 35;
      const x = Math.cos(angle) * rad;
      const y = Math.sin(angle) * rad;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  return (
    <div className={`relative flex flex-col justify-center rounded-xl bg-[#121417] border border-white/[0.08] p-3 overflow-hidden ${className}`}>
      {/* Top Workstation Scale Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.05] text-[10px] font-mono text-studio-muted">
        <span className="uppercase tracking-wider">SPECTRAL FFT · 48KHZ / 24-BIT</span>
        <div className="flex items-center gap-3">
          <span className="text-studio-dim">-48dB</span>
          <span className="text-studio-dim">-24dB</span>
          <span className="text-studio-dim">-12dB</span>
          <span className="text-studio-amber font-semibold">-6dB</span>
          <span className="text-studio-accent font-bold">0dB</span>
        </div>
      </div>

      {/* Mode Selector */}
      {showModeSelector && (
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 p-0.5 bg-[#181A1F] border border-white/[0.08] rounded-lg">
          <button
            onClick={() => setVisualizerMode('monochrome-bars')}
            className={`p-1 rounded text-xs transition-all ${
              visualizerMode === 'monochrome-bars'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-studio-muted hover:text-white'
            }`}
            title="Monochrome Bars"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setVisualizerMode('precision-fft')}
            className={`p-1 rounded text-xs transition-all ${
              visualizerMode === 'precision-fft'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-studio-muted hover:text-white'
            }`}
            title="Precision FFT Curve"
          >
            <LineChart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setVisualizerMode('oscilloscope')}
            className={`p-1 rounded text-xs transition-all ${
              visualizerMode === 'oscilloscope'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-studio-muted hover:text-white'
            }`}
            title="Vector Oscilloscope"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setVisualizerMode('stereo-field')}
            className={`p-1 rounded text-xs transition-all ${
              visualizerMode === 'stereo-field'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-studio-muted hover:text-white'
            }`}
            title="Stereo Lissajous"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full min-h-[100px] block"
        style={{ height }}
      />
    </div>
  );
};
