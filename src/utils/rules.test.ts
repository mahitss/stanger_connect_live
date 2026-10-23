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
  DEFAULT_AMBIENT_WORKSPACE_STATE,
  AMBIENT_VOLUME_PRESETS,
  resolveAmbientProfileId,
  selectAmbientWorkspaceProfile,
  updateAmbientWorkspaceVolume,
  toggleAmbientWorkspaceMute,
  getEffectiveAmbientGain,
  formatAmbientWorkspaceStatus,
  computeProductivityGoalProgress,
  buildDailyGoalShareSummary,
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
  buildWeeklyActivityJsonExport,
  buildWeeklyActivityCsvExport,
  DEFAULT_UI_SOUND_PREFERENCES,
  toggleUiSoundEffects,
  isStudyRoomAllAudioMuted,
  toggleStudyRoomAllAudioMute,
  getUiSoundChimeSpec,
  shouldPlayUiNotificationSound,
  getOnlinePeerFocusStatus,
  summarizeOnlineDirectoryFocus,
  filterOnlinePeersByFocus,
  canUserCommentOnMoment,
  validateAndSanitizeMomentComment,
  groupMomentCommentsByMomentId,
  buildThreadedMomentComments,
  buildMomentCommentThreadGroups,
  toggleCollapsedCommentThread,
  resolveRootCommentIdForThread,
  getNestedThreadAnimationState,
  formatRelativeCommentTimestamp,
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
  MOOD_TREND_RANGE_OPTIONS,
  filterMoodTrendByRangeHours,
  computeMoodTrendPeakMarkers,
  buildMostPopularMoodPeakAnnotation,
  isMoodTrendPeakBucket,
  getMoodPeakHoverPulseSpec,
  computeMoodPairComparison,
  formatMoodTrendPointTooltip,
  escapeCsvCell,
  buildPersonalMoodHistoryLast24Hours,
  buildPersonalMoodHistoryCsv,
  buildMoodHistory24hCsv,
  computeUserMoodPopularitySpikeAlerts,
  buildMomentShareUrl,
  buildMomentSharePayload,
  buildStudyFocus7DaySessionTrend,
  CURATED_STUDY_MOMENT_IMAGES,
  getStudyMomentPlaceholderById,
  selectStudyMomentPlaceholder,
  resolveMomentPublishImageSource,
  MOMENT_LIGHTBOX_MIN_ZOOM,
  MOMENT_LIGHTBOX_MAX_ZOOM,
  MOMENT_LIGHTBOX_ZOOM_PRESETS,
  clampLightboxZoomScale,
  openMomentLightbox,
  updateMomentLightboxZoom,
  TWITTER_COMMUNITY_CHANNELS,
  deriveTwitterHandle,
  extractTweetHashtags,
  computeTrendingTwitterTopics,
  toggleTweetReaction,
  toggleFollowUser,
  filterTwitterFeedMoments,
  validateAndBuildTwitterChatMessage,
  CUSTOM_STUDY_DURATION_PRESETS,
  formatStudyTimerHMS,
  formatStudyDurationLabel,
  parseAndClampCustomStudyDuration,
  validateRealTimerStudyRecording,
  CURATED_STUDY_BOOKS,
  filterStudyBooks,
  validateAndCreateCustomStudyBook,
  updateBookStudyProgress,
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

  // 6h, 12h, and 24h date-range filter for the line chart
  assert.deepEqual(MOOD_TREND_RANGE_OPTIONS, [6, 12, 24]);
  const range24 = filterMoodTrendByRangeHours({
    trendBuckets: summary.trendBuckets,
    rangeHours: 24,
  });
  assert.equal(range24.xAxisLabel, 'Time (Last 24 Hours)');
  assert.deepEqual(
    range24.buckets.map((b) => b.label),
    ['-24h', '-20h', '-16h', '-12h', '-8h', '-4h', 'Now']
  );

  const range12 = filterMoodTrendByRangeHours({
    trendBuckets: summary.trendBuckets,
    rangeHours: 12,
  });
  assert.equal(range12.xAxisLabel, 'Time (Last 12 Hours)');
  assert.deepEqual(
    range12.buckets.map((b) => b.label),
    ['-12h', '-8h', '-4h', 'Now']
  );

  const range6 = filterMoodTrendByRangeHours({
    trendBuckets: summary.trendBuckets,
    rangeHours: 6,
  });
  assert.equal(range6.xAxisLabel, 'Time (Last 6 Hours)');
  assert.deepEqual(
    range6.buckets.map((b) => b.label),
    ['-6h', '-4h', 'Now']
  );

  // Dynamic peak popularity markers across the 24-hour period
  const peaks24 = computeMoodTrendPeakMarkers({
    top3Moods: summary.top3Moods,
    trendBuckets: summary.trendBuckets,
  });
  assert.equal(peaks24.length, 3);
  // Rank #1 Brainstorming reaches its 24h peak of 7 at bucket index 5 ('-4h', 2h ago check-ins + baseline)
  assert.equal(peaks24[0].mood, 'Brainstorming');
  assert.equal(peaks24[0].hasPeak, true);
  assert.equal(peaks24[0].isMostPopularMood, true);
  assert.equal(peaks24[0].peakCount, 7);
  assert.deepEqual(peaks24[0].peakBucketIndices, [5]);
  assert.equal(peaks24[0].primaryPeakBucketIndex, 5);
  assert.equal(peaks24[0].primaryPeakBucketLabel, '-4h');
  assert.equal(peaks24[0].annotationTitle, 'Most Popular: Brainstorming');
  assert.equal(
    peaks24[0].annotationLabel,
    'Most Popular: Brainstorming · Peak 7 (-4h)'
  );
  assert.match(
    peaks24[0].annotationSubtext,
    /^Peak 7 @ -4h \(\d{2}:\d{2}–\d{2}:\d{2} UTC\)$/
  );
  assert.match(
    peaks24[0].annotationContextSentence,
    /^Most popular mood: Brainstorming reached its peak of 7 check-ins at -4h \(\d{2}:\d{2}–\d{2}:\d{2} UTC\)$/
  );
  assert.equal(peaks24[1].isMostPopularMood, false);
  assert.equal(peaks24[1].annotationTitle, 'Deep Work');
  assert.ok(peaks24[1].annotationLabel.startsWith('Deep Work · Peak '));

  const primaryPopularAnnotation = buildMostPopularMoodPeakAnnotation(
    peaks24,
    []
  );
  assert.ok(primaryPopularAnnotation);
  assert.equal(primaryPopularAnnotation.mood, 'Brainstorming');
  assert.equal(primaryPopularAnnotation.isMostPopularMood, true);

  assert.match(peaks24[0].primaryPeakClockUtc, /^\d{2}:\d{2}–\d{2}:\d{2} UTC$/);
  assert.equal(isMoodTrendPeakBucket(peaks24, 0, 5), true);
  assert.equal(isMoodTrendPeakBucket(peaks24, 0, 0), false);

  // Tooltip reflects peak status when isPeak is true
  const peakTooltip = formatMoodTrendPointTooltip({
    moodStat: summary.top3Moods[0],
    bucket: summary.trendBuckets[5],
    isPeak: isMoodTrendPeakBucket(peaks24, 0, 5),
  });
  assert.equal(peakTooltip.isPeak, true);
  assert.equal(peakTooltip.peakBadgeLabel, 'PEAK');

  // Two-mood comparison view overlay & correlation/divergence metrics
  const cmpDefault = computeMoodPairComparison({
    items: summary.items,
    trendBuckets: summary.trendBuckets,
    moodA: 'Brainstorming',
    moodB: 'Deep Work',
  });
  assert.ok(cmpDefault);
  assert.equal(cmpDefault.moodAStat.mood, 'Brainstorming');
  assert.equal(cmpDefault.moodBStat.mood, 'Deep Work');
  assert.equal(cmpDefault.seriesA.length, 7);
  assert.equal(cmpDefault.seriesB.length, 7);
  assert.equal(cmpDefault.deltasByBucket.length, 7);
  assert.equal(cmpDefault.maxDivergenceBucket.label, '-4h');
  assert.ok(cmpDefault.maxDivergenceBucket.absDelta > 0);
  assert.ok(
    ['Correlated', 'Divergent', 'Independent'].includes(
      cmpDefault.relationshipType
    )
  );
  assert.ok(
    cmpDefault.summaryInsight.startsWith('Brainstorming vs Deep Work:')
  );

  // Passing identical moodA and moodB automatically resolves moodB to a distinct mood
  const cmpSame = computeMoodPairComparison({
    items: summary.items,
    trendBuckets: range6.buckets,
    moodA: 'Brainstorming',
    moodB: 'Brainstorming',
  });
  assert.ok(cmpSame);
  assert.equal(cmpSame.moodAStat.mood, 'Brainstorming');
  assert.notEqual(cmpSame.moodBStat.mood, 'Brainstorming');
  assert.equal(cmpSame.deltasByBucket.length, 3);
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

