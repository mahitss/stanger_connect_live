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
  normalizeStudyTopicName,
  buildWeeklyProductivityDistribution,
  APP_LOGO_URL,
  APP_BRAND_NAME,
  ONLINE_MOOD_PRESETS,
  normalizeAndValidatePeerMood,
  getOnlinePeerMoodMeta,
  summarizeOnlineDirectoryMoods,
  filterOnlinePeersByDirectoryCriteria,
  MOOD_POPULARITY_WINDOW_MS,
  buildPopularMoodsLast24Hours,
  isMoodTrendLineVisible,
  toggleMoodTrendLineVisibility,
  getVisibleTop3Moods,
  formatMoodTrendPointTooltip,
  escapeCsvCell,
  buildPersonalMoodHistoryLast24Hours,
  buildPersonalMoodHistoryCsv,
  buildMoodHistory24hCsv,
} from './rules.ts';

test('Personal 24-hour mood history CSV export filters strictly to current user, excludes stale >24h events, reconciles live mood, and escapes CSV cells', () => {
  const nowMs = 1_760_000_000_000;
  const twoHoursAgo = nowMs - 2 * 60 * 60 * 1000;
  const fiveHoursAgo = nowMs - 5 * 60 * 60 * 1000;
  const expiredMs = nowMs - (MOOD_POPULARITY_WINDOW_MS + 120_000);

  const csvExport = buildPersonalMoodHistoryCsv({
    currentUid: 'usr_aarav',
    currentDisplayName: 'Aarav Mehta',
    currentMood: 'Deep Work',
    nowMs,
    moodEvents: [
      {
        id: 'ev_aarav_1',
        uid: 'usr_aarav',
        displayName: 'Aarav Mehta',
        mood: 'Brainstorming',
        timestampMs: twoHoursAgo,
      },
      {
        id: 'ev_aarav_2',
        uid: 'usr_aarav',
        displayName: 'Aarav Mehta',
        mood: 'Quick Questions',
        timestampMs: fiveHoursAgo,
      },
      {
        id: 'ev_other_peer',
        uid: 'usr_maya',
        displayName: 'Maya Lin',
        mood: 'Pair Programming',
        timestampMs: twoHoursAgo,
      },
      {
        id: 'ev_aarav_expired',
        uid: 'usr_aarav',
        displayName: 'Aarav Mehta',
        mood: 'Coffee Break',
        timestampMs: expiredMs,
      },
    ],
  });

  // Includes current live mood ('Deep Work') + 2 recent check-ins ('Brainstorming', 'Quick Questions'),
  // and excludes Maya's event and Aarav's expired >24h Coffee Break event
  assert.equal(csvExport.rowCount, 3);
  assert.deepEqual(
    csvExport.entries.map((e) => e.mood),
    ['Deep Work', 'Brainstorming', 'Quick Questions']
  );
  assert.equal(csvExport.entries[0].source, 'live-status');
  assert.equal(csvExport.entries[1].source, 'check-in');
  assert.equal(csvExport.entries[1].relativeTimeLabel, '2h ago');
  assert.match(csvExport.filename, /^my-mood-history-24h-\d{4}-\d{2}-\d{2}\.csv$/);

  const lines = csvExport.csvContent.split('\n');
  assert.equal(lines.length, 4); // 1 header + 3 data rows
  assert.equal(
    lines[0],
    'Timestamp (ISO),Relative Time,User ID,Display Name,Mood,Category Description,Source'
  );
  assert.ok(lines[1].includes('usr_aarav,Aarav Mehta,Deep Work'));
  assert.ok(lines[2].includes('usr_aarav,Aarav Mehta,Brainstorming'));
  assert.ok(!csvExport.csvContent.includes('usr_maya'));
  assert.ok(!csvExport.csvContent.includes('Coffee Break'));

  // Verify CSV escaping & formula injection protection
  assert.equal(escapeCsvCell('Reviewing, "PRs"'), '"Reviewing, ""PRs"""');
  assert.equal(escapeCsvCell('=CMD()'), "'=CMD()");
});

