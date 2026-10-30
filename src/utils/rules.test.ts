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
  resolveQuickFocusDeskSoundTrigger,
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
  ONLINE_MOOD_CATEGORIES,
  ONLINE_MOOD_PRESETS,
  groupOnlineMoodPresetsByCategory,
  parseOnlineDirectoryMoodFilterSelection,
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
  DEFAULT_APP_THEME,
  THEME_STORAGE_KEY,
  resolveInitialThemeMode,
  toggleAppThemeMode,
  getThemeSwitcherMeta,
  AMBIENT_TRACK_IDS,
  AMBIENT_MIX_PRESETS,
  DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE,
  toggleAmbientLayer,
  updateAmbientLayerVolume,
  updateAmbientMasterVolume,
  toggleAmbientMasterMute,
  stopAllAmbientLayers,
  applyAmbientMixPreset,
  getActiveAmbientLayers,
  getEffectiveAmbientLayerGain,
  getEffectiveAmbientMixMap,
  formatAmbientMultiLayerStatus,
  USER_BADGE_DEFINITIONS,
  computeConsecutiveGoalDays,
  countUserHelpfulNotes,
  evaluateUserBadges,
  recordConsecutiveGoalHitDay,
  validateAndBuildHelpfulNoteContribution,
  STREAK_FREEZE_COST_POINTS,
  MAX_STREAK_FREEZES_OWNED,
  evaluateStreakFreezeStatus,
  purchaseStreakFreeze,
  spendPointsToFreezeMissedDay,
  simulateMissedDayStreakEvaluation,
  DEFAULT_STREAK_REMINDER_TIME,
  STREAK_REMINDER_TIME_PRESETS,
  DEFAULT_STREAK_REMINDER_PREFERENCES,
  parseReminderTimeMinutes,
  evaluateStreakFocusReminder,
  detectNewlyUnlockedBadgeIds,
  getBadgeEntranceMotionSpec,
  QUICK_START_POMODORO_MINUTES,
  QUICK_START_PARTICIPATION_POINTS,
  applyQuickStartPomodoroBlock,
  buildConnectionRequestStatusMap,
  resolveOnlineDirectoryPeerDmShortcut,
  getProductivityProgressMotionSpec,
  toggleOnlineDirectoryAudienceFilter,
  clearOnlineDirectoryAudienceFilter,
  getQuickFilterClearButtonMotionSpec,
  getQuickFilterToggleHoverMotionSpec,
  getQuickFilterIconCrossFadeSpec,
  getQuickFilterIconHoverGlowSpec,
  getQuickFilterIconPulseSpec,
  getQuickFilterBreathPulseSpec,
  getQuickFilterIconActiveBadgeSpec,
  resolveQuickFilterToggleChime,
  getQuickFilterResetFlashBounceSpec,
  resolveZeroPeersMoodFilterNotice,
  getOnlineDirectoryClearFilterModalMeta,
  resolveOnlineDirectoryFilterToggleAction,
  confirmOnlineDirectoryClearFilterReset,
  resolveShiftResetToastConfirmation,
  RESET_ONLY_BUTTON_POP_DURATION_MS,
  getResetOnlyButtonBouncePopSpec,
  resolveSecondaryResetOnlyFilterAction,
  getDedicatedClearFiltersExitAnimationSpec,
  getDedicatedClearFiltersButtonMotionSpec,
  resolveClearFiltersButtonChime,
  getDedicatedClearFiltersTooltipMeta,
  resolveDedicatedClearFiltersButtonAction,
  isClearFiltersKeyboardShortcutEvent,
  resolveClearFiltersKeyboardShortcutAction,
  evaluateSecondaryComplexFilterClearModalMeta,
  resolveSecondaryComplexFilterClearGateAction,
  confirmSecondaryComplexFilterClearAllReset,
  MAX_PINNED_DIRECTORY_FILTER_CHIPS,
  PINNED_DIRECTORY_FILTERS_STORAGE_KEY,
  saveDirectoryFilterConfigurationAsPinnedChip,
  removePinnedDirectoryFilterChip,
  applyPinnedDirectoryFilterChip,
  evaluatePinnedDirectoryFiltersMeta,
  FIRST_MATCHING_PEER_AUTO_SCROLL_HIGHLIGHT_MS,
  evaluateFirstMatchingPeerAutoScrollMeta,
  shouldTriggerFirstMatchingPeerAutoScroll,
  getOnlineDirectoryQuickFilterMeta,
  QUICK_FILTER_SHARE_LINK_CHECKMARK_DURATION_MS,
  getQuickFilterShareLinkCheckmarkAnimationSpec,
  buildOnlineDirectoryFilterShareLink,
  parseOnlineDirectoryFilterShareParams,
  toggleMoodCategoryDrawerExpanded,
  DEFAULT_MOOD_CATEGORY_DRAWER_EXPANSION_MAP,
  evaluateMoodCategoryDrawersToggleState,
  toggleAllMoodCategoryDrawers,
  toggleSingleMoodCategoryDrawer,
  MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS,
  RECENT_DIRECTORY_FILTERS_STORAGE_KEY,
  DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS,
  buildDirectoryFilterCombinationEntry,
  recordRecentDirectoryFilterCombination,
  applyRecentDirectoryFilterCombination,
  removeRecentDirectoryFilterCombination,
  getQuickFilterHistoryIconButtonSpec,
  getRecentDirectoryFiltersDropdownMeta,
  evaluateRecentlyAppliedDirectoryFilterMeta,
  isMoodFilterInRecentDirectoryFilters,
  getMoodCategoryExpansionMotionSpec,
  getWorkspaceSidebarScrollSpec,
  getMoodPresetTooltipMeta,
  getMoodPresetUsageCount24hMeta,
  buildMoodPresetUsageCounts24hMap,
  MR_STRANGER_COMMUNITY_IMPACT_STATS,
  MR_STRANGER_STUDY_PILLARS,
  MR_STRANGER_MINDFULNESS_EXERCISES,
  MR_STRANGER_247_STUDY_ROOMS,
  buildMrStrangerStudyTogetherLobby,
  resolveStudyTogetherQuickJoinAction,
  filterMoodCategoryGroupsBySearchQuery,
  getOnlineDirectoryPeerFilterLayoutAnimationSpec,
  WORKSPACE_HEADER_SHARE_FEEDBACK_DURATION_MS,
  resolveWorkspaceHeaderShareUrl,
  getWorkspaceHeaderShareButtonMeta,
  WORKSPACE_HEADER_QR_QUIET_ZONE,
  WORKSPACE_HEADER_QR_PNG_FEEDBACK_DURATION_MS,
  WORKSPACE_HEADER_QR_PNG_PIXEL_SCALE,
  buildWorkspaceHeaderQrPngFilename,
  generateWorkspaceHeaderQrPngDataUrl,
  generateWorkspaceUrlQrMatrix,
  getWorkspaceHeaderQrCodeMeta,
  buildWorkspaceCameraConstraints,
  parseScannedWorkspaceQrPayload,
  renderWorkspaceQrMatrixToRgba,
  decodeWorkspaceQrFromRgbaFrame,
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

test('Theme switcher defaults strictly to dark mode, toggles cleanly between dark and light, and computes accessible Tailwind theme metadata', () => {
  assert.equal(DEFAULT_APP_THEME, 'dark');
  assert.equal(THEME_STORAGE_KEY, 'mr_stranger_theme_v1');

  // Defaults to dark for null, undefined, empty, or unrecognized strings
  assert.equal(resolveInitialThemeMode(null), 'dark');
  assert.equal(resolveInitialThemeMode(undefined), 'dark');
  assert.equal(resolveInitialThemeMode(''), 'dark');
  assert.equal(resolveInitialThemeMode('invalid_theme'), 'dark');
  assert.equal(resolveInitialThemeMode('DARK'), 'dark');
  assert.equal(resolveInitialThemeMode('light'), 'light');
  assert.equal(resolveInitialThemeMode('  LIGHT  '), 'light');

  // Toggling between dark and light
  let current = resolveInitialThemeMode(null);
  assert.equal(current, 'dark');

  const darkMeta = getThemeSwitcherMeta(current);
  assert.equal(darkMeta.currentTheme, 'dark');
  assert.equal(darkMeta.nextTheme, 'light');
  assert.equal(darkMeta.isDark, true);
  assert.equal(darkMeta.isLight, false);
  assert.equal(darkMeta.buttonLabel, 'Light Mode');
  assert.ok(darkMeta.rootClassName.includes('dark'));

  current = toggleAppThemeMode(current);
  assert.equal(current, 'light');

  const lightMeta = getThemeSwitcherMeta(current);
  assert.equal(lightMeta.currentTheme, 'light');
  assert.equal(lightMeta.nextTheme, 'dark');
  assert.equal(lightMeta.isDark, false);
  assert.equal(lightMeta.isLight, true);
  assert.equal(lightMeta.buttonLabel, 'Dark Mode');
  assert.ok(lightMeta.rootClassName.includes('light'));

  current = toggleAppThemeMode(current);
  assert.equal(current, 'dark');
});

test('Multi-layer ambient soundscape mixer overlays multiple soundscapes simultaneously with independent individual volume controls and focus mix presets', () => {
  assert.equal(AMBIENT_TRACK_IDS.length, 5);
  assert.ok(AMBIENT_MIX_PRESETS.length >= 4);

  let mix = DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE;
  assert.equal(getActiveAmbientLayers(mix).length, 0);
  assert.equal(
    formatAmbientMultiLayerStatus(mix),
    'Standby · 0 Layers Active · Master 75%'
  );

  // Enable Rainfall + Coffee Shop + White Noise simultaneously
  mix = toggleAmbientLayer(mix, 'rainfall');
  mix = toggleAmbientLayer(mix, 'coffeeshop');
  mix = toggleAmbientLayer(mix, 'whitenoise');

  const active3 = getActiveAmbientLayers(mix);
  assert.equal(active3.length, 3);
  assert.deepEqual(
    active3.map((l) => l.id),
    ['rainfall', 'coffeeshop', 'whitenoise']
  );
  assert.ok(
    formatAmbientMultiLayerStatus(mix).includes(
      'Overlaying 3 Layers: Rain (70%) + Cafe (55%) + White Noise (45%)'
    )
  );

  // Adjust individual volume of Coffee Shop to 80% and White Noise to 30% without affecting Rainfall
  mix = updateAmbientLayerVolume(mix, 'coffeeshop', 80);
  mix = updateAmbientLayerVolume(mix, 'whitenoise', 30);
  assert.equal(mix.layers.rainfall.volumePercent, 70);
  assert.equal(mix.layers.coffeeshop.volumePercent, 80);
  assert.equal(mix.layers.whitenoise.volumePercent, 30);

  // Verify effective per-layer gains scale by master volume (75%)
  assert.equal(getEffectiveAmbientLayerGain(mix, 'rainfall'), Number((0.75 * 0.7).toFixed(4)));
  assert.equal(getEffectiveAmbientLayerGain(mix, 'coffeeshop'), Number((0.75 * 0.8).toFixed(4)));
  assert.equal(getEffectiveAmbientLayerGain(mix, 'whitenoise'), Number((0.75 * 0.3).toFixed(4)));
  assert.equal(getEffectiveAmbientLayerGain(mix, 'binaural'), 0);

  // Setting an inactive layer's individual volume > 0 automatically enables it in the overlay
  mix = updateAmbientLayerVolume(mix, 'lofi', 65);
  assert.equal(mix.layers.lofi.enabled, true);
  assert.equal(getActiveAmbientLayers(mix).length, 4);

  // Setting a layer's individual volume to 0% disables only that layer while keeping the other 3 active
  mix = updateAmbientLayerVolume(mix, 'whitenoise', 0);
  assert.equal(mix.layers.whitenoise.enabled, false);
  assert.equal(getActiveAmbientLayers(mix).length, 3);

  // Apply a curated multi-layer focus mix preset ("rainy_cafe")
  mix = applyAmbientMixPreset(mix, 'rainy_cafe');
  const activePresetLayers = getActiveAmbientLayers(mix);
  assert.equal(activePresetLayers.length, 2);
  assert.equal(mix.layers.rainfall.enabled, true);
  assert.equal(mix.layers.rainfall.volumePercent, 70);
  assert.equal(mix.layers.coffeeshop.enabled, true);
  assert.equal(mix.layers.coffeeshop.volumePercent, 55);
  assert.equal(mix.layers.lofi.enabled, false);

  // Master mute zeroes effective gains while preserving active layer configuration
  mix = toggleAmbientMasterMute(mix);
  assert.equal(mix.isMasterMuted, true);
  const mutedMap = getEffectiveAmbientMixMap(mix);
  assert.equal(mutedMap.rainfall, 0);
  assert.equal(mutedMap.coffeeshop, 0);

  // Unmuting restores gains
  mix = toggleAmbientMasterMute(mix);
  assert.equal(mix.isMasterMuted, false);
  assert.ok(getEffectiveAmbientLayerGain(mix, 'rainfall') > 0);

  // Update master volume to 100%
  mix = updateAmbientMasterVolume(mix, 100);
  assert.equal(getEffectiveAmbientLayerGain(mix, 'rainfall'), 0.7);
  assert.equal(getEffectiveAmbientLayerGain(mix, 'coffeeshop'), 0.55);

  // Stop all layers returns to Standby while preserving individual layer volume memories
  mix = stopAllAmbientLayers(mix);
  assert.equal(getActiveAmbientLayers(mix).length, 0);
  assert.equal(mix.layers.rainfall.volumePercent, 70);
});

test('Badges system rewards users for completing 5-day streaks, hitting productivity goals 3 days in a row, and contributing helpful notes, and attaches badges to Leaderboard entries', () => {
  assert.equal(USER_BADGE_DEFINITIONS.length, 3);
  assert.deepEqual(
    USER_BADGE_DEFINITIONS.map((b) => b.id),
    ['streak_5_day', 'goal_3_day', 'helpful_notes']
  );

  // 1. Consecutive goal days calculation
  const consec0 = computeConsecutiveGoalDays([
    { goalReached: true },
    { goalReached: false },
    { goalReached: true },
    { goalReached: true },
    { goalReached: false },
  ]);
  assert.equal(consec0.maxConsecutiveDays, 2);
  assert.equal(consec0.currentConsecutiveDays, 0);

  const consec3 = computeConsecutiveGoalDays([
    { goalReached: false },
    { goalReached: true },
    { goalReached: true },
    { goalReached: true },
  ]);
  assert.equal(consec3.maxConsecutiveDays, 3);
  assert.equal(consec3.currentConsecutiveDays, 3);

  // 2. Helpful notes counting per user
  const sampleNotes = [
    { authorUid: 'usr_1', positiveNote: 'Raft log replication invariants explained.' },
    { authorUid: 'usr_2', positiveNote: 'DP state transitions.' },
    { authorUid: 'usr_1', positiveNote: '   ' }, // empty note ignored
    { authorUid: 'usr_1', positiveNote: 'Linearizability vs serializability summary.' },
  ];
  assert.equal(countUserHelpfulNotes(sampleNotes, 'usr_1'), 2);
  assert.equal(countUserHelpfulNotes(sampleNotes, 'usr_2'), 1);
  assert.equal(countUserHelpfulNotes(sampleNotes, 'usr_3'), 0);

  // 3. Evaluate badges for a brand-new user (none unlocked)
  const initialEval = evaluateUserBadges({
    uid: 'usr_new',
    streakCount: 2,
    consecutiveGoalDays: 1,
    helpfulNotesCount: 0,
  });
  assert.equal(initialEval.unlockedCount, 0);
  assert.equal(initialEval.totalBadgesCount, 3);
  assert.equal(initialEval.completionPercent, 0);
  assert.equal(initialEval.badges[0].id, 'streak_5_day');
  assert.equal(initialEval.badges[0].unlocked, false);
  assert.equal(initialEval.badges[0].remainingToUnlock, 3);

  // 4. Record 3 consecutive daily goal hits & contribute a helpful note & reach 5-day streak
  const goalRec = recordConsecutiveGoalHitDay({
    todayDateKey: '2026-10-23',
    dailyTargetMinutes: 120,
    storedHistory: {},
    daysToEnsure: 3,
  });
  assert.equal(goalRec.consecutiveDaysHit, 3);
  assert.equal(goalRec.todayCompletedMinutes, 120);

  const noteBuild = validateAndBuildHelpfulNoteContribution({
    authorUid: 'usr_new',
    authorName: 'Alex Mercer',
    roomCode: 'STUDY-101',
    subject: 'Distributed Consensus',
    rawNote: 'Paxos vs Raft leader election safety proofs.',
    focusMinutes: 50,
    nowMs: 1_761_300_000_000,
  });
  assert.equal(noteBuild.valid, true);
  assert.ok(noteBuild.noteRecord);

  const unlockedAll = evaluateUserBadges({
    uid: 'usr_new',
    streakCount: 5,
    consecutiveGoalDays: goalRec.consecutiveDaysHit,
    studyNotes: [noteBuild.noteRecord!],
  });
  assert.equal(unlockedAll.unlockedCount, 3);
  assert.equal(unlockedAll.completionPercent, 100);
  assert.equal(unlockedAll.totalBadgeBonusPoints, 50 + 75 + 40);
  assert.ok(unlockedAll.badges.every((b) => b.unlocked));

  // 5. Leaderboard aggregation attaches badges to each ranked entry
  const ranked = aggregateGlobalLeaderboard([
    [
      {
        uid: 'usr_champion',
        displayName: 'Elena Rostova',
        bio: 'Systems Study Notes & Focus',
        streakCount: 7,
        participationPoints: 220,
        consecutiveGoalDays: 4,
        helpfulNotesCount: 3,
      },
      {
        uid: 'usr_starter',
        displayName: 'New Scholar',
        bio: 'Just joined',
        streakCount: 1,
        participationPoints: 25,
        consecutiveGoalDays: 0,
        helpfulNotesCount: 0,
      },
    ],
  ]);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].uid, 'usr_champion');
  assert.equal(ranked[0].unlockedBadges.length, 3);
  assert.equal(ranked[1].uid, 'usr_starter');
  assert.equal(ranked[1].unlockedBadges.length, 0);
});

test('Streak Freeze system allows users to spend participation points to equip freezes, automatically preserves streaks on missed days, rescues at-risk streaks, and bridges consecutive productivity goal days', () => {
  assert.equal(STREAK_FREEZE_COST_POINTS, 50);
  assert.equal(MAX_STREAK_FREEZES_OWNED, 3);

  // 1. Evaluate initial unprotected status when points < 50
  const statusLowPts = evaluateStreakFreezeStatus({
    streakCount: 4,
    participationPoints: 30,
    streakFreezesOwned: 0,
  });
  assert.equal(statusLowPts.canAffordFreeze, false);
  assert.equal(statusLowPts.canPurchaseFreeze, false);
  assert.equal(statusLowPts.isProtected, false);

  // Insufficient points purchase rejected
  const failedBuy = purchaseStreakFreeze({
    participationPoints: 30,
    streakFreezesOwned: 0,
  });
  assert.equal(failedBuy.success, false);
  assert.equal(failedBuy.participationPoints, 30);
  assert.equal(failedBuy.streakFreezesOwned, 0);

  // 2. Purchasing a Streak Freeze with accumulated participation points (120 pts -> 70 pts, 1 freeze owned)
  const buy1 = purchaseStreakFreeze({
    participationPoints: 120,
    streakFreezesOwned: 0,
  });
  assert.equal(buy1.success, true);
  assert.equal(buy1.pointsSpent, 50);
  assert.equal(buy1.participationPoints, 70);
  assert.equal(buy1.streakFreezesOwned, 1);

  const statusProtected = evaluateStreakFreezeStatus({
    streakCount: 4,
    participationPoints: buy1.participationPoints,
    streakFreezesOwned: buy1.streakFreezesOwned,
  });
  assert.equal(statusProtected.isProtected, true);
  assert.equal(statusProtected.canPurchaseFreeze, true);

  // Max capacity (3 freezes) enforced
  const maxCapRes = purchaseStreakFreeze({
    participationPoints: 200,
    streakFreezesOwned: MAX_STREAK_FREEZES_OWNED,
  });
  assert.equal(maxCapRes.success, false);
  assert.equal(maxCapRes.streakFreezesOwned, 3);

  // 3. Automatic login streak preservation when a day is missed (diffDays === 2) and a freeze is equipped
  const autoProtected = simulateMissedDayStreakEvaluation({
    streakCount: 5,
    participationPoints: 70,
    streakFreezesOwned: 1,
    frozenDates: [],
    todayDateKey: '2026-10-23',
  });
  assert.equal(autoProtected.preservedByEquippedFreeze, true);
  assert.equal(autoProtected.streakCount, 5); // preserved instead of resetting to 1!
  assert.equal(autoProtected.streakFreezesOwned, 0); // 1 freeze consumed
  assert.deepEqual(autoProtected.frozenDates, ['2026-10-22']);
  assert.equal(autoProtected.lastFreezeUsedDate, '2026-10-22');
  assert.equal(autoProtected.streakAtRiskCount, null);

  // 4. Missing a day with 0 freezes equipped puts the prior streak at risk, and spending 50 pts rescues & restores it
  const missedUnprotected = simulateMissedDayStreakEvaluation({
    streakCount: 6,
    participationPoints: 90,
    streakFreezesOwned: 0,
    frozenDates: [],
    todayDateKey: '2026-10-23',
  });
  assert.equal(missedUnprotected.preservedByEquippedFreeze, false);
  assert.equal(missedUnprotected.streakCount, 1);
  assert.equal(missedUnprotected.streakAtRiskCount, 6);
  assert.equal(missedUnprotected.missedDateKey, '2026-10-22');

  const rescued = spendPointsToFreezeMissedDay({
    streakCount: missedUnprotected.streakCount,
    lastLoginDate: missedUnprotected.lastLoginDate,
    participationPoints: missedUnprotected.participationPoints,
    streakFreezesOwned: missedUnprotected.streakFreezesOwned,
    frozenDates: missedUnprotected.frozenDates,
    streakAtRiskCount: missedUnprotected.streakAtRiskCount,
    missedDateKey: missedUnprotected.missedDateKey,
    todayDateKey: '2026-10-23',
  });
  assert.equal(rescued.success, true);
  assert.equal(rescued.pointsSpent, 50);
  assert.equal(rescued.participationPoints, 40);
  assert.equal(rescued.streakCount, 6); // 6-day streak restored!
  assert.deepEqual(rescued.frozenDates, ['2026-10-22']);
  assert.equal(rescued.streakAtRiskCount, null);

  // 5. Productivity goal streak preservation across a frozen missed day
  const weeklyWithMissedDay = [
    { dateKey: '2026-10-20', goalReached: true },
    { dateKey: '2026-10-21', goalReached: true },
    { dateKey: '2026-10-22', goalReached: false }, // missed day
    { dateKey: '2026-10-23', goalReached: true },
  ];
  // Without freeze, consecutive run breaks on 2026-10-22 (max 2)
  assert.equal(computeConsecutiveGoalDays(weeklyWithMissedDay).maxConsecutiveDays, 2);
  // With 2026-10-22 in frozenDates, the 3 active goal days bridge across the frozen day -> 3 consecutive goal days!
  const bridged = computeConsecutiveGoalDays(weeklyWithMissedDay, ['2026-10-22']);
  assert.equal(bridged.maxConsecutiveDays, 3);
  assert.equal(bridged.currentConsecutiveDays, 3);

  const badgeEvalWithFreeze = evaluateUserBadges({
    uid: 'usr_freeze_test',
    streakCount: rescued.streakCount,
    weeklyDays: weeklyWithMissedDay,
    frozenDates: rescued.frozenDates,
    helpfulNotesCount: 1,
  });
  assert.equal(badgeEvalWithFreeze.consecutiveGoalDays, 3);
  assert.equal(badgeEvalWithFreeze.unlockedCount, 3);
});