test('Moment Share URL and clipboard payload builder formats sanitized caption, author, and shareable moment link', () => {
  const url = buildMomentShareUrl('https://mrstranger.app/', 'moment_176000_usr_1');
  assert.equal(url, 'https://mrstranger.app/?moment=moment_176000_usr_1');

  const payload = buildMomentSharePayload({
    origin: 'http://localhost:3000/',
    momentId: 'moment_42_aarav',
    caption: 'Late night Rust kernel debugging session with coffee!',
    authorName: 'Aarav Mehta',
  });

  assert.equal(payload.momentId, 'moment_42_aarav');
  assert.equal(payload.url, 'http://localhost:3000/?moment=moment_42_aarav');
  assert.equal(payload.caption, 'Late night Rust kernel debugging session with coffee!');
  assert.equal(payload.authorName, 'Aarav Mehta');
  assert.equal(
    payload.clipboardText,
    '"Late night Rust kernel debugging session with coffee!" — Aarav Mehta\nhttp://localhost:3000/?moment=moment_42_aarav'
  );
});

test('User mood popularity spike alert badge notifies when a mood used today spikes and ignores moods not used by the user or flat low-activity moods', () => {
  const nowMs = 1_760_000_000_000;
  const thirtyMinsAgo = nowMs - 30 * 60 * 1000;
  const twoHoursAgo = nowMs - 2 * 60 * 60 * 1000;

  const summary = buildPopularMoodsLast24Hours({
    nowMs,
    onlinePeers: [
      { uid: 'usr_aarav', displayName: 'Aarav', mood: 'Deep Work' },
      { uid: 'usr_maya', displayName: 'Maya', mood: 'Deep Work' },
      { uid: 'usr_liam', displayName: 'Liam', mood: 'Deep Work' },
      { uid: 'usr_noah', displayName: 'Noah', mood: 'Brainstorming' },
    ],
    moodEvents: [
      { id: 'e1', uid: 'usr_aarav', mood: 'Deep Work', timestampMs: thirtyMinsAgo },
      { id: 'e2', uid: 'usr_maya', mood: 'Deep Work', timestampMs: thirtyMinsAgo },
      { id: 'e3', uid: 'usr_liam', mood: 'Deep Work', timestampMs: thirtyMinsAgo },
      { id: 'e4', uid: 'usr_zoya', mood: 'Deep Work', timestampMs: thirtyMinsAgo },
      { id: 'e5', uid: 'usr_kiran', mood: 'Deep Work', timestampMs: thirtyMinsAgo },
      { id: 'e6', uid: 'usr_aarav', mood: 'Coffee Break', timestampMs: twoHoursAgo },
    ],
  });

  // 1. User Aarav used 'Deep Work' and 'Coffee Break' today; 'Deep Work' spiked to 5 check-ins in the 'Now' window
  const alertForAarav = computeUserMoodPopularitySpikeAlerts({
    summary,
    currentUid: 'usr_aarav',
    currentDisplayName: 'Aarav',
    currentMood: 'Deep Work',
    moodEvents: [
      { id: 'e1', uid: 'usr_aarav', mood: 'Deep Work', timestampMs: thirtyMinsAgo },
      { id: 'e6', uid: 'usr_aarav', mood: 'Coffee Break', timestampMs: twoHoursAgo },
    ],
    nowMs,
  });

  assert.equal(alertForAarav.hasSpikeAlert, true);
  assert.ok(alertForAarav.userMoodsToday.includes('Deep Work'));
  assert.ok(alertForAarav.userMoodsToday.includes('Coffee Break'));
  assert.ok(alertForAarav.primaryAlert);
  assert.equal(alertForAarav.primaryAlert?.mood, 'Deep Work');
  assert.ok((alertForAarav.primaryAlert?.peakCount ?? 0) >= 5);
  assert.ok((alertForAarav.primaryAlert?.surgePercent ?? 0) >= 25);
  assert.ok(alertForAarav.primaryAlert?.badgeLabel.includes('Spike Alert · Deep Work'));
  assert.ok(alertForAarav.primaryAlert?.notificationMessage.includes('Deep Work'));

  // 2. Another user ('usr_solo') who only used 'Coffee Break' (which has only 1 check-in and did NOT spike) gets no false alert
  const alertForSoloUser = computeUserMoodPopularitySpikeAlerts({
    summary,
    currentUid: 'usr_solo',
    currentDisplayName: 'Solo User',
    currentMood: 'Coffee Break',
    moodEvents: [
      { id: 'e_solo', uid: 'usr_solo', mood: 'Coffee Break', timestampMs: twoHoursAgo },
    ],
    nowMs,
  });

  assert.equal(alertForSoloUser.hasSpikeAlert, false);
  assert.equal(alertForSoloUser.primaryAlert, null);
});

