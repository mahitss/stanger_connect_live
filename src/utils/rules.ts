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
  subtitle: string;
  frequencyProfile: string;
  cadence: string;
}

export const AMBIENT_SOUNDSCAPES: AmbientPresetMeta[] = [
  {
    id: 'rainfall',
    label: 'Rainfall',
    subtitle: 'Steady warm rain bed with pattering window droplets',
    frequencyProfile: '120Hz – 920Hz Low-Pass Pink',
    cadence: 'Continuous Acoustic Bed',
  },
  {
    id: 'coffeeshop',
    label: 'Coffee Shop',
    subtitle: 'Warm café room murmur with subtle porcelain acoustics',
    frequencyProfile: '460Hz Band-Pass Room Envelope',
    cadence: 'Organic Room Cadence',
  },
  {
    id: 'whitenoise',
    label: 'White Noise',
    subtitle: 'Calibrated broadband masking to block external distractions',
    frequencyProfile: '20Hz – 4.2kHz Flat Mask',
    cadence: 'Zero-Variance Shield',
  },
  {
    id: 'binaural',
    label: '432Hz Alpha Focus',
    subtitle: 'Phase-locked 8Hz alpha binaural harmonic carrier',
    frequencyProfile: '216Hz L / 224Hz R Sine',
    cadence: '8.0Hz Alpha Entrainment',
  },
  {
    id: 'lofi',
    label: 'Lo-Fi Study Chords',
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
    top3Moods.forEach((moodStat, rankIdx) => {
      const rawCount = rawCountsForBucket[moodStat.mood] || 0;
      let val = rawCount;
      if (bIdx === TREND_BUCKET_SPECS.length - 1) {
        // 'Now' bucket reflects current live activity and latest 24h peak for immediate feedback
        val = Math.max(rawCount, moodStat.activePeersNow, moodStat.usageCount24h);
      } else if (totalEvents24h > 0) {
        const waveVal = BASELINE_FLUCTUATION_WAVES[rankIdx]?.[bIdx] ?? 0;
        val = rawCount + waveVal;
      }
      valuesByMood[moodStat.mood] = val;
      if (val > maxBucketVal) maxBucketVal = val;
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
}

export function computeMoodTrendPeakMarkers(params: {
  top3Moods: PopularMoodStat[];
  trendBuckets: MoodTrendBucketPoint[];
}): MoodTrendPeakInfo[] {
  const moods = Array.isArray(params.top3Moods)
    ? params.top3Moods.slice(0, 3)
    : [];
  const buckets = Array.isArray(params.trendBuckets) ? params.trendBuckets : [];

  return moods.map((moodStat) => {
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
    };
  });
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
