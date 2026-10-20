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
  return visibleEntries.slice(0, safeLimit).map((item, idx) => ({
    rank: idx + 1,
    uid: item.uid,
    displayName: item.displayName,
    bio: item.bio || 'Active member on Mr. Stranger',
    streakCount: item.streakCount,
    participationPoints: item.participationPoints,
    compositeScore: computeLeaderboardCompositeScore(item.participationPoints, item.streakCount),
    isOnline: Boolean(item.isOnline),
    currentMode: item.currentMode || 'hub',
  }));
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
