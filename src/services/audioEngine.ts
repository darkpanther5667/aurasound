// Native Web Audio API Workstation Engine with DSP Filter Bank & Procedural Fallback
import { Track, EqPreset, SpatialMode } from '../types';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  // DSP Filter Bank (EQ & Spatial)
  private lowFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highFilter: BiquadFilterNode | null = null;
  private stereoPanner: StereoPannerNode | null = null;

  // Synthesizer fallback state
  private isSynthPlaying = false;
  private synthInterval: number | null = null;
  private synthGain: GainNode | null = null;
  private synthCurrentTime = 0;

  private freqArray: Uint8Array | null = null;
  private timeArray: Uint8Array | null = null;

  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onPlayStateChangeCallback: ((isPlaying: boolean) => void) | null = null;

  constructor() {
    this.initAudioElement();
  }

  private initAudioElement() {
    if (typeof window === 'undefined') return;

    this.audioEl = new Audio();
    this.audioEl.crossOrigin = 'anonymous';
    this.audioEl.preload = 'auto';

    this.audioEl.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback && this.audioEl && !this.isSynthPlaying) {
        this.onTimeUpdateCallback(this.audioEl.currentTime, this.audioEl.duration || 0);
      }
    });

    this.audioEl.addEventListener('ended', () => {
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    });

    this.audioEl.addEventListener('play', () => {
      if (this.onPlayStateChangeCallback) this.onPlayStateChangeCallback(true);
    });

    this.audioEl.addEventListener('pause', () => {
      if (!this.isSynthPlaying && this.onPlayStateChangeCallback) {
        this.onPlayStateChangeCallback(false);
      }
    });

    this.audioEl.addEventListener('error', (e) => {
      console.warn('Audio stream error on media element:', e);
      if (this.onPlayStateChangeCallback) this.onPlayStateChangeCallback(false);
    });
  }

  public ensureContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // Precision AnalyserNode for Swiss Monochrome Visualizer
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;

      // Master Gain
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.0;

      // Equalizer Biquad Filters
      this.lowFilter = this.audioCtx.createBiquadFilter();
      this.lowFilter.type = 'lowshelf';
      this.lowFilter.frequency.value = 180;
      this.lowFilter.gain.value = 0;

      this.midFilter = this.audioCtx.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.value = 1800;
      this.midFilter.Q.value = 1.0;
      this.midFilter.gain.value = 0;

      this.highFilter = this.audioCtx.createBiquadFilter();
      this.highFilter.type = 'highshelf';
      this.highFilter.frequency.value = 8500;
      this.highFilter.gain.value = 0;

      // Spatial Panning / Width Node
      if (this.audioCtx.createStereoPanner) {
        this.stereoPanner = this.audioCtx.createStereoPanner();
        this.stereoPanner.pan.value = 0;
      }

      const bufferLength = this.analyser.frequencyBinCount;
      this.freqArray = new Uint8Array(bufferLength);
      this.timeArray = new Uint8Array(bufferLength);

      // Connect DSP chain: Audio Source -> Low -> Mid -> High -> StereoPanner -> Analyser -> Master Gain -> Destination
      if (this.audioEl && !this.sourceNode) {
        try {
          this.sourceNode = this.audioCtx.createMediaElementSource(this.audioEl);
          this.sourceNode.connect(this.lowFilter);
          this.lowFilter.connect(this.midFilter);
          this.midFilter.connect(this.highFilter);

          if (this.stereoPanner) {
            this.highFilter.connect(this.stereoPanner);
            this.stereoPanner.connect(this.analyser);
          } else {
            this.highFilter.connect(this.analyser);
          }

          this.analyser.connect(this.gainNode);
          this.gainNode.connect(this.audioCtx.destination);
        } catch (err) {
          console.warn('DSP Chain wire notice:', err);
        }
      }
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  // Set DSP Equalizer Presets
  public setEqPreset(preset: EqPreset) {
    if (!this.lowFilter || !this.midFilter || !this.highFilter || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    switch (preset) {
      case 'reference': // Flat Studio Monitor
        this.lowFilter.gain.setTargetAtTime(0, now, 0.05);
        this.midFilter.gain.setTargetAtTime(0, now, 0.05);
        this.highFilter.gain.setTargetAtTime(0, now, 0.05);
        break;
      case 'warm-analog': // Warm tape warmth, rolled off harsh highs
        this.lowFilter.gain.setTargetAtTime(3.5, now, 0.05);
        this.midFilter.gain.setTargetAtTime(1.2, now, 0.05);
        this.highFilter.gain.setTargetAtTime(-1.5, now, 0.05);
        break;
      case 'club-sub': // Heavy sub bass punch (60-120Hz)
        this.lowFilter.gain.setTargetAtTime(5.8, now, 0.05);
        this.midFilter.gain.setTargetAtTime(-1.5, now, 0.05);
        this.highFilter.gain.setTargetAtTime(1.0, now, 0.05);
        break;
      case 'vocal-air': // Crisp highs & vocal presence
        this.lowFilter.gain.setTargetAtTime(-1.0, now, 0.05);
        this.midFilter.gain.setTargetAtTime(2.8, now, 0.05);
        this.highFilter.gain.setTargetAtTime(4.2, now, 0.05);
        break;
    }
  }

  // Set Spatial Audio Mode
  public setSpatialMode(mode: SpatialMode) {
    if (!this.stereoPanner || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    if (mode === 'mono') {
      this.stereoPanner.pan.setTargetAtTime(0, now, 0.05);
    } else if (mode === 'binaural') {
      // Modulate subtle stereo separation
      this.stereoPanner.pan.setTargetAtTime(0.2, now, 0.05);
    } else {
      this.stereoPanner.pan.setTargetAtTime(0, now, 0.05);
    }
  }

  public async playTrack(track: Track, startTime = 0): Promise<void> {
    this.ensureContext();
    this.stopSynthesizedPlayback();

    if (!this.audioEl) return;

    try {
      this.audioEl.crossOrigin = 'anonymous';
      this.audioEl.src = track.audioUrl;
      this.audioEl.currentTime = startTime;

      const playPromise = this.audioEl.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      if (this.onPlayStateChangeCallback) this.onPlayStateChangeCallback(true);
    } catch (err) {
      console.warn('Direct media play error:', err);
    }
  }

  public pause(): void {
    if (this.isSynthPlaying) {
      this.pauseSynthesizedPlayback();
    } else if (this.audioEl) {
      this.audioEl.pause();
    }
    if (this.onPlayStateChangeCallback) this.onPlayStateChangeCallback(false);
  }

  public resume(): void {
    this.ensureContext();
    if (this.isSynthPlaying) {
      this.resumeSynthesizedPlayback();
    } else if (this.audioEl && this.audioEl.src) {
      this.audioEl.play().catch(() => {
        this.startSynthesizedPlayback();
      });
    }
    if (this.onPlayStateChangeCallback) this.onPlayStateChangeCallback(true);
  }

  public seek(seconds: number): void {
    if (this.isSynthPlaying) {
      this.synthCurrentTime = seconds;
      if (this.onTimeUpdateCallback) this.onTimeUpdateCallback(this.synthCurrentTime, 180);
    } else if (this.audioEl && Number.isFinite(seconds)) {
      this.audioEl.currentTime = seconds;
    }
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(clamped, this.audioCtx?.currentTime || 0);
    }
    if (this.audioEl) {
      this.audioEl.volume = clamped;
    }
  }

  public getAudioData(): {
    frequencyData: Uint8Array;
    timeData: Uint8Array;
    averageFrequency: number;
    bassLevel: number;
  } {
    if (!this.analyser || !this.freqArray || !this.timeArray) {
      const dummyFreq = new Uint8Array(128);
      const dummyTime = new Uint8Array(128).fill(128);
      return {
        frequencyData: dummyFreq,
        timeData: dummyTime,
        averageFrequency: 0,
        bassLevel: 0
      };
    }

    this.analyser.getByteFrequencyData(this.freqArray as any);
    this.analyser.getByteTimeDomainData(this.timeArray as any);

    let sum = 0;
    let bassSum = 0;
    const bassBins = Math.min(12, this.freqArray.length);

    for (let i = 0; i < this.freqArray.length; i++) {
      sum += this.freqArray[i];
      if (i < bassBins) {
        bassSum += this.freqArray[i];
      }
    }

    const avg = sum / this.freqArray.length;
    const bass = bassBins > 0 ? bassSum / bassBins : 0;

    return {
      frequencyData: this.freqArray,
      timeData: this.timeArray,
      averageFrequency: avg,
      bassLevel: bass
    };
  }

  // Procedural Web Audio Workstation Synth (Zero CORS Fallback)
  private startSynthesizedPlayback(track?: Track) {
    const ctx = this.ensureContext();
    this.isSynthPlaying = true;
    this.synthCurrentTime = 0;

    if (this.onPlayStateChangeCallback) this.onPlayStateChangeCallback(true);

    if (!this.synthGain) {
      this.synthGain = ctx.createGain();
      this.synthGain.gain.value = 0.3;
      if (this.lowFilter) {
        this.synthGain.connect(this.lowFilter);
      } else if (this.analyser) {
        this.synthGain.connect(this.analyser);
      }
    }

    const chords = [
      [146.83, 220.00, 261.63, 329.63], // Dm9
      [174.61, 261.63, 329.63, 392.00], // Fmaj7#11
      [130.81, 196.00, 246.94, 293.66], // Cmaj9
      [164.81, 246.94, 293.66, 370.00]  // Em9
    ];

    let step = 0;
    const bpm = track?.bpm || 126;
    const intervalMs = (60 / bpm) * 1000 / 2;

    const playStep = () => {
      if (!this.isSynthPlaying || !this.audioCtx || !this.synthGain) return;
      const now = this.audioCtx.currentTime;

      this.synthCurrentTime += (intervalMs / 1000);
      const totalDuration = track?.duration || 215;
      if (this.synthCurrentTime >= totalDuration) {
        this.synthCurrentTime = 0;
        if (this.onEndedCallback) this.onEndedCallback();
        return;
      }
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.synthCurrentTime, totalDuration);
      }

      const chordIdx = Math.floor(step / 8) % chords.length;
      const curChord = chords[chordIdx];
      const freq = curChord[step % curChord.length];

      // Deep Sub Kick / 808
      if (step % 4 === 0) {
        const subOsc = this.audioCtx.createOscillator();
        const subEnv = this.audioCtx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(curChord[0] / 2, now);
        subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

        subEnv.gain.setValueAtTime(0.35, now);
        subEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        subOsc.connect(subEnv);
        subEnv.connect(this.synthGain);
        subOsc.start(now);
        subOsc.stop(now + 0.45);
      }

      // Crisp FM/Saw Lead
      const osc = this.audioCtx.createOscillator();
      const env = this.audioCtx.createGain();
      osc.type = step % 3 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq * (step % 2 === 0 ? 1 : 2), now);

      env.gain.setValueAtTime(0.12, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(env);
      env.connect(this.synthGain);
      osc.start(now);
      osc.stop(now + 0.3);

      step++;
    };

    if (this.synthInterval) clearInterval(this.synthInterval);
    this.synthInterval = window.setInterval(playStep, intervalMs);
    playStep();
  }

  private pauseSynthesizedPlayback() {
    this.isSynthPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  private resumeSynthesizedPlayback() {
    this.isSynthPlaying = true;
    this.startSynthesizedPlayback();
  }

  private stopSynthesizedPlayback() {
    this.isSynthPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public onTimeUpdate(cb: (currentTime: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  public onPlayStateChange(cb: (isPlaying: boolean) => void) {
    this.onPlayStateChangeCallback = cb;
  }

  public isSynthMode(): boolean {
    return this.isSynthPlaying;
  }
}

export const audioEngine = new AudioEngine();