test('Daily Productivity Goal progress evaluates 50% and 100% visual milestone markers, celebratory headlines, and color shifts', () => {
  // 1. Starter stage (< 50%): 30m out of 120m (25%)
  const starter = computeProductivityGoalProgress(120, 30);
  assert.equal(starter.progressPercent, 25);
  assert.equal(starter.halfwayMinutes, 60);
  assert.equal(starter.isHalfwayReached, false);
  assert.equal(starter.isGoalReached, false);
  assert.equal(starter.milestoneStage, 'starter');
  assert.equal(starter.barFillColorClass, 'bg-white');
  assert.equal(starter.percentTextColorClass, 'text-zinc-200');
  assert.equal(starter.activeCelebrationHeadline, null);
  assert.equal(starter.milestones[0].id, 'milestone_50');
  assert.equal(starter.milestones[0].reached, false);
  assert.equal(starter.milestones[0].remainingToMilestoneMinutes, 30);
  assert.equal(starter.milestones[0].iconName, 'sparkles');
  assert.equal(starter.milestones[1].id, 'milestone_100');
  assert.equal(starter.milestones[1].reached, false);
  assert.equal(starter.milestones[1].remainingToMilestoneMinutes, 90);
  assert.equal(starter.milestones[1].iconName, 'trophy');

  // 2. Halfway milestone reached (50% - 99%): 60m out of 120m (50%)
  const halfway = computeProductivityGoalProgress(120, 60);
  assert.equal(halfway.progressPercent, 50);
  assert.equal(halfway.isHalfwayReached, true);
  assert.equal(halfway.isGoalReached, false);
  assert.equal(halfway.milestoneStage, 'halfway_50');
  assert.equal(halfway.barFillColorClass, 'bg-amber-400');
  assert.equal(halfway.percentTextColorClass, 'text-amber-400');
  assert.equal(
    halfway.activeCelebrationHeadline,
    '50% Halfway Milestone Reached! Keep the Momentum Going'
  );
  assert.equal(halfway.milestones[0].reached, true);
  assert.equal(halfway.milestones[0].remainingToMilestoneMinutes, 0);
  assert.equal(halfway.milestones[1].reached, false);
  assert.equal(halfway.milestones[1].remainingToMilestoneMinutes, 60);

  // 3. Full target milestone reached (100%+): 125m out of 120m (clamped to 100%)
  const completed = computeProductivityGoalProgress(120, 125);
  assert.equal(completed.progressPercent, 100);
  assert.equal(completed.isHalfwayReached, true);
  assert.equal(completed.isGoalReached, true);
  assert.equal(completed.milestoneStage, 'complete_100');
  assert.equal(completed.barFillColorClass, 'bg-emerald-400');
  assert.equal(completed.percentTextColorClass, 'text-emerald-400');
  assert.equal(
    completed.activeCelebrationHeadline,
    '100% Daily Target Reached! Full Focus Milestone Unlocked'
  );
  assert.equal(completed.milestones[0].reached, true);
  assert.equal(completed.milestones[1].reached, true);
  assert.equal(completed.milestones[1].remainingToMilestoneMinutes, 0);
});

test('Quick Focus Desk toggle resolves ascending start chime when joining a desk and descending end chime when leaving', () => {
  // 1. Joining a Focus Desk (isCurrentlyAtDesk: false) -> 'start' chime
  const joinTrigger = resolveQuickFocusDeskSoundTrigger({
    isCurrentlyAtDesk: false,
    preferences: {
      ...DEFAULT_UI_SOUND_PREFERENCES,
      enabled: true,
      volumePercent: 70,
    },
  });
  assert.equal(joinTrigger.action, 'join');
  assert.equal(joinTrigger.chimeType, 'start');
  assert.equal(joinTrigger.shouldPlay, true);
  assert.equal(joinTrigger.chime.eventType, 'start');
  assert.equal(joinTrigger.chime.label, 'Focus Desk Start Chime');
  assert.deepEqual(joinTrigger.chime.frequenciesHz, [523.25, 659.25]); // ascending C5 -> E5
  assert.ok(joinTrigger.chime.frequenciesHz[1] > joinTrigger.chime.frequenciesHz[0]);
  assert.equal(
    joinTrigger.feedbackMessage,
    'Start chime played: Joined Focus Desk (C5 → E5 Focus Start)'
  );

  // 2. Leaving a Focus Desk (isCurrentlyAtDesk: true) -> 'end' chime
  const leaveTrigger = resolveQuickFocusDeskSoundTrigger({
    isCurrentlyAtDesk: true,
    preferences: {
      ...DEFAULT_UI_SOUND_PREFERENCES,
      enabled: true,
      volumePercent: 70,
    },
  });
  assert.equal(leaveTrigger.action, 'leave');
  assert.equal(leaveTrigger.chimeType, 'end');
  assert.equal(leaveTrigger.shouldPlay, true);
  assert.equal(leaveTrigger.chime.eventType, 'end');
  assert.equal(leaveTrigger.chime.label, 'Focus Desk End Chime');
  assert.deepEqual(leaveTrigger.chime.frequenciesHz, [659.25, 493.88]); // descending E5 -> B4
  assert.ok(leaveTrigger.chime.frequenciesHz[1] < leaveTrigger.chime.frequenciesHz[0]);
  assert.equal(
    leaveTrigger.feedbackMessage,
    'End chime played: Left Focus Desk (E5 → B4 Focus End)'
  );

  // 3. Respects muted UI sound preferences
  const mutedJoin = resolveQuickFocusDeskSoundTrigger({
    isCurrentlyAtDesk: false,
    preferences: {
      ...DEFAULT_UI_SOUND_PREFERENCES,
      enabled: false,
    },
  });
  assert.equal(mutedJoin.action, 'join');
  assert.equal(mutedJoin.chimeType, 'start');
  assert.equal(mutedJoin.shouldPlay, false);
  assert.equal(mutedJoin.feedbackMessage, 'Joined Focus Desk (Sound alerts muted)');
});

test('Streak Focus Reminder evaluates cutoff time (e.g. 10:00 AM), shows subtle toast when focus has not started by cutoff, and suppresses toast when focus starts or is dismissed', () => {
  assert.equal(DEFAULT_STREAK_REMINDER_TIME, '10:00');
  assert.ok(STREAK_REMINDER_TIME_PRESETS.includes('10:00'));
  assert.equal(DEFAULT_STREAK_REMINDER_PREFERENCES.enabled, true);
  assert.equal(DEFAULT_STREAK_REMINDER_PREFERENCES.reminderTime24h, '10:00');

  // 1. Time parsing (24h and 12h AM/PM formatting)
  const tenAm = parseReminderTimeMinutes('10:00');
  assert.equal(tenAm.hours, 10);
  assert.equal(tenAm.minutes, 0);
  assert.equal(tenAm.totalMinutes, 600);
  assert.equal(tenAm.formatted24h, '10:00');
  assert.equal(tenAm.formatted12h, '10:00 AM');

  const twoThirtyPm = parseReminderTimeMinutes('14:30');
  assert.equal(twoThirtyPm.hours, 14);
  assert.equal(twoThirtyPm.minutes, 30);
  assert.equal(twoThirtyPm.totalMinutes, 870);
  assert.equal(twoThirtyPm.formatted24h, '14:30');
  assert.equal(twoThirtyPm.formatted12h, '2:30 PM');

  const invalidFallback = parseReminderTimeMinutes('invalid_time');
  assert.equal(invalidFallback.formatted24h, '10:00');
  assert.equal(invalidFallback.formatted12h, '10:00 AM');

  // 2. Before reminder time (09:15 AM vs 10:00 AM cutoff) -> do NOT show toast
  const beforeCutoff = evaluateStreakFocusReminder({
    enabled: true,
    reminderTime24h: '10:00',
    currentHours: 9,
    currentMinutes: 15,
    todayDateKey: '2026-10-24',
    hasStartedFocusSessionToday: false,
    isInFocusDesk: false,
    streakCount: 5,
  });
  assert.equal(beforeCutoff.shouldShowToast, false);
  assert.equal(beforeCutoff.reason, 'before_reminder_time');
  assert.equal(beforeCutoff.isPastReminderTime, false);
  assert.equal(beforeCutoff.reminderTime12h, '10:00 AM');

  // 3. At or past reminder time (10:00 AM and 11:30 AM) with NO focus session started -> SHOW toast!
  const atTenAmNoFocus = evaluateStreakFocusReminder({
    enabled: true,
    reminderTime24h: '10:00',
    currentHours: 10,
    currentMinutes: 0,
    todayDateKey: '2026-10-24',
    hasStartedFocusSessionToday: false,
    isInFocusDesk: false,
    streakCount: 5,
  });
  assert.equal(atTenAmNoFocus.shouldShowToast, true);
  assert.equal(atTenAmNoFocus.reason, 'active_reminder');
  assert.equal(atTenAmNoFocus.isPastReminderTime, true);
  assert.equal(atTenAmNoFocus.minutesPastReminder, 0);
  assert.equal(atTenAmNoFocus.streakBadgeLabel, '5-Day Streak');
  assert.ok(atTenAmNoFocus.title.includes('10:00 AM'));
  assert.ok(atTenAmNoFocus.message.includes('10:00 AM'));
  assert.ok(atTenAmNoFocus.message.includes('5-day streak'));

  const pastCutoffNoFocus = evaluateStreakFocusReminder({
    enabled: true,
    reminderTime24h: '10:00',
    currentHours: 11,
    currentMinutes: 30,
    todayDateKey: '2026-10-24',
    hasStartedFocusSessionToday: false,
    isInFocusDesk: false,
    streakCount: 7,
  });
  assert.equal(pastCutoffNoFocus.shouldShowToast, true);
  assert.equal(pastCutoffNoFocus.minutesPastReminder, 90);
  assert.equal(pastCutoffNoFocus.streakBadgeLabel, '7-Day Streak');

  // 4. Past cutoff, but user starts a focus session or joins a Focus Desk -> hides toast immediately
  const startedDesk = evaluateStreakFocusReminder({
    enabled: true,
    reminderTime24h: '10:00',
    currentHours: 11,
    currentMinutes: 30,
    todayDateKey: '2026-10-24',
    hasStartedFocusSessionToday: false,
    isInFocusDesk: true,
    streakCount: 7,
  });
  assert.equal(startedDesk.shouldShowToast, false);
  assert.equal(startedDesk.reason, 'focus_already_started');
  assert.equal(startedDesk.hasStartedFocusToday, true);

  const loggedFocusToday = evaluateStreakFocusReminder({
    enabled: true,
    reminderTime24h: '10:00',
    currentHours: 11,
    currentMinutes: 30,
    todayDateKey: '2026-10-24',
    startedFocusDateKey: '2026-10-24',
    streakCount: 7,
  });
  assert.equal(loggedFocusToday.shouldShowToast, false);
  assert.equal(loggedFocusToday.reason, 'focus_already_started');

  // 5. Dismissed for todayDateKey -> hides toast for today, but shows again tomorrow
  const dismissedToday = evaluateStreakFocusReminder({
    enabled: true,
    reminderTime24h: '10:00',
    currentHours: 11,
    currentMinutes: 30,
    todayDateKey: '2026-10-24',
    dismissedDateKey: '2026-10-24',
    hasStartedFocusSessionToday: false,
    streakCount: 7,
  });
  assert.equal(dismissedToday.shouldShowToast, false);
  assert.equal(dismissedToday.reason, 'dismissed_today');
  assert.equal(dismissedToday.isDismissedToday, true);

  const dismissedYesterdayOnly = evaluateStreakFocusReminder({
    enabled: true,
    reminderTime24h: '10:00',
    currentHours: 11,
    currentMinutes: 30,
    todayDateKey: '2026-10-24',
    dismissedDateKey: '2026-10-23',
    hasStartedFocusSessionToday: false,
    streakCount: 7,
  });
  assert.equal(dismissedYesterdayOnly.shouldShowToast, true);
  assert.equal(dismissedYesterdayOnly.reason, 'active_reminder');
});

test('Framer Motion achievement badge entrance specs compute staggered scale-in on page load and spring scale-in when a new badge is unlocked', () => {
  // 1. Page load with 1 unlocked badge and 2 locked badges (no prior session diff)
  const loadUnlocked0 = getBadgeEntranceMotionSpec({
    badgeId: 'streak_5_day',
    index: 0,
    unlocked: true,
    previouslyUnlockedIds: null,
  });
  assert.equal(loadUnlocked0.animationMode, 'page_load_unlocked');
  assert.equal(loadUnlocked0.newlyUnlocked, false);
  assert.equal(loadUnlocked0.motionKey, 'streak_5_day-unlocked');
  assert.deepEqual(loadUnlocked0.initial, { opacity: 0, scale: 0.84, y: 6 });
  assert.deepEqual(loadUnlocked0.animate, { opacity: 1, scale: 1, y: 0 });
  assert.equal(loadUnlocked0.transition.type, 'spring');
  assert.equal(loadUnlocked0.transition.delay, 0);

  const loadLocked1 = getBadgeEntranceMotionSpec({
    badgeId: 'goal_3_day',
    index: 1,
    unlocked: false,
    previouslyUnlockedIds: null,
  });
  assert.equal(loadLocked1.animationMode, 'page_load_locked');
  assert.equal(loadLocked1.newlyUnlocked, false);
  assert.equal(loadLocked1.motionKey, 'goal_3_day-locked');
  assert.deepEqual(loadLocked1.initial, { opacity: 0, scale: 0.92, y: 4 });
  assert.equal(loadLocked1.transition.delay, 0.07);

  // 2. Detecting newly unlocked badges when user earns goal_3_day and helpful_notes
  const newlyUnlocked = detectNewlyUnlockedBadgeIds(
    ['streak_5_day'],
    [
      { id: 'streak_5_day', unlocked: true },
      { id: 'goal_3_day', unlocked: true },
      { id: 'helpful_notes', unlocked: false },
    ]
  );
  assert.deepEqual(newlyUnlocked, ['goal_3_day']);

  // 3. Newly unlocked badge gets celebratory spring entrance scale-in (0.72 -> 1) and new motionKey
  const newlyUnlockedSpec = getBadgeEntranceMotionSpec({
    badgeId: 'goal_3_day',
    index: 1,
    unlocked: true,
    previouslyUnlockedIds: ['streak_5_day'],
  });
  assert.equal(newlyUnlockedSpec.animationMode, 'newly_unlocked');
  assert.equal(newlyUnlockedSpec.newlyUnlocked, true);
  assert.equal(newlyUnlockedSpec.motionKey, 'goal_3_day-unlocked');
  assert.notEqual(newlyUnlockedSpec.motionKey, loadLocked1.motionKey);
  assert.deepEqual(newlyUnlockedSpec.initial, { opacity: 0, scale: 0.72, y: 8 });
  assert.deepEqual(newlyUnlockedSpec.animate, { opacity: 1, scale: 1, y: 0 });
  assert.equal(newlyUnlockedSpec.transition.stiffness, 420);
});

test('Daily Productivity Quick Start button logs a 25-minute Pomodoro block, increments participation points, and updates milestone progress', () => {
  assert.equal(QUICK_START_POMODORO_MINUTES, 25);
  assert.equal(QUICK_START_PARTICIPATION_POINTS, 15);

  // 1. First Quick Start from 30m / 120m and 100 pts -> 55m / 120m (46%) and 115 pts
  const qs1 = applyQuickStartPomodoroBlock({
    targetMinutes: 120,
    currentCompletedMinutes: 30,
    currentParticipationPoints: 100,
  });
  assert.equal(qs1.addedMinutes, 25);
  assert.equal(qs1.previousCompletedMinutes, 30);
  assert.equal(qs1.nextCompletedMinutes, 55);
  assert.equal(qs1.pointsAwarded, 15);
  assert.equal(qs1.previousParticipationPoints, 100);
  assert.equal(qs1.nextParticipationPoints, 115);
  assert.equal(qs1.progress.progressPercent, 46);
  assert.equal(qs1.progress.isHalfwayReached, false);
  assert.equal(
    qs1.feedbackMessage,
    'Quick Start: Logged 25m Pomodoro block (+15 participation pts) · 55m / 120m (46%)'
  );

  // 2. Second Quick Start from 55m / 120m and 115 pts -> 80m / 120m (67%, crosses 50% milestone!) and 130 pts
  const qs2 = applyQuickStartPomodoroBlock({
    targetMinutes: 120,
    currentCompletedMinutes: qs1.nextCompletedMinutes,
    currentParticipationPoints: qs1.nextParticipationPoints,
  });
  assert.equal(qs2.nextCompletedMinutes, 80);
  assert.equal(qs2.nextParticipationPoints, 130);
  assert.equal(qs2.progress.progressPercent, 67);
  assert.equal(qs2.progress.isHalfwayReached, true);
  assert.equal(qs2.progress.milestoneStage, 'halfway_50');
});

test('Online Directory connection request status map and Direct Message shortcut resolve accepted, pending, declined, and self peer states', () => {
  const statusMap = buildConnectionRequestStatusMap('usr_alice', [
    { id: 'r1', fromUid: 'usr_alice', toUid: 'usr_bob', status: 'accepted' },
    { id: 'r2', fromUid: 'usr_carol', toUid: 'usr_alice', status: 'pending' },
    { id: 'r3', fromUid: 'usr_alice', toUid: 'usr_dave', status: 'declined' },
    // Duplicate/older record for Bob should not downgrade 'accepted'
    { id: 'r4', fromUid: 'usr_bob', toUid: 'usr_alice', status: 'pending' },
    // Unrelated users should be ignored
    { id: 'r5', fromUid: 'usr_eve', toUid: 'usr_frank', status: 'accepted' },
  ]);

  assert.deepEqual(statusMap, {
    usr_bob: 'accepted',
    usr_carol: 'pending',
    usr_dave: 'declined',
  });

  // Accepted peer -> Direct Message shortcut enabled
  const bobShortcut = resolveOnlineDirectoryPeerDmShortcut({
    currentUid: 'usr_alice',
    peerUid: 'usr_bob',
    peerDisplayName: 'Bob Vance',
    connectionStatusMap: statusMap,
  });
  assert.equal(bobShortcut.status, 'accepted');
  assert.equal(bobShortcut.isAcceptedConnection, true);
  assert.equal(bobShortcut.showDirectMessageShortcut, true);
  assert.equal(bobShortcut.shortcutLabel, 'Direct Message');
  assert.equal(bobShortcut.shortcutAriaLabel, 'Direct Message Bob Vance');
  assert.equal(bobShortcut.connectionBadgeLabel, 'Connected');

  // Pending peer -> Direct Message shortcut not shown
  const carolShortcut = resolveOnlineDirectoryPeerDmShortcut({
    currentUid: 'usr_alice',
    peerUid: 'usr_carol',
    peerDisplayName: 'Carol Peletier',
    connectionStatusMap: statusMap,
  });
  assert.equal(carolShortcut.status, 'pending');
  assert.equal(carolShortcut.isAcceptedConnection, false);
  assert.equal(carolShortcut.showDirectMessageShortcut, false);
  assert.equal(carolShortcut.connectionBadgeLabel, 'Request pending');

  // Stranger with no request -> status 'none', shortcut not shown
  const strangerShortcut = resolveOnlineDirectoryPeerDmShortcut({
    currentUid: 'usr_alice',
    peerUid: 'usr_stranger',
    peerDisplayName: 'Stranger',
    connectionStatusMap: statusMap,
  });
  assert.equal(strangerShortcut.status, 'none');
  assert.equal(strangerShortcut.showDirectMessageShortcut, false);

  // Self row -> never shows Direct Message shortcut
  const selfShortcut = resolveOnlineDirectoryPeerDmShortcut({
    currentUid: 'usr_alice',
    peerUid: 'usr_alice',
    peerDisplayName: 'Alice',
    connectionStatusMap: statusMap,
  });
  assert.equal(selfShortcut.isSelf, true);
  assert.equal(selfShortcut.showDirectMessageShortcut, false);
});

test('Framer Motion Daily Productivity progress bar transition spec computes smooth spring scaleX animation and milestone crossings when dailyCompletedMinutes increases', () => {
  // 1. Initial mount at 30 / 120 mins (25%)
  const mountSpec = getProductivityProgressMotionSpec({
    targetMinutes: 120,
    completedMinutes: 30,
    previousCompletedMinutes: null,
  });
  assert.equal(mountSpec.progressPercent, 25);
  assert.equal(mountSpec.previousProgressPercent, 0);
  assert.equal(mountSpec.scaleX, 0.25);
  assert.equal(mountSpec.previousScaleX, 0);
  assert.equal(mountSpec.didMinutesIncrease, true);
  assert.deepEqual(mountSpec.initial, { scaleX: 0, opacity: 0.85 });
  assert.deepEqual(mountSpec.animate, { scaleX: 0.25, opacity: 1 });
  assert.equal(mountSpec.transition.type, 'spring');
  assert.equal(mountSpec.transition.stiffness, 180);
  assert.equal(mountSpec.crossedMilestone, 'none');

  // 2. Increasing completedMinutes from 30 -> 65 mins (54%, crossing 50% halfway milestone)
  const increaseHalfway = getProductivityProgressMotionSpec({
    targetMinutes: 120,
    completedMinutes: 65,
    previousCompletedMinutes: 30,
  });
  assert.equal(increaseHalfway.didMinutesIncrease, true);
  assert.equal(increaseHalfway.minutesDelta, 35);
  assert.equal(increaseHalfway.previousScaleX, 0.25);
  assert.equal(increaseHalfway.scaleX, 0.54);
  assert.equal(increaseHalfway.milestoneStage, 'halfway_50');
  assert.equal(increaseHalfway.crossedMilestone, 'halfway_50');
  assert.deepEqual(increaseHalfway.initial, { scaleX: 0.25, opacity: 1 });
  assert.deepEqual(increaseHalfway.animate, { scaleX: 0.54, opacity: 1 });

  // 3. Increasing completedMinutes from 65 -> 125 mins (100%, crossing 100% target milestone)
  const increaseComplete = getProductivityProgressMotionSpec({
    targetMinutes: 120,
    completedMinutes: 125,
    previousCompletedMinutes: 65,
  });
  assert.equal(increaseComplete.didMinutesIncrease, true);
  assert.equal(increaseComplete.minutesDelta, 60);
  assert.equal(increaseComplete.scaleX, 1);
  assert.equal(increaseComplete.milestoneStage, 'complete_100');
  assert.equal(increaseComplete.crossedMilestone, 'complete_100');
  assert.deepEqual(increaseComplete.animate, { scaleX: 1, opacity: 1 });
});

