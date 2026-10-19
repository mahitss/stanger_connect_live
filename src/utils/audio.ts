/**
 * Synthesized Web Audio soundscapes and UI/Game feedback
 * Uses pure browser AudioContext (zero external MP3 dependencies)
 */

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: AudioNode[] = [];
  private activeInterval: number | null = null;
  private currentMode: 'off' | 'rain' | 'binaural' | 'lofi' = 'off';

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public stopAmbient(): void {
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

  public getMode() {
    return this.currentMode;
  }

  public startAmbient(mode: 'off' | 'rain' | 'binaural' | 'lofi'): void {
    this.stopAmbient();
    if (mode === 'off') return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.currentMode = mode;

    if (mode === 'rain') {
      // Filtered brown/pink noise rain generator
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.15;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 850;

      const gain = ctx.createGain();
      gain.gain.value = 0.35;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(0);
      this.activeNodes.push(whiteNoise, filter, gain);
    } else if (mode === 'binaural') {
      // 432Hz + 440Hz Alpha 8Hz Focus Binaural Drone
      const oscLeft = ctx.createOscillator();
      const oscRight = ctx.createOscillator();
      const gain = ctx.createGain();
      oscLeft.type = 'sine';
      oscRight.type = 'sine';
      oscLeft.frequency.value = 216;
      oscRight.frequency.value = 224;
      gain.gain.value = 0.08;

      oscLeft.connect(gain);
      oscRight.connect(gain);
      gain.connect(ctx.destination);
      oscLeft.start();
      oscRight.start();
      this.activeNodes.push(oscLeft, oscRight, gain);
    } else if (mode === 'lofi') {
      // Gentle warm chord progression arpeggiator
      const chords = [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0],  // Am7
        [174.61, 220.0, 261.63, 349.23], // Fmaj7
        [196.0, 246.94, 293.66, 392.0],  // G6
      ];
      let chordIdx = 0;

      const playWarmPad = () => {
        if (!this.ctx || this.currentMode !== 'lofi') return;
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
          gain.gain.exponentialRampToValueAtTime(0.035, now + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.8);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 2.9);
        });
      };

      playWarmPad();
      this.activeInterval = window.setInterval(playWarmPad, 3000);
    }
  }

  public playSfx(type: 'jump' | 'coin' | 'hit' | 'launch' | 'clear' | 'chime'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

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
