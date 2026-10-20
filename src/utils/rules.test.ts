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
  aggregateGlobalLeaderboard,
  computeLeaderboardCompositeScore,
  createLeaderboardSnapshot,
  createBaselinePreviousSnapshot,
  computeLeaderboardTrends,
  getTopContributorBadge,
  getPastDateKey,
  buildWeeklyActivityOverview,
  DEFAULT_UI_SOUND_PREFERENCES,
  toggleUiSoundEffects,
  getUiSoundChimeSpec,
  shouldPlayUiNotificationSound,
  getOnlinePeerFocusStatus,
  summarizeOnlineDirectoryFocus,
  filterOnlinePeersByFocus,
  canUserCommentOnMoment,
  validateAndSanitizeMomentComment,
  groupMomentCommentsByMomentId,
} from './rules.ts';

test('Photo Moment comment rules enforce connection permissions, sanitize text, block injections, and sort chronologically', () => {
  // 1. Author can always comment on their own moment
  const authorCheck = canUserCommentOnMoment({
    momentAuthorUid: 'usr_maya',
    momentVisibility: 'connections',
    currentUid: 'usr_maya',
    acceptedPeerUids: [],
  });
  assert.equal(authorCheck.allowed, true);
  assert.equal(authorCheck.authorRelation, 'author');

  // 2. Accepted connection can comment on connections-only moment
  const connCheck = canUserCommentOnMoment({
    momentAuthorUid: 'usr_maya',
    momentVisibility: 'connections',
    currentUid: 'usr_aarav',
    acceptedPeerUids: ['usr_maya'],
  });
  assert.equal(connCheck.allowed, true);
  assert.equal(connCheck.authorRelation, 'connection');

  // 3. Non-connected user cannot comment on connections-only moment
  const nonConnPrivateCheck = canUserCommentOnMoment({
    momentAuthorUid: 'usr_maya',
    momentVisibility: 'connections',
    currentUid: 'usr_stranger',
    acceptedPeerUids: [],
  });
  assert.equal(nonConnPrivateCheck.allowed, false);
  assert.ok(nonConnPrivateCheck.reason.includes('accepted connections'));

  // 4. Non-connected member CAN comment on a public moment
  const publicMemberCheck = canUserCommentOnMoment({
    momentAuthorUid: 'usr_maya',
    momentVisibility: 'public',
    currentUid: 'usr_stranger',
    acceptedPeerUids: [],
  });
  assert.equal(publicMemberCheck.allowed, true);
  assert.equal(publicMemberCheck.authorRelation, 'member');

  // 5. Validation & XSS/SQLi sanitization
  assert.equal(validateAndSanitizeMomentComment('   ').valid, false);
  assert.equal(validateAndSanitizeMomentComment('a'.repeat(401)).valid, false);
  assert.equal(validateAndSanitizeMomentComment('<script>alert(1)</script>').valid, false);
  const validComment = validateAndSanitizeMomentComment('Great distributed systems notes!');
  assert.equal(validComment.valid, true);
  assert.equal(validComment.sanitizedText, 'Great distributed systems notes!');

  // 6. Grouping and chronological sorting
  const grouped = groupMomentCommentsByMomentId([
    {
      id: 'c_2',
      momentId: 'm_1',
      momentAuthorUid: 'usr_maya',
      authorUid: 'usr_maya',
      authorName: 'Maya Lin',
      text: 'Thanks Aarav! Let us review Raft section 5 next.',
      visibility: 'public',
      createdAtMs: 2000,
    },
    {
      id: 'c_1',
      momentId: 'm_1',
      momentAuthorUid: 'usr_maya',
      authorUid: 'usr_aarav',
      authorName: 'Aarav Mehta',
      text: 'Awesome whiteboard diagram!',
      visibility: 'public',
      createdAtMs: 1000,
    },
    {
      id: 'c_1', // duplicate ID should be deduplicated
      momentId: 'm_1',
      momentAuthorUid: 'usr_maya',
      authorUid: 'usr_aarav',
      authorName: 'Aarav Mehta',
      text: 'Awesome whiteboard diagram!',
      visibility: 'public',
      createdAtMs: 1000,
    },
  ]);
  assert.equal(grouped['m_1'].length, 2);
  assert.equal(grouped['m_1'][0].id, 'c_1');
  assert.equal(grouped['m_1'][1].id, 'c_2');
});