test('Online Directory Quick Filter toggles cleanly between Everyone and My Connections and filters online peers by accepted connection status', () => {
  assert.equal(toggleOnlineDirectoryAudienceFilter('everyone'), 'my_connections');
  assert.equal(toggleOnlineDirectoryAudienceFilter('my_connections'), 'everyone');
  assert.equal(clearOnlineDirectoryAudienceFilter(), 'everyone');

  const peers = [
    { uid: 'usr_alice', currentMode: 'hub', mood: 'Deep Work' },
    { uid: 'usr_bob', currentMode: 'study', activeStudyRoomCode: 'STUDY-1', mood: 'Deep Work' },
    { uid: 'usr_carol', currentMode: 'hub', mood: 'Brainstorming' },
    { uid: 'usr_dave', currentMode: 'hub', mood: 'Deep Work' },
  ];
  const statusMap = buildConnectionRequestStatusMap('usr_alice', [
    { id: 'r1', fromUid: 'usr_alice', toUid: 'usr_bob', status: 'accepted' },
    { id: 'r2', fromUid: 'usr_carol', toUid: 'usr_alice', status: 'pending' },
    { id: 'r3', fromUid: 'usr_dave', toUid: 'usr_alice', status: 'accepted' },
  ]);

  const everyoneMeta = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: peers,
    currentUid: 'usr_alice',
    connectionStatusMap: statusMap,
  });
  assert.equal(everyoneMeta.mode, 'everyone');
  assert.equal(everyoneMeta.isMyConnectionsOnly, false);
  assert.equal(everyoneMeta.ariaPressed, false);
  assert.equal(everyoneMeta.everyoneCount, 4);
  assert.equal(everyoneMeta.myConnectionsCount, 2);
  assert.equal(everyoneMeta.matchingCount, 4);
  assert.equal(everyoneMeta.iconName, 'filter');
  assert.equal(everyoneMeta.dynamicFilterIconComponent, 'Filter');
  assert.equal(everyoneMeta.stateIconName, 'filter');
  assert.equal(everyoneMeta.secondaryStateIconName, 'globe');
  assert.equal(everyoneMeta.stateIconLabel, 'Everyone active (Filter icon)');
  assert.equal(everyoneMeta.filterIconName, 'filter');
  assert.equal(everyoneMeta.toggleStateIndicator, 'ALL · Everyone');
  assert.equal(everyoneMeta.statusDotTone, 'zinc');
  assert.equal(everyoneMeta.toggleThumbPosition, 'left');
  assert.equal(everyoneMeta.tooltipTitle, 'Currently showing everyone');
  assert.equal(
    everyoneMeta.tooltipDetail,
    'Currently showing everyone (4 online). Click to filter to My Connections (2).'
  );
  assert.equal(everyoneMeta.showClearButton, false);
  assert.equal(everyoneMeta.clearButtonLabel, 'Clear');
  assert.equal(
    everyoneMeta.clearButtonAriaLabel,
    'Clear My Connections filter and reset to Everyone (4)'
  );
  assert.equal(everyoneMeta.clearButtonMotion.isVisible, false);
  assert.deepEqual(everyoneMeta.clearButtonMotion.initial, { opacity: 0, scale: 0.85 });
  assert.deepEqual(everyoneMeta.clearButtonMotion.animate, { opacity: 1, scale: 1 });
  assert.deepEqual(everyoneMeta.clearButtonMotion.exit, { opacity: 0, scale: 0.85 });

  const connectionsMeta = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: peers,
    currentUid: 'usr_alice',
    connectionStatusMap: statusMap,
  });
  assert.equal(connectionsMeta.mode, 'my_connections');
  assert.equal(connectionsMeta.isMyConnectionsOnly, true);
  assert.equal(connectionsMeta.ariaPressed, true);
  assert.equal(connectionsMeta.myConnectionsCount, 2);
  assert.equal(connectionsMeta.matchingCount, 2);
  assert.equal(connectionsMeta.iconName, 'user-check');
  assert.equal(connectionsMeta.dynamicFilterIconComponent, 'UserCheck');
  assert.equal(connectionsMeta.stateIconName, 'user-check');
  assert.equal(connectionsMeta.secondaryStateIconName, 'link');
  assert.equal(connectionsMeta.stateIconLabel, 'My Connections active (UserCheck icon)');
  assert.equal(connectionsMeta.filterIconName, 'filter');
  assert.equal(connectionsMeta.toggleStateIndicator, 'ON · My Connections');
  assert.equal(connectionsMeta.statusDotTone, 'emerald');
  assert.equal(connectionsMeta.toggleThumbPosition, 'right');
  assert.equal(connectionsMeta.tooltipTitle, 'Currently showing only my connections');
  assert.equal(
    connectionsMeta.tooltipDetail,
    'Currently showing only my connections (2 accepted peers). Click to switch to Everyone (4).'
  );
  assert.equal(connectionsMeta.showClearButton, true);
  assert.equal(connectionsMeta.clearButtonLabel, 'Clear');
  assert.equal(
    connectionsMeta.clearButtonAriaLabel,
    'Clear My Connections filter and reset to Everyone (4)'
  );
  assert.equal(connectionsMeta.clearButtonMotion.isVisible, true);
  assert.deepEqual(connectionsMeta.clearButtonMotion.exit, { opacity: 0, scale: 0.85 });
  assert.equal(
    getQuickFilterClearButtonMotionSpec(false).exit.scale,
    0.85
  );
  assert.deepEqual(everyoneMeta.toggleHoverMotion.whileHover, {
    scale: 1.03,
    filter: 'brightness(1.12)',
  });
  assert.deepEqual(everyoneMeta.toggleHoverMotion.whileTap, { scale: 0.98 });
  assert.deepEqual(everyoneMeta.toggleHoverMotion.animate, {
    scale: 1,
    filter: 'brightness(1)',
  });
  const hoveredSpec = getQuickFilterToggleHoverMotionSpec(true);
  assert.equal(hoveredSpec.isHovered, true);
  assert.equal(hoveredSpec.hoverScale, 1.03);
  assert.equal(hoveredSpec.hoverBrightness, 'brightness(1.12)');
  assert.deepEqual(hoveredSpec.animate, {
    scale: 1.03,
    filter: 'brightness(1.12)',
  });

  // Filtering with 'everyone' returns all 4 peers
  const allFiltered = filterOnlinePeersByDirectoryCriteria(peers, [], {
    audienceFilter: 'everyone',
    currentUid: 'usr_alice',
    connectionStatusMap: statusMap,
  });
  assert.equal(allFiltered.length, 4);

  // Filtering with 'my_connections' returns only accepted connections (Bob & Dave, excluding self Alice and pending Carol)
  const myConnFiltered = filterOnlinePeersByDirectoryCriteria(peers, [], {
    audienceFilter: 'my_connections',
    currentUid: 'usr_alice',
    connectionStatusMap: statusMap,
  });
  assert.deepEqual(
    myConnFiltered.map((p) => p.uid),
    ['usr_bob', 'usr_dave']
  );

  // Combining 'my_connections' + onlyInFocus returns only Bob
  const myConnInFocus = filterOnlinePeersByDirectoryCriteria(peers, [], {
    audienceFilter: 'my_connections',
    onlyInFocus: true,
    currentUid: 'usr_alice',
    connectionStatusMap: statusMap,
  });
  assert.deepEqual(
    myConnInFocus.map((p) => p.uid),
    ['usr_bob']
  );

  // Clear Filter confirmation modal metadata & toggle action prevents accidental data shifts
  assert.equal(everyoneMeta.hiddenPeersCount, 2);
  assert.equal(everyoneMeta.requiresClearConfirmationModal, false);
  assert.equal(everyoneMeta.clearModalMeta.isOpen, false);
  assert.equal(everyoneMeta.clearModalMeta.hiddenPeersCount, 2);

  assert.equal(connectionsMeta.hiddenPeersCount, 2);
  assert.equal(connectionsMeta.requiresClearConfirmationModal, true);
  assert.equal(connectionsMeta.clearModalMeta.hiddenPeersCount, 2);
  assert.equal(connectionsMeta.clearModalMeta.visiblePeersCount, 2);
  assert.equal(connectionsMeta.clearModalMeta.totalEveryoneCount, 4);
  assert.equal(
    connectionsMeta.clearModalMeta.hiddenPeersSummaryText,
    '2 peers are currently hidden by the active My Connections filter.'
  );
  assert.equal(connectionsMeta.clearModalMeta.confirmActionLabel, 'Confirm Reset');
  assert.equal(connectionsMeta.clearModalMeta.cancelActionLabel, 'Keep Filter Active');
  assert.equal(connectionsMeta.clearModalMeta.triggerButtonLabel, 'Clear Filter');

  const openModalMeta = getOnlineDirectoryClearFilterModalMeta({
    isOpen: true,
    everyoneCount: 4,
    myConnectionsCount: 3,
  });
  assert.equal(openModalMeta.isOpen, true);
  assert.equal(openModalMeta.hiddenPeersCount, 1);
  assert.equal(
    openModalMeta.hiddenPeersSummaryText,
    '1 peer is currently hidden by the active My Connections filter.'
  );

  assert.deepEqual(resolveOnlineDirectoryFilterToggleAction('everyone'), {
    nextMode: 'my_connections',
    shouldOpenClearModal: false,
  });
  assert.deepEqual(resolveOnlineDirectoryFilterToggleAction('my_connections'), {
    nextMode: 'my_connections',
    shouldOpenClearModal: true,
  });
  assert.deepEqual(confirmOnlineDirectoryClearFilterReset(), {
    nextMode: 'everyone',
    isModalOpen: false,
  });

  // Mood presets are grouped into 'Productive', 'Social', and 'Away' categories
  assert.deepEqual(ONLINE_MOOD_CATEGORIES, ['Productive', 'Social', 'Away']);
  const moodSummary = summarizeOnlineDirectoryMoods([
    ...peers,
    { uid: 'usr_eva', mood: 'Coffee Break' },
  ]);
  assert.deepEqual(moodSummary.countsByCategory, {
    Productive: 3, // Alice (Deep Work), Bob (Pair Programming), Dave (Deep Work)
    Social: 1, // Carol (Brainstorming)
    Away: 1, // Eva (Coffee Break)
  });
  assert.equal(moodSummary.groupedPresets.length, 3);
  assert.equal(moodSummary.groupedPresets[0].category, 'Productive');
  assert.deepEqual(
    moodSummary.groupedPresets[0].presets.map((p) => p.label),
    ['Deep Work', 'Pair Programming']
  );
  assert.equal(moodSummary.groupedPresets[0].activeCount, 3);
  assert.equal(moodSummary.groupedPresets[1].category, 'Social');
  assert.deepEqual(
    moodSummary.groupedPresets[1].presets.map((p) => p.label),
    ['Brainstorming', 'Quick Questions']
  );
  assert.equal(moodSummary.groupedPresets[1].activeCount, 1);
  assert.equal(moodSummary.groupedPresets[2].category, 'Away');
  assert.deepEqual(
    moodSummary.groupedPresets[2].presets.map((p) => p.label),
    ['Coffee Break']
  );
  assert.equal(moodSummary.groupedPresets[2].activeCount, 1);

  assert.deepEqual(parseOnlineDirectoryMoodFilterSelection('category:Productive'), {
    type: 'category',
    category: 'Productive',
    presetLabel: null,
  });
  assert.deepEqual(parseOnlineDirectoryMoodFilterSelection('Social'), {
    type: 'category',
    category: 'Social',
    presetLabel: null,
  });
  assert.deepEqual(parseOnlineDirectoryMoodFilterSelection('Deep Work'), {
    type: 'preset',
    category: null,
    presetLabel: 'Deep Work',
  });

  const productiveFiltered = filterOnlinePeersByDirectoryCriteria(
    [...peers, { uid: 'usr_eva', currentMode: 'hub', mood: 'Coffee Break' }],
    [],
    { moodFilter: 'category:Productive' }
  );
  assert.deepEqual(
    productiveFiltered.map((p) => p.uid),
    ['usr_alice', 'usr_bob', 'usr_dave']
  );

  const socialFiltered = filterOnlinePeersByDirectoryCriteria(
    [...peers, { uid: 'usr_eva', currentMode: 'hub', mood: 'Coffee Break' }],
    [],
    { moodFilter: 'category:Social' }
  );
  assert.deepEqual(
    socialFiltered.map((p) => p.uid),
    ['usr_carol']
  );

  const awayFiltered = filterOnlinePeersByDirectoryCriteria(
    [...peers, { uid: 'usr_eva', currentMode: 'hub', mood: 'Coffee Break' }],
    [],
    { moodFilter: 'category:Away' }
  );
  assert.deepEqual(
    awayFiltered.map((p) => p.uid),
    ['usr_eva']
  );

  // Staggered Framer Motion spec for Mood category headers and preset items
  assert.equal(toggleMoodCategoryDrawerExpanded(true), false);
  assert.equal(toggleMoodCategoryDrawerExpanded(false), true);

  const staggerSpec = getMoodCategoryExpansionMotionSpec(true);
  assert.equal(staggerSpec.isExpanded, true);
  assert.equal(staggerSpec.staggerChildrenSec, 0.06);
  assert.equal(staggerSpec.delayChildrenSec, 0.03);
  assert.equal(staggerSpec.presetStaggerOffsetSec, 0.035);
  assert.deepEqual(staggerSpec.containerInitial, { opacity: 0, y: -4 });
  assert.deepEqual(staggerSpec.containerAnimate, { opacity: 1, y: 0 });

  const header0 = staggerSpec.getCategoryHeaderMotion(0);
  const header1 = staggerSpec.getCategoryHeaderMotion(1);
  const header2 = staggerSpec.getCategoryHeaderMotion(2);
  assert.deepEqual(header0.initial, { opacity: 0, y: -4 });
  assert.deepEqual(header0.animate, { opacity: 1, y: 0 });
  assert.equal(header0.transition.delay, 0.03);
  assert.equal(header1.transition.delay, 0.09);
  assert.equal(header2.transition.delay, 0.15);

  const preset00 = staggerSpec.getPresetItemMotion(0, 0);
  const preset01 = staggerSpec.getPresetItemMotion(0, 1);
  const preset10 = staggerSpec.getPresetItemMotion(1, 0);
  assert.deepEqual(preset00.initial, { opacity: 0, y: -3 });
  assert.deepEqual(preset00.animate, { opacity: 1, y: 0 });
  assert.equal(preset00.transition.delay, 0.05);
  assert.equal(preset01.transition.delay, 0.085);
  assert.equal(preset10.transition.delay, 0.11);

  // Sticky sidebar & hover-only scroll specification without layout fluctuation
  const lockedSidebarSpec = getWorkspaceSidebarScrollSpec(false);
  assert.equal(lockedSidebarSpec.isHovered, false);
  assert.equal(lockedSidebarSpec.isSticky, true);
  assert.equal(lockedSidebarSpec.independentMainScroll, true);
  assert.equal(lockedSidebarSpec.preventLayoutFluctuation, true);
  assert.equal(lockedSidebarSpec.scrollMode, 'locked');
  assert.equal(lockedSidebarSpec.layoutMode, 'side-by-side-sticky');
  assert.ok(lockedSidebarSpec.sidebarPositionClass.includes('md:sticky'));
  assert.ok(lockedSidebarSpec.sidebarPositionClass.includes('md:top-0'));
  assert.ok(lockedSidebarSpec.sidebarPositionClass.includes('md:h-screen'));
  assert.ok(lockedSidebarSpec.sidebarScrollAreaClass.includes('overflow-y-hidden'));
  assert.ok(lockedSidebarSpec.sidebarScrollAreaClass.includes('sidebar-stable-scroll'));
  assert.ok(lockedSidebarSpec.mainViewportClass.includes('md:overflow-y-auto'));

  const hoveredSidebarSpec = getWorkspaceSidebarScrollSpec(true);
  assert.equal(hoveredSidebarSpec.isHovered, true);
  assert.equal(hoveredSidebarSpec.isFocused, false);
  assert.equal(hoveredSidebarSpec.isProgrammaticScroll, false);
  assert.equal(hoveredSidebarSpec.smoothScrollActive, false);
  assert.equal(hoveredSidebarSpec.scrollBehavior, 'auto');
  assert.equal(hoveredSidebarSpec.scrollMode, 'hover-scroll');
  assert.ok(hoveredSidebarSpec.sidebarScrollAreaClass.includes('overflow-y-auto'));
  assert.ok(hoveredSidebarSpec.sidebarScrollAreaClass.includes('sidebar-stable-scroll'));
  assert.equal(
    hoveredSidebarSpec.sidebarPositionClass,
    lockedSidebarSpec.sidebarPositionClass
  );

  const focusedSidebarSpec = getWorkspaceSidebarScrollSpec(false, { isFocused: true });
  assert.equal(focusedSidebarSpec.isFocused, true);
  assert.equal(focusedSidebarSpec.smoothScrollActive, true);
  assert.equal(focusedSidebarSpec.scrollBehavior, 'smooth');
  assert.equal(focusedSidebarSpec.scrollMode, 'smooth-jump-scroll');
  assert.ok(focusedSidebarSpec.sidebarScrollAreaClass.includes('overflow-y-auto'));
  assert.ok(focusedSidebarSpec.sidebarScrollAreaClass.includes('scroll-smooth'));
  assert.ok(focusedSidebarSpec.sidebarScrollAreaClass.includes('sidebar-smooth-scroll-active'));

  const programmaticJumpSpec = getWorkspaceSidebarScrollSpec(false, {
    isProgrammaticScroll: true,
  });
  assert.equal(programmaticJumpSpec.isProgrammaticScroll, true);
  assert.equal(programmaticJumpSpec.smoothScrollActive, true);
  assert.equal(programmaticJumpSpec.scrollBehavior, 'smooth');
  assert.equal(programmaticJumpSpec.scrollMode, 'smooth-jump-scroll');
  assert.ok(programmaticJumpSpec.sidebarScrollAreaClass.includes('overflow-y-auto'));
  assert.ok(programmaticJumpSpec.sidebarScrollAreaClass.includes('scroll-smooth'));
  assert.ok(programmaticJumpSpec.sidebarScrollAreaClass.includes('sidebar-smooth-scroll-active'));

  // Descriptive tooltips (using Lucide Info icon) for each mood preset in the category drawer
  const deepWorkIdle = getMoodPresetTooltipMeta('deep_work', false);
  assert.equal(deepWorkIdle.presetId, 'deep_work');
  assert.equal(deepWorkIdle.label, 'Deep Work');
  assert.equal(deepWorkIdle.category, 'Productive');
  assert.equal(deepWorkIdle.tone, 'emerald');
  assert.equal(
    deepWorkIdle.definition,
    'Heads-down execution — minimal interruptions'
  );
  assert.equal(
    deepWorkIdle.fullDefinitionText,
    'Deep Work (Productive): Heads-down execution — minimal interruptions'
  );
  assert.equal(deepWorkIdle.tooltipTitle, 'Deep Work · Productive');
  assert.equal(deepWorkIdle.tooltipId, 'mood-category-preset-tooltip-deep_work');
  assert.equal(deepWorkIdle.iconComponent, 'Info');
  assert.equal(deepWorkIdle.isHovered, false);
  assert.equal(deepWorkIdle.isVisible, false);

  const deepWorkHovered = getMoodPresetTooltipMeta('Deep Work', true);
  assert.equal(deepWorkHovered.presetId, 'deep_work');
  assert.equal(deepWorkHovered.isHovered, true);
  assert.equal(deepWorkHovered.isVisible, true);
  assert.equal(deepWorkHovered.iconComponent, 'Info');
  assert.equal(
    deepWorkHovered.definition,
    'Heads-down execution — minimal interruptions'
  );

  for (const preset of ONLINE_MOOD_PRESETS) {
    const meta = getMoodPresetTooltipMeta(preset.id, true);
    assert.equal(meta.presetId, preset.id);
    assert.equal(meta.label, preset.label);
    assert.equal(meta.category, preset.category);
    assert.equal(meta.definition, preset.description);
    assert.equal(meta.iconComponent, 'Info');
    assert.equal(meta.isVisible, true);
    assert.ok(meta.fullDefinitionText.includes(preset.description));
  }

  // 24-hour usage count label metadata for each mood preset button in the mood setter drawer
  const now24hTest = 1_760_500_000_000;
  const recent1h = now24hTest - 60 * 60 * 1000;
  const recent4h = now24hTest - 4 * 60 * 60 * 1000;
  const expired30h = now24hTest - 30 * 60 * 60 * 1000;

  const usageMap = buildMoodPresetUsageCounts24hMap({
    currentUid: 'usr_alice',
    currentUserMood: 'Deep Work',
    nowMs: now24hTest,
    onlinePeers: [
      { uid: 'usr_alice', displayName: 'Alice', mood: 'Deep Work' },
      { uid: 'usr_bob', displayName: 'Bob', mood: 'Deep Work' },
      { uid: 'usr_carol', displayName: 'Carol', mood: 'Brainstorming' },
    ],
    moodEvents: [
      {
        id: 'ev_1',
        uid: 'usr_alice',
        displayName: 'Alice',
        mood: 'Deep Work',
        timestampMs: recent4h,
      },
      {
        id: 'ev_2',
        uid: 'usr_alice',
        displayName: 'Alice',
        mood: 'Deep Work',
        timestampMs: recent1h,
      },
      {
        id: 'ev_3',
        uid: 'usr_dave',
        displayName: 'Dave',
        mood: 'Deep Work',
        timestampMs: recent1h,
      },
      {
        id: 'ev_expired',
        uid: 'usr_eva',
        displayName: 'Eva',
        mood: 'Deep Work',
        timestampMs: expired30h,
      },
      {
        id: 'ev_pair_1',
        uid: 'usr_alice',
        displayName: 'Alice',
        mood: 'Pair Programming',
        timestampMs: recent4h,
      },
    ],
  });

  // Deep Work: 2 logged events by Alice + 1 logged event by Dave + 1 live unlogged peer Bob = 4 uses in 24h (2 user, 2 community)
  const deepWorkUsage = usageMap.deep_work;
  assert.equal(deepWorkUsage.presetId, 'deep_work');
  assert.equal(deepWorkUsage.label, 'Deep Work');
  assert.equal(deepWorkUsage.usageCount24h, 4);
  assert.equal(deepWorkUsage.userUsageCount24h, 2);
  assert.equal(deepWorkUsage.communityUsageCount24h, 2);
  assert.equal(deepWorkUsage.activePeersNow, 2);
  assert.equal(deepWorkUsage.uniquePeers24h, 3);
  assert.equal(deepWorkUsage.usageBadgeLabel, '4 in 24h');
  assert.equal(deepWorkUsage.shortUsageLabel, '4×');
  assert.equal(
    deepWorkUsage.usageSummaryText,
    '4 uses in 24h (2 you · 2 community)'
  );
  assert.equal(deepWorkUsage.hasRecentActivity, true);

  // Pair Programming: 1 logged event by Alice in last 24h
  const pairUsage = getMoodPresetUsageCount24hMeta({
    presetIdOrLabel: 'Pair Programming',
    currentUid: 'usr_alice',
    nowMs: now24hTest,
    moodEvents: [
      {
        id: 'ev_pair_1',
        uid: 'usr_alice',
        displayName: 'Alice',
        mood: 'Pair Programming',
        timestampMs: recent4h,
      },
    ],
  });
  assert.equal(pairUsage.usageCount24h, 1);
  assert.equal(pairUsage.userUsageCount24h, 1);
  assert.equal(pairUsage.communityUsageCount24h, 0);
  assert.equal(pairUsage.usageBadgeLabel, '1 in 24h');
  assert.equal(pairUsage.usageSummaryText, '1 use in 24h (1 you · 0 community)');

  // Coffee Break: 0 uses in last 24h
  assert.equal(usageMap.coffee_break.usageCount24h, 0);
  assert.equal(usageMap.coffee_break.usageBadgeLabel, '0 in 24h');
  assert.equal(usageMap.coffee_break.hasRecentActivity, false);
});

test('Mr. Stranger 24/7 Study Together room lobby builder and 1-click quick-join resolver support Solo study, Group focus | 25 min, Nature sounds, and Study | With Camera', () => {
  assert.equal(MR_STRANGER_COMMUNITY_IMPACT_STATS.length, 5);
  assert.equal(MR_STRANGER_STUDY_PILLARS.length, 3);
  assert.equal(MR_STRANGER_MINDFULNESS_EXERCISES.length, 3);
  assert.equal(MR_STRANGER_247_STUDY_ROOMS.length, 5);

  const lobby = buildMrStrangerStudyTogetherLobby({
    activeRoomCode: 'STUDY-GROUP25',
    currentUid: 'usr_alice',
    currentName: 'Alice',
    currentTimerText: '00:24:10',
    isCameraEnabled: true,
    isMicEnabled: false,
    studyDesks: [
      {
        uid: 'usr_alice',
        displayName: 'Alice',
        roomCode: 'STUDY-GROUP25',
        subject: 'Distributed Systems Raft Lab',
        timerMinutes: 25,
      },
    ],
  });

  assert.equal(lobby.brandName, 'Mr. Stranger');
  assert.equal(lobby.featuredAbcRooms.length, 4);
  assert.deepEqual(
    lobby.featuredAbcRooms.map((r) => r.title),
    [
      'Solo study 📚',
      'Group focus | 25 min ☕',
      'Nature sounds 🌱',
      'Study | With Camera 📖',
    ]
  );

  // Active room is Group focus | 25 min where Alice is seated
  assert.equal(lobby.activeRoomPreset.roomCode, 'STUDY-GROUP25');
  assert.equal(lobby.activeRoomPreset.isCurrentUserSeatedHere, true);
  assert.equal(lobby.activeRoomPreset.ctaLabel, 'Joined · Studying Live');
  assert.equal(lobby.activeRoomPreset.activeScholarsPreview[0].displayName, 'Alice (You)');
  assert.equal(lobby.activeRoomPreset.activeScholarsPreview[0].timerDisplay, '00:24:10');
  assert.equal(lobby.activeRoomPreset.activeScholarsPreview[0].isCurrentUser, true);

  // Resolve 1-click quick join for Nature sounds room
  const natureJoin = resolveStudyTogetherQuickJoinAction({
    roomPresetId: 'nature_sounds',
    currentSubject: 'Distributed Systems & Deep Work',
  });
  assert.equal(natureJoin.roomCode, 'STUDY-NATURE');
  assert.equal(natureJoin.durationMinutes, 60);
  assert.equal(natureJoin.ambientPresetToActivate, 'rainfall');
  assert.equal(natureJoin.roomName, 'Mr. Stranger — Nature sounds');

  // Resolve 1-click quick join for Study | With Camera preserving custom subject
  const cameraJoin = resolveStudyTogetherQuickJoinAction({
    roomPresetId: 'study_with_camera',
    currentSubject: 'Constitutional Law Final Exam',
  });
  assert.equal(cameraJoin.roomCode, 'STUDY-CAMERA');
  assert.equal(cameraJoin.durationMinutes, 120);
  assert.equal(cameraJoin.subject, 'Constitutional Law Final Exam');
  assert.equal(cameraJoin.shouldEnableCameraPreview, true);
});

test('filterMoodCategoryGroupsBySearchQuery filters #online-directory-mood-filter category groupings by mood preset name', () => {
  const countsByMood = {
    'Deep Work': 2,
    'Pair Programming': 1,
    Brainstorming: 3,
    'Quick Questions': 0,
    'Coffee Break': 1,
  };
  const grouped = groupOnlineMoodPresetsByCategory(countsByMood);

  // Empty search returns all 3 categories and all 5 presets
  const emptyRes = filterMoodCategoryGroupsBySearchQuery({
    groupedPresets: grouped,
    searchQuery: '   ',
    countsByMood,
  });
  assert.equal(emptyRes.hasActiveQuery, false);
  assert.equal(emptyRes.filteredGroups.length, 3);
  assert.equal(emptyRes.totalMatchingPresets, 5);
  assert.equal(emptyRes.totalAvailablePresets, 5);
  assert.equal(emptyRes.shortMatchBadgeLabel, '5 presets');

  // Searching "Deep" matches only "Deep Work" in Productive category
  const deepRes = filterMoodCategoryGroupsBySearchQuery({
    groupedPresets: grouped,
    searchQuery: '  deep ',
    countsByMood,
  });
  assert.equal(deepRes.hasActiveQuery, true);
  assert.equal(deepRes.normalizedQuery, 'deep');
  assert.equal(deepRes.filteredGroups.length, 1);
  assert.equal(deepRes.filteredGroups[0].category, 'Productive');
  assert.deepEqual(
    deepRes.filteredGroups[0].presets.map((p) => p.label),
    ['Deep Work']
  );
  assert.equal(deepRes.filteredGroups[0].activeCount, 2);
  assert.equal(deepRes.totalMatchingPresets, 1);
  assert.equal(deepRes.shortMatchBadgeLabel, '1 match');
  assert.equal(
    deepRes.statusLabel,
    'Found 1 matching mood preset in 1 category for "deep"'
  );

  // Searching "Coffee" matches only "Coffee Break" in Away category
  const coffeeRes = filterMoodCategoryGroupsBySearchQuery({
    groupedPresets: grouped,
    searchQuery: 'Coffee',
    countsByMood,
  });
  assert.equal(coffeeRes.filteredGroups.length, 1);
  assert.equal(coffeeRes.filteredGroups[0].category, 'Away');
  assert.deepEqual(
    coffeeRes.filteredGroups[0].presets.map((p) => p.label),
    ['Coffee Break']
  );

  // Searching non-existent preset returns empty filteredGroups and hasMatches: false
  const noMatchRes = filterMoodCategoryGroupsBySearchQuery({
    groupedPresets: grouped,
    searchQuery: 'nonexistent_mood_xyz',
    countsByMood,
  });
  assert.equal(noMatchRes.hasActiveQuery, true);
  assert.equal(noMatchRes.hasMatches, false);
  assert.equal(noMatchRes.totalMatchingPresets, 0);
  assert.equal(noMatchRes.filteredGroups.length, 0);
  assert.equal(noMatchRes.shortMatchBadgeLabel, '0 matches');
  assert.equal(
    noMatchRes.statusLabel,
    'No mood presets match "nonexistent_mood_xyz"'
  );
});

