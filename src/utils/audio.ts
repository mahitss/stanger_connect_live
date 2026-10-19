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

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private activeInterval: number | null = null;
  private currentMode: AmbientSoundscapeId = 'off';
  private volume = 0.65;

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
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public setVolume(nextVolume: number): void {
    this.volume = Math.max(0, Math.min(1, nextVolume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
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

  public getMode(): AmbientSoundscapeId {
    return this.currentMode;
  }

  public startAmbient(mode: AmbientSoundscapeId): void {
    this.stopAmbient();
    if (mode === 'off') return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    this.currentMode = mode;

    if (mode === 'rainfall') {
      // Multi-layered Rainfall: warm pink/brown rain bed + gentle high-frequency pattering droplets
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
        b2 = 0.950 * b2 + white * 0.045;
        output[i] = (b0 + b1 + b2) * 0.14;
      }
      const rainSource = ctx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 920;

      const gain = ctx.createGain();
      gain.gain.value = 0.45;

      rainSource.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(this.masterGain);
      rainSource.start(0);
      this.activeNodes.push(rainSource, lowpass, gain);

      // Subtle raindrop pattering
      this.activeInterval = window.setInterval(() => {
        if (!this.ctx || !this.masterGain || this.currentMode !== 'rainfall') return;
        const now = this.ctx.currentTime;
        const dropOsc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();
        dropOsc.type = 'sine';
        const baseFreq = 1100 + Math.random() * 900;
        dropOsc.frequency.setValueAtTime(baseFreq, now);
        dropOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.04);
        dropGain.gain.setValueAtTime(0.012, now);
        dropGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.045);
        dropOsc.connect(dropGain);
        dropGain.connect(this.masterGain);
        dropOsc.start(now);
        dropOsc.stop(now + 0.05);
      }, 280);
    } else if (mode === 'coffeeshop') {
      // Coffee Shop: warm mid-band acoustic room murmur + soft espresso/porcelain clinks
      const bufferSize = ctx.sampleRate * 4;
      const murmurBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = murmurBuffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Slow amplitude modulation to mimic distant room conversation cadence
        const envelope = 0.65 + 0.35 * Math.sin(i / (ctx.sampleRate * 0.45)) * Math.cos(i / (ctx.sampleRate * 0.19));
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

      const roomGain = ctx.createGain();
      roomGain.gain.value = 0.55;

      murmurSource.connect(bandpass);
      bandpass.connect(roomGain);
      roomGain.connect(this.masterGain);
      murmurSource.start(0);
      this.activeNodes.push(murmurSource, bandpass, roomGain);

      // Soft ceramic cup / warm acoustic chime every few seconds
      this.activeInterval = window.setInterval(() => {
        if (!this.ctx || !this.masterGain || this.currentMode !== 'coffeeshop') return;
        const now = this.ctx.currentTime;
        const cupOsc = this.ctx.createOscillator();
        const cupGain = this.ctx.createGain();
        cupOsc.type = 'triangle';
        const pitch = 1850 + Math.random() * 450;
        cupOsc.frequency.setValueAtTime(pitch, now);
        cupGain.gain.setValueAtTime(0.015, now);
        cupGain.gain.exponentialRampToValueAtTime(0.0004, now + 0.09);
        cupOsc.connect(cupGain);
        cupGain.connect(this.masterGain);
        cupOsc.start(now);
        cupOsc.stop(now + 0.1);
      }, 2400);
    } else if (mode === 'whitenoise') {
      // Calibrated Studio White Noise: smooth high-frequency rolloff for non-fatiguing focus masking
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

      const gain = ctx.createGain();
      gain.gain.value = 0.32;

      whiteSource.connect(shelf);
      shelf.connect(gain);
      gain.connect(this.masterGain);
      whiteSource.start(0);
      this.activeNodes.push(whiteSource, shelf, gain);
    } else if (mode === 'binaural') {
      // 432Hz + 440Hz Alpha 8Hz Focus Binaural Drone
      const oscLeft = ctx.createOscillator();
      const oscRight = ctx.createOscillator();
      const gain = ctx.createGain();
      oscLeft.type = 'sine';
      oscRight.type = 'sine';
      oscLeft.frequency.value = 216;
      oscRight.frequency.value = 224;
      gain.gain.value = 0.09;

      oscLeft.connect(gain);
      oscRight.connect(gain);
      gain.connect(this.masterGain);
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
        if (!this.ctx || !this.masterGain || this.currentMode !== 'lofi') return;
        const notes = chords[chordIdx % chords.length];
        chordIdx++;
        const now = this.ctx.currentTime;
        notes.forEach((freq) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.04, now + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.8);
          osc.connect(gain);
          gain.connect(this.masterGain);
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
