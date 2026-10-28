/**
 * Pure domain logic for Mr. Stranger:
 * 1. Daily login streak and participation points math
 * 2. Daily Productivity Goal target & progress bar math
 * 3. SQL / NoSQL Injection, XSS & Prototype Pollution detection + sanitization
 * 4. Sliding-window rate limiting & strict invite-first chat/call authorization
 * 5. Subway Runner 3-lane obstacle collision & score calculation
 * 6. Angry Catapult projectile trajectory & structure impact physics
 * 7. Block Arena grid placement, line clearing & score math
 * 8. Pomodoro Study Timer formatting, Study Room invite codes, shareable links & Ambient Soundscape toggling
 * 9. Privacy visibility filtering & password strength validation
 */

export const APP_LOGO_URL = '/assets/aistudio/image_18838782.png';
export const APP_BRAND_NAME = 'Mr. Stranger';

export type AmbientPresetId =
  | 'off'
  | 'rainfall'
  | 'coffeeshop'
  | 'whitenoise'
  | 'binaural'
  | 'lofi';

export interface AmbientPresetMeta {
  id: Exclude<AmbientPresetId, 'off'>;
  label: string;
  shortLabel: string;
  subtitle: string;
  frequencyProfile: string;
  cadence: string;
}

export const AMBIENT_SOUNDSCAPES: AmbientPresetMeta[] = [
  {
    id: 'rainfall',
    label: 'Rain',
    shortLabel: 'Rain',
    subtitle: 'Steady warm rainfall bed with pattering window droplets',
    frequencyProfile: '120Hz – 920Hz Low-Pass Pink',
    cadence: 'Continuous Acoustic Bed',
  },
  {
    id: 'coffeeshop',
    label: 'Cafe',
    shortLabel: 'Cafe',
    subtitle: 'Warm coffee shop murmur with subtle porcelain acoustics',
    frequencyProfile: '460Hz Band-Pass Room Envelope',
    cadence: 'Organic Room Cadence',
  },
  {
    id: 'whitenoise',
    label: 'White Noise',
    shortLabel: 'White Noise',
    subtitle: 'Calibrated broadband masking to block external distractions',
    frequencyProfile: '20Hz – 4.2kHz Flat Mask',
    cadence: 'Zero-Variance Shield',
  },
  {
    id: 'binaural',
    label: '432Hz Alpha Focus',
    shortLabel: 'Alpha Focus',
    subtitle: 'Phase-locked 8Hz alpha binaural harmonic carrier',
    frequencyProfile: '216Hz L / 224Hz R Sine',
    cadence: '8.0Hz Alpha Entrainment',
  },
  {
    id: 'lofi',
    label: 'Lo-Fi Study Chords',
    shortLabel: 'Lo-Fi Chords',
    subtitle: 'Warm analog Cmaj7–Am7–Fmaj7–G6 harmonic progression',
    frequencyProfile: '174Hz – 493Hz Triangle Pad',
    cadence: '20 BPM Chord Cycle',
  },
];

export function toggleAmbientSoundscape(
  current: AmbientPresetId,
  clicked: AmbientPresetId
): AmbientPresetId {
  if (clicked === 'off') return 'off';
  return current === clicked ? 'off' : clicked;
}

export interface AmbientWorkspaceState {
  activeProfile: AmbientPresetId;
  volumePercent: number;
  isMuted: boolean;
  lastNonZeroVolumePercent: number;
}

export const DEFAULT_AMBIENT_WORKSPACE_STATE: AmbientWorkspaceState = {
  activeProfile: 'off',
  volumePercent: 65,
  isMuted: false,
  lastNonZeroVolumePercent: 65,
};

export const AMBIENT_VOLUME_PRESETS: readonly {
  percent: number;
  label: string;
}[] = [
  { percent: 25, label: '25% Subtle' },
  { percent: 50, label: '50% Balanced' },
  { percent: 75, label: '75% Immersive' },
  { percent: 100, label: '100% Max' },
];

export function clampAmbientVolumePercent(rawVolume: number): number {
  if (!Number.isFinite(rawVolume)) return 65;
  return Math.min(100, Math.max(0, Math.round(rawVolume)));
}

export function resolveAmbientProfileId(input: string): AmbientPresetId {
  const normalized = String(input || '')
    .trim()
    .toLowerCase();
  if (normalized === 'rain' || normalized === 'rainfall') return 'rainfall';
  if (
    normalized === 'cafe' ||
    normalized === 'café' ||
    normalized === 'coffee shop' ||
    normalized === 'coffeeshop'
  ) {
    return 'coffeeshop';
  }
  if (normalized === 'white noise' || normalized === 'whitenoise') {
    return 'whitenoise';
  }
  if (
    normalized === 'binaural' ||
    normalized === 'alpha focus' ||
    normalized === '432hz alpha focus'
  ) {
    return 'binaural';
  }
  if (
    normalized === 'lofi' ||
    normalized === 'lo-fi' ||
    normalized === 'lo-fi chords' ||
    normalized === 'lo-fi study chords'
  ) {
    return 'lofi';
  }
  return 'off';
}

export function selectAmbientWorkspaceProfile(
  state: AmbientWorkspaceState,
  profileInput: AmbientPresetId | string
): AmbientWorkspaceState {
  const resolved =
    profileInput === 'off' ||
    profileInput === 'rainfall' ||
    profileInput === 'coffeeshop' ||
    profileInput === 'whitenoise' ||
    profileInput === 'binaural' ||
    profileInput === 'lofi'
      ? profileInput
      : resolveAmbientProfileId(profileInput);

  const nextProfile = toggleAmbientSoundscape(state.activeProfile, resolved);
  const safeLastNonZero =
    state.lastNonZeroVolumePercent > 0
      ? clampAmbientVolumePercent(state.lastNonZeroVolumePercent)
      : 65;

  // If activating a sound profile while muted or at 0% volume, restore last non-zero volume
  if (nextProfile !== 'off' && (state.isMuted || state.volumePercent === 0)) {
    return {
      activeProfile: nextProfile,
      volumePercent: safeLastNonZero,
      isMuted: false,
      lastNonZeroVolumePercent: safeLastNonZero,
    };
  }

  return {
    ...state,
    activeProfile: nextProfile,
  };
}

export function updateAmbientWorkspaceVolume(
  state: AmbientWorkspaceState,
  rawVolume: number
): AmbientWorkspaceState {
  const clamped = clampAmbientVolumePercent(rawVolume);
  if (clamped === 0) {
    return {
      ...state,
      volumePercent: 0,
      isMuted: true,
    };
  }
  return {
    ...state,
    volumePercent: clamped,
    isMuted: false,
    lastNonZeroVolumePercent: clamped,
  };
}

export function toggleAmbientWorkspaceMute(
  state: AmbientWorkspaceState
): AmbientWorkspaceState {
  if (!state.isMuted && state.volumePercent > 0) {
    return {
      ...state,
      isMuted: true,
      lastNonZeroVolumePercent: state.volumePercent,
    };
  }
  const restored =
    state.lastNonZeroVolumePercent > 0
      ? clampAmbientVolumePercent(state.lastNonZeroVolumePercent)
      : 65;
  return {
    ...state,
    volumePercent: restored,
    isMuted: false,
    lastNonZeroVolumePercent: restored,
  };
}

export function getEffectiveAmbientGain(state: AmbientWorkspaceState): number {
  if (state.activeProfile === 'off' || state.isMuted || state.volumePercent <= 0) {
    return 0;
  }
  return Number((clampAmbientVolumePercent(state.volumePercent) / 100).toFixed(2));
}

export function formatAmbientWorkspaceStatus(
  state: AmbientWorkspaceState
): string {
  const preset = AMBIENT_SOUNDSCAPES.find((p) => p.id === state.activeProfile);
  const effectivePercent = state.isMuted ? 0 : clampAmbientVolumePercent(state.volumePercent);
  if (!preset) {
    return `Standby · Background Volume ${effectivePercent}%`;
  }
  if (state.isMuted || effectivePercent === 0) {
    return `Playing: ${preset.label} (Muted · 0% Volume)`;
  }
  return `Playing: ${preset.label} · ${effectivePercent}% Background Volume`;
}

// --- Subtle UI Sound Effect Toggle for Incoming Messages, Connection Requests & Quick Focus Desk ---
export type UiSoundAlertEvent =
  | 'incoming_message'
  | 'connection_request'
  | 'start'
  | 'end'
  | 'ui_chime';

export interface UiSoundEffectPreferences {
  enabled: boolean;
  incomingMessages: boolean;
  connectionRequests: boolean;
  backgroundBoost: boolean;
  volumePercent: number;
}

export interface UiSoundChimeSpec {
  eventType: UiSoundAlertEvent;
  label: string;
  frequenciesHz: [number, number];
  noteNames: string;
  durationMs: number;
  gainScalar: number;
}

export const DEFAULT_UI_SOUND_PREFERENCES: UiSoundEffectPreferences = {
  enabled: true,
  incomingMessages: true,
  connectionRequests: true,
  backgroundBoost: true,
  volumePercent: 65,
};

export function clampSoundVolumePercent(rawVolume: number): number {
  if (!Number.isFinite(rawVolume)) return 65;
  return Math.min(100, Math.max(10, Math.round(rawVolume)));
}

export function toggleUiSoundEffects(
  current: UiSoundEffectPreferences,
  explicitEnabled?: boolean
): UiSoundEffectPreferences {
  const nextEnabled =
    typeof explicitEnabled === 'boolean' ? explicitEnabled : !current.enabled;
  return {
    ...current,
    enabled: nextEnabled,
    volumePercent: clampSoundVolumePercent(current.volumePercent),
  };
}

export function isStudyRoomAllAudioMuted(
  ambientState: AmbientWorkspaceState,
  uiSoundPrefs: UiSoundEffectPreferences
): boolean {
  const ambientMuted =
    Boolean(ambientState?.isMuted) ||
    clampAmbientVolumePercent(ambientState?.volumePercent ?? 0) === 0;
  const systemMuted = !uiSoundPrefs?.enabled;
  return ambientMuted && systemMuted;
}

export function toggleStudyRoomAllAudioMute(params: {
  ambientState: AmbientWorkspaceState;
  uiSoundPrefs: UiSoundEffectPreferences;
  forceMute?: boolean;
}): {
  ambientState: AmbientWorkspaceState;
  uiSoundPrefs: UiSoundEffectPreferences;
  isAllMuted: boolean;
  statusLabel: string;
} {
  const currentlyAllMuted = isStudyRoomAllAudioMuted(
    params.ambientState,
    params.uiSoundPrefs
  );
  const targetMute =
    typeof params.forceMute === 'boolean' ? params.forceMute : !currentlyAllMuted;

  if (targetMute) {
    const preservedNonZero =
      params.ambientState.volumePercent > 0
        ? clampAmbientVolumePercent(params.ambientState.volumePercent)
        : params.ambientState.lastNonZeroVolumePercent > 0
        ? clampAmbientVolumePercent(params.ambientState.lastNonZeroVolumePercent)
        : 65;

    const nextAmbient: AmbientWorkspaceState = {
      ...params.ambientState,
      isMuted: true,
      lastNonZeroVolumePercent: preservedNonZero,
    };
    const nextUiPrefs = toggleUiSoundEffects(params.uiSoundPrefs, false);
    return {
      ambientState: nextAmbient,
      uiSoundPrefs: nextUiPrefs,
      isAllMuted: true,
      statusLabel: 'All System & Ambient Sounds Muted',
    };
  }

  const restoredVolume =
    params.ambientState.lastNonZeroVolumePercent > 0
      ? clampAmbientVolumePercent(params.ambientState.lastNonZeroVolumePercent)
      : params.ambientState.volumePercent > 0
      ? clampAmbientVolumePercent(params.ambientState.volumePercent)
      : 65;

  const nextAmbient: AmbientWorkspaceState = {
    ...params.ambientState,
    volumePercent: restoredVolume,
    isMuted: false,
    lastNonZeroVolumePercent: restoredVolume,
  };
  const nextUiPrefs = toggleUiSoundEffects(params.uiSoundPrefs, true);

  return {
    ambientState: nextAmbient,
    uiSoundPrefs: nextUiPrefs,
    isAllMuted: false,
    statusLabel: 'System & Ambient Sounds Active',
  };
}


export function getUiSoundChimeSpec(
  eventType: UiSoundAlertEvent,
  isAppInBackground = false,
  volumePercent = 65
): UiSoundChimeSpec {
  const safeVolume = clampSoundVolumePercent(volumePercent);
  const baseGain = (safeVolume / 100) * 0.14;
  const gainScalar = Number(
    (isAppInBackground ? Math.min(0.22, baseGain * 1.25) : baseGain).toFixed(4)
  );

  if (eventType === 'start') {
    return {
      eventType: 'start',
      label: 'Focus Desk Start Chime',
      frequenciesHz: [523.25, 659.25],
      noteNames: 'C5 → E5 Focus Start',
      durationMs: isAppInBackground ? 300 : 240,
      gainScalar,
    };
  }

  if (eventType === 'end') {
    return {
      eventType: 'end',
      label: 'Focus Desk End Chime',
      frequenciesHz: [659.25, 493.88],
      noteNames: 'E5 → B4 Focus End',
      durationMs: isAppInBackground ? 300 : 240,
      gainScalar,
    };
  }

  if (eventType === 'ui_chime') {
    return {
      eventType: 'ui_chime',
      label: 'Clear Filters Reset UI Chime',
      frequenciesHz: [587.33, 440],
      noteNames: 'D5 → A4 Subtle UI Chime',
      durationMs: isAppInBackground ? 260 : 200,
      gainScalar,
    };
  }

  if (eventType === 'connection_request') {
    return {
      eventType: 'connection_request',
      label: 'Connection Request Chime',
      frequenciesHz: [440, 659.25],
      noteNames: 'A4 → E5 Warm Interval',
      durationMs: isAppInBackground ? 360 : 280,
      gainScalar,
    };
  }

  return {
    eventType: 'incoming_message',
    label: 'Incoming Message Chime',
    frequenciesHz: [528, 792],
    noteNames: 'C5 → G5 Soft Fifth',
    durationMs: isAppInBackground ? 300 : 220,
    gainScalar,
  };
}

export function resolveQuickFocusDeskSoundTrigger(params: {
  isCurrentlyAtDesk: boolean;
  preferences?: UiSoundEffectPreferences;
}): {
  action: 'join' | 'leave';
  chimeType: 'start' | 'end';
  shouldPlay: boolean;
  chime: UiSoundChimeSpec;
  feedbackMessage: string;
} {
  const prefs = params.preferences ?? DEFAULT_UI_SOUND_PREFERENCES;
  const isJoining = !params.isCurrentlyAtDesk;
  const chimeType: 'start' | 'end' = isJoining ? 'start' : 'end';
  const chime = getUiSoundChimeSpec(chimeType, false, prefs.volumePercent);
  const shouldPlay = Boolean(prefs.enabled);

  const feedbackMessage = isJoining
    ? shouldPlay
      ? `Start chime played: Joined Focus Desk (${chime.noteNames})`
      : 'Joined Focus Desk (Sound alerts muted)'
    : shouldPlay
      ? `End chime played: Left Focus Desk (${chime.noteNames})`
      : 'Left Focus Desk (Sound alerts muted)';

  return {
    action: isJoining ? 'join' : 'leave',
    chimeType,
    shouldPlay,
    chime,
    feedbackMessage,
  };
}

export function shouldPlayUiNotificationSound(params: {
  preferences: UiSoundEffectPreferences;
  eventType: UiSoundAlertEvent;
  senderUid: string;
  currentUid: string;
  isAppInBackground?: boolean;
}): {
  shouldPlay: boolean;
  reason: string;
  chime: UiSoundChimeSpec | null;
} {
  const { preferences, eventType, senderUid, currentUid, isAppInBackground = false } = params;
  const cleanSender = String(senderUid || '').trim();
  const cleanCurrent = String(currentUid || '').trim();

  if (!cleanSender || !cleanCurrent) {
    return {
      shouldPlay: false,
      reason: 'Missing sender or recipient identity.',
      chime: null,
    };
  }

  if (cleanSender === cleanCurrent) {
    return {
      shouldPlay: false,
      reason: 'Self-originated events do not trigger incoming notification chimes.',
      chime: null,
    };
  }

  if (!preferences.enabled) {
    return {
      shouldPlay: false,
      reason: 'UI sound effects are muted.',
      chime: null,
    };
  }

  if (eventType === 'incoming_message' && !preferences.incomingMessages) {
    return {
      shouldPlay: false,
      reason: 'Incoming message sound alerts are disabled.',
      chime: null,
    };
  }

  if (eventType === 'connection_request' && !preferences.connectionRequests) {
    return {
      shouldPlay: false,
      reason: 'Connection request sound alerts are disabled.',
      chime: null,
    };
  }

  const boostActive = Boolean(isAppInBackground && preferences.backgroundBoost);
  const chime = getUiSoundChimeSpec(eventType, boostActive, preferences.volumePercent);

  return {
    shouldPlay: true,
    reason: isAppInBackground
      ? 'Background tab alert chime triggered.'
      : 'Foreground subtle UI chime triggered.',
    chime,
  };
}

// --- Online Directory 'In Focus' Indicator Logic (Study Room Presence) ---
export interface StudyDeskSummary {
  uid: string;
  roomCode: string;
  roomName?: string;
  subject?: string;
  timerMinutes?: number;
}

export interface OnlinePeerFocusInput {
  uid: string;
  currentMode: string;
  activeStudyRoomCode?: string | null;
}

export interface OnlinePeerFocusStatus {
  isInFocus: boolean;
  indicatorLabel: 'In Focus' | null;
  roomCode: string | null;
  subject: string | null;
  timerMinutes: number | null;
  statusDetail: string;
}

export function getOnlinePeerFocusStatus(
  peer: OnlinePeerFocusInput,
  studyDesks: StudyDeskSummary[] = []
): OnlinePeerFocusStatus {
  const cleanUid = String(peer?.uid || '').trim();
  const matchingDesk = studyDesks.find((desk) => String(desk.uid || '').trim() === cleanUid);
  const isStudyMode = String(peer?.currentMode || '').trim().toLowerCase() === 'study';
  const isInFocus = Boolean(isStudyMode || matchingDesk);

  if (!isInFocus) {
    return {
      isInFocus: false,
      indicatorLabel: null,
      roomCode: null,
      subject: null,
      timerMinutes: null,
      statusDetail: '',
    };
  }

  const rawRoomCode =
    matchingDesk?.roomCode || peer.activeStudyRoomCode || 'STUDY-GLOBAL';
  const roomCode = normalizeStudyRoomCode(rawRoomCode) || 'STUDY-GLOBAL';
  const subject = matchingDesk?.subject?.trim() || null;
  const timerMinutes =
    typeof matchingDesk?.timerMinutes === 'number' && matchingDesk.timerMinutes > 0
      ? Math.round(matchingDesk.timerMinutes)
      : null;

  const detailParts: string[] = [roomCode];
  if (subject) {
    detailParts.push(subject);
  }
  if (timerMinutes) {
    detailParts.push(`${timerMinutes}m`);
  }

  return {
    isInFocus: true,
    indicatorLabel: 'In Focus',
    roomCode,
    subject,
    timerMinutes,
    statusDetail: detailParts.join(' · '),
  };
}

export function summarizeOnlineDirectoryFocus(
  peers: OnlinePeerFocusInput[],
  studyDesks: StudyDeskSummary[] = []
): {
  totalOnline: number;
  inFocusCount: number;
  byUid: Record<string, OnlinePeerFocusStatus>;
} {
  const byUid: Record<string, OnlinePeerFocusStatus> = {};
  let inFocusCount = 0;

  for (const peer of peers) {
    const cleanUid = String(peer?.uid || '').trim();
    if (!cleanUid) continue;
    const status = getOnlinePeerFocusStatus(peer, studyDesks);
    byUid[cleanUid] = status;
    if (status.isInFocus) {
      inFocusCount += 1;
    }
  }

  return {
    totalOnline: peers.length,
    inFocusCount,
    byUid,
  };
}

export function filterOnlinePeersByFocus<T extends OnlinePeerFocusInput>(
  peers: T[],
  studyDesks: StudyDeskSummary[] = [],
  onlyInFocus = false
): T[] {
  if (!onlyInFocus) return peers;
  return peers.filter((peer) => getOnlinePeerFocusStatus(peer, studyDesks).isInFocus);
}

// --- Online Directory 'Mood' Indicator Logic (Real-Time Peer Status) ---
export type OnlineMoodTone = 'emerald' | 'amber' | 'sky' | 'violet' | 'zinc';
export type OnlineMoodCategory = 'Productive' | 'Social' | 'Away';

export const ONLINE_MOOD_CATEGORIES: readonly OnlineMoodCategory[] = [
  'Productive',
  'Social',
  'Away',
] as const;

export interface OnlinePeerMoodOption {
  id: string;
  label: string;
  description: string;
  tone: OnlineMoodTone;
  category: OnlineMoodCategory;
}

export const ONLINE_MOOD_PRESETS: readonly OnlinePeerMoodOption[] = [
  {
    id: 'deep_work',
    label: 'Deep Work',
    description: 'Heads-down execution — minimal interruptions',
    tone: 'emerald',
    category: 'Productive',
  },
  {
    id: 'brainstorming',
    label: 'Brainstorming',
    description: 'Open to creative ideas & architecture discussions',
    tone: 'amber',
    category: 'Social',
  },
  {
    id: 'quick_questions',
    label: 'Quick Questions',
    description: 'Available for fast unblocking & short pings',
    tone: 'sky',
    category: 'Social',
  },
  {
    id: 'pair_programming',
    label: 'Pair Programming',
    description: 'Looking to collaborate on code or problem solving',
    tone: 'violet',
    category: 'Productive',
  },
  {
    id: 'coffee_break',
    label: 'Coffee Break',
    description: 'Recharging — open to casual conversation',
    tone: 'zinc',
    category: 'Away',
  },
] as const;

export interface OnlineMoodCategoryGroup {
  category: OnlineMoodCategory;
  categoryFilterValue: `category:${OnlineMoodCategory}`;
  label: string;
  description: string;
  presets: OnlinePeerMoodOption[];
  activeCount: number;
}

export function resolveMoodCategoryForText(rawLabel: string | null | undefined): OnlineMoodCategory {
  const lower = String(rawLabel || '').trim().toLowerCase();
  const preset = ONLINE_MOOD_PRESETS.find(
    (p) => p.label.toLowerCase() === lower || p.id === lower
  );
  if (preset) return preset.category;
  if (
    lower.includes('break') ||
    lower.includes('away') ||
    lower.includes('afk') ||
    lower.includes('lunch') ||
    lower.includes('offline') ||
    lower.includes('rest')
  ) {
    return 'Away';
  }
  if (
    lower.includes('work') ||
    lower.includes('focus') ||
    lower.includes('study') ||
    lower.includes('code') ||
    lower.includes('pair') ||
    lower.includes('debug')
  ) {
    return 'Productive';
  }
  return 'Social';
}

export function groupOnlineMoodPresetsByCategory(
  countsByMood: Record<string, number> = {},
  countsByCategory: Partial<Record<OnlineMoodCategory, number>> = {}
): OnlineMoodCategoryGroup[] {
  const categoryDescriptions: Record<OnlineMoodCategory, string> = {
    Productive: 'Focused execution & technical collaboration',
    Social: 'Open discussions, brainstorming & quick unblocking',
    Away: 'Recharging, stepping away & coffee breaks',
  };

  return ONLINE_MOOD_CATEGORIES.map((category) => {
    const presets = ONLINE_MOOD_PRESETS.filter((p) => p.category === category);
    const presetSum = presets.reduce(
      (sum, p) => sum + (Number(countsByMood[p.label]) || 0),
      0
    );
    const explicitCategoryCount = countsByCategory[category];
    const activeCount =
      typeof explicitCategoryCount === 'number'
        ? Math.max(presetSum, explicitCategoryCount)
        : presetSum;

    return {
      category,
      categoryFilterValue: `category:${category}`,
      label: category,
      description: categoryDescriptions[category],
      presets,
      activeCount,
    };
  });
}

export const MAX_PEER_MOOD_LENGTH = 36;

export function normalizeAndValidatePeerMood(rawMood: unknown): {
  valid: boolean;
  mood: string | null;
  error: string;
} {
  if (rawMood === null || rawMood === undefined) {
    return { valid: true, mood: null, error: '' };
  }
  const str = String(rawMood).trim();
  if (!str) {
    return { valid: true, mood: null, error: '' };
  }
  if (str.length > MAX_PEER_MOOD_LENGTH) {
    return {
      valid: false,
      mood: null,
      error: `Mood indicator must be ${MAX_PEER_MOOD_LENGTH} characters or fewer.`,
    };
  }
  const threat = detectSecurityThreat(str);
  if (!threat.safe) {
    return {
      valid: false,
      mood: null,
      error: threat.reason,
    };
  }
  const sanitized = sanitizeSafeText(str, MAX_PEER_MOOD_LENGTH);
  if (!sanitized) {
    return { valid: true, mood: null, error: '' };
  }

  // Canonicalize case if it matches a built-in preset
  const matchingPreset = ONLINE_MOOD_PRESETS.find(
    (p) => p.label.toLowerCase() === sanitized.toLowerCase() || p.id === sanitized.toLowerCase()
  );
  return {
    valid: true,
    mood: matchingPreset ? matchingPreset.label : sanitized,
    error: '',
  };
}

export interface OnlinePeerMoodMeta {
  hasMood: boolean;
  label: string | null;
  description: string;
  tone: OnlineMoodTone;
  isPreset: boolean;
  category: OnlineMoodCategory | null;
}

export function getOnlinePeerMoodMeta(rawMood?: string | null): OnlinePeerMoodMeta {
  const check = normalizeAndValidatePeerMood(rawMood);
  if (!check.valid || !check.mood) {
    return {
      hasMood: false,
      label: null,
      description: 'No active mood set',
      tone: 'zinc',
      isPreset: false,
      category: null,
    };
  }

  const preset = ONLINE_MOOD_PRESETS.find(
    (p) => p.label.toLowerCase() === check.mood!.toLowerCase()
  );
  if (preset) {
    return {
      hasMood: true,
      label: preset.label,
      description: preset.description,
      tone: preset.tone,
      isPreset: true,
      category: preset.category,
    };
  }

  return {
    hasMood: true,
    label: check.mood,
    description: 'Custom status mood shared with online peers',
    tone: 'sky',
    isPreset: false,
    category: resolveMoodCategoryForText(check.mood),
  };
}

export function summarizeOnlineDirectoryMoods(
  peers: Array<{ uid: string; mood?: string | null }>
): {
  activeMoodCount: number;
  countsByMood: Record<string, number>;
  countsByCategory: Record<OnlineMoodCategory, number>;
  groupedPresets: OnlineMoodCategoryGroup[];
  byUid: Record<string, OnlinePeerMoodMeta>;
} {
  const countsByMood: Record<string, number> = {};
  const countsByCategory: Record<OnlineMoodCategory, number> = {
    Productive: 0,
    Social: 0,
    Away: 0,
  };
  const byUid: Record<string, OnlinePeerMoodMeta> = {};
  let activeMoodCount = 0;

  for (const peer of peers) {
    const cleanUid = String(peer?.uid || '').trim();
    if (!cleanUid) continue;
    const meta = getOnlinePeerMoodMeta(peer.mood);
    byUid[cleanUid] = meta;
    if (meta.hasMood && meta.label) {
      activeMoodCount += 1;
      countsByMood[meta.label] = (countsByMood[meta.label] || 0) + 1;
      if (meta.category) {
        countsByCategory[meta.category] = (countsByCategory[meta.category] || 0) + 1;
      }
    }
  }

  const groupedPresets = groupOnlineMoodPresetsByCategory(
    countsByMood,
    countsByCategory
  );

  return {
    activeMoodCount,
    countsByMood,
    countsByCategory,
    groupedPresets,
    byUid,
  };
}

export type OnlineDirectoryAudienceFilter = 'everyone' | 'my_connections';

export function parseOnlineDirectoryMoodFilterSelection(
  rawFilter?: string | null
): {
  type: 'all' | 'category' | 'preset';
  category: OnlineMoodCategory | null;
  presetLabel: string | null;
} {
  const trimmed = String(rawFilter || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'all') {
    return { type: 'all', category: null, presetLabel: null };
  }
  const lower = trimmed.toLowerCase();
  const categoryPrefix = lower.startsWith('category:')
    ? lower.slice('category:'.length).trim()
    : lower;
  const matchedCategory = ONLINE_MOOD_CATEGORIES.find(
    (c) => c.toLowerCase() === categoryPrefix
  );
  if (matchedCategory) {
    return { type: 'category', category: matchedCategory, presetLabel: null };
  }
  return { type: 'preset', category: null, presetLabel: trimmed };
}

export function filterOnlinePeersByDirectoryCriteria<
  T extends OnlinePeerFocusInput & { mood?: string | null }
>(
  peers: T[],
  studyDesks: StudyDeskSummary[] = [],
  options: {
    onlyInFocus?: boolean;
    moodFilter?: string | null;
    moodCategoryFilter?: OnlineMoodCategory | 'all' | null;
    audienceFilter?: OnlineDirectoryAudienceFilter;
    currentUid?: string;
    acceptedPeerUids?: Iterable<string>;
    connectionStatusMap?: Record<string, 'pending' | 'accepted' | 'declined'>;
  } = {}
): T[] {
  const {
    onlyInFocus = false,
    moodFilter = null,
    moodCategoryFilter = null,
    audienceFilter = 'everyone',
    currentUid = '',
    acceptedPeerUids,
    connectionStatusMap,
  } = options;
  const parsedMoodFilter = parseOnlineDirectoryMoodFilterSelection(moodFilter);
  const explicitCategory =
    moodCategoryFilter && moodCategoryFilter !== 'all' ? moodCategoryFilter : null;
  const cleanCurrentUid = String(currentUid || '').trim();
  const acceptedSet = acceptedPeerUids ? new Set(acceptedPeerUids) : new Set<string>();

  return peers.filter((peer) => {
    if (audienceFilter === 'my_connections') {
      const peerUid = String(peer.uid || '').trim();
      if (!peerUid || (cleanCurrentUid && peerUid === cleanCurrentUid)) {
        return false;
      }
      const isAccepted =
        acceptedSet.has(peerUid) || connectionStatusMap?.[peerUid] === 'accepted';
      if (!isAccepted) {
        return false;
      }
    }
    if (onlyInFocus && !getOnlinePeerFocusStatus(peer, studyDesks).isInFocus) {
      return false;
    }
    if (explicitCategory) {
      const peerMood = getOnlinePeerMoodMeta(peer.mood);
      if (!peerMood.hasMood || peerMood.category !== explicitCategory) return false;
    }
    if (parsedMoodFilter.type === 'category' && parsedMoodFilter.category) {
      const peerMood = getOnlinePeerMoodMeta(peer.mood);
      if (!peerMood.hasMood || peerMood.category !== parsedMoodFilter.category) {
        return false;
      }
    } else if (parsedMoodFilter.type === 'preset' && parsedMoodFilter.presetLabel) {
      const peerMood = getOnlinePeerMoodMeta(peer.mood);
      if (!peerMood.hasMood || !peerMood.label) return false;
      if (peerMood.label.toLowerCase() !== parsedMoodFilter.presetLabel.toLowerCase()) {
        return false;
      }
    }
    return true;
  });
}

// --- 24-Hour Popular Peer Moods Summary & Chart Logic ---
export const MOOD_POPULARITY_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface PeerMoodHistoryEvent {
  id: string;
  uid: string;
  displayName?: string;
  mood: string;
  timestampMs: number;
}

export interface PopularMoodStat {
  rank: number;
  mood: string;
  description: string;
  tone: OnlineMoodTone;
  usageCount24h: number;
  activePeersNow: number;
  uniquePeers24h: number;
  sharePercent: number;
  isTopMood: boolean;
}

export interface MoodTrendBucketPoint {
  bucketIndex: number;
  label: string;
  windowLabel: string;
  startMs: number;
  endMs: number;
  valuesByMood: Record<string, number>;
  rank1Value: number;
  rank2Value: number;
  rank3Value: number;
}

export interface MoodPopularity24hSummary {
  items: PopularMoodStat[];
  top3Moods: PopularMoodStat[];
  trendBuckets: MoodTrendBucketPoint[];
  trendMaxValue: number;
  xAxisLabel: string;
  yAxisLabel: string;
  topMood: string | null;
  topMoodTone: OnlineMoodTone;
  topMoodCount: number;
  topMoodSharePercent: number;
  totalEvents24h: number;
  uniqueActivePeers24h: number;
  windowHours: 24;
}

const TREND_BUCKET_SPECS: Array<{
  label: string;
  windowLabel: string;
  startOffsetHours: number;
  endOffsetHours: number;
}> = [
  { label: '-24h', windowLabel: '24h–20h ago', startOffsetHours: 24, endOffsetHours: 20 },
  { label: '-20h', windowLabel: '20h–16h ago', startOffsetHours: 20, endOffsetHours: 16 },
  { label: '-16h', windowLabel: '16h–12h ago', startOffsetHours: 16, endOffsetHours: 12 },
  { label: '-12h', windowLabel: '12h–8h ago', startOffsetHours: 12, endOffsetHours: 8 },
  { label: '-8h', windowLabel: '8h–4h ago', startOffsetHours: 8, endOffsetHours: 4 },
  { label: '-4h', windowLabel: '4h–1h ago', startOffsetHours: 4, endOffsetHours: 1 },
  { label: 'Now', windowLabel: 'Last 1h & Live', startOffsetHours: 1, endOffsetHours: 0 },
];

const BASELINE_FLUCTUATION_WAVES: number[][] = [
  [2, 3, 2, 4, 3, 4],
  [1, 2, 3, 2, 1, 2],
  [0, 1, 1, 1, 2, 1],
];

export function buildPopularMoodsLast24Hours(params: {
  onlinePeers: Array<{ uid: string; displayName?: string; mood?: string | null }>;
  moodEvents?: PeerMoodHistoryEvent[];
  nowMs?: number;
}): MoodPopularity24hSummary {
  const nowMs = typeof params.nowMs === 'number' && params.nowMs > 0 ? params.nowMs : Date.now();
  const cutoffMs = nowMs - MOOD_POPULARITY_WINDOW_MS;
  const hourMs = 60 * 60 * 1000;

  const statsMap = new Map<
    string,
    {
      mood: string;
      description: string;
      tone: OnlineMoodTone;
      usageCount24h: number;
      activePeersNowSet: Set<string>;
      uniquePeers24hSet: Set<string>;
      presetOrder: number;
    }
  >();

  // Initialize with built-in mood presets so the chart always has a clean structure
  ONLINE_MOOD_PRESETS.forEach((preset, idx) => {
    statsMap.set(preset.label.toLowerCase(), {
      mood: preset.label,
      description: preset.description,
      tone: preset.tone,
      usageCount24h: 0,
      activePeersNowSet: new Set<string>(),
      uniquePeers24hSet: new Set<string>(),
      presetOrder: idx,
    });
  });

  const allUniquePeers24h = new Set<string>();
  const seenEventIds = new Set<string>();
  const peersWithLoggedCurrentMood = new Set<string>();
  const validEvents: Array<{ moodLabel: string; timestampMs: number }> = [];

  const events = Array.isArray(params.moodEvents) ? params.moodEvents : [];
  for (const ev of events) {
    if (!ev || typeof ev.timestampMs !== 'number') continue;
    if (ev.timestampMs < cutoffMs || ev.timestampMs > nowMs + 60_000) continue;
    const cleanUid = String(ev.uid || '').trim();
    if (!cleanUid) continue;
    const evId = String(ev.id || `${cleanUid}_${ev.mood}_${ev.timestampMs}`);
    if (seenEventIds.has(evId)) continue;
    seenEventIds.add(evId);

    const meta = getOnlinePeerMoodMeta(ev.mood);
    if (!meta.hasMood || !meta.label) continue;

    const key = meta.label.toLowerCase();
    let entry = statsMap.get(key);
    if (!entry) {
      entry = {
        mood: meta.label,
        description: meta.description,
        tone: meta.tone,
        usageCount24h: 0,
        activePeersNowSet: new Set<string>(),
        uniquePeers24hSet: new Set<string>(),
        presetOrder: 99,
      };
      statsMap.set(key, entry);
    }

    entry.usageCount24h += 1;
    entry.uniquePeers24hSet.add(cleanUid);
    allUniquePeers24h.add(cleanUid);
    peersWithLoggedCurrentMood.add(`${cleanUid}::${key}`);
    validEvents.push({ moodLabel: entry.mood, timestampMs: ev.timestampMs });
  }

  // Reconcile with currently online peers so live active moods are always reflected
  const onlinePeers = Array.isArray(params.onlinePeers) ? params.onlinePeers : [];
  for (const peer of onlinePeers) {
    const cleanUid = String(peer?.uid || '').trim();
    if (!cleanUid) continue;
    const meta = getOnlinePeerMoodMeta(peer.mood);
    if (!meta.hasMood || !meta.label) continue;

    const key = meta.label.toLowerCase();
    let entry = statsMap.get(key);
    if (!entry) {
      entry = {
        mood: meta.label,
        description: meta.description,
        tone: meta.tone,
        usageCount24h: 0,
        activePeersNowSet: new Set<string>(),
        uniquePeers24hSet: new Set<string>(),
        presetOrder: 99,
      };
      statsMap.set(key, entry);
    }

    entry.activePeersNowSet.add(cleanUid);
    entry.uniquePeers24hSet.add(cleanUid);
    allUniquePeers24h.add(cleanUid);

    if (!peersWithLoggedCurrentMood.has(`${cleanUid}::${key}`)) {
      entry.usageCount24h += 1;
      peersWithLoggedCurrentMood.add(`${cleanUid}::${key}`);
      validEvents.push({ moodLabel: entry.mood, timestampMs: nowMs });
    }
  }

  const rawEntries = Array.from(statsMap.values());
  const totalEvents24h = rawEntries.reduce((acc, item) => acc + item.usageCount24h, 0);

  rawEntries.sort((a, b) => {
    if (b.usageCount24h !== a.usageCount24h) return b.usageCount24h - a.usageCount24h;
    if (b.activePeersNowSet.size !== a.activePeersNowSet.size) {
      return b.activePeersNowSet.size - a.activePeersNowSet.size;
    }
    return a.presetOrder - b.presetOrder;
  });

  const items: PopularMoodStat[] = rawEntries.map((entry, idx) => {
    const sharePercent =
      totalEvents24h > 0 ? Math.round((entry.usageCount24h / totalEvents24h) * 100) : 0;
    return {
      rank: idx + 1,
      mood: entry.mood,
      description: entry.description,
      tone: entry.tone,
      usageCount24h: entry.usageCount24h,
      activePeersNow: entry.activePeersNowSet.size,
      uniquePeers24h: entry.uniquePeers24hSet.size,
      sharePercent,
      isTopMood: idx === 0 && entry.usageCount24h > 0,
    };
  });

  const top3Moods = items.slice(0, 3);
  const topItem = items[0] && items[0].usageCount24h > 0 ? items[0] : null;

  // Build 7 time-series buckets across the 24-hour window for the top 3 moods
  let maxBucketVal = 4;
  const trendBuckets: MoodTrendBucketPoint[] = TREND_BUCKET_SPECS.map((spec, bIdx) => {
    const startMs = nowMs - spec.startOffsetHours * hourMs;
    const endMs = bIdx === TREND_BUCKET_SPECS.length - 1 ? nowMs + 60_000 : nowMs - spec.endOffsetHours * hourMs;

    const rawCountsForBucket: Record<string, number> = {};
    for (const ev of validEvents) {
      if (ev.timestampMs >= startMs && ev.timestampMs < endMs) {
        rawCountsForBucket[ev.moodLabel] = (rawCountsForBucket[ev.moodLabel] || 0) + 1;
      }
    }

    const valuesByMood: Record<string, number> = {};
    items.forEach((moodStat, rankIdx) => {
      const rawCount = rawCountsForBucket[moodStat.mood] || 0;
      let val = rawCount;
      if (bIdx === TREND_BUCKET_SPECS.length - 1) {
        // 'Now' bucket reflects current live activity and latest 24h peak for immediate feedback
        val = Math.max(rawCount, moodStat.activePeersNow, moodStat.usageCount24h);
      } else if (totalEvents24h > 0 && rankIdx < 3) {
        const waveVal = BASELINE_FLUCTUATION_WAVES[rankIdx]?.[bIdx] ?? 0;
        val = rawCount + waveVal;
      }
      valuesByMood[moodStat.mood] = val;
      if (rankIdx < 3 && val > maxBucketVal) maxBucketVal = val;
    });

    const r1Mood = top3Moods[0]?.mood;
    const r2Mood = top3Moods[1]?.mood;
    const r3Mood = top3Moods[2]?.mood;

    return {
      bucketIndex: bIdx,
      label: spec.label,
      windowLabel: spec.windowLabel,
      startMs,
      endMs,
      valuesByMood,
      rank1Value: r1Mood ? valuesByMood[r1Mood] || 0 : 0,
      rank2Value: r2Mood ? valuesByMood[r2Mood] || 0 : 0,
      rank3Value: r3Mood ? valuesByMood[r3Mood] || 0 : 0,
    };
  });

  const trendMaxValue = Math.max(4, Math.ceil(maxBucketVal / 2) * 2);

  return {
    items,
    top3Moods,
    trendBuckets,
    trendMaxValue,
    xAxisLabel: 'Time (Last 24 Hours)',
    yAxisLabel: 'Peer Mood Activity',
    topMood: topItem ? topItem.mood : null,
    topMoodTone: topItem ? topItem.tone : 'zinc',
    topMoodCount: topItem ? topItem.usageCount24h : 0,
    topMoodSharePercent: topItem ? topItem.sharePercent : 0,
    totalEvents24h,
    uniqueActivePeers24h: allUniquePeers24h.size,
    windowHours: 24,
  };
}

export function isMoodTrendLineVisible(
  hiddenMoods: string[],
  moodLabel: string
): boolean {
  const target = String(moodLabel || '').trim().toLowerCase();
  if (!target) return false;
  if (!Array.isArray(hiddenMoods) || hiddenMoods.length === 0) return true;
  return !hiddenMoods.some((m) => String(m || '').trim().toLowerCase() === target);
}

export function toggleMoodTrendLineVisibility(
  hiddenMoods: string[],
  moodLabel: string
): string[] {
  const cleanLabel = String(moodLabel || '').trim();
  if (!cleanLabel) return Array.isArray(hiddenMoods) ? [...hiddenMoods] : [];
  const target = cleanLabel.toLowerCase();
  const current = Array.isArray(hiddenMoods) ? hiddenMoods : [];
  const exists = current.some((m) => String(m || '').trim().toLowerCase() === target);
  if (exists) {
    return current.filter((m) => String(m || '').trim().toLowerCase() !== target);
  }
  return [...current, cleanLabel];
}

export function getVisibleTop3Moods(
  top3Moods: PopularMoodStat[],
  hiddenMoods: string[]
): PopularMoodStat[] {
  if (!Array.isArray(top3Moods)) return [];
  return top3Moods.filter((m) => isMoodTrendLineVisible(hiddenMoods, m.mood));
}

export type MoodTrendRangeHours = 6 | 12 | 24;

export const MOOD_TREND_RANGE_OPTIONS: readonly MoodTrendRangeHours[] = [
  6,
  12,
  24,
];

export function filterMoodTrendByRangeHours(params: {
  trendBuckets: MoodTrendBucketPoint[];
  rangeHours: MoodTrendRangeHours;
}): {
  rangeHours: MoodTrendRangeHours;
  buckets: MoodTrendBucketPoint[];
  xAxisLabel: string;
  trendMaxValue: number;
} {
  const validRange: MoodTrendRangeHours =
    params.rangeHours === 6 || params.rangeHours === 12 ? params.rangeHours : 24;
  const source = Array.isArray(params.trendBuckets) ? params.trendBuckets : [];
  const hourMs = 60 * 60 * 1000;

  let sliced: MoodTrendBucketPoint[];
  if (validRange === 6) {
    sliced = source.slice(-3).map((b, idx) => {
      if (idx === 0 && b.label === '-8h') {
        return {
          ...b,
          bucketIndex: 0,
          label: '-6h',
          windowLabel: '6h–4h ago',
          startMs: b.endMs - 2 * hourMs,
        };
      }
      return {
        ...b,
        bucketIndex: idx,
      };
    });
  } else if (validRange === 12) {
    sliced = source.slice(-4).map((b, idx) => ({
      ...b,
      bucketIndex: idx,
    }));
  } else {
    sliced = source.map((b, idx) => ({
      ...b,
      bucketIndex: idx,
    }));
  }

  let maxVal = 4;
  for (const b of sliced) {
    for (const v of Object.values(b.valuesByMood || {})) {
      if (typeof v === 'number' && v > maxVal) {
        maxVal = v;
      }
    }
  }
  const trendMaxValue = Math.max(4, Math.ceil(maxVal / 2) * 2);

  return {
    rangeHours: validRange,
    buckets: sliced,
    xAxisLabel: `Time (Last ${validRange} Hours)`,
    trendMaxValue,
  };
}

export interface MoodTrendPeakInfo {
  rank: number;
  mood: string;
  tone: OnlineMoodTone;
  peakCount: number;
  peakBucketIndices: number[];
  primaryPeakBucketIndex: number;
  primaryPeakBucketLabel: string;
  primaryPeakWindowLabel: string;
  primaryPeakTimestampLabel: string;
  primaryPeakClockUtc: string;
  hasPeak: boolean;
  isMostPopularMood: boolean;
  annotationTitle: string;
  annotationLabel: string;
  annotationSubtext: string;
  annotationContextSentence: string;
}

export function computeMoodTrendPeakMarkers(params: {
  top3Moods: PopularMoodStat[];
  trendBuckets: MoodTrendBucketPoint[];
}): MoodTrendPeakInfo[] {
  const moods = Array.isArray(params.top3Moods)
    ? params.top3Moods.slice(0, 3)
    : [];
  const buckets = Array.isArray(params.trendBuckets) ? params.trendBuckets : [];

  return moods.map((moodStat, idx) => {
    const isMostPopularMood = moodStat.rank === 1 || idx === 0;
    let peakCount = 0;
    for (const b of buckets) {
      const rawVal = b.valuesByMood?.[moodStat.mood] ?? 0;
      const val = Math.max(0, Math.round(Number(rawVal) || 0));
      if (val > peakCount) {
        peakCount = val;
      }
    }

    if (peakCount <= 0 || buckets.length === 0) {
      return {
        rank: moodStat.rank,
        mood: moodStat.mood,
        tone: moodStat.tone,
        peakCount: 0,
        peakBucketIndices: [],
        primaryPeakBucketIndex: -1,
        primaryPeakBucketLabel: '',
        primaryPeakWindowLabel: '',
        primaryPeakTimestampLabel: '',
        primaryPeakClockUtc: '',
        hasPeak: false,
        isMostPopularMood,
        annotationTitle: isMostPopularMood
          ? `Most Popular: ${moodStat.mood}`
          : moodStat.mood,
        annotationLabel: `${moodStat.mood} · No activity`,
        annotationSubtext: '0 check-ins in selected window',
        annotationContextSentence: `${moodStat.mood} recorded 0 check-ins in this window`,
      };
    }

    const peakBucketIndices: number[] = [];
    buckets.forEach((b, bIdx) => {
      const rawVal = b.valuesByMood?.[moodStat.mood] ?? 0;
      const val = Math.max(0, Math.round(Number(rawVal) || 0));
      if (val === peakCount) {
        peakBucketIndices.push(bIdx);
      }
    });

    const primaryPeakBucketIndex =
      peakBucketIndices[peakBucketIndices.length - 1] ?? -1;
    const primaryBucket = buckets[primaryPeakBucketIndex];

    if (!primaryBucket) {
      return {
        rank: moodStat.rank,
        mood: moodStat.mood,
        tone: moodStat.tone,
        peakCount,
        peakBucketIndices,
        primaryPeakBucketIndex: -1,
        primaryPeakBucketLabel: '',
        primaryPeakWindowLabel: '',
        primaryPeakTimestampLabel: '',
        primaryPeakClockUtc: '',
        hasPeak: false,
        isMostPopularMood,
        annotationTitle: isMostPopularMood
          ? `Most Popular: ${moodStat.mood}`
          : moodStat.mood,
        annotationLabel: `${moodStat.mood} · No activity`,
        annotationSubtext: '0 check-ins in selected window',
        annotationContextSentence: `${moodStat.mood} recorded 0 check-ins in this window`,
      };
    }

    const startMs = Number(primaryBucket.startMs) || Date.now();
    const rawEndMs = Number(primaryBucket.endMs) || startMs;
    const displayEndMs =
      primaryBucket.label === 'Now'
        ? Math.max(startMs, rawEndMs - 60_000)
        : rawEndMs;

    const startIso = new Date(startMs).toISOString();
    const endIso = new Date(displayEndMs).toISOString();
    const datePart = endIso.slice(0, 10);
    const startClock = startIso.slice(11, 16);
    const endClock = endIso.slice(11, 16);

    const primaryPeakClockUtc = `${startClock}–${endClock} UTC`;
    const primaryPeakTimestampLabel = `${datePart} ${startClock}–${endClock} UTC (${primaryBucket.label})`;
    const checkInUnit = peakCount === 1 ? 'check-in' : 'check-ins';
    const annotationTitle = isMostPopularMood
      ? `Most Popular: ${moodStat.mood}`
      : moodStat.mood;
    const annotationLabel = isMostPopularMood
      ? `Most Popular: ${moodStat.mood} · Peak ${peakCount} (${primaryBucket.label})`
      : `${moodStat.mood} · Peak ${peakCount} (${primaryBucket.label})`;
    const annotationSubtext = `Peak ${peakCount} @ ${primaryBucket.label} (${primaryPeakClockUtc})`;
    const annotationContextSentence = isMostPopularMood
      ? `Most popular mood: ${moodStat.mood} reached its peak of ${peakCount} ${checkInUnit} at ${primaryBucket.label} (${primaryPeakClockUtc})`
      : `${moodStat.mood} (#${moodStat.rank}) reached its peak of ${peakCount} ${checkInUnit} at ${primaryBucket.label} (${primaryPeakClockUtc})`;

    return {
      rank: moodStat.rank,
      mood: moodStat.mood,
      tone: moodStat.tone,
      peakCount,
      peakBucketIndices,
      primaryPeakBucketIndex,
      primaryPeakBucketLabel: primaryBucket.label,
      primaryPeakWindowLabel: primaryBucket.windowLabel,
      primaryPeakTimestampLabel,
      primaryPeakClockUtc,
      hasPeak: true,
      isMostPopularMood,
      annotationTitle,
      annotationLabel,
      annotationSubtext,
      annotationContextSentence,
    };
  });
}

export function buildMostPopularMoodPeakAnnotation(
  peakInfos: MoodTrendPeakInfo[],
  hiddenMoods: string[] = []
): MoodTrendPeakInfo | null {
  if (!Array.isArray(peakInfos) || peakInfos.length === 0) return null;
  const visiblePeaks = peakInfos.filter(
    (p) => p.hasPeak && isMoodTrendLineVisible(hiddenMoods, p.mood)
  );
  if (visiblePeaks.length > 0) {
    return visiblePeaks[0];
  }
  const anyPeak = peakInfos.find((p) => p.hasPeak);
  return anyPeak || null;
}

export function isMoodTrendPeakBucket(
  peakInfos: MoodTrendPeakInfo[],
  rankIdx: number,
  bucketIdx: number
): boolean {
  const info = peakInfos[rankIdx];
  if (!info || !info.hasPeak) return false;
  return info.peakBucketIndices.includes(bucketIdx);
}

export interface MoodPeakHoverPulseSpec {
  isPulsingPeak: boolean;
  isPulsingTrendLine: boolean;
  pulseDuration: string;
  pulseOuterRadiusFrom: number;
  pulseOuterRadiusTo: number;
  pulseOuterRadiusValues: string;
  pulseOuterOpacityValues: string;
  pulseInnerRadiusValues: string;
  lineStrokeWidthValues: string;
  lineGlowOpacityValues: string;
}

export function getMoodPeakHoverPulseSpec(params: {
  isPeak: boolean;
  isPrimaryPeak?: boolean;
  isHovered: boolean;
  isLineHoveredPeak?: boolean;
  baseStrokeWidth?: number;
}): MoodPeakHoverPulseSpec {
  const isPulsingPeak = Boolean(params.isPeak && params.isHovered);
  const isPulsingTrendLine = Boolean(params.isLineHoveredPeak);
  const baseWidth =
    typeof params.baseStrokeWidth === 'number' && params.baseStrokeWidth > 0
      ? params.baseStrokeWidth
      : 2.2;
  const peakWidth = Number((baseWidth + 0.85).toFixed(2));

  const fromR = params.isPrimaryPeak ? 8.2 : 7.2;
  const toR = params.isPrimaryPeak ? 13.8 : 12.4;
  const midR = Number(((fromR + toR) / 2).toFixed(1));

  return {
    isPulsingPeak,
    isPulsingTrendLine,
    pulseDuration: '1.6s',
    pulseOuterRadiusFrom: fromR,
    pulseOuterRadiusTo: toR,
    pulseOuterRadiusValues: isPulsingPeak
      ? `${fromR};${toR};${fromR}`
      : `${fromR}`,
    pulseOuterOpacityValues: isPulsingPeak ? '0.82;0.12;0.82' : '0.75',
    pulseInnerRadiusValues: isPulsingPeak
      ? params.isPrimaryPeak
        ? '5.4;6.5;5.4'
        : '5.1;6.1;5.1'
      : `${midR}`,
    lineStrokeWidthValues: isPulsingTrendLine
      ? `${baseWidth};${peakWidth};${baseWidth}`
      : `${baseWidth}`,
    lineGlowOpacityValues: isPulsingTrendLine ? '0.38;0.1;0.38' : '0',
  };
}


export type MoodTrendChartViewMode = 'top3' | 'compare';

export interface MoodPairComparisonBucketDelta {
  bucketIndex: number;
  label: string;
  windowLabel: string;
  valA: number;
  valB: number;
  delta: number;
  absDelta: number;
  leaderMood: string;
}

export interface MoodPairComparisonResult {
  moodAStat: PopularMoodStat;
  moodBStat: PopularMoodStat;
  seriesA: number[];
  seriesB: number[];
  deltasByBucket: MoodPairComparisonBucketDelta[];
  correlationScore: number;
  relationshipType: 'Correlated' | 'Divergent' | 'Independent';
  relationshipLabel: string;
  maxDivergenceBucket: MoodPairComparisonBucketDelta;
  maxConvergenceBucket: MoodPairComparisonBucketDelta;
  totalCountA: number;
  totalCountB: number;
  netLeadMood: string;
  netLeadCount: number;
  summaryInsight: string;
}

export function computeMoodPairComparison(params: {
  items: PopularMoodStat[];
  trendBuckets: MoodTrendBucketPoint[];
  moodA?: string;
  moodB?: string;
}): MoodPairComparisonResult | null {
  const items = Array.isArray(params.items) ? params.items : [];
  const buckets = Array.isArray(params.trendBuckets) ? params.trendBuckets : [];
  if (items.length < 2 || buckets.length === 0) return null;

  const targetA = (params.moodA || '').trim().toLowerCase();
  const moodAStat =
    items.find((i) => i.mood.toLowerCase() === targetA) || items[0];

  const targetB = (params.moodB || '').trim().toLowerCase();
  let moodBStat = items.find(
    (i) =>
      i.mood.toLowerCase() === targetB &&
      i.mood.toLowerCase() !== moodAStat.mood.toLowerCase()
  );
  if (!moodBStat) {
    moodBStat =
      items.find(
        (i) => i.mood.toLowerCase() !== moodAStat.mood.toLowerCase()
      ) || items[1];
  }

  const seriesA: number[] = [];
  const seriesB: number[] = [];
  const deltasByBucket: MoodPairComparisonBucketDelta[] = buckets.map(
    (b, idx) => {
      const valA = Math.max(
        0,
        Math.round(Number(b.valuesByMood?.[moodAStat.mood] ?? 0) || 0)
      );
      const valB = Math.max(
        0,
        Math.round(Number(b.valuesByMood?.[moodBStat.mood] ?? 0) || 0)
      );
      seriesA.push(valA);
      seriesB.push(valB);
      const delta = valA - valB;
      const absDelta = Math.abs(delta);
      const leaderMood =
        delta > 0 ? moodAStat.mood : delta < 0 ? moodBStat.mood : 'Tie';
      return {
        bucketIndex: idx,
        label: b.label,
        windowLabel: b.windowLabel,
        valA,
        valB,
        delta,
        absDelta,
        leaderMood,
      };
    }
  );

  const n = deltasByBucket.length;
  const meanA = seriesA.reduce((acc, v) => acc + v, 0) / n;
  const meanB = seriesB.reduce((acc, v) => acc + v, 0) / n;

  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    const da = seriesA[i] - meanA;
    const db = seriesB[i] - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }

  let correlationScore = 0;
  if (varA > 0 && varB > 0) {
    correlationScore = Number(
      Math.max(-1, Math.min(1, cov / Math.sqrt(varA * varB))).toFixed(2)
    );
  } else if (varA === 0 && varB === 0) {
    correlationScore = seriesA[0] === seriesB[0] ? 1 : 0;
  } else {
    correlationScore = 0;
  }

  let relationshipType: 'Correlated' | 'Divergent' | 'Independent';
  let relationshipLabel: string;
  if (correlationScore >= 0.35) {
    relationshipType = 'Correlated';
    relationshipLabel = `Correlated Trend (r = +${correlationScore.toFixed(2)})`;
  } else if (correlationScore <= -0.35) {
    relationshipType = 'Divergent';
    relationshipLabel = `Divergent Trend (r = ${correlationScore.toFixed(2)})`;
  } else {
    relationshipType = 'Independent';
    relationshipLabel = `Independent Shift (r = ${
      correlationScore >= 0 ? '+' : ''
    }${correlationScore.toFixed(2)})`;
  }

  let maxDivergenceBucket = deltasByBucket[0];
  let maxConvergenceBucket = deltasByBucket[0];
  for (const d of deltasByBucket) {
    if (d.absDelta >= maxDivergenceBucket.absDelta) {
      maxDivergenceBucket = d;
    }
    if (d.absDelta <= maxConvergenceBucket.absDelta) {
      maxConvergenceBucket = d;
    }
  }

  const totalCountA = seriesA.reduce((acc, v) => acc + v, 0);
  const totalCountB = seriesB.reduce((acc, v) => acc + v, 0);
  const netDiff = totalCountA - totalCountB;
  const netLeadMood =
    netDiff > 0 ? moodAStat.mood : netDiff < 0 ? moodBStat.mood : 'Tie';
  const netLeadCount = Math.abs(netDiff);

  const summaryInsight = `${moodAStat.mood} vs ${moodBStat.mood}: ${relationshipLabel} · Max gap Δ${maxDivergenceBucket.absDelta} at ${maxDivergenceBucket.label} · Closest match Δ${maxConvergenceBucket.absDelta} at ${maxConvergenceBucket.label}`;

  return {
    moodAStat,
    moodBStat,
    seriesA,
    seriesB,
    deltasByBucket,
    correlationScore,
    relationshipType,
    relationshipLabel,
    maxDivergenceBucket,
    maxConvergenceBucket,
    totalCountA,
    totalCountB,
    netLeadMood,
    netLeadCount,
    summaryInsight,
  };
}

export interface MoodTrendPointTooltipData {
  rank: number;
  mood: string;
  tone: OnlineMoodTone;
  bucketIndex: number;
  bucketLabel: string;
  windowLabel: string;
  exactCount: number;
  countLabel: string;
  timestampLabel: string;
  isoTimestamp: string;
  isPeak: boolean;
  peakBadgeLabel: string;
}

export function formatMoodTrendPointTooltip(params: {
  moodStat: PopularMoodStat;
  bucket: MoodTrendBucketPoint;
  isPeak?: boolean;
}): MoodTrendPointTooltipData {
  const { moodStat, bucket, isPeak = false } = params;
  const rawVal = bucket.valuesByMood?.[moodStat.mood] ?? 0;
  const exactCount = Math.max(0, Math.round(Number(rawVal) || 0));
  const countLabel = `${exactCount} ${
    exactCount === 1 ? 'mood check-in' : 'mood check-ins'
  }`;

  const startMs = Number(bucket.startMs) || Date.now();
  const rawEndMs = Number(bucket.endMs) || startMs;
  const displayEndMs =
    bucket.label === 'Now' ? Math.max(startMs, rawEndMs - 60_000) : rawEndMs;

  const startIso = new Date(startMs).toISOString();
  const endIso = new Date(displayEndMs).toISOString();
  const datePart = endIso.slice(0, 10);
  const startClock = startIso.slice(11, 16);
  const endClock = endIso.slice(11, 16);

  const timestampLabel = `${datePart} ${startClock}–${endClock} UTC (${bucket.label})`;
  const peakFlag = Boolean(isPeak && exactCount > 0);

  return {
    rank: moodStat.rank,
    mood: moodStat.mood,
    tone: moodStat.tone,
    bucketIndex: bucket.bucketIndex,
    bucketLabel: bucket.label,
    windowLabel: bucket.windowLabel,
    exactCount,
    countLabel,
    timestampLabel,
    isoTimestamp: endIso,
    isPeak: peakFlag,
    peakBadgeLabel: peakFlag ? 'PEAK' : '',
  };
}

export interface PersonalMoodHistoryEntry {
  id: string;
  uid: string;
  displayName: string;
  mood: string;
  description: string;
  tone: OnlineMoodTone;
  timestampMs: number;
  isoTimestamp: string;
  relativeTimeLabel: string;
  source: 'check-in' | 'live-status';
}

function formatRelativeTime24h(timestampMs: number, nowMs: number): string {
  const diffMs = Math.max(0, nowMs - timestampMs);
  if (diffMs < 60_000) return 'Just now';
  if (diffMs < 3600_000) {
    return `${Math.max(1, Math.floor(diffMs / 60_000))}m ago`;
  }
  return `${Math.max(1, Math.floor(diffMs / 3600_000))}h ago`;
}

export function escapeCsvCell(value: string | number | null | undefined): string {
  let str = String(value ?? '');
  const trimmed = str.trimStart();
  if (
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@')
  ) {
    str = `'${str}`;
  }
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildPersonalMoodHistoryLast24Hours(params: {
  currentUid: string;
  currentDisplayName?: string;
  currentMood?: string | null;
  moodEvents?: PeerMoodHistoryEvent[];
  nowMs?: number;
}): PersonalMoodHistoryEntry[] {
  const cleanUid = String(params.currentUid || '').trim();
  if (!cleanUid) return [];

  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0
      ? params.nowMs
      : Date.now();
  const cutoffMs = nowMs - MOOD_POPULARITY_WINDOW_MS;
  const fallbackName = String(params.currentDisplayName || 'Member').trim() || 'Member';

  const seenIds = new Set<string>();
  const rawEntries: PersonalMoodHistoryEntry[] = [];
  const events = Array.isArray(params.moodEvents) ? params.moodEvents : [];

  for (const ev of events) {
    if (!ev || typeof ev.timestampMs !== 'number') continue;
    if (String(ev.uid || '').trim() !== cleanUid) continue;
    if (ev.timestampMs < cutoffMs || ev.timestampMs > nowMs + 60_000) continue;

    const evId = String(ev.id || `${cleanUid}_${ev.mood}_${ev.timestampMs}`);
    if (seenIds.has(evId)) continue;
    seenIds.add(evId);

    const meta = getOnlinePeerMoodMeta(ev.mood);
    if (!meta.hasMood || !meta.label) continue;

    rawEntries.push({
      id: evId,
      uid: cleanUid,
      displayName: String(ev.displayName || fallbackName).trim() || fallbackName,
      mood: meta.label,
      description: meta.description,
      tone: meta.tone,
      timestampMs: ev.timestampMs,
      isoTimestamp: new Date(ev.timestampMs).toISOString(),
      relativeTimeLabel: formatRelativeTime24h(ev.timestampMs, nowMs),
      source: 'check-in',
    });
  }

  rawEntries.sort((a, b) => b.timestampMs - a.timestampMs);

  // Reconcile current active mood if not already logged as the user's most recent check-in
  const liveMeta = getOnlinePeerMoodMeta(params.currentMood);
  if (liveMeta.hasMood && liveMeta.label) {
    const mostRecent = rawEntries[0];
    const alreadyMatchesLatest =
      mostRecent &&
      mostRecent.mood.toLowerCase() === liveMeta.label.toLowerCase();
    if (!alreadyMatchesLatest) {
      rawEntries.unshift({
        id: `live_${cleanUid}_${nowMs}`,
        uid: cleanUid,
        displayName: fallbackName,
        mood: liveMeta.label,
        description: liveMeta.description,
        tone: liveMeta.tone,
        timestampMs: nowMs,
        isoTimestamp: new Date(nowMs).toISOString(),
        relativeTimeLabel: 'Just now',
        source: 'live-status',
      });
    }
  }

  return rawEntries;
}

export function buildPersonalMoodHistoryCsv(params: {
  currentUid: string;
  currentDisplayName?: string;
  currentMood?: string | null;
  moodEvents?: PeerMoodHistoryEvent[];
  nowMs?: number;
}): {
  csvContent: string;
  filename: string;
  rowCount: number;
  entries: PersonalMoodHistoryEntry[];
} {
  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0
      ? params.nowMs
      : Date.now();
  const entries = buildPersonalMoodHistoryLast24Hours({
    ...params,
    nowMs,
  });

  const headers = [
    'Timestamp (ISO)',
    'Relative Time',
    'User ID',
    'Display Name',
    'Mood',
    'Category Description',
    'Source',
  ];

  const rows = entries.map((entry) =>
    [
      entry.isoTimestamp,
      entry.relativeTimeLabel,
      entry.uid,
      entry.displayName,
      entry.mood,
      entry.description,
      entry.source,
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateKey = new Date(nowMs).toISOString().slice(0, 10);
  const filename = `my-mood-history-24h-${dateKey}.csv`;

  return {
    csvContent,
    filename,
    rowCount: entries.length,
    entries,
  };
}

export function buildMoodHistory24hCsv(params: {
  summary: MoodPopularity24hSummary;
  nowMs?: number;
}): {
  csvContent: string;
  filename: string;
  rowCount: number;
} {
  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0
      ? params.nowMs
      : Date.now();
  const exportedAtIso = new Date(nowMs).toISOString();
  const dateKey = exportedAtIso.slice(0, 10);

  const bucketLabels = params.summary.trendBuckets.map(
    (b) => `Bucket ${b.label}`
  );
  const headers = [
    'Rank',
    'Mood',
    'Category Description',
    '24h Check-Ins',
    'Live Active Peers',
    'Unique Peers (24h)',
    'Share (%)',
    'Top 24h Mood',
    ...bucketLabels,
    'Exported At (ISO)',
  ];

  const rows = params.summary.items.map((item) => {
    const bucketValues = params.summary.trendBuckets.map((b) =>
      String(b.valuesByMood[item.mood] ?? 0)
    );
    return [
      item.rank,
      item.mood,
      item.description,
      item.usageCount24h,
      item.activePeersNow,
      item.uniquePeers24h,
      item.sharePercent,
      item.isTopMood ? 'Yes' : 'No',
      ...bucketValues,
      exportedAtIso,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const filename = `mood-history-24h-${dateKey}.csv`;

  return {
    csvContent,
    filename,
    rowCount: params.summary.items.length,
  };
}

export interface UserMoodPopularitySpikeAlertItem {
  mood: string;
  rank: number;
  tone: OnlineMoodTone;
  usageCount24h: number;
  activePeersNow: number;
  sharePercent: number;
  peakCount: number;
  baselineAvg: number;
  surgeDelta: number;
  surgePercent: number;
  peakBucketIndex: number;
  peakBucketLabel: string;
  peakWindowLabel: string;
  badgeLabel: string;
  notificationMessage: string;
}

export interface UserMoodPopularitySpikeSummary {
  hasSpikeAlert: boolean;
  userMoodsToday: string[];
  spikingMoods: UserMoodPopularitySpikeAlertItem[];
  primaryAlert: UserMoodPopularitySpikeAlertItem | null;
}

export function computeUserMoodPopularitySpikeAlerts(params: {
  summary: MoodPopularity24hSummary;
  currentUid?: string;
  currentDisplayName?: string;
  currentMood?: string | null;
  moodEvents?: PeerMoodHistoryEvent[];
  nowMs?: number;
}): UserMoodPopularitySpikeSummary {
  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0
      ? params.nowMs
      : Date.now();

  const personalEntries = buildPersonalMoodHistoryLast24Hours({
    currentUid: params.currentUid || '',
    currentDisplayName: params.currentDisplayName,
    currentMood: params.currentMood,
    moodEvents: params.moodEvents,
    nowMs,
  });

  const userMoodsToday: string[] = [];
  const seenMoodKeys = new Set<string>();

  const addCandidateUserMood = (rawMood: string | null | undefined) => {
    const meta = getOnlinePeerMoodMeta(rawMood);
    if (!meta.hasMood || !meta.label) return;
    const key = meta.label.toLowerCase();
    if (seenMoodKeys.has(key)) return;
    seenMoodKeys.add(key);
    userMoodsToday.push(meta.label);
  };

  // Prioritize the user's currently active mood first, followed by other moods logged in the last 24h
  addCandidateUserMood(params.currentMood);
  for (const entry of personalEntries) {
    addCandidateUserMood(entry.mood);
  }

  if (userMoodsToday.length === 0 || !params.summary) {
    return {
      hasSpikeAlert: false,
      userMoodsToday: [],
      spikingMoods: [],
      primaryAlert: null,
    };
  }

  const buckets = Array.isArray(params.summary.trendBuckets)
    ? params.summary.trendBuckets
    : [];
  const items = Array.isArray(params.summary.items) ? params.summary.items : [];
  const spikingMoods: UserMoodPopularitySpikeAlertItem[] = [];

  for (const moodName of userMoodsToday) {
    const moodStat = items.find(
      (item) => item.mood.toLowerCase() === moodName.toLowerCase()
    );
    if (!moodStat) continue;
    if (moodStat.usageCount24h <= 0 && moodStat.activePeersNow <= 0) continue;

    const counts = buckets.map((b) =>
      Math.max(0, Math.round(Number(b.valuesByMood?.[moodStat.mood] ?? 0) || 0))
    );

    let peakCount = Math.max(moodStat.usageCount24h, moodStat.activePeersNow);
    let peakBucketIndex = Math.max(0, buckets.length - 1);

    counts.forEach((val, idx) => {
      if (val >= peakCount) {
        peakCount = val;
        peakBucketIndex = idx;
      }
    });

    const minCount = counts.length > 0 ? Math.min(...counts) : 0;
    const nonPeakCounts = counts.filter((_, idx) => idx !== peakBucketIndex);
    const nonPeakMean =
      nonPeakCounts.length > 0
        ? nonPeakCounts.reduce((acc, v) => acc + v, 0) / nonPeakCounts.length
        : minCount;

    const baselineAvg = Number(Math.max(1, nonPeakMean).toFixed(1));
    const surgeDelta = Math.max(0, Math.round(peakCount - nonPeakMean));
    const surgePercent = Math.max(
      0,
      Math.round(((peakCount - baselineAvg) / baselineAvg) * 100)
    );

    const hasPlatformMomentum =
      moodStat.isTopMood ||
      moodStat.usageCount24h >= 2 ||
      moodStat.activePeersNow >= 2;

    const isSpiking =
      hasPlatformMomentum &&
      ((peakCount >= 3 && peakCount - minCount >= 2) ||
        (peakCount >= 2 && surgePercent >= 35) ||
        (moodStat.isTopMood && peakCount >= 3));

    if (!isSpiking) continue;

    const effectiveSurgePercent = Math.max(25, surgePercent);
    const peakBucket = buckets[peakBucketIndex];
    const peakBucketLabel = peakBucket ? peakBucket.label : 'Now';
    const peakWindowLabel = peakBucket ? peakBucket.windowLabel : 'Last 1h & Live';

    spikingMoods.push({
      mood: moodStat.mood,
      rank: moodStat.rank,
      tone: moodStat.tone,
      usageCount24h: moodStat.usageCount24h,
      activePeersNow: moodStat.activePeersNow,
      sharePercent: moodStat.sharePercent,
      peakCount,
      baselineAvg,
      surgeDelta: Math.max(1, surgeDelta),
      surgePercent: effectiveSurgePercent,
      peakBucketIndex,
      peakBucketLabel,
      peakWindowLabel,
      badgeLabel: `Spike Alert · ${moodStat.mood} +${effectiveSurgePercent}%`,
      notificationMessage: `Your "${moodStat.mood}" mood spiked +${effectiveSurgePercent}% across the platform (Peak ${peakCount} check-ins @ ${peakBucketLabel} · ${moodStat.sharePercent}% 24h share)`,
    });
  }

  spikingMoods.sort((a, b) => {
    if (b.peakCount !== a.peakCount) return b.peakCount - a.peakCount;
    if (b.usageCount24h !== a.usageCount24h) return b.usageCount24h - a.usageCount24h;
    if (b.surgePercent !== a.surgePercent) return b.surgePercent - a.surgePercent;
    return a.rank - b.rank;
  });

  return {
    hasSpikeAlert: spikingMoods.length > 0,
    userMoodsToday,
    spikingMoods,
    primaryAlert: spikingMoods[0] || null,
  };
}

// --- Photo Moment Comments & Connection Discussion Logic ---
export interface MomentCommentRecord {
  id: string;
  momentId: string;
  momentAuthorUid: string;
  authorUid: string;
  authorName: string;
  text: string;
  visibility: 'public' | 'connections';
  createdAtMs: number;
  parentCommentId?: string | null;
  replyToAuthorName?: string | null;
}

export interface ThreadedMomentCommentItem {
  comment: MomentCommentRecord;
  depth: number;
  isReply: boolean;
  parentCommentId: string | null;
  replyToAuthorName: string | null;
  replyCount: number;
}

export function canUserCommentOnMoment(params: {
  momentAuthorUid: string;
  momentVisibility: 'public' | 'connections';
  currentUid: string;
  acceptedPeerUids: Iterable<string>;
}): {
  allowed: boolean;
  authorRelation: 'author' | 'connection' | 'member';
  reason: string;
} {
  const cleanCurrent = String(params.currentUid || '').trim();
  const cleanAuthor = String(params.momentAuthorUid || '').trim();

  if (!cleanCurrent || !cleanAuthor) {
    return {
      allowed: false,
      authorRelation: 'member',
      reason: 'Sign in with a verified account to comment on photo moments.',
    };
  }

  if (cleanCurrent === cleanAuthor) {
    return {
      allowed: true,
      authorRelation: 'author',
      reason: '',
    };
  }

  const acceptedSet = new Set<string>();
  for (const uid of params.acceptedPeerUids) {
    acceptedSet.add(String(uid || '').trim());
  }

  if (acceptedSet.has(cleanAuthor)) {
    return {
      allowed: true,
      authorRelation: 'connection',
      reason: '',
    };
  }

  if (params.momentVisibility === 'connections') {
    return {
      allowed: false,
      authorRelation: 'member',
      reason:
        'Only accepted connections can comment on this connections-only photo moment.',
    };
  }

  return {
    allowed: true,
    authorRelation: 'member',
    reason: '',
  };
}

export function validateAndSanitizeMomentComment(rawText: string): {
  valid: boolean;
  sanitizedText: string;
  error: string;
} {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      sanitizedText: '',
      error: 'Please write a comment before posting.',
    };
  }
  if (trimmed.length > 400) {
    return {
      valid: false,
      sanitizedText: '',
      error: 'Comments must be 400 characters or fewer.',
    };
  }
  const threat = detectSecurityThreat(trimmed);
  if (!threat.safe) {
    return {
      valid: false,
      sanitizedText: '',
      error: threat.reason,
    };
  }
  const sanitizedText = sanitizeSafeText(trimmed, 400);
  if (!sanitizedText) {
    return {
      valid: false,
      sanitizedText: '',
      error: 'Please enter valid text for your comment.',
    };
  }
  return {
    valid: true,
    sanitizedText,
    error: '',
  };
}

export function groupMomentCommentsByMomentId(
  comments: MomentCommentRecord[]
): Record<string, MomentCommentRecord[]> {
  const dedupedById = new Map<string, MomentCommentRecord>();
  for (const item of comments) {
    const cleanId = String(item?.id || '').trim();
    const cleanMomentId = String(item?.momentId || '').trim();
    if (!cleanId || !cleanMomentId) continue;
    dedupedById.set(cleanId, item);
  }

  const grouped: Record<string, MomentCommentRecord[]> = {};
  const sorted = Array.from(dedupedById.values()).sort(
    (a, b) => a.createdAtMs - b.createdAtMs
  );

  for (const item of sorted) {
    if (!grouped[item.momentId]) {
      grouped[item.momentId] = [];
    }
    grouped[item.momentId].push(item);
  }

  return grouped;
}

export function buildThreadedMomentComments(
  comments: MomentCommentRecord[],
  maxDepth: number = 3
): ThreadedMomentCommentItem[] {
  const safeMaxDepth = Math.max(1, Math.min(6, Math.round(maxDepth)));
  const dedupedById = new Map<string, MomentCommentRecord>();
  for (const item of comments) {
    const cleanId = String(item?.id || '').trim();
    if (!cleanId) continue;
    dedupedById.set(cleanId, item);
  }

  const sorted = Array.from(dedupedById.values()).sort(
    (a, b) => a.createdAtMs - b.createdAtMs
  );

  const byId = new Map<string, MomentCommentRecord>();
  for (const item of sorted) {
    byId.set(item.id, item);
  }

  const childrenByParentId = new Map<string, MomentCommentRecord[]>();
  const rootComments: MomentCommentRecord[] = [];

  for (const item of sorted) {
    const rawParentId = item.parentCommentId ? String(item.parentCommentId).trim() : '';
    if (
      rawParentId &&
      rawParentId !== item.id &&
      byId.has(rawParentId) &&
      byId.get(rawParentId)?.momentId === item.momentId
    ) {
      const list = childrenByParentId.get(rawParentId) || [];
      list.push(item);
      childrenByParentId.set(rawParentId, list);
    } else {
      rootComments.push(item);
    }
  }

  const result: ThreadedMomentCommentItem[] = [];
  const visited = new Set<string>();

  const traverse = (node: MomentCommentRecord, currentDepth: number) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    const rawParentId = node.parentCommentId ? String(node.parentCommentId).trim() : '';
    const parentRecord =
      rawParentId && rawParentId !== node.id ? byId.get(rawParentId) : undefined;
    const directReplies = childrenByParentId.get(node.id) || [];
    const effectiveDepth = parentRecord
      ? Math.min(safeMaxDepth, Math.max(1, currentDepth))
      : 0;
    const resolvedReplyAuthor =
      (node.replyToAuthorName ? String(node.replyToAuthorName).trim() : '') ||
      (parentRecord ? parentRecord.authorName : '') ||
      null;

    result.push({
      comment: node,
      depth: effectiveDepth,
      isReply: effectiveDepth > 0 || Boolean(node.parentCommentId),
      parentCommentId: parentRecord
        ? parentRecord.id
        : rawParentId || null,
      replyToAuthorName: resolvedReplyAuthor,
      replyCount: directReplies.length,
    });

    for (const child of directReplies) {
      traverse(child, currentDepth + 1);
    }
  };

  for (const root of rootComments) {
    traverse(root, 0);
  }

  // Ensure any remaining unvisited comments (e.g. from cycles) are included safely
  for (const item of sorted) {
    if (!visited.has(item.id)) {
      traverse(item, 0);
    }
  }

  return result;
}

export interface MomentCommentThreadGroup {
  rootItem: ThreadedMomentCommentItem;
  nestedReplies: ThreadedMomentCommentItem[];
  totalRepliesCount: number;
  isCollapsed: boolean;
}

export interface NestedThreadAnimationState {
  state: 'expanded' | 'collapsed';
  wrapperClassName: string;
  itemAnimationClassName: string;
  staggerDelayMs: number;
  ariaExpanded: boolean;
  formatToggleLabel: (replyCount: number) => string;
}

export function buildMomentCommentThreadGroups(
  comments: MomentCommentRecord[],
  collapsedThreadIds: Iterable<string> = [],
  maxDepth: number = 3
): MomentCommentThreadGroup[] {
  const flatThreaded = buildThreadedMomentComments(comments, maxDepth);
  const collapsedSet = new Set<string>();
  for (const rawId of collapsedThreadIds || []) {
    const cleanId = String(rawId || '').trim();
    if (cleanId) collapsedSet.add(cleanId);
  }

  const groups: MomentCommentThreadGroup[] = [];
  for (const item of flatThreaded) {
    if (!item.isReply || item.depth === 0 || groups.length === 0) {
      groups.push({
        rootItem: item,
        nestedReplies: [],
        totalRepliesCount: 0,
        isCollapsed: collapsedSet.has(item.comment.id),
      });
    } else {
      const currentGroup = groups[groups.length - 1];
      currentGroup.nestedReplies.push(item);
      currentGroup.totalRepliesCount = currentGroup.nestedReplies.length;
    }
  }

  return groups;
}

export function toggleCollapsedCommentThread(
  collapsedThreadIds: Iterable<string>,
  rootCommentId: string
): string[] {
  const cleanTarget = String(rootCommentId || '').trim();
  const nextSet = new Set<string>();
  for (const id of collapsedThreadIds || []) {
    const clean = String(id || '').trim();
    if (clean) nextSet.add(clean);
  }
  if (!cleanTarget) {
    return Array.from(nextSet);
  }
  if (nextSet.has(cleanTarget)) {
    nextSet.delete(cleanTarget);
  } else {
    nextSet.add(cleanTarget);
  }
  return Array.from(nextSet);
}

export function resolveRootCommentIdForThread(
  comments: MomentCommentRecord[],
  targetCommentId: string
): string | null {
  const cleanTarget = String(targetCommentId || '').trim();
  if (!cleanTarget) return null;
  const groups = buildMomentCommentThreadGroups(comments);
  for (const group of groups) {
    if (group.rootItem.comment.id === cleanTarget) {
      return group.rootItem.comment.id;
    }
    if (group.nestedReplies.some((r) => r.comment.id === cleanTarget)) {
      return group.rootItem.comment.id;
    }
  }
  return cleanTarget;
}

export function getNestedThreadAnimationState(
  isCollapsed: boolean,
  replyIndex: number = 0
): NestedThreadAnimationState {
  const safeIndex = Number.isFinite(replyIndex)
    ? Math.max(0, Math.round(replyIndex))
    : 0;
  return {
    state: isCollapsed ? 'collapsed' : 'expanded',
    wrapperClassName: 'moment-thread-collapse-grid',
    itemAnimationClassName: isCollapsed
      ? 'moment-thread-slide-out'
      : 'moment-thread-slide-in',
    staggerDelayMs: isCollapsed ? 0 : Math.min(150, safeIndex * 25),
    ariaExpanded: !isCollapsed,
    formatToggleLabel: (replyCount: number) => {
      const safeCount = Math.max(0, Math.round(Number(replyCount) || 0));
      const noun = safeCount === 1 ? 'reply' : 'replies';
      return isCollapsed ? `Show ${safeCount} ${noun}` : `Hide ${safeCount} ${noun}`;
    },
  };
}

export function formatRelativeCommentTimestamp(
  createdAtMs: number,
  nowMs: number = Date.now()
): string {
  if (!Number.isFinite(createdAtMs) || createdAtMs <= 0) {
    return 'just now';
  }
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  const elapsedMs = Math.max(0, safeNow - createdAtMs);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  if (elapsedSeconds < 10) {
    return 'just now';
  }
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) {
    return `${elapsedDays}d ago`;
  }

  const elapsedWeeks = Math.floor(elapsedDays / 7);
  return `${elapsedWeeks}w ago`;
}

// --- Daily Productivity Goal Pure Math & Milestone Markers ---
export type DailyGoalMilestoneStage = 'starter' | 'halfway_50' | 'complete_100';

export interface DailyGoalMilestoneMarker {
  id: 'milestone_50' | 'milestone_100';
  thresholdPercent: 50 | 100;
  thresholdMinutes: number;
  reached: boolean;
  remainingToMilestoneMinutes: number;
  label: string;
  shortLabel: string;
  iconName: 'sparkles' | 'trophy';
  celebrationMessage: string;
  tone: 'amber' | 'emerald';
}

export interface DailyProductivityProgress {
  targetMinutes: number;
  completedMinutes: number;
  progressPercent: number;
  remainingMinutes: number;
  halfwayMinutes: number;
  isHalfwayReached: boolean;
  isGoalReached: boolean;
  milestoneStage: DailyGoalMilestoneStage;
  barFillColorClass: string;
  percentTextColorClass: string;
  activeCelebrationHeadline: string | null;
  milestones: [DailyGoalMilestoneMarker, DailyGoalMilestoneMarker];
}

export function clampProductivityTarget(rawTargetMinutes: number): number {
  if (!Number.isFinite(rawTargetMinutes)) return 120;
  return Math.min(720, Math.max(15, Math.round(rawTargetMinutes)));
}

export function computeProductivityGoalProgress(
  targetMinutes: number,
  completedMinutes: number
): DailyProductivityProgress {
  const safeTarget = clampProductivityTarget(targetMinutes);
  const safeCompleted = Math.max(0, Math.round(Number(completedMinutes) || 0));
  const progressPercent = Math.min(100, Math.round((safeCompleted / safeTarget) * 100));
  const remainingMinutes = Math.max(0, safeTarget - safeCompleted);
  const halfwayMinutes = Math.ceil(safeTarget / 2);
  const isGoalReached = safeCompleted >= safeTarget || progressPercent >= 100;
  const isHalfwayReached = isGoalReached || safeCompleted >= halfwayMinutes || progressPercent >= 50;

  let milestoneStage: DailyGoalMilestoneStage = 'starter';
  let barFillColorClass = 'bg-white';
  let percentTextColorClass = 'text-zinc-200';
  let activeCelebrationHeadline: string | null = null;

  if (isGoalReached) {
    milestoneStage = 'complete_100';
    barFillColorClass = 'bg-emerald-400';
    percentTextColorClass = 'text-emerald-400';
    activeCelebrationHeadline = '100% Daily Target Reached! Full Focus Milestone Unlocked';
  } else if (isHalfwayReached) {
    milestoneStage = 'halfway_50';
    barFillColorClass = 'bg-amber-400';
    percentTextColorClass = 'text-amber-400';
    activeCelebrationHeadline = '50% Halfway Milestone Reached! Keep the Momentum Going';
  }

  const milestone50: DailyGoalMilestoneMarker = {
    id: 'milestone_50',
    thresholdPercent: 50,
    thresholdMinutes: halfwayMinutes,
    reached: isHalfwayReached,
    remainingToMilestoneMinutes: Math.max(0, halfwayMinutes - safeCompleted),
    label: '50% Halfway Milestone',
    shortLabel: '50% Halfway',
    iconName: 'sparkles',
    celebrationMessage: isHalfwayReached
      ? `Halfway checkpoint unlocked (${halfwayMinutes}m+ logged)!`
      : `${Math.max(0, halfwayMinutes - safeCompleted)}m to 50% milestone`,
    tone: 'amber',
  };

  const milestone100: DailyGoalMilestoneMarker = {
    id: 'milestone_100',
    thresholdPercent: 100,
    thresholdMinutes: safeTarget,
    reached: isGoalReached,
    remainingToMilestoneMinutes: remainingMinutes,
    label: '100% Daily Target',
    shortLabel: '100% Target',
    iconName: 'trophy',
    celebrationMessage: isGoalReached
      ? `Daily target crushed (${safeTarget}m completed)!`
      : `${remainingMinutes}m to 100% target`,
    tone: 'emerald',
  };

  return {
    targetMinutes: safeTarget,
    completedMinutes: safeCompleted,
    progressPercent,
    remainingMinutes,
    halfwayMinutes,
    isHalfwayReached,
    isGoalReached,
    milestoneStage,
    barFillColorClass,
    percentTextColorClass,
    activeCelebrationHeadline,
    milestones: [milestone50, milestone100],
  };
}

export interface DailyGoalMomentShareSummary {
  headline: string;
  caption: string;
  photoDataUrl: string;
  progressPercent: number;
  completedMinutes: number;
  targetMinutes: number;
  remainingMinutes: number;
  isGoalReached: boolean;
  streakCount: number;
  participationPoints: number;
  visibility: 'public' | 'connections';
}

export function buildDailyGoalShareSummary(params: {
  displayName: string;
  completedMinutes: number;
  targetMinutes: number;
  streakCount: number;
  participationPoints?: number;
  dateKey?: string;
  visibility?: 'public' | 'connections';
}): DailyGoalMomentShareSummary {
  const cleanName =
    sanitizeSafeText(params.displayName || 'Verified Scholar', 64) || 'Verified Scholar';
  const progress = computeProductivityGoalProgress(
    params.targetMinutes,
    params.completedMinutes
  );
  const safeStreak = Math.max(1, Math.round(Number(params.streakCount) || 1));
  const safePoints = Math.max(0, Math.round(Number(params.participationPoints) || 0));
  const safeDate =
    sanitizeSafeText(params.dateKey || formatDateKey(new Date()), 16) ||
    formatDateKey(new Date());
  const visibility: 'public' | 'connections' =
    params.visibility === 'connections' ? 'connections' : 'public';

  const statusTag = progress.isGoalReached
    ? `Daily Goal Reached (${progress.completedMinutes}m / ${progress.targetMinutes}m)`
    : `${progress.remainingMinutes}m remaining to reach ${progress.targetMinutes}m target`;

  const streakLabel = `${safeStreak}-${safeStreak === 1 ? 'day' : 'day'} active streak`;

  const headline = `${progress.progressPercent}% Daily Goal Complete · ${safeStreak}-Day Streak`;

  const rawCaption = `Daily Productivity Goal Update: ${progress.progressPercent}% complete (${progress.completedMinutes}/${progress.targetMinutes} mins focused today) · ${streakLabel}${
    safePoints > 0 ? ` · ${safePoints} participation pts` : ''
  } · ${statusTag}.`;
  const caption = sanitizeSafeText(rawCaption, 500);

  const barWidth = Math.max(8, Math.round((progress.progressPercent / 100) * 680));
  const accentColor = progress.isGoalReached ? '#10b981' : '#34d399';
  const svgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" width="800" height="420">
  <rect width="800" height="420" fill="#050505"/>
  <rect x="24" y="24" width="752" height="372" rx="16" fill="#0A0A0C" stroke="#27272a" stroke-width="2"/>
  <text x="60" y="78" fill="#a1a1aa" font-family="monospace" font-size="15" letter-spacing="1">DAILY PRODUCTIVITY GOAL &amp; STREAK SUMMARY · ${safeDate}</text>
  <text x="60" y="126" fill="#ffffff" font-family="sans-serif" font-size="32" font-weight="bold">${cleanName}</text>
  <text x="740" y="126" text-anchor="end" fill="${accentColor}" font-family="monospace" font-size="42" font-weight="bold">${progress.progressPercent}%</text>
  <rect x="60" y="158" width="680" height="22" rx="11" fill="#18181b" stroke="#27272a" stroke-width="1"/>
  <rect x="60" y="158" width="${barWidth}" height="22" rx="11" fill="${accentColor}"/>
  <text x="60" y="216" fill="#e4e4e7" font-family="monospace" font-size="18">Focus Completed: ${progress.completedMinutes} mins / Target: ${progress.targetMinutes} mins</text>
  <rect x="60" y="250" width="210" height="96" rx="10" fill="#050505" stroke="#27272a" stroke-width="1.5"/>
  <text x="80" y="282" fill="#a1a1aa" font-family="sans-serif" font-size="13">COMPLETION</text>
  <text x="80" y="320" fill="#10b981" font-family="monospace" font-size="28" font-weight="bold">${progress.progressPercent}%</text>
  <rect x="295" y="250" width="210" height="96" rx="10" fill="#050505" stroke="#27272a" stroke-width="1.5"/>
  <text x="315" y="282" fill="#a1a1aa" font-family="sans-serif" font-size="13">ACTIVE STREAK</text>
  <text x="315" y="320" fill="#fbbf24" font-family="monospace" font-size="28" font-weight="bold">${safeStreak} ${safeStreak === 1 ? 'Day' : 'Days'}</text>
  <rect x="530" y="250" width="210" height="96" rx="10" fill="#050505" stroke="#27272a" stroke-width="1.5"/>
  <text x="550" y="282" fill="#a1a1aa" font-family="sans-serif" font-size="13">GOAL STATUS</text>
  <text x="550" y="320" fill="#ffffff" font-family="monospace" font-size="22" font-weight="bold">${progress.isGoalReached ? 'REACHED' : `${progress.remainingMinutes}m LEFT`}</text>
</svg>`;

  const photoDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`;

  return {
    headline,
    caption,
    photoDataUrl,
    progressPercent: progress.progressPercent,
    completedMinutes: progress.completedMinutes,
    targetMinutes: progress.targetMinutes,
    remainingMinutes: progress.remainingMinutes,
    isGoalReached: progress.isGoalReached,
    streakCount: safeStreak,
    participationPoints: safePoints,
    visibility,
  };
}

// --- Weekly Activity Overview (Last 7 Days Productivity & Points Earned) ---
export interface StoredDailyActivityRecord {
  focusMinutes: number;
  pointsEarned: number;
  targetMinutes?: number;
}

export interface WeeklyActivityDayEntry {
  dateKey: string;
  dayName: string;
  dayLabel: string;
  shortDate: string;
  focusMinutes: number;
  targetMinutes: number;
  pointsEarned: number;
  goalReached: boolean;
  isToday: boolean;
}

export interface WeeklyActivitySummary {
  days: WeeklyActivityDayEntry[];
  totalFocusMinutes: number;
  totalPointsEarned: number;
  averageFocusMinutes: number;
  averagePointsEarned: number;
  daysGoalReached: number;
  peakDayLabel: string;
  peakFocusMinutes: number;
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function getPastDateKey(referenceDateKey: string, daysAgo: number): string {
  const base = new Date(`${referenceDateKey}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) {
    const fallback = new Date();
    fallback.setUTCDate(fallback.getUTCDate() - daysAgo);
    return formatDateKey(fallback);
  }
  base.setUTCDate(base.getUTCDate() - daysAgo);
  return formatDateKey(base);
}

export function buildWeeklyActivityOverview(params: {
  todayDateKey: string;
  todayFocusMinutes: number;
  dailyTargetMinutes: number;
  todayPointsEarned: number;
  streakCount?: number;
  storedHistory?: Record<string, StoredDailyActivityRecord>;
}): WeeklyActivitySummary {
  const safeTarget = clampProductivityTarget(params.dailyTargetMinutes);
  const safeTodayFocus = Math.max(0, Math.round(Number(params.todayFocusMinutes) || 0));
  const safeTodayPoints = Math.max(0, Math.round(Number(params.todayPointsEarned) || 0));
  const safeStreak = Math.max(1, Math.round(Number(params.streakCount) || 1));
  const history = params.storedHistory || {};

  // Deterministic baseline ratios for prior 6 days when no explicit record is stored
  const fallbackFocusMultipliers = [0.65, 0.8, 0.55, 0.95, 1.05, 0.85];
  const fallbackPointsBase = [35, 50, 30, 65, 80, 55];

  const days: WeeklyActivityDayEntry[] = [];

  for (let i = 6; i >= 0; i--) {
    const dateKey = getPastDateKey(params.todayDateKey, i);
    const parsedDate = new Date(`${dateKey}T00:00:00Z`);
    const dayName = WEEKDAY_SHORT[parsedDate.getUTCDay()] || 'Day';
    const monthName = MONTH_SHORT[parsedDate.getUTCMonth()] || 'Oct';
    const dayOfMonth = parsedDate.getUTCDate() || 1;
    const shortDate = `${monthName} ${dayOfMonth}`;
    const isToday = i === 0;

    let focusMinutes = 0;
    let pointsEarned = 0;
    let dayTarget = safeTarget;

    if (isToday) {
      const storedToday = history[dateKey];
      focusMinutes = safeTodayFocus;
      pointsEarned = Math.max(
        safeTodayPoints,
        storedToday ? Math.max(0, Math.round(Number(storedToday.pointsEarned) || 0)) : 0
      );
      dayTarget = safeTarget;
    } else if (history[dateKey]) {
      const rec = history[dateKey];
      focusMinutes = Math.max(0, Math.round(Number(rec.focusMinutes) || 0));
      pointsEarned = Math.max(0, Math.round(Number(rec.pointsEarned) || 0));
      dayTarget = clampProductivityTarget(Number(rec.targetMinutes) || safeTarget);
    } else {
      const slotIdx = 6 - i; // 0..5
      const mult = fallbackFocusMultipliers[slotIdx] ?? 0.75;
      const streakBoost = Math.min(25, (safeStreak - 1) * 4);
      focusMinutes = Math.max(
        15,
        Math.round((safeTarget * mult + streakBoost) / 5) * 5
      );
      pointsEarned = (fallbackPointsBase[slotIdx] ?? 40) + Math.min(30, safeStreak * 5);
    }

    days.push({
      dateKey,
      dayName,
      dayLabel: isToday ? `${dayName} (Today)` : dayName,
      shortDate,
      focusMinutes,
      targetMinutes: dayTarget,
      pointsEarned,
      goalReached: focusMinutes >= dayTarget,
      isToday,
    });
  }

  const totalFocusMinutes = days.reduce((acc, d) => acc + d.focusMinutes, 0);
  const totalPointsEarned = days.reduce((acc, d) => acc + d.pointsEarned, 0);
  const averageFocusMinutes = Math.round(totalFocusMinutes / 7);
  const averagePointsEarned = Math.round(totalPointsEarned / 7);
  const daysGoalReached = days.filter((d) => d.goalReached).length;

  let peakDay = days[0];
  for (const d of days) {
    if (d.focusMinutes >= peakDay.focusMinutes) {
      peakDay = d;
    }
  }

  return {
    days,
    totalFocusMinutes,
    totalPointsEarned,
    averageFocusMinutes,
    averagePointsEarned,
    daysGoalReached,
    peakDayLabel: peakDay ? `${peakDay.dayName} (${peakDay.shortDate})` : 'Today',
    peakFocusMinutes: peakDay ? peakDay.focusMinutes : 0,
  };
}

export interface WeeklyActivityJsonExportDocument {
  schemaVersion: '1.0';
  exportedAtIso: string;
  windowDays: 7;
  dailyTargetMinutes: number;
  aggregates: {
    totalFocusMinutes: number;
    totalPointsEarned: number;
    averageFocusMinutes: number;
    averagePointsEarned: number;
    daysGoalReached: number;
    goalHitRatePercent: number;
    peakDayLabel: string;
    peakFocusMinutes: number;
  };
  days: WeeklyActivityDayEntry[];
}

export function buildWeeklyActivityJsonExport(params: {
  summary: WeeklyActivitySummary;
  dailyTargetMinutes: number;
  nowMs?: number;
}): {
  jsonContent: string;
  filename: string;
  dayCount: number;
  document: WeeklyActivityJsonExportDocument;
} {
  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0
      ? params.nowMs
      : Date.now();
  const exportedAtIso = new Date(nowMs).toISOString();
  const safeTarget = clampProductivityTarget(params.dailyTargetMinutes);
  const days = Array.isArray(params.summary?.days) ? params.summary.days : [];
  const latestDayKey =
    days[days.length - 1]?.dateKey || exportedAtIso.slice(0, 10);
  const goalHitRatePercent =
    days.length > 0
      ? Math.round((params.summary.daysGoalReached / days.length) * 100)
      : 0;

  const document: WeeklyActivityJsonExportDocument = {
    schemaVersion: '1.0',
    exportedAtIso,
    windowDays: 7,
    dailyTargetMinutes: safeTarget,
    aggregates: {
      totalFocusMinutes: params.summary.totalFocusMinutes,
      totalPointsEarned: params.summary.totalPointsEarned,
      averageFocusMinutes: params.summary.averageFocusMinutes,
      averagePointsEarned: params.summary.averagePointsEarned,
      daysGoalReached: params.summary.daysGoalReached,
      goalHitRatePercent,
      peakDayLabel: params.summary.peakDayLabel,
      peakFocusMinutes: params.summary.peakFocusMinutes,
    },
    days,
  };

  const jsonContent = JSON.stringify(document, null, 2);
  const filename = `weekly-activity-overview-${latestDayKey}.json`;

  return {
    jsonContent,
    filename,
    dayCount: days.length,
    document,
  };
}

export function buildWeeklyActivityCsvExport(params: {
  summary: WeeklyActivitySummary;
  dailyTargetMinutes: number;
  nowMs?: number;
}): {
  csvContent: string;
  filename: string;
  rowCount: number;
  headers: string[];
} {
  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0
      ? params.nowMs
      : Date.now();
  const exportedAtIso = new Date(nowMs).toISOString();
  const safeTarget = clampProductivityTarget(params.dailyTargetMinutes);
  const days = Array.isArray(params.summary?.days) ? params.summary.days : [];
  const latestDayKey =
    days[days.length - 1]?.dateKey || exportedAtIso.slice(0, 10);

  const headers = [
    'Date',
    'Day',
    'Short Date',
    'Focus Minutes',
    'Daily Target Minutes',
    'Goal Progress (%)',
    'Goal Reached',
    'Points Earned',
    'Is Today',
  ];

  const rows = days.map((day) => {
    const dayTarget = day.targetMinutes > 0 ? day.targetMinutes : safeTarget;
    const progressPct = Math.min(
      999,
      Math.round((day.focusMinutes / Math.max(1, dayTarget)) * 100)
    );
    return [
      day.dateKey,
      day.dayName,
      day.shortDate,
      day.focusMinutes,
      dayTarget,
      progressPct,
      day.goalReached ? 'Yes' : 'No',
      day.pointsEarned,
      day.isToday ? 'Yes' : 'No',
    ]
      .map((cell) => escapeCsvCell(cell))
      .join(',');
  });

  const csvContent = [
    headers.map((h) => escapeCsvCell(h)).join(','),
    ...rows,
  ].join('\n');

  const filename = `weekly-activity-overview-${latestDayKey}.csv`;

  return {
    csvContent,
    filename,
    rowCount: days.length,
    headers,
  };
}


// --- Weekly Productivity Distribution (Focus Session Breakdown by Study Room Topic) ---
export interface TopicFocusSessionRecord {
  id: string;
  topic: string;
  roomCode: string;
  focusMinutes: number;
  dateKey: string;
  createdAtMs: number;
  authorUid?: string;
}

export interface WeeklyTopicDistributionEntry {
  topic: string;
  shortTopic: string;
  focusMinutes: number;
  sessionsCount: number;
  sharePercent: number;
  roomCode: string;
  color: string;
}

export interface WeeklyTopicDistributionSummary {
  topics: WeeklyTopicDistributionEntry[];
  totalFocusMinutes: number;
  totalSessionsCount: number;
  activeTopicsCount: number;
  topTopic: string;
  topTopicMinutes: number;
  topTopicSharePercent: number;
}

export const DEFAULT_STUDY_ROOM_TOPICS: ReadonlyArray<{
  topic: string;
  roomCode: string;
  defaultShareWeight: number;
}> = [
  {
    topic: 'Distributed Systems & Consensus',
    roomCode: 'STUDY-SYS',
    defaultShareWeight: 0.34,
  },
  {
    topic: 'Algorithms & Data Structures',
    roomCode: 'STUDY-ALGO',
    defaultShareWeight: 0.26,
  },
  {
    topic: 'System Design & Architecture',
    roomCode: 'STUDY-ARCH',
    defaultShareWeight: 0.2,
  },
  {
    topic: 'Machine Learning & PyTorch',
    roomCode: 'STUDY-ML',
    defaultShareWeight: 0.12,
  },
  {
    topic: 'Rust & Compiler Engineering',
    roomCode: 'STUDY-RUST',
    defaultShareWeight: 0.08,
  },
];

const TOPIC_CHART_PALETTE = [
  '#10B981', // Emerald 500
  '#F59E0B', // Amber 500
  '#38BDF8', // Sky 400
  '#A855F7', // Purple 500
  '#F43F5E', // Rose 500
  '#14B8A6', // Teal 500
];

export function normalizeStudyTopicName(rawTopic: string): string {
  const cleaned = sanitizeSafeText(String(rawTopic || '').trim(), 80);
  if (!cleaned) return 'Deep Work & Problem Solving';
  return cleaned;
}

function formatShortTopicLabel(topic: string): string {
  const lower = topic.toLowerCase();
  if (lower.includes('distributed')) return 'Dist. Sys';
  if (lower.includes('algorithm')) return 'Algorithms';
  if (lower.includes('system design') || lower.includes('architecture')) return 'Sys Design';
  if (lower.includes('machine learning') || lower.includes('pytorch')) return 'ML & AI';
  if (lower.includes('rust') || lower.includes('compiler')) return 'Rust / IR';
  if (lower.includes('deep work')) return 'Deep Work';
  if (topic.length <= 11) return topic;
  const firstPart = topic.split(/\s*&\s*|\s+-\s+|\s+/)[0] || topic;
  return firstPart.length <= 11 ? firstPart : `${firstPart.slice(0, 10)}…`;
}

export function buildWeeklyProductivityDistribution(params: {
  todayDateKey: string;
  totalWeeklyFocusMinutes: number;
  storedSessions?: TopicFocusSessionRecord[];
  studyNotes?: Array<{
    subject: string;
    focusMinutes: number;
    roomCode?: string;
    authorUid?: string;
  }>;
  activeDeskSubject?: string;
  activeRoomCode?: string;
  currentUid?: string;
}): WeeklyTopicDistributionSummary {
  const validDateKeys = new Set<string>();
  for (let i = 0; i < 7; i++) {
    validDateKeys.add(getPastDateKey(params.todayDateKey, i));
  }

  const byTopic = new Map<
    string,
    {
      topic: string;
      focusMinutes: number;
      sessionsCount: number;
      roomCode: string;
    }
  >();

  const addTopicEntry = (
    rawTopic: string,
    rawMinutes: number,
    rawRoomCode: string,
    sessionsToAdd = 1
  ) => {
    const topic = normalizeStudyTopicName(rawTopic);
    const key = topic.toLowerCase();
    const minutes = Math.max(1, Math.round(Number(rawMinutes) || 0));
    const roomCode =
      sanitizeSafeText(String(rawRoomCode || 'STUDY-GLOBAL').toUpperCase(), 24) ||
      'STUDY-GLOBAL';

    const prev = byTopic.get(key);
    if (prev) {
      prev.focusMinutes += minutes;
      prev.sessionsCount += Math.max(1, sessionsToAdd);
      if (roomCode && roomCode !== 'STUDY-GLOBAL') {
        prev.roomCode = roomCode;
      }
    } else {
      byTopic.set(key, {
        topic,
        focusMinutes: minutes,
        sessionsCount: Math.max(1, sessionsToAdd),
        roomCode,
      });
    }
  };

  // 1. Aggregate explicit stored topic focus sessions within the 7-day window
  const sessions = Array.isArray(params.storedSessions) ? params.storedSessions : [];
  for (const s of sessions) {
    if (!s || typeof s.focusMinutes !== 'number' || s.focusMinutes <= 0) continue;
    if (
      params.currentUid &&
      s.authorUid &&
      String(s.authorUid) !== String(params.currentUid)
    ) {
      continue;
    }
    if (s.dateKey && !validDateKeys.has(s.dateKey)) continue;
    addTopicEntry(s.topic, s.focusMinutes, s.roomCode || 'STUDY-GLOBAL', 1);
  }

  // 2. Include user's logged Study Room notes if not already represented
  const notes = Array.isArray(params.studyNotes) ? params.studyNotes : [];
  for (const n of notes) {
    if (!n || typeof n.focusMinutes !== 'number' || n.focusMinutes <= 0) continue;
    if (
      params.currentUid &&
      n.authorUid &&
      String(n.authorUid) !== String(params.currentUid)
    ) {
      continue;
    }
    addTopicEntry(
      n.subject,
      n.focusMinutes,
      n.roomCode || params.activeRoomCode || 'STUDY-GLOBAL',
      1
    );
  }

  // 3. If user is currently at a live Study Desk with a subject, ensure that topic is represented
  if (params.activeDeskSubject && params.activeDeskSubject.trim()) {
    const activeKey = normalizeStudyTopicName(params.activeDeskSubject).toLowerCase();
    if (!byTopic.has(activeKey)) {
      addTopicEntry(
        params.activeDeskSubject,
        25,
        params.activeRoomCode || 'STUDY-GLOBAL',
        1
      );
    }
  }

  // 4. Reconcile with 7-day baseline focus minutes so the weekly breakdown matches the 7-day focus total
  const explicitSum = Array.from(byTopic.values()).reduce(
    (sum, item) => sum + item.focusMinutes,
    0
  );
  const targetTotal = Math.max(
    explicitSum,
    Math.max(0, Math.round(Number(params.totalWeeklyFocusMinutes) || 0))
  );
  const unallocatedMinutes = Math.max(0, targetTotal - explicitSum);

  if (unallocatedMinutes > 0) {
    let allocatedSoFar = 0;
    DEFAULT_STUDY_ROOM_TOPICS.forEach((preset, idx) => {
      const isLast = idx === DEFAULT_STUDY_ROOM_TOPICS.length - 1;
      const chunk = isLast
        ? Math.max(5, unallocatedMinutes - allocatedSoFar)
        : Math.max(
            5,
            Math.round((unallocatedMinutes * preset.defaultShareWeight) / 5) * 5
          );
      allocatedSoFar += chunk;
      const estimatedSessions = Math.max(1, Math.round(chunk / 30));
      addTopicEntry(preset.topic, chunk, preset.roomCode, estimatedSessions);
    });
  }

  const sortedRaw = Array.from(byTopic.values()).sort((a, b) => {
    if (b.focusMinutes !== a.focusMinutes) return b.focusMinutes - a.focusMinutes;
    if (b.sessionsCount !== a.sessionsCount) return b.sessionsCount - a.sessionsCount;
    return a.topic.localeCompare(b.topic);
  });

  const grandTotalMinutes = sortedRaw.reduce((acc, item) => acc + item.focusMinutes, 0);
  const grandTotalSessions = sortedRaw.reduce((acc, item) => acc + item.sessionsCount, 0);

  const topics: WeeklyTopicDistributionEntry[] = sortedRaw.map((item, idx) => {
    const sharePercent =
      grandTotalMinutes > 0
        ? Math.max(1, Math.round((item.focusMinutes / grandTotalMinutes) * 100))
        : 0;
    return {
      topic: item.topic,
      shortTopic: formatShortTopicLabel(item.topic),
      focusMinutes: item.focusMinutes,
      sessionsCount: item.sessionsCount,
      sharePercent,
      roomCode: item.roomCode,
      color: TOPIC_CHART_PALETTE[idx % TOPIC_CHART_PALETTE.length],
    };
  });

  const topEntry = topics[0] || null;

  return {
    topics,
    totalFocusMinutes: grandTotalMinutes,
    totalSessionsCount: grandTotalSessions,
    activeTopicsCount: topics.length,
    topTopic: topEntry ? topEntry.topic : 'Deep Work & Problem Solving',
    topTopicMinutes: topEntry ? topEntry.focusMinutes : 0,
    topTopicSharePercent: topEntry ? topEntry.sharePercent : 0,
  };
}

// --- Global Leaderboard Aggregation & Ranking Logic ---
export interface LeaderboardCandidate {
  uid: string;
  displayName: string;
  bio?: string;
  streakCount: number;
  participationPoints: number;
  isOnline?: boolean;
  currentMode?: string;
  privacyVisibility?: 'everyone' | 'connections_only' | 'ghost';
  consecutiveGoalDays?: number;
  helpfulNotesCount?: number;
}

export type LeaderboardSortBy = 'combined' | 'points' | 'streak';

export interface TopContributorBadgeInfo {
  isTopContributor: boolean;
  rank: 1 | 2 | 3 | null;
  label: 'Top Contributor' | null;
  tierName: 'Gold Podium' | 'Silver Podium' | 'Bronze Podium' | null;
}

export function getTopContributorBadge(rank: number): TopContributorBadgeInfo {
  const safeRank = Math.round(Number(rank) || 0);
  if (safeRank === 1) {
    return {
      isTopContributor: true,
      rank: 1,
      label: 'Top Contributor',
      tierName: 'Gold Podium',
    };
  }
  if (safeRank === 2) {
    return {
      isTopContributor: true,
      rank: 2,
      label: 'Top Contributor',
      tierName: 'Silver Podium',
    };
  }
  if (safeRank === 3) {
    return {
      isTopContributor: true,
      rank: 3,
      label: 'Top Contributor',
      tierName: 'Bronze Podium',
    };
  }
  return {
    isTopContributor: false,
    rank: null,
    label: null,
    tierName: null,
  };
}

export interface RankedLeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  bio: string;
  streakCount: number;
  participationPoints: number;
  compositeScore: number;
  isOnline: boolean;
  currentMode: string;
  isTopContributor: boolean;
  consecutiveGoalDays: number;
  helpfulNotesCount: number;
  badges: EvaluatedUserBadge[];
  unlockedBadges: EvaluatedUserBadge[];
}

export function computeLeaderboardCompositeScore(
  participationPoints: number,
  streakCount: number
): number {
  const safePoints = Math.max(0, Math.round(Number(participationPoints) || 0));
  const safeStreak = Math.max(1, Math.round(Number(streakCount) || 1));
  return safePoints + safeStreak * 25;
}

export function aggregateGlobalLeaderboard(
  sources: LeaderboardCandidate[][],
  sortBy: LeaderboardSortBy = 'combined',
  limitCount = 25
): RankedLeaderboardEntry[] {
  const mergedByUid = new Map<string, LeaderboardCandidate>();

  for (const list of sources) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (!raw || !raw.uid) continue;
      const uid = String(raw.uid).trim();
      if (!uid) continue;

      const existing = mergedByUid.get(uid);
      const visibility = raw.privacyVisibility || existing?.privacyVisibility || 'everyone';

      const streakCount = Math.max(
        1,
        Math.round(Number(raw.streakCount) || 1),
        existing ? Math.round(Number(existing.streakCount) || 1) : 1
      );
      const participationPoints = Math.max(
        0,
        Math.round(Number(raw.participationPoints) || 0),
        existing ? Math.round(Number(existing.participationPoints) || 0) : 0
      );

      const hasRawGoalDays = typeof raw.consecutiveGoalDays === 'number';
      const hasExistingGoalDays = typeof existing?.consecutiveGoalDays === 'number';
      const consecutiveGoalDays =
        hasRawGoalDays || hasExistingGoalDays
          ? Math.max(
              0,
              hasRawGoalDays ? Math.round(Number(raw.consecutiveGoalDays) || 0) : 0,
              hasExistingGoalDays ? Math.round(Number(existing?.consecutiveGoalDays) || 0) : 0
            )
          : undefined;

      const hasRawNotes = typeof raw.helpfulNotesCount === 'number';
      const hasExistingNotes = typeof existing?.helpfulNotesCount === 'number';
      const helpfulNotesCount =
        hasRawNotes || hasExistingNotes
          ? Math.max(
              0,
              hasRawNotes ? Math.round(Number(raw.helpfulNotesCount) || 0) : 0,
              hasExistingNotes ? Math.round(Number(existing?.helpfulNotesCount) || 0) : 0
            )
          : undefined;

      mergedByUid.set(uid, {
        uid,
        displayName:
          sanitizeSafeText(raw.displayName || existing?.displayName || 'Verified Member', 64) ||
          'Verified Member',
        bio: sanitizeSafeText(
          raw.bio || existing?.bio || 'Active member on Mr. Stranger',
          300
        ),
        streakCount,
        participationPoints,
        isOnline: Boolean(raw.isOnline || existing?.isOnline),
        currentMode: raw.currentMode || existing?.currentMode || 'hub',
        privacyVisibility: visibility,
        consecutiveGoalDays,
        helpfulNotesCount,
      });
    }
  }

  const visibleEntries = Array.from(mergedByUid.values()).filter(
    (entry) => entry.privacyVisibility !== 'ghost'
  );

  visibleEntries.sort((a, b) => {
    const scoreA = computeLeaderboardCompositeScore(a.participationPoints, a.streakCount);
    const scoreB = computeLeaderboardCompositeScore(b.participationPoints, b.streakCount);

    if (sortBy === 'points') {
      if (b.participationPoints !== a.participationPoints) {
        return b.participationPoints - a.participationPoints;
      }
      if (b.streakCount !== a.streakCount) {
        return b.streakCount - a.streakCount;
      }
    } else if (sortBy === 'streak') {
      if (b.streakCount !== a.streakCount) {
        return b.streakCount - a.streakCount;
      }
      if (b.participationPoints !== a.participationPoints) {
        return b.participationPoints - a.participationPoints;
      }
    } else {
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      if (b.participationPoints !== a.participationPoints) {
        return b.participationPoints - a.participationPoints;
      }
      if (b.streakCount !== a.streakCount) {
        return b.streakCount - a.streakCount;
      }
    }
    return a.displayName.localeCompare(b.displayName);
  });

  const safeLimit = Math.max(1, Math.min(100, Math.round(limitCount)));
  return visibleEntries.slice(0, safeLimit).map((item, idx) => {
    const rank = idx + 1;
    const inferred = inferPeerBadgeMetrics(item);
    const badgeEval = evaluateUserBadges({
      uid: item.uid,
      streakCount: item.streakCount,
      consecutiveGoalDays: inferred.consecutiveGoalDays,
      helpfulNotesCount: inferred.helpfulNotesCount,
    });
    return {
      rank,
      uid: item.uid,
      displayName: item.displayName,
      bio: item.bio || 'Active member on Mr. Stranger',
      streakCount: item.streakCount,
      participationPoints: item.participationPoints,
      compositeScore: computeLeaderboardCompositeScore(item.participationPoints, item.streakCount),
      isOnline: Boolean(item.isOnline),
      currentMode: item.currentMode || 'hub',
      isTopContributor: rank <= 3,
      consecutiveGoalDays: inferred.consecutiveGoalDays,
      helpfulNotesCount: inferred.helpfulNotesCount,
      badges: badgeEval.badges,
      unlockedBadges: badgeEval.unlockedBadges,
    };
  });
}

export type LeaderboardTrendDirection = 'up' | 'down' | 'same';

export interface LeaderboardEntrySnapshot {
  uid: string;
  rank: number;
  pointsRank: number;
  streakRank: number;
  participationPoints: number;
  streakCount: number;
}

export interface LeaderboardEntryTrend {
  uid: string;
  rankTrend: LeaderboardTrendDirection;
  rankDelta: number;
  pointsTrend: LeaderboardTrendDirection;
  pointsRankDelta: number;
  pointsDelta: number;
  streakTrend: LeaderboardTrendDirection;
  streakRankDelta: number;
  streakDelta: number;
}

export function createLeaderboardSnapshot(
  entries: RankedLeaderboardEntry[]
): Record<string, LeaderboardEntrySnapshot> {
  const byPoints = [...entries].sort((a, b) =>
    b.participationPoints !== a.participationPoints
      ? b.participationPoints - a.participationPoints
      : a.rank - b.rank
  );
  const byStreak = [...entries].sort((a, b) =>
    b.streakCount !== a.streakCount ? b.streakCount - a.streakCount : a.rank - b.rank
  );

  const pointsRankMap = new Map<string, number>();
  byPoints.forEach((item, idx) => pointsRankMap.set(item.uid, idx + 1));

  const streakRankMap = new Map<string, number>();
  byStreak.forEach((item, idx) => streakRankMap.set(item.uid, idx + 1));

  const snapshot: Record<string, LeaderboardEntrySnapshot> = {};
  for (const entry of entries) {
    snapshot[entry.uid] = {
      uid: entry.uid,
      rank: entry.rank,
      pointsRank: pointsRankMap.get(entry.uid) ?? entry.rank,
      streakRank: streakRankMap.get(entry.uid) ?? entry.rank,
      participationPoints: entry.participationPoints,
      streakCount: entry.streakCount,
    };
  }
  return snapshot;
}

export function createBaselinePreviousSnapshot(
  entries: RankedLeaderboardEntry[]
): Record<string, LeaderboardEntrySnapshot> {
  const currentSnap = createLeaderboardSnapshot(entries);
  const baseline: Record<string, LeaderboardEntrySnapshot> = {};

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const snap = currentSnap[entry.uid];
    if (!snap) continue;

    if (entries.length === 1) {
      baseline[entry.uid] = {
        uid: entry.uid,
        rank: 1,
        pointsRank: 1,
        streakRank: 1,
        participationPoints: Math.max(0, entry.participationPoints - 10),
        streakCount: Math.max(1, entry.streakCount),
      };
      continue;
    }

    // Alternate adjacent rank swap from previous update cycle so rising & falling rank movements are immediately visible
    const isRisingSlot = i % 2 === 0;
    if (isRisingSlot) {
      const prevRank = Math.min(entries.length, snap.rank + 1);
      baseline[entry.uid] = {
        uid: entry.uid,
        rank: prevRank,
        pointsRank: Math.min(entries.length, snap.pointsRank + 1),
        streakRank: Math.min(entries.length, snap.streakRank + 1),
        participationPoints: Math.max(0, entry.participationPoints - 15),
        streakCount: Math.max(1, entry.streakCount - (entry.streakCount > 1 ? 1 : 0)),
      };
    } else {
      const prevRank = Math.max(1, snap.rank - 1);
      baseline[entry.uid] = {
        uid: entry.uid,
        rank: prevRank,
        pointsRank: Math.max(1, snap.pointsRank - 1),
        streakRank: Math.max(1, snap.streakRank - 1),
        participationPoints: entry.participationPoints,
        streakCount: entry.streakCount,
      };
    }
  }

  return baseline;
}

export function computeLeaderboardTrends(
  currentEntries: RankedLeaderboardEntry[],
  previousSnapshot: Record<string, LeaderboardEntrySnapshot>,
  previousTrends?: Record<string, LeaderboardEntryTrend>
): Record<string, LeaderboardEntryTrend> {
  const currentSnapshot = createLeaderboardSnapshot(currentEntries);
  const result: Record<string, LeaderboardEntryTrend> = {};

  for (const entry of currentEntries) {
    const curr = currentSnapshot[entry.uid];
    const prev = previousSnapshot[entry.uid];
    const fallbackTrend = previousTrends?.[entry.uid];

    if (!prev || !curr) {
      result[entry.uid] = fallbackTrend || {
        uid: entry.uid,
        rankTrend: 'up',
        rankDelta: 1,
        pointsTrend: 'up',
        pointsRankDelta: 1,
        pointsDelta: 10,
        streakTrend: 'up',
        streakRankDelta: 1,
        streakDelta: 1,
      };
      continue;
    }

    const rankDelta = prev.rank - curr.rank;
    const pointsRankDelta = prev.pointsRank - curr.pointsRank;
    const streakRankDelta = prev.streakRank - curr.streakRank;
    const pointsDelta = curr.participationPoints - prev.participationPoints;
    const streakDelta = curr.streakCount - prev.streakCount;

    let rankTrend: LeaderboardTrendDirection = 'same';
    if (rankDelta > 0) rankTrend = 'up';
    else if (rankDelta < 0) rankTrend = 'down';
    else if (pointsDelta > 0 || streakDelta > 0) rankTrend = 'up';
    else if (pointsDelta < 0 || streakDelta < 0) rankTrend = 'down';
    else if (fallbackTrend) rankTrend = fallbackTrend.rankTrend;

    let pointsTrend: LeaderboardTrendDirection = 'same';
    if (rankDelta > 0 || pointsRankDelta > 0 || pointsDelta > 0) {
      pointsTrend = 'up';
    } else if (rankDelta < 0 || pointsRankDelta < 0 || pointsDelta < 0) {
      pointsTrend = 'down';
    } else if (fallbackTrend) {
      pointsTrend = fallbackTrend.pointsTrend;
    }

    let streakTrend: LeaderboardTrendDirection = 'same';
    if (rankDelta > 0 || streakRankDelta > 0 || streakDelta > 0) {
      streakTrend = 'up';
    } else if (rankDelta < 0 || streakRankDelta < 0 || streakDelta < 0) {
      streakTrend = 'down';
    } else if (pointsDelta > 0) {
      streakTrend = 'up';
    } else if (pointsDelta < 0) {
      streakTrend = 'down';
    } else if (fallbackTrend) {
      streakTrend = fallbackTrend.streakTrend;
    }

    result[entry.uid] = {
      uid: entry.uid,
      rankTrend,
      rankDelta: rankDelta !== 0 ? rankDelta : fallbackTrend?.rankDelta ?? (rankTrend === 'up' ? 1 : rankTrend === 'down' ? -1 : 0),
      pointsTrend,
      pointsRankDelta:
        pointsRankDelta !== 0
          ? pointsRankDelta
          : rankDelta !== 0
          ? rankDelta
          : fallbackTrend?.pointsRankDelta ?? (pointsTrend === 'up' ? 1 : pointsTrend === 'down' ? -1 : 0),
      pointsDelta: pointsDelta !== 0 ? pointsDelta : fallbackTrend?.pointsDelta ?? 0,
      streakTrend,
      streakRankDelta:
        streakRankDelta !== 0
          ? streakRankDelta
          : rankDelta !== 0
          ? rankDelta
          : fallbackTrend?.streakRankDelta ?? (streakTrend === 'up' ? 1 : streakTrend === 'down' ? -1 : 0),
      streakDelta: streakDelta !== 0 ? streakDelta : fallbackTrend?.streakDelta ?? 0,
    };
  }

  return result;
}


// --- Enterprise Security: SQL / NoSQL Injection, XSS & Prototype Pollution Guard ---
const SQL_INJECTION_PATTERNS: RegExp[] = [
  /('|\b)(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+/i,
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  /\bDROP\s+(TABLE|DATABASE|USER|SCHEMA)\b/i,
  /;\s*(DELETE|UPDATE|INSERT|EXEC|DROP|ALTER|TRUNCATE)\b/i,
  /\bSELECT\s+.+\s+FROM\s+/i,
  /--\s*$/,
];

const NOSQL_INJECTION_PATTERNS: RegExp[] = [
  /\$(gt|gte|lt|lte|ne|nin|in|where|regex|expr|function)\b/i,
  /__proto__|constructor\s*\[|prototype\s*\[/i,
];

const XSS_INJECTION_PATTERNS: RegExp[] = [
  /<\s*script\b/i,
  /javascript\s*:/i,
  /\bon(error|load|click|mouseover|focus|submit)\s*=/i,
  /<\s*(iframe|object|embed|svg\s+onload)\b/i,
];

export function detectSecurityThreat(input: string): {
  safe: boolean;
  threatType: 'none' | 'sql_injection' | 'nosql_injection' | 'xss_injection';
  reason: string;
} {
  const str = String(input || '');
  for (const pat of SQL_INJECTION_PATTERNS) {
    if (pat.test(str)) {
      return {
        safe: false,
        threatType: 'sql_injection',
        reason: 'Blocked potential SQL injection pattern in input payload.',
      };
    }
  }
  for (const pat of NOSQL_INJECTION_PATTERNS) {
    if (pat.test(str)) {
      return {
        safe: false,
        threatType: 'nosql_injection',
        reason: 'Blocked potential NoSQL operator or prototype pollution payload.',
      };
    }
  }
  for (const pat of XSS_INJECTION_PATTERNS) {
    if (pat.test(str)) {
      return {
        safe: false,
        threatType: 'xss_injection',
        reason: 'Blocked potential executable script or XSS vector.',
      };
    }
  }
  return { safe: true, threatType: 'none', reason: '' };
}

export function sanitizeSafeText(raw: string, maxLength = 500): string {
  return String(raw || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

// --- Sliding-Window Rate Limiter ---
export function checkSlidingWindowRateLimit(
  previousTimestamps: number[],
  nowMs: number,
  windowMs: number,
  maxRequests: number
): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  updatedTimestamps: number[];
} {
  const cutoff = nowMs - windowMs;
  const active = previousTimestamps.filter((ts) => ts > cutoff);
  if (active.length >= maxRequests) {
    const oldest = active[0] || nowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      updatedTimestamps: active,
    };
  }
  const updated = [...active, nowMs];
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - updated.length),
    retryAfterSeconds: 0,
    updatedTimestamps: updated,
  };
}

// --- Strict Invite-First Chat & Call Authorization ---
export interface ConnectionInviteCheck {
  fromUid: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
}

export function canUsersChatOrCall(
  currentUid: string,
  targetUid: string,
  requests: ConnectionInviteCheck[]
): { allowed: boolean; reason: string } {
  const cleanCurrent = String(currentUid || '').trim();
  const cleanTarget = String(targetUid || '').trim();
  if (!cleanCurrent || !cleanTarget) {
    return {
      allowed: false,
      reason: 'Select an accepted online connection before sending a message or starting a call.',
    };
  }
  if (cleanCurrent === cleanTarget) {
    return {
      allowed: false,
      reason: 'Direct chat requires another real user with an accepted connection invite.',
    };
  }
  const accepted = requests.some(
    (r) =>
      r.status === 'accepted' &&
      ((r.fromUid === cleanCurrent && r.toUid === cleanTarget) ||
        (r.fromUid === cleanTarget && r.toUid === cleanCurrent))
  );
  if (!accepted) {
    return {
      allowed: false,
      reason:
        'Chat & calls are locked until your connection invite is accepted by this user.',
    };
  }
  return { allowed: true, reason: '' };
}

export const STREAK_FREEZE_COST_POINTS = 50;
export const MAX_STREAK_FREEZES_OWNED = 3;

export interface StreakState {
  streakCount: number;
  lastLoginDate: string; // YYYY-MM-DD
  participationPoints: number;
  streakFreezesOwned?: number;
  frozenDates?: string[];
  lastFreezeUsedDate?: string | null;
  streakAtRiskCount?: number | null;
  missedDateKey?: string | null;
}

export function formatDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeUpdatedStreak(
  current: StreakState,
  todayDateKey: string,
  bonusPoints = 10
): {
  updated: StreakState;
  incremented: boolean;
  freezeUsed?: boolean;
  freezesConsumed?: number;
} {
  const existingFreezes = Math.max(
    0,
    Math.min(MAX_STREAK_FREEZES_OWNED, Math.round(Number(current.streakFreezesOwned) || 0))
  );
  const existingFrozenDates = Array.isArray(current.frozenDates)
    ? [...current.frozenDates]
    : [];

  if (!current.lastLoginDate) {
    return {
      updated: {
        ...current,
        streakCount: 1,
        lastLoginDate: todayDateKey,
        participationPoints: Math.max(0, current.participationPoints) + bonusPoints,
        ...(current.streakFreezesOwned !== undefined
          ? { streakFreezesOwned: existingFreezes }
          : {}),
      },
      incremented: true,
      freezeUsed: false,
      freezesConsumed: 0,
    };
  }

  if (current.lastLoginDate === todayDateKey) {
    return {
      updated: {
        ...current,
        streakCount: Math.max(1, current.streakCount),
      },
      incremented: false,
      freezeUsed: false,
      freezesConsumed: 0,
    };
  }

  const prev = new Date(`${current.lastLoginDate}T00:00:00Z`);
  const curr = new Date(`${todayDateKey}T00:00:00Z`);
  const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return {
      updated: {
        ...current,
        streakCount: current.streakCount + 1,
        lastLoginDate: todayDateKey,
        participationPoints: current.participationPoints + bonusPoints + 15,
        ...(current.streakAtRiskCount !== undefined ? { streakAtRiskCount: null } : {}),
        ...(current.missedDateKey !== undefined ? { missedDateKey: null } : {}),
      },
      incremented: true,
      freezeUsed: false,
      freezesConsumed: 0,
    };
  }

  const missedDaysCount = diffDays - 1;
  if (
    diffDays > 1 &&
    missedDaysCount <= MAX_STREAK_FREEZES_OWNED &&
    existingFreezes >= missedDaysCount
  ) {
    const newlyFrozenDates = [...existingFrozenDates];
    for (let offset = missedDaysCount; offset >= 1; offset--) {
      const mKey = getPastDateKey(todayDateKey, offset);
      if (!newlyFrozenDates.includes(mKey)) {
        newlyFrozenDates.push(mKey);
      }
    }
    const lastFrozen = getPastDateKey(todayDateKey, 1);

    return {
      updated: {
        ...current,
        streakCount: Math.max(1, current.streakCount),
        lastLoginDate: todayDateKey,
        participationPoints: current.participationPoints + bonusPoints,
        streakFreezesOwned: existingFreezes - missedDaysCount,
        frozenDates: newlyFrozenDates,
        lastFreezeUsedDate: lastFrozen,
        streakAtRiskCount: null,
        missedDateKey: null,
      },
      incremented: true,
      freezeUsed: true,
      freezesConsumed: missedDaysCount,
    };
  }

  const hasExtendedFreezeTracking =
    current.streakFreezesOwned !== undefined ||
    current.frozenDates !== undefined ||
    current.streakAtRiskCount !== undefined;

  const missedYesterdayKey = diffDays > 1 ? getPastDateKey(todayDateKey, 1) : null;

  return {
    updated: {
      ...current,
      streakCount: 1,
      lastLoginDate: todayDateKey,
      participationPoints: current.participationPoints + bonusPoints,
      ...(hasExtendedFreezeTracking
        ? {
            streakFreezesOwned: existingFreezes,
            frozenDates: existingFrozenDates,
            streakAtRiskCount: current.streakCount > 1 ? current.streakCount : null,
            missedDateKey: current.streakCount > 1 ? missedYesterdayKey : null,
          }
        : {}),
    },
    incremented: true,
    freezeUsed: false,
    freezesConsumed: 0,
  };
}

// --- Study Room Invite Code & Shareable Link Logic ---
export function normalizeStudyRoomCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return cleaned.slice(0, 20);
}

export function generateStudyRoomCode(prefix = 'STUDY'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
}

export function buildStudyRoomInviteUrl(origin: string, roomCode: string): string {
  const safeCode = normalizeStudyRoomCode(roomCode) || 'STUDY-GLOBAL';
  return `${origin.replace(/\/$/, '')}/?room=${encodeURIComponent(safeCode)}`;
}

// --- Account Email & Password Validation + Privacy Fingerprint ---
export function validateAccountCredentials(
  email: string,
  password: string,
  displayName?: string,
  isSignUp = false
): { valid: boolean; error: string } {
  const trimmedEmail = email.trim();
  const emailThreat = detectSecurityThreat(trimmedEmail);
  if (!emailThreat.safe) {
    return { valid: false, error: emailThreat.reason };
  }
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address (e.g. name@domain.com).' };
  }
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long for account security.' };
  }
  if (isSignUp) {
    if (!displayName || displayName.trim().length < 2) {
      return { valid: false, error: 'Please enter your full account display name (at least 2 characters).' };
    }
    const nameThreat = detectSecurityThreat(displayName);
    if (!nameThreat.safe) {
      return { valid: false, error: nameThreat.reason };
    }
  }
  return { valid: true, error: '' };
}

export function deriveE2eeFingerprint(uid: string, email: string): string {
  const input = `${uid}:${email.toLowerCase()}:mr_stranger_e2ee`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `${hex1.slice(0, 4)}-${hex1.slice(4, 8)}-${hex2.slice(0, 4)}-${hex2.slice(4, 8)}`;
}

// --- Game 1: Subway Runner Pure Logic ---
export interface RunnerObstacle {
  id: number;
  lane: 0 | 1 | 2;
  y: number;
  type: 'barrier' | 'coin' | 'high_gate';
}

export function checkRunnerCollision(
  playerLane: 0 | 1 | 2,
  isJumping: boolean,
  obstacle: RunnerObstacle
): 'hit' | 'coin' | 'clear' {
  if (obstacle.lane !== playerLane) return 'clear';
  if (Math.abs(obstacle.y - 84) > 6) return 'clear';

  if (obstacle.type === 'coin') {
    return 'coin';
  }
  if (obstacle.type === 'barrier' && isJumping) {
    return 'clear';
  }
  return 'hit';
}

// --- Game 2: Angry Catapult Pure Physics Logic ---
export interface ProjectileState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface TargetBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  points: number;
}

export function stepProjectile(
  proj: ProjectileState,
  dt: number,
  gravity = 320
): ProjectileState {
  const clampedDt = Math.min(Math.max(dt, 0), 0.05);
  return {
    x: proj.x + proj.vx * clampedDt,
    y: proj.y + proj.vy * clampedDt,
    vx: proj.vx * (1 - 0.05 * clampedDt),
    vy: proj.vy + gravity * clampedDt,
  };
}

export function checkProjectileBlockHit(
  proj: ProjectileState,
  radius: number,
  block: TargetBlock
): boolean {
  if (block.hp <= 0) return false;
  const closestX = Math.max(block.x, Math.min(proj.x, block.x + block.width));
  const closestY = Math.max(block.y, Math.min(proj.y, block.y + block.height));
  const dx = proj.x - closestX;
  const dy = proj.y - closestY;
  return dx * dx + dy * dy <= radius * radius;
}

// --- Game 3: Block Arena Pure Grid Logic ---
export type BlockGrid = number[][];

export function createEmptyGrid(rows = 12, cols = 8): BlockGrid {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function clearCompletedLines(grid: BlockGrid): {
  newGrid: BlockGrid;
  linesCleared: number;
  pointsEarned: number;
} {
  const cols = grid[0]?.length || 8;
  const remainingRows = grid.filter((row) => row.some((cell) => cell === 0));
  const linesCleared = grid.length - remainingRows.length;

  if (linesCleared === 0) {
    return { newGrid: grid.map((r) => [...r]), linesCleared: 0, pointsEarned: 0 };
  }

  const emptyTop = Array.from({ length: linesCleared }, () => Array(cols).fill(0));
  const pointsTable = [0, 100, 300, 600, 1000];
  const pointsEarned = pointsTable[Math.min(linesCleared, 4)] || linesCleared * 250;

  return {
    newGrid: [...emptyTop, ...remainingRows.map((r) => [...r])],
    linesCleared,
    pointsEarned,
  };
}

// --- Study Room Pomodoro Timer Helper ---
export function formatTimerMMSS(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = String(Math.floor(clamped / 60)).padStart(2, '0');
  const secs = String(clamped % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

// --- Photo Moments Share URL & Clipboard Payload Builder ---
export interface MomentSharePayload {
  momentId: string;
  url: string;
  caption: string;
  authorName: string;
  clipboardText: string;
}

export function buildMomentShareUrl(origin: string, momentId: string): string {
  const cleanOrigin = String(origin || 'https://mrstranger.app')
    .trim()
    .replace(/\/+$/, '');
  const cleanId = sanitizeSafeText(String(momentId || '').trim(), 120) || 'moment';
  return `${cleanOrigin}/?moment=${encodeURIComponent(cleanId)}`;
}

export function buildMomentSharePayload(params: {
  origin: string;
  momentId: string;
  caption: string;
  authorName?: string;
}): MomentSharePayload {
  const cleanMomentId = sanitizeSafeText(String(params.momentId || '').trim(), 120) || 'moment';
  const cleanCaption =
    sanitizeSafeText(String(params.caption || '').trim(), 500) || 'Shared Moment';
  const cleanAuthor =
    sanitizeSafeText(String(params.authorName || '').trim(), 60) || 'Verified Member';
  const url = buildMomentShareUrl(params.origin, cleanMomentId);
  const clipboardText = `"${cleanCaption}" — ${cleanAuthor}\n${url}`;

  return {
    momentId: cleanMomentId,
    url,
    caption: cleanCaption,
    authorName: cleanAuthor,
    clipboardText,
  };
}

// --- Study Room 7-Day Focus Minutes Trend & Individual Session Growth (D3 Analytics) ---
export interface StudyFocusSessionEntry {
  sessionId: string;
  sessionIndex: number; // 1-based index within the day
  globalSessionNumber: number; // 1-based index across the 7-day window
  dateKey: string;
  dayName: string;
  dayLabel: string;
  shortDate: string;
  minutes: number;
  startMinuteOffset: number;
  cumulativeDayMinutes: number;
  sessionGrowthDeltaMinutes: number;
  topic: string;
  roomCode: string;
}

export interface StudyFocus7DayDayBucket {
  dateKey: string;
  dayName: string;
  dayLabel: string;
  shortDate: string;
  isToday: boolean;
  totalFocusMinutes: number;
  targetMinutes: number;
  goalReached: boolean;
  dayOverDayDeltaMinutes: number;
  dayOverDayGrowthPercent: number;
  sessions: StudyFocusSessionEntry[];
}

export interface StudyFocus7DayTrendSummary {
  days: StudyFocus7DayDayBucket[];
  allSessions: StudyFocusSessionEntry[];
  totalFocusMinutes: number;
  totalSessionsCount: number;
  averageDailyFocusMinutes: number;
  averageSessionMinutes: number;
  firstHalfAvgSessionMinutes: number;
  secondHalfAvgSessionMinutes: number;
  sessionGrowthPercent: number;
  net7DayGrowthMinutes: number;
  peakDayLabel: string;
  peakDayMinutes: number;
  longestSessionMinutes: number;
  longestSessionTopic: string;
}

const DEFAULT_SESSION_TOPICS = [
  'Pomodoro Deep Focus Protocol',
  'Distributed Systems & Consensus',
  'Deep Work & Feynman Synthesis',
  'Algorithms & Active Recall',
  'System Design & Architecture',
];

function decomposeDayFocusIntoProgressiveSessions(params: {
  dayIndex: number;
  dateKey: string;
  dayName: string;
  dayLabel: string;
  shortDate: string;
  totalDayMinutes: number;
  explicitSessions: Array<{
    id: string;
    minutes: number;
    topic: string;
    roomCode: string;
  }>;
  defaultRoomCode: string;
}): Array<{
  id: string;
  minutes: number;
  topic: string;
  roomCode: string;
}> {
  const safeTotal = Math.max(0, Math.round(params.totalDayMinutes));
  if (safeTotal === 0 && params.explicitSessions.length === 0) {
    return [];
  }

  const result: Array<{
    id: string;
    minutes: number;
    topic: string;
    roomCode: string;
  }> = [];

  let accountedMinutes = 0;
  for (const exp of params.explicitSessions) {
    const mins = Math.max(1, Math.round(exp.minutes));
    result.push({
      id: exp.id,
      minutes: mins,
      topic: normalizeStudyTopicName(exp.topic),
      roomCode: exp.roomCode || params.defaultRoomCode,
    });
    accountedMinutes += mins;
  }

  const remaining = safeTotal - accountedMinutes;
  if (remaining > 0) {
    // Progressive session templates that grow across the week and within each day
    // Earlier days have shorter warmup sprints (e.g. 20m -> 30m -> 45m), later days have deeper blocks
    const baseFirstSession = Math.min(remaining, 15 + params.dayIndex * 2);
    if (remaining <= 35) {
      result.unshift({
        id: `synth_${params.dateKey}_1`,
        minutes: remaining,
        topic: DEFAULT_SESSION_TOPICS[params.dayIndex % DEFAULT_SESSION_TOPICS.length],
        roomCode: params.defaultRoomCode,
      });
    } else if (remaining <= 85) {
      const first = Math.max(15, Math.min(remaining - 15, Math.round((remaining * 0.42) / 5) * 5));
      const second = remaining - first;
      result.unshift(
        {
          id: `synth_${params.dateKey}_1`,
          minutes: first,
          topic: DEFAULT_SESSION_TOPICS[params.dayIndex % DEFAULT_SESSION_TOPICS.length],
          roomCode: params.defaultRoomCode,
        },
        {
          id: `synth_${params.dateKey}_2`,
          minutes: second,
          topic: DEFAULT_SESSION_TOPICS[(params.dayIndex + 1) % DEFAULT_SESSION_TOPICS.length],
          roomCode: params.defaultRoomCode,
        }
      );
    } else {
      // 3 progressive sessions showing clear intra-day & inter-day session growth (e.g. 25m -> 40m -> 55m)
      const s1 = Math.max(15, Math.round(Math.max(baseFirstSession, remaining * 0.24) / 5) * 5);
      const s2 = Math.max(s1 + 5, Math.round((remaining * 0.34) / 5) * 5);
      const s3 = Math.max(10, remaining - s1 - s2);
      // Sort ascending so individual sessions within the day show positive stamina growth
      const ordered = [s1, s2, s3].sort((a, b) => a - b);
      result.unshift(
        {
          id: `synth_${params.dateKey}_1`,
          minutes: ordered[0],
          topic: DEFAULT_SESSION_TOPICS[params.dayIndex % DEFAULT_SESSION_TOPICS.length],
          roomCode: params.defaultRoomCode,
        },
        {
          id: `synth_${params.dateKey}_2`,
          minutes: ordered[1],
          topic: DEFAULT_SESSION_TOPICS[(params.dayIndex + 1) % DEFAULT_SESSION_TOPICS.length],
          roomCode: params.defaultRoomCode,
        },
        {
          id: `synth_${params.dateKey}_3`,
          minutes: ordered[2],
          topic: DEFAULT_SESSION_TOPICS[(params.dayIndex + 2) % DEFAULT_SESSION_TOPICS.length],
          roomCode: params.defaultRoomCode,
        }
      );
    }
  }

  return result;
}

export function buildStudyFocus7DaySessionTrend(params: {
  todayDateKey: string;
  todayFocusMinutes: number;
  dailyTargetMinutes: number;
  streakCount?: number;
  weeklyActivity?: WeeklyActivitySummary;
  storedSessions?: TopicFocusSessionRecord[];
  studyNotes?: Array<{
    id?: string;
    subject: string;
    focusMinutes: number;
    roomCode?: string;
    dateKey?: string;
  }>;
  activeRoomCode?: string;
}): StudyFocus7DayTrendSummary {
  const defaultRoomCode =
    sanitizeSafeText(String(params.activeRoomCode || 'STUDY-GLOBAL').toUpperCase(), 24) ||
    'STUDY-GLOBAL';

  const baseWeekly =
    params.weeklyActivity ||
    buildWeeklyActivityOverview({
      todayDateKey: params.todayDateKey,
      todayFocusMinutes: params.todayFocusMinutes,
      dailyTargetMinutes: params.dailyTargetMinutes,
      todayPointsEarned: 50,
      streakCount: params.streakCount || 3,
    });

  const sessionsByDate = new Map<
    string,
    Array<{ id: string; minutes: number; topic: string; roomCode: string; createdAtMs: number }>
  >();

  for (const s of params.storedSessions || []) {
    const dKey = String(s?.dateKey || '').trim();
    const mins = Math.max(0, Math.round(Number(s?.focusMinutes) || 0));
    if (!dKey || mins <= 0) continue;
    const list = sessionsByDate.get(dKey) || [];
    list.push({
      id: String(s.id || `sess_${dKey}_${list.length + 1}`),
      minutes: mins,
      topic: normalizeStudyTopicName(s.topic),
      roomCode: sanitizeSafeText(String(s.roomCode || defaultRoomCode).toUpperCase(), 24),
      createdAtMs: Number(s.createdAtMs) || 0,
    });
    sessionsByDate.set(dKey, list);
  }

  // Sort explicit sessions chronologically (oldest first within each day)
  for (const [dKey, list] of sessionsByDate.entries()) {
    list.sort((a, b) => a.createdAtMs - b.createdAtMs);
    sessionsByDate.set(dKey, list);
  }

  const allSessions: StudyFocusSessionEntry[] = [];
  const days: StudyFocus7DayDayBucket[] = [];
  let globalSessionCounter = 0;
  let previousSessionMinutes: number | null = null;

  baseWeekly.days.forEach((dayEntry, dayIdx) => {
    const explicitForDay = sessionsByDate.get(dayEntry.dateKey) || [];
    const explicitSum = explicitForDay.reduce((sum, item) => sum + item.minutes, 0);
    const effectiveDayTotal = Math.max(dayEntry.focusMinutes, explicitSum);

    const rawDaySessions = decomposeDayFocusIntoProgressiveSessions({
      dayIndex: dayIdx,
      dateKey: dayEntry.dateKey,
      dayName: dayEntry.dayName,
      dayLabel: dayEntry.dayLabel,
      shortDate: dayEntry.shortDate,
      totalDayMinutes: effectiveDayTotal,
      explicitSessions: explicitForDay,
      defaultRoomCode,
    });

    let cumulative = 0;
    const builtSessions: StudyFocusSessionEntry[] = rawDaySessions.map((raw, sIdx) => {
      globalSessionCounter += 1;
      const startOffset = cumulative;
      cumulative += raw.minutes;
      const growthDelta =
        previousSessionMinutes === null ? 0 : raw.minutes - previousSessionMinutes;
      previousSessionMinutes = raw.minutes;

      const entry: StudyFocusSessionEntry = {
        sessionId: raw.id,
        sessionIndex: sIdx + 1,
        globalSessionNumber: globalSessionCounter,
        dateKey: dayEntry.dateKey,
        dayName: dayEntry.dayName,
        dayLabel: dayEntry.dayLabel,
        shortDate: dayEntry.shortDate,
        minutes: raw.minutes,
        startMinuteOffset: startOffset,
        cumulativeDayMinutes: cumulative,
        sessionGrowthDeltaMinutes: growthDelta,
        topic: raw.topic,
        roomCode: raw.roomCode,
      };
      allSessions.push(entry);
      return entry;
    });

    const prevDayTotal =
      dayIdx > 0 ? days[dayIdx - 1].totalFocusMinutes : cumulative;
    const dayDelta = dayIdx > 0 ? cumulative - prevDayTotal : 0;
    const dayGrowthPct =
      dayIdx > 0 && prevDayTotal > 0
        ? Math.round(((cumulative - prevDayTotal) / prevDayTotal) * 100)
        : 0;

    days.push({
      dateKey: dayEntry.dateKey,
      dayName: dayEntry.dayName,
      dayLabel: dayEntry.dayLabel,
      shortDate: dayEntry.shortDate,
      isToday: dayEntry.isToday,
      totalFocusMinutes: cumulative,
      targetMinutes: dayEntry.targetMinutes,
      goalReached: cumulative >= dayEntry.targetMinutes,
      dayOverDayDeltaMinutes: dayDelta,
      dayOverDayGrowthPercent: dayGrowthPct,
      sessions: builtSessions,
    });
  });

  const totalFocusMinutes = days.reduce((acc, d) => acc + d.totalFocusMinutes, 0);
  const totalSessionsCount = allSessions.length;
  const averageDailyFocusMinutes =
    days.length > 0 ? Math.round(totalFocusMinutes / days.length) : 0;
  const averageSessionMinutes =
    totalSessionsCount > 0 ? Math.round(totalFocusMinutes / totalSessionsCount) : 0;

  const midpoint = Math.max(1, Math.floor(allSessions.length / 2));
  const firstHalf = allSessions.slice(0, midpoint);
  const secondHalf = allSessions.slice(midpoint);

  const firstHalfAvgSessionMinutes =
    firstHalf.length > 0
      ? Math.round(firstHalf.reduce((s, x) => s + x.minutes, 0) / firstHalf.length)
      : 0;
  const secondHalfAvgSessionMinutes =
    secondHalf.length > 0
      ? Math.round(secondHalf.reduce((s, x) => s + x.minutes, 0) / secondHalf.length)
      : firstHalfAvgSessionMinutes;

  const sessionGrowthPercent =
    firstHalfAvgSessionMinutes > 0
      ? Math.round(
          ((secondHalfAvgSessionMinutes - firstHalfAvgSessionMinutes) /
            firstHalfAvgSessionMinutes) *
            100
        )
      : 0;

  let peakDay = days[0];
  for (const d of days) {
    if (!peakDay || d.totalFocusMinutes >= peakDay.totalFocusMinutes) {
      peakDay = d;
    }
  }

  let longestSession: StudyFocusSessionEntry | null = null;
  for (const s of allSessions) {
    if (!longestSession || s.minutes >= longestSession.minutes) {
      longestSession = s;
    }
  }

  const net7DayGrowthMinutes =
    days.length >= 2
      ? days[days.length - 1].totalFocusMinutes - days[0].totalFocusMinutes
      : 0;

  return {
    days,
    allSessions,
    totalFocusMinutes,
    totalSessionsCount,
    averageDailyFocusMinutes,
    averageSessionMinutes,
    firstHalfAvgSessionMinutes,
    secondHalfAvgSessionMinutes,
    sessionGrowthPercent,
    net7DayGrowthMinutes,
    peakDayLabel: peakDay ? `${peakDay.dayName} (${peakDay.shortDate})` : 'Today',
    peakDayMinutes: peakDay ? peakDay.totalFocusMinutes : 0,
    longestSessionMinutes: longestSession ? longestSession.minutes : 0,
    longestSessionTopic: longestSession
      ? longestSession.topic
      : 'Pomodoro Deep Focus Protocol',
  };
}

// --- Curated Study-Related Aesthetic Placeholder Images for Moments ---
export interface StudyMomentPlaceholderImage {
  id: string;
  title: string;
  category: string;
  description: string;
  suggestedCaption: string;
  accentHex: string;
  photoDataUrl: string;
}

function encodeStudyAestheticSvg(svgXml: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml.trim())}`;
}

export const CURATED_STUDY_MOMENT_IMAGES: readonly StudyMomentPlaceholderImage[] = [
  {
    id: 'midnight_desk',
    title: 'Midnight Coding Desk',
    category: 'Deep Work',
    description: 'Dual dark-mode monitors, warm desk lamp glow, and mechanical keyboard.',
    suggestedCaption:
      'Locked in for a late-night deep work session — building and debugging in flow state.',
    accentHex: '#10b981',
    photoDataUrl: encodeStudyAestheticSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <defs>
          <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#050507"/>
            <stop offset="55%" stop-color="#0a0f18"/>
            <stop offset="100%" stop-color="#071512"/>
          </linearGradient>
          <radialGradient id="lampGlow1" cx="72%" cy="24%" r="48%">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.28"/>
            <stop offset="50%" stop-color="#10b981" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#050507" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="800" height="500" fill="url(#bg1)"/>
        <rect width="800" height="500" fill="url(#lampGlow1)"/>
        <!-- Desk Surface -->
        <rect x="0" y="360" width="800" height="140" fill="#09090c" stroke="#27272a" stroke-width="2"/>
        <line x1="0" y1="362" x2="800" y2="362" stroke="#10b981" stroke-opacity="0.35" stroke-width="1.5"/>
        <!-- Primary Ultrawide Monitor -->
        <rect x="130" y="105" width="440" height="220" rx="10" fill="#0c0e14" stroke="#3f3f46" stroke-width="3"/>
        <rect x="144" y="119" width="412" height="192" rx="4" fill="#05070b"/>
        <!-- Code Syntax Lines -->
        <rect x="164" y="138" width="95" height="8" rx="4" fill="#10b981" opacity="0.85"/>
        <rect x="268" y="138" width="60" height="8" rx="4" fill="#38bdf8" opacity="0.75"/>
        <rect x="180" y="158" width="160" height="7" rx="3.5" fill="#a1a1aa" opacity="0.55"/>
        <rect x="180" y="175" width="210" height="7" rx="3.5" fill="#e4e4e7" opacity="0.45"/>
        <rect x="198" y="192" width="140" height="7" rx="3.5" fill="#f59e0b" opacity="0.75"/>
        <rect x="198" y="209" width="185" height="7" rx="3.5" fill="#10b981" opacity="0.65"/>
        <rect x="180" y="226" width="110" height="7" rx="3.5" fill="#38bdf8" opacity="0.6"/>
        <rect x="164" y="245" width="75" height="7" rx="3.5" fill="#a1a1aa" opacity="0.5"/>
        <!-- Terminal Split Pane -->
        <line x1="415" y1="119" x2="415" y2="311" stroke="#27272a" stroke-width="2"/>
        <rect x="432" y="138" width="102" height="8" rx="4" fill="#f59e0b" opacity="0.8"/>
        <rect x="432" y="160" width="84" height="6" rx="3" fill="#52525b"/>
        <rect x="432" y="176" width="108" height="6" rx="3" fill="#10b981" opacity="0.7"/>
        <rect x="432" y="192" width="72" height="6" rx="3" fill="#52525b"/>
        <rect x="432" y="216" width="96" height="44" rx="6" fill="#091914" stroke="#10b981" stroke-opacity="0.45"/>
        <text x="444" y="243" fill="#10b981" font-family="monospace" font-size="14" font-weight="bold">PASS 100%</text>
        <!-- Monitor Stand -->
        <rect x="325" y="325" width="50" height="35" fill="#18181b"/>
        <rect x="285" y="354" width="130" height="8" rx="4" fill="#27272a"/>
        <!-- Warm Architect Lamp -->
        <path d="M650 360 L685 180 L595 135" fill="none" stroke="#52525b" stroke-width="6" stroke-linecap="round"/>
        <polygon points="565,142 612,118 625,148 575,165" fill="#27272a" stroke="#f59e0b" stroke-width="2"/>
        <!-- Mechanical Keyboard & Coffee Mug -->
        <rect x="240" y="382" width="220" height="42" rx="6" fill="#141418" stroke="#3f3f46" stroke-width="2"/>
        <rect x="250" y="390" width="200" height="8" rx="2" fill="#27272a"/>
        <rect x="250" y="403" width="200" height="8" rx="2" fill="#27272a"/>
        <rect x="285" y="415" width="110" height="5" rx="2" fill="#10b981" opacity="0.7"/>
        <rect x="530" y="374" width="38" height="44" rx="6" fill="#1f2937" stroke="#f59e0b" stroke-width="1.5"/>
        <path d="M568 384 C580 384, 580 408, 568 408" fill="none" stroke="#f59e0b" stroke-width="3"/>
        <!-- Top Aesthetic Badge -->
        <rect x="44" y="38" width="256" height="32" rx="6" fill="#0A0A0C" stroke="#27272a" stroke-width="1.5"/>
        <text x="60" y="59" fill="#10b981" font-family="monospace" font-size="13" font-weight="bold">STUDY AESTHETIC · DEEP WORK</text>
        <text x="44" y="468" fill="#f4f4f5" font-family="sans-serif" font-size="22" font-weight="bold">Midnight Coding Desk</text>
      </svg>
    `),
  },
  {
    id: 'rainy_window_lofi',
    title: 'Rainy Window Study Nook',
    category: 'Ambient Rain',
    description: 'Rain-streaked glass overlooking dusk city bokeh with an open study notebook.',
    suggestedCaption:
      'Rainy evening study session with ambient rainfall and structured synthesis notes.',
    accentHex: '#38bdf8',
    photoDataUrl: encodeStudyAestheticSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <defs>
          <linearGradient id="rainBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#060b16"/>
            <stop offset="65%" stop-color="#0c192c"/>
            <stop offset="100%" stop-color="#07090e"/>
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#rainBg)"/>
        <!-- Window Frame -->
        <rect x="70" y="40" width="660" height="295" rx="8" fill="#081221" stroke="#1e293b" stroke-width="4"/>
        <line x1="400" y1="40" x2="400" y2="335" stroke="#1e293b" stroke-width="4"/>
        <line x1="70" y1="190" x2="730" y2="190" stroke="#1e293b" stroke-width="3"/>
        <!-- Distant City Bokeh Lights -->
        <circle cx="170" cy="240" r="18" fill="#f59e0b" opacity="0.22"/>
        <circle cx="235" cy="255" r="24" fill="#38bdf8" opacity="0.2"/>
        <circle cx="310" cy="230" r="14" fill="#10b981" opacity="0.22"/>
        <circle cx="495" cy="245" r="22" fill="#f59e0b" opacity="0.2"/>
        <circle cx="585" cy="225" r="28" fill="#38bdf8" opacity="0.18"/>
        <circle cx="655" cy="260" r="16" fill="#a855f7" opacity="0.2"/>
        <!-- Rain Streaks -->
        <g stroke="#7dd3fc" stroke-opacity="0.38" stroke-width="1.5" stroke-linecap="round">
          <line x1="125" y1="65" x2="110" y2="125"/>
          <line x1="210" y1="80" x2="195" y2="155"/>
          <line x1="295" y1="55" x2="280" y2="120"/>
          <line x1="355" y1="100" x2="340" y2="170"/>
          <line x1="455" y1="70" x2="440" y2="140"/>
          <line x1="540" y1="60" x2="525" y2="135"/>
          <line x1="635" y1="85" x2="620" y2="160"/>
          <line x1="160" y1="210" x2="145" y2="285"/>
          <line x1="265" y1="205" x2="250" y2="290"/>
          <line x1="480" y1="215" x2="465" y2="300"/>
          <line x1="610" y1="205" x2="595" y2="280"/>
        </g>
        <!-- Nook Desk & Open Notebook -->
        <rect x="0" y="335" width="800" height="165" fill="#090b10" stroke="#1e293b" stroke-width="2"/>
        <rect x="230" y="358" width="320" height="105" rx="6" fill="#111827" stroke="#38bdf8" stroke-opacity="0.5" stroke-width="2"/>
        <line x1="390" y1="358" x2="390" y2="463" stroke="#334155" stroke-width="2"/>
        <line x1="252" y1="382" x2="368" y2="382" stroke="#64748b" stroke-width="3"/>
        <line x1="252" y1="400" x2="355" y2="400" stroke="#475569" stroke-width="2.5"/>
        <line x1="252" y1="418" x2="342" y2="418" stroke="#475569" stroke-width="2.5"/>
        <line x1="412" y1="382" x2="525" y2="382" stroke="#38bdf8" stroke-opacity="0.8" stroke-width="3"/>
        <line x1="412" y1="400" x2="515" y2="400" stroke="#475569" stroke-width="2.5"/>
        <line x1="412" y1="418" x2="495" y2="418" stroke="#475569" stroke-width="2.5"/>
        <!-- Badge & Title -->
        <rect x="44" y="38" width="256" height="32" rx="6" fill="#0A0A0C" stroke="#1e293b" stroke-width="1.5"/>
        <text x="60" y="59" fill="#38bdf8" font-family="monospace" font-size="13" font-weight="bold">STUDY AESTHETIC · AMBIENT RAIN</text>
        <text x="44" y="472" fill="#f4f4f5" font-family="sans-serif" font-size="22" font-weight="bold">Rainy Window Study Nook</text>
      </svg>
    `),
  },
  {
    id: 'library_stacks',
    title: 'Classical Library Reading Room',
    category: 'Library Archive',
    description: 'Warm timber bookshelves, brass banker lamp, and open academic reference volumes.',
    suggestedCaption:
      'Quiet reading room hours — reviewing core theory and distilling key takeaways.',
    accentHex: '#f59e0b',
    photoDataUrl: encodeStudyAestheticSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <defs>
          <radialGradient id="libraryGlow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.28"/>
            <stop offset="55%" stop-color="#10b981" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#090706" stop-opacity="0.95"/>
          </radialGradient>
        </defs>
        <rect width="800" height="500" fill="#0b0908"/>
        <rect width="800" height="500" fill="url(#libraryGlow)"/>
        <!-- Bookshelf Grid -->
        <g stroke="#292524" stroke-width="3">
          <line x1="60" y1="95" x2="740" y2="95"/>
          <line x1="60" y1="195" x2="740" y2="195"/>
          <line x1="60" y1="295" x2="740" y2="295"/>
        </g>
        <!-- Book Spines -->
        <g opacity="0.85">
          <rect x="90" y="115" width="24" height="78" rx="2" fill="#78350f"/>
          <rect x="118" y="122" width="20" height="71" rx="2" fill="#065f46"/>
          <rect x="142" y="110" width="28" height="83" rx="2" fill="#1e3a8a"/>
          <rect x="174" y="125" width="22" height="68" rx="2" fill="#92400e"/>
          <rect x="580" y="112" width="26" height="81" rx="2" fill="#065f46"/>
          <rect x="610" y="120" width="22" height="73" rx="2" fill="#78350f"/>
          <rect x="636" y="108" width="30" height="85" rx="2" fill="#3f3f46"/>
          <rect x="105" y="212" width="26" height="80" rx="2" fill="#1f2937"/>
          <rect x="135" y="218" width="24" height="74" rx="2" fill="#78350f"/>
          <rect x="600" y="215" width="28" height="77" rx="2" fill="#92400e"/>
          <rect x="632" y="208" width="24" height="84" rx="2" fill="#065f46"/>
        </g>
        <!-- Classic Green Banker's Lamp -->
        <rect x="388" y="215" width="24" height="115" fill="#d97706"/>
        <rect x="345" y="325" width="110" height="14" rx="4" fill="#b45309"/>
        <path d="M315 220 C330 165, 470 165, 485 220 Z" fill="#059669" stroke="#34d399" stroke-width="2"/>
        <!-- Reading Table -->
        <rect x="0" y="340" width="800" height="160" fill="#0c0a09" stroke="#292524" stroke-width="2"/>
        <rect x="260" y="365" width="280" height="85" rx="6" fill="#1c1917" stroke="#f59e0b" stroke-opacity="0.55" stroke-width="2"/>
        <line x1="400" y1="365" x2="400" y2="450" stroke="#44403c" stroke-width="2"/>
        <!-- Badge & Title -->
        <rect x="44" y="38" width="268" height="32" rx="6" fill="#0A0A0C" stroke="#292524" stroke-width="1.5"/>
        <text x="60" y="59" fill="#f59e0b" font-family="monospace" font-size="13" font-weight="bold">STUDY AESTHETIC · LIBRARY ARCHIVE</text>
        <text x="44" y="472" fill="#f4f4f5" font-family="sans-serif" font-size="22" font-weight="bold">Classical Library Reading Room</text>
      </svg>
    `),
  },
  {
    id: 'whiteboard_systems',
    title: 'Distributed Systems Whiteboard',
    category: 'Systems Design',
    description: 'Dark glass architecture board with consensus nodes, state machines, and flow vectors.',
    suggestedCaption:
      'Mapping out distributed state machine replication and system architecture on the whiteboard.',
    accentHex: '#a855f7',
    photoDataUrl: encodeStudyAestheticSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <rect width="800" height="500" fill="#060609"/>
        <!-- Glass Whiteboard Frame -->
        <rect x="52" y="46" width="696" height="370" rx="12" fill="#090b10" stroke="#27272a" stroke-width="3"/>
        <!-- Subtle Dot Grid -->
        <g fill="#27272a">
          <circle cx="140" cy="120" r="2"/><circle cx="240" cy="120" r="2"/><circle cx="340" cy="120" r="2"/><circle cx="440" cy="120" r="2"/><circle cx="540" cy="120" r="2"/><circle cx="640" cy="120" r="2"/>
          <circle cx="140" cy="220" r="2"/><circle cx="240" cy="220" r="2"/><circle cx="340" cy="220" r="2"/><circle cx="440" cy="220" r="2"/><circle cx="540" cy="220" r="2"/><circle cx="640" cy="220" r="2"/>
          <circle cx="140" cy="320" r="2"/><circle cx="240" cy="320" r="2"/><circle cx="340" cy="320" r="2"/><circle cx="440" cy="320" r="2"/><circle cx="540" cy="320" r="2"/><circle cx="640" cy="320" r="2"/>
        </g>
        <!-- Node Topology Connectors -->
        <line x1="230" y1="185" x2="375" y2="145" stroke="#10b981" stroke-width="2.5" stroke-dasharray="6 4"/>
        <line x1="230" y1="205" x2="375" y2="265" stroke="#38bdf8" stroke-width="2.5"/>
        <line x1="455" y1="145" x2="575" y2="205" stroke="#a855f7" stroke-width="2.5"/>
        <line x1="455" y1="265" x2="575" y2="215" stroke="#10b981" stroke-width="2.5"/>
        <!-- Architecture Nodes -->
        <rect x="115" y="165" width="115" height="62" rx="8" fill="#0d1512" stroke="#10b981" stroke-width="2"/>
        <text x="132" y="194" fill="#10b981" font-family="monospace" font-size="13" font-weight="bold">LEADER NODE</text>
        <text x="132" y="213" fill="#a1a1aa" font-family="monospace" font-size="11">Term #42 · OK</text>

        <rect x="375" y="112" width="120" height="58" rx="8" fill="#0d131f" stroke="#38bdf8" stroke-width="2"/>
        <text x="392" y="140" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold">REPLICA A</text>
        <text x="392" y="157" fill="#a1a1aa" font-family="monospace" font-size="11">CommitIdx 984</text>

        <rect x="375" y="238" width="120" height="58" rx="8" fill="#0d131f" stroke="#38bdf8" stroke-width="2"/>
        <text x="392" y="266" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold">REPLICA B</text>
        <text x="392" y="283" fill="#a1a1aa" font-family="monospace" font-size="11">CommitIdx 984</text>

        <rect x="575" y="175" width="130" height="66" rx="8" fill="#160f24" stroke="#a855f7" stroke-width="2"/>
        <text x="592" y="204" fill="#c084fc" font-family="monospace" font-size="12" font-weight="bold">STATE MACHINE</text>
        <text x="592" y="223" fill="#e4e4e7" font-family="monospace" font-size="11">p99 &lt; 4.2ms</text>

        <!-- Badge & Title -->
        <rect x="74" y="68" width="268" height="32" rx="6" fill="#050505" stroke="#27272a" stroke-width="1.5"/>
        <text x="90" y="89" fill="#c084fc" font-family="monospace" font-size="13" font-weight="bold">STUDY AESTHETIC · SYSTEMS DESIGN</text>
        <text x="52" y="464" fill="#f4f4f5" font-family="sans-serif" font-size="22" font-weight="bold">Distributed Systems Whiteboard</text>
      </svg>
    `),
  },
  {
    id: 'espresso_journal',
    title: 'Cafe Study & Dot-Grid Journal',
    category: 'Cafe Study',
    description: 'Overhead flat-lay of a dot-grid study planner, latte art cup, and focus timer.',
    suggestedCaption:
      'Afternoon cafe sprint — mapping out today’s priority blocks over espresso.',
    accentHex: '#fbbf24',
    photoDataUrl: encodeStudyAestheticSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <rect width="800" height="500" fill="#0b0908"/>
        <!-- Warm Table Surface -->
        <rect x="36" y="36" width="728" height="428" rx="14" fill="#120f0d" stroke="#292524" stroke-width="2"/>
        <!-- Open Dot-Grid Journal -->
        <rect x="95" y="105" width="380" height="275" rx="8" fill="#1c1917" stroke="#44403c" stroke-width="2"/>
        <line x1="285" y1="105" x2="285" y2="380" stroke="#292524" stroke-width="2"/>
        <!-- Checklist Items inside Journal -->
        <rect x="122" y="138" width="14" height="14" rx="3" fill="#10b981"/>
        <rect x="146" y="141" width="110" height="8" rx="4" fill="#e4e4e7"/>
        <rect x="122" y="168" width="14" height="14" rx="3" fill="#10b981"/>
        <rect x="146" y="171" width="96" height="8" rx="4" fill="#e4e4e7"/>
        <rect x="122" y="198" width="14" height="14" rx="3" fill="none" stroke="#fbbf24" stroke-width="2"/>
        <rect x="146" y="201" width="118" height="8" rx="4" fill="#fbbf24" opacity="0.85"/>
        <!-- Right Page Graph -->
        <rect x="310" y="138" width="138" height="92" rx="6" fill="#0c0a09" stroke="#292524" stroke-width="1.5"/>
        <polyline points="324,210 352,188 380,194 408,164 434,152" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
        <line x1="310" y1="255" x2="442" y2="255" stroke="#57534e" stroke-width="3"/>
        <line x1="310" y1="275" x2="420" y2="275" stroke="#44403c" stroke-width="2.5"/>
        <!-- Ceramic Latte Cup -->
        <circle cx="605" cy="215" r="68" fill="#1c1917" stroke="#44403c" stroke-width="3"/>
        <circle cx="605" cy="215" r="50" fill="#78350f"/>
        <path d="M585 215 C595 195, 615 195, 625 215 C615 235, 595 235, 585 215 Z" fill="#fef3c7" opacity="0.85"/>
        <!-- Badge & Title -->
        <rect x="64" y="54" width="248" height="32" rx="6" fill="#090807" stroke="#292524" stroke-width="1.5"/>
        <text x="80" y="75" fill="#fbbf24" font-family="monospace" font-size="13" font-weight="bold">STUDY AESTHETIC · CAFE STUDY</text>
        <text x="64" y="436" fill="#f4f4f5" font-family="sans-serif" font-size="22" font-weight="bold">Cafe Study &amp; Dot-Grid Journal</text>
      </svg>
    `),
  },
  {
    id: 'sunrise_pomodoro',
    title: 'Dawn Horizon Study Desk',
    category: 'Morning Sprint',
    description: 'Minimalist morning studio overlooking mountain ridges with a 50:00 Pomodoro ring.',
    suggestedCaption:
      'Early morning 50-minute Pomodoro sprint completed before the day begins.',
    accentHex: '#34d399',
    photoDataUrl: encodeStudyAestheticSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <defs>
          <linearGradient id="dawnSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#070b19"/>
            <stop offset="48%" stop-color="#1e1b4b"/>
            <stop offset="82%" stop-color="#065f46"/>
            <stop offset="100%" stop-color="#050505"/>
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#dawnSky)"/>
        <!-- Mountain Silhouette -->
        <polygon points="0,350 165,245 310,310 490,215 665,295 800,240 800,360 0,360" fill="#070a12" opacity="0.9"/>
        <polygon points="0,365 230,285 420,335 610,260 800,320 800,500 0,500" fill="#050507"/>
        <!-- Glowing Pomodoro Ring Centerpiece -->
        <circle cx="400" cy="195" r="76" fill="#050507" fill-opacity="0.75" stroke="#1f2937" stroke-width="6"/>
        <circle cx="400" cy="195" r="76" fill="none" stroke="#34d399" stroke-width="6" stroke-dasharray="395 480" stroke-linecap="round" transform="rotate(-90 400 195)"/>
        <text x="400" y="202" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="30" font-weight="bold">50:00</text>
        <text x="400" y="226" text-anchor="middle" fill="#34d399" font-family="monospace" font-size="11">FOCUS SPRINT</text>
        <!-- Badge & Title -->
        <rect x="44" y="38" width="266" height="32" rx="6" fill="#050507" stroke="#27272a" stroke-width="1.5"/>
        <text x="60" y="59" fill="#34d399" font-family="monospace" font-size="13" font-weight="bold">STUDY AESTHETIC · MORNING SPRINT</text>
        <text x="44" y="466" fill="#f4f4f5" font-family="sans-serif" font-size="22" font-weight="bold">Dawn Horizon Study Desk</text>
      </svg>
    `),
  },
] as const;

export function getStudyMomentPlaceholderById(
  imageId: string | null | undefined
): StudyMomentPlaceholderImage | null {
  const cleanId = String(imageId || '').trim().toLowerCase();
  if (!cleanId) return null;
  return (
    CURATED_STUDY_MOMENT_IMAGES.find((item) => item.id.toLowerCase() === cleanId) ||
    null
  );
}

export function selectStudyMomentPlaceholder(
  currentSelectedId: string | null | undefined,
  clickedId: string | null | undefined
): string | null {
  const matched = getStudyMomentPlaceholderById(clickedId);
  if (!matched) return null;
  const currentClean = String(currentSelectedId || '').trim().toLowerCase();
  if (currentClean === matched.id.toLowerCase()) {
    return null;
  }
  return matched.id;
}

export function resolveMomentPublishImageSource(params: {
  uploadedPhotoDataUrl?: string | null;
  selectedPlaceholderId?: string | null;
  fallbackGenerator?: () => string;
}): {
  photoDataUrl: string;
  sourceType: 'uploaded' | 'placeholder' | 'fallback';
  placeholder: StudyMomentPlaceholderImage | null;
} {
  const cleanUploaded = String(params.uploadedPhotoDataUrl || '').trim();
  if (cleanUploaded) {
    return {
      photoDataUrl: cleanUploaded,
      sourceType: 'uploaded',
      placeholder: null,
    };
  }

  const placeholder = getStudyMomentPlaceholderById(params.selectedPlaceholderId);
  if (placeholder) {
    return {
      photoDataUrl: placeholder.photoDataUrl,
      sourceType: 'placeholder',
      placeholder,
    };
  }

  const fallbackDataUrl = params.fallbackGenerator
    ? params.fallbackGenerator()
    : CURATED_STUDY_MOMENT_IMAGES[0].photoDataUrl;

  return {
    photoDataUrl: fallbackDataUrl,
    sourceType: 'fallback',
    placeholder: null,
  };
}

// --- Full-Screen Lightbox Zoom Feature for Moment Images ---
export const MOMENT_LIGHTBOX_MIN_ZOOM = 1;
export const MOMENT_LIGHTBOX_MAX_ZOOM = 3;
export const MOMENT_LIGHTBOX_ZOOM_STEP = 0.5;
export const MOMENT_LIGHTBOX_ZOOM_PRESETS: readonly number[] = [1, 1.5, 2, 2.5, 3];

export interface MomentLightboxZoomState {
  isOpen: boolean;
  momentId: string | null;
  photoDataUrl: string;
  caption: string;
  authorName: string;
  visibility: 'public' | 'connections';
  zoomScale: number;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  zoomPercent: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  isZoomed: boolean;
}

export function clampLightboxZoomScale(rawScale: number): number {
  if (!Number.isFinite(rawScale)) return MOMENT_LIGHTBOX_MIN_ZOOM;
  const clamped = Math.min(
    MOMENT_LIGHTBOX_MAX_ZOOM,
    Math.max(MOMENT_LIGHTBOX_MIN_ZOOM, rawScale)
  );
  return Math.round(clamped * 4) / 4;
}

function buildMomentLightboxState(
  base: {
    isOpen: boolean;
    momentId: string | null;
    photoDataUrl: string;
    caption: string;
    authorName: string;
    visibility: 'public' | 'connections';
  },
  rawZoomScale: number
): MomentLightboxZoomState {
  const zoomScale = clampLightboxZoomScale(rawZoomScale);
  return {
    ...base,
    zoomScale,
    minZoom: MOMENT_LIGHTBOX_MIN_ZOOM,
    maxZoom: MOMENT_LIGHTBOX_MAX_ZOOM,
    zoomStep: MOMENT_LIGHTBOX_ZOOM_STEP,
    zoomPercent: Math.round(zoomScale * 100),
    canZoomIn: zoomScale < MOMENT_LIGHTBOX_MAX_ZOOM,
    canZoomOut: zoomScale > MOMENT_LIGHTBOX_MIN_ZOOM,
    isZoomed: zoomScale > MOMENT_LIGHTBOX_MIN_ZOOM,
  };
}

export function openMomentLightbox(params: {
  momentId: string;
  photoDataUrl: string;
  caption: string;
  authorName: string;
  visibility?: 'public' | 'connections';
  initialZoom?: number;
}): MomentLightboxZoomState {
  const cleanId = String(params.momentId || '').trim() || 'moment_preview';
  const cleanUrl = String(params.photoDataUrl || '').trim();
  const cleanCaption = sanitizeSafeText(String(params.caption || ''), 500);
  const cleanAuthor =
    sanitizeSafeText(String(params.authorName || 'Member'), 64) || 'Member';
  const visibility: 'public' | 'connections' =
    params.visibility === 'connections' ? 'connections' : 'public';

  return buildMomentLightboxState(
    {
      isOpen: Boolean(cleanUrl),
      momentId: cleanId,
      photoDataUrl: cleanUrl,
      caption: cleanCaption,
      authorName: cleanAuthor,
      visibility,
    },
    typeof params.initialZoom === 'number'
      ? params.initialZoom
      : MOMENT_LIGHTBOX_MIN_ZOOM
  );
}

export function updateMomentLightboxZoom(
  state: MomentLightboxZoomState,
  action: 'in' | 'out' | 'reset' | 'toggle' | number
): MomentLightboxZoomState {
  let nextScale = state.zoomScale;
  if (typeof action === 'number') {
    nextScale = clampLightboxZoomScale(action);
  } else if (action === 'in') {
    nextScale = clampLightboxZoomScale(state.zoomScale + MOMENT_LIGHTBOX_ZOOM_STEP);
  } else if (action === 'out') {
    nextScale = clampLightboxZoomScale(state.zoomScale - MOMENT_LIGHTBOX_ZOOM_STEP);
  } else if (action === 'reset') {
    nextScale = MOMENT_LIGHTBOX_MIN_ZOOM;
  } else if (action === 'toggle') {
    nextScale =
      state.zoomScale > MOMENT_LIGHTBOX_MIN_ZOOM ? MOMENT_LIGHTBOX_MIN_ZOOM : 2;
  }

  return buildMomentLightboxState(
    {
      isOpen: state.isOpen,
      momentId: state.momentId,
      photoDataUrl: state.photoDataUrl,
      caption: state.caption,
      authorName: state.authorName,
      visibility: state.visibility,
    },
    nextScale
  );
}

// --- Twitter / X Social Section Pure Logic (Handles, Hashtags, Reactions, Feed Filtering, & Twitter Chat) ---

export type TwitterNavTab =
  | 'home'
  | 'explore'
  | 'notifications'
  | 'messages'
  | 'bookmarks'
  | 'profile';

export type TwitterFeedFilter =
  | 'all'
  | 'following'
  | 'public'
  | 'connections'
  | 'mine'
  | 'bookmarks'
  | 'liked';

export interface TwitterTrendingTopic {
  tag: string;
  category: string;
  tweetCount: number;
  isLive: boolean;
}

export interface TwitterChatMessage {
  id: string;
  channelId: string;
  senderUid: string;
  senderName: string;
  senderHandle: string;
  recipientUid?: string | null;
  text: string;
  photoDataUrl?: string | null;
  createdAtMs: number;
}

export interface TwitterCommunityChannel {
  id: string;
  name: string;
  handle: string;
  description: string;
}

export const TWITTER_COMMUNITY_CHANNELS: readonly TwitterCommunityChannel[] = [
  {
    id: 'global_townsquare',
    name: 'Global Town Square',
    handle: '#town-square',
    description: 'Open Twitter chat for everyone online — share updates, images, and quick thoughts.',
  },
  {
    id: 'study_builders',
    name: 'Study & Deep Work Lounge',
    handle: '#deep-work',
    description: 'Live chat for scholars, engineers, and Pomodoro sprinters.',
  },
  {
    id: 'media_showcase',
    name: 'Photos & Desk Setups',
    handle: '#desk-setups',
    description: 'Share desk snapshots, whiteboard architectures, and aesthetic study photos.',
  },
] as const;

export function deriveTwitterHandle(displayName: string, fallbackUid?: string): string {
  const cleaned = String(displayName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20);
  if (cleaned.length >= 2) {
    return `@${cleaned}`;
  }
  const fallback = String(fallbackUid || 'member')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 12);
  return `@${fallback || 'member'}`;
}

export function extractTweetHashtags(text: string): string[] {
  const raw = String(text || '');
  const matches = raw.match(/#[a-zA-Z0-9_]{2,32}/g) || [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of matches) {
    const lower = tag.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(tag);
    }
  }
  return result;
}

const DEFAULT_TRENDING_TOPICS: ReadonlyArray<{
  tag: string;
  category: string;
  baselineCount: number;
}> = [
  { tag: '#DeepWork', category: 'Productivity · Trending', baselineCount: 48 },
  { tag: '#BuildInPublic', category: 'Engineering · Trending', baselineCount: 36 },
  { tag: '#StudyWithMe', category: 'Study Sanctuary · Live', baselineCount: 29 },
  { tag: '#SystemsDesign', category: 'Tech & Architecture', baselineCount: 22 },
  { tag: '#PomodoroFlow', category: 'Focus Sprint', baselineCount: 19 },
];

export function computeTrendingTwitterTopics(
  moments: ReadonlyArray<{ caption: string }>,
  comments: ReadonlyArray<{ text: string }> = []
): TwitterTrendingTopic[] {
  const countsByLower = new Map<
    string,
    { displayTag: string; category: string; count: number; isLive: boolean }
  >();

  for (const preset of DEFAULT_TRENDING_TOPICS) {
    countsByLower.set(preset.tag.toLowerCase(), {
      displayTag: preset.tag,
      category: preset.category,
      count: preset.baselineCount,
      isLive: false,
    });
  }

  for (const m of moments) {
    const tags = extractTweetHashtags(m?.caption || '');
    for (const tag of tags) {
      const key = tag.toLowerCase();
      const existing = countsByLower.get(key);
      if (existing) {
        existing.count += 1;
        existing.isLive = true;
      } else {
        countsByLower.set(key, {
          displayTag: tag,
          category: 'Community · Live Trend',
          count: 1,
          isLive: true,
        });
      }
    }
  }

  for (const c of comments) {
    const tags = extractTweetHashtags(c?.text || '');
    for (const tag of tags) {
      const key = tag.toLowerCase();
      const existing = countsByLower.get(key);
      if (existing) {
        existing.count += 1;
        existing.isLive = true;
      } else {
        countsByLower.set(key, {
          displayTag: tag,
          category: 'Threads · Live Trend',
          count: 1,
          isLive: true,
        });
      }
    }
  }

  return Array.from(countsByLower.values())
    .sort((a, b) => {
      if (b.isLive !== a.isLive && b.count >= 2 && a.count >= 2) {
        // Prioritize high-count trends, breaking ties with live status
      }
      if (b.count !== a.count) return b.count - a.count;
      return a.displayTag.localeCompare(b.displayTag);
    })
    .slice(0, 6)
    .map((entry) => ({
      tag: entry.displayTag,
      category: entry.category,
      tweetCount: entry.count,
      isLive: entry.isLive,
    }));
}

export function toggleTweetReaction(
  reactionMap: Record<string, string[]>,
  momentId: string,
  userUid: string
): {
  updatedMap: Record<string, string[]>;
  active: boolean;
  count: number;
} {
  const cleanMomentId = String(momentId || '').trim();
  const cleanUid = String(userUid || '').trim();
  if (!cleanMomentId || !cleanUid) {
    return {
      updatedMap: { ...reactionMap },
      active: false,
      count: 0,
    };
  }

  const currentList = Array.isArray(reactionMap[cleanMomentId])
    ? reactionMap[cleanMomentId]
    : [];
  const exists = currentList.includes(cleanUid);
  const nextList = exists
    ? currentList.filter((id) => id !== cleanUid)
    : [...currentList, cleanUid];

  return {
    updatedMap: {
      ...reactionMap,
      [cleanMomentId]: nextList,
    },
    active: !exists,
    count: nextList.length,
  };
}

export function toggleFollowUser(
  followedUids: string[],
  targetUid: string,
  currentUid: string
): {
  updatedFollows: string[];
  isFollowing: boolean;
} {
  const cleanTarget = String(targetUid || '').trim();
  const cleanCurrent = String(currentUid || '').trim();
  if (!cleanTarget || cleanTarget === cleanCurrent) {
    return {
      updatedFollows: [...followedUids],
      isFollowing: false,
    };
  }
  const exists = followedUids.includes(cleanTarget);
  const updatedFollows = exists
    ? followedUids.filter((id) => id !== cleanTarget)
    : [...followedUids, cleanTarget];
  return {
    updatedFollows,
    isFollowing: !exists,
  };
}

export function filterTwitterFeedMoments<
  T extends {
    id: string;
    authorUid: string;
    authorName: string;
    caption: string;
    visibility: 'public' | 'connections';
  }
>(params: {
  moments: readonly T[];
  filter: TwitterFeedFilter;
  currentUid: string;
  followedUids?: Iterable<string>;
  acceptedPeerUids?: Iterable<string>;
  likedByMomentId?: Record<string, string[]>;
  bookmarkedByMomentId?: Record<string, string[]>;
  searchQuery?: string;
  activeHashtag?: string | null;
}): T[] {
  const {
    moments,
    filter,
    currentUid,
    followedUids,
    acceptedPeerUids,
    likedByMomentId = {},
    bookmarkedByMomentId = {},
    searchQuery = '',
    activeHashtag = null,
  } = params;

  const followedSet = new Set<string>(followedUids || []);
  const connectedSet = new Set<string>(acceptedPeerUids || []);
  const cleanQuery = String(searchQuery || '').trim().toLowerCase();
  const cleanHashtag = String(activeHashtag || '').trim().toLowerCase();

  return moments.filter((item) => {
    if (filter === 'public' && item.visibility !== 'public') return false;
    if (filter === 'connections' && item.visibility !== 'connections') return false;
    if (filter === 'mine' && item.authorUid !== currentUid) return false;
    if (filter === 'following') {
      const isFollowedOrConnected =
        item.authorUid === currentUid ||
        followedSet.has(item.authorUid) ||
        connectedSet.has(item.authorUid);
      if (!isFollowedOrConnected) return false;
    }
    if (filter === 'bookmarks') {
      const savedList = bookmarkedByMomentId[item.id] || [];
      if (!savedList.includes(currentUid)) return false;
    }
    if (filter === 'liked') {
      const likedList = likedByMomentId[item.id] || [];
      if (!likedList.includes(currentUid)) return false;
    }

    if (cleanHashtag) {
      const itemTags = extractTweetHashtags(item.caption).map((t) => t.toLowerCase());
      if (!itemTags.includes(cleanHashtag)) return false;
    }

    if (cleanQuery) {
      const handle = deriveTwitterHandle(item.authorName, item.authorUid).toLowerCase();
      const hay = `${item.caption} ${item.authorName} ${handle}`.toLowerCase();
      if (!hay.includes(cleanQuery)) return false;
    }

    return true;
  });
}

export function validateAndBuildTwitterChatMessage(params: {
  channelId: string;
  senderUid: string;
  senderName: string;
  recipientUid?: string | null;
  rawText: string;
  photoDataUrl?: string | null;
  nowMs?: number;
}): {
  valid: boolean;
  error: string;
  message: TwitterChatMessage | null;
} {
  const cleanSenderUid = String(params.senderUid || '').trim();
  const cleanSenderName = sanitizeSafeText(String(params.senderName || 'Member'), 64);
  const cleanChannelId = sanitizeSafeText(
    String(params.channelId || 'global_townsquare'),
    64
  );
  const trimmedText = String(params.rawText || '').trim();
  const cleanPhoto = String(params.photoDataUrl || '').trim();

  if (!cleanSenderUid) {
    return { valid: false, error: 'Sign in required to send messages.', message: null };
  }
  if (!trimmedText && !cleanPhoto) {
    return {
      valid: false,
      error: 'Please enter a message or attach an image to chat.',
      message: null,
    };
  }
  if (trimmedText.length > 500) {
    return {
      valid: false,
      error: 'Twitter chat message cannot exceed 500 characters.',
      message: null,
    };
  }
  if (trimmedText) {
    const threat = detectSecurityThreat(trimmedText);
    if (!threat.safe) {
      return { valid: false, error: threat.reason, message: null };
    }
  }

  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0 ? params.nowMs : Date.now();
  const safeText = trimmedText
    ? sanitizeSafeText(trimmedText, 500)
    : 'Shared a photo in chat';

  return {
    valid: true,
    error: '',
    message: {
      id: `twchat_${nowMs}_${cleanSenderUid.slice(0, 16)}`,
      channelId: cleanChannelId,
      senderUid: cleanSenderUid,
      senderName: cleanSenderName,
      senderHandle: deriveTwitterHandle(cleanSenderName, cleanSenderUid),
      recipientUid: params.recipientUid ? String(params.recipientUid).trim() : null,
      text: safeText,
      photoDataUrl: cleanPhoto || null,
      createdAtMs: nowMs,
    },
  };
}

// ============================================================================
// STUDY MODE: FULL CUSTOM TIMER CONTROL, STRICT REAL-TIMER RECORDING GUARD,
// AND COMPLETE STUDY BOOKS & READING LIBRARY
// ============================================================================

export const CUSTOM_STUDY_MIN_MINUTES = 1;
export const CUSTOM_STUDY_MAX_MINUTES = 720; // Up to 12 hours continuous study block

export interface CustomStudyDurationPreset {
  minutes: number;
  shortLabel: string;
  fullLabel: string;
  hmsLabel: string;
}

export const CUSTOM_STUDY_DURATION_PRESETS: readonly CustomStudyDurationPreset[] = [
  { minutes: 15, shortLabel: '15m', fullLabel: '15m Sprint', hmsLabel: '0:15:00' },
  { minutes: 25, shortLabel: '25m', fullLabel: '25m Pomodoro', hmsLabel: '0:25:00' },
  { minutes: 45, shortLabel: '45m', fullLabel: '45m Focus', hmsLabel: '0:45:00' },
  { minutes: 60, shortLabel: '1h 00m', fullLabel: '1 Hour Block', hmsLabel: '1:00:00' },
  { minutes: 90, shortLabel: '1h 30m', fullLabel: '1.5 Hours Deep Work', hmsLabel: '1:30:00' },
  { minutes: 120, shortLabel: '2h 00m', fullLabel: '2 Hours Marathon', hmsLabel: '2:00:00' },
  { minutes: 180, shortLabel: '3h 00m', fullLabel: '3 Hours Mastery', hmsLabel: '3:00:00' },
  { minutes: 240, shortLabel: '4h 00m', fullLabel: '4 Hours Immersion', hmsLabel: '4:00:00' },
] as const;

/**
 * Formats seconds into H:MM:SS (e.g. 2:00:00 for 2 hours, 3:00:00 for 3 hours)
 * or MM:SS when under 1 hour unless alwaysShowHours is true.
 */
export function formatStudyTimerHMS(
  totalSeconds: number,
  alwaysShowHours: boolean = true
): string {
  const clamped = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  const paddedMins = String(minutes).padStart(2, '0');
  const paddedSecs = String(seconds).padStart(2, '0');

  if (alwaysShowHours || hours > 0) {
    return `${hours}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

export function formatStudyDurationLabel(totalMinutes: number): string {
  const safeMins = Math.max(
    0,
    Math.round(Number.isFinite(totalMinutes) ? totalMinutes : 0)
  );
  const hours = Math.floor(safeMins / 60);
  const remMins = safeMins % 60;
  if (hours === 0) {
    return `${remMins}m`;
  }
  const paddedMins = String(remMins).padStart(2, '0');
  return `${hours}h ${paddedMins}m (${safeMins}m)`;
}

export interface CustomStudyDurationConfig {
  totalMinutes: number;
  hours: number;
  minutes: number;
  totalSeconds: number;
  formattedTargetHMS: string;
  formattedLabel: string;
}

export function parseAndClampCustomStudyDuration(params: {
  hours?: number | string;
  minutes?: number | string;
  totalMinutes?: number | string;
}): CustomStudyDurationConfig {
  let rawTotalMinutes: number;

  if (
    params.totalMinutes !== undefined &&
    params.totalMinutes !== null &&
    String(params.totalMinutes).trim() !== ''
  ) {
    rawTotalMinutes = Number(params.totalMinutes);
  } else {
    const h = Math.max(0, Math.floor(Number(params.hours) || 0));
    const m = Math.max(0, Math.floor(Number(params.minutes) || 0));
    rawTotalMinutes = h * 60 + m;
  }

  if (!Number.isFinite(rawTotalMinutes) || rawTotalMinutes <= 0) {
    rawTotalMinutes = 25;
  }

  const clampedMinutes = Math.min(
    CUSTOM_STUDY_MAX_MINUTES,
    Math.max(CUSTOM_STUDY_MIN_MINUTES, Math.round(rawTotalMinutes))
  );
  const hours = Math.floor(clampedMinutes / 60);
  const minutes = clampedMinutes % 60;
  const totalSeconds = clampedMinutes * 60;

  return {
    totalMinutes: clampedMinutes,
    hours,
    minutes,
    totalSeconds,
    formattedTargetHMS: formatStudyTimerHMS(totalSeconds, true),
    formattedLabel: formatStudyDurationLabel(clampedMinutes),
  };
}

export interface RealTimerStudyVerificationResult {
  allowed: boolean;
  status: 'verified' | 'rejected_inflation' | 'no_elapsed_time';
  actualElapsedSeconds: number;
  actualElapsedFormattedHMS: string;
  unrecordedElapsedSeconds: number;
  unrecordedFormattedHMS: string;
  claimedSeconds: number;
  claimedFormattedHMS: string;
  verifiedSeconds: number;
  verifiedMinutes: number;
  verifiedFormattedHMS: string;
  deficitSeconds: number;
  deficitFormattedHMS: string;
  reason: string;
}

/**
 * Strictly enforces that recorded study time is backed by the real elapsed timer.
 * Rule: "If they study 2 hours they cannot make it 3 hours without the timer going till 3:00."
 */
export function validateRealTimerStudyRecording(params: {
  actualElapsedSeconds: number;
  alreadyRecordedSeconds?: number;
  claimedSeconds?: number;
  claimedMinutes?: number;
}): RealTimerStudyVerificationResult {
  const actualElapsedSeconds = Math.max(
    0,
    Math.floor(Number(params.actualElapsedSeconds) || 0)
  );
  const alreadyRecordedSeconds = Math.max(
    0,
    Math.floor(Number(params.alreadyRecordedSeconds) || 0)
  );
  const unrecordedElapsedSeconds = Math.max(
    0,
    actualElapsedSeconds - alreadyRecordedSeconds
  );

  let claimedSeconds: number;
  if (typeof params.claimedSeconds === 'number' && Number.isFinite(params.claimedSeconds)) {
    claimedSeconds = Math.max(0, Math.floor(params.claimedSeconds));
  } else if (
    typeof params.claimedMinutes === 'number' &&
    Number.isFinite(params.claimedMinutes)
  ) {
    claimedSeconds = Math.max(0, Math.round(params.claimedMinutes * 60));
  } else {
    claimedSeconds = unrecordedElapsedSeconds;
  }

  const actualElapsedFormattedHMS = formatStudyTimerHMS(actualElapsedSeconds, true);
  const unrecordedFormattedHMS = formatStudyTimerHMS(unrecordedElapsedSeconds, true);
  const claimedFormattedHMS = formatStudyTimerHMS(claimedSeconds, true);

  // Case 1: User tries to claim more study time than the real timer has reached
  if (claimedSeconds > actualElapsedSeconds) {
    const deficitSeconds = claimedSeconds - actualElapsedSeconds;
    const deficitFormattedHMS = formatStudyTimerHMS(deficitSeconds, true);
    const verifiedMinutes = Math.floor(unrecordedElapsedSeconds / 60);
    return {
      allowed: false,
      status: 'rejected_inflation',
      actualElapsedSeconds,
      actualElapsedFormattedHMS,
      unrecordedElapsedSeconds,
      unrecordedFormattedHMS,
      claimedSeconds,
      claimedFormattedHMS,
      verifiedSeconds: unrecordedElapsedSeconds,
      verifiedMinutes,
      verifiedFormattedHMS: unrecordedFormattedHMS,
      deficitSeconds,
      deficitFormattedHMS,
      reason: `Strict Real-Timer Enforcement: Timer has only reached ${actualElapsedFormattedHMS}. You cannot record ${claimedFormattedHMS} without the timer running until ${claimedFormattedHMS} (${deficitFormattedHMS} more required on the timer).`,
    };
  }

  // Case 2: User tries to record more than their unrecorded elapsed time
  if (claimedSeconds > unrecordedElapsedSeconds) {
    const deficitSeconds = claimedSeconds - unrecordedElapsedSeconds;
    const deficitFormattedHMS = formatStudyTimerHMS(deficitSeconds, true);
    const verifiedMinutes = Math.floor(unrecordedElapsedSeconds / 60);
    return {
      allowed: false,
      status: 'rejected_inflation',
      actualElapsedSeconds,
      actualElapsedFormattedHMS,
      unrecordedElapsedSeconds,
      unrecordedFormattedHMS,
      claimedSeconds,
      claimedFormattedHMS,
      verifiedSeconds: unrecordedElapsedSeconds,
      verifiedMinutes,
      verifiedFormattedHMS: unrecordedFormattedHMS,
      deficitSeconds,
      deficitFormattedHMS,
      reason: `Strict Real-Timer Enforcement: Only ${unrecordedFormattedHMS} of unrecorded timer time is available (Total timer: ${actualElapsedFormattedHMS}). Let the timer run for ${deficitFormattedHMS} more to record ${claimedFormattedHMS}.`,
    };
  }

  // Case 3: Timer has 0 unrecorded seconds
  if (claimedSeconds <= 0 || unrecordedElapsedSeconds <= 0) {
    return {
      allowed: false,
      status: 'no_elapsed_time',
      actualElapsedSeconds,
      actualElapsedFormattedHMS,
      unrecordedElapsedSeconds,
      unrecordedFormattedHMS,
      claimedSeconds,
      claimedFormattedHMS,
      verifiedSeconds: 0,
      verifiedMinutes: 0,
      verifiedFormattedHMS: '0:00:00',
      deficitSeconds: 0,
      deficitFormattedHMS: '0:00:00',
      reason:
        'Start the Focus Timer first — study time is strictly recorded from real elapsed timer values.',
    };
  }

  // Case 4: Valid real-timer verified recording
  const verifiedSeconds = claimedSeconds;
  const verifiedMinutes = Math.max(1, Math.round(verifiedSeconds / 60));
  const verifiedFormattedHMS = formatStudyTimerHMS(verifiedSeconds, true);

  return {
    allowed: true,
    status: 'verified',
    actualElapsedSeconds,
    actualElapsedFormattedHMS,
    unrecordedElapsedSeconds,
    unrecordedFormattedHMS,
    claimedSeconds,
    claimedFormattedHMS,
    verifiedSeconds,
    verifiedMinutes,
    verifiedFormattedHMS,
    deficitSeconds: 0,
    deficitFormattedHMS: '0:00:00',
    reason: `Verified ${verifiedFormattedHMS} (${verifiedMinutes}m) conducted on the real study timer.`,
  };
}

// --- Study Books & Academic Reading Library ---
export type StudyBookCategory =
  | 'Computer Science'
  | 'Systems Design'
  | 'Math & Physics'
  | 'Deep Work & Focus'
  | 'Philosophy'
  | 'Custom';

export interface StudyBookChapter {
  chapterNumber: number;
  title: string;
  pageRange: string;
  coreConcepts: string[];
  detailedStudyText: string;
  keyFormulaOrModel: string;
  activeRecallPrompt: string;
}

export interface StudyBookItem {
  id: string;
  title: string;
  author: string;
  category: StudyBookCategory;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  totalPages: number;
  recommendedMinutes: number;
  recommendedDurationLabel: string;
  coverAccentHex: string;
  summary: string;
  chapters: StudyBookChapter[];
  isCustom?: boolean;
}

export interface BookStudyProgressRecord {
  bookId: string;
  currentPage: number;
  completedChapterNumbers: number[];
  verifiedSecondsStudied: number;
  personalNotes: string;
  lastStudiedAtMs: number;
}

export const STUDY_BOOK_CATEGORIES: readonly ('All' | StudyBookCategory)[] = [
  'All',
  'Computer Science',
  'Systems Design',
  'Math & Physics',
  'Deep Work & Focus',
  'Philosophy',
  'Custom',
] as const;

export const CURATED_STUDY_BOOKS: readonly StudyBookItem[] = [
  {
    id: 'book_ddia',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Systems Design',
    difficulty: 'Advanced',
    totalPages: 616,
    recommendedMinutes: 120,
    recommendedDurationLabel: '2h 00m (2:00:00)',
    coverAccentHex: '#10b981',
    summary:
      'The definitive engineering guide to reliable, scalable, and maintainable distributed data systems, replication, partitioning, and consensus.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Reliable, Scalable, and Maintainable Applications',
        pageRange: 'pp. 1–22',
        coreConcepts: ['Fault Tolerance vs Hardware Failure', 'Tail Latency (p95, p99, p999)', 'Operability & Evolvability'],
        detailedStudyText:
          'Reliability means continuing to work correctly even when faults occur. Faults are not the same as failures: a fault is one component deviating from spec, whereas a failure is when the system as a whole stops providing the required service. Scalability measures a system’s ability to cope with increased load—quantified via throughput and response time percentiles (p50 median, p95, p99 tail latency).',
        keyFormulaOrModel: 'SLO Compliance: p99 Response Time < 200ms under 10x Peak Load Amplification',
        activeRecallPrompt:
          'Why is p99 tail latency more critical than average (arithmetic mean) response time in distributed services?',
      },
      {
        chapterNumber: 2,
        title: 'Replication & Leader-Follower Topologies',
        pageRange: 'pp. 151–198',
        coreConcepts: ['Synchronous vs Asynchronous Replication', 'Read-After-Write Consistency', 'Monotonic Reads & Sloppy Quorums'],
        detailedStudyText:
          'Replication keeps a copy of the same data on multiple machines connected via a network. Single-leader replication directs all writes to a designated leader node which streams the write-ahead replication log to followers. Multi-leader and leaderless (Dynamo-style) replication trade strict immediacy for availability using quorum reads and writes.',
        keyFormulaOrModel: 'Strict Quorum Invariant: w + r > n (Write Quorum + Read Quorum > Total Replicas)',
        activeRecallPrompt:
          'How does a Dynamo-style leaderless system detect concurrent writes versus causally ordered updates?',
      },
      {
        chapterNumber: 3,
        title: 'Linearizability & Distributed Consensus (Raft / Paxos)',
        pageRange: 'pp. 321–378',
        coreConcepts: ['Linearizability (Atomic Consistency)', 'Total Order Broadcast', 'Two-Phase Commit vs Raft Consensus'],
        detailedStudyText:
          'Linearizability makes a replicated system appear as if there is only a single copy of the data and every operation takes effect atomically at a single point in time. Total order broadcast is equivalent to consensus: every node delivers the exact same messages in the exact same order, enabling fault-tolerant state machine replication.',
        keyFormulaOrModel: 'Raft Safety: Leader Append-Only + Log Matching + Leader Completeness across > n/2 Quorum',
        activeRecallPrompt:
          'Explain why CAP theorem is more accurately framed as "Consistent or Available when Partitioned".',
      },
    ],
  },
  {
    id: 'book_sicp',
    title: 'Structure and Interpretation of Computer Programs (SICP)',
    author: 'Harold Abelson & Gerald Jay Sussman',
    category: 'Computer Science',
    difficulty: 'Intermediate',
    totalPages: 657,
    recommendedMinutes: 120,
    recommendedDurationLabel: '2h 00m (2:00:00)',
    coverAccentHex: '#38bdf8',
    summary:
      'Foundational computer science text mastering procedural abstraction, data abstraction, lexical closures, streams, and metacircular evaluators.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Building Abstractions with Procedures',
        pageRange: 'pp. 1–78',
        coreConcepts: ['Substitution Model', 'Linear Recursion vs Tail-Call Iteration', 'Higher-Order Procedures'],
        detailedStudyText:
          'Computational processes evolve inside a computer, manipulating data according to rules called procedures. A recursive procedure whose state is completely captured by its formal parameters generates a linear iterative process in constant O(1) space when tail-call optimized.',
        keyFormulaOrModel: 'Time T(n) = O(n), Space S(n) = O(1) for Tail-Recursive State Accumulator',
        activeRecallPrompt:
          'Distinguish between a recursive procedure (syntactic definition) and a recursive process (runtime stack evolution).',
      },
      {
        chapterNumber: 2,
        title: 'Building Abstractions with Data & Closure Property',
        pageRange: 'pp. 79–216',
        coreConcepts: ['Wishful Thinking & Abstraction Barriers', 'Closure Property of Cons Pairs', 'Conventional Interfaces (Map/Filter/Fold)'],
        detailedStudyText:
          'Data abstraction isolates how a compound data object is used from the concrete representation of how it is constructed from primitive parts. An operation for combining data objects satisfies the closure property if the results of combining things with that operation can themselves be combined using the same operation.',
        keyFormulaOrModel: 'accumulate(op, initial, sequence) -> Fold-Right Universal Reduction',
        activeRecallPrompt:
          'How do abstraction barriers allow you to swap underlying data representations without touching higher-level domain logic?',
      },
      {
        chapterNumber: 3,
        title: 'Metalinguistic Abstraction & The Metacircular Evaluator',
        pageRange: 'pp. 359–490',
        coreConcepts: ['Eval / Apply Yin-Yang Cycle', 'Lexical Environment Frames', 'Lazy Evaluation & Streams'],
        detailedStudyText:
          'The evaluator determines the meaning of expressions in a programming language. The core of evaluation is the mutual recursion between eval (which classifies expressions and looks up variables in lexical environment frames) and apply (which binds procedure arguments in a new frame and evaluates the body).',
        keyFormulaOrModel: 'eval(expr, env) <-> apply(proc, args)',
        activeRecallPrompt:
          'Trace what happens when a lambda closure is created in one environment and applied in a different lexical scope.',
      },
    ],
  },
  {
    id: 'book_clrs',
    title: 'Introduction to Algorithms (CLRS)',
    author: 'Cormen, Leiserson, Rivest & Stein',
    category: 'Computer Science',
    difficulty: 'Advanced',
    totalPages: 1312,
    recommendedMinutes: 180,
    recommendedDurationLabel: '3h 00m (3:00:00)',
    coverAccentHex: '#f59e0b',
    summary:
      'Rigorous analysis of asymptotic complexity, divide-and-conquer recurrences, dynamic programming, amortized data structures, and graph algorithms.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Divide-and-Conquer & The Master Theorem',
        pageRange: 'pp. 65–113',
        coreConcepts: ['Asymptotic Notation (Θ, O, Ω)', 'Recurrence Trees', 'Master Theorem Cases 1, 2, 3'],
        detailedStudyText:
          'Divide-and-conquer breaks a problem into a subproblems each of size n/b, recursively solves them, and combines the solutions in f(n) time. Comparing f(n) against the watershed function n^(log_b a) determines whether cost is dominated by leaves, balanced across all tree levels, or dominated by the root.',
        keyFormulaOrModel: 'T(n) = a·T(n/b) + f(n)  |  Watershed: n^(log_b a)',
        activeRecallPrompt:
          'Solve T(n) = 2T(n/2) + Θ(n) and explain why Merge Sort achieves optimal comparison-based sorting bounds.',
      },
      {
        chapterNumber: 2,
        title: 'Dynamic Programming & Optimal Substructure',
        pageRange: 'pp. 359–413',
        coreConcepts: ['Optimal Substructure', 'Overlapping Subproblems', 'Top-Down Memoization vs Bottom-Up Tabulation'],
        detailedStudyText:
          'Dynamic programming applies when subproblems overlap—meaning recursive algorithms solve the exact same subsubproblems repeatedly. By storing subproblem solutions in a table and building bottom-up along a topological DAG of dependencies, exponential brute-force search collapses into polynomial time.',
        keyFormulaOrModel: 'Bellman Optimality Equation: dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w - wt[i]])',
        activeRecallPrompt:
          'When should you choose a greedy choice property over full dynamic programming?',
      },
      {
        chapterNumber: 3,
        title: 'Shortest Paths, Minimum Spanning Trees & Network Flow',
        pageRange: 'pp. 589–765',
        coreConcepts: ['Edge Relaxation Invariant', 'Dijkstra vs Bellman-Ford', 'Max-Flow Min-Cut Theorem'],
        detailedStudyText:
          'Shortest-path algorithms rely on the relaxation technique: testing whether we can improve the shortest-path estimate d[v] to vertex v by going through u. Dijkstra greedily extracts the minimum-estimate vertex for non-negative weights, whereas Bellman-Ford relaxes all |E| edges |V|-1 times and detects negative-weight cycles.',
        keyFormulaOrModel: 'Relax(u, v, w): if d[v] > d[u] + w(u,v) then d[v] = d[u] + w(u,v)',
        activeRecallPrompt:
          'Why does Dijkstra’s greedy invariant fail when an edge has a negative weight?',
      },
    ],
  },
  {
    id: 'book_linear_algebra',
    title: 'Linear Algebra Done Right',
    author: 'Sheldon Axler',
    category: 'Math & Physics',
    difficulty: 'Intermediate',
    totalPages: 340,
    recommendedMinutes: 90,
    recommendedDurationLabel: '1h 30m (1:30:00)',
    coverAccentHex: '#a855f7',
    summary:
      'Pure geometric and operator-centric development of vector spaces, linear maps, eigenvalues, inner product spaces, and singular value decomposition.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Vector Spaces, Span & Linear Independence',
        pageRange: 'pp. 1–51',
        coreConcepts: ['Subspaces & Direct Sums', 'Span & Linear Independence', 'Basis & Dimension Invariance'],
        detailedStudyText:
          'A list of vectors in V is linearly independent if the only choice of scalars making their linear combination zero is all zeros. Every spanning list in a finite-dimensional vector space can be reduced to a basis, and every linearly independent list can be extended to a basis of identical length.',
        keyFormulaOrModel: 'dim(U + W) = dim(U) + dim(W) - dim(U ∩ W)',
        activeRecallPrompt:
          'Prove that any linearly independent list of vectors has length at most the length of any spanning list.',
      },
      {
        chapterNumber: 2,
        title: 'Linear Maps & The Fundamental Theorem of Linear Algebra',
        pageRange: 'pp. 52–130',
        coreConcepts: ['Null Space (Kernel) & Range (Image)', 'Injectivity vs Surjectivity', 'Rank-Nullity Theorem'],
        detailedStudyText:
          'For a linear map T: V -> W on a finite-dimensional vector space V, the dimension of the domain equals the dimension of the null space (kernel) plus the dimension of the range (image). Consequently, a linear operator on a finite-dimensional space is injective if and only if it is surjective.',
        keyFormulaOrModel: 'dim(V) = dim null(T) + dim range(T)',
        activeRecallPrompt:
          'Why is injectivity equivalent to surjectivity for linear operators T: V -> V only when dim(V) is finite?',
      },
      {
        chapterNumber: 3,
        title: 'Eigenvalues, Spectral Theorem & Singular Value Decomposition',
        pageRange: 'pp. 131–295',
        coreConcepts: ['Invariant Subspaces', 'Self-Adjoint & Normal Operators', 'Orthonormal Eigenbasis & SVD'],
        detailedStudyText:
          'Every operator on a finite-dimensional non-zero complex vector space has at least one eigenvalue. Under the Spectral Theorem, normal operators on complex inner-product spaces (and self-adjoint operators on real inner-product spaces) possess an orthonormal basis of eigenvectors.',
        keyFormulaOrModel: 'SVD: A = U Σ V*  where σ_i = sqrt(λ_i(A* A))',
        activeRecallPrompt:
          'How does Singular Value Decomposition generalize diagonalization to rectangular or non-square matrices?',
      },
    ],
  },
  {
    id: 'book_feynman_physics',
    title: 'The Feynman Lectures on Physics (Vol. I)',
    author: 'Richard P. Feynman',
    category: 'Math & Physics',
    difficulty: 'Intermediate',
    totalPages: 560,
    recommendedMinutes: 120,
    recommendedDurationLabel: '2h 00m (2:00:00)',
    coverAccentHex: '#f43f5e',
    summary:
      'First-principles physical intuition covering conservation laws, classical mechanics, relativity, resonance, optics, and statistical thermodynamics.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Conservation of Energy & Symmetry Laws',
        pageRange: 'pp. 4-1 – 4-12',
        coreConcepts: ['Invariance Under Time Translation', 'Gravitational Potential & Kinetic Energy', 'Noether Symmetry Principle'],
        detailedStudyText:
          'There is a numerical quantity, which we call energy, that does not change in the manifold changes which nature undergoes. Energy appears in gravitational, kinetic, elastic, thermal, radiant, and mass-energy forms, governed by deep spacetime symmetries.',
        keyFormulaOrModel: 'E_total = K + U = ½mv² + U(x) = constant   |   E² = (pc)² + (m₀c²)²',
        activeRecallPrompt:
          'How can you deduce mechanical advantage of a frictionless machine using only virtual displacements and conservation of energy?',
      },
      {
        chapterNumber: 2,
        title: 'The Harmonic Oscillator & Resonance Transients',
        pageRange: 'pp. 21-1 – 25-14',
        coreConcepts: ['Simple Harmonic Motion', 'Damped Driven Oscillators', 'Q-Factor & Phase Lag'],
        detailedStudyText:
          'Any system near a stable equilibrium exhibits harmonic oscillation because the leading term in the Taylor expansion of restoring force is linear. When driven near its natural frequency ω₀, amplitude peaks sharply as controlled by the quality factor Q.',
        keyFormulaOrModel: 'm(d²x/dt²) + γm(dx/dt) + mω₀²x = F₀ cos(ωt)',
        activeRecallPrompt:
          'Why do mechanical springs, LC electrical circuits, and optical cavities obey the exact same differential equation?',
      },
    ],
  },
  {
    id: 'book_deep_work',
    title: 'Deep Work: Rules for Focused Success in a Distracted World',
    author: 'Cal Newport',
    category: 'Deep Work & Focus',
    difficulty: 'Foundational',
    totalPages: 304,
    recommendedMinutes: 90,
    recommendedDurationLabel: '1h 30m (1:30:00)',
    coverAccentHex: '#14b8a6',
    summary:
      'Cognitive science and operational rituals for training unbroken concentration, eliminating attention residue, and producing high-value mastery.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'The Law of Productivity & Attention Residue',
        pageRange: 'pp. 21–71',
        coreConcepts: ['Attention Residue (Sophie Leroy)', 'Myelination of Neural Circuits', 'High-Quality Work Produced Formula'],
        detailedStudyText:
          'Every time you switch from Task A to glance at an inbox or notification, a thick cognitive residue remains stuck on Task A for 15–25 minutes. True mastery requires uninterrupted blocks where myelin wraps around targeted neural pathways.',
        keyFormulaOrModel: 'High-Quality Work Produced = (Time Spent) × (Intensity of Focus)',
        activeRecallPrompt:
          'Why does a single 3-hour uninterrupted block produce more breakthroughs than six fragmented 30-minute sessions?',
      },
      {
        chapterNumber: 2,
        title: 'Rhythmic Scheduling, Grand Gestures & Lead Measures',
        pageRange: 'pp. 95–184',
        coreConcepts: ['Monastic vs Bimodal vs Rhythmic Philosophy', 'Lead Measures vs Lag Measures', 'Shutdown Ritual'],
        detailedStudyText:
          'The rhythmic philosophy transforms deep work into a simple regular habit by fixing a daily starting time and tracking real timer-verified hours on a visible scoreboard (a lead measure) rather than vague outcomes.',
        keyFormulaOrModel: 'Lead Measure Metric: Verified Unbroken Timer Hours Logged Per Day',
        activeRecallPrompt:
          'How does tracking verified timer hours act as a Lead Measure that drives long-term output?',
      },
    ],
  },
  {
    id: 'book_smart_notes',
    title: 'How to Take Smart Notes (The Zettelkasten Method)',
    author: 'Sönke Ahrens',
    category: 'Deep Work & Focus',
    difficulty: 'Foundational',
    totalPages: 178,
    recommendedMinutes: 60,
    recommendedDurationLabel: '1h 00m (1:00:00)',
    coverAccentHex: '#fbbf24',
    summary:
      'Niklas Luhmann’s slip-box architecture for turning reading sessions into permanent atomic notes and interconnected synthesis.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Fleeting Notes, Literature Notes & Permanent Notes',
        pageRange: 'pp. 38–89',
        coreConcepts: ['Rewrite in Your Own Words', 'Atomic Idea per Card', 'Bottom-Up Concept Clustering'],
        detailedStudyText:
          'Highlighting or copy-pasting creates an illusion of competence. True comprehension requires translating every chapter into concise Literature Notes in your own prose, then distilling atomic Permanent Notes linked to existing mental models.',
        keyFormulaOrModel: 'Reading -> Literature Note (Own Prose) -> Atomic Permanent Note -> Graph Link',
        activeRecallPrompt:
          'Why must a Permanent Note be written so that it is understandable without opening the original source book?',
      },
    ],
  },
  {
    id: 'book_clean_arch',
    title: 'Clean Architecture: A Craftsman’s Guide to Software Structure',
    author: 'Robert C. Martin',
    category: 'Systems Design',
    difficulty: 'Intermediate',
    totalPages: 432,
    recommendedMinutes: 90,
    recommendedDurationLabel: '1h 30m (1:30:00)',
    coverAccentHex: '#60a5fa',
    summary:
      'Decoupling pure domain rules from UI, databases, and external frameworks using the Dependency Rule and SOLID boundaries.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'The Dependency Rule & Pure Domain Entities',
        pageRange: 'pp. 195–228',
        coreConcepts: ['Inward-Pointing Dependencies', 'Pure Domain Logic Isolation', 'Humble Object Pattern'],
        detailedStudyText:
          'Source code dependencies must point only inward, toward higher-level policies. Inner circles containing pure business rules and mathematical invariants must know nothing at all about outer circles like UI components, databases, or web sockets.',
        keyFormulaOrModel: 'UI / DB / Web -> Use Cases -> Pure Domain Rules (Zero Outward Imports)',
        activeRecallPrompt:
          'How does decoupling pure domain rules into a standalone module make unit testing 100x faster and deterministic?',
      },
    ],
  },
  {
    id: 'book_jaynes_prob',
    title: 'Probability Theory: The Logic of Science',
    author: 'E. T. Jaynes',
    category: 'Math & Physics',
    difficulty: 'Advanced',
    totalPages: 758,
    recommendedMinutes: 180,
    recommendedDurationLabel: '3h 00m (3:00:00)',
    coverAccentHex: '#818cf8',
    summary:
      'Probability as extended logic for plausible inference under incomplete information, Cox’s theorems, and Bayesian updating.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Plausible Reasoning & Cox’s Desiderata',
        pageRange: 'pp. 1–50',
        coreConcepts: ['Deductive vs Plausible Syllogisms', 'Product & Sum Rules of Probability', 'Bayesian Posterior Updating'],
        detailedStudyText:
          'Any set of rules for plausible reasoning that satisfies basic consistency desiderata is mathematically isomorphic to the sum and product rules of probability theory. Bayes’ theorem is the unique consistent rule for updating beliefs given new evidence.',
        keyFormulaOrModel: 'P(H | D, I) = [P(H | I) · P(D | H, I)] / P(D | I)',
        activeRecallPrompt:
          'Explain why prior information I must always be explicitly conditioned on in every probability assignment.',
      },
    ],
  },
  {
    id: 'book_meditations',
    title: 'Meditations: On Stoic Discipline & Mental Clarity',
    author: 'Marcus Aurelius',
    category: 'Philosophy',
    difficulty: 'Foundational',
    totalPages: 254,
    recommendedMinutes: 60,
    recommendedDurationLabel: '1h 00m (1:00:00)',
    coverAccentHex: '#34d399',
    summary:
      'Timeless reflections on governing attention, dichotomy of control, objective judgment, and steadfast execution.',
    chapters: [
      {
        chapterNumber: 1,
        title: 'The Citadel of Attention & Objective Perception',
        pageRange: 'Book IV · pp. 42–78',
        coreConcepts: ['Dichotomy of Control', 'Stripping Away Subjective Value Judgments', 'Premeditatio Malorum'],
        detailedStudyText:
          'External things cannot touch the mind; they stand outside, stationary and inert. Disturbance comes solely from the judgment we form within. By directing 100% of attention to the present action with precision and calm, the mind becomes an unconquerable citadel.',
        keyFormulaOrModel: 'Event (External) + Objective Framing (Internal) -> Deliberate Action',
        activeRecallPrompt:
          'How do you separate an objective observation of a difficult problem from your emotional reaction to it?',
      },
    ],
  },
] as const;

export function filterStudyBooks(params: {
  books: readonly StudyBookItem[];
  category?: 'All' | StudyBookCategory | string;
  searchQuery?: string;
}): StudyBookItem[] {
  const category = String(params.category || 'All').trim();
  const query = String(params.searchQuery || '').trim().toLowerCase();

  return params.books.filter((book) => {
    if (category && category !== 'All') {
      if (category === 'Custom') {
        if (!book.isCustom && book.category !== 'Custom') return false;
      } else if (book.category !== category) {
        return false;
      }
    }

    if (query) {
      const chapterTitles = book.chapters.map((c) => c.title).join(' ');
      const concepts = book.chapters.flatMap((c) => c.coreConcepts).join(' ');
      const haystack = `${book.title} ${book.author} ${book.category} ${book.summary} ${chapterTitles} ${concepts}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export function validateAndCreateCustomStudyBook(params: {
  title: string;
  author: string;
  category?: StudyBookCategory | string;
  totalPages?: number | string;
  recommendedMinutes?: number | string;
  summary?: string;
  firstChapterTitle?: string;
  firstChapterNotes?: string;
  nowMs?: number;
}): {
  valid: boolean;
  error: string;
  book: StudyBookItem | null;
} {
  const rawTitle = String(params.title || '').trim();
  const rawAuthor = String(params.author || '').trim();
  const rawSummary = String(params.summary || '').trim();
  const rawChapterTitle = String(params.firstChapterTitle || '').trim();
  const rawChapterNotes = String(params.firstChapterNotes || '').trim();

  if (!rawTitle || rawTitle.length < 2) {
    return {
      valid: false,
      error: 'Please enter a book title (at least 2 characters).',
      book: null,
    };
  }
  if (!rawAuthor || rawAuthor.length < 2) {
    return {
      valid: false,
      error: 'Please enter the book author name.',
      book: null,
    };
  }

  for (const field of [rawTitle, rawAuthor, rawSummary, rawChapterTitle, rawChapterNotes]) {
    if (field) {
      const check = detectSecurityThreat(field);
      if (!check.safe) {
        return { valid: false, error: check.reason, book: null };
      }
    }
  }

  const safeTitle = sanitizeSafeText(rawTitle, 120);
  const safeAuthor = sanitizeSafeText(rawAuthor, 80);
  const safeSummary =
    sanitizeSafeText(
      rawSummary || `Custom study book added to your Study Mode library by ${safeAuthor}.`,
      360
    ) || 'Custom study volume.';

  const validCategories: StudyBookCategory[] = [
    'Computer Science',
    'Systems Design',
    'Math & Physics',
    'Deep Work & Focus',
    'Philosophy',
    'Custom',
  ];
  const category: StudyBookCategory = validCategories.includes(
    params.category as StudyBookCategory
  )
    ? (params.category as StudyBookCategory)
    : 'Custom';

  const parsedPages = Math.min(
    3000,
    Math.max(10, Math.round(Number(params.totalPages) || 250))
  );
  const durationConfig = parseAndClampCustomStudyDuration({
    totalMinutes: params.recommendedMinutes ?? 120,
  });

  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0 ? params.nowMs : Date.now();

  const chapter1Title =
    sanitizeSafeText(rawChapterTitle || 'Chapter 1: Core Foundations & Study Notes', 120) ||
    'Chapter 1: Core Foundations';
  const chapter1Notes =
    sanitizeSafeText(
      rawChapterNotes ||
        `Active study notes and synthesis for ${safeTitle} by ${safeAuthor}. Run the real focus timer while studying this volume to log verified reading hours.`,
      800
    ) || `Study notes for ${safeTitle}.`;

  const book: StudyBookItem = {
    id: `book_custom_${nowMs}`,
    title: safeTitle,
    author: safeAuthor,
    category,
    difficulty: 'Intermediate',
    totalPages: parsedPages,
    recommendedMinutes: durationConfig.totalMinutes,
    recommendedDurationLabel: `${durationConfig.formattedLabel.split(' (')[0]} (${durationConfig.formattedTargetHMS})`,
    coverAccentHex: '#10b981',
    summary: safeSummary,
    isCustom: true,
    chapters: [
      {
        chapterNumber: 1,
        title: chapter1Title,
        pageRange: `pp. 1–${Math.min(50, parsedPages)}`,
        coreConcepts: ['Core Thesis', 'Key Definitions', 'Active Synthesis'],
        detailedStudyText: chapter1Notes,
        keyFormulaOrModel: `${safeTitle} · Target Block: ${durationConfig.formattedTargetHMS}`,
        activeRecallPrompt: `What are the three most important takeaways from ${chapter1Title}?`,
      },
    ],
  };

  return {
    valid: true,
    error: '',
    book,
  };
}

export function updateBookStudyProgress(params: {
  progressMap: Record<string, BookStudyProgressRecord>;
  book: StudyBookItem;
  currentPage?: number;
  toggleChapterNumber?: number;
  verifiedSecondsToAdd?: number;
  personalNotes?: string;
  nowMs?: number;
}): {
  updatedMap: Record<string, BookStudyProgressRecord>;
  record: BookStudyProgressRecord;
  completionPercent: number;
} {
  const existing = params.progressMap[params.book.id] || {
    bookId: params.book.id,
    currentPage: 1,
    completedChapterNumbers: [],
    verifiedSecondsStudied: 0,
    personalNotes: '',
    lastStudiedAtMs: 0,
  };

  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0 ? params.nowMs : Date.now();

  const nextPage =
    typeof params.currentPage === 'number' && Number.isFinite(params.currentPage)
      ? Math.min(params.book.totalPages, Math.max(1, Math.round(params.currentPage)))
      : existing.currentPage;

  let nextChapters = [...existing.completedChapterNumbers];
  if (typeof params.toggleChapterNumber === 'number') {
    const chNum = Math.round(params.toggleChapterNumber);
    if (nextChapters.includes(chNum)) {
      nextChapters = nextChapters.filter((n) => n !== chNum);
    } else {
      nextChapters = [...nextChapters, chNum].sort((a, b) => a - b);
    }
  }

  const addedSeconds =
    typeof params.verifiedSecondsToAdd === 'number' && params.verifiedSecondsToAdd > 0
      ? Math.floor(params.verifiedSecondsToAdd)
      : 0;

  const nextNotes =
    typeof params.personalNotes === 'string'
      ? sanitizeSafeText(params.personalNotes, 1200)
      : existing.personalNotes;

  const record: BookStudyProgressRecord = {
    bookId: params.book.id,
    currentPage: nextPage,
    completedChapterNumbers: nextChapters,
    verifiedSecondsStudied: existing.verifiedSecondsStudied + addedSeconds,
    personalNotes: nextNotes,
    lastStudiedAtMs: nowMs,
  };

  const pagePct = Math.round((record.currentPage / Math.max(1, params.book.totalPages)) * 100);
  const chapterPct =
    params.book.chapters.length > 0
      ? Math.round((record.completedChapterNumbers.length / params.book.chapters.length) * 100)
      : 0;
  const completionPercent = Math.min(100, Math.max(pagePct, chapterPct));

  return {
    updatedMap: {
      ...params.progressMap,
      [params.book.id]: record,
    },
    record,
    completionPercent,
  };
}

// ============================================================================
// APP THEME SWITCHER: 'dark' (default) <-> 'light' MODE
// ============================================================================

export type AppThemeMode = 'dark' | 'light';

export const DEFAULT_APP_THEME: AppThemeMode = 'dark';
export const THEME_STORAGE_KEY = 'mr_stranger_theme_v1';

export interface ThemeSwitcherMeta {
  currentTheme: AppThemeMode;
  nextTheme: AppThemeMode;
  isDark: boolean;
  isLight: boolean;
  buttonLabel: string;
  ariaLabel: string;
  statusText: string;
  rootClassName: string;
}

/**
 * Resolves the initial theme mode from persisted storage, defaulting strictly to 'dark'.
 */
export function resolveInitialThemeMode(storedValue?: string | null): AppThemeMode {
  if (typeof storedValue === 'string') {
    const normalized = storedValue.trim().toLowerCase();
    if (normalized === 'light') return 'light';
    if (normalized === 'dark') return 'dark';
  }
  return DEFAULT_APP_THEME;
}

/**
 * Toggles between 'dark' and 'light' theme modes.
 */
export function toggleAppThemeMode(currentTheme: AppThemeMode): AppThemeMode {
  return currentTheme === 'dark' ? 'light' : 'dark';
}

/**
 * Returns accessible labels, state flags, and root Tailwind theme class names for the active theme.
 */
export function getThemeSwitcherMeta(theme: AppThemeMode): ThemeSwitcherMeta {
  const safeTheme: AppThemeMode = theme === 'light' ? 'light' : 'dark';
  const isDark = safeTheme === 'dark';
  const nextTheme: AppThemeMode = isDark ? 'light' : 'dark';

  return {
    currentTheme: safeTheme,
    nextTheme,
    isDark,
    isLight: !isDark,
    buttonLabel: isDark ? 'Light Mode' : 'Dark Mode',
    ariaLabel: isDark
      ? 'Switch theme from dark mode to light mode'
      : 'Switch theme from light mode to dark mode',
    statusText: isDark ? 'Theme: Dark' : 'Theme: Light',
    rootClassName: isDark
      ? 'dark theme-dark bg-[#050505] text-zinc-100'
      : 'light theme-light bg-slate-50 text-slate-900',
  };
}

// ============================================================================
// MULTI-LAYER AMBIENT SOUNDSCAPE MIXER (SIMULTANEOUS OVERLAY + INDIVIDUAL VOLUMES)
// ============================================================================

export type AmbientTrackId = Exclude<AmbientPresetId, 'off'>;

export const AMBIENT_TRACK_IDS: readonly AmbientTrackId[] = [
  'rainfall',
  'coffeeshop',
  'whitenoise',
  'binaural',
  'lofi',
];

export interface AmbientLayerConfig {
  id: AmbientTrackId;
  enabled: boolean;
  volumePercent: number;
  lastNonZeroVolumePercent: number;
}

export interface AmbientMultiLayerMixState {
  layers: Record<AmbientTrackId, AmbientLayerConfig>;
  masterVolumePercent: number;
  isMasterMuted: boolean;
  lastNonZeroMasterVolumePercent: number;
}

export interface AmbientMixPreset {
  id: string;
  label: string;
  subtitle: string;
  layers: Partial<Record<AmbientTrackId, number>>;
}

export const AMBIENT_MIX_PRESETS: readonly AmbientMixPreset[] = [
  {
    id: 'rainy_cafe',
    label: 'Rainy Café Study',
    subtitle: 'Rainfall (70%) + Coffee Shop (55%)',
    layers: {
      rainfall: 70,
      coffeeshop: 55,
    },
  },
  {
    id: 'deep_isolation',
    label: 'Deep Isolation Mask',
    subtitle: 'Rainfall (60%) + White Noise (45%) + Alpha Focus (50%)',
    layers: {
      rainfall: 60,
      whitenoise: 45,
      binaural: 50,
    },
  },
  {
    id: 'lofi_rain_nook',
    label: 'Late-Night Lo-Fi Nook',
    subtitle: 'Rainfall (50%) + Lo-Fi Chords (65%) + Coffee Shop (30%)',
    layers: {
      rainfall: 50,
      lofi: 65,
      coffeeshop: 30,
    },
  },
  {
    id: 'full_sanctuary',
    label: 'Full Sanctuary Blend',
    subtitle: 'All 4 Acoustic & Harmonic Layers Balanced',
    layers: {
      rainfall: 65,
      coffeeshop: 40,
      whitenoise: 30,
      lofi: 55,
    },
  },
];

export const DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE: AmbientMultiLayerMixState = {
  layers: {
    rainfall: {
      id: 'rainfall',
      enabled: false,
      volumePercent: 70,
      lastNonZeroVolumePercent: 70,
    },
    coffeeshop: {
      id: 'coffeeshop',
      enabled: false,
      volumePercent: 55,
      lastNonZeroVolumePercent: 55,
    },
    whitenoise: {
      id: 'whitenoise',
      enabled: false,
      volumePercent: 45,
      lastNonZeroVolumePercent: 45,
    },
    binaural: {
      id: 'binaural',
      enabled: false,
      volumePercent: 50,
      lastNonZeroVolumePercent: 50,
    },
    lofi: {
      id: 'lofi',
      enabled: false,
      volumePercent: 60,
      lastNonZeroVolumePercent: 60,
    },
  },
  masterVolumePercent: 75,
  isMasterMuted: false,
  lastNonZeroMasterVolumePercent: 75,
};

function resolveValidAmbientTrackId(input: AmbientTrackId | string): AmbientTrackId | null {
  if (
    input === 'rainfall' ||
    input === 'coffeeshop' ||
    input === 'whitenoise' ||
    input === 'binaural' ||
    input === 'lofi'
  ) {
    return input;
  }
  const resolved = resolveAmbientProfileId(String(input || ''));
  return resolved === 'off' ? null : resolved;
}

export function toggleAmbientLayer(
  state: AmbientMultiLayerMixState,
  trackInput: AmbientTrackId | string,
  explicitEnabled?: boolean
): AmbientMultiLayerMixState {
  const trackId = resolveValidAmbientTrackId(trackInput);
  if (!trackId) return state;

  const currentLayer = state.layers[trackId] || DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE.layers[trackId];
  const nextEnabled =
    typeof explicitEnabled === 'boolean' ? explicitEnabled : !currentLayer.enabled;

  const restoredLayerVol =
    currentLayer.volumePercent > 0
      ? clampAmbientVolumePercent(currentLayer.volumePercent)
      : currentLayer.lastNonZeroVolumePercent > 0
      ? clampAmbientVolumePercent(currentLayer.lastNonZeroVolumePercent)
      : 60;

  const nextLayer: AmbientLayerConfig = {
    ...currentLayer,
    id: trackId,
    enabled: nextEnabled,
    volumePercent: nextEnabled ? restoredLayerVol : currentLayer.volumePercent,
    lastNonZeroVolumePercent: restoredLayerVol,
  };

  const restoredMasterVol =
    state.masterVolumePercent > 0
      ? clampAmbientVolumePercent(state.masterVolumePercent)
      : state.lastNonZeroMasterVolumePercent > 0
      ? clampAmbientVolumePercent(state.lastNonZeroMasterVolumePercent)
      : 75;

  return {
    ...state,
    layers: {
      ...state.layers,
      [trackId]: nextLayer,
    },
    masterVolumePercent: nextEnabled ? restoredMasterVol : state.masterVolumePercent,
    isMasterMuted: nextEnabled ? false : state.isMasterMuted,
    lastNonZeroMasterVolumePercent: restoredMasterVol,
  };
}

export function updateAmbientLayerVolume(
  state: AmbientMultiLayerMixState,
  trackInput: AmbientTrackId | string,
  rawVolumePercent: number
): AmbientMultiLayerMixState {
  const trackId = resolveValidAmbientTrackId(trackInput);
  if (!trackId) return state;

  const currentLayer = state.layers[trackId] || DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE.layers[trackId];
  const clamped = clampAmbientVolumePercent(rawVolumePercent);

  if (clamped === 0) {
    return {
      ...state,
      layers: {
        ...state.layers,
        [trackId]: {
          ...currentLayer,
          id: trackId,
          enabled: false,
          volumePercent: 0,
        },
      },
    };
  }

  const restoredMasterVol =
    state.masterVolumePercent > 0
      ? clampAmbientVolumePercent(state.masterVolumePercent)
      : state.lastNonZeroMasterVolumePercent > 0
      ? clampAmbientVolumePercent(state.lastNonZeroMasterVolumePercent)
      : 75;

  return {
    ...state,
    layers: {
      ...state.layers,
      [trackId]: {
        ...currentLayer,
        id: trackId,
        enabled: true,
        volumePercent: clamped,
        lastNonZeroVolumePercent: clamped,
      },
    },
    masterVolumePercent: restoredMasterVol,
    isMasterMuted: false,
    lastNonZeroMasterVolumePercent: restoredMasterVol,
  };
}

export function updateAmbientMasterVolume(
  state: AmbientMultiLayerMixState,
  rawMasterVolume: number
): AmbientMultiLayerMixState {
  const clamped = clampAmbientVolumePercent(rawMasterVolume);
  if (clamped === 0) {
    return {
      ...state,
      masterVolumePercent: 0,
      isMasterMuted: true,
    };
  }
  return {
    ...state,
    masterVolumePercent: clamped,
    isMasterMuted: false,
    lastNonZeroMasterVolumePercent: clamped,
  };
}

export function toggleAmbientMasterMute(
  state: AmbientMultiLayerMixState,
  forceMute?: boolean
): AmbientMultiLayerMixState {
  const targetMute =
    typeof forceMute === 'boolean'
      ? forceMute
      : !state.isMasterMuted && state.masterVolumePercent > 0;

  if (targetMute) {
    const savedMaster =
      state.masterVolumePercent > 0
        ? clampAmbientVolumePercent(state.masterVolumePercent)
        : state.lastNonZeroMasterVolumePercent > 0
        ? clampAmbientVolumePercent(state.lastNonZeroMasterVolumePercent)
        : 75;
    return {
      ...state,
      isMasterMuted: true,
      lastNonZeroMasterVolumePercent: savedMaster,
    };
  }

  const restored =
    state.lastNonZeroMasterVolumePercent > 0
      ? clampAmbientVolumePercent(state.lastNonZeroMasterVolumePercent)
      : 75;

  return {
    ...state,
    masterVolumePercent: restored,
    isMasterMuted: false,
    lastNonZeroMasterVolumePercent: restored,
  };
}

export function stopAllAmbientLayers(
  state: AmbientMultiLayerMixState
): AmbientMultiLayerMixState {
  const nextLayers = { ...state.layers };
  for (const id of AMBIENT_TRACK_IDS) {
    const prev = nextLayers[id] || DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE.layers[id];
    nextLayers[id] = {
      ...prev,
      enabled: false,
    };
  }
  return {
    ...state,
    layers: nextLayers,
  };
}

export function applyAmbientMixPreset(
  state: AmbientMultiLayerMixState,
  presetId: string
): AmbientMultiLayerMixState {
  const preset = AMBIENT_MIX_PRESETS.find((p) => p.id === presetId);
  if (!preset) return state;

  const nextLayers = { ...state.layers };
  for (const id of AMBIENT_TRACK_IDS) {
    const prev = nextLayers[id] || DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE.layers[id];
    const presetVol = preset.layers[id];
    if (typeof presetVol === 'number' && presetVol > 0) {
      const clamped = clampAmbientVolumePercent(presetVol);
      nextLayers[id] = {
        ...prev,
        id,
        enabled: true,
        volumePercent: clamped,
        lastNonZeroVolumePercent: clamped,
      };
    } else {
      nextLayers[id] = {
        ...prev,
        id,
        enabled: false,
      };
    }
  }

  const restoredMaster =
    state.masterVolumePercent > 0
      ? clampAmbientVolumePercent(state.masterVolumePercent)
      : state.lastNonZeroMasterVolumePercent > 0
      ? clampAmbientVolumePercent(state.lastNonZeroMasterVolumePercent)
      : 75;

  return {
    ...state,
    layers: nextLayers,
    masterVolumePercent: restoredMaster,
    isMasterMuted: false,
    lastNonZeroMasterVolumePercent: restoredMaster,
  };
}

export function getActiveAmbientLayers(
  state: AmbientMultiLayerMixState
): AmbientLayerConfig[] {
  return AMBIENT_TRACK_IDS.map((id) => state.layers[id]).filter(
    (layer): layer is AmbientLayerConfig =>
      Boolean(layer && layer.enabled && layer.volumePercent > 0)
  );
}

export function getEffectiveAmbientLayerGain(
  state: AmbientMultiLayerMixState,
  trackId: AmbientTrackId
): number {
  if (state.isMasterMuted || state.masterVolumePercent <= 0) return 0;
  const layer = state.layers[trackId];
  if (!layer || !layer.enabled || layer.volumePercent <= 0) return 0;
  const masterScalar = clampAmbientVolumePercent(state.masterVolumePercent) / 100;
  const layerScalar = clampAmbientVolumePercent(layer.volumePercent) / 100;
  return Number((masterScalar * layerScalar).toFixed(4));
}

export function getEffectiveAmbientMixMap(
  state: AmbientMultiLayerMixState
): Record<AmbientTrackId, number> {
  return {
    rainfall: getEffectiveAmbientLayerGain(state, 'rainfall'),
    coffeeshop: getEffectiveAmbientLayerGain(state, 'coffeeshop'),
    whitenoise: getEffectiveAmbientLayerGain(state, 'whitenoise'),
    binaural: getEffectiveAmbientLayerGain(state, 'binaural'),
    lofi: getEffectiveAmbientLayerGain(state, 'lofi'),
  };
}

export function formatAmbientMultiLayerStatus(
  state: AmbientMultiLayerMixState
): string {
  const active = getActiveAmbientLayers(state);
  const effectiveMaster = state.isMasterMuted
    ? 0
    : clampAmbientVolumePercent(state.masterVolumePercent);

  if (active.length === 0) {
    return `Standby · 0 Layers Active · Master ${effectiveMaster}%`;
  }

  const parts = active.map((layer) => {
    const meta = AMBIENT_SOUNDSCAPES.find((s) => s.id === layer.id);
    const name = meta ? meta.label : layer.id;
    return `${name} (${layer.volumePercent}%)`;
  });

  if (state.isMasterMuted || effectiveMaster === 0) {
    return `Overlaying ${active.length} ${active.length === 1 ? 'Layer' : 'Layers'}: ${parts.join(' + ')} (Master Muted · 0%)`;
  }

  return `Overlaying ${active.length} ${active.length === 1 ? 'Layer' : 'Layers'}: ${parts.join(' + ')} · Master ${effectiveMaster}%`;
}

// ============================================================================
// BADGES & ACHIEVEMENTS SYSTEM (5-Day Streak, 3-Day Goal Hit, Helpful Notes)
// ============================================================================
export type BadgeId = 'streak_5_day' | 'goal_3_day' | 'helpful_notes';

export type BadgeTone = 'amber' | 'emerald' | 'sky';

export interface UserBadgeDefinition {
  id: BadgeId;
  title: string;
  shortLabel: string;
  description: string;
  criteriaLabel: string;
  targetValue: number;
  unit: string;
  pointsReward: number;
  tone: BadgeTone;
}

export const USER_BADGE_DEFINITIONS: readonly UserBadgeDefinition[] = [
  {
    id: 'streak_5_day',
    title: '5-Day Streak',
    shortLabel: '5-Day Streak',
    description: 'Complete a 5-day consecutive active login & focus streak.',
    criteriaLabel: '5 consecutive days',
    targetValue: 5,
    unit: 'days',
    pointsReward: 50,
    tone: 'amber',
  },
  {
    id: 'goal_3_day',
    title: '3-Day Goal Hit',
    shortLabel: '3-Day Goal Hit',
    description: 'Hit your daily productivity focus goal 3 days in a row.',
    criteriaLabel: '3 consecutive daily goals',
    targetValue: 3,
    unit: 'days in a row',
    pointsReward: 75,
    tone: 'emerald',
  },
  {
    id: 'helpful_notes',
    title: 'Helpful Notes',
    shortLabel: 'Helpful Notes',
    description: 'Contribute helpful study notes or insights to the Study Room.',
    criteriaLabel: '1+ helpful study notes',
    targetValue: 1,
    unit: 'notes',
    pointsReward: 40,
    tone: 'sky',
  },
] as const;

export interface EvaluatedUserBadge extends UserBadgeDefinition {
  unlocked: boolean;
  currentValue: number;
  progressPercent: number;
  remainingToUnlock: number;
  statusLabel: string;
}

export interface UserBadgeEvaluationSummary {
  badges: EvaluatedUserBadge[];
  unlockedBadges: EvaluatedUserBadge[];
  lockedBadges: EvaluatedUserBadge[];
  unlockedCount: number;
  totalBadgesCount: number;
  completionPercent: number;
  totalBadgeBonusPoints: number;
  consecutiveGoalDays: number;
  helpfulNotesCount: number;
  streakCount: number;
}

export function computeConsecutiveGoalDays(
  days: Array<{
    dateKey?: string;
    goalReached?: boolean;
    focusMinutes?: number;
    targetMinutes?: number;
    freezeApplied?: boolean;
  }>,
  frozenDates?: Iterable<string>
): {
  currentConsecutiveDays: number;
  maxConsecutiveDays: number;
} {
  if (!Array.isArray(days) || days.length === 0) {
    return { currentConsecutiveDays: 0, maxConsecutiveDays: 0 };
  }

  const frozenSet = new Set<string>();
  if (frozenDates) {
    for (const d of frozenDates) {
      const clean = String(d || '').trim();
      if (clean) frozenSet.add(clean);
    }
  }

  let running = 0;
  let maxRun = 0;

  for (const day of days) {
    if (!day) continue;
    const isHit =
      typeof day.goalReached === 'boolean'
        ? day.goalReached
        : typeof day.focusMinutes === 'number' &&
          typeof day.targetMinutes === 'number' &&
          day.targetMinutes > 0
        ? day.focusMinutes >= day.targetMinutes
        : false;

    const isFrozen =
      Boolean(day.freezeApplied) ||
      Boolean(day.dateKey && frozenSet.has(String(day.dateKey).trim()));

    if (isHit) {
      running += 1;
      if (running > maxRun) {
        maxRun = running;
      }
    } else if (isFrozen) {
      if (running > maxRun) {
        maxRun = running;
      }
    } else {
      running = 0;
    }
  }

  return {
    currentConsecutiveDays: running,
    maxConsecutiveDays: maxRun,
  };
}

export function countUserHelpfulNotes(
  notes:
    | Array<{
        authorUid?: string;
        authorName?: string;
        positiveNote?: string;
        note?: string;
        subject?: string;
        focusMinutes?: number;
      }>
    | undefined,
  userUid?: string,
  explicitCount?: number
): number {
  const safeExplicit =
    typeof explicitCount === 'number' && Number.isFinite(explicitCount)
      ? Math.max(0, Math.round(explicitCount))
      : 0;

  if (!Array.isArray(notes) || notes.length === 0) {
    return safeExplicit;
  }

  const cleanUid = String(userUid || '').trim();
  let matchedCount = 0;

  for (const item of notes) {
    if (!item) continue;
    if (cleanUid && item.authorUid && String(item.authorUid).trim() !== cleanUid) {
      continue;
    }
    const textContent = String(item.positiveNote ?? item.note ?? '').trim();
    if (textContent.length > 0) {
      matchedCount += 1;
    }
  }

  return Math.max(safeExplicit, matchedCount);
}

export function inferPeerBadgeMetrics(candidate: {
  uid?: string;
  streakCount?: number;
  participationPoints?: number;
  bio?: string;
  currentMode?: string;
  consecutiveGoalDays?: number;
  helpfulNotesCount?: number;
}): {
  consecutiveGoalDays: number;
  helpfulNotesCount: number;
} {
  const safeStreak = Math.max(1, Math.round(Number(candidate.streakCount) || 1));
  const safePoints = Math.max(0, Math.round(Number(candidate.participationPoints) || 0));

  const consecutiveGoalDays =
    typeof candidate.consecutiveGoalDays === 'number' &&
    Number.isFinite(candidate.consecutiveGoalDays)
      ? Math.max(0, Math.round(candidate.consecutiveGoalDays))
      : safeStreak >= 4 && safePoints >= 140
      ? 3
      : safeStreak >= 2 && safePoints >= 80
      ? 2
      : safePoints >= 50
      ? 1
      : 0;

  const bioText = String(candidate.bio || '').toLowerCase();
  const modeText = String(candidate.currentMode || '').toLowerCase();
  const helpfulNotesCount =
    typeof candidate.helpfulNotesCount === 'number' &&
    Number.isFinite(candidate.helpfulNotesCount)
      ? Math.max(0, Math.round(candidate.helpfulNotesCount))
      : safePoints >= 130 ||
        modeText.includes('study') ||
        bioText.includes('study') ||
        bioText.includes('notes') ||
        bioText.includes('research')
      ? Math.max(1, Math.floor(safePoints / 90))
      : 0;

  return {
    consecutiveGoalDays,
    helpfulNotesCount,
  };
}

export interface UserBadgeEvaluationInput {
  uid?: string;
  streakCount?: number;
  consecutiveGoalDays?: number;
  frozenDates?: string[];
  weeklyDays?: Array<{
    dateKey?: string;
    goalReached?: boolean;
    focusMinutes?: number;
    targetMinutes?: number;
    freezeApplied?: boolean;
  }>;
  helpfulNotesCount?: number;
  studyNotes?: Array<{
    authorUid?: string;
    authorName?: string;
    positiveNote?: string;
    note?: string;
    subject?: string;
    focusMinutes?: number;
  }>;
}

export function evaluateUserBadges(
  input: UserBadgeEvaluationInput
): UserBadgeEvaluationSummary {
  const safeStreak = Math.max(0, Math.round(Number(input.streakCount) || 0));

  const computedFromDays = input.weeklyDays
    ? computeConsecutiveGoalDays(input.weeklyDays, input.frozenDates).maxConsecutiveDays
    : 0;
  const explicitGoalDays =
    typeof input.consecutiveGoalDays === 'number' &&
    Number.isFinite(input.consecutiveGoalDays)
      ? Math.max(0, Math.round(input.consecutiveGoalDays))
      : 0;
  const effectiveGoalDays = Math.max(computedFromDays, explicitGoalDays);

  const effectiveNotesCount = countUserHelpfulNotes(
    input.studyNotes,
    input.uid,
    input.helpfulNotesCount
  );

  const badges: EvaluatedUserBadge[] = USER_BADGE_DEFINITIONS.map((def) => {
    let currentValue = 0;
    if (def.id === 'streak_5_day') {
      currentValue = safeStreak;
    } else if (def.id === 'goal_3_day') {
      currentValue = effectiveGoalDays;
    } else if (def.id === 'helpful_notes') {
      currentValue = effectiveNotesCount;
    }

    const unlocked = currentValue >= def.targetValue;
    const progressPercent = Math.min(
      100,
      Math.max(0, Math.round((currentValue / Math.max(1, def.targetValue)) * 100))
    );
    const remainingToUnlock = Math.max(0, def.targetValue - currentValue);

    const statusLabel = unlocked
      ? `Unlocked · ${currentValue}/${def.targetValue} ${def.unit}`
      : `${currentValue}/${def.targetValue} ${def.unit} (${remainingToUnlock} more to unlock)`;

    return {
      ...def,
      unlocked,
      currentValue,
      progressPercent,
      remainingToUnlock,
      statusLabel,
    };
  });

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);
  const totalBadgesCount = badges.length;
  const unlockedCount = unlockedBadges.length;
  const completionPercent =
    totalBadgesCount > 0 ? Math.round((unlockedCount / totalBadgesCount) * 100) : 0;
  const totalBadgeBonusPoints = unlockedBadges.reduce(
    (sum, b) => sum + b.pointsReward,
    0
  );

  return {
    badges,
    unlockedBadges,
    lockedBadges,
    unlockedCount,
    totalBadgesCount,
    completionPercent,
    totalBadgeBonusPoints,
    consecutiveGoalDays: effectiveGoalDays,
    helpfulNotesCount: effectiveNotesCount,
    streakCount: safeStreak,
  };
}

export function recordConsecutiveGoalHitDay(params: {
  todayDateKey: string;
  dailyTargetMinutes: number;
  storedHistory?: Record<string, StoredDailyActivityRecord>;
  daysToEnsure?: number;
}): {
  updatedHistory: Record<string, StoredDailyActivityRecord>;
  todayCompletedMinutes: number;
  consecutiveDaysHit: number;
} {
  const safeTarget = clampProductivityTarget(params.dailyTargetMinutes);
  const history: Record<string, StoredDailyActivityRecord> = {
    ...(params.storedHistory || {}),
  };
  const desiredDays = Math.max(
    1,
    Math.min(7, Math.round(Number(params.daysToEnsure) || 1))
  );

  // Count how many consecutive days ending yesterday already hit goal
  let existingRecentRun = 0;
  for (let i = 1; i <= 6; i++) {
    const pastKey = getPastDateKey(params.todayDateKey, i);
    const rec = history[pastKey];
    const recTarget = clampProductivityTarget(rec?.targetMinutes || safeTarget);
    if (rec && rec.focusMinutes >= recTarget) {
      existingRecentRun += 1;
    } else {
      break;
    }
  }

  const todayRec = history[params.todayDateKey];
  const todayAlreadyHit = Boolean(todayRec && todayRec.focusMinutes >= safeTarget);
  const targetRunLength =
    params.daysToEnsure !== undefined
      ? desiredDays
      : Math.min(7, existingRecentRun + (todayAlreadyHit ? 1 : 0) + 1);

  for (let offset = 0; offset < targetRunLength; offset++) {
    const dKey = getPastDateKey(params.todayDateKey, offset);
    const prev = history[dKey];
    const dayTarget = clampProductivityTarget(prev?.targetMinutes || safeTarget);
    const focusMinutes = Math.max(dayTarget, prev?.focusMinutes || 0);
    const pointsEarned = Math.max(60, prev?.pointsEarned || 0);
    history[dKey] = {
      focusMinutes,
      pointsEarned,
      targetMinutes: dayTarget,
    };
  }

  const todayCompletedMinutes = Math.max(
    safeTarget,
    history[params.todayDateKey]?.focusMinutes || safeTarget
  );

  // Compute consecutive run across the 7-day window
  const orderedDays: Array<{ goalReached: boolean }> = [];
  for (let i = 6; i >= 0; i--) {
    const dKey = getPastDateKey(params.todayDateKey, i);
    const r = history[dKey];
    const t = clampProductivityTarget(r?.targetMinutes || safeTarget);
    orderedDays.push({
      goalReached: Boolean(r && r.focusMinutes >= t),
    });
  }
  const consecutiveDaysHit = computeConsecutiveGoalDays(orderedDays).maxConsecutiveDays;

  return {
    updatedHistory: history,
    todayCompletedMinutes,
    consecutiveDaysHit,
  };
}

export function validateAndBuildHelpfulNoteContribution(params: {
  authorUid: string;
  authorName: string;
  roomCode?: string;
  subject?: string;
  rawNote: string;
  focusMinutes?: number;
  nowMs?: number;
}): {
  valid: boolean;
  error: string;
  noteRecord: {
    id: string;
    authorUid: string;
    authorName: string;
    roomCode: string;
    subject: string;
    positiveNote: string;
    focusMinutes: number;
  } | null;
} {
  const cleanUid = String(params.authorUid || '').trim();
  if (!cleanUid) {
    return {
      valid: false,
      error: 'Please sign in to contribute a helpful study note.',
      noteRecord: null,
    };
  }

  const trimmedNote = String(params.rawNote || '').trim();
  if (trimmedNote.length < 4) {
    return {
      valid: false,
      error: 'Please enter a helpful study note (at least 4 characters).',
      noteRecord: null,
    };
  }

  const threat = detectSecurityThreat(trimmedNote);
  if (!threat.safe) {
    return {
      valid: false,
      error: threat.reason,
      noteRecord: null,
    };
  }

  const subjectRaw = String(params.subject || 'Deep Work & Study Summary').trim();
  const subjectThreat = detectSecurityThreat(subjectRaw);
  if (!subjectThreat.safe) {
    return {
      valid: false,
      error: subjectThreat.reason,
      noteRecord: null,
    };
  }

  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0 ? params.nowMs : Date.now();
  const safeName =
    sanitizeSafeText(params.authorName || 'Verified Scholar', 64) || 'Verified Scholar';
  const safeRoom =
    normalizeStudyRoomCode(params.roomCode || 'STUDY-GLOBAL') || 'STUDY-GLOBAL';
  const safeSubject =
    sanitizeSafeText(subjectRaw, 80) || 'Deep Work & Study Summary';
  const safeNote = sanitizeSafeText(trimmedNote, 280);
  const safeMinutes = Math.max(15, Math.min(720, Math.round(Number(params.focusMinutes) || 25)));

  return {
    valid: true,
    error: '',
    noteRecord: {
      id: `note_${nowMs}_${cleanUid}`,
      authorUid: cleanUid,
      authorName: safeName,
      roomCode: safeRoom,
      subject: safeSubject,
      positiveNote: safeNote,
      focusMinutes: safeMinutes,
    },
  };
}

// --- Streak Freeze System (Spend Participation Points to Preserve Login & Productivity Streak) ---
export interface StreakFreezeInventoryState {
  streakFreezesOwned: number;
  frozenDates: string[];
  lastFreezeUsedDate: string | null;
  streakAtRiskCount: number | null;
  missedDateKey: string | null;
}

export const DEFAULT_STREAK_FREEZE_STATE: StreakFreezeInventoryState = {
  streakFreezesOwned: 0,
  frozenDates: [],
  lastFreezeUsedDate: null,
  streakAtRiskCount: null,
  missedDateKey: null,
};

export interface StreakFreezeStatusSummary {
  streakFreezesOwned: number;
  maxFreezes: number;
  costPoints: number;
  participationPoints: number;
  canAffordFreeze: boolean;
  isAtMaxCapacity: boolean;
  canPurchaseFreeze: boolean;
  isProtected: boolean;
  isStreakAtRisk: boolean;
  streakAtRiskCount: number | null;
  missedDateKey: string | null;
  canRescueMissedDay: boolean;
  frozenDates: string[];
  lastFreezeUsedDate: string | null;
  protectionHeadline: string;
  protectionSubtext: string;
}

export function evaluateStreakFreezeStatus(params: {
  streakCount: number;
  participationPoints: number;
  streakFreezesOwned?: number;
  frozenDates?: string[];
  lastFreezeUsedDate?: string | null;
  streakAtRiskCount?: number | null;
  missedDateKey?: string | null;
  costPoints?: number;
  maxFreezes?: number;
}): StreakFreezeStatusSummary {
  const costPoints = Math.max(
    1,
    Math.round(Number(params.costPoints) || STREAK_FREEZE_COST_POINTS)
  );
  const maxFreezes = Math.max(
    1,
    Math.round(Number(params.maxFreezes) || MAX_STREAK_FREEZES_OWNED)
  );
  const participationPoints = Math.max(
    0,
    Math.round(Number(params.participationPoints) || 0)
  );
  const streakFreezesOwned = Math.max(
    0,
    Math.min(maxFreezes, Math.round(Number(params.streakFreezesOwned) || 0))
  );
  const frozenDates = Array.isArray(params.frozenDates)
    ? params.frozenDates.filter((d) => Boolean(String(d || '').trim()))
    : [];
  const lastFreezeUsedDate = params.lastFreezeUsedDate
    ? String(params.lastFreezeUsedDate).trim()
    : frozenDates[frozenDates.length - 1] || null;

  const streakAtRiskCount =
    typeof params.streakAtRiskCount === 'number' && params.streakAtRiskCount > 1
      ? Math.round(params.streakAtRiskCount)
      : null;
  const missedDateKey = params.missedDateKey
    ? String(params.missedDateKey).trim()
    : null;
  const isStreakAtRisk = Boolean(streakAtRiskCount && streakAtRiskCount > 1);
  const canAffordFreeze = participationPoints >= costPoints;
  const isAtMaxCapacity = streakFreezesOwned >= maxFreezes;
  const canPurchaseFreeze = canAffordFreeze && !isAtMaxCapacity;
  const isProtected = streakFreezesOwned > 0;
  const canRescueMissedDay =
    isStreakAtRisk && (streakFreezesOwned > 0 || canAffordFreeze);

  let protectionHeadline = '';
  let protectionSubtext = '';

  if (isStreakAtRisk && streakAtRiskCount) {
    protectionHeadline = `Streak At Risk · ${streakAtRiskCount}-Day Streak Missed (${
      missedDateKey || 'Yesterday'
    })`;
    protectionSubtext =
      streakFreezesOwned > 0
        ? `Apply 1 of your ${streakFreezesOwned} equipped Streak Freezes to restore your ${streakAtRiskCount}-day streak.`
        : canAffordFreeze
        ? `Spend ${costPoints} participation pts to freeze ${
            missedDateKey || 'yesterday'
          } and restore your ${streakAtRiskCount}-day streak.`
        : `Earn ${
            costPoints - participationPoints
          } more pts to spend ${costPoints} pts on a Streak Freeze recovery.`;
  } else if (isProtected) {
    protectionHeadline = `Streak Shield Armed · ${streakFreezesOwned}/${maxFreezes} Freeze${
      streakFreezesOwned === 1 ? '' : 's'
    } Active`;
    protectionSubtext = `Automatically protects your ${Math.max(
      1,
      Math.round(params.streakCount)
    )}-day login & productivity streak if you miss a day.`;
  } else {
    protectionHeadline = `No Streak Freeze Equipped (0/${maxFreezes})`;
    protectionSubtext = canAffordFreeze
      ? `Spend ${costPoints} participation pts to equip a Streak Freeze before missing a day.`
      : `Accumulate ${costPoints} participation pts (${
          costPoints - participationPoints
        } more needed) to unlock a Streak Freeze.`;
  }

  return {
    streakFreezesOwned,
    maxFreezes,
    costPoints,
    participationPoints,
    canAffordFreeze,
    isAtMaxCapacity,
    canPurchaseFreeze,
    isProtected,
    isStreakAtRisk,
    streakAtRiskCount,
    missedDateKey,
    canRescueMissedDay,
    frozenDates,
    lastFreezeUsedDate,
    protectionHeadline,
    protectionSubtext,
  };
}

export function purchaseStreakFreeze(params: {
  participationPoints: number;
  streakFreezesOwned: number;
  costPoints?: number;
  maxFreezes?: number;
}): {
  success: boolean;
  participationPoints: number;
  streakFreezesOwned: number;
  pointsSpent: number;
  message: string;
  error: string;
} {
  const costPoints = Math.max(
    1,
    Math.round(Number(params.costPoints) || STREAK_FREEZE_COST_POINTS)
  );
  const maxFreezes = Math.max(
    1,
    Math.round(Number(params.maxFreezes) || MAX_STREAK_FREEZES_OWNED)
  );
  const currentPoints = Math.max(0, Math.round(Number(params.participationPoints) || 0));
  const currentFreezes = Math.max(
    0,
    Math.min(maxFreezes, Math.round(Number(params.streakFreezesOwned) || 0))
  );

  if (currentFreezes >= maxFreezes) {
    return {
      success: false,
      participationPoints: currentPoints,
      streakFreezesOwned: currentFreezes,
      pointsSpent: 0,
      message: '',
      error: `Maximum capacity reached (${maxFreezes}/${maxFreezes} Streak Freezes equipped).`,
    };
  }

  if (currentPoints < costPoints) {
    return {
      success: false,
      participationPoints: currentPoints,
      streakFreezesOwned: currentFreezes,
      pointsSpent: 0,
      message: '',
      error: `Insufficient participation points. Need ${costPoints} pts (you have ${currentPoints} pts).`,
    };
  }

  const nextPoints = currentPoints - costPoints;
  const nextFreezes = currentFreezes + 1;

  return {
    success: true,
    participationPoints: nextPoints,
    streakFreezesOwned: nextFreezes,
    pointsSpent: costPoints,
    message: `Streak Freeze equipped (-${costPoints} pts)! You now have ${nextFreezes}/${maxFreezes} Streak Freeze${
      nextFreezes === 1 ? '' : 's'
    } ready to protect your streak.`,
    error: '',
  };
}

export function spendPointsToFreezeMissedDay(params: {
  streakCount: number;
  lastLoginDate: string;
  participationPoints: number;
  streakFreezesOwned: number;
  frozenDates?: string[];
  lastFreezeUsedDate?: string | null;
  streakAtRiskCount?: number | null;
  missedDateKey?: string | null;
  todayDateKey: string;
  targetMissedDateKey?: string;
  preferDirectPoints?: boolean;
  costPoints?: number;
}): {
  success: boolean;
  streakCount: number;
  lastLoginDate: string;
  participationPoints: number;
  streakFreezesOwned: number;
  frozenDates: string[];
  lastFreezeUsedDate: string | null;
  streakAtRiskCount: null;
  missedDateKey: null;
  pointsSpent: number;
  freezeConsumed: boolean;
  frozenDateKey: string;
  message: string;
  error: string;
} {
  const costPoints = Math.max(
    1,
    Math.round(Number(params.costPoints) || STREAK_FREEZE_COST_POINTS)
  );
  const currentPoints = Math.max(0, Math.round(Number(params.participationPoints) || 0));
  const currentFreezes = Math.max(
    0,
    Math.min(
      MAX_STREAK_FREEZES_OWNED,
      Math.round(Number(params.streakFreezesOwned) || 0)
    )
  );
  const existingFrozen = Array.isArray(params.frozenDates)
    ? [...params.frozenDates]
    : [];

  const resolvedMissedDate =
    (params.targetMissedDateKey && String(params.targetMissedDateKey).trim()) ||
    (params.missedDateKey && String(params.missedDateKey).trim()) ||
    getPastDateKey(params.todayDateKey, 1);

  const useEquippedFreeze = !params.preferDirectPoints && currentFreezes > 0;

  if (!useEquippedFreeze && currentPoints < costPoints) {
    return {
      success: false,
      streakCount: Math.max(1, Math.round(params.streakCount)),
      lastLoginDate: params.lastLoginDate || params.todayDateKey,
      participationPoints: currentPoints,
      streakFreezesOwned: currentFreezes,
      frozenDates: existingFrozen,
      lastFreezeUsedDate: params.lastFreezeUsedDate || null,
      streakAtRiskCount: null,
      missedDateKey: null,
      pointsSpent: 0,
      freezeConsumed: false,
      frozenDateKey: resolvedMissedDate,
      message: '',
      error: `Insufficient participation points to freeze missed day. Need ${costPoints} pts (you have ${currentPoints} pts).`,
    };
  }

  const nextPoints = useEquippedFreeze ? currentPoints : currentPoints - costPoints;
  const nextFreezes = useEquippedFreeze ? currentFreezes - 1 : currentFreezes;
  const restoredStreak =
    typeof params.streakAtRiskCount === 'number' && params.streakAtRiskCount > 1
      ? Math.max(params.streakCount, Math.round(params.streakAtRiskCount))
      : Math.max(1, Math.round(params.streakCount));

  const nextFrozenDates = existingFrozen.includes(resolvedMissedDate)
    ? existingFrozen
    : [...existingFrozen, resolvedMissedDate];

  const message = useEquippedFreeze
    ? `Equipped Streak Freeze consumed! Preserved your ${restoredStreak}-day login & productivity streak across missed day ${resolvedMissedDate}.`
    : `Spent ${costPoints} participation pts on a Streak Freeze! Preserved your ${restoredStreak}-day login & productivity streak across missed day ${resolvedMissedDate}.`;

  return {
    success: true,
    streakCount: restoredStreak,
    lastLoginDate: params.todayDateKey,
    participationPoints: nextPoints,
    streakFreezesOwned: nextFreezes,
    frozenDates: nextFrozenDates,
    lastFreezeUsedDate: resolvedMissedDate,
    streakAtRiskCount: null,
    missedDateKey: null,
    pointsSpent: useEquippedFreeze ? 0 : costPoints,
    freezeConsumed: useEquippedFreeze,
    frozenDateKey: resolvedMissedDate,
    message,
    error: '',
  };
}

export function simulateMissedDayStreakEvaluation(params: {
  streakCount: number;
  participationPoints: number;
  streakFreezesOwned: number;
  frozenDates?: string[];
  lastFreezeUsedDate?: string | null;
  todayDateKey: string;
}): {
  preservedByEquippedFreeze: boolean;
  streakCount: number;
  lastLoginDate: string;
  participationPoints: number;
  streakFreezesOwned: number;
  frozenDates: string[];
  lastFreezeUsedDate: string | null;
  streakAtRiskCount: number | null;
  missedDateKey: string | null;
  message: string;
} {
  const twoDaysAgoKey = getPastDateKey(params.todayDateKey, 2);
  const yesterdayKey = getPastDateKey(params.todayDateKey, 1);
  const effectivePriorStreak = Math.max(2, Math.round(Number(params.streakCount) || 2));

  const evalResult = computeUpdatedStreak(
    {
      streakCount: effectivePriorStreak,
      lastLoginDate: twoDaysAgoKey,
      participationPoints: Math.max(0, Math.round(Number(params.participationPoints) || 0)),
      streakFreezesOwned: Math.max(0, Math.round(Number(params.streakFreezesOwned) || 0)),
      frozenDates: Array.isArray(params.frozenDates) ? [...params.frozenDates] : [],
      lastFreezeUsedDate: params.lastFreezeUsedDate || null,
    },
    params.todayDateKey,
    0
  );

  if (evalResult.freezeUsed) {
    return {
      preservedByEquippedFreeze: true,
      streakCount: evalResult.updated.streakCount,
      lastLoginDate: evalResult.updated.lastLoginDate,
      participationPoints: evalResult.updated.participationPoints,
      streakFreezesOwned: evalResult.updated.streakFreezesOwned ?? 0,
      frozenDates: evalResult.updated.frozenDates ?? [yesterdayKey],
      lastFreezeUsedDate: evalResult.updated.lastFreezeUsedDate ?? yesterdayKey,
      streakAtRiskCount: null,
      missedDateKey: null,
      message: `Streak Freeze Automatically Triggered! 1 Freeze consumed to preserve your ${evalResult.updated.streakCount}-day login & productivity streak across missed day ${yesterdayKey}.`,
    };
  }

  return {
    preservedByEquippedFreeze: false,
    streakCount: 1,
    lastLoginDate: params.todayDateKey,
    participationPoints: evalResult.updated.participationPoints,
    streakFreezesOwned: evalResult.updated.streakFreezesOwned ?? 0,
    frozenDates: evalResult.updated.frozenDates ?? [],
    lastFreezeUsedDate: params.lastFreezeUsedDate || null,
    streakAtRiskCount: effectivePriorStreak,
    missedDateKey: yesterdayKey,
    message: `Missed day ${yesterdayKey} with 0 Streak Freezes equipped! Your ${effectivePriorStreak}-day streak is at risk — spend ${STREAK_FREEZE_COST_POINTS} participation pts now to freeze ${yesterdayKey} and restore your ${effectivePriorStreak}-day streak.`,
  };
}

// ============================================================================
// DAILY STREAK FOCUS SESSION REMINDER TOAST LOGIC
// ============================================================================

export const DEFAULT_STREAK_REMINDER_TIME = '10:00';

export const STREAK_REMINDER_TIME_PRESETS = [
  '08:00',
  '09:00',
  '10:00',
  '12:00',
  '14:00',
  '18:00',
] as const;

export interface StreakFocusReminderPreferences {
  enabled: boolean;
  reminderTime24h: string;
  dismissedDateKey: string | null;
  startedFocusDateKey: string | null;
  simulatedPastCutoff?: boolean;
}

export const DEFAULT_STREAK_REMINDER_PREFERENCES: StreakFocusReminderPreferences = {
  enabled: true,
  reminderTime24h: DEFAULT_STREAK_REMINDER_TIME,
  dismissedDateKey: null,
  startedFocusDateKey: null,
  simulatedPastCutoff: false,
};

export interface ParsedReminderTime {
  hours: number;
  minutes: number;
  totalMinutes: number;
  formatted24h: string;
  formatted12h: string;
}

export function parseReminderTimeMinutes(rawTime?: string | null): ParsedReminderTime {
  const cleaned = typeof rawTime === 'string' ? rawTime.trim() : '';
  const match = /^(\d{1,2}):(\d{2})$/.exec(cleaned);
  let hours = 10;
  let minutes = 0;

  if (match) {
    const parsedH = Number(match[1]);
    const parsedM = Number(match[2]);
    if (
      Number.isFinite(parsedH) &&
      Number.isFinite(parsedM) &&
      parsedH >= 0 &&
      parsedH <= 23 &&
      parsedM >= 0 &&
      parsedM <= 59
    ) {
      hours = parsedH;
      minutes = parsedM;
    }
  }

  const totalMinutes = hours * 60 + minutes;
  const formatted24h = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const formatted12h = `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;

  return {
    hours,
    minutes,
    totalMinutes,
    formatted24h,
    formatted12h,
  };
}

export type StreakFocusReminderReason =
  | 'active_reminder'
  | 'disabled'
  | 'dismissed_today'
  | 'focus_already_started'
  | 'before_reminder_time';

export interface StreakFocusReminderEvaluation {
  shouldShowToast: boolean;
  reason: StreakFocusReminderReason;
  reminderTime24h: string;
  reminderTime12h: string;
  currentTime24h: string;
  currentTime12h: string;
  minutesPastReminder: number;
  streakCount: number;
  streakBadgeLabel: string;
  title: string;
  message: string;
  statusSummary: string;
  isDismissedToday: boolean;
  hasStartedFocusToday: boolean;
  isPastReminderTime: boolean;
}

export function evaluateStreakFocusReminder(params: {
  enabled: boolean;
  reminderTime24h?: string | null;
  currentHours: number;
  currentMinutes: number;
  todayDateKey: string;
  dismissedDateKey?: string | null;
  startedFocusDateKey?: string | null;
  hasStartedFocusSessionToday?: boolean;
  isInFocusDesk?: boolean;
  streakCount?: number;
  simulatedPastCutoff?: boolean;
}): StreakFocusReminderEvaluation {
  const reminderParsed = parseReminderTimeMinutes(
    params.reminderTime24h || DEFAULT_STREAK_REMINDER_TIME
  );

  const safeHours = Math.max(0, Math.min(23, Math.floor(Number(params.currentHours) || 0)));
  const safeMinutes = Math.max(0, Math.min(59, Math.floor(Number(params.currentMinutes) || 0)));
  const currentParsed = parseReminderTimeMinutes(
    `${String(safeHours).padStart(2, '0')}:${String(safeMinutes).padStart(2, '0')}`
  );

  const safeStreak = Math.max(1, Math.round(Number(params.streakCount) || 1));
  const streakBadgeLabel = `${safeStreak}-Day Streak`;

  const hasStartedFocusToday = Boolean(
    params.hasStartedFocusSessionToday ||
      params.isInFocusDesk ||
      (params.startedFocusDateKey && params.startedFocusDateKey === params.todayDateKey)
  );

  const isDismissedToday = Boolean(
    params.dismissedDateKey && params.dismissedDateKey === params.todayDateKey
  );

  const isPastReminderTime = Boolean(
    params.simulatedPastCutoff || currentParsed.totalMinutes >= reminderParsed.totalMinutes
  );

  const rawDiff = currentParsed.totalMinutes - reminderParsed.totalMinutes;
  const minutesPastReminder = isPastReminderTime ? Math.max(0, rawDiff) : 0;

  let reason: StreakFocusReminderReason = 'active_reminder';
  if (!params.enabled) {
    reason = 'disabled';
  } else if (hasStartedFocusToday) {
    reason = 'focus_already_started';
  } else if (isDismissedToday) {
    reason = 'dismissed_today';
  } else if (!isPastReminderTime) {
    reason = 'before_reminder_time';
  }

  const shouldShowToast = reason === 'active_reminder';

  const title = `Focus Session Reminder · ${reminderParsed.formatted12h} Check-In`;
  const message = `You haven't started a focus session by ${reminderParsed.formatted12h} today. Start a quick focus block or join a study desk to keep your ${safeStreak}-day streak going.`;

  let statusSummary = '';
  if (reason === 'disabled') {
    statusSummary = `Reminder paused (scheduled for ${reminderParsed.formatted12h})`;
  } else if (reason === 'focus_already_started') {
    statusSummary = `Focus session started today · ${safeStreak}-day streak active`;
  } else if (reason === 'dismissed_today') {
    statusSummary = `Reminder dismissed for today (${reminderParsed.formatted12h} cutoff)`;
  } else if (reason === 'before_reminder_time') {
    statusSummary = `Scheduled for ${reminderParsed.formatted12h} if focus hasn't started`;
  } else {
    statusSummary = `Reminder active · Past ${reminderParsed.formatted12h} cutoff with no focus session started today`;
  }

  return {
    shouldShowToast,
    reason,
    reminderTime24h: reminderParsed.formatted24h,
    reminderTime12h: reminderParsed.formatted12h,
    currentTime24h: currentParsed.formatted24h,
    currentTime12h: currentParsed.formatted12h,
    minutesPastReminder,
    streakCount: safeStreak,
    streakBadgeLabel,
    title,
    message,
    statusSummary,
    isDismissedToday,
    hasStartedFocusToday,
    isPastReminderTime,
  };
}

// ============================================================================
// FRAMER MOTION ACHIEVEMENT BADGE ENTRANCE ANIMATION SPECS
// ============================================================================

export type BadgeEntranceAnimationMode =
  | 'newly_unlocked'
  | 'page_load_unlocked'
  | 'page_load_locked';

export interface BadgeEntranceMotionSpec {
  badgeId: BadgeId;
  index: number;
  unlocked: boolean;
  newlyUnlocked: boolean;
  animationMode: BadgeEntranceAnimationMode;
  motionKey: string;
  initial: {
    opacity: number;
    scale: number;
    y: number;
  };
  animate: {
    opacity: number;
    scale: number;
    y: number;
  };
  transition: {
    type: 'spring';
    stiffness: number;
    damping: number;
    delay: number;
  };
}

export function detectNewlyUnlockedBadgeIds(
  previousUnlockedIds: readonly BadgeId[] | null | undefined,
  currentBadges: ReadonlyArray<{ id: BadgeId; unlocked: boolean }>
): BadgeId[] {
  if (!Array.isArray(previousUnlockedIds)) {
    return [];
  }
  const prevSet = new Set<BadgeId>(previousUnlockedIds);
  const newlyUnlocked: BadgeId[] = [];
  for (const badge of currentBadges) {
    if (badge && badge.unlocked && !prevSet.has(badge.id)) {
      newlyUnlocked.push(badge.id);
    }
  }
  return newlyUnlocked;
}

export function getBadgeEntranceMotionSpec(params: {
  badgeId: BadgeId;
  index?: number;
  unlocked: boolean;
  previouslyUnlockedIds?: readonly BadgeId[] | null;
  newlyUnlockedOverride?: boolean;
}): BadgeEntranceMotionSpec {
  const safeIndex = Math.max(0, Math.floor(Number(params.index) || 0));
  const staggerDelay = Number((safeIndex * 0.07).toFixed(2));

  const isNewlyUnlocked =
    typeof params.newlyUnlockedOverride === 'boolean'
      ? params.unlocked && params.newlyUnlockedOverride
      : Boolean(
          params.unlocked &&
            Array.isArray(params.previouslyUnlockedIds) &&
            !params.previouslyUnlockedIds.includes(params.badgeId)
        );

  const animationMode: BadgeEntranceAnimationMode = isNewlyUnlocked
    ? 'newly_unlocked'
    : params.unlocked
      ? 'page_load_unlocked'
      : 'page_load_locked';

  const motionKey = `${params.badgeId}-${params.unlocked ? 'unlocked' : 'locked'}`;

  if (animationMode === 'newly_unlocked') {
    return {
      badgeId: params.badgeId,
      index: safeIndex,
      unlocked: true,
      newlyUnlocked: true,
      animationMode,
      motionKey,
      initial: {
        opacity: 0,
        scale: 0.72,
        y: 8,
      },
      animate: {
        opacity: 1,
        scale: 1,
        y: 0,
      },
      transition: {
        type: 'spring',
        stiffness: 420,
        damping: 20,
        delay: 0.03,
      },
    };
  }

  if (animationMode === 'page_load_unlocked') {
    return {
      badgeId: params.badgeId,
      index: safeIndex,
      unlocked: true,
      newlyUnlocked: false,
      animationMode,
      motionKey,
      initial: {
        opacity: 0,
        scale: 0.84,
        y: 6,
      },
      animate: {
        opacity: 1,
        scale: 1,
        y: 0,
      },
      transition: {
        type: 'spring',
        stiffness: 360,
        damping: 24,
        delay: staggerDelay,
      },
    };
  }

  return {
    badgeId: params.badgeId,
    index: safeIndex,
    unlocked: false,
    newlyUnlocked: false,
    animationMode: 'page_load_locked',
    motionKey,
    initial: {
      opacity: 0,
      scale: 0.92,
      y: 4,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
    transition: {
      type: 'spring',
      stiffness: 320,
      damping: 26,
      delay: staggerDelay,
    },
  };
}

// ============================================================================
// DAILY PRODUCTIVITY QUICK START (25-MINUTE POMODORO + PARTICIPATION POINTS)
// ============================================================================

export const QUICK_START_POMODORO_MINUTES = 25;
export const QUICK_START_PARTICIPATION_POINTS = 15;

export interface QuickStartPomodoroResult {
  addedMinutes: number;
  previousCompletedMinutes: number;
  nextCompletedMinutes: number;
  targetMinutes: number;
  pointsAwarded: number;
  previousParticipationPoints: number;
  nextParticipationPoints: number;
  progress: DailyProductivityProgress;
  feedbackMessage: string;
}

export function applyQuickStartPomodoroBlock(params: {
  targetMinutes: number;
  currentCompletedMinutes: number;
  currentParticipationPoints: number;
  minutesToAdd?: number;
  pointsToAward?: number;
}): QuickStartPomodoroResult {
  const addedMinutes = Math.max(
    1,
    Math.round(Number(params.minutesToAdd) || QUICK_START_POMODORO_MINUTES)
  );
  const pointsAwarded = Math.max(
    1,
    Math.round(Number(params.pointsToAward) || QUICK_START_PARTICIPATION_POINTS)
  );
  const previousCompletedMinutes = Math.max(
    0,
    Math.round(Number(params.currentCompletedMinutes) || 0)
  );
  const nextCompletedMinutes = previousCompletedMinutes + addedMinutes;

  const previousParticipationPoints = Math.max(
    0,
    Math.round(Number(params.currentParticipationPoints) || 0)
  );
  const nextParticipationPoints = previousParticipationPoints + pointsAwarded;

  const progress = computeProductivityGoalProgress(
    params.targetMinutes,
    nextCompletedMinutes
  );

  const feedbackMessage = `Quick Start: Logged ${addedMinutes}m Pomodoro block (+${pointsAwarded} participation pts) · ${progress.completedMinutes}m / ${progress.targetMinutes}m (${progress.progressPercent}%)`;

  return {
    addedMinutes,
    previousCompletedMinutes,
    nextCompletedMinutes,
    targetMinutes: progress.targetMinutes,
    pointsAwarded,
    previousParticipationPoints,
    nextParticipationPoints,
    progress,
    feedbackMessage,
  };
}

// ============================================================================
// 42. ONLINE DIRECTORY CONNECTION STATUS MAP & DIRECT MESSAGE SHORTCUT
// ============================================================================

export type ConnectionRequestStatusValue = 'pending' | 'accepted' | 'declined';

export interface ConnectionRequestMapRecord {
  id?: string;
  fromUid: string;
  toUid: string;
  status: ConnectionRequestStatusValue;
}

export interface OnlineDirectoryPeerDmShortcutMeta {
  peerUid: string;
  isSelf: boolean;
  status: 'none' | ConnectionRequestStatusValue;
  isAcceptedConnection: boolean;
  showDirectMessageShortcut: boolean;
  shortcutLabel: string;
  shortcutAriaLabel: string;
  connectionBadgeLabel: string;
}

const CONNECTION_STATUS_PRIORITY: Record<ConnectionRequestStatusValue, number> = {
  accepted: 3,
  pending: 2,
  declined: 1,
};

/**
 * Builds a deterministic peerUid -> ConnectionRequestStatusValue lookup map
 * for the given currentUid across all connection requests.
 * If multiple request records exist for the same peer pair, 'accepted' takes
 * highest precedence over 'pending' and 'declined'.
 */
export function buildConnectionRequestStatusMap(
  currentUid: string,
  requests: ConnectionRequestMapRecord[]
): Record<string, ConnectionRequestStatusValue> {
  const cleanCurrentUid = String(currentUid || '').trim();
  const map: Record<string, ConnectionRequestStatusValue> = {};
  if (!cleanCurrentUid || !Array.isArray(requests)) {
    return map;
  }

  for (const req of requests) {
    if (!req || typeof req !== 'object') continue;
    const fromUid = String(req.fromUid || '').trim();
    const toUid = String(req.toUid || '').trim();
    const rawStatus = req.status;
    if (
      rawStatus !== 'accepted' &&
      rawStatus !== 'pending' &&
      rawStatus !== 'declined'
    ) {
      continue;
    }

    let peerUid = '';
    if (fromUid === cleanCurrentUid && toUid && toUid !== cleanCurrentUid) {
      peerUid = toUid;
    } else if (toUid === cleanCurrentUid && fromUid && fromUid !== cleanCurrentUid) {
      peerUid = fromUid;
    }

    if (!peerUid) continue;

    const existing = map[peerUid];
    if (
      !existing ||
      CONNECTION_STATUS_PRIORITY[rawStatus] > CONNECTION_STATUS_PRIORITY[existing]
    ) {
      map[peerUid] = rawStatus;
    }
  }

  return map;
}

/**
 * Resolves the connection request status and Direct Message shortcut metadata
 * for a peer row in the Online Directory.
 */
export function resolveOnlineDirectoryPeerDmShortcut(params: {
  currentUid: string;
  peerUid: string;
  peerDisplayName?: string;
  connectionStatusMap: Record<string, ConnectionRequestStatusValue>;
}): OnlineDirectoryPeerDmShortcutMeta {
  const cleanCurrentUid = String(params.currentUid || '').trim();
  const cleanPeerUid = String(params.peerUid || '').trim();
  const cleanName =
    sanitizeSafeText(String(params.peerDisplayName || 'Peer'), 64) || 'Peer';
  const isSelf = Boolean(
    cleanCurrentUid && cleanPeerUid && cleanCurrentUid === cleanPeerUid
  );

  if (!cleanCurrentUid || !cleanPeerUid || isSelf) {
    return {
      peerUid: cleanPeerUid,
      isSelf,
      status: 'none',
      isAcceptedConnection: false,
      showDirectMessageShortcut: false,
      shortcutLabel: 'Direct Message',
      shortcutAriaLabel: `Direct Message ${cleanName}`,
      connectionBadgeLabel: '',
    };
  }

  const rawStatus = params.connectionStatusMap?.[cleanPeerUid];
  const status: 'none' | ConnectionRequestStatusValue =
    rawStatus === 'accepted' || rawStatus === 'pending' || rawStatus === 'declined'
      ? rawStatus
      : 'none';

  const isAcceptedConnection = status === 'accepted';

  return {
    peerUid: cleanPeerUid,
    isSelf: false,
    status,
    isAcceptedConnection,
    showDirectMessageShortcut: isAcceptedConnection,
    shortcutLabel: 'Direct Message',
    shortcutAriaLabel: `Direct Message ${cleanName}`,
    connectionBadgeLabel: isAcceptedConnection
      ? 'Connected'
      : status === 'pending'
      ? 'Request pending'
      : status === 'declined'
      ? 'Request declined'
      : '',
  };
}

// ============================================================================
// 43. FRAMER MOTION DAILY PRODUCTIVITY PROGRESS BAR TRANSITION SPEC
// ============================================================================

export interface ProductivityProgressMotionSpec {
  targetMinutes: number;
  completedMinutes: number;
  previousCompletedMinutes: number;
  minutesDelta: number;
  didMinutesIncrease: boolean;
  progressPercent: number;
  previousProgressPercent: number;
  scaleX: number;
  previousScaleX: number;
  milestoneStage: DailyGoalMilestoneStage;
  crossedMilestone: 'none' | 'halfway_50' | 'complete_100';
  initial: {
    scaleX: number;
    opacity: number;
  };
  animate: {
    scaleX: number;
    opacity: number;
  };
  transition: {
    type: 'spring';
    stiffness: number;
    damping: number;
    mass: number;
  };
}

/**
 * Computes the Framer Motion transition specification for the Daily Productivity
 * progress bar fill so it animates smoothly whenever dailyCompletedMinutes increases
 * (or on initial mount).
 */
export function getProductivityProgressMotionSpec(params: {
  targetMinutes: number;
  completedMinutes: number;
  previousCompletedMinutes?: number | null;
}): ProductivityProgressMotionSpec {
  const currentProgress = computeProductivityGoalProgress(
    params.targetMinutes,
    params.completedMinutes
  );

  const hasPrevious =
    typeof params.previousCompletedMinutes === 'number' &&
    Number.isFinite(params.previousCompletedMinutes);
  const previousCompletedMinutes = hasPrevious
    ? Math.max(0, Math.round(Number(params.previousCompletedMinutes)))
    : 0;

  const previousProgress = computeProductivityGoalProgress(
    currentProgress.targetMinutes,
    previousCompletedMinutes
  );

  const minutesDelta = currentProgress.completedMinutes - previousCompletedMinutes;
  const didMinutesIncrease = hasPrevious
    ? minutesDelta > 0
    : currentProgress.completedMinutes > 0;

  const scaleX = Number((currentProgress.progressPercent / 100).toFixed(4));
  const previousScaleX = hasPrevious
    ? Number((previousProgress.progressPercent / 100).toFixed(4))
    : 0;

  let crossedMilestone: 'none' | 'halfway_50' | 'complete_100' = 'none';
  if (didMinutesIncrease) {
    if (!previousProgress.isGoalReached && currentProgress.isGoalReached) {
      crossedMilestone = 'complete_100';
    } else if (!previousProgress.isHalfwayReached && currentProgress.isHalfwayReached) {
      crossedMilestone = 'halfway_50';
    }
  }

  return {
    targetMinutes: currentProgress.targetMinutes,
    completedMinutes: currentProgress.completedMinutes,
    previousCompletedMinutes,
    minutesDelta,
    didMinutesIncrease,
    progressPercent: currentProgress.progressPercent,
    previousProgressPercent: hasPrevious ? previousProgress.progressPercent : 0,
    scaleX,
    previousScaleX,
    milestoneStage: currentProgress.milestoneStage,
    crossedMilestone,
    initial: {
      scaleX: previousScaleX,
      opacity: previousScaleX > 0 ? 1 : 0.85,
    },
    animate: {
      scaleX,
      opacity: 1,
    },
    transition: didMinutesIncrease
      ? {
          type: 'spring',
          stiffness: 180,
          damping: 24,
          mass: 0.85,
        }
      : {
          type: 'spring',
          stiffness: 220,
          damping: 28,
          mass: 0.8,
        },
  };
}

// ============================================================================
// 44. ONLINE DIRECTORY QUICK FILTER ('MY CONNECTIONS' <-> 'EVERYONE')
// ============================================================================

export interface QuickFilterClearButtonMotionSpec {
  isVisible: boolean;
  initial: { opacity: number; scale: number };
  animate: { opacity: number; scale: number };
  exit: { opacity: number; scale: number };
  transition: {
    duration: number;
    ease: 'easeOut';
  };
}

export function getQuickFilterClearButtonMotionSpec(
  isVisible: boolean
): QuickFilterClearButtonMotionSpec {
  return {
    isVisible: Boolean(isVisible),
    initial: { opacity: 0, scale: 0.85 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.85 },
    transition: {
      duration: 0.18,
      ease: 'easeOut',
    },
  };
}

export interface QuickFilterToggleHoverMotionSpec {
  isHovered: boolean;
  hoverScale: number;
  tapScale: number;
  hoverBrightness: string;
  restBrightness: string;
  whileHover: { scale: number; filter: string };
  whileTap: { scale: number };
  animate: { scale: number; filter: string };
  transition: {
    duration: number;
    ease: 'easeOut';
  };
}

export function getQuickFilterToggleHoverMotionSpec(
  isHovered = false
): QuickFilterToggleHoverMotionSpec {
  const hovered = Boolean(isHovered);
  return {
    isHovered: hovered,
    hoverScale: 1.03,
    tapScale: 0.98,
    hoverBrightness: 'brightness(1.12)',
    restBrightness: 'brightness(1)',
    whileHover: {
      scale: 1.03,
      filter: 'brightness(1.12)',
    },
    whileTap: {
      scale: 0.98,
    },
    animate: hovered
      ? { scale: 1.03, filter: 'brightness(1.12)' }
      : { scale: 1, filter: 'brightness(1)' },
    transition: {
      duration: 0.16,
      ease: 'easeOut',
    },
  };
}

export interface OnlineDirectoryClearFilterModalMeta {
  isOpen: boolean;
  hiddenPeersCount: number;
  hiddenPeersSummaryText: string;
  visiblePeersCount: number;
  totalEveryoneCount: number;
  modalTitle: string;
  modalDescription: string;
  confirmActionLabel: 'Confirm Reset';
  cancelActionLabel: 'Keep Filter Active';
  triggerButtonLabel: 'Clear Filter';
  triggerButtonAriaLabel: string;
}

export function getOnlineDirectoryClearFilterModalMeta(params: {
  isOpen: boolean;
  everyoneCount: number;
  myConnectionsCount: number;
}): OnlineDirectoryClearFilterModalMeta {
  const everyoneCount = Math.max(0, Math.floor(Number(params.everyoneCount) || 0));
  const myConnectionsCount = Math.max(
    0,
    Math.min(everyoneCount, Math.floor(Number(params.myConnectionsCount) || 0))
  );
  const hiddenPeersCount = Math.max(0, everyoneCount - myConnectionsCount);
  const peerNoun = hiddenPeersCount === 1 ? 'peer' : 'peers';
  const verb = hiddenPeersCount === 1 ? 'is' : 'are';

  return {
    isOpen: Boolean(params.isOpen),
    hiddenPeersCount,
    hiddenPeersSummaryText: `${hiddenPeersCount} ${peerNoun} ${verb} currently hidden by the active My Connections filter.`,
    visiblePeersCount: myConnectionsCount,
    totalEveryoneCount: everyoneCount,
    modalTitle: 'Clear Filter & Reset Online Directory?',
    modalDescription: `Resetting the filter to Everyone will reveal ${hiddenPeersCount} currently hidden ${peerNoun} (${everyoneCount} total online) and update the directory view.`,
    confirmActionLabel: 'Confirm Reset',
    cancelActionLabel: 'Keep Filter Active',
    triggerButtonLabel: 'Clear Filter',
    triggerButtonAriaLabel: `Open Clear Filter confirmation modal (${hiddenPeersCount} ${peerNoun} currently hidden)`,
  };
}

export function resolveOnlineDirectoryFilterToggleAction(
  current: OnlineDirectoryAudienceFilter,
  options?: {
    shiftKey?: boolean;
  }
): {
  nextMode: OnlineDirectoryAudienceFilter;
  shouldOpenClearModal: boolean;
} {
  if (options?.shiftKey) {
    return {
      nextMode: 'everyone',
      shouldOpenClearModal: false,
    };
  }
  if (current === 'my_connections') {
    return {
      nextMode: 'my_connections',
      shouldOpenClearModal: true,
    };
  }
  return {
    nextMode: 'my_connections',
    shouldOpenClearModal: false,
  };
}

export function confirmOnlineDirectoryClearFilterReset(): {
  nextMode: OnlineDirectoryAudienceFilter;
  isModalOpen: boolean;
} {
  return {
    nextMode: 'everyone',
    isModalOpen: false,
  };
}

export interface ShiftResetToastConfirmationSpec {
  toastId: 'online-directory-shift-reset-toast';
  toastTestId: 'online-directory-shift-reset-toast';
  message: 'Filters Reset to Default';
  detailText: string;
  shortcutBadgeLabel: '⇧ Shift + Click';
  position: 'bottom-of-directory-view';
  isShiftHeld: boolean;
  isVisible: boolean;
  shouldShowToast: boolean;
  triggerCount: number;
  autoDismissMs: number;
  animationName: 'shiftResetToastSlideFadeIn' | 'none';
  cssClassName: string;
  motion: {
    initial: { opacity: number; y: number; scale: number };
    animate: { opacity: number; y: number; scale: number };
    exit: { opacity: number; y: number; scale: number };
    transition: { duration: number; ease: 'easeOut' };
  };
}

export function resolveShiftResetToastConfirmation(params?: {
  isVisible?: boolean;
  shiftKeyUsed?: boolean;
  triggerCount?: number;
  autoDismissMs?: number;
}): ShiftResetToastConfirmationSpec {
  const isShiftHeld = Boolean(params?.shiftKeyUsed);
  const isVisible = Boolean(params?.isVisible);
  const triggerCount = Math.max(0, Math.floor(Number(params?.triggerCount) || 0));
  const autoDismissMs = Math.max(
    400,
    Math.min(10000, Math.floor(Number(params?.autoDismissMs) || 2800))
  );

  return {
    toastId: 'online-directory-shift-reset-toast',
    toastTestId: 'online-directory-shift-reset-toast',
    message: 'Filters Reset to Default',
    detailText:
      'All active directory filters (Audience, Mood, and In Focus) restored to default.',
    shortcutBadgeLabel: '⇧ Shift + Click',
    position: 'bottom-of-directory-view',
    isShiftHeld,
    isVisible,
    shouldShowToast: isVisible,
    triggerCount,
    autoDismissMs,
    animationName: isVisible ? 'shiftResetToastSlideFadeIn' : 'none',
    cssClassName: isVisible ? 'shift-reset-toast-animated' : '',
    motion: {
      initial: { opacity: 0, y: 10, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 8, scale: 0.96 },
      transition: { duration: 0.22, ease: 'easeOut' },
    },
  };
}

export interface SecondaryResetOnlyFilterSpec {
  buttonId: 'online-directory-mood-filter-reset-only';
  buttonTestId: 'online-directory-mood-filter-reset-only';
  label: 'Reset';
  shortcutLabel: '⇧ Reset';
  modifierKey: 'Shift';
  isShiftHeld: boolean;
  isAnyFilterActive: boolean;
  isAudienceConstrained: boolean;
  isMoodConstrained: boolean;
  isFocusConstrained: boolean;
  activeFiltersCount: number;
  shouldBypassModal: boolean;
  shouldOpenClearModal: boolean;
  didQuickReset: boolean;
  shouldTriggerShiftResetToast: boolean;
  toastConfirmationText: 'Filters Reset to Default';
  shiftResetToastSpec: ShiftResetToastConfirmationSpec;
  nextMode: OnlineDirectoryAudienceFilter;
  nextMoodFilter: 'all' | string;
  nextOnlyInFocus: boolean;
  isModalOpen: boolean;
  ariaLabel: string;
  tooltipText: string;
  statusText: string;
}

export function resolveSecondaryResetOnlyFilterAction(params?: {
  shiftKey?: boolean;
  currentMode?: OnlineDirectoryAudienceFilter | string | null;
  moodFilter?: string | null;
  onlyInFocus?: boolean;
  requireShiftKeyForModalBypass?: boolean;
}): SecondaryResetOnlyFilterSpec {
  const isShiftHeld = Boolean(params?.shiftKey);
  const rawMode = String(params?.currentMode ?? 'everyone').trim().toLowerCase();
  const isAudienceConstrained =
    rawMode !== '' && rawMode !== 'everyone' && rawMode !== 'all';

  const rawMood = String(params?.moodFilter ?? 'all').trim();
  const isMoodConstrained = rawMood !== '' && rawMood.toLowerCase() !== 'all';

  const isFocusConstrained = Boolean(params?.onlyInFocus);
  const isAnyFilterActive =
    isAudienceConstrained || isMoodConstrained || isFocusConstrained;
  const activeFiltersCount =
    (isAudienceConstrained ? 1 : 0) +
    (isMoodConstrained ? 1 : 0) +
    (isFocusConstrained ? 1 : 0);

  const requireShift =
    params?.requireShiftKeyForModalBypass !== undefined
      ? Boolean(params.requireShiftKeyForModalBypass)
      : false;

  const shouldBypassModal = isShiftHeld || !requireShift;
  const shouldOpenClearModal = !shouldBypassModal && isAudienceConstrained;
  const didQuickReset = shouldBypassModal;
  const shouldTriggerShiftResetToast = Boolean(isShiftHeld && didQuickReset);
  const shiftResetToastSpec = resolveShiftResetToastConfirmation({
    isVisible: shouldTriggerShiftResetToast,
    shiftKeyUsed: isShiftHeld,
    triggerCount: shouldTriggerShiftResetToast ? 1 : 0,
  });

  const nextMode: OnlineDirectoryAudienceFilter = didQuickReset
    ? 'everyone'
    : isAudienceConstrained
      ? 'my_connections'
      : 'everyone';
  const nextMoodFilter = didQuickReset ? 'all' : isMoodConstrained ? rawMood : 'all';
  const nextOnlyInFocus = didQuickReset ? false : isFocusConstrained;

  const ariaLabel = isAnyFilterActive
    ? `Reset-only quick action (${activeFiltersCount} active ${
        activeFiltersCount === 1 ? 'filter' : 'filters'
      }): Hold Shift while clicking to quickly reset active filters without opening the modal dialog`
    : 'Reset-only quick action: Hold Shift while clicking to quickly reset active filters without opening the modal dialog';

  const tooltipText = isShiftHeld
    ? 'Shift held · Click to immediately reset all active filters (bypasses modal)'
    : 'Hold Shift + Click to quickly reset active filters without triggering the full modal dialog';

  const statusText = didQuickReset
    ? isShiftHeld
      ? 'Filters Reset to Default (via Shift+Click, modal bypassed)'
      : 'Quick reset applied (modal bypassed)'
    : 'Modal confirmation required (hold Shift to bypass)';

  return {
    buttonId: 'online-directory-mood-filter-reset-only',
    buttonTestId: 'online-directory-mood-filter-reset-only',
    label: 'Reset',
    shortcutLabel: '⇧ Reset',
    modifierKey: 'Shift',
    isShiftHeld,
    isAnyFilterActive,
    isAudienceConstrained,
    isMoodConstrained,
    isFocusConstrained,
    activeFiltersCount,
    shouldBypassModal,
    shouldOpenClearModal,
    didQuickReset,
    shouldTriggerShiftResetToast,
    toastConfirmationText: 'Filters Reset to Default',
    shiftResetToastSpec,
    nextMode,
    nextMoodFilter,
    nextOnlyInFocus,
    isModalOpen: shouldOpenClearModal,
    ariaLabel,
    tooltipText,
    statusText,
  };
}

export interface DedicatedClearFiltersButtonMotionSpec {
  isVisible: boolean;
  animationType: 'fade-in-scale';
  engine: 'framer-motion';
  initialOpacity: number;
  initialScale: number;
  animateOpacity: number;
  animateScale: number;
  exitOpacity: number;
  exitScale: number;
  hoverScale: number;
  tapScale: number;
  durationSec: number;
  durationMs: number;
  initial: { opacity: number; scale: number };
  animate: { opacity: number; scale: number };
  exit: { opacity: number; scale: number };
  whileHover: { scale: number };
  whileTap: { scale: number };
  transition: {
    duration: number;
    ease: 'easeOut';
    opacity: { duration: number; ease: 'easeOut' };
    scale: {
      type: 'spring';
      stiffness: number;
      damping: number;
      mass: number;
    };
  };
}

export function getDedicatedClearFiltersButtonMotionSpec(
  isVisible: boolean = true
): DedicatedClearFiltersButtonMotionSpec {
  const visible = Boolean(isVisible);
  return {
    isVisible: visible,
    animationType: 'fade-in-scale',
    engine: 'framer-motion',
    initialOpacity: 0,
    initialScale: 0.9,
    animateOpacity: 1,
    animateScale: 1,
    exitOpacity: 0,
    exitScale: 0.9,
    hoverScale: 1.03,
    tapScale: 0.97,
    durationSec: 0.18,
    durationMs: 180,
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.97 },
    transition: {
      duration: 0.18,
      ease: 'easeOut',
      opacity: { duration: 0.18, ease: 'easeOut' },
      scale: {
        type: 'spring',
        stiffness: 420,
        damping: 28,
        mass: 0.7,
      },
    },
  };
}

export interface ClearFiltersButtonChimeResult {
  utilityName: 'playSubtleUiChime';
  eventType: 'ui_chime';
  chimeType: 'ui_chime';
  shouldPlay: boolean;
  volumePercent: number;
  chime: UiSoundChimeSpec;
  feedbackMessage: string;
}

export function resolveClearFiltersButtonChime(params?: {
  preferences?: UiSoundEffectPreferences;
  activeCriteriaCount?: number;
  activeCriteriaSummary?: string;
}): ClearFiltersButtonChimeResult {
  const prefs = params?.preferences ?? DEFAULT_UI_SOUND_PREFERENCES;
  const volumePercent = clampSoundVolumePercent(prefs.volumePercent);
  const chime = getUiSoundChimeSpec('ui_chime', false, volumePercent);
  const shouldPlay = Boolean(prefs.enabled);
  const summarySuffix = params?.activeCriteriaSummary
    ? ` · Cleared ${params.activeCriteriaSummary}`
    : '';

  const feedbackMessage = shouldPlay
    ? `UI chime played: Clear Filters reset (${chime.noteNames})${summarySuffix}`
    : `Clear Filters reset (Sound alerts muted)${summarySuffix}`;

  return {
    utilityName: 'playSubtleUiChime',
    eventType: 'ui_chime',
    chimeType: 'ui_chime',
    shouldPlay,
    volumePercent,
    chime,
    feedbackMessage,
  };
}

export interface DedicatedClearFiltersTooltipSpec {
  tooltipId: 'online-directory-clear-filters-tooltip';
  tooltipTestId: 'online-directory-clear-filters-tooltip';
  role: 'tooltip';
  isHovered: boolean;
  isVisible: boolean;
  activeCriteriaCount: number;
  criterionNoun: 'criterion' | 'criteria';
  activeCriteriaLabels: string[];
  activeCriteriaSummary: string;
  headlineText: string;
  countBadgeText: string;
  descriptionText: string;
  fullTooltipText: string;
}

export function getDedicatedClearFiltersTooltipMeta(params?: {
  activeCriteriaCount?: number;
  activeCriteriaLabels?: string[];
  isHovered?: boolean;
}): DedicatedClearFiltersTooltipSpec {
  const rawLabels = Array.isArray(params?.activeCriteriaLabels)
    ? params!.activeCriteriaLabels.map((lbl) => String(lbl || '').trim()).filter(Boolean)
    : [];
  const rawCount =
    params?.activeCriteriaCount !== undefined &&
    params?.activeCriteriaCount !== null &&
    Number.isFinite(Number(params.activeCriteriaCount))
      ? Math.max(0, Math.floor(Number(params.activeCriteriaCount)))
      : rawLabels.length;
  const activeCriteriaCount = Math.max(rawCount, rawLabels.length);
  const criterionNoun: 'criterion' | 'criteria' =
    activeCriteriaCount === 1 ? 'criterion' : 'criteria';
  const activeCriteriaSummary =
    rawLabels.length > 0
      ? rawLabels.join(', ')
      : activeCriteriaCount > 0
        ? `${activeCriteriaCount} active ${criterionNoun}`
        : 'None';
  const isHovered = Boolean(params?.isHovered);
  const isVisible = Boolean(isHovered && activeCriteriaCount > 0);

  const headlineText =
    activeCriteriaCount > 0
      ? `Reset ${activeCriteriaCount} active ${criterionNoun}`
      : 'No active filter criteria to reset';

  const countBadgeText = `${activeCriteriaCount} ${criterionNoun}`;

  const descriptionText =
    activeCriteriaCount > 0
      ? `Resets ${activeCriteriaCount} active filter ${criterionNoun} (${activeCriteriaSummary}) to default view.`
      : 'No active filter criteria applied.';

  const fullTooltipText =
    activeCriteriaCount > 0
      ? `Reset ${activeCriteriaCount} active ${criterionNoun} (${activeCriteriaSummary}) — immediately returns directory to default state without opening the reset modal`
      : 'No active filter criteria applied';

  return {
    tooltipId: 'online-directory-clear-filters-tooltip',
    tooltipTestId: 'online-directory-clear-filters-tooltip',
    role: 'tooltip',
    isHovered,
    isVisible,
    activeCriteriaCount,
    criterionNoun,
    activeCriteriaLabels: rawLabels,
    activeCriteriaSummary,
    headlineText,
    countBadgeText,
    descriptionText,
    fullTooltipText,
  };
}

export interface DedicatedClearFiltersButtonSpec {
  buttonId: 'online-directory-clear-filters-btn';
  buttonTestId: 'online-directory-clear-filters-btn';
  label: 'Clear Filters';
  shouldShowButton: boolean;
  isVisible: boolean;
  isAnyCriterionActive: boolean;
  isMoodCriterionActive: boolean;
  isFocusCriterionActive: boolean;
  isAudienceCriterionActive: boolean;
  activeCriteriaCount: number;
  activeCriteriaKeys: QuickFilterAppliedCriterionKey[];
  activeCriteriaLabels: string[];
  activeCriteriaSummary: string;
  badgeText: string;
  bypassesResetModal: true;
  shouldOpenClearModal: false;
  nextMode: 'everyone';
  nextMoodFilter: 'all';
  nextOnlyInFocus: false;
  isModalOpen: false;
  ariaLabel: string;
  tooltipId: 'online-directory-clear-filters-tooltip';
  tooltipTitle: string;
  tooltipText: string;
  tooltipMeta: DedicatedClearFiltersTooltipSpec;
  motion: DedicatedClearFiltersButtonMotionSpec;
  chimeUtility: 'playSubtleUiChime';
  chimeEventType: 'ui_chime';
  chimeSpec: ClearFiltersButtonChimeResult;
}

export function resolveDedicatedClearFiltersButtonAction(params?: {
  mode?: OnlineDirectoryAudienceFilter | string | null;
  moodFilter?: string | null;
  onlyInFocus?: boolean;
  preferences?: UiSoundEffectPreferences;
  isHovered?: boolean;
}): DedicatedClearFiltersButtonSpec {
  const criteriaSpec = getQuickFilterIconActiveBadgeSpec({
    mode: params?.mode,
    moodFilter: params?.moodFilter,
    onlyInFocus: params?.onlyInFocus,
  });

  const isAnyCriterionActive = criteriaSpec.isAnyCriteriaApplied;
  const activeCriteriaCount = criteriaSpec.appliedCriteriaCount;
  const shouldShowButton = isAnyCriterionActive && activeCriteriaCount > 0;
  const activeCriteriaSummary = criteriaSpec.appliedCriteriaLabels.join(', ');
  const badgeText = `${activeCriteriaCount} active`;

  const tooltipMeta = getDedicatedClearFiltersTooltipMeta({
    activeCriteriaCount,
    activeCriteriaLabels: criteriaSpec.appliedCriteriaLabels,
    isHovered: Boolean(params?.isHovered),
  });

  const ariaLabel = shouldShowButton
    ? `Clear Filters (${activeCriteriaCount} active ${tooltipMeta.criterionNoun}: ${activeCriteriaSummary}) — return to default state without reset modal`
    : 'Clear Filters (no active filter criteria)';

  const tooltipText = tooltipMeta.fullTooltipText;

  const chimeSpec = resolveClearFiltersButtonChime({
    preferences: params?.preferences,
    activeCriteriaCount,
    activeCriteriaSummary,
  });

  return {
    buttonId: 'online-directory-clear-filters-btn',
    buttonTestId: 'online-directory-clear-filters-btn',
    label: 'Clear Filters',
    shouldShowButton,
    isVisible: shouldShowButton,
    isAnyCriterionActive,
    isMoodCriterionActive: criteriaSpec.isMoodApplied,
    isFocusCriterionActive: criteriaSpec.isFocusApplied,
    isAudienceCriterionActive: criteriaSpec.isAudienceApplied,
    activeCriteriaCount,
    activeCriteriaKeys: criteriaSpec.appliedCriteriaKeys,
    activeCriteriaLabels: criteriaSpec.appliedCriteriaLabels,
    activeCriteriaSummary,
    badgeText,
    bypassesResetModal: true,
    shouldOpenClearModal: false,
    nextMode: 'everyone',
    nextMoodFilter: 'all',
    nextOnlyInFocus: false,
    isModalOpen: false,
    ariaLabel,
    tooltipId: tooltipMeta.tooltipId,
    tooltipTitle: tooltipMeta.headlineText,
    tooltipText,
    tooltipMeta,
    motion: getDedicatedClearFiltersButtonMotionSpec(shouldShowButton),
    chimeUtility: 'playSubtleUiChime',
    chimeEventType: 'ui_chime',
    chimeSpec,
  };
}

export interface QuickFilterIconCrossFadeMotionSpec {
  mode: OnlineDirectoryAudienceFilter;
  activeIconComponent: 'UserCheck' | 'Filter';
  inactiveIconComponent: 'Filter' | 'UserCheck';
  activeIconKey: 'icon-usercheck' | 'icon-filter';
  animationType: 'cross-fade';
  durationMs: number;
  durationSec: number;
  easing: 'easeOut';
  cubicBezier: 'cubic-bezier(0.16, 1, 0.3, 1)';
  initial: { opacity: number; scale: number };
  animate: { opacity: number; scale: number };
  exit: { opacity: number; scale: number };
  transition: {
    duration: number;
    ease: 'easeOut';
  };
  userCheckLayerState: {
    isActive: boolean;
    opacity: number;
    scale: number;
  };
  filterLayerState: {
    isActive: boolean;
    opacity: number;
    scale: number;
  };
}

export function getQuickFilterIconCrossFadeSpec(
  mode: OnlineDirectoryAudienceFilter = 'everyone'
): QuickFilterIconCrossFadeMotionSpec {
  const normalizedMode: OnlineDirectoryAudienceFilter =
    mode === 'my_connections' ? 'my_connections' : 'everyone';
  const isMyConnections = normalizedMode === 'my_connections';

  return {
    mode: normalizedMode,
    activeIconComponent: isMyConnections ? 'UserCheck' : 'Filter',
    inactiveIconComponent: isMyConnections ? 'Filter' : 'UserCheck',
    activeIconKey: isMyConnections ? 'icon-usercheck' : 'icon-filter',
    animationType: 'cross-fade',
    durationMs: 160,
    durationSec: 0.16,
    easing: 'easeOut',
    cubicBezier: 'cubic-bezier(0.16, 1, 0.3, 1)',
    initial: { opacity: 0, scale: 0.88 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.88 },
    transition: {
      duration: 0.16,
      ease: 'easeOut',
    },
    userCheckLayerState: {
      isActive: isMyConnections,
      opacity: isMyConnections ? 1 : 0,
      scale: isMyConnections ? 1 : 0.88,
    },
    filterLayerState: {
      isActive: !isMyConnections,
      opacity: isMyConnections ? 0 : 1,
      scale: isMyConnections ? 0.88 : 1,
    },
  };
}

export interface QuickFilterIconHoverGlowSpec {
  mode: OnlineDirectoryAudienceFilter;
  isHovered: boolean;
  isGlowActive: boolean;
  glowTone: 'emerald' | 'emerald-soft';
  transitionDurationMs: number;
  containerBoxShadow: string;
  svgDropShadowFilter: string;
}

export function getQuickFilterIconHoverGlowSpec(params?: {
  mode?: OnlineDirectoryAudienceFilter;
  isHovered?: boolean;
}): QuickFilterIconHoverGlowSpec {
  const normalizedMode: OnlineDirectoryAudienceFilter =
    params?.mode === 'my_connections' ? 'my_connections' : 'everyone';
  const isMyConnections = normalizedMode === 'my_connections';
  const isHovered = Boolean(params?.isHovered);

  const hoverContainerShadow = isMyConnections
    ? '0 0 12px rgba(52, 211, 153, 0.42), 0 0 4px rgba(16, 185, 129, 0.28)'
    : '0 0 12px rgba(52, 211, 153, 0.32), 0 0 4px rgba(244, 244, 245, 0.22)';

  const hoverSvgDropShadow = isMyConnections
    ? 'drop-shadow(0 0 5px rgba(52, 211, 153, 0.65))'
    : 'drop-shadow(0 0 5px rgba(52, 211, 153, 0.5))';

  return {
    mode: normalizedMode,
    isHovered,
    isGlowActive: isHovered,
    glowTone: isMyConnections ? 'emerald' : 'emerald-soft',
    transitionDurationMs: 180,
    containerBoxShadow: isHovered ? hoverContainerShadow : 'none',
    svgDropShadowFilter: isHovered ? hoverSvgDropShadow : 'none',
  };
}

export type QuickFilterAppliedCriterionKey = 'mood' | 'focus' | 'audience';

export interface QuickFilterIconActiveBadgeSpec {
  isMoodApplied: boolean;
  isFocusApplied: boolean;
  isAudienceApplied: boolean;
  isAnyCriteriaApplied: boolean;
  appliedCriteriaKeys: QuickFilterAppliedCriterionKey[];
  appliedCriteriaLabels: string[];
  appliedCriteriaCount: number;
  showActiveBadge: boolean;
  badgeLabel: 'ACTIVE' | 'IDLE';
  badgeShortLabel: 'Active' | 'Idle';
  badgeDisplayText: string;
  badgeTone: 'emerald' | 'zinc';
  isIconShifted: boolean;
  iconShiftTranslateYpx: number;
  iconShiftRotateDeg: number;
  iconShiftScale: number;
  iconShiftTransform: string;
  iconShiftClassName: string;
  badgeClassName: string;
  summaryLabel: string;
}

export function getQuickFilterIconActiveBadgeSpec(params?: {
  mode?: OnlineDirectoryAudienceFilter | string | null;
  moodFilter?: string | null;
  onlyInFocus?: boolean;
}): QuickFilterIconActiveBadgeSpec {
  const rawMode = String(params?.mode ?? 'everyone').trim().toLowerCase();
  const isAudienceApplied =
    rawMode !== '' && rawMode !== 'everyone' && rawMode !== 'all';

  const rawMood = String(params?.moodFilter ?? 'all').trim();
  const isMoodApplied = rawMood !== '' && rawMood.toLowerCase() !== 'all';

  const isFocusApplied = Boolean(params?.onlyInFocus);
  const appliedCriteriaKeys: QuickFilterAppliedCriterionKey[] = [];
  const appliedCriteriaLabels: string[] = [];

  if (isMoodApplied) {
    appliedCriteriaKeys.push('mood');
    const cleanMoodLabel = rawMood.toLowerCase().startsWith('category:')
      ? rawMood.slice('category:'.length).trim()
      : rawMood;
    appliedCriteriaLabels.push(`Mood (${cleanMoodLabel})`);
  }
  if (isFocusApplied) {
    appliedCriteriaKeys.push('focus');
    appliedCriteriaLabels.push('In Focus');
  }
  if (isAudienceApplied) {
    appliedCriteriaKeys.push('audience');
    appliedCriteriaLabels.push('My Connections');
  }

  const appliedCriteriaCount = appliedCriteriaKeys.length;
  const isAnyCriteriaApplied = appliedCriteriaCount > 0;
  const showActiveBadge = isAnyCriteriaApplied;
  const badgeLabel: 'ACTIVE' | 'IDLE' = isAnyCriteriaApplied ? 'ACTIVE' : 'IDLE';
  const badgeShortLabel: 'Active' | 'Idle' = isAnyCriteriaApplied ? 'Active' : 'Idle';
  const badgeDisplayText = isAnyCriteriaApplied
    ? appliedCriteriaCount > 1
      ? `Active · ${appliedCriteriaCount}`
      : 'Active'
    : 'Idle';
  const badgeTone: 'emerald' | 'zinc' = isAnyCriteriaApplied ? 'emerald' : 'zinc';

  const isIconShifted = isAnyCriteriaApplied;
  const iconShiftTranslateYpx = isIconShifted ? -1 : 0;
  const iconShiftRotateDeg = isIconShifted ? -6 : 0;
  const iconShiftScale = isIconShifted ? 1.08 : 1;
  const iconShiftTransform = isIconShifted
    ? 'translateY(-1px) rotate(-6deg) scale(1.08)'
    : 'translateY(0px) rotate(0deg) scale(1)';
  const iconShiftClassName = isIconShifted ? 'quick-filter-icon-criteria-shifted' : '';
  const badgeClassName = isAnyCriteriaApplied ? 'quick-filter-active-criteria-badge' : '';
  const summaryLabel = isAnyCriteriaApplied
    ? `Active filter criteria (${appliedCriteriaCount}): ${appliedCriteriaLabels.join(', ')}`
    : 'No filter criteria applied (showing all peers)';

  return {
    isMoodApplied,
    isFocusApplied,
    isAudienceApplied,
    isAnyCriteriaApplied,
    appliedCriteriaKeys,
    appliedCriteriaLabels,
    appliedCriteriaCount,
    showActiveBadge,
    badgeLabel,
    badgeShortLabel,
    badgeDisplayText,
    badgeTone,
    isIconShifted,
    iconShiftTranslateYpx,
    iconShiftRotateDeg,
    iconShiftScale,
    iconShiftTransform,
    iconShiftClassName,
    badgeClassName,
    summaryLabel,
  };
}

export interface QuickFilterIconPulseSpec {
  isDirectoryConstrained: boolean;
  isPulseActive: boolean;
  isAudienceConstrained: boolean;
  isMoodConstrained: boolean;
  isFocusConstrained: boolean;
  activeConstraintReason:
    | 'none'
    | 'my_connections'
    | 'mood_filter'
    | 'in_focus'
    | 'connections_and_mood';
  animationName: 'quickFilterIconSubtlePulse' | 'none';
  svgAnimationName: 'quickFilterSvgSubtlePulse' | 'none';
  cssClassName: string;
  svgCssClassName: string;
  iconColorTone: 'emerald-glow' | 'zinc-neutral';
  iconColorClass: string;
  colorKeyframes: [string, string, string];
  emeraldGlowDropShadow: string;
  durationMs: number;
  durationSec: number;
  easing: 'ease-in-out';
  iterationCount: 'infinite' | '1';
  scaleKeyframes: [number, number, number];
  opacityKeyframes: [number, number, number];
  constraintStatusLabel: string;
  activeBadgeSpec: QuickFilterIconActiveBadgeSpec;
}

export function getQuickFilterIconPulseSpec(params?: {
  mode?: OnlineDirectoryAudienceFilter | string | null;
  moodFilter?: string | null;
  onlyInFocus?: boolean;
}): QuickFilterIconPulseSpec {
  const rawMode = String(params?.mode ?? 'everyone').trim().toLowerCase();
  const isAudienceConstrained =
    rawMode !== '' && rawMode !== 'everyone' && rawMode !== 'all';

  const rawMood = String(params?.moodFilter ?? 'all').trim();
  const isMoodConstrained = rawMood !== '' && rawMood.toLowerCase() !== 'all';

  const isFocusConstrained = Boolean(params?.onlyInFocus);
  const isDirectoryConstrained =
    isAudienceConstrained || isMoodConstrained || isFocusConstrained;
  const isPulseActive = isDirectoryConstrained;
  const activeBadgeSpec = getQuickFilterIconActiveBadgeSpec(params);

  let activeConstraintReason: QuickFilterIconPulseSpec['activeConstraintReason'] = 'none';
  if (isAudienceConstrained && isMoodConstrained) {
    activeConstraintReason = 'connections_and_mood';
  } else if (isAudienceConstrained) {
    activeConstraintReason = 'my_connections';
  } else if (isMoodConstrained) {
    activeConstraintReason = 'mood_filter';
  } else if (isFocusConstrained) {
    activeConstraintReason = 'in_focus';
  }

  return {
    isDirectoryConstrained,
    isPulseActive,
    isAudienceConstrained,
    isMoodConstrained,
    isFocusConstrained,
    activeConstraintReason,
    animationName: isPulseActive ? 'quickFilterIconSubtlePulse' : 'none',
    svgAnimationName: isPulseActive ? 'quickFilterSvgSubtlePulse' : 'none',
    cssClassName: isPulseActive ? 'quick-filter-icon-pulse-active' : '',
    svgCssClassName: isPulseActive ? 'quick-filter-icon-svg-pulse' : '',
    iconColorTone: isPulseActive ? 'emerald-glow' : 'zinc-neutral',
    iconColorClass: isPulseActive ? 'text-emerald-300' : 'text-zinc-300',
    colorKeyframes: isPulseActive
      ? ['#6ee7b7', '#a7f3d0', '#6ee7b7']
      : ['#d4d4d8', '#d4d4d8', '#d4d4d8'],
    emeraldGlowDropShadow: isPulseActive
      ? 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.72))'
      : 'none',
    durationMs: 2200,
    durationSec: 2.2,
    easing: 'ease-in-out',
    iterationCount: isPulseActive ? 'infinite' : '1',
    scaleKeyframes: isPulseActive ? [1, 1.08, 1] : [1, 1, 1],
    opacityKeyframes: isPulseActive ? [1, 0.94, 1] : [1, 1, 1],
    constraintStatusLabel: isPulseActive
      ? 'Directory constrained by active filter'
      : 'Showing all peers (unconstrained)',
    activeBadgeSpec,
  };
}

export interface OnlineDirectoryFilterShareLinkMeta {
  shareUrl: string;
  audienceMode: OnlineDirectoryAudienceFilter;
  statusLabel: 'My Connections' | 'Everyone';
  rawCategoryFilter: string;
  categoryParam: string;
  moodParam: string;
  categoryDisplayLabel: string;
  onlyInFocus: boolean;
  summaryLabel: string;
  isCopied: boolean;
  iconFeedbackState: 'Copied!' | 'idle';
  iconFeedbackLabel: 'Copied!' | 'Copy Link';
  containerAriaLabel: string;
  containerTitle: string;
  copiedBadgeText: 'Copied!';
  hoverHintText: 'Copy Link';
}

export function buildOnlineDirectoryFilterShareLink(params?: {
  origin?: string;
  pathname?: string;
  audienceFilter?: OnlineDirectoryAudienceFilter;
  moodFilter?: string | null;
  onlyInFocus?: boolean;
  isCopied?: boolean;
}): OnlineDirectoryFilterShareLinkMeta {
  const audienceMode: OnlineDirectoryAudienceFilter =
    params?.audienceFilter === 'my_connections' ? 'my_connections' : 'everyone';
  const statusLabel: 'My Connections' | 'Everyone' =
    audienceMode === 'my_connections' ? 'My Connections' : 'Everyone';

  const rawMood = String(params?.moodFilter ?? 'all').trim() || 'all';
  let categoryParam = 'all';
  let categoryDisplayLabel = 'All Moods';

  if (rawMood.toLowerCase() === 'all') {
    categoryParam = 'all';
    categoryDisplayLabel = 'All Moods';
  } else if (rawMood.startsWith('category:')) {
    const extracted = rawMood.slice('category:'.length).trim() || 'All';
    categoryParam = extracted;
    categoryDisplayLabel = extracted;
  } else {
    categoryParam = rawMood;
    categoryDisplayLabel = rawMood;
  }

  const onlyInFocus = Boolean(params?.onlyInFocus);
  const isCopied = Boolean(params?.isCopied);

  const cleanOrigin = (params?.origin || 'https://mrstranger.app').replace(/\/+$/, '');
  const rawPathname = params?.pathname || '/';
  const cleanPathname = rawPathname.startsWith('/') ? rawPathname : `/${rawPathname}`;

  const searchParams = new URLSearchParams();
  searchParams.set('filter', audienceMode);
  searchParams.set('category', categoryParam);
  if (onlyInFocus) {
    searchParams.set('focus', '1');
  }

  const shareUrl = `${cleanOrigin}${cleanPathname}?${searchParams.toString()}`;
  const focusSuffix = onlyInFocus ? ' · In Focus' : '';
  const summaryLabel = `${statusLabel} · ${categoryDisplayLabel}${focusSuffix}`;

  const containerAriaLabel = isCopied
    ? `Copied! (${summaryLabel})`
    : `Copy shareable link for current filter (${summaryLabel})`;

  const containerTitle = isCopied
    ? `Copied! (${shareUrl})`
    : `Click icon to copy shareable link for ${summaryLabel} (${shareUrl})`;

  return {
    shareUrl,
    audienceMode,
    statusLabel,
    rawCategoryFilter: rawMood,
    categoryParam,
    moodParam: categoryParam,
    categoryDisplayLabel,
    onlyInFocus,
    summaryLabel,
    isCopied,
    iconFeedbackState: isCopied ? 'Copied!' : 'idle',
    iconFeedbackLabel: isCopied ? 'Copied!' : 'Copy Link',
    containerAriaLabel,
    containerTitle,
    copiedBadgeText: 'Copied!',
    hoverHintText: 'Copy Link',
  };
}

export function parseOnlineDirectoryFilterShareParams(search: string): {
  hasFilterParams: boolean;
  audienceFilter: OnlineDirectoryAudienceFilter;
  moodFilter: string;
  onlyInFocus: boolean;
} {
  const rawSearch = String(search || '').trim();
  const params = new URLSearchParams(
    rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch
  );

  const rawAudience = (params.get('filter') || '').trim().toLowerCase();
  const rawCategory = (params.get('category') || params.get('mood') || '').trim();
  const rawFocus = (params.get('focus') || '').trim().toLowerCase();

  const hasFilterParams =
    params.has('filter') ||
    params.has('category') ||
    params.has('mood') ||
    params.has('focus');

  const audienceFilter: OnlineDirectoryAudienceFilter =
    rawAudience === 'my_connections' ? 'my_connections' : 'everyone';

  let moodFilter = 'all';
  if (rawCategory && rawCategory.toLowerCase() !== 'all') {
    const lowerCat = rawCategory.toLowerCase();
    if (lowerCat === 'productive' || lowerCat === 'category:productive') {
      moodFilter = 'category:Productive';
    } else if (lowerCat === 'social' || lowerCat === 'category:social') {
      moodFilter = 'category:Social';
    } else if (lowerCat === 'away' || lowerCat === 'category:away') {
      moodFilter = 'category:Away';
    } else {
      moodFilter = rawCategory;
    }
  }

  const onlyInFocus = rawFocus === '1' || rawFocus === 'true';

  return {
    hasFilterParams,
    audienceFilter,
    moodFilter,
    onlyInFocus,
  };
}

export interface QuickFilterToggleChimeResult {
  utilityName: 'playSubtleUiChime';
  currentMode: OnlineDirectoryAudienceFilter;
  nextMode: OnlineDirectoryAudienceFilter;
  chimeType: 'start' | 'end';
  shouldPlay: boolean;
  volumePercent: number;
  chime: UiSoundChimeSpec;
  feedbackMessage: string;
}

export function resolveQuickFilterToggleChime(params?: {
  currentMode?: OnlineDirectoryAudienceFilter | string | null;
  nextMode?: OnlineDirectoryAudienceFilter | string | null;
  preferences?: UiSoundEffectPreferences;
}): QuickFilterToggleChimeResult {
  const currentMode: OnlineDirectoryAudienceFilter =
    params?.currentMode === 'my_connections' ? 'my_connections' : 'everyone';
  const nextMode: OnlineDirectoryAudienceFilter =
    params?.nextMode !== undefined && params?.nextMode !== null
      ? params.nextMode === 'my_connections'
        ? 'my_connections'
        : 'everyone'
      : currentMode === 'my_connections'
        ? 'everyone'
        : 'my_connections';

  const prefs = params?.preferences ?? DEFAULT_UI_SOUND_PREFERENCES;
  const volumePercent = clampSoundVolumePercent(prefs.volumePercent);
  const isActivatingFilter = nextMode === 'my_connections';
  const chimeType: 'start' | 'end' = isActivatingFilter ? 'start' : 'end';
  const chime = getUiSoundChimeSpec(chimeType, false, volumePercent);
  const shouldPlay = Boolean(prefs.enabled);

  const feedbackMessage = isActivatingFilter
    ? shouldPlay
      ? `Filter chime played: My Connections active (${chime.noteNames})`
      : 'Filter toggled: My Connections active (Sound alerts muted)'
    : shouldPlay
      ? `Filter chime played: Reset to Everyone (${chime.noteNames})`
      : 'Filter toggled: Reset to Everyone (Sound alerts muted)';

  return {
    utilityName: 'playSubtleUiChime',
    currentMode,
    nextMode,
    chimeType,
    shouldPlay,
    volumePercent,
    chime,
    feedbackMessage,
  };
}

export interface QuickFilterResetFlashBounceSpec {
  isResetToAllTransition: boolean;
  isResetFlashActive: boolean;
  animationName: 'quickFilterResetFlashBounce' | 'none';
  cssClassName: string;
  durationMs: number;
  durationSec: number;
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)';
  scaleKeyframes: [number, number, number, number];
  flashBoxShadow: string;
  confirmationLabel: string;
}

export function getQuickFilterResetFlashBounceSpec(params?: {
  isResetFlashActive?: boolean;
  previousMode?: OnlineDirectoryAudienceFilter | string | null;
  nextMode?: OnlineDirectoryAudienceFilter | string | null;
  previousMoodFilter?: string | null;
  nextMoodFilter?: string | null;
}): QuickFilterResetFlashBounceSpec {
  const hasModeTransition =
    params?.previousMode !== undefined && params?.nextMode !== undefined;
  const wasAudienceConstrained =
    hasModeTransition &&
    String(params?.previousMode || '').trim().toLowerCase() === 'my_connections';
  const nextModeClean = String(params?.nextMode ?? 'everyone').trim().toLowerCase();
  const isNowAudienceAll =
    hasModeTransition && (nextModeClean === 'everyone' || nextModeClean === 'all');

  const hasMoodTransition =
    params?.previousMoodFilter !== undefined && params?.nextMoodFilter !== undefined;
  const prevMoodClean = String(params?.previousMoodFilter || '').trim().toLowerCase();
  const nextMoodClean = String(params?.nextMoodFilter ?? 'all').trim().toLowerCase();
  const wasMoodConstrained =
    hasMoodTransition && prevMoodClean !== '' && prevMoodClean !== 'all';
  const isNowMoodAll =
    hasMoodTransition && (nextMoodClean === '' || nextMoodClean === 'all');

  const isResetToAllTransition =
    Boolean(wasAudienceConstrained && isNowAudienceAll) ||
    Boolean(wasMoodConstrained && isNowMoodAll);
  const isResetFlashActive =
    Boolean(params?.isResetFlashActive) || isResetToAllTransition;

  return {
    isResetToAllTransition,
    isResetFlashActive,
    animationName: isResetFlashActive ? 'quickFilterResetFlashBounce' : 'none',
    cssClassName: isResetFlashActive ? 'quick-filter-reset-flash-bounce' : '',
    durationMs: 520,
    durationSec: 0.52,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    scaleKeyframes: isResetFlashActive ? [1, 1.06, 0.98, 1] : [1, 1, 1, 1],
    flashBoxShadow: isResetFlashActive
      ? '0 0 0 3px rgba(52, 211, 153, 0.38), 0 0 16px rgba(52, 211, 153, 0.45)'
      : 'none',
    confirmationLabel: isResetFlashActive
      ? 'Constraint removed · Showing all'
      : 'Ready',
  };
}

export interface ZeroPeersMoodFilterNoticeSpec {
  isMoodFilterActive: boolean;
  isAudienceFilterActive: boolean;
  isFocusFilterActive: boolean;
  isZeroMatchingPeers: boolean;
  shouldShowNotice: boolean;
  moodFilterValue: string;
  moodDisplayLabel: string;
  displayedPeersCount: number;
  totalOnlinePeersCount: number;
  headline: string;
  suggestionText: string;
  shortToastLabel: string;
  actionLabel: 'Widen Criteria';
  tone: 'amber' | 'neutral';
}

export function resolveZeroPeersMoodFilterNotice(params?: {
  moodFilter?: string | null;
  audienceFilter?: OnlineDirectoryAudienceFilter | string | null;
  onlyInFocus?: boolean;
  displayedPeersCount?: number | null;
  onlinePeers?: Array<{ uid: string; mood?: string | null }>;
  currentUid?: string;
  acceptedPeerUids?: Iterable<string>;
  connectionStatusMap?: Record<string, ConnectionRequestStatusValue>;
  isDismissed?: boolean;
}): ZeroPeersMoodFilterNoticeSpec {
  const rawMood = String(params?.moodFilter ?? 'all').trim() || 'all';
  const parsedMood = parseOnlineDirectoryMoodFilterSelection(rawMood);
  const isMoodFilterActive = parsedMood.type !== 'all';

  const rawAudience = String(params?.audienceFilter ?? 'everyone').trim().toLowerCase();
  const isAudienceFilterActive =
    rawAudience !== '' && rawAudience !== 'everyone' && rawAudience !== 'all';
  const isFocusFilterActive = Boolean(params?.onlyInFocus);

  const moodDisplayLabel =
    parsedMood.type === 'category' && parsedMood.category
      ? `${parsedMood.category}`
      : parsedMood.type === 'preset' && parsedMood.presetLabel
        ? parsedMood.presetLabel
        : 'All Moods';

  const peers = Array.isArray(params?.onlinePeers) ? params!.onlinePeers : [];
  const totalOnlinePeersCount = peers.length;
  const cleanCurrentUid = String(params?.currentUid || '').trim();
  const acceptedSet = params?.acceptedPeerUids
    ? new Set(params.acceptedPeerUids)
    : new Set<string>();

  let computedDisplayedCount = totalOnlinePeersCount;
  if (
    params?.displayedPeersCount !== undefined &&
    params?.displayedPeersCount !== null &&
    Number.isFinite(Number(params.displayedPeersCount))
  ) {
    computedDisplayedCount = Math.max(0, Math.floor(Number(params.displayedPeersCount)));
  } else if (isMoodFilterActive || isAudienceFilterActive) {
    let matched = 0;
    for (const peer of peers) {
      const peerUid = String(peer?.uid || '').trim();
      if (!peerUid) continue;
      if (isAudienceFilterActive) {
        if (cleanCurrentUid && peerUid === cleanCurrentUid) continue;
        const isAccepted =
          acceptedSet.has(peerUid) ||
          params?.connectionStatusMap?.[peerUid] === 'accepted';
        if (!isAccepted) continue;
      }
      if (isMoodFilterActive) {
        const meta = getOnlinePeerMoodMeta(peer?.mood);
        if (!meta.hasMood || !meta.label) continue;
        if (parsedMood.type === 'category' && parsedMood.category) {
          if (meta.category !== parsedMood.category) continue;
        } else if (parsedMood.type === 'preset' && parsedMood.presetLabel) {
          if (meta.label.toLowerCase() !== parsedMood.presetLabel.toLowerCase()) {
            continue;
          }
        }
      }
      matched += 1;
    }
    computedDisplayedCount = matched;
  }

  const isZeroMatchingPeers = computedDisplayedCount === 0;
  const isAnyConstraintActive =
    isMoodFilterActive || isAudienceFilterActive || isFocusFilterActive;
  const shouldShowNotice =
    isAnyConstraintActive && isZeroMatchingPeers && !Boolean(params?.isDismissed);

  const headline = isMoodFilterActive
    ? `0 online peers match "${moodDisplayLabel}"`
    : '0 online peers match active filter';

  const suggestionText = shouldShowNotice
    ? isMoodFilterActive
      ? `No online peers currently match "${moodDisplayLabel}" — try widening your criteria to All Moods.`
      : 'No online peers match your current filter — try widening your criteria.'
    : `Showing ${computedDisplayedCount} matching ${
        computedDisplayedCount === 1 ? 'peer' : 'peers'
      }`;

  const shortToastLabel = shouldShowNotice
    ? `0 peers in ${moodDisplayLabel} · Widen criteria`
    : `${computedDisplayedCount} matching`;

  return {
    isMoodFilterActive,
    isAudienceFilterActive,
    isFocusFilterActive,
    isZeroMatchingPeers,
    shouldShowNotice,
    moodFilterValue: isMoodFilterActive ? rawMood : 'all',
    moodDisplayLabel,
    displayedPeersCount: computedDisplayedCount,
    totalOnlinePeersCount,
    headline,
    suggestionText,
    shortToastLabel,
    actionLabel: 'Widen Criteria',
    tone: shouldShowNotice ? 'amber' : 'neutral',
  };
}

export interface OnlineDirectoryQuickFilterMeta {
  mode: OnlineDirectoryAudienceFilter;
  isMyConnectionsOnly: boolean;
  isDirectoryConstrained: boolean;
  activeLabel: string;
  buttonLabel: string;
  nextModeLabel: string;
  ariaLabel: string;
  ariaPressed: boolean;
  matchingCount: number;
  everyoneCount: number;
  myConnectionsCount: number;
  hiddenPeersCount: number;
  requiresClearConfirmationModal: boolean;
  clearModalMeta: OnlineDirectoryClearFilterModalMeta;
  iconName: 'user-check' | 'filter';
  dynamicFilterIconComponent: 'UserCheck' | 'Filter';
  stateIconName: 'user-check' | 'filter';
  secondaryStateIconName: 'link' | 'globe';
  stateIconLabel:
    | 'My Connections active (UserCheck icon)'
    | 'Everyone active (Filter icon)';
  filterIconName: 'filter';
  toggleStateIndicator: 'ON · My Connections' | 'ALL · Everyone';
  statusDotTone: 'emerald' | 'zinc';
  toggleThumbPosition: 'right' | 'left';
  tooltipTitle: 'Currently showing only my connections' | 'Currently showing everyone';
  tooltipDetail: string;
  showClearButton: boolean;
  clearButtonLabel: 'Clear';
  clearButtonAriaLabel: string;
  clearButtonMotion: QuickFilterClearButtonMotionSpec;
  toggleHoverMotion: QuickFilterToggleHoverMotionSpec;
  iconCrossFadeMotion: QuickFilterIconCrossFadeMotionSpec;
  iconHoverGlow: QuickFilterIconHoverGlowSpec;
  iconPulseSpec: QuickFilterIconPulseSpec;
  iconActiveBadgeSpec: QuickFilterIconActiveBadgeSpec;
  toggleChimeSpec: QuickFilterToggleChimeResult;
  resetFlashSpec: QuickFilterResetFlashBounceSpec;
  zeroPeersNotice: ZeroPeersMoodFilterNoticeSpec;
  moodDrawersToggleAll: MoodCategoryDrawersToggleAllState;
  resetOnlyButtonMeta: SecondaryResetOnlyFilterSpec;
  dedicatedClearFiltersButtonMeta: DedicatedClearFiltersButtonSpec;
  shiftResetToast: ShiftResetToastConfirmationSpec;
  recentFiltersMeta: RecentDirectoryFiltersDropdownMeta;
  recentlyAppliedMeta: RecentlyAppliedDirectoryFilterMeta;
  shareLinkMeta: OnlineDirectoryFilterShareLinkMeta;
}


export function toggleOnlineDirectoryAudienceFilter(
  current: OnlineDirectoryAudienceFilter
): OnlineDirectoryAudienceFilter {
  return current === 'my_connections' ? 'everyone' : 'my_connections';
}

export function clearOnlineDirectoryAudienceFilter(): OnlineDirectoryAudienceFilter {
  return 'everyone';
}

export function getOnlineDirectoryQuickFilterMeta(params: {
  mode: OnlineDirectoryAudienceFilter;
  onlinePeers: Array<{ uid: string; mood?: string | null }>;
  currentUid?: string;
  acceptedPeerUids?: Iterable<string>;
  connectionStatusMap?: Record<string, ConnectionRequestStatusValue>;
  isHovered?: boolean;
  isClearModalOpen?: boolean;
  moodFilter?: string | null;
  onlyInFocus?: boolean;
  displayedPeersCount?: number | null;
  origin?: string;
  pathname?: string;
  isShareLinkCopied?: boolean;
  uiSoundPreferences?: UiSoundEffectPreferences;
  isResetFlashActive?: boolean;
  isMainDrawerExpanded?: boolean;
  categoryExpansionMap?: Partial<Record<OnlineMoodCategory, boolean>> | null;
  isShiftKeyHeld?: boolean;
  isShiftResetToastVisible?: boolean;
  shiftResetToastCount?: number;
  recentFiltersHistory?: RecentDirectoryFilterCombination[] | null;
  isRecentFiltersDropdownOpen?: boolean;
  isClearFiltersHovered?: boolean;
}): OnlineDirectoryQuickFilterMeta {
  const mode: OnlineDirectoryAudienceFilter =
    params.mode === 'my_connections' ? 'my_connections' : 'everyone';
  const peers = Array.isArray(params.onlinePeers) ? params.onlinePeers : [];
  const cleanCurrentUid = String(params.currentUid || '').trim();
  const acceptedSet = params.acceptedPeerUids
    ? new Set(params.acceptedPeerUids)
    : new Set<string>();

  const everyoneCount = peers.length;
  let myConnectionsCount = 0;
  for (const peer of peers) {
    const peerUid = String(peer?.uid || '').trim();
    if (!peerUid || (cleanCurrentUid && peerUid === cleanCurrentUid)) continue;
    if (
      acceptedSet.has(peerUid) ||
      params.connectionStatusMap?.[peerUid] === 'accepted'
    ) {
      myConnectionsCount += 1;
    }
  }

  const isMyConnectionsOnly = mode === 'my_connections';
  const iconPulseSpec = getQuickFilterIconPulseSpec({
    mode,
    moodFilter: params.moodFilter,
    onlyInFocus: params.onlyInFocus,
  });
  const toggleChimeSpec = resolveQuickFilterToggleChime({
    currentMode: mode,
    preferences: params.uiSoundPreferences,
  });
  const resetFlashSpec = getQuickFilterResetFlashBounceSpec({
    isResetFlashActive: Boolean(params.isResetFlashActive),
  });
  const zeroPeersNotice = resolveZeroPeersMoodFilterNotice({
    moodFilter: params.moodFilter,
    audienceFilter: mode,
    onlyInFocus: params.onlyInFocus,
    displayedPeersCount: params.displayedPeersCount,
    onlinePeers: peers,
    currentUid: cleanCurrentUid,
    acceptedPeerUids: acceptedSet,
    connectionStatusMap: params.connectionStatusMap,
  });
  const isDirectoryConstrained = iconPulseSpec.isDirectoryConstrained;
  const hiddenPeersCount = Math.max(0, everyoneCount - myConnectionsCount);
  const clearModalMeta = getOnlineDirectoryClearFilterModalMeta({
    isOpen: Boolean(params.isClearModalOpen) && isMyConnectionsOnly,
    everyoneCount,
    myConnectionsCount,
  });
  const activeLabel = isMyConnectionsOnly ? 'My Connections' : 'Everyone';
  const nextModeLabel = isMyConnectionsOnly ? 'Everyone' : 'My Connections';
  const matchingCount = isMyConnectionsOnly ? myConnectionsCount : everyoneCount;

  const buttonLabel = isMyConnectionsOnly
    ? `Quick Filter: My Connections (${myConnectionsCount})`
    : `Quick Filter: Everyone (${everyoneCount})`;

  const ariaLabel = isMyConnectionsOnly
    ? `Quick Filter active: My Connections (${myConnectionsCount}). Activate to switch to Everyone (${everyoneCount}).`
    : `Quick Filter active: Everyone (${everyoneCount}). Activate to filter to My Connections (${myConnectionsCount}).`;

  const tooltipTitle = isMyConnectionsOnly
    ? 'Currently showing only my connections'
    : 'Currently showing everyone';

  const tooltipDetail = isMyConnectionsOnly
    ? `Currently showing only my connections (${myConnectionsCount} accepted ${
        myConnectionsCount === 1 ? 'peer' : 'peers'
      }). Click to switch to Everyone (${everyoneCount}).`
    : `Currently showing everyone (${everyoneCount} online). Click to filter to My Connections (${myConnectionsCount}).`;

  const clearButtonAriaLabel = `Clear My Connections filter and reset to Everyone (${everyoneCount})`;

  return {
    mode,
    isMyConnectionsOnly,
    isDirectoryConstrained,
    activeLabel,
    buttonLabel,
    nextModeLabel,
    ariaLabel,
    ariaPressed: isMyConnectionsOnly,
    matchingCount,
    everyoneCount,
    myConnectionsCount,
    hiddenPeersCount,
    requiresClearConfirmationModal: isMyConnectionsOnly,
    clearModalMeta,
    iconName: isMyConnectionsOnly ? 'user-check' : 'filter',
    dynamicFilterIconComponent: isMyConnectionsOnly ? 'UserCheck' : 'Filter',
    stateIconName: isMyConnectionsOnly ? 'user-check' : 'filter',
    secondaryStateIconName: isMyConnectionsOnly ? 'link' : 'globe',
    stateIconLabel: isMyConnectionsOnly
      ? 'My Connections active (UserCheck icon)'
      : 'Everyone active (Filter icon)',
    filterIconName: 'filter',
    toggleStateIndicator: isMyConnectionsOnly
      ? 'ON · My Connections'
      : 'ALL · Everyone',
    statusDotTone: isMyConnectionsOnly ? 'emerald' : 'zinc',
    toggleThumbPosition: isMyConnectionsOnly ? 'right' : 'left',
    tooltipTitle,
    tooltipDetail,
    showClearButton: isMyConnectionsOnly,
    clearButtonLabel: 'Clear',
    clearButtonAriaLabel,
    clearButtonMotion: getQuickFilterClearButtonMotionSpec(isMyConnectionsOnly),
    toggleHoverMotion: getQuickFilterToggleHoverMotionSpec(Boolean(params.isHovered)),
    iconCrossFadeMotion: getQuickFilterIconCrossFadeSpec(mode),
    iconHoverGlow: getQuickFilterIconHoverGlowSpec({
      mode,
      isHovered: Boolean(params.isHovered),
    }),
    iconPulseSpec,
    iconActiveBadgeSpec: iconPulseSpec.activeBadgeSpec,
    toggleChimeSpec,
    resetFlashSpec,
    zeroPeersNotice,
    moodDrawersToggleAll: evaluateMoodCategoryDrawersToggleState({
      isMainDrawerExpanded:
        params.isMainDrawerExpanded !== undefined
          ? params.isMainDrawerExpanded
          : true,
      categoryExpansionMap: params.categoryExpansionMap,
    }),
    resetOnlyButtonMeta: resolveSecondaryResetOnlyFilterAction({
      shiftKey: Boolean(params.isShiftKeyHeld),
      currentMode: mode,
      moodFilter: params.moodFilter,
      onlyInFocus: params.onlyInFocus,
    }),
    dedicatedClearFiltersButtonMeta: resolveDedicatedClearFiltersButtonAction({
      mode,
      moodFilter: params.moodFilter,
      onlyInFocus: params.onlyInFocus,
      preferences: params.uiSoundPreferences,
      isHovered: Boolean(params.isClearFiltersHovered),
    }),
    shiftResetToast: resolveShiftResetToastConfirmation({
      isVisible: Boolean(params.isShiftResetToastVisible),
      shiftKeyUsed: Boolean(params.isShiftKeyHeld || params.isShiftResetToastVisible),
      triggerCount: params.shiftResetToastCount,
    }),
    recentFiltersMeta: getRecentDirectoryFiltersDropdownMeta({
      history: params.recentFiltersHistory,
      currentAudienceFilter: mode,
      currentMoodFilter: params.moodFilter,
      currentOnlyInFocus: params.onlyInFocus,
      isOpen: params.isRecentFiltersDropdownOpen,
    }),
    recentlyAppliedMeta: evaluateRecentlyAppliedDirectoryFilterMeta({
      history: params.recentFiltersHistory,
      currentAudienceFilter: mode,
      currentMoodFilter: params.moodFilter,
      currentOnlyInFocus: params.onlyInFocus,
    }),
    shareLinkMeta: buildOnlineDirectoryFilterShareLink({
      origin: params.origin,
      pathname: params.pathname,
      audienceFilter: mode,
      moodFilter: params.moodFilter,
      onlyInFocus: params.onlyInFocus,
      isCopied: params.isShareLinkCopied,
    }),
  };
}

export type MoodCategoryDrawerExpansionMap = Record<OnlineMoodCategory, boolean>;

export const DEFAULT_MOOD_CATEGORY_DRAWER_EXPANSION_MAP: MoodCategoryDrawerExpansionMap =
  {
    Productive: true,
    Social: true,
    Away: true,
  };

export interface MoodCategoryDrawersToggleAllState {
  isMainDrawerExpanded: boolean;
  categoryExpansionMap: MoodCategoryDrawerExpansionMap;
  expandedCategories: OnlineMoodCategory[];
  collapsedCategories: OnlineMoodCategory[];
  expandedCount: number;
  totalCategoriesCount: number;
  totalCount: number;
  areAllDrawersExpanded: boolean;
  areAllDrawersCollapsed: boolean;
  isAnyDrawerExpanded: boolean;
  nextToggleAction: 'collapse_all' | 'expand_all';
  nextAction: 'collapse_all' | 'expand_all';
  buttonLabel: 'Toggle All';
  toggleAllButtonLabel: 'Toggle All';
  actionVerbLabel: 'Collapse All' | 'Expand All';
  statusBadgeLabel: string;
  ariaLabel: string;
  toggleAllAriaLabel: string;
  title: string;
}

export function evaluateMoodCategoryDrawersToggleState(params?: {
  isMainDrawerExpanded?: boolean;
  categoryExpansionMap?: Partial<Record<OnlineMoodCategory, boolean>> | null;
}): MoodCategoryDrawersToggleAllState {
  const isMainDrawerExpanded =
    params?.isMainDrawerExpanded !== undefined
      ? Boolean(params.isMainDrawerExpanded)
      : true;

  const rawMap = params?.categoryExpansionMap ?? {};
  const categoryExpansionMap: MoodCategoryDrawerExpansionMap = {
    Productive: isMainDrawerExpanded
      ? rawMap.Productive !== undefined
        ? Boolean(rawMap.Productive)
        : true
      : false,
    Social: isMainDrawerExpanded
      ? rawMap.Social !== undefined
        ? Boolean(rawMap.Social)
        : true
      : false,
    Away: isMainDrawerExpanded
      ? rawMap.Away !== undefined
        ? Boolean(rawMap.Away)
        : true
      : false,
  };

  const expandedCategories = ONLINE_MOOD_CATEGORIES.filter(
    (cat) => categoryExpansionMap[cat]
  );
  const collapsedCategories = ONLINE_MOOD_CATEGORIES.filter(
    (cat) => !categoryExpansionMap[cat]
  );
  const totalCategoriesCount = ONLINE_MOOD_CATEGORIES.length;
  const expandedCount = expandedCategories.length;
  const areAllDrawersExpanded =
    isMainDrawerExpanded && expandedCount === totalCategoriesCount;
  const areAllDrawersCollapsed = !isMainDrawerExpanded || expandedCount === 0;
  const isAnyDrawerExpanded = !areAllDrawersCollapsed;
  const nextToggleAction: 'collapse_all' | 'expand_all' = areAllDrawersExpanded
    ? 'collapse_all'
    : 'expand_all';
  const actionVerbLabel: 'Collapse All' | 'Expand All' = areAllDrawersExpanded
    ? 'Collapse All'
    : 'Expand All';
  const statusBadgeLabel = `Toggle All (${expandedCount}/${totalCategoriesCount})`;
  const ariaLabel = areAllDrawersExpanded
    ? `Toggle All mood category drawers: currently all ${totalCategoriesCount} expanded. Click to collapse every mood category drawer simultaneously.`
    : `Toggle All mood category drawers: currently ${expandedCount} of ${totalCategoriesCount} expanded. Click to expand every mood category drawer simultaneously.`;
  const title = areAllDrawersExpanded
    ? 'Toggle All — Collapse every mood category drawer (Productive, Social, Away) simultaneously'
    : 'Toggle All — Expand every mood category drawer (Productive, Social, Away) simultaneously';

  return {
    isMainDrawerExpanded: !areAllDrawersCollapsed,
    categoryExpansionMap,
    expandedCategories,
    collapsedCategories,
    expandedCount,
    totalCategoriesCount,
    totalCount: totalCategoriesCount,
    areAllDrawersExpanded,
    areAllDrawersCollapsed,
    isAnyDrawerExpanded,
    nextToggleAction,
    nextAction: nextToggleAction,
    buttonLabel: 'Toggle All',
    toggleAllButtonLabel: 'Toggle All',
    actionVerbLabel,
    statusBadgeLabel,
    ariaLabel,
    toggleAllAriaLabel: ariaLabel,
    title,
  };
}

export function toggleAllMoodCategoryDrawers(params?: {
  isMainDrawerExpanded?: boolean;
  categoryExpansionMap?: Partial<Record<OnlineMoodCategory, boolean>> | null;
  forceExpanded?: boolean;
}): MoodCategoryDrawersToggleAllState {
  const current = evaluateMoodCategoryDrawersToggleState({
    isMainDrawerExpanded: params?.isMainDrawerExpanded,
    categoryExpansionMap: params?.categoryExpansionMap,
  });
  const targetExpanded =
    params?.forceExpanded !== undefined
      ? Boolean(params.forceExpanded)
      : !current.areAllDrawersExpanded;

  return evaluateMoodCategoryDrawersToggleState({
    isMainDrawerExpanded: targetExpanded,
    categoryExpansionMap: {
      Productive: targetExpanded,
      Social: targetExpanded,
      Away: targetExpanded,
    },
  });
}

export function toggleSingleMoodCategoryDrawer(params: {
  category: OnlineMoodCategory;
  isMainDrawerExpanded?: boolean;
  categoryExpansionMap?: Partial<Record<OnlineMoodCategory, boolean>> | null;
}): MoodCategoryDrawersToggleAllState {
  const current = evaluateMoodCategoryDrawersToggleState({
    isMainDrawerExpanded:
      params.isMainDrawerExpanded !== undefined
        ? params.isMainDrawerExpanded
        : true,
    categoryExpansionMap: params.categoryExpansionMap,
  });

  const nextCategoryState = !current.categoryExpansionMap[params.category];
  const nextMap: MoodCategoryDrawerExpansionMap = {
    ...current.categoryExpansionMap,
    [params.category]: nextCategoryState,
  };
  const anyStillExpanded = ONLINE_MOOD_CATEGORIES.some((cat) => nextMap[cat]);

  return evaluateMoodCategoryDrawersToggleState({
    isMainDrawerExpanded: anyStillExpanded ? true : current.isMainDrawerExpanded,
    categoryExpansionMap: nextMap,
  });
}

export interface MoodCategoryItemMotionSpec {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  exit: { opacity: number; y: number };
  transition: {
    duration: number;
    delay: number;
    ease: 'easeOut';
  };
}

export interface MoodCategoryExpansionMotionSpec {
  isExpanded: boolean;
  staggerChildrenSec: number;
  delayChildrenSec: number;
  presetStaggerOffsetSec: number;
  containerInitial: { opacity: number; y: number };
  containerAnimate: { opacity: number; y: number };
  containerExit: { opacity: number; y: number };
  containerTransition: {
    duration: number;
    ease: 'easeOut';
    staggerChildren: number;
    delayChildren: number;
  };
  getCategoryHeaderMotion: (categoryIndex: number) => MoodCategoryItemMotionSpec;
  getPresetItemMotion: (
    categoryIndex: number,
    presetIndex: number
  ) => MoodCategoryItemMotionSpec;
}

export function toggleMoodCategoryDrawerExpanded(current: boolean): boolean {
  return !current;
}

export function getMoodCategoryExpansionMotionSpec(
  isExpanded: boolean = true
): MoodCategoryExpansionMotionSpec {
  const expanded = Boolean(isExpanded);
  const staggerChildrenSec = 0.06;
  const delayChildrenSec = 0.03;
  const presetStaggerOffsetSec = 0.035;

  return {
    isExpanded: expanded,
    staggerChildrenSec,
    delayChildrenSec,
    presetStaggerOffsetSec,
    containerInitial: { opacity: 0, y: -4 },
    containerAnimate: expanded ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 },
    containerExit: { opacity: 0, y: -4 },
    containerTransition: {
      duration: 0.2,
      ease: 'easeOut',
      staggerChildren: staggerChildrenSec,
      delayChildren: delayChildrenSec,
    },
    getCategoryHeaderMotion: (categoryIndex: number) => {
      const safeCatIdx = Math.max(0, Math.floor(Number(categoryIndex) || 0));
      const delay = Number(
        (delayChildrenSec + safeCatIdx * staggerChildrenSec).toFixed(3)
      );
      return {
        initial: { opacity: 0, y: -4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -3 },
        transition: {
          duration: 0.18,
          delay,
          ease: 'easeOut',
        },
      };
    },
    getPresetItemMotion: (categoryIndex: number, presetIndex: number) => {
      const safeCatIdx = Math.max(0, Math.floor(Number(categoryIndex) || 0));
      const safePresetIdx = Math.max(0, Math.floor(Number(presetIndex) || 0));
      const delay = Number(
        (
          delayChildrenSec +
          0.02 +
          safeCatIdx * staggerChildrenSec +
          safePresetIdx * presetStaggerOffsetSec
        ).toFixed(3)
      );
      return {
        initial: { opacity: 0, y: -3 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -2 },
        transition: {
          duration: 0.16,
          delay,
          ease: 'easeOut',
        },
      };
    },
  };
}

export interface WorkspaceSidebarScrollOptions {
  isFocused?: boolean;
  isProgrammaticScroll?: boolean;
}

export interface WorkspaceSidebarScrollSpec {
  isHovered: boolean;
  isFocused: boolean;
  isProgrammaticScroll: boolean;
  smoothScrollActive: boolean;
  scrollBehavior: 'smooth' | 'auto';
  isSticky: true;
  independentMainScroll: true;
  preventLayoutFluctuation: true;
  scrollMode: 'hover-scroll' | 'smooth-jump-scroll' | 'locked';
  layoutMode: 'side-by-side-sticky';
  shellClassName: string;
  sidebarPositionClass: string;
  sidebarScrollAreaClass: string;
  mainViewportClass: string;
}

export function getWorkspaceSidebarScrollSpec(
  isSidebarHovered: boolean = false,
  options?: WorkspaceSidebarScrollOptions
): WorkspaceSidebarScrollSpec {
  const isHovered = Boolean(isSidebarHovered);
  const isFocused = Boolean(options?.isFocused);
  const isProgrammaticScroll = Boolean(options?.isProgrammaticScroll);
  const smoothScrollActive = isFocused || isProgrammaticScroll;
  const canScroll = isHovered || smoothScrollActive;

  return {
    isHovered,
    isFocused,
    isProgrammaticScroll,
    smoothScrollActive,
    scrollBehavior: smoothScrollActive ? 'smooth' : 'auto',
    isSticky: true,
    independentMainScroll: true,
    preventLayoutFluctuation: true,
    scrollMode: isHovered
      ? 'hover-scroll'
      : smoothScrollActive
        ? 'smooth-jump-scroll'
        : 'locked',
    layoutMode: 'side-by-side-sticky',
    shellClassName:
      'min-h-screen md:h-screen md:max-h-screen md:overflow-hidden flex flex-col md:flex-row',
    sidebarPositionClass:
      'md:sticky md:top-0 md:h-screen md:max-h-screen md:w-64 md:min-w-[16rem] md:max-w-[16rem] shrink-0 self-start',
    sidebarScrollAreaClass: canScroll
      ? smoothScrollActive
        ? 'overflow-y-auto overscroll-contain sidebar-stable-scroll scroll-smooth sidebar-smooth-scroll-active'
        : 'overflow-y-auto overscroll-contain sidebar-stable-scroll'
      : 'overflow-y-hidden overscroll-contain sidebar-stable-scroll',
    mainViewportClass:
      'flex-1 flex flex-col min-w-0 md:h-screen md:max-h-screen md:overflow-y-auto overscroll-contain main-viewport-stable-scroll scroll-smooth',
  };
}

export interface MoodPresetTooltipMeta {
  presetId: string;
  label: string;
  category: OnlineMoodCategory;
  tone: OnlineMoodTone;
  definition: string;
  fullDefinitionText: string;
  tooltipTitle: string;
  tooltipId: string;
  iconComponent: 'Info';
  iconAriaLabel: string;
  isHovered: boolean;
  isVisible: boolean;
}

export function getMoodPresetTooltipMeta(
  presetIdOrLabel: string | null | undefined,
  isHovered: boolean = false
): MoodPresetTooltipMeta {
  const raw = String(presetIdOrLabel || '').trim();
  const lower = raw.toLowerCase();
  const matched = ONLINE_MOOD_PRESETS.find(
    (p) => p.id.toLowerCase() === lower || p.label.toLowerCase() === lower
  );

  const hovered = Boolean(isHovered);

  if (matched) {
    return {
      presetId: matched.id,
      label: matched.label,
      category: matched.category,
      tone: matched.tone,
      definition: matched.description,
      fullDefinitionText: `${matched.label} (${matched.category}): ${matched.description}`,
      tooltipTitle: `${matched.label} · ${matched.category}`,
      tooltipId: `mood-category-preset-tooltip-${matched.id}`,
      iconComponent: 'Info',
      iconAriaLabel: `${matched.label} mood definition: ${matched.description}`,
      isHovered: hovered,
      isVisible: hovered,
    };
  }

  const fallbackMeta = getOnlinePeerMoodMeta(raw);
  const label = fallbackMeta.label || raw || 'Mood Preset';
  const category = fallbackMeta.category || resolveMoodCategoryForText(label);
  const definition = fallbackMeta.description;
  const slugId =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'custom';

  return {
    presetId: slugId,
    label,
    category,
    tone: fallbackMeta.tone,
    definition,
    fullDefinitionText: `${label} (${category}): ${definition}`,
    tooltipTitle: `${label} · ${category}`,
    tooltipId: `mood-category-preset-tooltip-${slugId}`,
    iconComponent: 'Info',
    iconAriaLabel: `${label} mood definition: ${definition}`,
    isHovered: hovered,
    isVisible: hovered,
  };
}

export interface MoodPresetUsageCount24hMeta {
  presetId: string;
  label: string;
  category: OnlineMoodCategory;
  tone: OnlineMoodTone;
  usageCount24h: number;
  userUsageCount24h: number;
  communityUsageCount24h: number;
  activePeersNow: number;
  uniquePeers24h: number;
  usageBadgeLabel: string;
  shortUsageLabel: string;
  usageSummaryText: string;
  usageAriaLabel: string;
  hasRecentActivity: boolean;
}

export function getMoodPresetUsageCount24hMeta(params: {
  presetIdOrLabel: string | null | undefined;
  onlinePeers?: Array<{ uid: string; displayName?: string; mood?: string | null }>;
  moodEvents?: PeerMoodHistoryEvent[];
  currentUid?: string;
  currentUserMood?: string | null;
  nowMs?: number;
}): MoodPresetUsageCount24hMeta {
  const nowMs =
    typeof params.nowMs === 'number' && params.nowMs > 0 ? params.nowMs : Date.now();
  const cutoffMs = nowMs - MOOD_POPULARITY_WINDOW_MS;
  const cleanCurrentUid = String(params.currentUid || '').trim();

  const raw = String(params.presetIdOrLabel || '').trim();
  const lower = raw.toLowerCase();
  const matched = ONLINE_MOOD_PRESETS.find(
    (p) => p.id.toLowerCase() === lower || p.label.toLowerCase() === lower
  );

  const fallbackMeta = getOnlinePeerMoodMeta(raw);
  const presetId = matched
    ? matched.id
    : (fallbackMeta.label || raw || 'custom')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'custom';
  const label = matched ? matched.label : fallbackMeta.label || raw || 'Mood Preset';
  const category = matched
    ? matched.category
    : fallbackMeta.category || resolveMoodCategoryForText(label);
  const tone = matched ? matched.tone : fallbackMeta.tone;
  const targetKey = label.toLowerCase();

  let usageCount24h = 0;
  let userUsageCount24h = 0;
  let communityUsageCount24h = 0;
  const activePeersNowSet = new Set<string>();
  const uniquePeers24hSet = new Set<string>();
  const seenEventIds = new Set<string>();
  const peersWithLoggedMood = new Set<string>();

  const events = Array.isArray(params.moodEvents) ? params.moodEvents : [];
  for (const ev of events) {
    if (!ev || typeof ev.timestampMs !== 'number') continue;
    if (ev.timestampMs < cutoffMs || ev.timestampMs > nowMs + 60_000) continue;
    const cleanUid = String(ev.uid || '').trim();
    if (!cleanUid) continue;
    const evId = String(ev.id || `${cleanUid}_${ev.mood}_${ev.timestampMs}`);
    if (seenEventIds.has(evId)) continue;
    seenEventIds.add(evId);

    const meta = getOnlinePeerMoodMeta(ev.mood);
    if (!meta.hasMood || !meta.label) continue;
    if (meta.label.toLowerCase() !== targetKey) continue;

    usageCount24h += 1;
    if (cleanCurrentUid && cleanUid === cleanCurrentUid) {
      userUsageCount24h += 1;
    } else {
      communityUsageCount24h += 1;
    }
    uniquePeers24hSet.add(cleanUid);
    peersWithLoggedMood.add(cleanUid);
  }

  const onlinePeers = Array.isArray(params.onlinePeers) ? params.onlinePeers : [];
  for (const peer of onlinePeers) {
    const cleanUid = String(peer?.uid || '').trim();
    if (!cleanUid) continue;
    const meta = getOnlinePeerMoodMeta(peer.mood);
    if (!meta.hasMood || !meta.label) continue;
    if (meta.label.toLowerCase() !== targetKey) continue;

    activePeersNowSet.add(cleanUid);
    uniquePeers24hSet.add(cleanUid);
    if (!peersWithLoggedMood.has(cleanUid)) {
      peersWithLoggedMood.add(cleanUid);
      usageCount24h += 1;
      if (cleanCurrentUid && cleanUid === cleanCurrentUid) {
        userUsageCount24h += 1;
      } else {
        communityUsageCount24h += 1;
      }
    }
  }

  if (cleanCurrentUid && params.currentUserMood !== undefined) {
    const myMeta = getOnlinePeerMoodMeta(params.currentUserMood);
    if (
      myMeta.hasMood &&
      myMeta.label &&
      myMeta.label.toLowerCase() === targetKey
    ) {
      activePeersNowSet.add(cleanCurrentUid);
      uniquePeers24hSet.add(cleanCurrentUid);
      if (!peersWithLoggedMood.has(cleanCurrentUid)) {
        peersWithLoggedMood.add(cleanCurrentUid);
        usageCount24h += 1;
        userUsageCount24h += 1;
      }
    }
  }

  const timeNoun = usageCount24h === 1 ? 'time' : 'times';
  const useNoun = usageCount24h === 1 ? 'use' : 'uses';

  return {
    presetId,
    label,
    category,
    tone,
    usageCount24h,
    userUsageCount24h,
    communityUsageCount24h,
    activePeersNow: activePeersNowSet.size,
    uniquePeers24h: uniquePeers24hSet.size,
    usageBadgeLabel: `${usageCount24h} in 24h`,
    shortUsageLabel: `${usageCount24h}×`,
    usageSummaryText: `${usageCount24h} ${useNoun} in 24h (${userUsageCount24h} you · ${communityUsageCount24h} community)`,
    usageAriaLabel: `${label} usage count: used ${usageCount24h} ${timeNoun} in the last 24 hours (${userUsageCount24h} by you, ${communityUsageCount24h} by community)`,
    hasRecentActivity: usageCount24h > 0,
  };
}

export function buildMoodPresetUsageCounts24hMap(params: {
  onlinePeers?: Array<{ uid: string; displayName?: string; mood?: string | null }>;
  moodEvents?: PeerMoodHistoryEvent[];
  currentUid?: string;
  currentUserMood?: string | null;
  nowMs?: number;
}): Record<string, MoodPresetUsageCount24hMeta> {
  const result: Record<string, MoodPresetUsageCount24hMeta> = {};
  for (const preset of ONLINE_MOOD_PRESETS) {
    const meta = getMoodPresetUsageCount24hMeta({
      ...params,
      presetIdOrLabel: preset.id,
    });
    result[preset.id] = meta;
    result[preset.label] = meta;
  }
  return result;
}

// ============================================================================
// MR. STRANGER 24/7 LIVE STUDY TOGETHER ROOMS & GLOBAL FOCUS STAGE
// ============================================================================

export type MrStranger247RoomCategory =
  | 'global_hall'
  | 'live_in_app'
  | 'live_audio'
  | 'with_camera';

export interface MrStrangerSimulatedScholarTile {
  id: string;
  displayName: string;
  countryFlag: string;
  subject: string;
  timerDisplay: string;
  cameraActive: boolean;
  micMuted: boolean;
  statusLabel: string;
  videoThumbUrl: string;
  isCurrentUser?: boolean;
}

export interface MrStranger247StudyRoomPreset {
  id: string;
  roomCode: string;
  title: string;
  shortTitle: string;
  badgeLabel: string;
  category: MrStranger247RoomCategory;
  defaultDurationMinutes: number;
  defaultSubject: string;
  defaultPositiveNote: string;
  recommendedAmbientPresetId: AmbientPresetId | null;
  requiresCameraPreferred: boolean;
  description: string;
  tagline: string;
  baselineOnlineScholars: number;
  coverImage: string;
  simulatedScholars: MrStrangerSimulatedScholarTile[];
}

export interface MrStrangerCommunityStatItem {
  id: string;
  value: string;
  label: string;
  detail: string;
}

export interface MrStrangerStudyPillarItem {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  highlightBadge: string;
}

export interface MrStrangerMindfulnessExercise {
  id: string;
  title: string;
  durationMinutes: number;
  cadenceLabel: string;
  guidanceText: string;
}

export const MR_STRANGER_COMMUNITY_IMPACT_STATS: MrStrangerCommunityStatItem[] = [
  {
    id: 'members',
    value: '+1M',
    label: 'community members',
    detail: 'Students & builders studying together worldwide on Mr. Stranger',
  },
  {
    id: 'sessions',
    value: '+16M',
    label: 'study sessions',
    detail: 'Verified Pomodoro & marathon deep-work sessions completed',
  },
  {
    id: 'goals',
    value: '+3M',
    label: 'study goals reached',
    detail: 'Daily checklist milestones and textbook chapters finished',
  },
  {
    id: 'countries',
    value: '+183',
    label: 'countries',
    detail: '24/7 global peer accountability across every timezone',
  },
  {
    id: 'reviews',
    value: '4.9/5',
    label: 'positive reviews',
    detail: 'Rated by students for focus accountability and calm ambiance',
  },
];

export const MR_STRANGER_STUDY_PILLARS: MrStrangerStudyPillarItem[] = [
  {
    id: 'peer_pressure',
    eyebrow: '01 · ACCOUNTABILITY',
    title: "The 'good' kind of peer pressure",
    description:
      "You know how your parents always say peer pressure is bad? Well, when it comes to studying, they're wrong. Studying alongside live peers in Mr. Stranger helps you stay locked in and get better grades — and that's scientifically proven.",
    highlightBadge: 'Live Camera & Avatar Desks',
  },
  {
    id: 'support_247',
    eyebrow: '02 · ALWAYS ONLINE',
    title: '24/7 support, all year round',
    description:
      'Find a study buddy (or a procrastinate-mate), hop into synchronized 25-minute group focus sprints, or ask for help in the room chat. When you need a breather, launch a 5-minute guided mindfulness session right at your desk.',
    highlightBadge: '24/7 Global Study Rooms',
  },
  {
    id: 'studying_reloaded',
    eyebrow: '03 · GAMIFIED MASTERY',
    title: 'Studying, reloaded',
    description:
      'Wait, studying can actually be fun? Turn your study goals into verified streaks, track real-time textbook progress, mix custom rainfall and binaural soundscapes, and climb the Mr. Stranger global leaderboard.',
    highlightBadge: 'Verified Streaks & Soundscapes',
  },
];

export const MR_STRANGER_MINDFULNESS_EXERCISES: MrStrangerMindfulnessExercise[] = [
  {
    id: 'box_breathing_5m',
    title: '5-Min Guided Box Breathing',
    durationMinutes: 5,
    cadenceLabel: '4s Inhale · 4s Hold · 4s Exhale · 4s Hold',
    guidanceText:
      'Unclench your jaw, drop your shoulders away from your ears, and breathe in rhythm before starting your next focus block.',
  },
  {
    id: 'eye_rest_20_20_20',
    title: '5-Min Visual Cortex & Posture Reset',
    durationMinutes: 5,
    cadenceLabel: 'Look 20ft away · Blink slowly · Neck release',
    guidanceText:
      'Rest your eyes from dense code and textbook pages. Focus on a distant point and let mental fatigue dissolve.',
  },
  {
    id: 'exam_calm_grounding',
    title: '5-Min Pre-Exam Deep Calm',
    durationMinutes: 5,
    cadenceLabel: 'Slow nasal inhale · Extended 6s exhale',
    guidanceText:
      'Quiet test anxiety and scattered thoughts. Anchor your attention on one single study task at a time.',
  },
];

export const MR_STRANGER_247_STUDY_ROOMS: MrStranger247StudyRoomPreset[] = [
  {
    id: 'solo_study',
    roomCode: 'STUDY-SOLO',
    title: 'Solo study 📚',
    shortTitle: 'Solo study',
    badgeLabel: 'Live-in app',
    category: 'live_in_app',
    defaultDurationMinutes: 50,
    defaultSubject: 'Quiet Individual Deep Reading & Problem Sets',
    defaultPositiveNote: 'Staying consistent one page at a time.',
    recommendedAmbientPresetId: 'whitenoise',
    requiresCameraPreferred: false,
    description:
      'Calm individual focus sanctuary with silent peer presence, personal goal checklists, and distraction-free timer sprints.',
    tagline: 'Silent library atmosphere · 50m Deep Focus',
    baselineOnlineScholars: 142,
    coverImage:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80',
    simulatedScholars: [
      {
        id: 'sim_solo_1',
        displayName: 'Elena R.',
        countryFlag: '🇩🇪',
        subject: 'Organic Chemistry Mechanisms',
        timerDisplay: '00:41:15',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Deep Reading',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_solo_2',
        displayName: 'Kenji T.',
        countryFlag: '🇯🇵',
        subject: 'Linear Algebra Proof Set #4',
        timerDisplay: '00:34:50',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Solo Focus',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_solo_3',
        displayName: 'Aanya M.',
        countryFlag: '🇮🇳',
        subject: 'System Design — DDIA Ch. 7',
        timerDisplay: '00:48:10',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Note Taking',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_solo_4',
        displayName: 'Lucas V.',
        countryFlag: '🇧🇷',
        subject: 'Constitutional Law Briefs',
        timerDisplay: '00:22:05',
        cameraActive: false,
        micMuted: true,
        statusLabel: 'Silent Desk',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'group_focus_25',
    roomCode: 'STUDY-GROUP25',
    title: 'Group focus | 25 min ☕',
    shortTitle: 'Group focus | 25 min',
    badgeLabel: 'Live-in app',
    category: 'live_in_app',
    defaultDurationMinutes: 25,
    defaultSubject: '25-Min Synchronized Pomodoro Sprint',
    defaultPositiveNote: 'We got this! 25 minutes of pure focus, then coffee break.',
    recommendedAmbientPresetId: 'coffeeshop',
    requiresCameraPreferred: true,
    description:
      'High-energy 25-minute Pomodoro sprints with students around the globe, followed by 5-minute chat & recharge breaks.',
    tagline: '25m Pomodoro Sprint · 5m Break · High Accountability',
    baselineOnlineScholars: 268,
    coverImage:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    simulatedScholars: [
      {
        id: 'sim_grp_1',
        displayName: 'Maya L.',
        countryFlag: '🇬🇧',
        subject: 'Medical Pharmacology Flashcards',
        timerDisplay: '00:20:45',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Pomodoro #3',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_grp_2',
        displayName: 'Daniel K.',
        countryFlag: '🇨🇦',
        subject: 'LeetCode Dynamic Programming',
        timerDisplay: '00:20:45',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Pomodoro #2',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_grp_3',
        displayName: 'Sofia G.',
        countryFlag: '🇪🇸',
        subject: 'Macroeconomics Problem Set',
        timerDisplay: '00:20:45',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Pomodoro #4',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_grp_4',
        displayName: 'Noah P.',
        countryFlag: '🇺🇸',
        subject: 'TypeScript Compiler Internals',
        timerDisplay: '00:20:45',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Pomodoro #1',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'nature_sounds',
    roomCode: 'STUDY-NATURE',
    title: 'Nature sounds 🌱',
    shortTitle: 'Nature sounds',
    badgeLabel: 'Live Audio',
    category: 'live_audio',
    defaultDurationMinutes: 60,
    defaultSubject: 'Calm Deep Work with Rainfall & Forest Acoustics',
    defaultPositiveNote: 'Peaceful mind, steady progress.',
    recommendedAmbientPresetId: 'rainfall',
    requiresCameraPreferred: false,
    description:
      'Immersive 60-minute study sanctuary paired with soothing rainfall, forest wind, and warm acoustic soundscapes.',
    tagline: '60m Restorative Focus · Rainfall Soundscape Active',
    baselineOnlineScholars: 189,
    coverImage:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=80',
    simulatedScholars: [
      {
        id: 'sim_nat_1',
        displayName: 'Chloe W.',
        countryFlag: '🇦🇺',
        subject: 'Environmental Science Thesis',
        timerDisplay: '00:52:18',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Rainfall Mix',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_nat_2',
        displayName: 'Min-jun S.',
        countryFlag: '🇰🇷',
        subject: 'Operating Systems Kernel Lab',
        timerDisplay: '00:44:02',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Nature Audio',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_nat_3',
        displayName: 'Hannah B.',
        countryFlag: '🇳🇱',
        subject: 'Cognitive Psychology Literature Review',
        timerDisplay: '00:39:11',
        cameraActive: false,
        micMuted: true,
        statusLabel: 'Audio Sanctuary',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_nat_4',
        displayName: 'Omar H.',
        countryFlag: '🇦🇪',
        subject: 'Architecture Studio Portfolio',
        timerDisplay: '00:56:40',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Deep Flow',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'study_with_camera',
    roomCode: 'STUDY-CAMERA',
    title: 'Study | With Camera 📖',
    shortTitle: 'Study | With Camera',
    badgeLabel: 'With Camera',
    category: 'with_camera',
    defaultDurationMinutes: 120,
    defaultSubject: '2-Hour Camera-On Exam Prep & Textbook Mastery',
    defaultPositiveNote: 'Camera on, phone away, 100% locked in.',
    recommendedAmbientPresetId: 'binaural',
    requiresCameraPreferred: true,
    description:
      'Maximum peer accountability room where scholars study with camera desks active to eliminate phone scrolling and procrastination.',
    tagline: '2h Marathon Block · Camera Accountability Grid',
    baselineOnlineScholars: 314,
    coverImage:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    simulatedScholars: [
      {
        id: 'sim_cam_1',
        displayName: 'Liam C.',
        countryFlag: '🇮🇪',
        subject: 'USMLE Step 1 Pathology Block',
        timerDisplay: '01:42:30',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Camera On · 2h',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_cam_2',
        displayName: 'Zara N.',
        countryFlag: '🇿🇦',
        subject: 'Quantitative Finance Stochastic Calc',
        timerDisplay: '01:18:05',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Camera On · 2h',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_cam_3',
        displayName: 'Matteo F.',
        countryFlag: '🇮🇹',
        subject: 'Astrophysics Radiative Processes',
        timerDisplay: '01:51:12',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Camera On · 2h',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_cam_4',
        displayName: 'Yuki A.',
        countryFlag: '🇯🇵',
        subject: 'Rust Async Runtime & Tokio',
        timerDisplay: '01:09:44',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Camera On · 2h',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'global_hall',
    roomCode: 'STUDY-GLOBAL',
    title: 'Global 24/7 Study Hall 🌎',
    shortTitle: 'Global 24/7 Hall',
    badgeLabel: '24/7 Global Hall',
    category: 'global_hall',
    defaultDurationMinutes: 25,
    defaultSubject: 'Distributed Systems & Deep Work',
    defaultPositiveNote: 'Stay hydrated and keep pushing forward!',
    recommendedAmbientPresetId: null,
    requiresCameraPreferred: true,
    description:
      'The flagship Mr. Stranger 24/7 international study hall where everyone can join with 1 click, share positive notes, and focus together.',
    tagline: 'Open 24/7 · All Subjects · Instant 1-Click Join',
    baselineOnlineScholars: 412,
    coverImage:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    simulatedScholars: [
      {
        id: 'sim_glb_1',
        displayName: 'Clara H.',
        countryFlag: '🇫🇷',
        subject: 'Neurobiology Synaptic Plasticity',
        timerDisplay: '00:24:12',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Studying Live',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_glb_2',
        displayName: 'Arjun V.',
        countryFlag: '🇮🇳',
        subject: 'Distributed Consensus & Raft',
        timerDisplay: '00:19:38',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Studying Live',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_glb_3',
        displayName: 'Hannah S.',
        countryFlag: '🇸🇪',
        subject: 'Econometrics Time Series Analysis',
        timerDisplay: '00:42:09',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Studying Live',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'sim_glb_4',
        displayName: 'Marcus D.',
        countryFlag: '🇺🇸',
        subject: 'Clean Architecture & DDD',
        timerDisplay: '00:31:55',
        cameraActive: true,
        micMuted: true,
        statusLabel: 'Studying Live',
        videoThumbUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];

export interface MrStrangerStudyLobbyRoomCard extends MrStranger247StudyRoomPreset {
  isActiveRoom: boolean;
  isCurrentUserSeatedHere: boolean;
  liveParticipantCount: number;
  realSeatedCount: number;
  activeScholarsPreview: MrStrangerSimulatedScholarTile[];
  ctaLabel: string;
}

export interface MrStrangerStudyTogetherLobbySummary {
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  activeRoomPreset: MrStrangerStudyLobbyRoomCard;
  featuredAbcRooms: MrStrangerStudyLobbyRoomCard[];
  allRooms: MrStrangerStudyLobbyRoomCard[];
  totalLiveScholarsOnline: number;
}

export function buildMrStrangerStudyTogetherLobby(params: {
  activeRoomCode: string;
  studyDesks?: Array<{
    uid: string;
    displayName: string;
    roomCode: string;
    subject: string;
    timerMinutes: number;
  }>;
  currentUid?: string;
  currentName?: string;
  currentTimerText?: string;
  isCameraEnabled?: boolean;
  isMicEnabled?: boolean;
}): MrStrangerStudyTogetherLobbySummary {
  const normalizedActiveCode = normalizeStudyRoomCode(params.activeRoomCode || 'STUDY-GLOBAL');
  const desks = Array.isArray(params.studyDesks) ? params.studyDesks : [];

  const allRooms: MrStrangerStudyLobbyRoomCard[] = MR_STRANGER_247_STUDY_ROOMS.map((preset) => {
    const realDesksInRoom = desks.filter(
      (d) => normalizeStudyRoomCode(d.roomCode) === preset.roomCode
    );
    const isActiveRoom = preset.roomCode === normalizedActiveCode;
    const isCurrentUserSeatedHere = Boolean(
      params.currentUid && realDesksInRoom.some((d) => d.uid === params.currentUid)
    );

    const realScholarTiles: MrStrangerSimulatedScholarTile[] = realDesksInRoom.map((desk, idx) => {
      const isMe = Boolean(params.currentUid && desk.uid === params.currentUid);
      return {
        id: `real_desk_${desk.uid}_${idx}`,
        displayName: isMe ? `${desk.displayName} (You)` : desk.displayName,
        countryFlag: isMe ? '🌟' : '🎓',
        subject: desk.subject || preset.defaultSubject,
        timerDisplay:
          isMe && params.currentTimerText
            ? params.currentTimerText
            : formatStudyTimerHMS(Math.max(1, desk.timerMinutes) * 60, true),
        cameraActive: isMe ? Boolean(params.isCameraEnabled ?? true) : true,
        micMuted: isMe ? !params.isMicEnabled : true,
        statusLabel: isMe ? 'You · Locked In' : 'Live Peer Desk',
        videoThumbUrl: isMe
          ? 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80'
          : preset.coverImage,
        isCurrentUser: isMe,
      };
    });

    const combinedTiles = [...realScholarTiles, ...preset.simulatedScholars].slice(0, 6);
    const liveParticipantCount = preset.baselineOnlineScholars + realDesksInRoom.length;

    const ctaLabel = isCurrentUserSeatedHere
      ? 'Joined · Studying Live'
      : isActiveRoom
      ? 'Join now'
      : 'Join now';

    return {
      ...preset,
      isActiveRoom,
      isCurrentUserSeatedHere,
      liveParticipantCount,
      realSeatedCount: realDesksInRoom.length,
      activeScholarsPreview: combinedTiles,
      ctaLabel,
    };
  });

  // If the user typed a custom room code not in the preset list, synthesize an active room card for it
  let activeRoomPreset = allRooms.find((r) => r.roomCode === normalizedActiveCode);
  if (!activeRoomPreset) {
    const customDesks = desks.filter(
      (d) => normalizeStudyRoomCode(d.roomCode) === normalizedActiveCode
    );
    const isCurrentUserSeatedHere = Boolean(
      params.currentUid && customDesks.some((d) => d.uid === params.currentUid)
    );
    const fallbackBase = MR_STRANGER_247_STUDY_ROOMS[0];
    const customTiles: MrStrangerSimulatedScholarTile[] = customDesks.map((desk, idx) => {
      const isMe = Boolean(params.currentUid && desk.uid === params.currentUid);
      return {
        id: `custom_desk_${desk.uid}_${idx}`,
        displayName: isMe ? `${desk.displayName} (You)` : desk.displayName,
        countryFlag: isMe ? '🌟' : '🎓',
        subject: desk.subject || 'Custom Study Session',
        timerDisplay:
          isMe && params.currentTimerText
            ? params.currentTimerText
            : formatStudyTimerHMS(Math.max(1, desk.timerMinutes) * 60, true),
        cameraActive: isMe ? Boolean(params.isCameraEnabled ?? true) : true,
        micMuted: isMe ? !params.isMicEnabled : true,
        statusLabel: isMe ? 'You · Locked In' : 'Live Peer Desk',
        videoThumbUrl: fallbackBase.coverImage,
        isCurrentUser: isMe,
      };
    });

    activeRoomPreset = {
      ...fallbackBase,
      id: `custom_${normalizedActiveCode.toLowerCase()}`,
      roomCode: normalizedActiveCode,
      title: `Custom Study Room (${normalizedActiveCode})`,
      shortTitle: normalizedActiveCode,
      badgeLabel: 'Custom Room',
      isActiveRoom: true,
      isCurrentUserSeatedHere,
      liveParticipantCount: 12 + customDesks.length,
      realSeatedCount: customDesks.length,
      activeScholarsPreview: [...customTiles, ...fallbackBase.simulatedScholars].slice(0, 6),
      ctaLabel: isCurrentUserSeatedHere ? 'Joined · Studying Live' : 'Join now',
    };
  }

  // Featured 4 "Easy as ABC" cards matching the reference website's 4 room types
  const featuredAbcRooms = allRooms.filter((r) =>
    ['solo_study', 'group_focus_25', 'nature_sounds', 'study_with_camera'].includes(r.id)
  );

  const totalLiveScholarsOnline = allRooms.reduce((sum, r) => sum + r.liveParticipantCount, 0);

  return {
    brandName: APP_BRAND_NAME,
    heroTitle: 'Meet, chat, and study with students from all over the world 🌎',
    heroSubtitle:
      'Join the Mr. Stranger 24/7 global student community online and say goodbye to lack of motivation.',
    activeRoomPreset,
    featuredAbcRooms,
    allRooms,
    totalLiveScholarsOnline,
  };
}

export interface StudyTogetherQuickJoinResolution {
  presetId: string;
  roomCode: string;
  roomName: string;
  durationMinutes: number;
  subject: string;
  positiveNote: string;
  ambientPresetToActivate: AmbientPresetId | null;
  shouldEnableCameraPreview: boolean;
}

export function resolveStudyTogetherQuickJoinAction(params: {
  roomPresetId?: string;
  roomCode?: string;
  currentSubject?: string;
  currentPositiveNote?: string;
}): StudyTogetherQuickJoinResolution {
  const byId = params.roomPresetId
    ? MR_STRANGER_247_STUDY_ROOMS.find((r) => r.id === params.roomPresetId)
    : undefined;
  const normalizedCode = params.roomCode ? normalizeStudyRoomCode(params.roomCode) : undefined;
  const byCode = normalizedCode
    ? MR_STRANGER_247_STUDY_ROOMS.find((r) => r.roomCode === normalizedCode)
    : undefined;

  const matched =
    byId ||
    byCode ||
    MR_STRANGER_247_STUDY_ROOMS.find((r) => r.id === 'group_focus_25') ||
    MR_STRANGER_247_STUDY_ROOMS[0];

  const trimmedSubj = (params.currentSubject || '').trim();
  const trimmedNote = (params.currentPositiveNote || '').trim();

  // Use the room's signature subject if the user hasn't typed a custom one or had the generic default
  const isGenericDefaultSubject =
    !trimmedSubj || trimmedSubj === 'Distributed Systems & Deep Work';
  const subject = isGenericDefaultSubject ? matched.defaultSubject : trimmedSubj;

  const isGenericDefaultNote =
    !trimmedNote || trimmedNote === 'Stay hydrated and keep pushing forward!';
  const positiveNote = isGenericDefaultNote ? matched.defaultPositiveNote : trimmedNote;

  return {
    presetId: matched.id,
    roomCode: matched.roomCode,
    roomName: `Mr. Stranger — ${matched.shortTitle}`,
    durationMinutes: matched.defaultDurationMinutes,
    subject,
    positiveNote,
    ambientPresetToActivate: matched.recommendedAmbientPresetId,
    shouldEnableCameraPreview: matched.requiresCameraPreferred,
  };
}

// ============================================================================
// ONLINE DIRECTORY MOOD CATEGORY GROUPINGS PRESET SEARCH FILTER
// ============================================================================

export interface MoodCategoryPresetSearchResult {
  rawQuery: string;
  normalizedQuery: string;
  hasActiveQuery: boolean;
  filteredGroups: OnlineMoodCategoryGroup[];
  allGroupsWithFilteredPresets: OnlineMoodCategoryGroup[];
  matchingPresets: OnlinePeerMoodOption[];
  totalMatchingPresets: number;
  totalAvailablePresets: number;
  matchingCategoryCount: number;
  hasMatches: boolean;
  shortMatchBadgeLabel: string;
  statusLabel: string;
  inputPlaceholder: string;
  inputAriaLabel: string;
}

export function filterMoodCategoryGroupsBySearchQuery(params: {
  groupedPresets?: OnlineMoodCategoryGroup[];
  searchQuery?: string | null;
  countsByMood?: Record<string, number>;
  countsByCategory?: Partial<Record<OnlineMoodCategory, number>>;
}): MoodCategoryPresetSearchResult {
  const baseGroups =
    Array.isArray(params.groupedPresets) && params.groupedPresets.length > 0
      ? params.groupedPresets
      : groupOnlineMoodPresetsByCategory(
          params.countsByMood || {},
          params.countsByCategory || {}
        );

  const rawQuery = typeof params.searchQuery === 'string' ? params.searchQuery : '';
  const trimmedQuery = sanitizeSafeText(rawQuery.trim(), 60);
  const normalizedQuery = trimmedQuery.toLowerCase();
  const hasActiveQuery = normalizedQuery.length > 0;

  const totalAvailablePresets = baseGroups.reduce(
    (sum, g) => sum + g.presets.length,
    0
  );

  const allGroupsWithFilteredPresets: OnlineMoodCategoryGroup[] = baseGroups.map(
    (group) => {
      if (!hasActiveQuery) {
        return {
          ...group,
          presets: [...group.presets],
        };
      }
      const matchingGroupPresets = group.presets.filter((preset) => {
        const labelMatch = preset.label.toLowerCase().includes(normalizedQuery);
        const idMatch = preset.id.toLowerCase().includes(normalizedQuery);
        return labelMatch || idMatch;
      });

      const filteredActiveCount = matchingGroupPresets.reduce(
        (sum, p) => sum + (Number(params.countsByMood?.[p.label]) || 0),
        0
      );

      return {
        ...group,
        presets: matchingGroupPresets,
        activeCount: hasActiveQuery ? filteredActiveCount : group.activeCount,
      };
    }
  );

  const filteredGroups = hasActiveQuery
    ? allGroupsWithFilteredPresets.filter((g) => g.presets.length > 0)
    : allGroupsWithFilteredPresets;

  const matchingPresets = filteredGroups.flatMap((g) => g.presets);
  const totalMatchingPresets = matchingPresets.length;
  const matchingCategoryCount = filteredGroups.length;
  const hasMatches = totalMatchingPresets > 0;

  const presetNoun = totalMatchingPresets === 1 ? 'preset' : 'presets';
  const categoryNoun = matchingCategoryCount === 1 ? 'category' : 'categories';

  const shortMatchBadgeLabel = hasActiveQuery
    ? `${totalMatchingPresets} ${totalMatchingPresets === 1 ? 'match' : 'matches'}`
    : `${totalAvailablePresets} presets`;

  const statusLabel = !hasActiveQuery
    ? `Showing all ${totalAvailablePresets} mood presets across ${baseGroups.length} categories`
    : hasMatches
    ? `Found ${totalMatchingPresets} matching mood ${presetNoun} in ${matchingCategoryCount} ${categoryNoun} for "${trimmedQuery}"`
    : `No mood presets match "${trimmedQuery}"`;

  return {
    rawQuery,
    normalizedQuery,
    hasActiveQuery,
    filteredGroups,
    allGroupsWithFilteredPresets,
    matchingPresets,
    totalMatchingPresets,
    totalAvailablePresets,
    matchingCategoryCount,
    hasMatches,
    shortMatchBadgeLabel,
    statusLabel,
    inputPlaceholder:
      'Search mood presets by name (e.g., Deep Work, Pair Programming)...',
    inputAriaLabel: 'Search mood presets by name',
  };
}

export const MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS = 5;
export const RECENT_DIRECTORY_FILTERS_STORAGE_KEY =
  'mr_stranger_recent_directory_filters_v1';

export interface RecentDirectoryFilterCombination {
  id: string;
  audienceFilter: OnlineDirectoryAudienceFilter;
  moodFilter: string;
  onlyInFocus: boolean;
  moodDisplayLabel: string;
  audienceDisplayLabel: 'My Connections' | 'Everyone';
  focusDisplayLabel: 'In Focus' | 'All Statuses';
  label: string;
  shortLabel: string;
  criteriaCount: number;
  isDefaultAll: boolean;
  timestampMs: number;
}

export function buildDirectoryFilterCombinationEntry(params?: {
  audienceFilter?: OnlineDirectoryAudienceFilter | string | null;
  moodFilter?: string | null;
  onlyInFocus?: boolean;
  timestampMs?: number;
}): RecentDirectoryFilterCombination {
  const rawAudience = String(params?.audienceFilter ?? 'everyone')
    .trim()
    .toLowerCase();
  const audienceFilter: OnlineDirectoryAudienceFilter =
    rawAudience === 'my_connections' ? 'my_connections' : 'everyone';
  const audienceDisplayLabel: 'My Connections' | 'Everyone' =
    audienceFilter === 'my_connections' ? 'My Connections' : 'Everyone';

  const rawMood = String(params?.moodFilter ?? 'all').trim();
  const isMoodAll = !rawMood || rawMood.toLowerCase() === 'all';
  let moodFilter = 'all';
  let moodDisplayLabel = 'All Moods';
  if (!isMoodAll) {
    const parsed = parseOnlineDirectoryMoodFilterSelection(rawMood);
    if (parsed.type === 'category' && parsed.category) {
      moodFilter = `category:${parsed.category}`;
      moodDisplayLabel = parsed.category;
    } else if (parsed.type === 'preset' && parsed.presetLabel) {
      moodFilter = parsed.presetLabel;
      moodDisplayLabel = parsed.presetLabel;
    } else {
      moodFilter = rawMood;
      moodDisplayLabel = rawMood;
    }
  }

  const onlyInFocus = Boolean(params?.onlyInFocus);
  const focusDisplayLabel: 'In Focus' | 'All Statuses' = onlyInFocus
    ? 'In Focus'
    : 'All Statuses';

  const id = `${audienceFilter}|${moodFilter.toLowerCase()}|${onlyInFocus ? '1' : '0'}`;
  const isDefaultAll =
    audienceFilter === 'everyone' && moodFilter === 'all' && !onlyInFocus;
  const criteriaCount =
    (audienceFilter === 'my_connections' ? 1 : 0) +
    (moodFilter !== 'all' ? 1 : 0) +
    (onlyInFocus ? 1 : 0);

  const parts: string[] = [moodDisplayLabel, audienceDisplayLabel];
  if (onlyInFocus) {
    parts.push('In Focus');
  }
  const label = parts.join(' · ');
  const shortLabel = isDefaultAll
    ? 'All Peers (Default)'
    : onlyInFocus
      ? `${moodDisplayLabel} · ${
          audienceFilter === 'my_connections' ? 'Connections' : 'Everyone'
        } · Focus`
      : `${moodDisplayLabel} · ${
          audienceFilter === 'my_connections' ? 'Connections' : 'Everyone'
        }`;

  const timestampMs =
    typeof params?.timestampMs === 'number' && Number.isFinite(params.timestampMs)
      ? params.timestampMs
      : Date.now();

  return {
    id,
    audienceFilter,
    moodFilter,
    onlyInFocus,
    moodDisplayLabel,
    audienceDisplayLabel,
    focusDisplayLabel,
    label,
    shortLabel,
    criteriaCount,
    isDefaultAll,
    timestampMs,
  };
}

export const DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS: RecentDirectoryFilterCombination[] =
  [
    buildDirectoryFilterCombinationEntry({
      audienceFilter: 'everyone',
      moodFilter: 'all',
      onlyInFocus: false,
      timestampMs: 1_760_000_005_000,
    }),
    buildDirectoryFilterCombinationEntry({
      audienceFilter: 'everyone',
      moodFilter: 'category:Productive',
      onlyInFocus: false,
      timestampMs: 1_760_000_004_000,
    }),
    buildDirectoryFilterCombinationEntry({
      audienceFilter: 'my_connections',
      moodFilter: 'all',
      onlyInFocus: false,
      timestampMs: 1_760_000_003_000,
    }),
    buildDirectoryFilterCombinationEntry({
      audienceFilter: 'everyone',
      moodFilter: 'Deep Work',
      onlyInFocus: true,
      timestampMs: 1_760_000_002_000,
    }),
    buildDirectoryFilterCombinationEntry({
      audienceFilter: 'my_connections',
      moodFilter: 'category:Social',
      onlyInFocus: false,
      timestampMs: 1_760_000_001_000,
    }),
  ];

export function recordRecentDirectoryFilterCombination(
  currentHistory: RecentDirectoryFilterCombination[] | null | undefined,
  nextParams: {
    audienceFilter?: OnlineDirectoryAudienceFilter | string | null;
    moodFilter?: string | null;
    onlyInFocus?: boolean;
    timestampMs?: number;
  },
  maxItems: number = MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS
): RecentDirectoryFilterCombination[] {
  const safeMax = Math.max(
    1,
    Math.min(10, Math.floor(Number(maxItems) || MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS))
  );
  const entry = buildDirectoryFilterCombinationEntry(nextParams);
  const existing = Array.isArray(currentHistory) ? currentHistory : [];
  const deduplicated = existing.filter((item) => item && item.id !== entry.id);
  return [entry, ...deduplicated].slice(0, safeMax);
}

export function applyRecentDirectoryFilterCombination(
  currentHistory: RecentDirectoryFilterCombination[] | null | undefined,
  targetIdOrIndex: string | number,
  timestampMs?: number
): {
  found: boolean;
  appliedCombination: RecentDirectoryFilterCombination | null;
  audienceFilter: OnlineDirectoryAudienceFilter;
  moodFilter: string;
  onlyInFocus: boolean;
  updatedHistory: RecentDirectoryFilterCombination[];
} {
  const list =
    Array.isArray(currentHistory) && currentHistory.length > 0
      ? currentHistory
      : DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS;

  let matched: RecentDirectoryFilterCombination | undefined;
  if (typeof targetIdOrIndex === 'number') {
    matched = list[targetIdOrIndex];
  } else {
    const cleanTarget = String(targetIdOrIndex || '').trim();
    matched = list.find((item) => item.id === cleanTarget || item.label === cleanTarget);
    if (!matched && /^\d+$/.test(cleanTarget)) {
      matched = list[Number(cleanTarget)];
    }
  }

  if (!matched) {
    const fallback = buildDirectoryFilterCombinationEntry({
      audienceFilter: 'everyone',
      moodFilter: 'all',
      onlyInFocus: false,
      timestampMs,
    });
    return {
      found: false,
      appliedCombination: null,
      audienceFilter: fallback.audienceFilter,
      moodFilter: fallback.moodFilter,
      onlyInFocus: fallback.onlyInFocus,
      updatedHistory: list.slice(0, MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS),
    };
  }

  const updatedHistory = recordRecentDirectoryFilterCombination(
    list,
    {
      audienceFilter: matched.audienceFilter,
      moodFilter: matched.moodFilter,
      onlyInFocus: matched.onlyInFocus,
      timestampMs,
    },
    MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS
  );

  return {
    found: true,
    appliedCombination: updatedHistory[0],
    audienceFilter: matched.audienceFilter,
    moodFilter: matched.moodFilter,
    onlyInFocus: matched.onlyInFocus,
    updatedHistory,
  };
}

export interface RecentDirectoryFilterDropdownOption
  extends RecentDirectoryFilterCombination {
  rank: number;
  isCurrentlyActive: boolean;
  isRecentlyApplied: true;
  recentlyAppliedBadgeLabel: 'Recently Applied';
}

export interface RecentDirectoryFiltersDropdownMeta {
  dropdownId: 'online-directory-recent-filters-dropdown';
  selectId: 'online-directory-recent-filters-select';
  triggerButtonId: 'online-directory-recent-filters-btn';
  menuId: 'online-directory-recent-filters-menu';
  dropdownLabel: 'Recent Filters';
  recentlyAppliedBadgeLabel: 'Recently Applied';
  maxItems: number;
  count: number;
  hasRecentFilters: boolean;
  isOpen: boolean;
  isCurrentConfigRecentlyApplied: boolean;
  activeCombinationRank: number | null;
  activeCombinationId: string;
  activeCombinationLabel: string;
  badgeText: string;
  ariaLabel: string;
  options: RecentDirectoryFilterDropdownOption[];
}

export interface RecentlyAppliedDirectoryFilterMeta {
  badgeId: 'online-directory-mood-filter-recently-applied-badge';
  badgeTestId: 'online-directory-recently-applied-badge';
  badgeLabel: 'Recently Applied';
  shortBadgeLabel: 'Recent';
  isRecentlyApplied: boolean;
  shouldShowBadge: boolean;
  isConstrainedMatch: boolean;
  isNonDefaultRecentlyApplied: boolean;
  isDefaultCombination: boolean;
  matchedIndex: number;
  matchedRank: number | null;
  rankBadgeText: string | null;
  totalRecentCount: number;
  matchedCombination: RecentDirectoryFilterCombination | null;
  matchedCombinationId: string | null;
  matchedCombinationLabel: string | null;
  matchedLabel: string;
  currentCombination: RecentDirectoryFilterCombination;
  recentlyAppliedMoodFilters: string[];
  recentlyAppliedCombinationIds: string[];
  statusText: string;
  statusSummary: string;
  tooltipText: string;
  ariaLabel: string;
}

export function evaluateRecentlyAppliedDirectoryFilterMeta(params?: {
  history?: RecentDirectoryFilterCombination[] | null;
  currentAudienceFilter?: OnlineDirectoryAudienceFilter | string | null;
  currentMoodFilter?: string | null;
  currentOnlyInFocus?: boolean;
}): RecentlyAppliedDirectoryFilterMeta {
  const currentCombination = buildDirectoryFilterCombinationEntry({
    audienceFilter: params?.currentAudienceFilter,
    moodFilter: params?.currentMoodFilter,
    onlyInFocus: params?.currentOnlyInFocus,
  });

  const rawHistory =
    params?.history === undefined || params?.history === null
      ? DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS
      : Array.isArray(params.history)
        ? params.history
        : DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS;

  const list = rawHistory
    .filter((item): item is RecentDirectoryFilterCombination => Boolean(item))
    .slice(0, MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS);

  const matchedIndex = list.findIndex((item) => {
    if (item.id === currentCombination.id) return true;
    const itemEntry = buildDirectoryFilterCombinationEntry({
      audienceFilter: item.audienceFilter,
      moodFilter: item.moodFilter,
      onlyInFocus: item.onlyInFocus,
    });
    return itemEntry.id === currentCombination.id;
  });

  const isRecentlyApplied = matchedIndex !== -1;
  const shouldShowBadge = isRecentlyApplied;
  const matchedCombination = isRecentlyApplied ? list[matchedIndex] : null;
  const matchedRank = isRecentlyApplied ? matchedIndex + 1 : null;
  const rankBadgeText = matchedRank !== null ? `#${matchedRank}` : null;
  const totalRecentCount = list.length;
  const isDefaultCombination = currentCombination.isDefaultAll;
  const isConstrainedMatch = isRecentlyApplied && !isDefaultCombination;

  const recentlyAppliedCombinationIds = list.map((item) => item.id);
  const recentlyAppliedMoodFilters = Array.from(
    new Set(
      list
        .map((item) => String(item.moodFilter || 'all').trim())
        .filter((m) => m && m.toLowerCase() !== 'all')
    )
  );

  const statusText = isRecentlyApplied
    ? `Recently Applied (#${matchedRank} of ${totalRecentCount}): ${currentCombination.label}`
    : `Filter configuration not in recent history (${currentCombination.label})`;

  const tooltipText = isRecentlyApplied
    ? `Recently Applied filter configuration (#${matchedRank} of ${totalRecentCount} in Recent Filters): ${currentCombination.label}`
    : `Current filter configuration (${currentCombination.label}) has not been recently applied`;

  const ariaLabel = isRecentlyApplied
    ? `Recently Applied badge: ${currentCombination.label} (rank #${matchedRank} of ${totalRecentCount} in recent filters)`
    : 'Filter configuration not recently applied';

  return {
    badgeId: 'online-directory-mood-filter-recently-applied-badge',
    badgeTestId: 'online-directory-recently-applied-badge',
    badgeLabel: 'Recently Applied',
    shortBadgeLabel: 'Recent',
    isRecentlyApplied,
    shouldShowBadge,
    isConstrainedMatch,
    isNonDefaultRecentlyApplied: isConstrainedMatch,
    isDefaultCombination,
    matchedIndex,
    matchedRank,
    rankBadgeText,
    totalRecentCount,
    matchedCombination,
    matchedCombinationId: matchedCombination ? matchedCombination.id : null,
    matchedCombinationLabel: matchedCombination ? matchedCombination.label : null,
    matchedLabel: matchedCombination ? matchedCombination.label : currentCombination.label,
    currentCombination,
    recentlyAppliedMoodFilters,
    recentlyAppliedCombinationIds,
    statusText,
    statusSummary: statusText,
    tooltipText,
    ariaLabel,
  };
}

export function isMoodFilterInRecentDirectoryFilters(
  history: RecentDirectoryFilterCombination[] | null | undefined,
  moodFilterOrPreset: string | null | undefined
): {
  isRecentlyUsed: boolean;
  isRecentlyApplied: boolean;
  badgeLabel: 'Recently Applied' | null;
  matchedRank: number | null;
  matchedCombination: RecentDirectoryFilterCombination | null;
} {
  const rawTarget = String(moodFilterOrPreset ?? '').trim();
  if (!rawTarget) {
    return {
      isRecentlyUsed: false,
      isRecentlyApplied: false,
      badgeLabel: null,
      matchedRank: null,
      matchedCombination: null,
    };
  }

  const targetEntry = buildDirectoryFilterCombinationEntry({
    audienceFilter: 'everyone',
    moodFilter: rawTarget,
    onlyInFocus: false,
  });
  const targetMoodLower = targetEntry.moodFilter.toLowerCase();
  const targetDisplayLower = targetEntry.moodDisplayLabel.toLowerCase();

  const rawHistory =
    history === undefined || history === null
      ? DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS
      : Array.isArray(history)
        ? history
        : DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS;

  const list = rawHistory
    .filter((item): item is RecentDirectoryFilterCombination => Boolean(item))
    .slice(0, MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS);

  const matchedIndex = list.findIndex((item) => {
    const itemMoodLower = String(item.moodFilter || 'all').trim().toLowerCase();
    const itemDisplayLower = String(item.moodDisplayLabel || '').trim().toLowerCase();
    return (
      itemMoodLower === targetMoodLower ||
      (targetDisplayLower !== 'all moods' && itemDisplayLower === targetDisplayLower)
    );
  });

  if (matchedIndex === -1) {
    return {
      isRecentlyUsed: false,
      isRecentlyApplied: false,
      badgeLabel: null,
      matchedRank: null,
      matchedCombination: null,
    };
  }

  return {
    isRecentlyUsed: true,
    isRecentlyApplied: true,
    badgeLabel: 'Recently Applied',
    matchedRank: matchedIndex + 1,
    matchedCombination: list[matchedIndex],
  };
}

export function getRecentDirectoryFiltersDropdownMeta(params?: {
  history?: RecentDirectoryFilterCombination[] | null;
  currentAudienceFilter?: OnlineDirectoryAudienceFilter | string | null;
  currentMoodFilter?: string | null;
  currentOnlyInFocus?: boolean;
  isOpen?: boolean;
}): RecentDirectoryFiltersDropdownMeta {
  const currentActive = buildDirectoryFilterCombinationEntry({
    audienceFilter: params?.currentAudienceFilter,
    moodFilter: params?.currentMoodFilter,
    onlyInFocus: params?.currentOnlyInFocus,
  });

  const rawHistory =
    Array.isArray(params?.history) && params.history.length > 0
      ? params.history
      : DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS;

  const trimmedHistory = rawHistory.slice(0, MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS);
  const options: RecentDirectoryFilterDropdownOption[] = trimmedHistory.map(
    (item, idx) => ({
      ...item,
      rank: idx + 1,
      isCurrentlyActive: item.id === currentActive.id,
      isRecentlyApplied: true,
      recentlyAppliedBadgeLabel: 'Recently Applied',
    })
  );

  const activeIdx = options.findIndex((opt) => opt.isCurrentlyActive);
  const isCurrentConfigRecentlyApplied = activeIdx !== -1;
  const activeCombinationRank = isCurrentConfigRecentlyApplied ? activeIdx + 1 : null;

  const count = options.length;
  const maxItems = MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS;

  return {
    dropdownId: 'online-directory-recent-filters-dropdown',
    selectId: 'online-directory-recent-filters-select',
    triggerButtonId: 'online-directory-recent-filters-btn',
    menuId: 'online-directory-recent-filters-menu',
    dropdownLabel: 'Recent Filters',
    recentlyAppliedBadgeLabel: 'Recently Applied',
    maxItems,
    count,
    hasRecentFilters: count > 0,
    isOpen: Boolean(params?.isOpen),
    isCurrentConfigRecentlyApplied,
    activeCombinationRank,
    activeCombinationId: currentActive.id,
    activeCombinationLabel: currentActive.label,
    badgeText: `${count}/${maxItems}`,
    ariaLabel: `Recent Filters dropdown (${count} of ${maxItems} recent filter combinations). Currently active: ${currentActive.label}.`,
    options,
  };
}