test('Online Directory In Focus indicator identifies users in Study Room mode or occupying an active Study Desk', () => {
  const peers = [
    { uid: 'usr_hub', currentMode: 'hub', activeStudyRoomCode: 'STUDY-GLOBAL' },
    { uid: 'usr_study_mode', currentMode: 'study', activeStudyRoomCode: 'STUDY-ALGO99' },
    { uid: 'usr_desk_claimed', currentMode: 'hub', activeStudyRoomCode: 'STUDY-MATH10' },
    { uid: 'usr_chat_mode', currentMode: 'chat', activeStudyRoomCode: 'STUDY-GLOBAL' },
  ];

  const studyDesks = [
    {
      uid: 'usr_desk_claimed',
      roomCode: 'STUDY-MATH10',
      subject: 'Linear Algebra',
      timerMinutes: 50,
    },
  ];

  // Peer in hub without a desk is not In Focus
  const hubStatus = getOnlinePeerFocusStatus(peers[0], studyDesks);
  assert.equal(hubStatus.isInFocus, false);
  assert.equal(hubStatus.indicatorLabel, null);

  // Peer in Study Room mode is In Focus
  const studyModeStatus = getOnlinePeerFocusStatus(peers[1], studyDesks);
  assert.equal(studyModeStatus.isInFocus, true);
  assert.equal(studyModeStatus.indicatorLabel, 'In Focus');
  assert.equal(studyModeStatus.roomCode, 'STUDY-ALGO99');
  assert.equal(studyModeStatus.statusDetail, 'STUDY-ALGO99');

  // Peer with an active Study Desk is In Focus even while viewing the Hub
  const deskStatus = getOnlinePeerFocusStatus(peers[2], studyDesks);
  assert.equal(deskStatus.isInFocus, true);
  assert.equal(deskStatus.indicatorLabel, 'In Focus');
  assert.equal(deskStatus.roomCode, 'STUDY-MATH10');
  assert.equal(deskStatus.subject, 'Linear Algebra');
  assert.equal(deskStatus.timerMinutes, 50);
  assert.equal(deskStatus.statusDetail, 'STUDY-MATH10 · Linear Algebra · 50m');

  // Summary aggregates total online and in-focus counts accurately
  const summary = summarizeOnlineDirectoryFocus(peers, studyDesks);
  assert.equal(summary.totalOnline, 4);
  assert.equal(summary.inFocusCount, 2);
  assert.equal(summary.byUid['usr_study_mode'].isInFocus, true);
  assert.equal(summary.byUid['usr_desk_claimed'].isInFocus, true);
  assert.equal(summary.byUid['usr_hub'].isInFocus, false);

  // Filter returns all peers when onlyInFocus is false, and only productive peers when true
  assert.equal(filterOnlinePeersByFocus(peers, studyDesks, false).length, 4);
  const focusedPeers = filterOnlinePeersByFocus(peers, studyDesks, true);
  assert.equal(focusedPeers.length, 2);
  assert.deepEqual(
    focusedPeers.map((p) => p.uid),
    ['usr_study_mode', 'usr_desk_claimed']
  );
});

