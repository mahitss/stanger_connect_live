import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeUpdatedStreak,
  checkRunnerCollision,
  stepProjectile,
  checkProjectileBlockHit,
  createEmptyGrid,
  clearCompletedLines,
  formatTimerMMSS,
  normalizeStudyRoomCode,
  buildStudyRoomInviteUrl,
  validateAccountCredentials,
  deriveE2eeFingerprint,
  AMBIENT_SOUNDSCAPES,
  toggleAmbientSoundscape,
  computeProductivityGoalProgress,
  detectSecurityThreat,
  sanitizeSafeText,
  checkSlidingWindowRateLimit,
  canUsersChatOrCall,
} from './rules.ts';

test('Daily Productivity Goal computes percentage, remaining minutes, and completion state', () => {
  const half = computeProductivityGoalProgress(120, 60);
  assert.equal(half.targetMinutes, 120);
  assert.equal(half.completedMinutes, 60);
  assert.equal(half.progressPercent, 50);
  assert.equal(half.remainingMinutes, 60);
  assert.equal(half.isGoalReached, false);

  const done = computeProductivityGoalProgress(90, 105);
  assert.equal(done.progressPercent, 100);
  assert.equal(done.remainingMinutes, 0);
  assert.equal(done.isGoalReached, true);
});

test('SQL/NoSQL/XSS security guard blocks injection payloads and allows clean text', () => {
  const sql = detectSecurityThreat("admin@app.com' OR '1'='1");
  assert.equal(sql.safe, false);
  assert.equal(sql.threatType, 'sql_injection');

  const sqlDrop = detectSecurityThreat('hello; DROP TABLE users;--');
  assert.equal(sqlDrop.safe, false);
  assert.equal(sqlDrop.threatType, 'sql_injection');

  const nosql = detectSecurityThreat('{"$gt": ""}');
  assert.equal(nosql.safe, false);
  assert.equal(nosql.threatType, 'nosql_injection');

  const xss = detectSecurityThreat('<script>alert(1)</script>');
  assert.equal(xss.safe, false);
  assert.equal(xss.threatType, 'xss_injection');

  const clean = detectSecurityThreat('Studying distributed systems for 50 minutes!');
  assert.equal(clean.safe, true);
  assert.equal(sanitizeSafeText('  Hello <script>World  ', 50), 'Hello scriptWorld');
});

test('Invite-first chat & call guard blocks random/unaccepted users and allows accepted connections', () => {
  const requests = [
    { fromUid: 'usr_1', toUid: 'usr_2', status: 'pending' as const },
    { fromUid: 'usr_1', toUid: 'usr_3', status: 'accepted' as const },
  ];

  // Self-chat blocked
  assert.equal(canUsersChatOrCall('usr_1', 'usr_1', requests).allowed, false);
  // Random user with no invite blocked
  assert.equal(canUsersChatOrCall('usr_1', 'usr_99', requests).allowed, false);
  // Pending invite still locked
  assert.equal(canUsersChatOrCall('usr_1', 'usr_2', requests).allowed, false);
  // Accepted invite unlocked in both directions
  assert.equal(canUsersChatOrCall('usr_1', 'usr_3', requests).allowed, true);
  assert.equal(canUsersChatOrCall('usr_3', 'usr_1', requests).allowed, true);
});

test('Sliding-window rate limiter enforces max requests per window and computes retryAfterSeconds', () => {
  const t0 = 100000;
  let ts: number[] = [];
  for (let i = 0; i < 3; i++) {
    const res = checkSlidingWindowRateLimit(ts, t0 + i * 100, 10000, 3);
    assert.equal(res.allowed, true);
    ts = res.updatedTimestamps;
  }
  const blocked = checkSlidingWindowRateLimit(ts, t0 + 500, 10000, 3);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);

  // After window expires, allowed again
  const afterWindow = checkSlidingWindowRateLimit(ts, t0 + 11000, 10000, 3);
  assert.equal(afterWindow.allowed, true);
});

