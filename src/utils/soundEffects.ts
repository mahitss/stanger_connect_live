import { UiSoundChimeSpec, getUiSoundChimeSpec, UiSoundAlertEvent } from './rules';

let sharedAudioContext: AudioContext | null = null;

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    try {
      sharedAudioContext = new AudioCtx();
    } catch {
      return null;
    }
  }

  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {
      // Ignore autoplay policy restriction until user gesture
    });
  }

  return sharedAudioContext;
}

/**
 * Plays a subtle, warm two-note harmonic chime using the Web Audio API.
 * Designed for non-intrusive feedback on incoming messages and connection requests,
 * especially when the workspace is in the background or another mode is active.
 */
export function playSubtleUiChime(chime: UiSoundChimeSpec): boolean {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  try {
    const now = ctx.currentTime;
    const [freq1, freq2] = chime.frequenciesHz;
    const totalSec = Math.max(0.18, chime.durationMs / 1000);
    const secondNoteOffset = totalSec * 0.36;

    // Master low-pass filter so the chime sounds warm and tactile rather than piercing
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1850, now);
    filter.connect(ctx.destination);

    // Note 1 (Soft fundamental sine + subtle triangle overtone)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq1, now);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(chime.gainScalar, now + 0.018);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + totalSec * 0.75);

    osc1.connect(gain1);
    gain1.connect(filter);
    osc1.start(now);
    osc1.stop(now + totalSec * 0.78);

    // Note 2 (Ascending harmonic interval)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = chime.eventType === 'connection_request' ? 'triangle' : 'sine';
    osc2.frequency.setValueAtTime(freq2, now + secondNoteOffset);

    gain2.gain.setValueAtTime(0.0001, now + secondNoteOffset);
    gain2.gain.linearRampToValueAtTime(
      chime.gainScalar * 0.92,
      now + secondNoteOffset + 0.02
    );
    gain2.gain.exponentialRampToValueAtTime(
      0.0001,
      now + secondNoteOffset + totalSec * 0.85
    );

    osc2.connect(gain2);
    gain2.connect(filter);
    osc2.start(now + secondNoteOffset);
    osc2.stop(now + secondNoteOffset + totalSec * 0.88);

    return true;
  } catch {
    return false;
  }
}

export function previewUiSoundEffect(
  eventType: UiSoundAlertEvent,
  volumePercent = 65
): UiSoundChimeSpec {
  const spec = getUiSoundChimeSpec(eventType, false, volumePercent);
  playSubtleUiChime(spec);
  return spec;
}