test('UI Sound Effect toggle and notification sound evaluation handles incoming messages, connection requests, mute state, and background boost', () => {
  // Default preferences start enabled for both incoming messages and connection requests
  assert.equal(DEFAULT_UI_SOUND_PREFERENCES.enabled, true);
  assert.equal(DEFAULT_UI_SOUND_PREFERENCES.incomingMessages, true);
  assert.equal(DEFAULT_UI_SOUND_PREFERENCES.connectionRequests, true);

  // Toggling flips enabled state cleanly
  const muted = toggleUiSoundEffects(DEFAULT_UI_SOUND_PREFERENCES);
  assert.equal(muted.enabled, false);
  const unmuted = toggleUiSoundEffects(muted);
  assert.equal(unmuted.enabled, true);

  // Incoming message from another user triggers soft fifth chime (528Hz -> 792Hz)
  const msgEval = shouldPlayUiNotificationSound({
    preferences: DEFAULT_UI_SOUND_PREFERENCES,
    eventType: 'incoming_message',
    senderUid: 'usr_peer_2',
    currentUid: 'usr_me_1',
    isAppInBackground: false,
  });
  assert.equal(msgEval.shouldPlay, true);
  assert.ok(msgEval.chime);
  assert.deepEqual(msgEval.chime.frequenciesHz, [528, 792]);

  // Incoming connection request from another user in background triggers boosted warm interval chime (440Hz -> 659.25Hz)
  const reqBgEval = shouldPlayUiNotificationSound({
    preferences: DEFAULT_UI_SOUND_PREFERENCES,
    eventType: 'connection_request',
    senderUid: 'usr_peer_3',
    currentUid: 'usr_me_1',
    isAppInBackground: true,
  });
  assert.equal(reqBgEval.shouldPlay, true);
  assert.ok(reqBgEval.chime);
  assert.deepEqual(reqBgEval.chime.frequenciesHz, [440, 659.25]);
  const fgSpec = getUiSoundChimeSpec('connection_request', false, 65);
  assert.ok(reqBgEval.chime.gainScalar > fgSpec.gainScalar);
  assert.ok(reqBgEval.chime.durationMs > fgSpec.durationMs);

  // Self-sent message or request never plays incoming chime
  const selfEval = shouldPlayUiNotificationSound({
    preferences: DEFAULT_UI_SOUND_PREFERENCES,
    eventType: 'incoming_message',
    senderUid: 'usr_me_1',
    currentUid: 'usr_me_1',
    isAppInBackground: true,
  });
  assert.equal(selfEval.shouldPlay, false);
  assert.equal(selfEval.chime, null);

  // When muted, neither incoming messages nor connection requests play sound
  const mutedMsgEval = shouldPlayUiNotificationSound({
    preferences: muted,
    eventType: 'incoming_message',
    senderUid: 'usr_peer_2',
    currentUid: 'usr_me_1',
    isAppInBackground: true,
  });
  assert.equal(mutedMsgEval.shouldPlay, false);
});

test('Weekly Activity Overview builds 7-day chronological productivity and points series and reflects live updates for today', () => {
  assert.equal(getPastDateKey('2026-10-20', 0), '2026-10-20');
  assert.equal(getPastDateKey('2026-10-20', 6), '2026-10-14');

  const storedHistory = {
    '2026-10-18': { focusMinutes: 135, pointsEarned: 90, targetMinutes: 120 },
    '2026-10-19': { focusMinutes: 95, pointsEarned: 60, targetMinutes: 120 },
  };

  const initialSummary = buildWeeklyActivityOverview({
    todayDateKey: '2026-10-20',
    todayFocusMinutes: 55,
    dailyTargetMinutes: 120,
    todayPointsEarned: 40,
    streakCount: 4,
    storedHistory,
  });

  assert.equal(initialSummary.days.length, 7);
  assert.equal(initialSummary.days[0].dateKey, '2026-10-14');
  assert.equal(initialSummary.days[4].dateKey, '2026-10-18');
  assert.equal(initialSummary.days[4].focusMinutes, 135);
  assert.equal(initialSummary.days[4].pointsEarned, 90);
  assert.equal(initialSummary.days[4].goalReached, true);

  const todayEntry = initialSummary.days[6];
  assert.equal(todayEntry.dateKey, '2026-10-20');
  assert.equal(todayEntry.isToday, true);
  assert.equal(todayEntry.focusMinutes, 55);
  assert.equal(todayEntry.pointsEarned, 40);
  assert.equal(todayEntry.goalReached, false);

  // Simulate logging +70m focus and +35 points today -> reaches 125m (goal reached!) and 75 pts
  const updatedSummary = buildWeeklyActivityOverview({
    todayDateKey: '2026-10-20',
    todayFocusMinutes: 125,
    dailyTargetMinutes: 120,
    todayPointsEarned: 75,
    streakCount: 4,
    storedHistory,
  });

  assert.equal(updatedSummary.days[6].focusMinutes, 125);
  assert.equal(updatedSummary.days[6].pointsEarned, 75);
  assert.equal(updatedSummary.days[6].goalReached, true);
  assert.equal(updatedSummary.totalFocusMinutes, initialSummary.totalFocusMinutes + 70);
  assert.equal(updatedSummary.totalPointsEarned, initialSummary.totalPointsEarned + 35);
});

