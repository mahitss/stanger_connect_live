/**
 * Synthesized Web Audio soundscapes and UI/Game feedback
 * Uses pure browser AudioContext (zero external MP3 dependencies)
 * Supports: Rainfall, Coffee Shop, White Noise, 432Hz Binaural, and Lo-Fi Study Chords
 */

export type AmbientSoundscapeId =
  | 'off'
  | 'rainfall'
  | 'coffeeshop'
  | 'whitenoise'
  | 'binaural'
  | 'lofi';

interface ActiveLayerChannel {
  trackId: Exclude<AmbientSoundscapeId, 'off'>;
  nodes: AudioNode[];
  channelGain: GainNode;
  baseScale: number;
  intervalId: number | null;
}

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private activeInterval: number | null = null;
  private layerChannels: Map<Exclude<AmbientSoundscapeId, 'off'>, ActiveLayerChannel> =
    new Map();
  private currentMode: AmbientSoundscapeId = 'off';
  private volume = 0.65;
  private systemSfxMuted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public setVolume(nextVolume: number): void {
    this.volume = Math.max(0, Math.min(1, nextVolume));
    if (this.masterGain && this.ctx && this.layerChannels.size === 0) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setSystemSfxMuted(muted: boolean): void {
    this.systemSfxMuted = Boolean(muted);
  }

  public isSystemSfxMuted(): boolean {
    return this.systemSfxMuted;
  }

  public stopLayer(trackId: Exclude<AmbientSoundscapeId, 'off'>): void {
    const channel = this.layerChannels.get(trackId);
    if (!channel) return;
    if (channel.intervalId !== null) {
      window.clearInterval(channel.intervalId);
    }
    for (const node of channel.nodes) {
      try {
        node.disconnect();
      } catch {
        // ignore
      }
    }
    try {
      channel.channelGain.disconnect();
    } catch {
      // ignore
    }
    this.layerChannels.delete(trackId);
  }

  public stopAllLayers(): void {
    for (const trackId of Array.from(this.layerChannels.keys())) {
      this.stopLayer(trackId);
    }
  }

  public stopAmbient(): void {
    this.stopAllLayers();
    if (this.activeInterval !== null) {
      window.clearInterval(this.activeInterval);
      this.activeInterval = null;
    }
    for (const node of this.activeNodes) {
      try {
        node.disconnect();
      } catch {
        // ignore
      }
    }
    this.activeNodes = [];
    this.currentMode = 'off';
  }

  public getMode(): AmbientSoundscapeId {
    return this.currentMode;
  }

  public getActiveLayerIds(): Exclude<AmbientSoundscapeId, 'off'>[] {
    return Array.from(this.layerChannels.keys());
  }

  private startLayerChannel(
    trackId: Exclude<AmbientSoundscapeId, 'off'>,
    effectiveGain: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.masterGain.gain.setValueAtTime(1.0, ctx.currentTime);

    const existing = this.layerChannels.get(trackId);
    if (existing) {
      const targetGain = Math.max(0, Math.min(1, effectiveGain)) * existing.baseScale;
      existing.channelGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);
      return;
    }

    const channelGain = ctx.createGain();
    let baseScale = 0.45;
    const nodes: AudioNode[] = [];
    let intervalId: number | null = null;

    if (trackId === 'rainfall') {
      baseScale = 0.48;
      channelGain.gain.value = Math.max(0, Math.min(1, effectiveGain)) * baseScale;
      channelGain.connect(this.masterGain);

      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.045;
        output[i] = (b0 + b1 + b2) * 0.14;
      }
      const rainSource = ctx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 920;

      rainSource.connect(lowpass);
      lowpass.connect(channelGain);
      rainSource.start(0);
      nodes.push(rainSource, lowpass);

      intervalId = window.setInterval(() => {
        if (!this.ctx || !this.layerChannels.has('rainfall')) return;
        const now = this.ctx.currentTime;
        const dropOsc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();
        dropOsc.type = 'sine';
        const baseFreq = 1100 + Math.random() * 900;
        dropOsc.frequency.setValueAtTime(baseFreq, now);
        dropOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.04);
        dropGain.gain.setValueAtTime(0.022, now);
        dropGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.045);
        dropOsc.connect(dropGain);
        dropGain.connect(channelGain);
        dropOsc.start(now);
        dropOsc.stop(now + 0.05);
      }, 280);
    } else if (trackId === 'coffeeshop') {
      baseScale = 0.55;
      channelGain.gain.value = Math.max(0, Math.min(1, effectiveGain)) * baseScale;
      channelGain.connect(this.masterGain);

      const bufferSize = ctx.sampleRate * 4;
      const murmurBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = murmurBuffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const envelope =
          0.65 +
          0.35 *
            Math.sin(i / (ctx.sampleRate * 0.45)) *
            Math.cos(i / (ctx.sampleRate * 0.19));
        last = (last + 0.04 * white) / 1.04;
        data[i] = last * envelope * 0.28;
      }

      const murmurSource = ctx.createBufferSource();
      murmurSource.buffer = murmurBuffer;
      murmurSource.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 460;
      bandpass.Q.value = 0.7;

      murmurSource.connect(bandpass);
      bandpass.connect(channelGain);
      murmurSource.start(0);
      nodes.push(murmurSource, bandpass);

      intervalId = window.setInterval(() => {
        if (!this.ctx || !this.layerChannels.has('coffeeshop')) return;
        const now = this.ctx.currentTime;
        const cupOsc = this.ctx.createOscillator();
        const cupGain = this.ctx.createGain();
        cupOsc.type = 'triangle';
        const pitch = 1850 + Math.random() * 450;
        cupOsc.frequency.setValueAtTime(pitch, now);
        cupGain.gain.setValueAtTime(0.025, now);
        cupGain.gain.exponentialRampToValueAtTime(0.0004, now + 0.09);
        cupOsc.connect(cupGain);
        cupGain.connect(channelGain);
        cupOsc.start(now);
        cupOsc.stop(now + 0.1);
      }, 2400);
    } else if (trackId === 'whitenoise') {
      baseScale = 0.35;
      channelGain.gain.value = Math.max(0, Math.min(1, effectiveGain)) * baseScale;
      channelGain.connect(this.masterGain);

      const bufferSize = ctx.sampleRate * 2;
      const whiteBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = whiteBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.07;
      }

      const whiteSource = ctx.createBufferSource();
      whiteSource.buffer = whiteBuffer;
      whiteSource.loop = true;

      const shelf = ctx.createBiquadFilter();
      shelf.type = 'lowpass';
      shelf.frequency.value = 4200;

      whiteSource.connect(shelf);
      shelf.connect(channelGain);
      whiteSource.start(0);
      nodes.push(whiteSource, shelf);
    } else if (trackId === 'binaural') {
      baseScale = 0.12;
      channelGain.gain.value = Math.max(0, Math.min(1, effectiveGain)) * baseScale;
      channelGain.connect(this.masterGain);

      const oscLeft = ctx.createOscillator();
      const oscRight = ctx.createOscillator();
      oscLeft.type = 'sine';
      oscRight.type = 'sine';
      oscLeft.frequency.value = 216;
      oscRight.frequency.value = 224;

      oscLeft.connect(channelGain);
      oscRight.connect(channelGain);
      oscLeft.start();
      oscRight.start();
      nodes.push(oscLeft, oscRight);
    } else if (trackId === 'lofi') {
      baseScale = 0.65;
      channelGain.gain.value = Math.max(0, Math.min(1, effectiveGain)) * baseScale;
      channelGain.connect(this.masterGain);

      const chords = [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0], // Am7
        [174.61, 220.0, 261.63, 349.23], // Fmaj7
        [196.0, 246.94, 293.66, 392.0], // G6
      ];
      let chordIdx = 0;

      const playWarmPad = () => {
        if (!this.ctx || !this.layerChannels.has('lofi')) return;
        const notes = chords[chordIdx % chords.length];
        chordIdx++;
        const now = this.ctx.currentTime;
        notes.forEach((freq) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.05, now + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.8);
          osc.connect(gain);
          gain.connect(channelGain);
          osc.start(now);
          osc.stop(now + 2.9);
        });
      };

      playWarmPad();
      intervalId = window.setInterval(playWarmPad, 3000);
    }

    this.layerChannels.set(trackId, {
      trackId,
      nodes,
      channelGain,
      baseScale,
      intervalId,
    });
  }

  /**
   * Synchronizes multiple simultaneous ambient soundscape layers with independent gains.
   */
  public syncMultiLayerMix(
    layerGains: Record<Exclude<AmbientSoundscapeId, 'off'>, number>
  ): void {
    const trackIds: Exclude<AmbientSoundscapeId, 'off'>[] = [
      'rainfall',
      'coffeeshop',
      'whitenoise',
      'binaural',
      'lofi',
    ];
    let firstActive: AmbientSoundscapeId = 'off';

    for (const id of trackIds) {
      const gain = Number(layerGains[id] ?? 0);
      if (gain > 0) {
        if (firstActive === 'off') firstActive = id;
        this.startLayerChannel(id, gain);
      } else if (this.layerChannels.has(id)) {
        this.stopLayer(id);
      }
    }

    this.currentMode = firstActive;
  }

  public startAmbient(mode: AmbientSoundscapeId): void {
    if (mode === 'off') {
      this.stopAmbient();
      return;
    }
    this.syncMultiLayerMix({
      rainfall: mode === 'rainfall' ? this.volume : 0,
      coffeeshop: mode === 'coffeeshop' ? this.volume : 0,
      whitenoise: mode === 'whitenoise' ? this.volume : 0,
      binaural: mode === 'binaural' ? this.volume : 0,
      lofi: mode === 'lofi' ? this.volume : 0,
    });
  }

  public playSfx(type: 'jump' | 'coin' | 'hit' | 'launch' | 'clear' | 'chime'): void {
    if (this.systemSfxMuted || this.volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    if (type === 'jump') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'coin') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (type === 'launch') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'clear' || type === 'chime') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }
}

export const soundEngine = new SoundscapeEngine();