test('getQuickFilterIconCrossFadeSpec and getOnlineDirectoryQuickFilterMeta provide deterministic cross-fade parameters between UserCheck and Filter icons', () => {
  const everyoneSpec = getQuickFilterIconCrossFadeSpec('everyone');
  assert.equal(everyoneSpec.activeIconComponent, 'Filter');
  assert.equal(everyoneSpec.inactiveIconComponent, 'UserCheck');
  assert.equal(everyoneSpec.activeIconKey, 'icon-filter');
  assert.equal(everyoneSpec.animationType, 'cross-fade');
  assert.equal(everyoneSpec.durationMs, 160);
  assert.equal(everyoneSpec.durationSec, 0.16);
  assert.equal(everyoneSpec.easing, 'easeOut');
  assert.equal(everyoneSpec.cubicBezier, 'cubic-bezier(0.16, 1, 0.3, 1)');
  assert.deepEqual(everyoneSpec.initial, { opacity: 0, scale: 0.88 });
  assert.deepEqual(everyoneSpec.animate, { opacity: 1, scale: 1 });
  assert.deepEqual(everyoneSpec.exit, { opacity: 0, scale: 0.88 });
  assert.equal(everyoneSpec.filterLayerState.isActive, true);
  assert.equal(everyoneSpec.filterLayerState.opacity, 1);
  assert.equal(everyoneSpec.filterLayerState.scale, 1);
  assert.equal(everyoneSpec.userCheckLayerState.isActive, false);
  assert.equal(everyoneSpec.userCheckLayerState.opacity, 0);
  assert.equal(everyoneSpec.userCheckLayerState.scale, 0.88);

  const connectionsSpec = getQuickFilterIconCrossFadeSpec('my_connections');
  assert.equal(connectionsSpec.activeIconComponent, 'UserCheck');
  assert.equal(connectionsSpec.inactiveIconComponent, 'Filter');
  assert.equal(connectionsSpec.activeIconKey, 'icon-usercheck');
  assert.equal(connectionsSpec.animationType, 'cross-fade');
  assert.equal(connectionsSpec.durationMs, 160);
  assert.equal(connectionsSpec.userCheckLayerState.isActive, true);
  assert.equal(connectionsSpec.userCheckLayerState.opacity, 1);
  assert.equal(connectionsSpec.userCheckLayerState.scale, 1);
  assert.equal(connectionsSpec.filterLayerState.isActive, false);
  assert.equal(connectionsSpec.filterLayerState.opacity, 0);
  assert.equal(connectionsSpec.filterLayerState.scale, 0.88);

  const metaEveryone = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1' }, { uid: 'p2' }],
  });
  assert.deepEqual(metaEveryone.iconCrossFadeMotion, everyoneSpec);

  const metaConnections = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1' }, { uid: 'p2' }],
    acceptedPeerUids: ['p1'],
  });
  assert.deepEqual(metaConnections.iconCrossFadeMotion, connectionsSpec);
});

test('getQuickFilterIconHoverGlowSpec and getOnlineDirectoryQuickFilterMeta resolve soft glow effect for #online-directory-mood-filter icon on hover', () => {
  const restEveryone = getQuickFilterIconHoverGlowSpec({
    mode: 'everyone',
    isHovered: false,
  });
  assert.equal(restEveryone.mode, 'everyone');
  assert.equal(restEveryone.isHovered, false);
  assert.equal(restEveryone.isGlowActive, false);
  assert.equal(restEveryone.glowTone, 'emerald-soft');
  assert.equal(restEveryone.transitionDurationMs, 180);
  assert.equal(restEveryone.containerBoxShadow, 'none');
  assert.equal(restEveryone.svgDropShadowFilter, 'none');

  const hoverEveryone = getQuickFilterIconHoverGlowSpec({
    mode: 'everyone',
    isHovered: true,
  });
  assert.equal(hoverEveryone.mode, 'everyone');
  assert.equal(hoverEveryone.isHovered, true);
  assert.equal(hoverEveryone.isGlowActive, true);
  assert.equal(hoverEveryone.glowTone, 'emerald-soft');
  assert.equal(
    hoverEveryone.containerBoxShadow,
    '0 0 12px rgba(52, 211, 153, 0.32), 0 0 4px rgba(244, 244, 245, 0.22)'
  );
  assert.equal(
    hoverEveryone.svgDropShadowFilter,
    'drop-shadow(0 0 5px rgba(52, 211, 153, 0.5))'
  );

  const hoverConnections = getQuickFilterIconHoverGlowSpec({
    mode: 'my_connections',
    isHovered: true,
  });
  assert.equal(hoverConnections.mode, 'my_connections');
  assert.equal(hoverConnections.isHovered, true);
  assert.equal(hoverConnections.isGlowActive, true);
  assert.equal(hoverConnections.glowTone, 'emerald');
  assert.equal(
    hoverConnections.containerBoxShadow,
    '0 0 12px rgba(52, 211, 153, 0.42), 0 0 4px rgba(16, 185, 129, 0.28)'
  );
  assert.equal(
    hoverConnections.svgDropShadowFilter,
    'drop-shadow(0 0 5px rgba(52, 211, 153, 0.65))'
  );

  const metaHovered = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1' }],
    isHovered: true,
  });
  assert.deepEqual(metaHovered.iconHoverGlow, hoverEveryone);
});

test('buildOnlineDirectoryFilterShareLink and parseOnlineDirectoryFilterShareParams build and parse shareable filter status and category URLs', () => {
  const defaultShare = buildOnlineDirectoryFilterShareLink({
    origin: 'http://localhost:3000',
    pathname: '/',
    audienceFilter: 'everyone',
    moodFilter: 'all',
    onlyInFocus: false,
    isCopied: false,
  });
  assert.equal(defaultShare.shareUrl, 'http://localhost:3000/?filter=everyone&category=all');
  assert.equal(defaultShare.audienceMode, 'everyone');
  assert.equal(defaultShare.statusLabel, 'Everyone');
  assert.equal(defaultShare.categoryParam, 'all');
  assert.equal(defaultShare.moodParam, 'all');
  assert.equal(defaultShare.categoryDisplayLabel, 'All Moods');
  assert.equal(defaultShare.summaryLabel, 'Everyone · All Moods');
  assert.equal(defaultShare.isCopied, false);
  assert.equal(defaultShare.iconFeedbackState, 'idle');
  assert.equal(defaultShare.iconFeedbackLabel, 'Copy Link');
  assert.equal(defaultShare.copiedBadgeText, 'Copied!');
  assert.equal(
    defaultShare.containerAriaLabel,
    'Copy shareable link for current filter (Everyone · All Moods)'
  );

  const categoryShare = buildOnlineDirectoryFilterShareLink({
    origin: 'http://localhost:3000',
    pathname: '/',
    audienceFilter: 'my_connections',
    moodFilter: 'category:Productive',
    onlyInFocus: true,
    isCopied: true,
  });
  assert.equal(
    categoryShare.shareUrl,
    'http://localhost:3000/?filter=my_connections&category=Productive&focus=1'
  );
  assert.equal(categoryShare.statusLabel, 'My Connections');
  assert.equal(categoryShare.categoryParam, 'Productive');
  assert.equal(categoryShare.moodParam, 'Productive');
  assert.equal(categoryShare.categoryDisplayLabel, 'Productive');
  assert.equal(categoryShare.summaryLabel, 'My Connections · Productive · In Focus');
  assert.equal(categoryShare.isCopied, true);
  assert.equal(categoryShare.iconFeedbackState, 'Copied!');
  assert.equal(categoryShare.iconFeedbackLabel, 'Copied!');
  assert.equal(
    categoryShare.containerAriaLabel,
    'Copied! (My Connections · Productive · In Focus)'
  );

  const parsedCategory = parseOnlineDirectoryFilterShareParams(
    '?filter=my_connections&category=Productive&focus=1'
  );
  assert.equal(parsedCategory.hasFilterParams, true);
  assert.equal(parsedCategory.audienceFilter, 'my_connections');
  assert.equal(parsedCategory.moodFilter, 'category:Productive');
  assert.equal(parsedCategory.onlyInFocus, true);

  const parsedPreset = parseOnlineDirectoryFilterShareParams(
    '?filter=everyone&mood=Deep+Work'
  );
  assert.equal(parsedPreset.hasFilterParams, true);
  assert.equal(parsedPreset.audienceFilter, 'everyone');
  assert.equal(parsedPreset.moodFilter, 'Deep Work');
  assert.equal(parsedPreset.onlyInFocus, false);

  const metaWithShare = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1' }],
    moodFilter: 'category:Social',
    origin: 'http://localhost:3000',
    pathname: '/',
    isShareLinkCopied: true,
  });
  assert.equal(
    metaWithShare.shareLinkMeta.shareUrl,
    'http://localhost:3000/?filter=my_connections&category=Social'
  );
  assert.equal(metaWithShare.shareLinkMeta.isCopied, true);
  assert.equal(metaWithShare.shareLinkMeta.iconFeedbackState, 'Copied!');
});

test('getQuickFilterIconPulseSpec and getOnlineDirectoryQuickFilterMeta activate subtle pulse animation on filter icon when a specific filter mode is active (not all)', () => {
  const defaultUnconstrained = getQuickFilterIconPulseSpec({
    mode: 'everyone',
    moodFilter: 'all',
    onlyInFocus: false,
  });
  assert.equal(defaultUnconstrained.isDirectoryConstrained, false);
  assert.equal(defaultUnconstrained.isPulseActive, false);
  assert.equal(defaultUnconstrained.isAudienceConstrained, false);
  assert.equal(defaultUnconstrained.isMoodConstrained, false);
  assert.equal(defaultUnconstrained.isFocusConstrained, false);
  assert.equal(defaultUnconstrained.activeConstraintReason, 'none');
  assert.equal(defaultUnconstrained.animationName, 'none');
  assert.equal(defaultUnconstrained.svgAnimationName, 'none');
  assert.equal(defaultUnconstrained.cssClassName, '');
  assert.equal(defaultUnconstrained.svgCssClassName, '');
  assert.deepEqual(defaultUnconstrained.scaleKeyframes, [1, 1, 1]);
  assert.deepEqual(defaultUnconstrained.opacityKeyframes, [1, 1, 1]);

  const allStringMode = getQuickFilterIconPulseSpec({
    mode: 'all',
    moodFilter: 'ALL',
    onlyInFocus: false,
  });
  assert.equal(allStringMode.isDirectoryConstrained, false);
  assert.equal(allStringMode.isPulseActive, false);
  assert.equal(allStringMode.iconColorTone, 'zinc-neutral');
  assert.equal(allStringMode.iconColorClass, 'text-zinc-300');
  assert.deepEqual(allStringMode.colorKeyframes, ['#d4d4d8', '#d4d4d8', '#d4d4d8']);
  assert.equal(allStringMode.emeraldGlowDropShadow, 'none');

  const connectionsConstrained = getQuickFilterIconPulseSpec({
    mode: 'my_connections',
    moodFilter: 'all',
    onlyInFocus: false,
  });
  assert.equal(connectionsConstrained.isDirectoryConstrained, true);
  assert.equal(connectionsConstrained.isPulseActive, true);
  assert.equal(connectionsConstrained.isAudienceConstrained, true);
  assert.equal(connectionsConstrained.isMoodConstrained, false);
  assert.equal(connectionsConstrained.activeConstraintReason, 'my_connections');
  assert.equal(connectionsConstrained.animationName, 'quickFilterIconSubtlePulse');
  assert.equal(connectionsConstrained.svgAnimationName, 'quickFilterSvgSubtlePulse');
  assert.equal(connectionsConstrained.cssClassName, 'quick-filter-icon-pulse-active');
  assert.equal(connectionsConstrained.svgCssClassName, 'quick-filter-icon-svg-pulse');
  assert.equal(connectionsConstrained.iconColorTone, 'emerald-glow');
  assert.equal(connectionsConstrained.iconColorClass, 'text-emerald-300');
  assert.deepEqual(connectionsConstrained.colorKeyframes, [
    '#6ee7b7',
    '#a7f3d0',
    '#6ee7b7',
  ]);
  assert.equal(
    connectionsConstrained.emeraldGlowDropShadow,
    'drop-shadow(0 0 6px rgba(52, 211, 153, 0.72))'
  );
  assert.equal(connectionsConstrained.durationMs, 2200);
  assert.equal(connectionsConstrained.iterationCount, 'infinite');
  assert.deepEqual(connectionsConstrained.scaleKeyframes, [1, 1.08, 1]);
  assert.deepEqual(connectionsConstrained.opacityKeyframes, [1, 0.94, 1]);

  const moodConstrained = getQuickFilterIconPulseSpec({
    mode: 'everyone',
    moodFilter: 'category:Productive',
    onlyInFocus: false,
  });
  assert.equal(moodConstrained.isDirectoryConstrained, true);
  assert.equal(moodConstrained.isPulseActive, true);
  assert.equal(moodConstrained.isAudienceConstrained, false);
  assert.equal(moodConstrained.isMoodConstrained, true);
  assert.equal(moodConstrained.activeConstraintReason, 'mood_filter');
  assert.equal(moodConstrained.animationName, 'quickFilterIconSubtlePulse');
  assert.equal(moodConstrained.iconColorTone, 'emerald-glow');
  assert.equal(moodConstrained.iconColorClass, 'text-emerald-300');

  const bothConstrained = getQuickFilterIconPulseSpec({
    mode: 'my_connections',
    moodFilter: 'Deep Work',
    onlyInFocus: true,
  });
  assert.equal(bothConstrained.isDirectoryConstrained, true);
  assert.equal(bothConstrained.isPulseActive, true);
  assert.equal(bothConstrained.activeConstraintReason, 'connections_and_mood');

  const metaUnconstrained = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1' }],
    moodFilter: 'all',
    onlyInFocus: false,
  });
  assert.equal(metaUnconstrained.isDirectoryConstrained, false);
  assert.equal(metaUnconstrained.iconPulseSpec.isPulseActive, false);
  assert.equal(metaUnconstrained.iconPulseSpec.iconColorTone, 'zinc-neutral');

  const metaMoodActive = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1' }],
    moodFilter: 'category:Productive',
    onlyInFocus: false,
  });
  assert.equal(metaMoodActive.isDirectoryConstrained, true);
  assert.equal(metaMoodActive.iconPulseSpec.isPulseActive, true);
  assert.equal(metaMoodActive.iconPulseSpec.activeConstraintReason, 'mood_filter');
  assert.equal(metaMoodActive.iconPulseSpec.iconColorTone, 'emerald-glow');
  assert.deepEqual(metaMoodActive.iconPulseSpec.colorKeyframes, [
    '#6ee7b7',
    '#a7f3d0',
    '#6ee7b7',
  ]);
});

test('resolveQuickFilterToggleChime and getOnlineDirectoryQuickFilterMeta resolve playSubtleUiChime specs when #online-directory-mood-filter is toggled', () => {
  const activateChime = resolveQuickFilterToggleChime({
    currentMode: 'everyone',
  });
  assert.equal(activateChime.utilityName, 'playSubtleUiChime');
  assert.equal(activateChime.currentMode, 'everyone');
  assert.equal(activateChime.nextMode, 'my_connections');
  assert.equal(activateChime.chimeType, 'start');
  assert.equal(activateChime.shouldPlay, true);
  assert.deepEqual(activateChime.chime.frequenciesHz, [523.25, 659.25]);
  assert.equal(activateChime.chime.noteNames, 'C5 → E5 Focus Start');
  assert.equal(
    activateChime.feedbackMessage,
    'Filter chime played: My Connections active (C5 → E5 Focus Start)'
  );

  const resetChime = resolveQuickFilterToggleChime({
    currentMode: 'my_connections',
  });
  assert.equal(resetChime.utilityName, 'playSubtleUiChime');
  assert.equal(resetChime.currentMode, 'my_connections');
  assert.equal(resetChime.nextMode, 'everyone');
  assert.equal(resetChime.chimeType, 'end');
  assert.equal(resetChime.shouldPlay, true);
  assert.deepEqual(resetChime.chime.frequenciesHz, [659.25, 493.88]);
  assert.equal(resetChime.chime.noteNames, 'E5 → B4 Focus End');
  assert.equal(
    resetChime.feedbackMessage,
    'Filter chime played: Reset to Everyone (E5 → B4 Focus End)'
  );

  const mutedChime = resolveQuickFilterToggleChime({
    currentMode: 'everyone',
    preferences: {
      ...DEFAULT_UI_SOUND_PREFERENCES,
      enabled: false,
    },
  });
  assert.equal(mutedChime.shouldPlay, false);
  assert.equal(
    mutedChime.feedbackMessage,
    'Filter toggled: My Connections active (Sound alerts muted)'
  );

  const metaEveryone = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1' }],
  });
  assert.equal(metaEveryone.toggleChimeSpec.utilityName, 'playSubtleUiChime');
  assert.equal(metaEveryone.toggleChimeSpec.chimeType, 'start');

  const metaConnections = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1' }],
  });
  assert.equal(metaConnections.toggleChimeSpec.utilityName, 'playSubtleUiChime');
  assert.equal(metaConnections.toggleChimeSpec.chimeType, 'end');
});

test('getQuickFilterResetFlashBounceSpec and getOnlineDirectoryQuickFilterMeta trigger CSS flash/bounce effect when filter is reset to all', () => {
  const idleSpec = getQuickFilterResetFlashBounceSpec({
    isResetFlashActive: false,
  });
  assert.equal(idleSpec.isResetToAllTransition, false);
  assert.equal(idleSpec.isResetFlashActive, false);
  assert.equal(idleSpec.animationName, 'none');
  assert.equal(idleSpec.cssClassName, '');
  assert.deepEqual(idleSpec.scaleKeyframes, [1, 1, 1, 1]);
  assert.equal(idleSpec.flashBoxShadow, 'none');

  const moodResetTransition = getQuickFilterResetFlashBounceSpec({
    previousMoodFilter: 'category:Productive',
    nextMoodFilter: 'all',
  });
  assert.equal(moodResetTransition.isResetToAllTransition, true);
  assert.equal(moodResetTransition.isResetFlashActive, true);
  assert.equal(moodResetTransition.animationName, 'quickFilterResetFlashBounce');
  assert.equal(moodResetTransition.cssClassName, 'quick-filter-reset-flash-bounce');
  assert.equal(moodResetTransition.durationMs, 520);
  assert.deepEqual(moodResetTransition.scaleKeyframes, [1, 1.06, 0.98, 1]);
  assert.equal(
    moodResetTransition.confirmationLabel,
    'Constraint removed · Showing all'
  );

  const audienceResetTransition = getQuickFilterResetFlashBounceSpec({
    previousMode: 'my_connections',
    nextMode: 'everyone',
  });
  assert.equal(audienceResetTransition.isResetToAllTransition, true);
  assert.equal(audienceResetTransition.isResetFlashActive, true);
  assert.equal(audienceResetTransition.animationName, 'quickFilterResetFlashBounce');

  const nonResetTransition = getQuickFilterResetFlashBounceSpec({
    previousMoodFilter: 'all',
    nextMoodFilter: 'category:Social',
  });
  assert.equal(nonResetTransition.isResetToAllTransition, false);
  assert.equal(nonResetTransition.isResetFlashActive, false);

  const metaWithFlash = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1' }],
    moodFilter: 'all',
    isResetFlashActive: true,
  });
  assert.equal(metaWithFlash.resetFlashSpec.isResetFlashActive, true);
  assert.equal(
    metaWithFlash.resetFlashSpec.animationName,
    'quickFilterResetFlashBounce'
  );
  assert.equal(
    metaWithFlash.resetFlashSpec.cssClassName,
    'quick-filter-reset-flash-bounce'
  );
});

test('resolveZeroPeersMoodFilterNotice and getOnlineDirectoryQuickFilterMeta display non-intrusive tooltip/toast suggestion when a mood filter yields zero online peers', () => {
  const allMoodsNotice = resolveZeroPeersMoodFilterNotice({
    moodFilter: 'all',
    audienceFilter: 'everyone',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
  });
  assert.equal(allMoodsNotice.isMoodFilterActive, false);
  assert.equal(allMoodsNotice.isZeroMatchingPeers, false);
  assert.equal(allMoodsNotice.shouldShowNotice, false);
  assert.equal(allMoodsNotice.displayedPeersCount, 1);
  assert.equal(allMoodsNotice.tone, 'neutral');

  const zeroMatchingMoodNotice = resolveZeroPeersMoodFilterNotice({
    moodFilter: 'Taking a Break',
    audienceFilter: 'everyone',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
  });
  assert.equal(zeroMatchingMoodNotice.isMoodFilterActive, true);
  assert.equal(zeroMatchingMoodNotice.isZeroMatchingPeers, true);
  assert.equal(zeroMatchingMoodNotice.shouldShowNotice, true);
  assert.equal(zeroMatchingMoodNotice.moodDisplayLabel, 'Taking a Break');
  assert.equal(zeroMatchingMoodNotice.displayedPeersCount, 0);
  assert.equal(
    zeroMatchingMoodNotice.headline,
    '0 online peers match "Taking a Break"'
  );
  assert.equal(
    zeroMatchingMoodNotice.suggestionText,
    'No online peers currently match "Taking a Break" — try widening your criteria to All Moods.'
  );
  assert.equal(zeroMatchingMoodNotice.actionLabel, 'Widen Criteria');
  assert.equal(zeroMatchingMoodNotice.tone, 'amber');

  const matchingMoodNotice = resolveZeroPeersMoodFilterNotice({
    moodFilter: 'category:Productive',
    audienceFilter: 'everyone',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
  });
  assert.equal(matchingMoodNotice.isMoodFilterActive, true);
  assert.equal(matchingMoodNotice.isZeroMatchingPeers, false);
  assert.equal(matchingMoodNotice.shouldShowNotice, false);
  assert.equal(matchingMoodNotice.displayedPeersCount, 1);

  const metaZeroPeers = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'category:Away',
    displayedPeersCount: 0,
  });
  assert.equal(metaZeroPeers.zeroPeersNotice.shouldShowNotice, true);
  assert.equal(metaZeroPeers.zeroPeersNotice.moodDisplayLabel, 'Away');
  assert.equal(metaZeroPeers.zeroPeersNotice.displayedPeersCount, 0);
  assert.equal(
    metaZeroPeers.zeroPeersNotice.suggestionText,
    'No online peers currently match "Away" — try widening your criteria to All Moods.'
  );
});

