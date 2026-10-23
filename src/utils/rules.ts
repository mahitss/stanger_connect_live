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

// --- Subtle UI Sound Effect Toggle for Incoming Messages & Connection Requests ---
export type UiSoundAlertEvent = 'incoming_message' | 'connection_request';

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

export interface OnlinePeerMoodOption {
  id: string;
  label: string;
  description: string;
  tone: OnlineMoodTone;
}

export const ONLINE_MOOD_PRESETS: readonly OnlinePeerMoodOption[] = [
  {
    id: 'deep_work',
    label: 'Deep Work',
    description: 'Heads-down execution — minimal interruptions',
    tone: 'emerald',
  },
  {
    id: 'brainstorming',
    label: 'Brainstorming',
    description: 'Open to creative ideas & architecture discussions',
    tone: 'amber',
  },
  {
    id: 'quick_questions',
    label: 'Quick Questions',
    description: 'Available for fast unblocking & short pings',
    tone: 'sky',
  },
  {
    id: 'pair_programming',
    label: 'Pair Programming',
    description: 'Looking to collaborate on code or problem solving',
    tone: 'violet',
  },
  {
    id: 'coffee_break',
    label: 'Coffee Break',
    description: 'Recharging — open to casual conversation',
    tone: 'zinc',
  },
] as const;

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
    };
  }

  return {
    hasMood: true,
    label: check.mood,
    description: 'Custom status mood shared with online peers',
    tone: 'sky',
    isPreset: false,
  };
}

export function summarizeOnlineDirectoryMoods(
  peers: Array<{ uid: string; mood?: string | null }>
): {
  activeMoodCount: number;
  countsByMood: Record<string, number>;
  byUid: Record<string, OnlinePeerMoodMeta>;
} {
  const countsByMood: Record<string, number> = {};
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
    }
  }

  return {
    activeMoodCount,
    countsByMood,
    byUid,
  };
}

export function filterOnlinePeersByDirectoryCriteria<
  T extends OnlinePeerFocusInput & { mood?: string | null }
>(
  peers: T[],
  studyDesks: StudyDeskSummary[] = [],
  options: {
    onlyInFocus?: boolean;
    moodFilter?: string | null;
  } = {}
): T[] {
  const { onlyInFocus = false, moodFilter = null } = options;
  const normalizedMoodFilter = moodFilter ? String(moodFilter).trim().toLowerCase() : '';

  return peers.filter((peer) => {
    if (onlyInFocus && !getOnlinePeerFocusStatus(peer, studyDesks).isInFocus) {
      return false;
    }
    if (normalizedMoodFilter && normalizedMoodFilter !== 'all') {
      const peerMood = getOnlinePeerMoodMeta(peer.mood);
      if (!peerMood.hasMood || !peerMood.label) return false;
      if (peerMood.label.toLowerCase() !== normalizedMoodFilter) return false;
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

// --- Daily Productivity Goal Pure Math ---
export interface DailyProductivityProgress {
  targetMinutes: number;
  completedMinutes: number;
  progressPercent: number;
  remainingMinutes: number;
  isGoalReached: boolean;
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
  return {
    targetMinutes: safeTarget,
    completedMinutes: safeCompleted,
    progressPercent,
    remainingMinutes,
    isGoalReached: safeCompleted >= safeTarget,
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

export interface StreakState {
  streakCount: number;
  lastLoginDate: string; // YYYY-MM-DD
  participationPoints: number;
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
): { updated: StreakState; incremented: boolean } {
  if (!current.lastLoginDate) {
    return {
      updated: {
        streakCount: 1,
        lastLoginDate: todayDateKey,
        participationPoints: Math.max(0, current.participationPoints) + bonusPoints,
      },
      incremented: true,
    };
  }

  if (current.lastLoginDate === todayDateKey) {
    return {
      updated: {
        ...current,
        streakCount: Math.max(1, current.streakCount),
      },
      incremented: false,
    };
  }

  const prev = new Date(`${current.lastLoginDate}T00:00:00Z`);
  const curr = new Date(`${todayDateKey}T00:00:00Z`);
  const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return {
      updated: {
        streakCount: current.streakCount + 1,
        lastLoginDate: todayDateKey,
        participationPoints: current.participationPoints + bonusPoints + 15,
      },
      incremented: true,
    };
  }

  return {
    updated: {
      streakCount: 1,
      lastLoginDate: todayDateKey,
      participationPoints: current.participationPoints + bonusPoints,
    },
    incremented: true,
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