test('Ambient soundscapes include Rainfall, Coffee Shop, and White Noise and toggle cleanly', () => {
  const ids = AMBIENT_SOUNDSCAPES.map((s) => s.id);
  assert.ok(ids.includes('rainfall'));
  assert.ok(ids.includes('coffeeshop'));
  assert.ok(ids.includes('whitenoise'));

  // Clicking an inactive preset turns it on
  assert.equal(toggleAmbientSoundscape('off', 'rainfall'), 'rainfall');
  // Clicking the same active preset toggles it off
  assert.equal(toggleAmbientSoundscape('rainfall', 'rainfall'), 'off');
  // Clicking a different preset switches directly to it
  assert.equal(toggleAmbientSoundscape('rainfall', 'coffeeshop'), 'coffeeshop');
});

test('streak increments on consecutive day and preserves on same day', () => {
  const initial = { streakCount: 2, lastLoginDate: '2026-10-18', participationPoints: 50 };
  const sameDay = computeUpdatedStreak(initial, '2026-10-18');
  assert.equal(sameDay.incremented, false);
  assert.equal(sameDay.updated.streakCount, 2);

  const nextDay = computeUpdatedStreak(initial, '2026-10-19', 10);
  assert.equal(nextDay.incremented, true);
  assert.equal(nextDay.updated.streakCount, 3);
  assert.equal(nextDay.updated.participationPoints, 75);
});

test('Study Room invite code normalization and shareable URL builder', () => {
  assert.equal(normalizeStudyRoomCode('  study-room 42! '), 'STUDY-ROOM42');
  const url = buildStudyRoomInviteUrl('https://mrstranger.app/', 'study-99');
  assert.equal(url, 'https://mrstranger.app/?room=STUDY-99');
});

test('Email, Password, and Account validation enforces email format and 8-char password', () => {
  assert.equal(validateAccountCredentials('bad-email', '12345678', 'Alice', true).valid, false);
  assert.equal(validateAccountCredentials('alice@corp.com', 'short', 'Alice', true).valid, false);
  assert.equal(validateAccountCredentials('alice@corp.com', 'StrongPass123', 'A', true).valid, false);
  assert.equal(validateAccountCredentials('alice@corp.com', 'StrongPass123', 'Alice Vance', true).valid, true);
  assert.ok(deriveE2eeFingerprint('usr_1', 'alice@corp.com').length === 19);
});

test('Subway Runner collision logic detects barriers, jumps, and coins', () => {
  const barrier = { id: 1, lane: 1 as const, y: 84, type: 'barrier' as const };
  assert.equal(checkRunnerCollision(1, false, barrier), 'hit');
  assert.equal(checkRunnerCollision(1, true, barrier), 'clear');
  assert.equal(checkRunnerCollision(0, false, barrier), 'clear');

  const coin = { id: 2, lane: 2 as const, y: 85, type: 'coin' as const };
  assert.equal(checkRunnerCollision(2, false, coin), 'coin');
});

test('Angry Catapult physics steps projectile and detects target block hit', () => {
  const initial = { x: 10, y: 50, vx: 100, vy: -80 };
  const stepped = stepProjectile(initial, 0.02);
  assert.ok(stepped.x > initial.x);
  assert.ok(stepped.y < initial.y);

  const block = { id: 'b1', x: 100, y: 100, width: 40, height: 40, hp: 1, points: 150 };
  assert.equal(checkProjectileBlockHit({ x: 110, y: 110, vx: 0, vy: 0 }, 8, block), true);
  assert.equal(checkProjectileBlockHit({ x: 20, y: 20, vx: 0, vy: 0 }, 8, block), false);
});

test('Block Arena line clearing removes full rows and awards points', () => {
  const grid = createEmptyGrid(4, 4);
  grid[3] = [1, 1, 1, 1];
  grid[2] = [0, 1, 0, 1];

  const result = clearCompletedLines(grid);
  assert.equal(result.linesCleared, 1);
  assert.equal(result.pointsEarned, 100);
  assert.deepEqual(result.newGrid[3], [0, 1, 0, 1]);
  assert.deepEqual(result.newGrid[0], [0, 0, 0, 0]);
});

test('Study timer formatting returns padded MM:SS', () => {
  assert.equal(formatTimerMMSS(1500), '25:00');
  assert.equal(formatTimerMMSS(65), '01:05');
});
