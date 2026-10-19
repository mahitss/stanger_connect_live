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
} from './rules.ts';

test('streak increments on consecutive day and preserves on same day', () => {
  const initial = { streakCount: 3, lastLoginDate: '2026-10-18', participationPoints: 100 };

  const sameDay = computeUpdatedStreak(initial, '2026-10-18', 10);
  assert.equal(sameDay.incremented, false);
  assert.equal(sameDay.updated.streakCount, 3);

  const nextDay = computeUpdatedStreak(initial, '2026-10-19', 10);
  assert.equal(nextDay.incremented, true);
  assert.equal(nextDay.updated.streakCount, 4);
  assert.equal(nextDay.updated.participationPoints, 125);

  const missedDay = computeUpdatedStreak(initial, '2026-10-22', 10);
  assert.equal(missedDay.updated.streakCount, 1);
});

test('Study Room invite code normalization and shareable URL builder', () => {
  assert.equal(normalizeStudyRoomCode('  study-room 42! '), 'STUDY-ROOM42');
  const url = buildStudyRoomInviteUrl('https://mrstranger.app/', 'focus-99');
  assert.equal(url, 'https://mrstranger.app/?room=FOCUS-99');
});

test('Email, Password, and Account validation enforces email format and 8-char password', () => {
  assert.equal(validateAccountCredentials('bad-email', '12345678').valid, false);
  assert.equal(validateAccountCredentials('user@domain.com', 'short').valid, false);
  assert.equal(validateAccountCredentials('user@domain.com', 'StrongPass123', 'A', true).valid, false);
  assert.equal(validateAccountCredentials('user@domain.com', 'StrongPass123', 'Mahit Saxena', true).valid, true);
  assert.equal(deriveE2eeFingerprint('user_1', 'user@domain.com').length, 19);
});

test('Subway Runner collision logic detects barriers, jumps, and coins', () => {
  const barrier = { id: 1, lane: 1 as const, y: 84, type: 'barrier' as const };
  assert.equal(checkRunnerCollision(1, false, barrier), 'hit');
  assert.equal(checkRunnerCollision(1, true, barrier), 'clear');
  assert.equal(checkRunnerCollision(0, false, barrier), 'clear');

  const coin = { id: 2, lane: 2 as const, y: 83, type: 'coin' as const };
  assert.equal(checkRunnerCollision(2, false, coin), 'coin');
});

test('Angry Catapult physics steps projectile and detects target block hit', () => {
  const proj = { x: 100, y: 100, vx: 200, vy: -50 };
  const next = stepProjectile(proj, 0.05, 300);
  assert.ok(next.x > 100);
  assert.ok(next.vy > -50);

  const block = { id: 'b1', x: 105, y: 95, width: 30, height: 30, hp: 2, points: 50 };
  assert.equal(checkProjectileBlockHit({ x: 110, y: 105, vx: 0, vy: 0 }, 10, block), true);
  assert.equal(checkProjectileBlockHit({ x: 10, y: 10, vx: 0, vy: 0 }, 10, block), false);
});

test('Block Arena line clearing removes full rows and awards points', () => {
  const grid = createEmptyGrid(4, 4);
  grid[3] = [1, 1, 1, 1];
  grid[2] = [2, 0, 2, 2];

  const result = clearCompletedLines(grid);
  assert.equal(result.linesCleared, 1);
  assert.equal(result.pointsEarned, 100);
  assert.deepEqual(result.newGrid[0], [0, 0, 0, 0]);
  assert.deepEqual(result.newGrid[3], [2, 0, 2, 2]);
});

test('Study timer formatting returns padded MM:SS', () => {
  assert.equal(formatTimerMMSS(1500), '25:00');
  assert.equal(formatTimerMMSS(65), '01:05');
  assert.equal(formatTimerMMSS(0), '00:00');
});