test('Top Contributor badge is assigned strictly to the top 3 users on the Global Leaderboard', () => {
  const entries = aggregateGlobalLeaderboard(
    [
      [
        { uid: 'usr_1', displayName: 'Aarav', streakCount: 8, participationPoints: 400 },
        { uid: 'usr_2', displayName: 'Zoya', streakCount: 6, participationPoints: 340 },
        { uid: 'usr_3', displayName: 'Kabir', streakCount: 5, participationPoints: 260 },
        { uid: 'usr_4', displayName: 'Meera', streakCount: 3, participationPoints: 180 },
        { uid: 'usr_5', displayName: 'Rohan', streakCount: 1, participationPoints: 90 },
      ],
    ],
    'combined'
  );

  assert.equal(entries.length, 5);
  assert.equal(entries[0].rank, 1);
  assert.equal(entries[0].isTopContributor, true);
  assert.equal(entries[1].rank, 2);
  assert.equal(entries[1].isTopContributor, true);
  assert.equal(entries[2].rank, 3);
  assert.equal(entries[2].isTopContributor, true);
  assert.equal(entries[3].rank, 4);
  assert.equal(entries[3].isTopContributor, false);
  assert.equal(entries[4].rank, 5);
  assert.equal(entries[4].isTopContributor, false);

  const badge1 = getTopContributorBadge(1);
  assert.equal(badge1.isTopContributor, true);
  assert.equal(badge1.label, 'Top Contributor');
  assert.equal(badge1.tierName, 'Gold Podium');

  const badge2 = getTopContributorBadge(2);
  assert.equal(badge2.isTopContributor, true);
  assert.equal(badge2.label, 'Top Contributor');
  assert.equal(badge2.tierName, 'Silver Podium');

  const badge3 = getTopContributorBadge(3);
  assert.equal(badge3.isTopContributor, true);
  assert.equal(badge3.label, 'Top Contributor');
  assert.equal(badge3.tierName, 'Bronze Podium');

  const badge4 = getTopContributorBadge(4);
  assert.equal(badge4.isTopContributor, false);
  assert.equal(badge4.label, null);
  assert.equal(badge4.tierName, null);
});

test('Global Leaderboard trend calculation detects rising and falling rank movements compared to last update', () => {
  const previousEntries = aggregateGlobalLeaderboard(
    [
      [
        { uid: 'usr_1', displayName: 'Aarav', streakCount: 4, participationPoints: 220 },
        { uid: 'usr_2', displayName: 'Zoya', streakCount: 4, participationPoints: 200 },
        { uid: 'usr_3', displayName: 'Vikram', streakCount: 2, participationPoints: 120 },
      ],
    ],
    'combined'
  );

  const prevSnapshot = createLeaderboardSnapshot(previousEntries);
  assert.equal(prevSnapshot['usr_1'].rank, 1);
  assert.equal(prevSnapshot['usr_2'].rank, 2);

  // Now Zoya earns +50 participationPoints and 1 extra streak day, overtaking Aarav (#2 -> #1) while Aarav falls (#1 -> #2)
  const updatedEntries = aggregateGlobalLeaderboard(
    [
      [
        { uid: 'usr_1', displayName: 'Aarav', streakCount: 4, participationPoints: 220 },
        { uid: 'usr_2', displayName: 'Zoya', streakCount: 5, participationPoints: 250 },
        { uid: 'usr_3', displayName: 'Vikram', streakCount: 2, participationPoints: 120 },
      ],
    ],
    'combined'
  );

  const trends = computeLeaderboardTrends(updatedEntries, prevSnapshot);

  // Zoya rose from #2 to #1 -> green ('up') trend on both participationPoints and streakCount
  assert.equal(trends['usr_2'].rankTrend, 'up');
  assert.equal(trends['usr_2'].rankDelta, 1);
  assert.equal(trends['usr_2'].pointsTrend, 'up');
  assert.equal(trends['usr_2'].streakTrend, 'up');

  // Aarav fell from #1 to #2 -> red ('down') trend on both participationPoints and streakCount
  assert.equal(trends['usr_1'].rankTrend, 'down');
  assert.equal(trends['usr_1'].rankDelta, -1);
  assert.equal(trends['usr_1'].pointsTrend, 'down');
  assert.equal(trends['usr_1'].streakTrend, 'down');

  // Baseline previous snapshot produces immediate rising and falling indicators on initial load
  const baselineSnap = createBaselinePreviousSnapshot(updatedEntries);
  const initialTrends = computeLeaderboardTrends(updatedEntries, baselineSnap);
  assert.equal(initialTrends['usr_2'].pointsTrend, 'up');
  assert.equal(initialTrends['usr_2'].streakTrend, 'up');
  assert.equal(initialTrends['usr_1'].pointsTrend, 'down');
  assert.equal(initialTrends['usr_1'].streakTrend, 'down');
});