test('Peak popularity marker hover pulse spec activates gentle pulse on hovered peak markers and their parent trend line', () => {
  const hoveredPeakSpec = getMoodPeakHoverPulseSpec({
    isPeak: true,
    isPrimaryPeak: true,
    isHovered: true,
    isLineHoveredPeak: true,
    baseStrokeWidth: 2.5,
  });

  assert.equal(hoveredPeakSpec.isPulsingPeak, true);
  assert.equal(hoveredPeakSpec.isPulsingTrendLine, true);
  assert.equal(hoveredPeakSpec.pulseDuration, '1.6s');
  assert.ok(hoveredPeakSpec.pulseOuterRadiusTo > hoveredPeakSpec.pulseOuterRadiusFrom);
  assert.equal(hoveredPeakSpec.pulseOuterRadiusValues, '8.2;13.8;8.2');
  assert.equal(hoveredPeakSpec.lineStrokeWidthValues, '2.5;3.35;2.5');

  const unhoveredPeakSpec = getMoodPeakHoverPulseSpec({
    isPeak: true,
    isPrimaryPeak: true,
    isHovered: false,
    isLineHoveredPeak: false,
    baseStrokeWidth: 2.5,
  });
  assert.equal(unhoveredPeakSpec.isPulsingPeak, false);
  assert.equal(unhoveredPeakSpec.isPulsingTrendLine, false);

  const hoveredNonPeakSpec = getMoodPeakHoverPulseSpec({
    isPeak: false,
    isPrimaryPeak: false,
    isHovered: true,
    isLineHoveredPeak: false,
    baseStrokeWidth: 1.95,
  });
  assert.equal(hoveredNonPeakSpec.isPulsingPeak, false);
  assert.equal(hoveredNonPeakSpec.isPulsingTrendLine, false);
});

test('Weekly Activity Overview JSON export builds valid formatted JSON with 7-day entries and aggregate productivity metrics', () => {
  const nowMs = 1_761_000_000_000;
  const summary = buildWeeklyActivityOverview({
    todayDateKey: '2026-10-22',
    todayFocusMinutes: 135,
    dailyTargetMinutes: 120,
    todayPointsEarned: 95,
    streakCount: 6,
  });

  const exported = buildWeeklyActivityJsonExport({
    summary,
    dailyTargetMinutes: 120,
    nowMs,
  });

  assert.equal(exported.filename, 'weekly-activity-overview-2026-10-22.json');
  assert.equal(exported.dayCount, 7);

  const parsed = JSON.parse(exported.jsonContent);
  assert.equal(parsed.schemaVersion, '1.0');
  assert.equal(parsed.windowDays, 7);
  assert.equal(parsed.dailyTargetMinutes, 120);
  assert.equal(parsed.aggregates.totalFocusMinutes, summary.totalFocusMinutes);
  assert.equal(parsed.aggregates.totalPointsEarned, summary.totalPointsEarned);
  assert.equal(parsed.days.length, 7);
  assert.equal(parsed.days[6].dateKey, '2026-10-22');
  assert.equal(parsed.days[6].focusMinutes, 135);
});

test('Ambient Soundscapes panel toggles between Rain, Cafe, and White Noise profiles and adjusts personal workspace background volume', () => {
  const labels = AMBIENT_SOUNDSCAPES.map((s) => s.label);
  assert.ok(labels.includes('Rain'));
  assert.ok(labels.includes('Cafe'));
  assert.ok(labels.includes('White Noise'));
  assert.equal(AMBIENT_VOLUME_PRESETS.length, 4);

  assert.equal(resolveAmbientProfileId('Rain'), 'rainfall');
  assert.equal(resolveAmbientProfileId('Cafe'), 'coffeeshop');
  assert.equal(resolveAmbientProfileId('White Noise'), 'whitenoise');

  let state = DEFAULT_AMBIENT_WORKSPACE_STATE;
  assert.equal(state.activeProfile, 'off');
  assert.equal(state.volumePercent, 65);
  assert.equal(getEffectiveAmbientGain(state), 0);
  assert.equal(formatAmbientWorkspaceStatus(state), 'Standby · Background Volume 65%');

  // Toggle Rain on
  state = selectAmbientWorkspaceProfile(state, 'Rain');
  assert.equal(state.activeProfile, 'rainfall');
  assert.equal(getEffectiveAmbientGain(state), 0.65);
  assert.equal(
    formatAmbientWorkspaceStatus(state),
    'Playing: Rain · 65% Background Volume'
  );

  // Switch directly to Cafe
  state = selectAmbientWorkspaceProfile(state, 'Cafe');
  assert.equal(state.activeProfile, 'coffeeshop');
  assert.equal(
    formatAmbientWorkspaceStatus(state),
    'Playing: Cafe · 65% Background Volume'
  );

  // Adjust personal workspace background volume to 80%
  state = updateAmbientWorkspaceVolume(state, 80);
  assert.equal(state.volumePercent, 80);
  assert.equal(state.lastNonZeroVolumePercent, 80);
  assert.equal(getEffectiveAmbientGain(state), 0.8);
  assert.equal(
    formatAmbientWorkspaceStatus(state),
    'Playing: Cafe · 80% Background Volume'
  );

  // Mute and verify effective gain drops to 0 while remembering 80%
  state = toggleAmbientWorkspaceMute(state);
  assert.equal(state.isMuted, true);
  assert.equal(getEffectiveAmbientGain(state), 0);
  assert.equal(
    formatAmbientWorkspaceStatus(state),
    'Playing: Cafe (Muted · 0% Volume)'
  );

  // Selecting White Noise while muted restores last non-zero volume (80%)
  state = selectAmbientWorkspaceProfile(state, 'White Noise');
  assert.equal(state.activeProfile, 'whitenoise');
  assert.equal(state.isMuted, false);
  assert.equal(state.volumePercent, 80);
  assert.equal(
    formatAmbientWorkspaceStatus(state),
    'Playing: White Noise · 80% Background Volume'
  );

  // Clicking White Noise again toggles it off
  state = selectAmbientWorkspaceProfile(state, 'whitenoise');
  assert.equal(state.activeProfile, 'off');
  assert.equal(getEffectiveAmbientGain(state), 0);
});