test('Online Directory 24-hour popular moods summary ranks moods, filters out stale >24h events, and reconciles live online peers', () => {
  const nowMs = 1_760_000_000_000;
  const recentMs = nowMs - 2 * 60 * 60 * 1000; // 2 hours ago
  const expiredMs = nowMs - (MOOD_POPULARITY_WINDOW_MS + 60_000); // > 24h ago

  const summary = buildPopularMoodsLast24Hours({
    nowMs,
    onlinePeers: [
      { uid: 'usr_aarav', displayName: 'Aarav', mood: 'Deep Work' },
      { uid: 'usr_maya', displayName: 'Maya', mood: 'Brainstorming' },
      { uid: 'usr_rohan', displayName: 'Rohan', mood: 'Brainstorming' },
    ],
    moodEvents: [
      {
        id: 'ev_1',
        uid: 'usr_maya',
        mood: 'Brainstorming',
        timestampMs: recentMs,
      },
      {
        id: 'ev_2',
        uid: 'usr_rohan',
        mood: 'Brainstorming',
        timestampMs: recentMs + 1000,
      },
      {
        id: 'ev_3',
        uid: 'usr_priya',
        mood: 'Brainstorming',
        timestampMs: recentMs + 2000,
      },
      {
        id: 'ev_4',
        uid: 'usr_aarav',
        mood: 'Quick Questions',
        timestampMs: recentMs + 3000,
      },
      {
        id: 'ev_expired',
        uid: 'usr_old',
        mood: 'Coffee Break',
        timestampMs: expiredMs,
      },
    ],
  });

  assert.equal(summary.windowHours, 24);
  assert.equal(summary.topMood, 'Brainstorming');
  assert.equal(summary.topMoodCount, 3);
  assert.equal(summary.uniqueActivePeers24h, 4); // Aarav, Maya, Rohan, Priya
  assert.equal(summary.items[0].mood, 'Brainstorming');
  assert.equal(summary.items[0].activePeersNow, 2); // Maya & Rohan currently online with Brainstorming
  assert.equal(summary.items[0].uniquePeers24h, 3); // Maya, Rohan, Priya
  assert.equal(summary.items[0].isTopMood, true);

  // Expired event (>24h ago) for Coffee Break is excluded
  const coffeeItem = summary.items.find((i) => i.mood === 'Coffee Break');
  assert.ok(coffeeItem);
  assert.equal(coffeeItem.usageCount24h, 0);

  // Top 3 moods fluctuation line chart series & axis metadata
  assert.equal(summary.top3Moods.length, 3);
  assert.equal(summary.top3Moods[0].mood, 'Brainstorming');
  assert.equal(summary.top3Moods[1].mood, 'Deep Work');
  assert.equal(summary.top3Moods[2].mood, 'Quick Questions');
  assert.equal(summary.xAxisLabel, 'Time (Last 24 Hours)');
  assert.equal(summary.yAxisLabel, 'Peer Mood Activity');
  assert.equal(summary.trendBuckets.length, 7);
  assert.deepEqual(
    summary.trendBuckets.map((b) => b.label),
    ['-24h', '-20h', '-16h', '-12h', '-8h', '-4h', 'Now']
  );
  // Bucket 5 ('-4h', covering 4h-1h ago) includes the 3 Brainstorming events at recentMs (2h ago)
  assert.ok(summary.trendBuckets[5].rank1Value >= 3);
  // Bucket 6 ('Now') reflects the top 3 moods' current values
  assert.equal(summary.trendBuckets[6].rank1Value, 3);
  assert.equal(summary.trendBuckets[6].rank2Value, 1);
  assert.equal(summary.trendBuckets[6].rank3Value, 1);
  assert.ok(summary.trendMaxValue >= 4);

  // Data point hover tooltip formatting with exact mood count and timestamp
  const tooltipNow = formatMoodTrendPointTooltip({
    moodStat: summary.top3Moods[0],
    bucket: summary.trendBuckets[6],
  });
  assert.equal(tooltipNow.mood, 'Brainstorming');
  assert.equal(tooltipNow.rank, 1);
  assert.equal(tooltipNow.exactCount, 3);
  assert.equal(tooltipNow.countLabel, '3 mood check-ins');
  assert.match(
    tooltipNow.timestampLabel,
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}–\d{2}:\d{2} UTC \(Now\)$/
  );

  const tooltipSingle = formatMoodTrendPointTooltip({
    moodStat: summary.top3Moods[1],
    bucket: summary.trendBuckets[6],
  });
  assert.equal(tooltipSingle.exactCount, 1);
  assert.equal(tooltipSingle.countLabel, '1 mood check-in');

  // Clickable legend visibility toggling for individual mood trend lines
  let hidden: string[] = [];
  assert.equal(isMoodTrendLineVisible(hidden, 'Deep Work'), true);
  hidden = toggleMoodTrendLineVisibility(hidden, 'Deep Work');
  assert.equal(isMoodTrendLineVisible(hidden, 'Deep Work'), false);
  assert.equal(isMoodTrendLineVisible(hidden, 'Brainstorming'), true);

  const visibleMoods = getVisibleTop3Moods(summary.top3Moods, hidden);
  assert.equal(visibleMoods.length, 2);
  assert.deepEqual(
    visibleMoods.map((m) => m.mood),
    ['Brainstorming', 'Quick Questions']
  );

  // Toggling again restores visibility
  hidden = toggleMoodTrendLineVisibility(hidden, 'deep work');
  assert.equal(isMoodTrendLineVisible(hidden, 'Deep Work'), true);
  assert.equal(getVisibleTop3Moods(summary.top3Moods, hidden).length, 3);

  // Full 24-hour mood history CSV export
  const summaryCsv = buildMoodHistory24hCsv({ summary, nowMs });
  assert.match(summaryCsv.filename, /^mood-history-24h-\d{4}-\d{2}-\d{2}\.csv$/);
  assert.equal(summaryCsv.rowCount, summary.items.length);
  const csvRows = summaryCsv.csvContent.split('\n');
  assert.equal(csvRows.length, summary.items.length + 1);
  assert.ok(
    csvRows[0].startsWith(
      'Rank,Mood,Category Description,24h Check-Ins,Live Active Peers,Unique Peers (24h),Share (%),Top 24h Mood,Bucket -24h'
    )
  );
  assert.ok(csvRows[1].startsWith('1,Brainstorming,'));
});

