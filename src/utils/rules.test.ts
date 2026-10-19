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
} from './rules.ts';

test('Ambient soundscapes include Rainfall, Coffee Shop, and White Noise and toggle cleanly', () => {
  const ids = AMBIENT_SOUNDSCAPES.map((s) => s.id);
  assert.ok(ids.includes('rainfall'));
  assert.ok(ids.includes('coffeeshop'));
  assert.ok(ids.includes('whitenoise'));

  // Clicking an inactive soundscape activates it
  assert.equal(toggleAmbientSoundscape('off', 'rainfall'), 'rainfall');
  // Clicking an active soundscape toggles it off
  assert.equal(toggleAmbientSoundscape('rainfall', 'rainfall'), 'off');
  // Clicking a different soundscape switches directly to it
  assert.equal(toggleAmbientSoundscape('rainfall', 'coffeeshop'), 'coffeeshop');
  assert.equal(toggleAmbientSoundscape('coffeeshop', 'whitenoise'), 'whitenoise');
});

test('streak increments on consecutive day and preserves on same day', () => {
  const initial = { streakCount: 2, lastLoginDate: '2026-10-18', participationPoints: 50 };
  const sameDay = computeUpdatedStreak(initial, '2026-10-18', 10);
  assert.equal(sameDay.incremented, false);
  assert.equal(sameDay.updated.streakCount, 2);

  const nextDay = computeUpdatedStreak(initial, '2026-10-19', 10);
  assert.equal(nextDay.incremented, true);
  assert.equal(nextDay.updated.streakCount, 3);
  assert.equal(nextDay.updated.participationPoints, 75);
});

test('Study Room invite code normalization and shareable URL builder', () => {
  assert.equal(normalizeStudyRoomCode('  room-99a! '), 'ROOM-99A');
  assert.equal(
    buildStudyRoomInviteUrl('https://mrstranger.app/', 'study-42x'),
    'https://mrstranger.app/?room=STUDY-42X'
  );
});

test('Email, Password, and Account validation enforces email format and 8-char password', () => {
  assert.equal(validateAccountCredentials('bad-email', '12345678', 'Mahit', true).valid, false);
  assert.equal(validateAccountCredentials('mahit@company.com', 'short', 'Mahit', true).valid, false);
  assert.equal(validateAccountCredentials('mahit@company.com', 'StrongPass99', 'M', true).valid, false);
  assert.equal(validateAccountCredentials('mahit@company.com', 'StrongPass99', 'Mahit Saxena', true).valid, true);
  const fp = deriveE2eeFingerprint('uid_123', 'mahit@company.com');
  assert.equal(fp.length, 19);
});

test('Subway Runner collision logic detects barriers, jumps, and coins', () => {
  assert.equal(
    checkRunnerCollision(1, false, { id: 1, lane: 1, y: 84, type: 'barrier' }),
    'hit'
  );
  assert.equal(
    checkRunnerCollision(1, true, { id: 2, lane: 1, y: 84, type: 'barrier' }),
    'clear'
  );
  assert.equal(
    checkRunnerCollision(2, false, { id: 3, lane: 2, y: 84, type: 'coin' }),
    'coin'
  );
});

test('Angry Catapult physics steps projectile and detects target block hit', () => {
  const initial = { x: 100, y: 100, vx: 200, vy: -100 };
  const next = stepProjectile(initial, 0.02, 300);
  assert.ok(next.x > initial.x);
  assert.ok(next.y < initial.y);

  const block = { id: 'b1', x: 95, y: 95, width: 30, height: 30, hp: 1, points: 150 };
  assert.equal(checkProjectileBlockHit({ x: 105, y: 105, vx: 0, vy: 0 }, 8, block), true);
});

test('Block Arena line clearing removes full rows and awards points', () => {
  const grid = createEmptyGrid(4, 4);
  grid[3] = [1, 1, 1, 1];
  grid[2] = [1, 0, 1, 0];
  const res = clearCompletedLines(grid);
  assert.equal(res.linesCleared, 1);
  assert.equal(res.pointsEarned, 100);
  assert.deepEqual(res.newGrid[3], [1, 0, 1, 0]);
});

test('Study timer formatting returns padded MM:SS', () => {
  assert.equal(formatTimerMMSS(1500), '25:00');
  assert.equal(formatTimerMMSS(65), '01:05');
});