test('evaluateMoodCategoryDrawersToggleState, toggleAllMoodCategoryDrawers, and toggleSingleMoodCategoryDrawer simultaneously expand or collapse all mood category drawers', () => {
  // Default state on first load: only Productive category drawer expanded (1/3), keeping Social & Away collapsed
  const initialState = evaluateMoodCategoryDrawersToggleState({
    isMainDrawerExpanded: true,
    categoryExpansionMap: DEFAULT_MOOD_CATEGORY_DRAWER_EXPANSION_MAP,
  });
  assert.equal(initialState.isMainDrawerExpanded, true);
  assert.equal(initialState.defaultOpenedCategory, 'Productive');
  assert.equal(initialState.isDefaultSingleCategoryState, true);
  assert.equal(initialState.areAllDrawersExpanded, false);
  assert.equal(initialState.isAnyDrawerExpanded, true);
  assert.equal(initialState.expandedCount, 1);
  assert.equal(initialState.totalCount, 3);
  assert.deepEqual(initialState.expandedCategories, ['Productive']);
  assert.deepEqual(initialState.collapsedCategories, ['Social', 'Away']);
  assert.equal(initialState.nextAction, 'expand_all');
  assert.equal(initialState.toggleAllButtonLabel, 'Toggle All');
  assert.equal(initialState.statusBadgeLabel, 'Toggle All (1/3)');

  // Clicking Toggle All from the default 1/3 state expands every category drawer simultaneously (3/3)
  const expandedAllFromDefault = toggleAllMoodCategoryDrawers({
    isMainDrawerExpanded: initialState.isMainDrawerExpanded,
    categoryExpansionMap: initialState.categoryExpansionMap,
  });
  assert.equal(expandedAllFromDefault.isMainDrawerExpanded, true);
  assert.equal(expandedAllFromDefault.areAllDrawersExpanded, true);
  assert.equal(expandedAllFromDefault.expandedCount, 3);
  assert.equal(expandedAllFromDefault.nextAction, 'collapse_all');
  assert.equal(expandedAllFromDefault.statusBadgeLabel, 'Toggle All (3/3)');

  // Clicking Toggle All when all expanded collapses every category drawer simultaneously (0/3)
  const collapsedAllState = toggleAllMoodCategoryDrawers({
    isMainDrawerExpanded: expandedAllFromDefault.isMainDrawerExpanded,
    categoryExpansionMap: expandedAllFromDefault.categoryExpansionMap,
  });
  assert.equal(collapsedAllState.isMainDrawerExpanded, false);
  assert.equal(collapsedAllState.areAllDrawersExpanded, false);
  assert.equal(collapsedAllState.isAnyDrawerExpanded, false);
  assert.equal(collapsedAllState.expandedCount, 0);
  assert.equal(collapsedAllState.totalCount, 3);
  assert.deepEqual(collapsedAllState.categoryExpansionMap, {
    Productive: false,
    Social: false,
    Away: false,
  });
  assert.equal(collapsedAllState.nextAction, 'expand_all');
  assert.equal(collapsedAllState.statusBadgeLabel, 'Toggle All (0/3)');

  // Clicking Toggle All again when collapsed expands every category drawer simultaneously (3/3)
  const reExpandedAllState = toggleAllMoodCategoryDrawers({
    isMainDrawerExpanded: collapsedAllState.isMainDrawerExpanded,
    categoryExpansionMap: collapsedAllState.categoryExpansionMap,
  });
  assert.equal(reExpandedAllState.isMainDrawerExpanded, true);
  assert.equal(reExpandedAllState.areAllDrawersExpanded, true);
  assert.equal(reExpandedAllState.expandedCount, 3);
  assert.deepEqual(reExpandedAllState.categoryExpansionMap, {
    Productive: true,
    Social: true,
    Away: true,
  });

  // Toggling a single category drawer (e.g. Away -> false) leaves 2/3 expanded; Toggle All then expands all 3/3
  const partialState = toggleSingleMoodCategoryDrawer({
    category: 'Away',
    isMainDrawerExpanded: true,
    categoryExpansionMap: reExpandedAllState.categoryExpansionMap,
  });
  assert.equal(partialState.isMainDrawerExpanded, true);
  assert.equal(partialState.areAllDrawersExpanded, false);
  assert.equal(partialState.isAnyDrawerExpanded, true);
  assert.equal(partialState.expandedCount, 2);
  assert.equal(partialState.nextAction, 'expand_all');
  assert.equal(partialState.statusBadgeLabel, 'Toggle All (2/3)');

  const syncedFromPartial = toggleAllMoodCategoryDrawers({
    isMainDrawerExpanded: partialState.isMainDrawerExpanded,
    categoryExpansionMap: partialState.categoryExpansionMap,
  });
  assert.equal(syncedFromPartial.areAllDrawersExpanded, true);
  assert.equal(syncedFromPartial.expandedCount, 3);

  // Verify getOnlineDirectoryQuickFilterMeta exposes moodDrawersToggleAll
  const metaWithDrawers = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    isMainDrawerExpanded: false,
    categoryExpansionMap: { Productive: false, Social: false, Away: false },
  });
  assert.equal(metaWithDrawers.moodDrawersToggleAll.areAllDrawersExpanded, false);
  assert.equal(metaWithDrawers.moodDrawersToggleAll.expandedCount, 0);
  assert.equal(metaWithDrawers.moodDrawersToggleAll.toggleAllButtonLabel, 'Toggle All');
});

test('resolveSecondaryResetOnlyFilterAction, resolveOnlineDirectoryFilterToggleAction with Shift, and getOnlineDirectoryQuickFilterMeta reset active filters without triggering the full modal dialog', () => {
  // 1. Shift+Click on main filter toggle bypasses modal and resets to everyone
  assert.deepEqual(
    resolveOnlineDirectoryFilterToggleAction('my_connections', { shiftKey: true }),
    {
      nextMode: 'everyone',
      shouldOpenClearModal: false,
    }
  );

  // 2. Secondary reset-only action with Shift key held resets audience, mood, and focus filters without opening modal
  const shiftResetSpec = resolveSecondaryResetOnlyFilterAction({
    shiftKey: true,
    currentMode: 'my_connections',
    moodFilter: 'category:Productive',
    onlyInFocus: true,
    requireShiftKeyForModalBypass: true,
  });
  assert.equal(shiftResetSpec.buttonId, 'online-directory-mood-filter-reset-only');
  assert.equal(shiftResetSpec.label, 'Reset');
  assert.equal(shiftResetSpec.shortcutLabel, '⇧ Reset');
  assert.equal(shiftResetSpec.modifierKey, 'Shift');
  assert.equal(shiftResetSpec.isShiftHeld, true);
  assert.equal(shiftResetSpec.isAnyFilterActive, true);
  assert.equal(shiftResetSpec.activeFiltersCount, 3);
  assert.equal(shiftResetSpec.shouldBypassModal, true);
  assert.equal(shiftResetSpec.shouldOpenClearModal, false);
  assert.equal(shiftResetSpec.didQuickReset, true);
  assert.equal(shiftResetSpec.nextMode, 'everyone');
  assert.equal(shiftResetSpec.nextMoodFilter, 'all');
  assert.equal(shiftResetSpec.nextOnlyInFocus, false);
  assert.equal(shiftResetSpec.isModalOpen, false);

  // 3. When requireShiftKeyForModalBypass is true and Shift is NOT held while my_connections is active
  const nonShiftModalRequired = resolveSecondaryResetOnlyFilterAction({
    shiftKey: false,
    currentMode: 'my_connections',
    moodFilter: 'Deep Work',
    onlyInFocus: false,
    requireShiftKeyForModalBypass: true,
  });
  assert.equal(nonShiftModalRequired.isShiftHeld, false);
  assert.equal(nonShiftModalRequired.shouldBypassModal, false);
  assert.equal(nonShiftModalRequired.shouldOpenClearModal, true);
  assert.equal(nonShiftModalRequired.didQuickReset, false);
  assert.equal(nonShiftModalRequired.isModalOpen, true);

  // 4. getOnlineDirectoryQuickFilterMeta exposes resetOnlyButtonMeta
  const metaWithShift = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'Deep Work',
    onlyInFocus: true,
    isShiftKeyHeld: true,
  });
  assert.equal(
    metaWithShift.resetOnlyButtonMeta.buttonId,
    'online-directory-mood-filter-reset-only'
  );
  assert.equal(metaWithShift.resetOnlyButtonMeta.isShiftHeld, true);
  assert.equal(metaWithShift.resetOnlyButtonMeta.isAnyFilterActive, true);
  assert.equal(metaWithShift.resetOnlyButtonMeta.activeFiltersCount, 3);
  assert.equal(metaWithShift.resetOnlyButtonMeta.shouldBypassModal, true);
  assert.equal(metaWithShift.resetOnlyButtonMeta.shouldOpenClearModal, false);
});

test('getQuickFilterIconActiveBadgeSpec and getOnlineDirectoryQuickFilterMeta visually shift the filter icon and display an Active badge whenever mood, focus, or audience criteria is applied', () => {
  // 1. Idle (no criteria applied)
  const idleSpec = getQuickFilterIconActiveBadgeSpec({
    mode: 'everyone',
    moodFilter: 'all',
    onlyInFocus: false,
  });
  assert.equal(idleSpec.isAnyCriteriaApplied, false);
  assert.equal(idleSpec.showActiveBadge, false);
  assert.equal(idleSpec.appliedCriteriaCount, 0);
  assert.deepEqual(idleSpec.appliedCriteriaKeys, []);
  assert.equal(idleSpec.badgeLabel, 'IDLE');
  assert.equal(idleSpec.badgeDisplayText, 'Idle');
  assert.equal(idleSpec.isIconShifted, false);
  assert.equal(idleSpec.iconShiftClassName, '');

  // 2. Mood criterion applied only
  const moodOnlySpec = getQuickFilterIconActiveBadgeSpec({
    mode: 'everyone',
    moodFilter: 'category:Productive',
    onlyInFocus: false,
  });
  assert.equal(moodOnlySpec.isMoodApplied, true);
  assert.equal(moodOnlySpec.isFocusApplied, false);
  assert.equal(moodOnlySpec.isAudienceApplied, false);
  assert.equal(moodOnlySpec.isAnyCriteriaApplied, true);
  assert.equal(moodOnlySpec.showActiveBadge, true);
  assert.equal(moodOnlySpec.appliedCriteriaCount, 1);
  assert.deepEqual(moodOnlySpec.appliedCriteriaKeys, ['mood']);
  assert.equal(moodOnlySpec.badgeLabel, 'ACTIVE');
  assert.equal(moodOnlySpec.badgeDisplayText, 'Active');
  assert.equal(moodOnlySpec.isIconShifted, true);
  assert.equal(moodOnlySpec.iconShiftClassName, 'quick-filter-icon-criteria-shifted');

  // 3. Focus criterion applied only
  const focusOnlySpec = getQuickFilterIconActiveBadgeSpec({
    mode: 'everyone',
    moodFilter: 'all',
    onlyInFocus: true,
  });
  assert.equal(focusOnlySpec.isFocusApplied, true);
  assert.equal(focusOnlySpec.showActiveBadge, true);
  assert.equal(focusOnlySpec.appliedCriteriaCount, 1);
  assert.deepEqual(focusOnlySpec.appliedCriteriaKeys, ['focus']);
  assert.equal(focusOnlySpec.badgeDisplayText, 'Active');
  assert.equal(focusOnlySpec.isIconShifted, true);

  // 4. All three criteria applied (mood + focus + audience)
  const allThreeMeta = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'Deep Work',
    onlyInFocus: true,
  });
  assert.equal(allThreeMeta.iconActiveBadgeSpec.isAnyCriteriaApplied, true);
  assert.equal(allThreeMeta.iconActiveBadgeSpec.showActiveBadge, true);
  assert.equal(allThreeMeta.iconActiveBadgeSpec.appliedCriteriaCount, 3);
  assert.deepEqual(allThreeMeta.iconActiveBadgeSpec.appliedCriteriaKeys, [
    'mood',
    'focus',
    'audience',
  ]);
  assert.equal(allThreeMeta.iconActiveBadgeSpec.badgeDisplayText, 'Active · 3');
  assert.equal(allThreeMeta.iconActiveBadgeSpec.isIconShifted, true);
  assert.equal(
    allThreeMeta.iconActiveBadgeSpec.iconShiftTransform,
    'translateY(-1px) rotate(-6deg) scale(1.08)'
  );
});

test('Recent Filters dropdown records, deduplicates, caps at 5 combinations, and re-applies any of the last 5 filter combinations', () => {
  assert.equal(MAX_RECENT_DIRECTORY_FILTER_COMBINATIONS, 5);
  assert.equal(DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS.length, 5);

  // 1. Record 6 distinct filter combinations and verify cap at 5 with most recent first
  let history = DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS;
  history = recordRecentDirectoryFilterCombination(history, {
    audienceFilter: 'my_connections',
    moodFilter: 'Brainstorming',
    onlyInFocus: true,
    timestampMs: 1_760_000_010_000,
  });
  assert.equal(history.length, 5);
  assert.equal(history[0].moodFilter, 'Brainstorming');
  assert.equal(history[0].audienceFilter, 'my_connections');
  assert.equal(history[0].onlyInFocus, true);
  assert.equal(history[0].label, 'Brainstorming · My Connections · In Focus');

  // 2. Re-recording an existing combination deduplicates and moves it to rank 1
  const targetExisting = history[3];
  history = recordRecentDirectoryFilterCombination(history, {
    audienceFilter: targetExisting.audienceFilter,
    moodFilter: targetExisting.moodFilter,
    onlyInFocus: targetExisting.onlyInFocus,
    timestampMs: 1_760_000_020_000,
  });
  assert.equal(history.length, 5);
  assert.equal(history[0].id, targetExisting.id);

  // 3. Applying one of the last 5 combinations by id or index returns its filter state and promotes it to rank 1
  const fourthCombo = history[4];
  const applied = applyRecentDirectoryFilterCombination(
    history,
    fourthCombo.id,
    1_760_000_030_000
  );
  assert.equal(applied.found, true);
  assert.equal(applied.audienceFilter, fourthCombo.audienceFilter);
  assert.equal(applied.moodFilter, fourthCombo.moodFilter);
  assert.equal(applied.onlyInFocus, fourthCombo.onlyInFocus);
  assert.equal(applied.updatedHistory.length, 5);
  assert.equal(applied.updatedHistory[0].id, fourthCombo.id);

  // 4. Dropdown metadata marks the currently active combination and exposes 5 options
  const dropdownMeta = getRecentDirectoryFiltersDropdownMeta({
    history: applied.updatedHistory,
    currentAudienceFilter: applied.audienceFilter,
    currentMoodFilter: applied.moodFilter,
    currentOnlyInFocus: applied.onlyInFocus,
    isOpen: true,
  });
  assert.equal(dropdownMeta.dropdownLabel, 'Recent Filters');
  assert.equal(dropdownMeta.count, 5);
  assert.equal(dropdownMeta.maxItems, 5);
  assert.equal(dropdownMeta.badgeText, '5/5');
  assert.equal(dropdownMeta.isOpen, true);
  assert.equal(dropdownMeta.options[0].isCurrentlyActive, true);
  assert.equal(dropdownMeta.options[0].rank, 1);
  assert.equal(dropdownMeta.options[4].rank, 5);
});

test('Holding Shift to reset filters triggers an animated toast confirmation explicitly stating "Filters Reset to Default" at the bottom of the directory view', () => {
  // 1. Direct toast spec when visible after Shift+Click reset
  const toastActive = resolveShiftResetToastConfirmation({
    isVisible: true,
    shiftKeyUsed: true,
    triggerCount: 2,
  });
  assert.equal(toastActive.toastId, 'online-directory-shift-reset-toast');
  assert.equal(toastActive.message, 'Filters Reset to Default');
  assert.equal(toastActive.position, 'bottom-of-directory-view');
  assert.equal(toastActive.isShiftHeld, true);
  assert.equal(toastActive.isVisible, true);
  assert.equal(toastActive.shouldShowToast, true);
  assert.equal(toastActive.triggerCount, 2);
  assert.equal(toastActive.animationName, 'shiftResetToastSlideFadeIn');
  assert.equal(toastActive.cssClassName, 'shift-reset-toast-animated');
  assert.deepEqual(toastActive.motion.initial, { opacity: 0, y: 10, scale: 0.96 });
  assert.deepEqual(toastActive.motion.animate, { opacity: 1, y: 0, scale: 1 });

  // 2. resolveSecondaryResetOnlyFilterAction with Shift held sets shouldTriggerShiftResetToast and toastConfirmationText
  const shiftResetAction = resolveSecondaryResetOnlyFilterAction({
    shiftKey: true,
    currentMode: 'my_connections',
    moodFilter: 'category:Productive',
    onlyInFocus: true,
  });
  assert.equal(shiftResetAction.shouldTriggerShiftResetToast, true);
  assert.equal(shiftResetAction.toastConfirmationText, 'Filters Reset to Default');
  assert.equal(shiftResetAction.shiftResetToastSpec.message, 'Filters Reset to Default');
  assert.equal(shiftResetAction.shiftResetToastSpec.shouldShowToast, true);

  // 3. getOnlineDirectoryQuickFilterMeta exposes shiftResetToast state
  const metaWithToast = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'all',
    onlyInFocus: false,
    isShiftKeyHeld: false,
    isShiftResetToastVisible: true,
    shiftResetToastCount: 1,
  });
  assert.equal(metaWithToast.shiftResetToast.isVisible, true);
  assert.equal(metaWithToast.shiftResetToast.shouldShowToast, true);
  assert.equal(metaWithToast.shiftResetToast.message, 'Filters Reset to Default');
  assert.equal(metaWithToast.shiftResetToast.position, 'bottom-of-directory-view');
  assert.equal(metaWithToast.shiftResetToast.animationName, 'shiftResetToastSlideFadeIn');
});

test('Dedicated "Clear Filters" button (#online-directory-clear-filters-btn) only appears when at least one filter criterion is active and resets to default without using the reset modal', () => {
  // 1. Default state (no criteria active) -> hidden
  const idleSpec = resolveDedicatedClearFiltersButtonAction({
    mode: 'everyone',
    moodFilter: 'all',
    onlyInFocus: false,
  });
  assert.equal(idleSpec.buttonId, 'online-directory-clear-filters-btn');
  assert.equal(idleSpec.label, 'Clear Filters');
  assert.equal(idleSpec.shouldShowButton, false);
  assert.equal(idleSpec.isVisible, false);
  assert.equal(idleSpec.isAnyCriterionActive, false);
  assert.equal(idleSpec.activeCriteriaCount, 0);

  // 2. Single criterion active (Mood only) -> visible, bypasses modal
  const moodActiveSpec = resolveDedicatedClearFiltersButtonAction({
    mode: 'everyone',
    moodFilter: 'category:Productive',
    onlyInFocus: false,
  });
  assert.equal(moodActiveSpec.shouldShowButton, true);
  assert.equal(moodActiveSpec.isVisible, true);
  assert.equal(moodActiveSpec.isMoodCriterionActive, true);
  assert.equal(moodActiveSpec.activeCriteriaCount, 1);
  assert.equal(moodActiveSpec.badgeText, '1 active');
  assert.equal(moodActiveSpec.bypassesResetModal, true);
  assert.equal(moodActiveSpec.shouldOpenClearModal, false);
  assert.equal(moodActiveSpec.nextMode, 'everyone');
  assert.equal(moodActiveSpec.nextMoodFilter, 'all');
  assert.equal(moodActiveSpec.nextOnlyInFocus, false);
  assert.equal(moodActiveSpec.isModalOpen, false);

  // 3. Multiple criteria active (Audience + Mood + Focus) -> visible via getOnlineDirectoryQuickFilterMeta
  const metaActive = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'Deep Work',
    onlyInFocus: true,
  });
  assert.equal(
    metaActive.dedicatedClearFiltersButtonMeta.buttonId,
    'online-directory-clear-filters-btn'
  );
  assert.equal(metaActive.dedicatedClearFiltersButtonMeta.label, 'Clear Filters');
  assert.equal(metaActive.dedicatedClearFiltersButtonMeta.shouldShowButton, true);
  assert.equal(metaActive.dedicatedClearFiltersButtonMeta.activeCriteriaCount, 3);
  assert.equal(metaActive.dedicatedClearFiltersButtonMeta.badgeText, '3 active');
  assert.equal(metaActive.dedicatedClearFiltersButtonMeta.bypassesResetModal, true);
  assert.equal(metaActive.dedicatedClearFiltersButtonMeta.isModalOpen, false);
});

// ---------------------------------------------------------------------------
// 70. Dedicated "Clear Filters" Button Framer Motion Fade-In & Scale Entrance
// ---------------------------------------------------------------------------
test('getDedicatedClearFiltersButtonMotionSpec configures Framer Motion fade-in and scale entrance animation for #online-directory-clear-filters-btn', () => {
  const hiddenMotion = getDedicatedClearFiltersButtonMotionSpec(false);
  assert.equal(hiddenMotion.isVisible, false);
  assert.equal(hiddenMotion.animationType, 'fade-in-scale');
  assert.equal(hiddenMotion.engine, 'framer-motion');
  assert.deepEqual(hiddenMotion.initial, { opacity: 0, scale: 0.9 });
  assert.deepEqual(hiddenMotion.animate, { opacity: 1, scale: 1 });
  assert.deepEqual(hiddenMotion.exit, { opacity: 0, scale: 0.9 });

  const visibleMotion = getDedicatedClearFiltersButtonMotionSpec(true);
  assert.equal(visibleMotion.isVisible, true);
  assert.equal(visibleMotion.animationType, 'fade-in-scale');
  assert.equal(visibleMotion.engine, 'framer-motion');
  assert.equal(visibleMotion.initialOpacity, 0);
  assert.equal(visibleMotion.initialScale, 0.9);
  assert.equal(visibleMotion.animateOpacity, 1);
  assert.equal(visibleMotion.animateScale, 1);
  assert.equal(visibleMotion.durationMs, 180);
  assert.deepEqual(visibleMotion.initial, { opacity: 0, scale: 0.9 });
  assert.deepEqual(visibleMotion.animate, { opacity: 1, scale: 1 });
  assert.deepEqual(visibleMotion.exit, { opacity: 0, scale: 0.9 });
  assert.deepEqual(visibleMotion.whileHover, { scale: 1.03 });
  assert.deepEqual(visibleMotion.whileTap, { scale: 0.97 });
  assert.equal(visibleMotion.transition.opacity.duration, 0.18);
  assert.equal(visibleMotion.transition.opacity.ease, 'easeOut');
  assert.equal(visibleMotion.transition.scale.type, 'spring');
  assert.equal(visibleMotion.transition.scale.stiffness, 420);
  assert.equal(visibleMotion.transition.scale.damping, 28);
  assert.equal(visibleMotion.transition.scale.mass, 0.7);

  // Verify resolveDedicatedClearFiltersButtonAction exposes the motion spec directly
  const activeButtonSpec = resolveDedicatedClearFiltersButtonAction({
    mode: 'everyone',
    moodFilter: 'Deep Work',
    onlyInFocus: false,
  });
  assert.equal(activeButtonSpec.shouldShowButton, true);
  assert.equal(activeButtonSpec.motion.isVisible, true);
  assert.equal(activeButtonSpec.motion.animationType, 'fade-in-scale');
  assert.equal(activeButtonSpec.motion.engine, 'framer-motion');
  assert.deepEqual(activeButtonSpec.motion.initial, { opacity: 0, scale: 0.9 });
  assert.deepEqual(activeButtonSpec.motion.animate, { opacity: 1, scale: 1 });
});

// ---------------------------------------------------------------------------
// 71. Clear Filters Button Subtle 'ui_chime' via playSubtleUiChime
// ---------------------------------------------------------------------------
test('resolveClearFiltersButtonChime and resolveDedicatedClearFiltersButtonAction configure subtle ui_chime from playSubtleUiChime when Clear Filters is clicked', () => {
  const rawUiChime = getUiSoundChimeSpec('ui_chime', false, 65);
  assert.equal(rawUiChime.eventType, 'ui_chime');
  assert.equal(rawUiChime.label, 'Clear Filters Reset UI Chime');
  assert.deepEqual(rawUiChime.frequenciesHz, [587.33, 440]);
  assert.equal(rawUiChime.noteNames, 'D5 → A4 Subtle UI Chime');
  assert.equal(rawUiChime.durationMs, 200);

  const chimeEnabled = resolveClearFiltersButtonChime({
    preferences: { ...DEFAULT_UI_SOUND_PREFERENCES, enabled: true, volumePercent: 70 },
    activeCriteriaCount: 2,
    activeCriteriaSummary: 'Mood (Deep Work), In Focus',
  });
  assert.equal(chimeEnabled.utilityName, 'playSubtleUiChime');
  assert.equal(chimeEnabled.eventType, 'ui_chime');
  assert.equal(chimeEnabled.chimeType, 'ui_chime');
  assert.equal(chimeEnabled.shouldPlay, true);
  assert.equal(chimeEnabled.volumePercent, 70);
  assert.equal(chimeEnabled.chime.eventType, 'ui_chime');
  assert.ok(chimeEnabled.feedbackMessage.includes('UI chime played: Clear Filters reset'));

  const chimeMuted = resolveClearFiltersButtonChime({
    preferences: { ...DEFAULT_UI_SOUND_PREFERENCES, enabled: false, volumePercent: 70 },
    activeCriteriaCount: 1,
    activeCriteriaSummary: 'My Connections',
  });
  assert.equal(chimeMuted.utilityName, 'playSubtleUiChime');
  assert.equal(chimeMuted.eventType, 'ui_chime');
  assert.equal(chimeMuted.shouldPlay, false);

  const buttonSpec = resolveDedicatedClearFiltersButtonAction({
    mode: 'my_connections',
    moodFilter: 'Deep Work',
    onlyInFocus: true,
    preferences: { ...DEFAULT_UI_SOUND_PREFERENCES, enabled: true, volumePercent: 65 },
  });
  assert.equal(buttonSpec.chimeUtility, 'playSubtleUiChime');
  assert.equal(buttonSpec.chimeEventType, 'ui_chime');
  assert.equal(buttonSpec.chimeSpec.eventType, 'ui_chime');
  assert.equal(buttonSpec.chimeSpec.shouldPlay, true);
});