test('Online Directory Mood indicator validates presets, custom moods, security guards, summaries, and filters', () => {
  // 1. Presets include Deep Work, Brainstorming, Quick Questions
  const presetLabels = ONLINE_MOOD_PRESETS.map((p) => p.label);
  assert.ok(presetLabels.includes('Deep Work'));
  assert.ok(presetLabels.includes('Brainstorming'));
  assert.ok(presetLabels.includes('Quick Questions'));

  // 2. Canonicalizes preset case & validates custom mood
  const deepWorkCheck = normalizeAndValidatePeerMood('  deep work  ');
  assert.equal(deepWorkCheck.valid, true);
  assert.equal(deepWorkCheck.mood, 'Deep Work');

  const customCheck = normalizeAndValidatePeerMood('Reviewing PRs');
  assert.equal(customCheck.valid, true);
  assert.equal(customCheck.mood, 'Reviewing PRs');

  const emptyCheck = normalizeAndValidatePeerMood('   ');
  assert.equal(emptyCheck.valid, true);
  assert.equal(emptyCheck.mood, null);

  // 3. Blocks overly long or malicious mood inputs
  assert.equal(normalizeAndValidatePeerMood('x'.repeat(37)).valid, false);
  assert.equal(normalizeAndValidatePeerMood('<script>alert(1)</script>').valid, false);

  // 4. Mood metadata lookup & directory summary
  const metaBrainstorm = getOnlinePeerMoodMeta('Brainstorming');
  assert.equal(metaBrainstorm.hasMood, true);
  assert.equal(metaBrainstorm.label, 'Brainstorming');
  assert.equal(metaBrainstorm.tone, 'amber');
  assert.equal(metaBrainstorm.isPreset, true);

  const peers = [
    { uid: 'usr_1', currentMode: 'study', mood: 'Deep Work' },
    { uid: 'usr_2', currentMode: 'hub', mood: 'Brainstorming' },
    { uid: 'usr_3', currentMode: 'hub', mood: 'Quick Questions' },
    { uid: 'usr_4', currentMode: 'hub', mood: null },
  ];

  const summary = summarizeOnlineDirectoryMoods(peers);
  assert.equal(summary.activeMoodCount, 3);
  assert.equal(summary.countsByMood['Deep Work'], 1);
  assert.equal(summary.countsByMood['Brainstorming'], 1);
  assert.equal(summary.countsByMood['Quick Questions'], 1);

  // 5. Filtering by mood and focus criteria
  const brainstormPeers = filterOnlinePeersByDirectoryCriteria(peers, [], {
    moodFilter: 'Brainstorming',
  });
  assert.equal(brainstormPeers.length, 1);
  assert.equal(brainstormPeers[0].uid, 'usr_2');

  const focusAndDeepWork = filterOnlinePeersByDirectoryCriteria(peers, [], {
    onlyInFocus: true,
    moodFilter: 'Deep Work',
  });
  assert.equal(focusAndDeepWork.length, 1);
  assert.equal(focusAndDeepWork[0].uid, 'usr_1');
});