test('Global Leaderboard aggregates across sources, deduplicates by uid, filters ghost users, and sorts by combined, points, or streak', () => {
  const firestoreProfiles = [
    {
      uid: 'usr_alpha',
      displayName: 'Alpha Scholar',
      streakCount: 5,
      participationPoints: 200,
      privacyVisibility: 'everyone' as const,
    },
    {
      uid: 'usr_beta',
      displayName: 'Beta Builder',
      streakCount: 12,
      participationPoints: 140,
      privacyVisibility: 'everyone' as const,
    },
    {
      uid: 'usr_ghost',
      displayName: 'Hidden Ghost',
      streakCount: 99,
      participationPoints: 9999,
      privacyVisibility: 'ghost' as const,
    },
  ];

  const liveOnlinePeers = [
    {
      uid: 'usr_alpha',
      displayName: 'Alpha Scholar',
      streakCount: 5,
      participationPoints: 260, // earned 60 more points in real time
      isOnline: true,
      currentMode: 'study',
      privacyVisibility: 'everyone' as const,
    },
    {
      uid: 'usr_gamma',
      displayName: 'Gamma Gamer',
      streakCount: 2,
      participationPoints: 310,
      isOnline: true,
      currentMode: 'game_subway',
      privacyVisibility: 'everyone' as const,
    },
  ];

  assert.equal(computeLeaderboardCompositeScore(260, 5), 385);

  // 1. Combined sort: usr_beta (140 + 12*25 = 440), usr_alpha (260 + 5*25 = 385), usr_gamma (310 + 2*25 = 360)
  const combined = aggregateGlobalLeaderboard([firestoreProfiles, liveOnlinePeers], 'combined');
  assert.equal(combined.length, 3); // ghost filtered out, usr_alpha deduplicated
  assert.equal(combined[0].uid, 'usr_beta');
  assert.equal(combined[0].rank, 1);
  assert.equal(combined[0].compositeScore, 440);
  assert.equal(combined[1].uid, 'usr_alpha');
  assert.equal(combined[1].participationPoints, 260);
  assert.equal(combined[1].isOnline, true);

  // 2. Points sort: usr_gamma (310), usr_alpha (260), usr_beta (140)
  const byPoints = aggregateGlobalLeaderboard([firestoreProfiles, liveOnlinePeers], 'points');
  assert.equal(byPoints[0].uid, 'usr_gamma');
  assert.equal(byPoints[1].uid, 'usr_alpha');
  assert.equal(byPoints[2].uid, 'usr_beta');

  // 3. Streak sort: usr_beta (12d), usr_alpha (5d), usr_gamma (2d)
  const byStreak = aggregateGlobalLeaderboard([firestoreProfiles, liveOnlinePeers], 'streak');
  assert.equal(byStreak[0].uid, 'usr_beta');
  assert.equal(byStreak[0].streakCount, 12);
  assert.equal(byStreak[1].uid, 'usr_alpha');
  assert.equal(byStreak[2].uid, 'usr_gamma');
});

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