// ---------------------------------------------------------------------------
// 72. Clear Filters Button Dynamic Active Criteria Count Tooltip
// ---------------------------------------------------------------------------
test('getDedicatedClearFiltersTooltipMeta and resolveDedicatedClearFiltersButtonAction dynamically show the current number of active criteria being reset when hovered', () => {
  // 0 active criteria
  const zeroTooltip = getDedicatedClearFiltersTooltipMeta({
    activeCriteriaCount: 0,
    activeCriteriaLabels: [],
    isHovered: true,
  });
  assert.equal(zeroTooltip.tooltipId, 'online-directory-clear-filters-tooltip');
  assert.equal(zeroTooltip.isVisible, false);
  assert.equal(zeroTooltip.activeCriteriaCount, 0);
  assert.equal(zeroTooltip.criterionNoun, 'criteria');

  // 1 active criterion (hovered)
  const singleSpec = resolveDedicatedClearFiltersButtonAction({
    mode: 'my_connections',
    moodFilter: 'all',
    onlyInFocus: false,
    isHovered: true,
  });
  assert.equal(singleSpec.activeCriteriaCount, 1);
  assert.equal(singleSpec.tooltipId, 'online-directory-clear-filters-tooltip');
  assert.equal(singleSpec.tooltipTitle, 'Reset 1 active criterion');
  assert.equal(singleSpec.tooltipMeta.isVisible, true);
  assert.equal(singleSpec.tooltipMeta.criterionNoun, 'criterion');
  assert.equal(singleSpec.tooltipMeta.countBadgeText, '1 criterion');
  assert.ok(singleSpec.tooltipText.includes('Reset 1 active criterion (My Connections)'));
  assert.ok(
    singleSpec.tooltipMeta.descriptionText.includes(
      'Resets 1 active filter criterion (My Connections)'
    )
  );

  // 2 active criteria (hovered)
  const doubleSpec = resolveDedicatedClearFiltersButtonAction({
    mode: 'my_connections',
    moodFilter: 'Deep Work',
    onlyInFocus: false,
    isHovered: true,
  });
  assert.equal(doubleSpec.activeCriteriaCount, 2);
  assert.equal(doubleSpec.tooltipTitle, 'Reset 2 active criteria');
  assert.equal(doubleSpec.tooltipMeta.isVisible, true);
  assert.equal(doubleSpec.tooltipMeta.criterionNoun, 'criteria');
  assert.equal(doubleSpec.tooltipMeta.countBadgeText, '2 criteria');
  assert.ok(
    doubleSpec.tooltipText.includes(
      'Reset 2 active criteria (Mood (Deep Work), My Connections)'
    )
  );

  // 3 active criteria via getOnlineDirectoryQuickFilterMeta
  const tripleMeta = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'Deep Work',
    onlyInFocus: true,
    isClearFiltersHovered: true,
  });
  assert.equal(tripleMeta.dedicatedClearFiltersButtonMeta.activeCriteriaCount, 3);
  assert.equal(
    tripleMeta.dedicatedClearFiltersButtonMeta.tooltipMeta.headlineText,
    'Reset 3 active criteria'
  );
  assert.equal(
    tripleMeta.dedicatedClearFiltersButtonMeta.tooltipMeta.countBadgeText,
    '3 criteria'
  );
  assert.equal(tripleMeta.dedicatedClearFiltersButtonMeta.tooltipMeta.isVisible, true);
  assert.ok(
    tripleMeta.dedicatedClearFiltersButtonMeta.tooltipText.includes(
      'Reset 3 active criteria (Mood (Deep Work), In Focus, My Connections)'
    )
  );
});

// ---------------------------------------------------------------------------
// 73. Recently Applied Visual Indicator & Badges in #online-directory-mood-filter
// ---------------------------------------------------------------------------
test('evaluateRecentlyAppliedDirectoryFilterMeta, isMoodFilterInRecentDirectoryFilters, and getOnlineDirectoryQuickFilterMeta provide "Recently Applied" visual indicator and badges leveraging recentDirectoryFilters state', () => {
  const customHistory = [
    buildDirectoryFilterCombinationEntry({
      audienceFilter: 'my_connections',
      moodFilter: 'Deep Work',
      onlyInFocus: true,
      timestampMs: 1_760_000_050_000,
    }),
    buildDirectoryFilterCombinationEntry({
      audienceFilter: 'everyone',
      moodFilter: 'category:Productive',
      onlyInFocus: false,
      timestampMs: 1_760_000_040_000,
    }),
    buildDirectoryFilterCombinationEntry({
      audienceFilter: 'everyone',
      moodFilter: 'all',
      onlyInFocus: false,
      timestampMs: 1_760_000_030_000,
    }),
  ];

  // 1. Matching constrained configuration at rank #1
  const matchRank1 = evaluateRecentlyAppliedDirectoryFilterMeta({
    history: customHistory,
    currentAudienceFilter: 'my_connections',
    currentMoodFilter: 'Deep Work',
    currentOnlyInFocus: true,
  });
  assert.equal(matchRank1.badgeId, 'online-directory-mood-filter-recently-applied-badge');
  assert.equal(matchRank1.badgeTestId, 'online-directory-recently-applied-badge');
  assert.equal(matchRank1.badgeLabel, 'Recently Applied');
  assert.equal(matchRank1.isRecentlyApplied, true);
  assert.equal(matchRank1.shouldShowBadge, true);
  assert.equal(matchRank1.isConstrainedMatch, true);
  assert.equal(matchRank1.isDefaultCombination, false);
  assert.equal(matchRank1.matchedIndex, 0);
  assert.equal(matchRank1.matchedRank, 1);
  assert.equal(matchRank1.rankBadgeText, '#1');
  assert.equal(matchRank1.totalRecentCount, 3);
  assert.equal(
    matchRank1.matchedCombinationLabel,
    'Deep Work · My Connections · In Focus'
  );
  assert.ok(matchRank1.statusText.includes('Recently Applied (#1 of 3)'));
  assert.ok(matchRank1.tooltipText.includes('Recently Applied filter configuration (#1 of 3'));

  // 2. Non-matching configuration when history does not contain it
  const nonMatch = evaluateRecentlyAppliedDirectoryFilterMeta({
    history: customHistory,
    currentAudienceFilter: 'my_connections',
    currentMoodFilter: 'Coffee Break',
    currentOnlyInFocus: false,
  });
  assert.equal(nonMatch.isRecentlyApplied, false);
  assert.equal(nonMatch.shouldShowBadge, false);
  assert.equal(nonMatch.matchedIndex, -1);
  assert.equal(nonMatch.matchedRank, null);
  assert.equal(nonMatch.rankBadgeText, null);
  assert.equal(nonMatch.matchedCombination, null);

  // 3. Per-mood check for "Recently Applied" badges on mood categories & presets
  const deepWorkRecent = isMoodFilterInRecentDirectoryFilters(
    customHistory,
    'Deep Work'
  );
  assert.equal(deepWorkRecent.isRecentlyUsed, true);
  assert.equal(deepWorkRecent.badgeLabel, 'Recently Applied');
  assert.equal(deepWorkRecent.matchedRank, 1);

  const productiveRecent = isMoodFilterInRecentDirectoryFilters(
    customHistory,
    'category:Productive'
  );
  assert.equal(productiveRecent.isRecentlyUsed, true);
  assert.equal(productiveRecent.badgeLabel, 'Recently Applied');
  assert.equal(productiveRecent.matchedRank, 2);

  const coffeeRecent = isMoodFilterInRecentDirectoryFilters(
    customHistory,
    'Coffee Break'
  );
  assert.equal(coffeeRecent.isRecentlyUsed, false);
  assert.equal(coffeeRecent.badgeLabel, null);
  assert.equal(coffeeRecent.matchedRank, null);

  // 4. getOnlineDirectoryQuickFilterMeta exposes recentlyAppliedMeta and recentFiltersMeta badges
  const quickMeta = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'category:Productive',
    onlyInFocus: false,
    recentFiltersHistory: customHistory,
  });
  assert.equal(quickMeta.recentlyAppliedMeta.isRecentlyApplied, true);
  assert.equal(quickMeta.recentlyAppliedMeta.shouldShowBadge, true);
  assert.equal(quickMeta.recentlyAppliedMeta.badgeLabel, 'Recently Applied');
  assert.equal(quickMeta.recentlyAppliedMeta.matchedRank, 2);
  assert.equal(quickMeta.recentlyAppliedMeta.rankBadgeText, '#2');
  assert.equal(quickMeta.recentFiltersMeta.isCurrentConfigRecentlyApplied, true);
  assert.equal(quickMeta.recentFiltersMeta.activeCombinationRank, 2);
  assert.equal(quickMeta.recentFiltersMeta.recentlyAppliedBadgeLabel, 'Recently Applied');
  assert.equal(
    quickMeta.recentFiltersMeta.options[0].recentlyAppliedBadgeLabel,
    'Recently Applied'
  );
});

// ---------------------------------------------------------------------------
// 74. Ctrl+R / Cmd+R Keyboard Shortcut for Clear Filters in #online-directory-mood-filter
// ---------------------------------------------------------------------------
test('isClearFiltersKeyboardShortcutEvent and resolveClearFiltersKeyboardShortcutAction handle Ctrl+R and Cmd+R shortcuts with identical Clear Filters reset logic', () => {
  // 1. Key event detection for Ctrl+R and Cmd+R
  assert.equal(
    isClearFiltersKeyboardShortcutEvent({ key: 'r', ctrlKey: true, metaKey: false }),
    true
  );
  assert.equal(
    isClearFiltersKeyboardShortcutEvent({ key: 'R', ctrlKey: true, metaKey: false }),
    true
  );
  assert.equal(
    isClearFiltersKeyboardShortcutEvent({ key: 'r', ctrlKey: false, metaKey: true }),
    true
  );
  assert.equal(
    isClearFiltersKeyboardShortcutEvent({ code: 'KeyR', ctrlKey: false, metaKey: true }),
    true
  );

  // Unmodified 'r', Alt+R, or Ctrl+K should not match
  assert.equal(
    isClearFiltersKeyboardShortcutEvent({ key: 'r', ctrlKey: false, metaKey: false }),
    false
  );
  assert.equal(
    isClearFiltersKeyboardShortcutEvent({
      key: 'r',
      ctrlKey: true,
      metaKey: false,
      altKey: true,
    }),
    false
  );
  assert.equal(
    isClearFiltersKeyboardShortcutEvent({ key: 'k', ctrlKey: true, metaKey: false }),
    false
  );

  // 2. Ctrl+R triggers the exact same reset logic as resolveDedicatedClearFiltersButtonAction
  const buttonAction = resolveDedicatedClearFiltersButtonAction({
    mode: 'my_connections',
    moodFilter: 'Deep Work',
    onlyInFocus: true,
    preferences: { ...DEFAULT_UI_SOUND_PREFERENCES, enabled: true, volumePercent: 75 },
  });
  const ctrlRAction = resolveClearFiltersKeyboardShortcutAction({
    key: 'r',
    code: 'KeyR',
    ctrlKey: true,
    metaKey: false,
    mode: 'my_connections',
    moodFilter: 'Deep Work',
    onlyInFocus: true,
    preferences: { ...DEFAULT_UI_SOUND_PREFERENCES, enabled: true, volumePercent: 75 },
    isDirectoryActive: true,
  });

  assert.equal(ctrlRAction.matchedShortcut, true);
  assert.equal(ctrlRAction.shouldPreventDefault, true);
  assert.equal(ctrlRAction.shouldStopPropagation, true);
  assert.equal(ctrlRAction.shouldTriggerReset, true);
  assert.equal(ctrlRAction.modifierUsed, 'Ctrl');
  assert.equal(ctrlRAction.shortcutCombo, 'Ctrl+R');
  assert.equal(ctrlRAction.targetButtonId, 'online-directory-clear-filters-btn');
  assert.equal(ctrlRAction.targetContainerId, 'online-directory-mood-filter');
  assert.equal(ctrlRAction.nextMode, buttonAction.nextMode);
  assert.equal(ctrlRAction.nextMoodFilter, buttonAction.nextMoodFilter);
  assert.equal(ctrlRAction.nextOnlyInFocus, buttonAction.nextOnlyInFocus);
  assert.equal(ctrlRAction.isModalOpen, buttonAction.isModalOpen);
  assert.equal(ctrlRAction.bypassesResetModal, buttonAction.bypassesResetModal);
  assert.equal(ctrlRAction.chimeSpec.eventType, buttonAction.chimeSpec.eventType);
  assert.equal(ctrlRAction.chimeSpec.volumePercent, buttonAction.chimeSpec.volumePercent);
  assert.equal(
    ctrlRAction.clearAction.activeCriteriaCount,
    buttonAction.activeCriteriaCount
  );

  // 3. Cmd+R (macOS metaKey) triggers the exact same reset logic
  const cmdRAction = resolveClearFiltersKeyboardShortcutAction({
    key: 'r',
    code: 'KeyR',
    ctrlKey: false,
    metaKey: true,
    mode: 'my_connections',
    moodFilter: 'category:Productive',
    onlyInFocus: false,
    preferences: { ...DEFAULT_UI_SOUND_PREFERENCES, enabled: true, volumePercent: 65 },
    isDirectoryActive: true,
  });

  assert.equal(cmdRAction.matchedShortcut, true);
  assert.equal(cmdRAction.shouldPreventDefault, true);
  assert.equal(cmdRAction.shouldTriggerReset, true);
  assert.equal(cmdRAction.modifierUsed, 'Cmd');
  assert.equal(cmdRAction.shortcutCombo, 'Cmd+R');
  assert.equal(cmdRAction.nextMode, 'everyone');
  assert.equal(cmdRAction.nextMoodFilter, 'all');
  assert.equal(cmdRAction.nextOnlyInFocus, false);
  assert.equal(cmdRAction.bypassesResetModal, true);

  // 4. DedicatedClearFiltersButtonSpec exposes shortcut metadata
  assert.equal(buttonAction.keyboardShortcutLabel, 'Ctrl+R / Cmd+R');
  assert.equal(buttonAction.keyboardShortcutBadgeText, 'Ctrl+R');
  assert.deepEqual(buttonAction.shortcutsSupported, ['Ctrl+R', 'Cmd+R']);
});

// ---------------------------------------------------------------------------
// 75. Secondary Confirmation Modal for Complex, Recently-Applied Filters (#online-directory-mood-filter)
// ---------------------------------------------------------------------------
test('evaluateSecondaryComplexFilterClearModalMeta, resolveSecondaryComplexFilterClearGateAction, and confirmSecondaryComplexFilterClearAllReset safeguard complex, recently-applied filter combinations in #online-directory-mood-filter', () => {
  const customHistory = [
    buildDirectoryFilterCombinationEntry({
      audienceFilter: 'my_connections',
      moodFilter: 'Deep Work',
      onlyInFocus: true,
      timestampMs: 1_760_000_050_000,
    }),
    buildDirectoryFilterCombinationEntry({
      audienceFilter: 'my_connections',
      moodFilter: 'category:Productive',
      onlyInFocus: false,
      timestampMs: 1_760_000_040_000,
    }),
  ];

  // 1. Default unconstrained state -> not complex, not recently applied, trigger hidden
  const idleMeta = evaluateSecondaryComplexFilterClearModalMeta({
    isOpen: false,
    mode: 'everyone',
    moodFilter: 'all',
    onlyInFocus: false,
    history: customHistory,
  });
  assert.equal(idleMeta.modalId, 'online-directory-secondary-clear-all-modal');
  assert.equal(idleMeta.targetElementId, 'online-directory-mood-filter');
  assert.equal(idleMeta.isAnyCriterionActive, false);
  assert.equal(idleMeta.isComplexCombination, false);
  assert.equal(idleMeta.isRecentlyAppliedCombination, false);
  assert.equal(idleMeta.isComplexRecentlyAppliedCombination, false);
  assert.equal(idleMeta.shouldShowTriggerButton, false);

  // 2. Complex, recently-applied combination (3 criteria: My Connections + Deep Work + In Focus, rank #1)
  const complexRecentMeta = evaluateSecondaryComplexFilterClearModalMeta({
    isOpen: true,
    mode: 'my_connections',
    moodFilter: 'Deep Work',
    onlyInFocus: true,
    history: customHistory,
    everyoneCount: 6,
    matchingPeersCount: 1,
  });
  assert.equal(complexRecentMeta.isOpen, true);
  assert.equal(complexRecentMeta.activeCriteriaCount, 3);
  assert.equal(complexRecentMeta.isComplexCombination, true);
  assert.equal(complexRecentMeta.isRecentlyAppliedCombination, true);
  assert.equal(complexRecentMeta.isComplexRecentlyAppliedCombination, true);
  assert.equal(complexRecentMeta.requiresExplicitConfirmation, true);
  assert.equal(complexRecentMeta.shouldShowTriggerButton, true);
  assert.equal(complexRecentMeta.recentlyAppliedRank, 1);
  assert.equal(complexRecentMeta.recentlyAppliedRankBadge, '#1');
  assert.equal(complexRecentMeta.hiddenPeersCount, 5);
  assert.equal(complexRecentMeta.modalTitle, 'Confirm Clear All Active Filters?');
  assert.equal(
    complexRecentMeta.confirmActionLabel,
    'Confirm & Clear All Filters'
  );
  assert.equal(
    complexRecentMeta.cancelActionLabel,
    'Keep Complex Filter Active'
  );
  assert.ok(complexRecentMeta.warningBadgeText.includes('Complex · Recently Applied #1'));

  // 3. Gate action intercepts clearing a complex, recently-applied combination when Shift is not held
  const gateIntercepted = resolveSecondaryComplexFilterClearGateAction({
    mode: 'my_connections',
    moodFilter: 'category:Productive',
    onlyInFocus: false,
    history: customHistory,
    shiftKey: false,
    everyoneCount: 4,
    matchingPeersCount: 1,
  });
  assert.equal(gateIntercepted.shouldOpenSecondaryModal, true);
  assert.equal(gateIntercepted.shouldOpenPrimaryModal, false);
  assert.equal(gateIntercepted.didImmediateReset, false);
  assert.equal(gateIntercepted.isProtectedComplexRecentCombination, true);
  assert.equal(gateIntercepted.nextMode, 'my_connections');
  assert.equal(gateIntercepted.nextMoodFilter, 'category:Productive');
  assert.equal(gateIntercepted.secondaryModalMeta.isOpen, true);

  // 4. Explicit confirmation resets all criteria (Audience, Mood, In Focus) and triggers ui_chime
  const confirmedReset = confirmSecondaryComplexFilterClearAllReset({
    mode: 'my_connections',
    moodFilter: 'category:Productive',
    onlyInFocus: true,
    preferences: { ...DEFAULT_UI_SOUND_PREFERENCES, enabled: true, volumePercent: 70 },
  });
  assert.equal(confirmedReset.confirmed, true);
  assert.equal(confirmedReset.nextMode, 'everyone');
  assert.equal(confirmedReset.nextMoodFilter, 'all');
  assert.equal(confirmedReset.nextOnlyInFocus, false);
  assert.equal(confirmedReset.isSecondaryModalOpen, false);
  assert.equal(confirmedReset.isPrimaryModalOpen, false);
  assert.equal(confirmedReset.clearedCriteriaCount, 3);
  assert.equal(confirmedReset.chimeSpec.eventType, 'ui_chime');
  assert.equal(confirmedReset.toastMessage, 'Filters Reset to Default');
});

// ---------------------------------------------------------------------------
// 76. Save Current Configuration Button & Pinned Filter Chips (#online-directory-save-config-btn)
// ---------------------------------------------------------------------------
test('saveDirectoryFilterConfigurationAsPinnedChip, applyPinnedDirectoryFilterChip, removePinnedDirectoryFilterChip, and evaluatePinnedDirectoryFiltersMeta bookmark mood and audience preferences as pinned filter chips for one-click access', () => {
  assert.equal(MAX_PINNED_DIRECTORY_FILTER_CHIPS, 6);
  assert.equal(
    PINNED_DIRECTORY_FILTERS_STORAGE_KEY,
    'mr_stranger_pinned_directory_filters_v1'
  );

  // 1. Save a specific combination of mood and audience preferences (My Connections + Deep Work)
  const firstSave = saveDirectoryFilterConfigurationAsPinnedChip([], {
    audienceFilter: 'my_connections',
    moodFilter: 'Deep Work',
    onlyInFocus: false,
    timestampMs: 1_760_000_100_000,
  });
  assert.equal(firstSave.saved, true);
  assert.equal(firstSave.alreadyPinned, false);
  assert.equal(firstSave.updatedPinned.length, 1);
  assert.equal(firstSave.pinnedChip.audienceFilter, 'my_connections');
  assert.equal(firstSave.pinnedChip.moodFilter, 'Deep Work');
  assert.equal(firstSave.pinnedChip.label, 'Deep Work · My Connections');

  // 2. Save a second combination (Everyone + Productive + In Focus)
  const secondSave = saveDirectoryFilterConfigurationAsPinnedChip(
    firstSave.updatedPinned,
    {
      audienceFilter: 'everyone',
      moodFilter: 'category:Productive',
      onlyInFocus: true,
      timestampMs: 1_760_000_200_000,
    }
  );
  assert.equal(secondSave.saved, true);
  assert.equal(secondSave.alreadyPinned, false);
  assert.equal(secondSave.updatedPinned.length, 2);
  assert.equal(
    secondSave.updatedPinned[0].label,
    'Productive · Everyone · In Focus'
  );

  // 3. Re-saving an existing combination deduplicates and marks alreadyPinned = true
  const duplicateSave = saveDirectoryFilterConfigurationAsPinnedChip(
    secondSave.updatedPinned,
    {
      audienceFilter: 'my_connections',
      moodFilter: 'Deep Work',
      onlyInFocus: false,
      timestampMs: 1_760_000_300_000,
    }
  );
  assert.equal(duplicateSave.saved, true);
  assert.equal(duplicateSave.alreadyPinned, true);
  assert.equal(duplicateSave.updatedPinned.length, 2);
  assert.equal(duplicateSave.updatedPinned[0].label, 'Deep Work · My Connections');

  // 4. Evaluate pinned filters metadata & getOnlineDirectoryQuickFilterMeta integration
  const metaPinned = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'Deep Work',
    onlyInFocus: false,
    pinnedFilters: duplicateSave.updatedPinned,
  });
  assert.equal(
    metaPinned.pinnedFiltersMeta.saveButtonId,
    'online-directory-save-config-btn'
  );
  assert.equal(
    metaPinned.pinnedFiltersMeta.buttonLabel,
    'Save current configuration'
  );
  assert.equal(metaPinned.pinnedFiltersMeta.isCurrentConfigPinned, true);
  assert.equal(metaPinned.pinnedFiltersMeta.pinnedCount, 2);
  assert.equal(metaPinned.pinnedFiltersMeta.hasPinnedChips, true);
  assert.equal(metaPinned.pinnedFiltersMeta.chips[0].isCurrentlyActive, true);
  assert.equal(metaPinned.pinnedFiltersMeta.chips[1].isCurrentlyActive, false);

  // 5. One-click access via applyPinnedDirectoryFilterChip restores mood & audience preferences
  const applied = applyPinnedDirectoryFilterChip(
    duplicateSave.updatedPinned,
    duplicateSave.updatedPinned[1].id
  );
  assert.equal(applied.found, true);
  assert.equal(applied.audienceFilter, 'everyone');
  assert.equal(applied.moodFilter, 'category:Productive');
  assert.equal(applied.onlyInFocus, true);

  // 6. Removing a pinned chip updates the list cleanly
  const removed = removePinnedDirectoryFilterChip(
    duplicateSave.updatedPinned,
    duplicateSave.updatedPinned[0].id
  );
  assert.equal(removed.removed, true);
  assert.equal(removed.updatedPinned.length, 1);
});