test('Study Room 7-day focus session trend builds stacked individual sessions per day and tracks session growth', () => {
  const baseline = buildStudyFocus7DaySessionTrend({
    todayDateKey: '2026-10-22',
    todayFocusMinutes: 65,
    dailyTargetMinutes: 120,
    streakCount: 5,
    activeRoomCode: 'STUDY-GLOBAL',
  });

  assert.equal(baseline.days.length, 7);
  assert.ok(baseline.totalSessionsCount >= 14);
  assert.equal(baseline.days[6].dateKey, '2026-10-22');
  assert.equal(baseline.days[6].isToday, true);
  assert.equal(baseline.days[6].totalFocusMinutes, 65);

  // Verify each day's individual sessions stack cleanly to the day's totalFocusMinutes
  for (const day of baseline.days) {
    const sumOfSessions = day.sessions.reduce((acc, s) => acc + s.minutes, 0);
    assert.equal(sumOfSessions, day.totalFocusMinutes);
    day.sessions.forEach((sess, idx) => {
      if (idx === 0) {
        assert.equal(sess.startMinuteOffset, 0);
      } else {
        assert.equal(sess.startMinuteOffset, day.sessions[idx - 1].cumulativeDayMinutes);
      }
      assert.equal(sess.cumulativeDayMinutes, sess.startMinuteOffset + sess.minutes);
    });
  }

  // Logging a new 50-minute deep session on today updates today's sessions and 7-day total
  const updated = buildStudyFocus7DaySessionTrend({
    todayDateKey: '2026-10-22',
    todayFocusMinutes: 115,
    dailyTargetMinutes: 120,
    streakCount: 5,
    activeRoomCode: 'STUDY-GLOBAL',
    storedSessions: [
      {
        id: 'sess_today_deep_50',
        topic: 'Deep Work Synthesis (STUDY-GLOBAL)',
        roomCode: 'STUDY-GLOBAL',
        focusMinutes: 50,
        dateKey: '2026-10-22',
        createdAtMs: 1_761_100_000_000,
      },
    ],
  });

  assert.equal(updated.days[6].totalFocusMinutes, 115);
  assert.equal(updated.totalFocusMinutes, baseline.totalFocusMinutes + 50);
  const lastTodaySession =
    updated.days[6].sessions[updated.days[6].sessions.length - 1];
  assert.equal(lastTodaySession.minutes, 50);
  assert.equal(lastTodaySession.cumulativeDayMinutes, 115);
});

test('buildWeeklyActivityCsvExport formats 7-day weekly activity history into downloadable CSV with headers and progress percentages', () => {
  const summary = buildWeeklyActivityOverview({
    todayDateKey: '2026-10-22',
    todayFocusMinutes: 135,
    dailyTargetMinutes: 120,
    todayPointsEarned: 95,
    streakCount: 6,
  });

  const exported = buildWeeklyActivityCsvExport({
    summary,
    dailyTargetMinutes: 120,
    nowMs: 1_761_100_000_000,
  });

  assert.equal(exported.filename, 'weekly-activity-overview-2026-10-22.csv');
  assert.equal(exported.rowCount, 7);
  assert.deepEqual(exported.headers, [
    'Date',
    'Day',
    'Short Date',
    'Focus Minutes',
    'Daily Target Minutes',
    'Goal Progress (%)',
    'Goal Reached',
    'Points Earned',
    'Is Today',
  ]);

  const lines = exported.csvContent.split('\n');
  assert.equal(lines.length, 8);
  assert.equal(
    lines[0],
    'Date,Day,Short Date,Focus Minutes,Daily Target Minutes,Goal Progress (%),Goal Reached,Points Earned,Is Today'
  );
  // Check today's row (index 7 in lines, i.e., 2026-10-22 with 135 mins / 120 target = 113%)
  assert.ok(lines[7].startsWith('2026-10-22,'));
  assert.ok(lines[7].includes(',135,120,113,Yes,95,Yes'));
});

test('StudyRoomView quick mute/unmute all sounds button toggles both system UI sound effects and ambient soundscapes simultaneously', () => {
  const activeAmbient = {
    ...DEFAULT_AMBIENT_WORKSPACE_STATE,
    activeProfile: 'rainfall' as const,
    volumePercent: 75,
    isMuted: false,
    lastNonZeroVolumePercent: 75,
  };
  const activeUiPrefs = {
    ...DEFAULT_UI_SOUND_PREFERENCES,
    enabled: true,
  };

  assert.equal(isStudyRoomAllAudioMuted(activeAmbient, activeUiPrefs), false);

  // 1. Clicking Mute All Sounds mutes both ambient workspace audio and system UI sound effects
  const mutedResult = toggleStudyRoomAllAudioMute({
    ambientState: activeAmbient,
    uiSoundPrefs: activeUiPrefs,
  });
  assert.equal(mutedResult.isAllMuted, true);
  assert.equal(mutedResult.ambientState.isMuted, true);
  assert.equal(mutedResult.ambientState.lastNonZeroVolumePercent, 75);
  assert.equal(getEffectiveAmbientGain(mutedResult.ambientState), 0);
  assert.equal(mutedResult.uiSoundPrefs.enabled, false);
  assert.equal(mutedResult.statusLabel, 'All System & Ambient Sounds Muted');
  assert.equal(
    isStudyRoomAllAudioMuted(mutedResult.ambientState, mutedResult.uiSoundPrefs),
    true
  );

  // 2. Clicking Unmute All Sounds restores both system UI sound effects and the preserved ambient volume (75%)
  const unmutedResult = toggleStudyRoomAllAudioMute({
    ambientState: mutedResult.ambientState,
    uiSoundPrefs: mutedResult.uiSoundPrefs,
  });
  assert.equal(unmutedResult.isAllMuted, false);
  assert.equal(unmutedResult.ambientState.isMuted, false);
  assert.equal(unmutedResult.ambientState.volumePercent, 75);
  assert.equal(getEffectiveAmbientGain(unmutedResult.ambientState), 0.75);
  assert.equal(unmutedResult.uiSoundPrefs.enabled, true);
  assert.equal(unmutedResult.statusLabel, 'System & Ambient Sounds Active');
});

test('buildDailyGoalShareSummary generates sharable summary of progress, completion percentage, and streak for Moment feed post', () => {
  const inProgressSummary = buildDailyGoalShareSummary({
    displayName: 'Alex Rivera',
    completedMinutes: 90,
    targetMinutes: 120,
    streakCount: 5,
    participationPoints: 420,
    dateKey: '2026-10-22',
    visibility: 'public',
  });

  assert.equal(inProgressSummary.progressPercent, 75);
  assert.equal(inProgressSummary.completedMinutes, 90);
  assert.equal(inProgressSummary.targetMinutes, 120);
  assert.equal(inProgressSummary.remainingMinutes, 30);
  assert.equal(inProgressSummary.isGoalReached, false);
  assert.equal(inProgressSummary.streakCount, 5);
  assert.equal(inProgressSummary.headline, '75% Daily Goal Complete · 5-Day Streak');
  assert.ok(inProgressSummary.caption.includes('75% complete'));
  assert.ok(inProgressSummary.caption.includes('90/120 mins'));
  assert.ok(inProgressSummary.caption.includes('5-day active streak'));
  assert.ok(inProgressSummary.photoDataUrl.startsWith('data:image/svg+xml;charset=utf-8,'));
  assert.ok(decodeURIComponent(inProgressSummary.photoDataUrl).includes('75%'));

  const reachedSummary = buildDailyGoalShareSummary({
    displayName: 'Alex Rivera',
    completedMinutes: 135,
    targetMinutes: 120,
    streakCount: 6,
    participationPoints: 500,
    dateKey: '2026-10-22',
  });
  assert.equal(reachedSummary.progressPercent, 100);
  assert.equal(reachedSummary.isGoalReached, true);
  assert.ok(reachedSummary.caption.includes('100% complete'));
  assert.ok(reachedSummary.caption.includes('Daily Goal Reached'));
});