test('App and website logo asset constant points to uploaded Mr. Stranger logo', () => {
  assert.equal(APP_LOGO_URL, '/assets/aistudio/image_18838782.png');
  assert.equal(APP_BRAND_NAME, 'Mr. Stranger');
});

test('Weekly Productivity Distribution aggregates focus sessions by Study Room topic, reconciles weekly focus total, and updates live when new sessions are logged', () => {
  assert.equal(normalizeStudyTopicName('   '), 'Deep Work & Problem Solving');
  assert.equal(
    normalizeStudyTopicName('  Distributed Systems & Consensus  '),
    'Distributed Systems & Consensus'
  );

  // 1. Baseline 7-day breakdown reconciles with totalWeeklyFocusMinutes
  const baseline = buildWeeklyProductivityDistribution({
    todayDateKey: '2026-10-20',
    totalWeeklyFocusMinutes: 500,
    storedSessions: [],
    studyNotes: [],
  });
  assert.equal(baseline.topics.length, 5);
  assert.equal(baseline.totalFocusMinutes, 500);
  assert.equal(baseline.topTopic, 'Distributed Systems & Consensus');
  assert.ok(baseline.topTopicMinutes > 0);
  assert.ok(baseline.topTopicSharePercent > 0);

  // 2. Logging explicit sessions for a topic boosts that topic's focusMinutes, sessionsCount, and rank
  const updated = buildWeeklyProductivityDistribution({
    todayDateKey: '2026-10-20',
    totalWeeklyFocusMinutes: 550,
    storedSessions: [
      {
        id: 'sess_1',
        topic: 'Rust & Compiler Engineering',
        roomCode: 'STUDY-RUST',
        focusMinutes: 240,
        dateKey: '2026-10-20',
        createdAtMs: 1000,
        authorUid: 'usr_aarav',
      },
      {
        id: 'sess_2',
        topic: 'Rust & Compiler Engineering',
        roomCode: 'STUDY-RUST',
        focusMinutes: 60,
        dateKey: '2026-10-19',
        createdAtMs: 2000,
        authorUid: 'usr_aarav',
      },
    ],
    currentUid: 'usr_aarav',
  });

  assert.equal(updated.topTopic, 'Rust & Compiler Engineering');
  assert.ok(updated.topTopicMinutes >= 300);
  const rustTopic = updated.topics.find(
    (t) => t.topic === 'Rust & Compiler Engineering'
  );
  assert.ok(rustTopic);
  assert.ok(rustTopic.sessionsCount >= 2);
});

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