// ---------------------------------------------------------------------------
// 77. Smooth Auto-Scroll to First Matching Peer When #online-directory-mood-filter Criteria Update
// ---------------------------------------------------------------------------
test('evaluateFirstMatchingPeerAutoScrollMeta and shouldTriggerFirstMatchingPeerAutoScroll smoothly bring the first matching peer into view when #online-directory-mood-filter criteria are updated', () => {
  assert.equal(FIRST_MATCHING_PEER_AUTO_SCROLL_HIGHLIGHT_MS, 1400);

  // 1. Initial mount records signature without triggering scroll
  const initialDecision = shouldTriggerFirstMatchingPeerAutoScroll({
    previousSignature: null,
    currentAudienceFilter: 'everyone',
    currentMoodFilter: 'all',
    currentOnlyInFocus: false,
    isInitialMount: true,
    matchingPeersCount: 2,
    firstMatchingPeerUid: 'peer_1',
    firstMatchingPeerDisplayName: 'Alex Scholar',
  });
  assert.equal(initialDecision.shouldScroll, false);
  assert.equal(initialDecision.reason, 'initial_mount');
  assert.equal(initialDecision.nextSignature, 'everyone|all|0');
  assert.deepEqual(initialDecision.scrollIntoViewOptions, {
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
  });

  // 2. Updating filter criteria in #online-directory-mood-filter with a matching peer triggers smooth auto-scroll
  const updatedDecision = shouldTriggerFirstMatchingPeerAutoScroll({
    previousSignature: initialDecision.nextSignature,
    currentAudienceFilter: 'everyone',
    currentMoodFilter: 'category:Productive',
    currentOnlyInFocus: false,
    isInitialMount: false,
    matchingPeersCount: 1,
    firstMatchingPeerUid: 'peer_1',
    firstMatchingPeerDisplayName: 'Alex Scholar',
  });
  assert.equal(updatedDecision.shouldScroll, true);
  assert.equal(updatedDecision.reason, 'criteria_updated_with_match');
  assert.equal(
    updatedDecision.targetRowId,
    'online-directory-first-matching-peer-row'
  );
  assert.equal(updatedDecision.targetPeerUid, 'peer_1');
  assert.equal(updatedDecision.targetPeerDisplayName, 'Alex Scholar');
  assert.equal(updatedDecision.scrollIntoViewOptions.behavior, 'smooth');
  assert.ok(updatedDecision.feedbackText.includes('Alex Scholar'));

  // 3. Re-evaluating with unchanged signature does not re-trigger scroll
  const unchangedDecision = shouldTriggerFirstMatchingPeerAutoScroll({
    previousSignature: updatedDecision.nextSignature,
    currentAudienceFilter: 'everyone',
    currentMoodFilter: 'category:Productive',
    currentOnlyInFocus: false,
    isInitialMount: false,
    matchingPeersCount: 1,
    firstMatchingPeerUid: 'peer_1',
    firstMatchingPeerDisplayName: 'Alex Scholar',
  });
  assert.equal(unchangedDecision.shouldScroll, false);
  assert.equal(unchangedDecision.reason, 'unchanged_criteria');

  // 4. Updating filter criteria when 0 peers match does not scroll
  const zeroMatchDecision = shouldTriggerFirstMatchingPeerAutoScroll({
    previousSignature: updatedDecision.nextSignature,
    currentAudienceFilter: 'my_connections',
    currentMoodFilter: 'Taking a Break',
    currentOnlyInFocus: false,
    isInitialMount: false,
    matchingPeersCount: 0,
    firstMatchingPeerUid: null,
  });
  assert.equal(zeroMatchDecision.shouldScroll, false);
  assert.equal(zeroMatchDecision.reason, 'no_matching_peers');
  assert.equal(zeroMatchDecision.targetPeerUid, null);

  // 5. Verify getOnlineDirectoryQuickFilterMeta exposes firstMatchingPeerAutoScrollMeta
  const quickMeta = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'peer_1', mood: 'Deep Work' }],
    moodFilter: 'category:Productive',
    onlyInFocus: false,
    displayedPeersCount: 1,
    firstMatchingPeer: {
      uid: 'peer_1',
      displayName: 'Alex Scholar',
      mood: 'Deep Work',
    },
    autoScrollTriggerCount: 1,
    lastAutoScrolledPeerUid: 'peer_1',
    isFirstPeerAutoScrollHighlighted: true,
  });
  assert.equal(quickMeta.firstMatchingPeerAutoScrollMeta.enabled, true);
  assert.equal(
    quickMeta.firstMatchingPeerAutoScrollMeta.sourceFilterId,
    'online-directory-mood-filter'
  );
  assert.equal(
    quickMeta.firstMatchingPeerAutoScrollMeta.targetRowId,
    'online-directory-first-matching-peer-row'
  );
  assert.equal(
    quickMeta.firstMatchingPeerAutoScrollMeta.scrollBehavior,
    'smooth'
  );
  assert.equal(quickMeta.firstMatchingPeerAutoScrollMeta.hasMatchingPeers, true);
  assert.equal(
    quickMeta.firstMatchingPeerAutoScrollMeta.firstMatchingPeerUid,
    'peer_1'
  );
  assert.equal(
    quickMeta.firstMatchingPeerAutoScrollMeta.firstMatchingPeerDisplayName,
    'Alex Scholar'
  );
  assert.equal(quickMeta.firstMatchingPeerAutoScrollMeta.autoScrollTriggerCount, 1);
  assert.equal(quickMeta.firstMatchingPeerAutoScrollMeta.isHighlighted, true);
});

// ---------------------------------------------------------------------------
// 78. Framer Motion AnimatePresence Exit Animation for 'Clear Filters' Button (#online-directory-clear-filters-btn)
// ---------------------------------------------------------------------------
test('getDedicatedClearFiltersExitAnimationSpec and getDedicatedClearFiltersButtonMotionSpec configure Framer Motion AnimatePresence slide-out and shrink exit animation when all filters are cleared', () => {
  const exitSpec = getDedicatedClearFiltersExitAnimationSpec();
  assert.equal(
    exitSpec.wrapperId,
    'online-directory-clear-filters-presence-wrapper'
  );
  assert.equal(exitSpec.buttonKey, 'online-directory-clear-filters-btn');
  assert.equal(exitSpec.engine, 'framer-motion');
  assert.equal(exitSpec.component, 'AnimatePresence');
  assert.equal(exitSpec.animatePresenceInitial, false);
  assert.equal(exitSpec.exitAnimationType, 'slide-out-shrink');
  assert.equal(exitSpec.exitOpacity, 0);
  assert.equal(exitSpec.exitScale, 0.85);
  assert.equal(exitSpec.exitTranslateX, -10);
  assert.equal(exitSpec.exitTranslateY, -2);
  assert.equal(exitSpec.exitDurationMs, 180);
  assert.equal(exitSpec.exitDurationSec, 0.18);
  assert.equal(exitSpec.exitEasing, 'easeInOut');
  assert.deepEqual(exitSpec.exit, {
    opacity: 0,
    scale: 0.85,
    x: -10,
    y: -2,
    transition: {
      duration: 0.18,
      ease: 'easeInOut',
    },
  });

  // Verify getDedicatedClearFiltersButtonMotionSpec and resolveDedicatedClearFiltersButtonAction expose exitSpec & slideShrinkExit
  const motionWhenCleared = getDedicatedClearFiltersButtonMotionSpec(false);
  assert.equal(motionWhenCleared.isVisible, false);
  assert.equal(motionWhenCleared.exitAnimationType, 'slide-out-shrink');
  assert.equal(motionWhenCleared.presenceComponent, 'AnimatePresence');
  assert.equal(motionWhenCleared.exitShrinkScale, 0.85);
  assert.equal(motionWhenCleared.exitSlideX, -10);
  assert.equal(motionWhenCleared.exitDurationMs, 180);
  assert.deepEqual(motionWhenCleared.slideShrinkExit, exitSpec.exit);

  const clearedButtonAction = resolveDedicatedClearFiltersButtonAction({
    mode: 'everyone',
    moodFilter: 'all',
    onlyInFocus: false,
  });
  assert.equal(clearedButtonAction.shouldShowButton, false);
  assert.equal(clearedButtonAction.motion.exitAnimationType, 'slide-out-shrink');
  assert.equal(
    clearedButtonAction.motion.exitSpec.component,
    'AnimatePresence'
  );
});

// ---------------------------------------------------------------------------
// 79. Rhythmic 'Breath' Pulse Animation on #online-directory-mood-filter When Active Filters Are Detected
// ---------------------------------------------------------------------------
test('getQuickFilterBreathPulseSpec and getOnlineDirectoryQuickFilterMeta configure a rhythmic emerald glow breath pulse animation on #online-directory-mood-filter when active filters are detected', () => {
  // 1. Default idle state (no active filters)
  const idleSpec = getQuickFilterBreathPulseSpec({
    mode: 'everyone',
    moodFilter: 'all',
    onlyInFocus: false,
  });
  assert.equal(idleSpec.targetElementId, 'online-directory-mood-filter');
  assert.equal(idleSpec.isBreathPulseActive, false);
  assert.equal(idleSpec.hasActiveFilters, false);
  assert.equal(idleSpec.activeCriteriaCount, 0);
  assert.equal(idleSpec.animationName, 'none');
  assert.equal(idleSpec.animationType, 'rhythmic-breath-pulse');
  assert.equal(idleSpec.cssClassName, '');
  assert.equal(idleSpec.glowTone, 'none');
  assert.equal(idleSpec.iterationCount, '1');
  assert.equal(idleSpec.peakEmeraldGlowShadow, 'none');

  // 2. Single active filter (Mood filter active while mode is 'everyone')
  const moodActiveSpec = getQuickFilterBreathPulseSpec({
    mode: 'everyone',
    moodFilter: 'category:Productive',
    onlyInFocus: false,
  });
  assert.equal(moodActiveSpec.isBreathPulseActive, true);
  assert.equal(moodActiveSpec.hasActiveFilters, true);
  assert.equal(moodActiveSpec.activeCriteriaCount, 1);
  assert.deepEqual(moodActiveSpec.activeCriteriaKeys, ['mood']);
  assert.equal(moodActiveSpec.animationName, 'quickFilterEmeraldBreathPulse');
  assert.equal(moodActiveSpec.cssClassName, 'quick-filter-emerald-breath-pulse');
  assert.equal(moodActiveSpec.glowTone, 'emerald-soft');
  assert.equal(moodActiveSpec.durationMs, 2800);
  assert.equal(moodActiveSpec.durationSec, 2.8);
  assert.equal(moodActiveSpec.easing, 'ease-in-out');
  assert.equal(moodActiveSpec.iterationCount, 'infinite');
  assert.ok(moodActiveSpec.peakEmeraldGlowShadow.includes('rgba(52, 211, 153'));
  assert.equal(moodActiveSpec.boxShadowKeyframes.length, 3);

  // 3. Multiple active filters via getOnlineDirectoryQuickFilterMeta
  const multiMeta = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'Deep Work',
    onlyInFocus: true,
  });
  assert.equal(multiMeta.breathPulseSpec.isBreathPulseActive, true);
  assert.equal(multiMeta.breathPulseSpec.activeCriteriaCount, 3);
  assert.equal(
    multiMeta.breathPulseSpec.animationName,
    'quickFilterEmeraldBreathPulse'
  );
  assert.equal(
    multiMeta.breathPulseSpec.cssClassName,
    'quick-filter-emerald-breath-pulse'
  );
  assert.ok(
    multiMeta.breathPulseSpec.statusLabel.includes('3 active filters')
  );
});

// ---------------------------------------------------------------------------
// 80. Small 'History' Icon Button Inside #online-directory-mood-filter Opening Dropdown of 5 Most Recently Used Filter Combinations
// ---------------------------------------------------------------------------
test('getQuickFilterHistoryIconButtonSpec and getOnlineDirectoryQuickFilterMeta configure the small History icon button inside #online-directory-mood-filter with a 5-item dropdown list for quick re-application', () => {
  // 1. Default closed state with 5 recently used filter combinations
  const closedSpec = getQuickFilterHistoryIconButtonSpec({
    currentAudienceFilter: 'everyone',
    currentMoodFilter: 'all',
    currentOnlyInFocus: false,
    isOpen: false,
  });
  assert.equal(closedSpec.parentFilterId, 'online-directory-mood-filter');
  assert.equal(closedSpec.buttonId, 'online-directory-mood-filter-history-btn');
  assert.equal(
    closedSpec.buttonTestId,
    'online-directory-mood-filter-history-btn'
  );
  assert.equal(
    closedSpec.iconTestId,
    'online-directory-mood-filter-history-icon'
  );
  assert.equal(closedSpec.iconComponent, 'History');
  assert.equal(closedSpec.label, 'History');
  assert.equal(closedSpec.menuId, 'online-directory-mood-filter-history-menu');
  assert.equal(
    closedSpec.menuTestId,
    'online-directory-mood-filter-history-menu'
  );
  assert.equal(closedSpec.isOpen, false);
  assert.equal(closedSpec.maxItems, 5);
  assert.equal(closedSpec.count, 5);
  assert.equal(closedSpec.badgeText, '5/5');
  assert.equal(closedSpec.options.length, 5);
  assert.equal(closedSpec.options[0].rank, 1);
  assert.equal(closedSpec.options[4].rank, 5);

  // 2. Open state via getOnlineDirectoryQuickFilterMeta
  const openMeta = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'Deep Work',
    onlyInFocus: true,
    isRecentFiltersDropdownOpen: true,
  });
  assert.equal(openMeta.historyIconButtonMeta.isOpen, true);
  assert.equal(
    openMeta.historyIconButtonMeta.buttonId,
    'online-directory-mood-filter-history-btn'
  );
  assert.equal(openMeta.historyIconButtonMeta.iconComponent, 'History');
  assert.equal(openMeta.historyIconButtonMeta.label, 'History');
  assert.equal(openMeta.historyIconButtonMeta.options.length, 5);
  assert.equal(
    openMeta.recentFiltersMeta.historyButtonId,
    'online-directory-mood-filter-history-btn'
  );

  // 3. Re-applying one of the 5 combinations from the History dropdown updates active combination
  const thirdOption = openMeta.historyIconButtonMeta.options[2];
  const applied = applyRecentDirectoryFilterCombination(
    DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS,
    thirdOption.id
  );
  assert.equal(applied.found, true);
  assert.equal(applied.audienceFilter, thirdOption.audienceFilter);
  assert.equal(applied.moodFilter, thirdOption.moodFilter);
  assert.equal(applied.onlyInFocus, thirdOption.onlyInFocus);
  assert.equal(applied.updatedHistory.length, 5);
  assert.equal(applied.updatedHistory[0].id, thirdOption.id);
});

// ---------------------------------------------------------------------------
// 81. Default State of Mood Category Drawers Opens Only 'Productive' on First Load
// ---------------------------------------------------------------------------
test('DEFAULT_MOOD_CATEGORY_DRAWER_EXPANSION_MAP, evaluateMoodCategoryDrawersToggleState, and getOnlineDirectoryQuickFilterMeta open only the Productive category drawer on first load', () => {
  // 1. Verify DEFAULT_MOOD_CATEGORY_DRAWER_EXPANSION_MAP opens only Productive
  assert.deepEqual(DEFAULT_MOOD_CATEGORY_DRAWER_EXPANSION_MAP, {
    Productive: true,
    Social: false,
    Away: false,
  });

  // 2. Verify evaluateMoodCategoryDrawersToggleState with no arguments defaults to Productive only (1/3)
  const defaultDrawerState = evaluateMoodCategoryDrawersToggleState();
  assert.equal(defaultDrawerState.isMainDrawerExpanded, true);
  assert.equal(defaultDrawerState.defaultOpenedCategory, 'Productive');
  assert.equal(defaultDrawerState.isDefaultSingleCategoryState, true);
  assert.deepEqual(defaultDrawerState.categoryExpansionMap, {
    Productive: true,
    Social: false,
    Away: false,
  });
  assert.deepEqual(defaultDrawerState.expandedCategories, ['Productive']);
  assert.deepEqual(defaultDrawerState.collapsedCategories, ['Social', 'Away']);
  assert.equal(defaultDrawerState.expandedCount, 1);
  assert.equal(defaultDrawerState.totalCount, 3);
  assert.equal(defaultDrawerState.areAllDrawersExpanded, false);
  assert.equal(defaultDrawerState.areAllDrawersCollapsed, false);
  assert.equal(defaultDrawerState.isAnyDrawerExpanded, true);
  assert.equal(defaultDrawerState.nextAction, 'expand_all');
  assert.equal(defaultDrawerState.statusBadgeLabel, 'Toggle All (1/3)');

  // 3. Verify getOnlineDirectoryQuickFilterMeta on first load reflects Productive-only default
  const firstLoadMeta = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
  });
  assert.equal(
    firstLoadMeta.moodDrawersToggleAll.defaultOpenedCategory,
    'Productive'
  );
  assert.equal(
    firstLoadMeta.moodDrawersToggleAll.isDefaultSingleCategoryState,
    true
  );
  assert.equal(firstLoadMeta.moodDrawersToggleAll.expandedCount, 1);
  assert.deepEqual(firstLoadMeta.moodDrawersToggleAll.expandedCategories, [
    'Productive',
  ]);
  assert.deepEqual(firstLoadMeta.moodDrawersToggleAll.collapsedCategories, [
    'Social',
    'Away',
  ]);
});

// ---------------------------------------------------------------------------
// 82. Small 'Trash' Icon Button in History Dropdown of #online-directory-mood-filter
// ---------------------------------------------------------------------------
test('removeRecentDirectoryFilterCombination and getQuickFilterHistoryIconButtonSpec allow clearing individual recent filter combinations from local storage history', () => {
  // 1. Verify getQuickFilterHistoryIconButtonSpec exposes per-item trash button metadata
  const initialSpec = getQuickFilterHistoryIconButtonSpec({
    history: DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS,
    currentAudienceFilter: 'everyone',
    currentMoodFilter: 'all',
    currentOnlyInFocus: false,
    isOpen: true,
  });
  assert.equal(initialSpec.deleteIconComponent, 'Trash2');
  assert.equal(initialSpec.canClearIndividualItems, true);
  assert.equal(
    initialSpec.storageKey,
    RECENT_DIRECTORY_FILTERS_STORAGE_KEY
  );
  assert.equal(initialSpec.options.length, 5);
  assert.equal(
    initialSpec.options[1].deleteButtonId,
    'online-directory-history-filter-delete-1'
  );
  assert.equal(
    initialSpec.options[1].deleteButtonTestId,
    'online-directory-history-filter-delete-1'
  );
  assert.equal(
    initialSpec.options[1].deleteIconTestId,
    'online-directory-history-filter-trash-icon-1'
  );
  assert.equal(initialSpec.options[1].deleteIconComponent, 'Trash2');
  assert.ok(
    initialSpec.options[1].deleteAriaLabel.includes(
      initialSpec.options[1].label
    )
  );

  // 2. Remove an individual recent filter combination by ID
  const secondCombo = DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS[1];
  const removalResult = removeRecentDirectoryFilterCombination(
    DEFAULT_RECENT_DIRECTORY_FILTER_COMBINATIONS,
    secondCombo.id
  );
  assert.equal(removalResult.removed, true);
  assert.equal(removalResult.removedId, secondCombo.id);
  assert.equal(removalResult.removedLabel, secondCombo.label);
  assert.equal(removalResult.removedRank, 2);
  assert.equal(removalResult.previousCount, 5);
  assert.equal(removalResult.remainingCount, 4);
  assert.equal(removalResult.updatedHistory.length, 4);
  assert.equal(
    removalResult.updatedHistory.some((item) => item.id === secondCombo.id),
    false
  );
  assert.deepEqual(
    JSON.parse(removalResult.serializedHistoryJson).map(
      (item: { id: string }) => item.id
    ),
    removalResult.updatedHistory.map((item) => item.id)
  );

  // 3. Re-evaluating getQuickFilterHistoryIconButtonSpec with the updated history reflects 4/5 items and re-indexes delete button IDs
  const afterOneRemovalSpec = getQuickFilterHistoryIconButtonSpec({
    history: removalResult.updatedHistory,
    currentAudienceFilter: 'everyone',
    currentMoodFilter: 'all',
    currentOnlyInFocus: false,
    isOpen: true,
  });
  assert.equal(afterOneRemovalSpec.count, 4);
  assert.equal(afterOneRemovalSpec.badgeText, '4/5');
  assert.equal(afterOneRemovalSpec.options.length, 4);
  assert.equal(afterOneRemovalSpec.options[0].rank, 1);
  assert.equal(afterOneRemovalSpec.options[3].rank, 4);

  // 4. Clearing all remaining items yields an empty history list with 0/5 badge
  const emptySpec = getQuickFilterHistoryIconButtonSpec({
    history: [],
    currentAudienceFilter: 'everyone',
    currentMoodFilter: 'all',
    currentOnlyInFocus: false,
    isOpen: true,
  });
  assert.equal(emptySpec.count, 0);
  assert.equal(emptySpec.hasRecentFilters, false);
  assert.equal(emptySpec.badgeText, '0/5');
  assert.equal(emptySpec.options.length, 0);
  assert.equal(
    emptySpec.emptyStateText,
    'No recent filter combinations in history.'
  );
});

// ---------------------------------------------------------------------------
// 83. Transient Checkmark Animation Next to 'Link' Label in #online-directory-quick-filter-icon-share-container
// ---------------------------------------------------------------------------
test('getQuickFilterShareLinkCheckmarkAnimationSpec and buildOnlineDirectoryFilterShareLink configure a transient checkmark animation next to the Link label in #online-directory-quick-filter-icon-share-container when copied', () => {
  // 1. Idle state (before copying filter link)
  const idleSpec = getQuickFilterShareLinkCheckmarkAnimationSpec(false);
  assert.equal(
    idleSpec.containerId,
    'online-directory-quick-filter-icon-share-container'
  );
  assert.equal(
    idleSpec.containerSelector,
    '#online-directory-quick-filter-icon-share-container'
  );
  assert.equal(idleSpec.linkLabelText, 'Link');
  assert.equal(idleSpec.alwaysShowLinkLabel, true);
  assert.equal(
    idleSpec.linkLabelTestId,
    'online-directory-quick-filter-share-link-label'
  );
  assert.equal(
    idleSpec.checkmarkId,
    'online-directory-quick-filter-share-checkmark'
  );
  assert.equal(
    idleSpec.checkmarkTestId,
    'online-directory-quick-filter-share-checkmark'
  );
  assert.equal(idleSpec.iconComponent, 'Check');
  assert.equal(idleSpec.placement, 'next-to-link-label');
  assert.equal(idleSpec.isCopied, false);
  assert.equal(idleSpec.isVisible, false);
  assert.equal(idleSpec.isTransient, true);
  assert.equal(
    idleSpec.transientDurationMs,
    QUICK_FILTER_SHARE_LINK_CHECKMARK_DURATION_MS
  );
  assert.equal(idleSpec.transientDurationMs, 3000);
  assert.equal(idleSpec.animationName, 'none');
  assert.equal(idleSpec.cssClassName, '');

  // 2. Copied state (when filter link is copied to clipboard)
  const copiedSpec = getQuickFilterShareLinkCheckmarkAnimationSpec(true);
  assert.equal(copiedSpec.isCopied, true);
  assert.equal(copiedSpec.isVisible, true);
  assert.equal(copiedSpec.alwaysShowLinkLabel, true);
  assert.equal(copiedSpec.linkLabelText, 'Link');
  assert.equal(copiedSpec.placement, 'next-to-link-label');
  assert.equal(copiedSpec.animationName, 'shareLinkCheckmarkPop');
  assert.equal(copiedSpec.animationType, 'transient-checkmark-pop');
  assert.equal(
    copiedSpec.cssClassName,
    'share-link-checkmark-transient-pop'
  );
  assert.deepEqual(copiedSpec.initial, {
    opacity: 0,
    scale: 0.4,
    rotate: -20,
    x: -2,
  });
  assert.deepEqual(copiedSpec.animate, {
    opacity: 1,
    scale: 1,
    rotate: 0,
    x: 0,
  });
  assert.deepEqual(copiedSpec.exit, {
    opacity: 0,
    scale: 0.5,
    rotate: 10,
    x: 2,
  });
  assert.deepEqual(copiedSpec.transition, {
    duration: 0.22,
    ease: 'easeOut',
  });
  assert.deepEqual(copiedSpec.scaleKeyframes, [0.4, 1.18, 1]);

  // 3. Verify integration through buildOnlineDirectoryFilterShareLink and getOnlineDirectoryQuickFilterMeta
  const metaCopied = getOnlineDirectoryQuickFilterMeta({
    mode: 'my_connections',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'category:Productive',
    isShareLinkCopied: true,
  });
  assert.equal(metaCopied.shareLinkMeta.isCopied, true);
  assert.equal(metaCopied.shareLinkMeta.checkmarkAnimation.isVisible, true);
  assert.equal(
    metaCopied.shareLinkMeta.checkmarkAnimation.linkLabelText,
    'Link'
  );
  assert.equal(
    metaCopied.shareLinkMeta.checkmarkAnimation.containerId,
    'online-directory-quick-filter-icon-share-container'
  );
  assert.equal(
    metaCopied.shareLinkMeta.checkmarkAnimation.checkmarkId,
    'online-directory-quick-filter-share-checkmark'
  );
});