test('formatRelativeCommentTimestamp formats Moment comment timestamps as relative time (e.g., 5m ago, 2h ago) instead of HH:MM', () => {
  const now = 1_761_140_000_000;

  assert.equal(formatRelativeCommentTimestamp(now, now), 'just now');
  assert.equal(formatRelativeCommentTimestamp(now - 5_000, now), 'just now');
  assert.equal(formatRelativeCommentTimestamp(now - 25_000, now), '25s ago');
  assert.equal(formatRelativeCommentTimestamp(now - 5 * 60_000, now), '5m ago');
  assert.equal(formatRelativeCommentTimestamp(now - 42 * 60_000, now), '42m ago');
  assert.equal(formatRelativeCommentTimestamp(now - 2 * 3_600_000, now), '2h ago');
  assert.equal(formatRelativeCommentTimestamp(now - 14 * 3_600_000, now), '14h ago');
  assert.equal(formatRelativeCommentTimestamp(now - 3 * 86_400_000, now), '3d ago');
  assert.equal(formatRelativeCommentTimestamp(now - 14 * 86_400_000, now), '2w ago');
  assert.equal(formatRelativeCommentTimestamp(NaN, now), 'just now');
  assert.equal(formatRelativeCommentTimestamp(now + 10_000, now), 'just now');
});

test('buildThreadedMomentComments organizes nested replies beneath parent comments with depth and reply metadata', () => {
  const comments = [
    {
      id: 'c_root_1',
      momentId: 'm_1',
      momentAuthorUid: 'usr_alex',
      authorUid: 'usr_maya',
      authorName: 'Maya Lin',
      text: 'Great consistency on the 5-day study streak!',
      visibility: 'public' as const,
      createdAtMs: 1_000,
    },
    {
      id: 'c_root_2',
      momentId: 'm_1',
      momentAuthorUid: 'usr_alex',
      authorUid: 'usr_aarav',
      authorName: 'Aarav Mehta',
      text: 'Joining STUDY-GLOBAL now for a 50m Pomodoro.',
      visibility: 'public' as const,
      createdAtMs: 2_000,
    },
    {
      id: 'c_reply_1a',
      momentId: 'm_1',
      momentAuthorUid: 'usr_alex',
      authorUid: 'usr_alex',
      authorName: 'Alex Rivera',
      text: 'Thanks Maya! Pushing for 120m today.',
      visibility: 'public' as const,
      createdAtMs: 3_000,
      parentCommentId: 'c_root_1',
      replyToAuthorName: 'Maya Lin',
    },
    {
      id: 'c_reply_1b_nested',
      momentId: 'm_1',
      momentAuthorUid: 'usr_alex',
      authorUid: 'usr_maya',
      authorName: 'Maya Lin',
      text: 'You got this! See you in the study room.',
      visibility: 'public' as const,
      createdAtMs: 4_000,
      parentCommentId: 'c_reply_1a',
    },
  ];

  const threaded = buildThreadedMomentComments(comments);
  assert.equal(threaded.length, 4);

  // Order should be: c_root_1 (depth 0) -> c_reply_1a (depth 1) -> c_reply_1b_nested (depth 2) -> c_root_2 (depth 0)
  assert.deepEqual(
    threaded.map((t) => ({
      id: t.comment.id,
      depth: t.depth,
      isReply: t.isReply,
      parentCommentId: t.parentCommentId,
      replyToAuthorName: t.replyToAuthorName,
      replyCount: t.replyCount,
    })),
    [
      {
        id: 'c_root_1',
        depth: 0,
        isReply: false,
        parentCommentId: null,
        replyToAuthorName: null,
        replyCount: 1,
      },
      {
        id: 'c_reply_1a',
        depth: 1,
        isReply: true,
        parentCommentId: 'c_root_1',
        replyToAuthorName: 'Maya Lin',
        replyCount: 1,
      },
      {
        id: 'c_reply_1b_nested',
        depth: 2,
        isReply: true,
        parentCommentId: 'c_reply_1a',
        replyToAuthorName: 'Alex Rivera',
        replyCount: 0,
      },
      {
        id: 'c_root_2',
        depth: 0,
        isReply: false,
        parentCommentId: null,
        replyToAuthorName: null,
        replyCount: 0,
      },
    ]
  );
});

test('buildMomentCommentThreadGroups, toggleCollapsedCommentThread, and getNestedThreadAnimationState manage nested reply thread expand/collapse and slide-in animation state', () => {
  const comments = [
    {
      id: 'c_root_1',
      momentId: 'm_1',
      momentAuthorUid: 'usr_alex',
      authorUid: 'usr_maya',
      authorName: 'Maya Lin',
      text: 'Great consistency on the 5-day study streak!',
      visibility: 'public' as const,
      createdAtMs: 1_000,
    },
    {
      id: 'c_root_2',
      momentId: 'm_1',
      momentAuthorUid: 'usr_alex',
      authorUid: 'usr_aarav',
      authorName: 'Aarav Mehta',
      text: 'Joining STUDY-GLOBAL now for a 50m Pomodoro.',
      visibility: 'public' as const,
      createdAtMs: 2_000,
    },
    {
      id: 'c_reply_1a',
      momentId: 'm_1',
      momentAuthorUid: 'usr_alex',
      authorUid: 'usr_alex',
      authorName: 'Alex Rivera',
      text: 'Thanks Maya! Pushing for 120m today.',
      visibility: 'public' as const,
      createdAtMs: 3_000,
      parentCommentId: 'c_root_1',
      replyToAuthorName: 'Maya Lin',
    },
    {
      id: 'c_reply_1b_nested',
      momentId: 'm_1',
      momentAuthorUid: 'usr_alex',
      authorUid: 'usr_maya',
      authorName: 'Maya Lin',
      text: 'You got this! See you in the study room.',
      visibility: 'public' as const,
      createdAtMs: 4_000,
      parentCommentId: 'c_reply_1a',
    },
  ];

  // 1. Initially all threads are expanded
  let collapsedIds: string[] = [];
  let groups = buildMomentCommentThreadGroups(comments, collapsedIds);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].rootItem.comment.id, 'c_root_1');
  assert.equal(groups[0].totalRepliesCount, 2);
  assert.equal(groups[0].isCollapsed, false);
  assert.deepEqual(
    groups[0].nestedReplies.map((r) => r.comment.id),
    ['c_reply_1a', 'c_reply_1b_nested']
  );
  assert.equal(groups[1].rootItem.comment.id, 'c_root_2');
  assert.equal(groups[1].totalRepliesCount, 0);
  assert.equal(groups[1].isCollapsed, false);

  // 2. Animation state when expanded uses slide-in class and staggered delay
  const expandedAnim0 = getNestedThreadAnimationState(false, 0);
  assert.equal(expandedAnim0.state, 'expanded');
  assert.equal(expandedAnim0.wrapperClassName, 'moment-thread-collapse-grid');
  assert.equal(expandedAnim0.itemAnimationClassName, 'moment-thread-slide-in');
  assert.equal(expandedAnim0.staggerDelayMs, 0);
  assert.equal(expandedAnim0.ariaExpanded, true);
  assert.equal(expandedAnim0.formatToggleLabel(2), 'Hide 2 replies');
  assert.equal(expandedAnim0.formatToggleLabel(1), 'Hide 1 reply');

  const expandedAnim2 = getNestedThreadAnimationState(false, 2);
  assert.equal(expandedAnim2.staggerDelayMs, 50);

  // 3. Toggling c_root_1 collapses its nested replies and switches to slide-out state
  collapsedIds = toggleCollapsedCommentThread(collapsedIds, 'c_root_1');
  assert.deepEqual(collapsedIds, ['c_root_1']);
  groups = buildMomentCommentThreadGroups(comments, collapsedIds);
  assert.equal(groups[0].isCollapsed, true);

  const collapsedAnim = getNestedThreadAnimationState(true, 1);
  assert.equal(collapsedAnim.state, 'collapsed');
  assert.equal(collapsedAnim.itemAnimationClassName, 'moment-thread-slide-out');
  assert.equal(collapsedAnim.staggerDelayMs, 0);
  assert.equal(collapsedAnim.ariaExpanded, false);
  assert.equal(collapsedAnim.formatToggleLabel(2), 'Show 2 replies');
  assert.equal(collapsedAnim.formatToggleLabel(1), 'Show 1 reply');

  // 4. Toggling c_root_1 again expands it back
  collapsedIds = toggleCollapsedCommentThread(collapsedIds, 'c_root_1');
  assert.deepEqual(collapsedIds, []);

  // 5. Resolving root thread ID from a deeply nested reply returns the root comment ID
  assert.equal(resolveRootCommentIdForThread(comments, 'c_reply_1b_nested'), 'c_root_1');
  assert.equal(resolveRootCommentIdForThread(comments, 'c_root_1'), 'c_root_1');
});

