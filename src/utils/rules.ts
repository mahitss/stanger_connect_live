/**
 * Pure domain logic for Mr. Stranger:
 * 1. Daily login streak and participation points math
 * 2. Subway Runner 3-lane obstacle collision & score calculation
 * 3. Angry Catapult projectile trajectory & structure impact physics
 * 4. Block Arena grid placement, line clearing & score math
 * 5. Pomodoro Study Timer formatting, Study Room invite codes & shareable links
 * 6. Privacy visibility filtering & password strength validation
 */

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
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address (e.g. name@domain.com).' };
  }
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long for account security.' };
  }
  if (isSignUp && (!displayName || displayName.trim().length < 2)) {
    return { valid: false, error: 'Please enter your full account display name (at least 2 characters).' };
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