// ---------------------------------------------------------------------------
// 84. Subtle 'Bounce' / 'Pop' Animation for #online-directory-mood-filter-reset-only When Clicked
// ---------------------------------------------------------------------------
test('getResetOnlyButtonBouncePopSpec, resolveSecondaryResetOnlyFilterAction, and getOnlineDirectoryQuickFilterMeta configure a subtle bounce/pop animation for #online-directory-mood-filter-reset-only when clicked', () => {
  // 1. Idle state (before button click)
  const idlePopSpec = getResetOnlyButtonBouncePopSpec({
    isBouncePopActive: false,
    triggerCount: 0,
  });
  assert.equal(
    idlePopSpec.buttonId,
    'online-directory-mood-filter-reset-only'
  );
  assert.equal(
    idlePopSpec.buttonSelector,
    '#online-directory-mood-filter-reset-only'
  );
  assert.equal(
    idlePopSpec.iconTestId,
    'online-directory-mood-filter-reset-only-icon'
  );
  assert.equal(idlePopSpec.isBouncePopActive, false);
  assert.equal(idlePopSpec.triggerCount, 0);
  assert.equal(idlePopSpec.animationName, 'none');
  assert.equal(idlePopSpec.iconAnimationName, 'none');
  assert.equal(idlePopSpec.animationType, 'subtle-bounce-pop');
  assert.equal(idlePopSpec.cssClassName, '');
  assert.equal(idlePopSpec.iconCssClassName, '');
  assert.equal(idlePopSpec.durationMs, RESET_ONLY_BUTTON_POP_DURATION_MS);
  assert.equal(idlePopSpec.durationMs, 380);
  assert.equal(idlePopSpec.durationSec, 0.38);
  assert.deepEqual(idlePopSpec.scaleKeyframes, [1, 1, 1, 1]);
  assert.deepEqual(idlePopSpec.translateYKeyframes, [0, 0, 0, 0]);
  assert.deepEqual(idlePopSpec.animate, { scale: 1, y: 0 });
  assert.deepEqual(idlePopSpec.whileHover, { scale: 1.04, y: -0.5 });
  assert.deepEqual(idlePopSpec.whileTap, { scale: 0.92, y: 0.5 });

  // 2. Active bounce/pop state when #online-directory-mood-filter-reset-only is clicked
  const activePopSpec = getResetOnlyButtonBouncePopSpec({
    isBouncePopActive: true,
    triggerCount: 2,
  });
  assert.equal(activePopSpec.isBouncePopActive, true);
  assert.equal(activePopSpec.triggerCount, 2);
  assert.equal(
    activePopSpec.animationName,
    'resetOnlyButtonSubtleBouncePop'
  );
  assert.equal(activePopSpec.iconAnimationName, 'resetOnlyIconSpinPop');
  assert.equal(
    activePopSpec.cssClassName,
    'reset-only-button-bounce-pop-active'
  );
  assert.equal(
    activePopSpec.iconCssClassName,
    'reset-only-icon-spin-pop-active'
  );
  assert.deepEqual(activePopSpec.scaleKeyframes, [1, 0.92, 1.12, 1]);
  assert.deepEqual(activePopSpec.translateYKeyframes, [0, 1, -2, 0]);
  assert.deepEqual(activePopSpec.iconRotateKeyframes, [0, -180, -360]);
  assert.deepEqual(activePopSpec.animate, {
    scale: [1, 0.92, 1.12, 1],
    y: [0, 1, -2, 0],
  });
  assert.equal(
    activePopSpec.feedbackText,
    'Filters reset · Bounce pop feedback active'
  );

  // 3. Verify integration through resolveSecondaryResetOnlyFilterAction and getOnlineDirectoryQuickFilterMeta
  const metaWithResetPop = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [{ uid: 'p1', mood: 'Deep Work' }],
    moodFilter: 'all',
    isResetOnlyBouncePopActive: true,
    resetOnlyBouncePopCount: 3,
  });
  assert.equal(
    metaWithResetPop.resetOnlyButtonMeta.buttonId,
    'online-directory-mood-filter-reset-only'
  );
  assert.equal(
    metaWithResetPop.resetOnlyButtonMeta.bouncePopSpec.isBouncePopActive,
    true
  );
  assert.equal(
    metaWithResetPop.resetOnlyButtonMeta.bouncePopSpec.triggerCount,
    3
  );
  assert.equal(
    metaWithResetPop.resetOnlyButtonMeta.bouncePopSpec.animationName,
    'resetOnlyButtonSubtleBouncePop'
  );
  assert.equal(
    metaWithResetPop.resetOnlyButtonMeta.bouncePopSpec.cssClassName,
    'reset-only-button-bounce-pop-active'
  );
});

test('Framer Motion layout animation spec for #online-directory-mood-filter and directory peer items configures smooth layout reordering and fade transitions', () => {
  // 1. Default unfiltered state
  const defaultLayoutSpec = getOnlineDirectoryPeerFilterLayoutAnimationSpec({
    audienceFilter: 'everyone',
    moodFilter: 'all',
    onlyInFocus: false,
    displayedPeersCount: 4,
    totalPeersCount: 4,
    filterTransitionCount: 0,
  });

  assert.equal(
    defaultLayoutSpec.filterElementId,
    'online-directory-mood-filter'
  );
  assert.equal(
    defaultLayoutSpec.filterElementSelector,
    '#online-directory-mood-filter'
  );
  assert.equal(
    defaultLayoutSpec.peerListContainerId,
    'online-directory-matching-peers-list'
  );
  assert.equal(defaultLayoutSpec.engine, 'framer-motion');
  assert.equal(defaultLayoutSpec.animationType, 'layout-reorder-fade');
  assert.equal(defaultLayoutSpec.presenceComponent, 'AnimatePresence');
  assert.equal(defaultLayoutSpec.presenceMode, 'popLayout');
  assert.equal(defaultLayoutSpec.presenceInitial, false);
  assert.equal(defaultLayoutSpec.layout, true);
  assert.equal(defaultLayoutSpec.peerItemLayout, true);
  assert.equal(defaultLayoutSpec.isFiltered, false);
  assert.equal(defaultLayoutSpec.activeFilterSignature, 'everyone|all|0');
  assert.equal(defaultLayoutSpec.displayedPeersCount, 4);
  assert.equal(defaultLayoutSpec.totalPeersCount, 4);
  assert.equal(defaultLayoutSpec.hiddenByFilterCount, 0);
  assert.deepEqual(defaultLayoutSpec.layoutSpring, {
    type: 'spring',
    stiffness: 360,
    damping: 30,
    mass: 0.75,
  });
  assert.equal(defaultLayoutSpec.fadeDurationSec, 0.24);
  assert.equal(defaultLayoutSpec.fadeDurationMs, 240);
  assert.equal(defaultLayoutSpec.fadeEasing, 'easeOut');
  assert.deepEqual(defaultLayoutSpec.peerItemInitial, {
    opacity: 0,
    y: 10,
    scale: 0.98,
  });
  assert.deepEqual(defaultLayoutSpec.peerItemAnimate, {
    opacity: 1,
    y: 0,
    scale: 1,
  });
  assert.deepEqual(defaultLayoutSpec.peerItemExit, {
    opacity: 0,
    y: -8,
    scale: 0.96,
  });
  assert.equal(
    defaultLayoutSpec.statusSummary,
    'Framer Motion layout reorder + fade ready (All 4 peers visible)'
  );

  // 2. Per-peer item motion with stagger and layout spring
  const firstPeerMotion = defaultLayoutSpec.getPeerItemMotion(0);
  assert.equal(firstPeerMotion.peerIndex, 0);
  assert.equal(firstPeerMotion.layout, true);
  assert.equal(firstPeerMotion.staggerDelaySec, 0);
  assert.deepEqual(firstPeerMotion.transition.layout, {
    type: 'spring',
    stiffness: 360,
    damping: 30,
    mass: 0.75,
  });
  assert.deepEqual(firstPeerMotion.transition.opacity, {
    duration: 0.24,
    ease: 'easeOut',
    delay: 0,
  });

  const thirdPeerMotion = defaultLayoutSpec.getPeerItemMotion(2);
  assert.equal(thirdPeerMotion.peerIndex, 2);
  assert.equal(thirdPeerMotion.staggerDelaySec, 0.06);
  assert.equal(thirdPeerMotion.transition.opacity.delay, 0.06);

  // 3. Filtered state through getOnlineDirectoryQuickFilterMeta
  const metaFiltered = getOnlineDirectoryQuickFilterMeta({
    mode: 'everyone',
    onlinePeers: [
      { uid: 'p1', mood: 'Deep Work' },
      { uid: 'p2', mood: 'Casual Chat' },
      { uid: 'p3', mood: 'Deep Work' },
    ],
    moodFilter: 'Deep Work',
    onlyInFocus: false,
    displayedPeersCount: 2,
    autoScrollTriggerCount: 1,
  });

  assert.equal(
    metaFiltered.peerLayoutAnimationSpec.filterElementId,
    'online-directory-mood-filter'
  );
  assert.equal(metaFiltered.peerLayoutAnimationSpec.isFiltered, true);
  assert.equal(metaFiltered.peerLayoutAnimationSpec.displayedPeersCount, 2);
  assert.equal(metaFiltered.peerLayoutAnimationSpec.totalPeersCount, 3);
  assert.equal(metaFiltered.peerLayoutAnimationSpec.hiddenByFilterCount, 1);
  assert.equal(metaFiltered.peerLayoutAnimationSpec.filterTransitionCount, 1);
  assert.equal(
    metaFiltered.peerLayoutAnimationSpec.activeFilterSignature,
    'everyone|deep work|0'
  );
  assert.match(
    metaFiltered.peerLayoutAnimationSpec.statusSummary,
    /Framer Motion layout reorder \+ fade active/
  );
});

test('Workspace shell (#workspace-shell) top header Share link button resolves current page URL and provides temporary UI feedback metadata', () => {
  assert.equal(WORKSPACE_HEADER_SHARE_FEEDBACK_DURATION_MS, 3000);

  // 1. URL resolution with valid http/https URLs and safe fallback
  assert.equal(
    resolveWorkspaceHeaderShareUrl('http://localhost:3000/?mood=Deep+Work'),
    'http://localhost:3000/?mood=Deep+Work'
  );
  assert.equal(
    resolveWorkspaceHeaderShareUrl('  https://mrstranger.app/workspace?room=FOCUS-101  '),
    'https://mrstranger.app/workspace?room=FOCUS-101'
  );
  assert.equal(resolveWorkspaceHeaderShareUrl(''), 'https://mrstranger.app/');
  assert.equal(resolveWorkspaceHeaderShareUrl(null), 'https://mrstranger.app/');

  // 2. Idle state (before clicking Share)
  const idleMeta = getWorkspaceHeaderShareButtonMeta({
    currentHref: 'http://localhost:3000/?filter=connections',
    isCopied: false,
    copyCount: 0,
  });
  assert.equal(idleMeta.shellSelector, '#workspace-shell');
  assert.equal(idleMeta.headerElementId, 'workspace-top-header');
  assert.equal(idleMeta.buttonElementId, 'workspace-header-share-btn');
  assert.equal(idleMeta.buttonTestId, 'workspace-header-share-btn');
  assert.equal(idleMeta.feedbackElementId, 'workspace-header-share-feedback');
  assert.equal(idleMeta.feedbackTestId, 'workspace-header-share-feedback');
  assert.equal(idleMeta.shareUrl, 'http://localhost:3000/?filter=connections');
  assert.equal(idleMeta.isCopied, false);
  assert.equal(idleMeta.copyCount, 0);
  assert.equal(idleMeta.buttonLabel, 'Share');
  assert.equal(idleMeta.feedbackMessage, '');
  assert.equal(idleMeta.feedbackDurationMs, 3000);
  assert.equal(idleMeta.ariaLabel, 'Copy current page URL to clipboard');
  assert.equal(idleMeta.statusRole, 'status');
  assert.equal(idleMeta.ariaLive, 'polite');

  // 3. Copied state (after clicking Share, showing temporary UI feedback message)
  const copiedMeta = getWorkspaceHeaderShareButtonMeta({
    currentHref: 'http://localhost:3000/?filter=connections',
    isCopied: true,
    copyCount: 1,
  });
  assert.equal(copiedMeta.isCopied, true);
  assert.equal(copiedMeta.copyCount, 1);
  assert.equal(copiedMeta.buttonLabel, 'Share');
  assert.equal(copiedMeta.copiedBadgeLabel, 'Copied!');
  assert.equal(copiedMeta.feedbackMessage, 'Page link copied to clipboard!');
  assert.equal(copiedMeta.ariaLabel, 'Current page URL copied to clipboard');
  assert.match(copiedMeta.title, /Page link copied to clipboard/);
});

test('Workspace shell (#workspace-shell) header QR Code button generates ISO/IEC 18004 QR matrix, SVG path, and popover metadata for current workspace URL', () => {
  assert.equal(WORKSPACE_HEADER_QR_QUIET_ZONE, 2);

  // 1. Generate QR matrix for a current workspace URL
  const qrMatrix = generateWorkspaceUrlQrMatrix(
    'http://localhost:3000/?room=STUDY-GLOBAL&mood=Deep+Work'
  );
  assert.equal(
    qrMatrix.url,
    'http://localhost:3000/?room=STUDY-GLOBAL&mood=Deep+Work'
  );
  assert.equal(qrMatrix.quietZone, 2);
  assert.equal(qrMatrix.moduleSize >= 21, true);
  assert.equal(qrMatrix.viewBoxSize, qrMatrix.moduleSize + 4);
  assert.equal(
    qrMatrix.viewBox,
    `0 0 ${qrMatrix.viewBoxSize} ${qrMatrix.viewBoxSize}`
  );
  assert.equal(qrMatrix.matrix.length, qrMatrix.moduleSize);
  assert.equal(qrMatrix.matrix[0].length, qrMatrix.moduleSize);
  assert.equal(qrMatrix.darkModulesCount > 100, true);
  assert.match(qrMatrix.svgPathData, /^M2,2h1v1h-1z/);

  // Finder pattern top-left corner (7x7 outer ring) must have dark modules at (0,0), (0,6), (6,0), (6,6)
  assert.equal(qrMatrix.matrix[0][0], true);
  assert.equal(qrMatrix.matrix[0][6], true);
  assert.equal(qrMatrix.matrix[6][0], true);
  assert.equal(qrMatrix.matrix[6][6], true);

  // 2. Closed vs Open metadata for #workspace-header-qr-btn and #workspace-header-qr-popover
  const closedMeta = getWorkspaceHeaderQrCodeMeta({
    currentHref: 'http://localhost:3000/?room=FOCUS-77',
    isOpen: false,
    isCopied: false,
    roomCode: 'FOCUS-77',
  });
  assert.equal(closedMeta.shellSelector, '#workspace-shell');
  assert.equal(closedMeta.headerElementId, 'workspace-top-header');
  assert.equal(closedMeta.buttonElementId, 'workspace-header-qr-btn');
  assert.equal(closedMeta.buttonTestId, 'workspace-header-qr-btn');
  assert.equal(closedMeta.popoverElementId, 'workspace-header-qr-popover');
  assert.equal(closedMeta.svgElementId, 'workspace-header-qr-svg');
  assert.equal(closedMeta.urlDisplayId, 'workspace-header-qr-url');
  assert.equal(closedMeta.copyButtonId, 'workspace-header-qr-copy-btn');
  assert.equal(closedMeta.closeButtonId, 'workspace-header-qr-close-btn');
  assert.equal(closedMeta.workspaceUrl, 'http://localhost:3000/?room=FOCUS-77');
  assert.equal(closedMeta.roomCode, 'FOCUS-77');
  assert.equal(closedMeta.isOpen, false);
  assert.equal(closedMeta.isCopied, false);
  assert.equal(closedMeta.buttonLabel, 'QR Code');
  assert.equal(closedMeta.dialogTitle, 'Mobile & Nearby Access QR Code');
  assert.equal(closedMeta.ariaLabel, 'Show QR code for current workspace URL');

  const openMeta = getWorkspaceHeaderQrCodeMeta({
    currentHref: 'http://localhost:3000/?room=FOCUS-77',
    isOpen: true,
    isCopied: true,
    roomCode: 'FOCUS-77',
  });
  assert.equal(openMeta.isOpen, true);
  assert.equal(openMeta.isCopied, true);
  assert.equal(openMeta.ariaLabel, 'Hide workspace URL QR code');
  assert.equal(openMeta.qrMatrix.moduleSize, closedMeta.qrMatrix.moduleSize);
  assert.equal(openMeta.instructionElementId, 'workspace-header-qr-instruction');
  assert.equal(openMeta.instructionTestId, 'workspace-header-qr-instruction');
  assert.equal(
    openMeta.instructionText,
    'Scan this QR code with your phone camera to instantly open the workspace on your mobile device.'
  );
});

test('Workspace shell (#workspace-shell) header QR Code popover generates downloadable PNG data URL and download button metadata', async () => {
  assert.equal(WORKSPACE_HEADER_QR_PNG_FEEDBACK_DURATION_MS, 3000);
  assert.equal(WORKSPACE_HEADER_QR_PNG_PIXEL_SCALE, 12);

  // 1. Filename sanitization for room codes
  assert.equal(
    buildWorkspaceHeaderQrPngFilename('STUDY-GLOBAL'),
    'mr-stranger-workspace-qr-study-global.png'
  );
  assert.equal(
    buildWorkspaceHeaderQrPngFilename('  Focus Room #42! '),
    'mr-stranger-workspace-qr-focus-room-42.png'
  );
  assert.equal(
    buildWorkspaceHeaderQrPngFilename(''),
    'mr-stranger-workspace-qr-study-global.png'
  );

  // 2. Idle vs Downloaded button metadata in getWorkspaceHeaderQrCodeMeta
  const idleQrMeta = getWorkspaceHeaderQrCodeMeta({
    currentHref: 'http://localhost:3000/?room=STUDY-GLOBAL',
    isOpen: true,
    isDownloaded: false,
    downloadCount: 0,
    roomCode: 'STUDY-GLOBAL',
  });
  assert.equal(idleQrMeta.downloadButtonId, 'workspace-header-qr-download-btn');
  assert.equal(idleQrMeta.downloadButtonTestId, 'workspace-header-qr-download-btn');
  assert.equal(
    idleQrMeta.downloadFilename,
    'mr-stranger-workspace-qr-study-global.png'
  );
  assert.equal(idleQrMeta.downloadPixelScale, 12);
  assert.equal(idleQrMeta.isDownloaded, false);
  assert.equal(idleQrMeta.downloadCount, 0);
  assert.equal(idleQrMeta.downloadButtonLabel, 'Download PNG');
  assert.equal(idleQrMeta.downloadedButtonLabel, 'Downloaded PNG!');
  assert.equal(
    idleQrMeta.downloadAriaLabel,
    'Download QR code image as PNG (mr-stranger-workspace-qr-study-global.png)'
  );

  const downloadedQrMeta = getWorkspaceHeaderQrCodeMeta({
    currentHref: 'http://localhost:3000/?room=STUDY-GLOBAL',
    isOpen: true,
    isDownloaded: true,
    downloadCount: 1,
    roomCode: 'STUDY-GLOBAL',
  });
  assert.equal(downloadedQrMeta.isDownloaded, true);
  assert.equal(downloadedQrMeta.downloadCount, 1);
  assert.equal(
    downloadedQrMeta.downloadAriaLabel,
    'QR code PNG downloaded (mr-stranger-workspace-qr-study-global.png)'
  );

  // 3. Real PNG data URL generation
  const pngDataUrl = await generateWorkspaceHeaderQrPngDataUrl(
    'http://localhost:3000/?room=STUDY-GLOBAL'
  );
  assert.match(pngDataUrl, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
  assert.equal(pngDataUrl.length > 200, true);
});

test('Workspace shell (#workspace-shell) header QR Code tracks hidden generation count state and popover header usage badge', () => {
  const initialClosedMeta = getWorkspaceHeaderQrCodeMeta({
    currentHref: 'http://localhost:3000/?room=STUDY-GLOBAL',
    isOpen: false,
    generationCount: 0,
    roomCode: 'STUDY-GLOBAL',
  });
  assert.equal(
    initialClosedMeta.generationCountHiddenInputId,
    'workspace-header-qr-generation-count-state'
  );
  assert.equal(
    initialClosedMeta.generationCountHiddenInputTestId,
    'workspace-header-qr-generation-count-state'
  );
  assert.equal(
    initialClosedMeta.generationBadgeId,
    'workspace-header-qr-generation-badge'
  );
  assert.equal(
    initialClosedMeta.generationBadgeTestId,
    'workspace-header-qr-generation-badge'
  );
  assert.equal(initialClosedMeta.generationCount, 0);
  assert.equal(initialClosedMeta.generationBadgeLabel, '0x generated');
  assert.equal(
    initialClosedMeta.generationBadgeTitle,
    'QR code generated 0 times in this session'
  );

  const firstGenMeta = getWorkspaceHeaderQrCodeMeta({
    currentHref: 'http://localhost:3000/?room=STUDY-GLOBAL',
    isOpen: true,
    generationCount: 1,
    roomCode: 'STUDY-GLOBAL',
  });
  assert.equal(firstGenMeta.generationCount, 1);
  assert.equal(firstGenMeta.generationBadgeLabel, '1x generated');
  assert.equal(
    firstGenMeta.generationBadgeTitle,
    'QR code generated 1 time in this session'
  );

  const thirdGenMeta = getWorkspaceHeaderQrCodeMeta({
    currentHref: 'http://localhost:3000/?room=STUDY-GLOBAL',
    isOpen: true,
    generationCount: 3,
    roomCode: 'STUDY-GLOBAL',
  });
  assert.equal(thirdGenMeta.generationCount, 3);
  assert.equal(thirdGenMeta.generationBadgeLabel, '3x generated');
  assert.equal(
    thirdGenMeta.generationBadgeTitle,
    'QR code generated 3 times in this session'
  );
});

test('Workspace shell (#workspace-shell) QR Code popover supports Camera API QR scanning, RGBA frame decoding, and joining scanned workspaces', () => {
  // 1. Camera API constraints default to environment (rear mobile camera)
  const cameraConstraints = buildWorkspaceCameraConstraints();
  assert.deepEqual(cameraConstraints, {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 640 },
      height: { ideal: 640 },
    },
  });

  // 2. End-to-end QR matrix -> RGBA camera frame -> jsQR decode -> workspace payload parse
  const targetWorkspaceUrl =
    'http://localhost:3000/?room=MOBILE-SYNC-99&mood=Deep+Work&focus=1';
  const rgbaFrame = renderWorkspaceQrMatrixToRgba(targetWorkspaceUrl, 6);
  assert.equal(rgbaFrame.width > 100, true);
  assert.equal(rgbaFrame.height, rgbaFrame.width);

  const decodedUrl = decodeWorkspaceQrFromRgbaFrame(
    rgbaFrame.data,
    rgbaFrame.width,
    rgbaFrame.height
  );
  assert.equal(decodedUrl, targetWorkspaceUrl);

  const parsedScan = parseScannedWorkspaceQrPayload(
    decodedUrl,
    'http://localhost:3000'
  );
  assert.equal(parsedScan.isValid, true);
  assert.equal(parsedScan.roomCode, 'MOBILE-SYNC-99');
  assert.equal(parsedScan.hasRoomParam, true);
  assert.equal(parsedScan.hasFilterParams, true);
  assert.equal(parsedScan.moodFilter, 'Deep Work');
  assert.equal(parsedScan.onlyInFocus, true);
  assert.equal(
    parsedScan.joinedStatusMessage,
    'Joined workspace room MOBILE-SYNC-99 via QR scan'
  );

  // 3. Direct room code and unsafe scheme handling
  const directRoomScan = parseScannedWorkspaceQrPayload(
    'focus-pod-7',
    'http://localhost:3000'
  );
  assert.equal(directRoomScan.isValid, true);
  assert.equal(directRoomScan.roomCode, 'FOCUS-POD-7');
  assert.equal(
    directRoomScan.workspaceUrl,
    'http://localhost:3000/?room=FOCUS-POD-7'
  );

  const unsafeScan = parseScannedWorkspaceQrPayload('javascript:alert(1)');
  assert.equal(unsafeScan.isValid, false);

  // 4. Camera scanner button and viewfinder metadata in getWorkspaceHeaderQrCodeMeta
  const idleScanMeta = getWorkspaceHeaderQrCodeMeta({
    currentHref: 'http://localhost:3000/?room=STUDY-GLOBAL',
    isOpen: true,
    isCameraScanning: false,
    cameraScanStatus: 'idle',
    roomCode: 'STUDY-GLOBAL',
  });
  assert.equal(
    idleScanMeta.scanCameraButtonId,
    'workspace-header-qr-scan-camera-btn'
  );
  assert.equal(
    idleScanMeta.scanCameraButtonTestId,
    'workspace-header-qr-scan-camera-btn'
  );
  assert.equal(
    idleScanMeta.cameraScannerContainerId,
    'workspace-header-qr-camera-scanner'
  );
  assert.equal(
    idleScanMeta.cameraVideoElementId,
    'workspace-header-qr-camera-video'
  );
  assert.equal(idleScanMeta.scanCameraButtonLabel, 'Scan QR with Camera');
  assert.equal(idleScanMeta.stopCameraButtonLabel, 'Stop Camera Scanner');
  assert.equal(idleScanMeta.isCameraScanning, false);
  assert.equal(idleScanMeta.cameraFacingMode, 'environment');

  const activeScanMeta = getWorkspaceHeaderQrCodeMeta({
    currentHref: 'http://localhost:3000/?room=STUDY-GLOBAL',
    isOpen: true,
    isCameraScanning: true,
    cameraScanStatus: 'scanning',
    roomCode: 'STUDY-GLOBAL',
  });
  assert.equal(activeScanMeta.isCameraScanning, true);
  assert.equal(activeScanMeta.cameraScanStatus, 'scanning');
  assert.equal(
    activeScanMeta.cameraScanStatusLabel,
    'Camera Active · Scanning QR'
  );
});