test('Curated study-related aesthetic placeholder images provide valid SVG data URLs, toggle selection, and resolve moment publish image priority', () => {
  assert.equal(CURATED_STUDY_MOMENT_IMAGES.length, 6);
  for (const preset of CURATED_STUDY_MOMENT_IMAGES) {
    assert.ok(preset.id.length > 0);
    assert.ok(preset.title.length > 0);
    assert.ok(preset.category.length > 0);
    assert.ok(preset.suggestedCaption.length > 0);
    assert.ok(preset.photoDataUrl.startsWith('data:image/svg+xml;charset=utf-8,'));
    assert.ok(decodeURIComponent(preset.photoDataUrl).includes('<svg'));
  }

  // Lookup by ID (case-insensitive)
  const rainy = getStudyMomentPlaceholderById('RAINY_WINDOW_LOFI');
  assert.ok(rainy);
  assert.equal(rainy.id, 'rainy_window_lofi');
  assert.equal(rainy.title, 'Rainy Window Study Nook');
  assert.equal(getStudyMomentPlaceholderById('non_existent'), null);

  // Toggling selection selects, switches, and deselects cleanly
  let selectedId = selectStudyMomentPlaceholder(null, 'midnight_desk');
  assert.equal(selectedId, 'midnight_desk');
  selectedId = selectStudyMomentPlaceholder(selectedId, 'library_stacks');
  assert.equal(selectedId, 'library_stacks');
  selectedId = selectStudyMomentPlaceholder(selectedId, 'library_stacks');
  assert.equal(selectedId, null);

  // Resolution priority: uploadedPhotoDataUrl > selectedPlaceholderId > fallbackGenerator
  const fromUpload = resolveMomentPublishImageSource({
    uploadedPhotoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
    selectedPlaceholderId: 'midnight_desk',
    fallbackGenerator: () => 'data:image/svg+xml;utf8,fallback',
  });
  assert.equal(fromUpload.sourceType, 'uploaded');
  assert.equal(fromUpload.photoDataUrl, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==');
  assert.equal(fromUpload.placeholder, null);

  const fromPlaceholder = resolveMomentPublishImageSource({
    uploadedPhotoDataUrl: '',
    selectedPlaceholderId: 'whiteboard_systems',
    fallbackGenerator: () => 'data:image/svg+xml;utf8,fallback',
  });
  assert.equal(fromPlaceholder.sourceType, 'placeholder');
  assert.equal(fromPlaceholder.placeholder?.id, 'whiteboard_systems');
  assert.equal(
    fromPlaceholder.photoDataUrl,
    getStudyMomentPlaceholderById('whiteboard_systems')?.photoDataUrl
  );

  const fromFallback = resolveMomentPublishImageSource({
    uploadedPhotoDataUrl: '',
    selectedPlaceholderId: null,
    fallbackGenerator: () => 'data:image/svg+xml;utf8,custom_fallback',
  });
  assert.equal(fromFallback.sourceType, 'fallback');
  assert.equal(fromFallback.photoDataUrl, 'data:image/svg+xml;utf8,custom_fallback');
});

test('Full-screen Moment image lightbox zoom state opens at 100%, increments/decrements, toggles 200% zoom, and clamps within bounds', () => {
  assert.equal(clampLightboxZoomScale(0.2), MOMENT_LIGHTBOX_MIN_ZOOM);
  assert.equal(clampLightboxZoomScale(5.5), MOMENT_LIGHTBOX_MAX_ZOOM);
  assert.deepEqual(MOMENT_LIGHTBOX_ZOOM_PRESETS, [1, 1.5, 2, 2.5, 3]);

  let lb = openMomentLightbox({
    momentId: 'moment_101',
    photoDataUrl: CURATED_STUDY_MOMENT_IMAGES[0].photoDataUrl,
    caption: 'Late-night systems programming block.',
    authorName: 'Alex Rivera',
    visibility: 'public',
  });

  assert.equal(lb.isOpen, true);
  assert.equal(lb.momentId, 'moment_101');
  assert.equal(lb.zoomScale, 1);
  assert.equal(lb.zoomPercent, 100);
  assert.equal(lb.isZoomed, false);
  assert.equal(lb.canZoomOut, false);
  assert.equal(lb.canZoomIn, true);

  // Zoom in (+50% -> 150%)
  lb = updateMomentLightboxZoom(lb, 'in');
  assert.equal(lb.zoomScale, 1.5);
  assert.equal(lb.zoomPercent, 150);
  assert.equal(lb.isZoomed, true);
  assert.equal(lb.canZoomOut, true);
  assert.equal(lb.canZoomIn, true);

  // Set explicit 3x preset (300%)
  lb = updateMomentLightboxZoom(lb, 3);
  assert.equal(lb.zoomScale, 3);
  assert.equal(lb.zoomPercent, 300);
  assert.equal(lb.canZoomIn, false);
  assert.equal(lb.canZoomOut, true);

  // Reset returns to 100%
  lb = updateMomentLightboxZoom(lb, 'reset');
  assert.equal(lb.zoomScale, 1);
  assert.equal(lb.zoomPercent, 100);
  assert.equal(lb.isZoomed, false);

  // Clicking image toggles between 100% and 200%
  lb = updateMomentLightboxZoom(lb, 'toggle');
  assert.equal(lb.zoomScale, 2);
  assert.equal(lb.zoomPercent, 200);
  assert.equal(lb.isZoomed, true);

  lb = updateMomentLightboxZoom(lb, 'toggle');
  assert.equal(lb.zoomScale, 1);
  assert.equal(lb.zoomPercent, 100);
  assert.equal(lb.isZoomed, false);
});

test('Twitter social section helpers derive handles, extract hashtags, rank trending topics, toggle reactions/follows, filter feeds, and validate Twitter chat', () => {
  // 1. Twitter handle derivation
  assert.equal(deriveTwitterHandle('Mahit Saxena', 'usr_1'), '@mahit_saxena');
  assert.equal(deriveTwitterHandle('  A  ', 'usr_99'), '@usr99');

  // 2. Hashtag extraction (deduplicated, case-insensitive)
  const tags = extractTweetHashtags(
    'Shipping distributed consensus today! #DeepWork #RustLang #deepwork #SystemsDesign'
  );
  assert.deepEqual(tags, ['#DeepWork', '#RustLang', '#SystemsDesign']);

  // 3. Trending topics computation
  const trends = computeTrendingTwitterTopics(
    [
      { caption: 'Working on #RustLang and #DeepWork' },
      { caption: 'Another sprint on #RustLang' },
    ],
    [{ text: 'Loving #RustLang performance!' }]
  );
  assert.ok(trends.length >= 5);
  assert.equal(trends[0].tag, '#DeepWork');
  assert.equal(trends[0].tweetCount, 49);
  assert.equal(trends[0].isLive, true);

  // 4. Like / Retweet / Bookmark reaction toggling
  let likesMap: Record<string, string[]> = {};
  let r1 = toggleTweetReaction(likesMap, 'moment_1', 'usr_alice');
  assert.equal(r1.active, true);
  assert.equal(r1.count, 1);
  likesMap = r1.updatedMap;

  let r2 = toggleTweetReaction(likesMap, 'moment_1', 'usr_bob');
  assert.equal(r2.active, true);
  assert.equal(r2.count, 2);
  likesMap = r2.updatedMap;

  // Alice unlikes
  let r3 = toggleTweetReaction(likesMap, 'moment_1', 'usr_alice');
  assert.equal(r3.active, false);
  assert.equal(r3.count, 1);

  // 5. Follow / Unfollow user toggling (blocks self-follow)
  const selfFollow = toggleFollowUser([], 'usr_alice', 'usr_alice');
  assert.equal(selfFollow.isFollowing, false);
  const followBob = toggleFollowUser([], 'usr_bob', 'usr_alice');
  assert.equal(followBob.isFollowing, true);
  assert.deepEqual(followBob.updatedFollows, ['usr_bob']);
  const unfollowBob = toggleFollowUser(followBob.updatedFollows, 'usr_bob', 'usr_alice');
  assert.equal(unfollowBob.isFollowing, false);
  assert.deepEqual(unfollowBob.updatedFollows, []);

  // 6. Twitter feed filtering (all, following,bookmarks, liked, hashtag, searchQuery)
  const sampleMoments = [
    {
      id: 'm_1',
      authorUid: 'usr_alice',
      authorName: 'Alice Vance',
      caption: 'Building Raft replication #SystemsDesign',
      visibility: 'public' as const,
    },
    {
      id: 'm_2',
      authorUid: 'usr_bob',
      authorName: 'Bob Chen',
      caption: 'Late night Pomodoro block #DeepWork',
      visibility: 'connections' as const,
    },
    {
      id: 'm_3',
      authorUid: 'usr_charlie',
      authorName: 'Charlie Patel',
      caption: 'Morning coffee and notes #StudyWithMe',
      visibility: 'public' as const,
    },
  ];

  const followingFeed = filterTwitterFeedMoments({
    moments: sampleMoments,
    filter: 'following',
    currentUid: 'usr_alice',
    followedUids: ['usr_bob'],
  });
  assert.deepEqual(
    followingFeed.map((m) => m.id),
    ['m_1', 'm_2']
  );

  const hashtagFeed = filterTwitterFeedMoments({
    moments: sampleMoments,
    filter: 'all',
    currentUid: 'usr_alice',
    activeHashtag: '#deepwork',
  });
  assert.deepEqual(
    hashtagFeed.map((m) => m.id),
    ['m_2']
  );

  const searchFeed = filterTwitterFeedMoments({
    moments: sampleMoments,
    filter: 'all',
    currentUid: 'usr_alice',
    searchQuery: '@charlie_patel',
  });
  assert.deepEqual(
    searchFeed.map((m) => m.id),
    ['m_3']
  );

  const bookmarkedFeed = filterTwitterFeedMoments({
    moments: sampleMoments,
    filter: 'bookmarks',
    currentUid: 'usr_alice',
    bookmarkedByMomentId: { m_3: ['usr_alice'] },
  });
  assert.deepEqual(
    bookmarkedFeed.map((m) => m.id),
    ['m_3']
  );

  // 7. Twitter chat message validation and creation
  assert.ok(TWITTER_COMMUNITY_CHANNELS.length >= 3);
  const badChat = validateAndBuildTwitterChatMessage({
    channelId: 'global_townsquare',
    senderUid: 'usr_alice',
    senderName: 'Alice Vance',
    rawText: '   ',
  });
  assert.equal(badChat.valid, false);

  const xssChat = validateAndBuildTwitterChatMessage({
    channelId: 'global_townsquare',
    senderUid: 'usr_alice',
    senderName: 'Alice Vance',
    rawText: '<script>alert(1)</script>',
  });
  assert.equal(xssChat.valid, false);

  const goodChat = validateAndBuildTwitterChatMessage({
    channelId: 'global_townsquare',
    senderUid: 'usr_alice',
    senderName: 'Alice Vance',
    rawText: 'Hey Twitter fam! Sharing my study setup photo.',
    photoDataUrl: CURATED_STUDY_MOMENT_IMAGES[0].photoDataUrl,
    nowMs: 1_761_200_000_000,
  });
  assert.equal(goodChat.valid, true);
  assert.ok(goodChat.message);
  assert.equal(goodChat.message.senderHandle, '@alice_vance');
  assert.equal(goodChat.message.channelId, 'global_townsquare');
  assert.equal(goodChat.message.photoDataUrl, CURATED_STUDY_MOMENT_IMAGES[0].photoDataUrl);
});

test('Study Mode custom duration controls and H:MM:SS timer formatting support arbitrary hours and minutes (e.g. 2:00:00 and 3:00:00)', () => {
  assert.equal(formatStudyTimerHMS(7200, true), '2:00:00');
  assert.equal(formatStudyTimerHMS(10800, true), '3:00:00');
  assert.equal(formatStudyTimerHMS(1500, true), '0:25:00');
  assert.equal(formatStudyTimerHMS(1500, false), '25:00');
  assert.equal(formatStudyDurationLabel(120), '2h 00m (120m)');
  assert.equal(formatStudyDurationLabel(180), '3h 00m (180m)');
  assert.equal(formatStudyDurationLabel(45), '45m');

  const twoHours = parseAndClampCustomStudyDuration({ hours: 2, minutes: 0 });
  assert.equal(twoHours.totalMinutes, 120);
  assert.equal(twoHours.totalSeconds, 7200);
  assert.equal(twoHours.formattedTargetHMS, '2:00:00');
  assert.equal(twoHours.formattedLabel, '2h 00m (120m)');

  const threeHours = parseAndClampCustomStudyDuration({ hours: 3, minutes: 0 });
  assert.equal(threeHours.totalMinutes, 180);
  assert.equal(threeHours.totalSeconds, 10800);
  assert.equal(threeHours.formattedTargetHMS, '3:00:00');
  assert.equal(threeHours.formattedLabel, '3h 00m (180m)');

  assert.ok(CUSTOM_STUDY_DURATION_PRESETS.some((p) => p.minutes === 120 && p.hmsLabel === '2:00:00'));
  assert.ok(CUSTOM_STUDY_DURATION_PRESETS.some((p) => p.minutes === 180 && p.hmsLabel === '3:00:00'));
});

test('Strict Real-Timer Study Recording blocks inflating 2 hours (2:00:00) into 3 hours (3:00:00) unless timer reaches 3:00:00', () => {
  // 1. Timer at 0:00:00 -> cannot record anything without running the timer
  const zeroCheck = validateRealTimerStudyRecording({
    actualElapsedSeconds: 0,
    claimedMinutes: 60,
  });
  assert.equal(zeroCheck.allowed, false);
  assert.equal(zeroCheck.status, 'rejected_inflation');
  assert.equal(zeroCheck.verifiedSeconds, 0);

  // 2. User studied 2 hours (7200 seconds = 2:00:00) and tries to claim 3 hours (180m = 10800s = 3:00:00)
  const inflatedCheck = validateRealTimerStudyRecording({
    actualElapsedSeconds: 7200, // 2:00:00 real elapsed
    claimedMinutes: 180, // 3:00:00 claimed
  });
  assert.equal(inflatedCheck.allowed, false);
  assert.equal(inflatedCheck.status, 'rejected_inflation');
  assert.equal(inflatedCheck.actualElapsedFormattedHMS, '2:00:00');
  assert.equal(inflatedCheck.claimedFormattedHMS, '3:00:00');
  assert.equal(inflatedCheck.deficitFormattedHMS, '1:00:00');
  assert.equal(inflatedCheck.verifiedMinutes, 120); // Only 2 hours is verified, never 3 hours
  assert.ok(inflatedCheck.reason.includes('2:00:00'));
  assert.ok(inflatedCheck.reason.includes('3:00:00'));

  // 3. User records the real 2 hours (2:00:00) conducted on the timer -> allowed!
  const realTwoHourRecord = validateRealTimerStudyRecording({
    actualElapsedSeconds: 7200,
    claimedMinutes: 120,
  });
  assert.equal(realTwoHourRecord.allowed, true);
  assert.equal(realTwoHourRecord.status, 'verified');
  assert.equal(realTwoHourRecord.verifiedSeconds, 7200);
  assert.equal(realTwoHourRecord.verifiedMinutes, 120);
  assert.equal(realTwoHourRecord.verifiedFormattedHMS, '2:00:00');

  // 4. Timer continues running until 3:00:00 (10800s) -> now 3:00:00 is verified!
  const realThreeHourRecord = validateRealTimerStudyRecording({
    actualElapsedSeconds: 10800,
    alreadyRecordedSeconds: 0,
    claimedMinutes: 180,
  });
  assert.equal(realThreeHourRecord.allowed, true);
  assert.equal(realThreeHourRecord.status, 'verified');
  assert.equal(realThreeHourRecord.verifiedSeconds, 10800);
  assert.equal(realThreeHourRecord.verifiedMinutes, 180);
  assert.equal(realThreeHourRecord.verifiedFormattedHMS, '3:00:00');
});

test('Study Books Library provides curated academic books, category/search filtering, custom book creation, and timer-verified book progress', () => {
  assert.ok(CURATED_STUDY_BOOKS.length >= 10);

  const csBooks = filterStudyBooks({
    books: CURATED_STUDY_BOOKS,
    category: 'Computer Science',
  });
  assert.ok(csBooks.length >= 2);
  assert.ok(csBooks.some((b) => b.id === 'book_clrs'));

  const searchRaft = filterStudyBooks({
    books: CURATED_STUDY_BOOKS,
    searchQuery: 'Linearizability',
  });
  assert.equal(searchRaft.length, 1);
  assert.equal(searchRaft[0].id, 'book_ddia');

  // Custom book creation & XSS guard
  const badBook = validateAndCreateCustomStudyBook({
    title: '<script>alert(1)</script>',
    author: 'Attacker',
  });
  assert.equal(badBook.valid, false);

  const customBookRes = validateAndCreateCustomStudyBook({
    title: 'Operating Systems: Three Easy Pieces',
    author: 'Remzi & Andrea Arpaci-Dusseau',
    category: 'Computer Science',
    totalPages: 710,
    recommendedMinutes: 120,
    firstChapterTitle: 'Virtualization of the CPU',
    firstChapterNotes: 'Direct execution and context switching mechanisms.',
    nowMs: 1_761_300_000_000,
  });
  assert.equal(customBookRes.valid, true);
  assert.ok(customBookRes.book);
  assert.equal(customBookRes.book.title, 'Operating Systems: Three Easy Pieces');
  assert.equal(customBookRes.book.recommendedMinutes, 120);

  // Book progress tracking with real timer seconds
  const ddia = CURATED_STUDY_BOOKS[0];
  const prog1 = updateBookStudyProgress({
    progressMap: {},
    book: ddia,
    currentPage: 154,
    toggleChapterNumber: 1,
    verifiedSecondsToAdd: 7200, // 2 hours verified
    personalNotes: 'Completed Chapter 1 tail latency notes.',
    nowMs: 1_761_300_000_000,
  });
  assert.equal(prog1.record.currentPage, 154);
  assert.deepEqual(prog1.record.completedChapterNumbers, [1]);
  assert.equal(prog1.record.verifiedSecondsStudied, 7200);
  assert.ok(prog1.completionPercent >= 25);
});




