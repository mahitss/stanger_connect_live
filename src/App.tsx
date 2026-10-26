import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  Users,
  MessageSquare,
  PhoneCall,
  BookOpen,
  Gamepad2,
  Camera,
  ShieldCheck,
  LogOut,
  Flame,
  Lock,
  Volume2,
  VolumeX,
  Share2,
  Check,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  X,
  Sun,
  Moon,
  Sparkles,
  Trophy,
  Bell,
  Clock,
  Zap,
  Filter,
  UserCheck,
  Globe,
  Link2,
  Info,
  Search,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from './firebase';
import {
  computeUpdatedStreak,
  formatDateKey,
  normalizeStudyRoomCode,
  validateAccountCredentials,
  deriveE2eeFingerprint,
  clampProductivityTarget,
  computeProductivityGoalProgress,
  buildDailyGoalShareSummary,
  DailyGoalMomentShareSummary,
  canUsersChatOrCall,
  detectSecurityThreat,
  sanitizeSafeText,
  LeaderboardCandidate,
  buildWeeklyActivityOverview,
  StoredDailyActivityRecord,
  UiSoundEffectPreferences,
  UiSoundAlertEvent,
  DEFAULT_UI_SOUND_PREFERENCES,
  toggleUiSoundEffects,
  resolveQuickFocusDeskSoundTrigger,
  shouldPlayUiNotificationSound,
  getOnlinePeerFocusStatus,
  summarizeOnlineDirectoryFocus,
  filterOnlinePeersByFocus,
  ONLINE_MOOD_CATEGORIES,
  ONLINE_MOOD_PRESETS,
  groupOnlineMoodPresetsByCategory,
  parseOnlineDirectoryMoodFilterSelection,
  normalizeAndValidatePeerMood,
  getOnlinePeerMoodMeta,
  summarizeOnlineDirectoryMoods,
  filterOnlinePeersByDirectoryCriteria,
  PeerMoodHistoryEvent,
  buildPopularMoodsLast24Hours,
  MomentCommentRecord,
  canUserCommentOnMoment,
  validateAndSanitizeMomentComment,
  groupMomentCommentsByMomentId,
  buildThreadedMomentComments,
  buildMomentCommentThreadGroups,
  toggleCollapsedCommentThread,
  resolveRootCommentIdForThread,
  getNestedThreadAnimationState,
  ThreadedMomentCommentItem,
  NestedThreadAnimationState,
  formatRelativeCommentTimestamp,
  TopicFocusSessionRecord,
  buildWeeklyProductivityDistribution,
  normalizeStudyTopicName,
  APP_LOGO_URL,
  buildMomentSharePayload,
  MomentSharePayload,
  CURATED_STUDY_MOMENT_IMAGES,
  getStudyMomentPlaceholderById,
  selectStudyMomentPlaceholder,
  resolveMomentPublishImageSource,
  MomentLightboxZoomState,
  openMomentLightbox,
  updateMomentLightboxZoom,
  MOMENT_LIGHTBOX_ZOOM_PRESETS,
  TwitterFeedFilter,
  TwitterChatMessage,
  toggleTweetReaction,
  toggleFollowUser,
  validateAndBuildTwitterChatMessage,
  AppThemeMode,
  THEME_STORAGE_KEY,
  resolveInitialThemeMode,
  toggleAppThemeMode,
  getThemeSwitcherMeta,
  evaluateUserBadges,
  recordConsecutiveGoalHitDay,
  validateAndBuildHelpfulNoteContribution,
  StreakFreezeInventoryState,
  DEFAULT_STREAK_FREEZE_STATE,
  evaluateStreakFreezeStatus,
  purchaseStreakFreeze,
  spendPointsToFreezeMissedDay,
  simulateMissedDayStreakEvaluation,
  StreakFocusReminderPreferences,
  DEFAULT_STREAK_REMINDER_PREFERENCES,
  STREAK_REMINDER_TIME_PRESETS,
  parseReminderTimeMinutes,
  evaluateStreakFocusReminder,
  QUICK_START_POMODORO_MINUTES,
  QUICK_START_PARTICIPATION_POINTS,
  applyQuickStartPomodoroBlock,
  buildConnectionRequestStatusMap,
  resolveOnlineDirectoryPeerDmShortcut,
  getProductivityProgressMotionSpec,
  OnlineDirectoryAudienceFilter,
  toggleOnlineDirectoryAudienceFilter,
  clearOnlineDirectoryAudienceFilter,
  getQuickFilterToggleHoverMotionSpec,
  resolveOnlineDirectoryFilterToggleAction,
  confirmOnlineDirectoryClearFilterReset,
  getOnlineDirectoryQuickFilterMeta,
  resolveQuickFilterToggleChime,
  buildOnlineDirectoryFilterShareLink,
  parseOnlineDirectoryFilterShareParams,
  toggleMoodCategoryDrawerExpanded,
  getMoodCategoryExpansionMotionSpec,
  getWorkspaceSidebarScrollSpec,
  getMoodPresetTooltipMeta,
  getMoodPresetUsageCount24hMeta,
  buildMoodPresetUsageCounts24hMap,
  filterMoodCategoryGroupsBySearchQuery,
} from './utils/rules';
import { playSubtleUiChime, previewUiSoundEffect } from './utils/soundEffects';
import { GameArcadeView, MultiplayerScore } from './components/GameArcadeView';
import {
  StudyRoomView,
  StudyDeskItem,
  StudyNoteRecord,
  StudyChatMessage,
} from './components/StudyRoomView';
import { TalkingRoomView } from './components/TalkingRoomView';
import { GlobalLeaderboard } from './components/GlobalLeaderboard';
import { WeeklyActivityOverview } from './components/WeeklyActivityOverview';
import { WeeklyProductivityDistribution } from './components/WeeklyProductivityDistribution';
import { PopularMoods24hSummary } from './components/PopularMoods24hSummary';
import { TwitterSocialSection } from './components/TwitterSocialSection';
import {
  UserProfileBadgesCard,
  AchievementBadgeChip,
} from './components/UserProfileBadgesCard';
import type { OnlinePeer } from '../server';

type SidebarPage =
  | 'hub'
  | 'chat'
  | 'talk'
  | 'study'
  | 'game_subway'
  | 'game_catapult'
  | 'game_blocks'
  | 'moments'
  | 'privacy'
  | 'signout';

interface ConnectionRequestDoc {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  status: 'pending' | 'accepted' | 'declined';
  note: string;
}

interface DirectMessageDoc {
  id: string;
  senderUid: string;
  senderName: string;
  receiverUid: string;
  text: string;
  timestamp: number;
}

interface MomentPostDoc {
  id: string;
  authorUid: string;
  authorName: string;
  caption: string;
  photoDataUrl: string;
  visibility: 'public' | 'connections';
  createdAtMs?: number;
}

interface AccountIdentity {
  uid: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  streakCount: number;
  lastLoginDate: string;
  participationPoints: number;
  privacyVisibility: 'everyone' | 'connections_only' | 'ghost';
  readReceiptsEnabled: boolean;
  allowCallsFromConnectionsOnly: boolean;
}

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Detect ?room=CODE invite URL parameter or ?moment=ID shared moment URL parameter on arrival
  const initialRoomParam = (() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('room');
    return r ? normalizeStudyRoomCode(r) : '';
  })();

  const initialMomentParam = (() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('moment');
    return m ? sanitizeSafeText(m.trim(), 120) : '';
  })();

  const [activeStudyRoomCode, setActiveStudyRoomCode] = useState<string>(
    initialRoomParam || 'STUDY-GLOBAL'
  );

  const [activePage, setActivePage] = useState<SidebarPage>(() =>
    initialRoomParam ? 'study' : initialMomentParam ? 'moments' : 'hub'
  );

  // Persistent Authenticated Account State
  const [accountSession, setAccountSession] = useState<AccountIdentity | null>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_account_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Persistent Streak Freeze Inventory & Missed-Day Protection State
  const [streakFreezeState, setStreakFreezeState] = useState<StreakFreezeInventoryState>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_streak_freeze_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            streakFreezesOwned: Math.max(0, Number(parsed.streakFreezesOwned) || 0),
            frozenDates: Array.isArray(parsed.frozenDates) ? parsed.frozenDates : [],
            lastFreezeUsedDate: parsed.lastFreezeUsedDate || null,
            streakAtRiskCount:
              typeof parsed.streakAtRiskCount === 'number' ? parsed.streakAtRiskCount : null,
            missedDateKey: parsed.missedDateKey || null,
          };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_STREAK_FREEZE_STATE;
  });

  // Persistent Theme Mode State ('dark' default, toggles to 'light')
  const [themeMode, setThemeMode] = useState<AppThemeMode>(() => {
    try {
      return resolveInitialThemeMode(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.toggle('dark', themeMode === 'dark');
      root.classList.toggle('light', themeMode === 'light');
      root.setAttribute('data-theme', themeMode);
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // ignore storage errors
    }
  }, [themeMode]);

  const handleToggleTheme = () => {
    setThemeMode((prev) => toggleAppThemeMode(prev));
  };

  const themeMeta = getThemeSwitcherMeta(themeMode);

  // Sign-In / Create Account Form State (Email ID, Password & Account Info)
  const [authTab, setAuthTab] = useState<'signup' | 'signin'>('signup');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [accountNameInput, setAccountNameInput] = useState('');
  const [accountBioInput, setAccountBioInput] = useState('');
  const [authFormError, setAuthFormError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Sign-Out Verification State (Email ID, Password & Account Confirmation)
  const [signOutEmailConfirm, setSignOutEmailConfirm] = useState('');
  const [signOutPasswordConfirm, setSignOutPasswordConfirm] = useState('');
  const [signOutError, setSignOutError] = useState('');

  // Authoritative Real-Time WebSocket State
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [onlinePeers, setOnlinePeers] = useState<OnlinePeer[]>([]);
  const [studyDesks, setStudyDesks] = useState<StudyDeskItem[]>([]);
  const [gameScores, setGameScores] = useState<MultiplayerScore[]>([]);
  const [studyChat, setStudyChat] = useState<StudyChatMessage[]>([]);
  const [incomingCallSignal, setIncomingCallSignal] = useState<{
    fromUid: string;
    fromName: string;
    callType: 'audio' | 'video';
    signalData: Record<string, unknown>;
  } | null>(null);

  // Firestore & Real-Time Synchronized Collections
  const [requests, setRequests] = useState<ConnectionRequestDoc[]>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_requests_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  useEffect(() => {
    try {
      localStorage.setItem('mr_stranger_requests_v1', JSON.stringify(requests));
    } catch {
      // ignore
    }
  }, [requests]);
  const [messages, setMessages] = useState<DirectMessageDoc[]>([]);
  const [moments, setMoments] = useState<MomentPostDoc[]>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_moments_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [momentComments, setMomentComments] = useState<MomentCommentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_moment_comments_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [studyNotes, setStudyNotes] = useState<StudyNoteRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_study_notes_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [firestoreProfiles, setFirestoreProfiles] = useState<LeaderboardCandidate[]>([]);
  const [serverPlatformUsers, setServerPlatformUsers] = useState<LeaderboardCandidate[]>([]);

  // UI Controls for Requests, Chat, and Photo Moments
  const [requestNoteMap, setRequestNoteMap] = useState<Record<string, string>>({});
  const [activeChatPeerUid, setActiveChatPeerUid] = useState<string>('');
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [chatError, setChatError] = useState('');

  const [momentCaption, setMomentCaption] = useState('');
  const [momentPhotoDataUrl, setMomentPhotoDataUrl] = useState('');
  const [selectedMomentPlaceholderId, setSelectedMomentPlaceholderId] = useState<
    string | null
  >(null);
  const [momentVisibility, setMomentVisibility] = useState<'public' | 'connections'>('public');
  const [momentError, setMomentError] = useState('');
  const [momentFilter, setMomentFilter] = useState<TwitterFeedFilter>('all');
  const [momentCommentInputs, setMomentCommentInputs] = useState<Record<string, string>>({});
  const [momentReplyInputs, setMomentReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyTargetByMoment, setActiveReplyTargetByMoment] = useState<
    Record<string, { commentId: string; authorName: string } | null>
  >({});
  const [collapsedCommentThreadIds, setCollapsedCommentThreadIds] = useState<string[]>([]);
  const [momentCommentErrors, setMomentCommentErrors] = useState<Record<string, string>>({});
  const [commentClockNowMs, setCommentClockNowMs] = useState<number>(() => Date.now());
  const [copiedMomentShare, setCopiedMomentShare] = useState<MomentSharePayload | null>(null);
  const [momentLightbox, setMomentLightbox] = useState<MomentLightboxZoomState | null>(null);
  const shareResetTimerRef = useRef<number | null>(null);

  // Twitter / X Social Section State (Likes, Retweets, Bookmarks, Follows, & Live Twitter Chat)
  const [twitterLikes, setTwitterLikes] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_twitter_likes_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });
  const [twitterRetweets, setTwitterRetweets] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_twitter_retweets_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });
  const [twitterBookmarks, setTwitterBookmarks] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_twitter_bookmarks_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });
  const [followedUids, setFollowedUids] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_twitter_follows_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return ['tw_elenavostok'];
  });
  const [twitterChats, setTwitterChats] = useState<TwitterChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_twitter_chats_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'twchat_seed_1',
        channelId: 'global_townsquare',
        senderUid: 'tw_elenavostok',
        senderName: 'Elena Rostova',
        senderHandle: '@elena_rostova',
        recipientUid: null,
        text: 'Welcome to Twitter / X inside Mr. Stranger! Drop your study setups, #DeepWork updates, or chat live here.',
        photoDataUrl: null,
        createdAtMs: Date.now() - 180_000,
      },
    ];
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCommentClockNowMs(Date.now());
    }, 15_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!momentLightbox?.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMomentLightbox(null);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setMomentLightbox((prev) =>
          prev ? updateMomentLightboxZoom(prev, 'in') : null
        );
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setMomentLightbox((prev) =>
          prev ? updateMomentLightboxZoom(prev, 'out') : null
        );
      } else if (e.key === '0') {
        e.preventDefault();
        setMomentLightbox((prev) =>
          prev ? updateMomentLightboxZoom(prev, 'reset') : null
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [momentLightbox?.isOpen]);

  // Daily Productivity Goal State (Target Focus Time & Completed Minutes for Today)
  const todayDateStr = formatDateKey(new Date());
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_daily_goal_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return clampProductivityTarget(Number(parsed.targetMinutes) || 120);
      }
    } catch {
      // ignore
    }
    return 120;
  });
  const [dailyCompletedMinutes, setDailyCompletedMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_daily_goal_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dateKey === formatDateKey(new Date())) {
          return Math.max(0, Number(parsed.completedMinutes) || 0);
        }
      }
    } catch {
      // ignore
    }
    return 30;
  });
  const prevCompletedMinutesRef = useRef<number | null>(null);
  const [lastCompletedMinutesSnapshot, setLastCompletedMinutesSnapshot] = useState<
    number | null
  >(null);
  useEffect(() => {
    if (prevCompletedMinutesRef.current !== dailyCompletedMinutes) {
      setLastCompletedMinutesSnapshot(prevCompletedMinutesRef.current);
      prevCompletedMinutesRef.current = dailyCompletedMinutes;
    }
  }, [dailyCompletedMinutes]);
  const [targetInputMinutes, setTargetInputMinutes] = useState<string>(() =>
    String(dailyTargetMinutes)
  );
  const [weeklyActivityHistory, setWeeklyActivityHistory] = useState<
    Record<string, StoredDailyActivityRecord>
  >(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_weekly_activity_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // ignore
    }
    return {};
  });
  const [topicFocusSessions, setTopicFocusSessions] = useState<TopicFocusSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_topic_sessions_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [todayPointsEarned, setTodayPointsEarned] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_weekly_activity_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const todayRec = parsed?.[formatDateKey(new Date())];
        if (todayRec && typeof todayRec.pointsEarned === 'number') {
          return Math.max(25, Math.round(todayRec.pointsEarned));
        }
      }
    } catch {
      // ignore
    }
    return 25;
  });
  const [streakReminderPrefs, setStreakReminderPrefs] =
    useState<StreakFocusReminderPreferences>(() => {
      try {
        const saved = localStorage.getItem('mr_stranger_streak_reminder_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            return {
              enabled:
                typeof parsed.enabled === 'boolean'
                  ? parsed.enabled
                  : DEFAULT_STREAK_REMINDER_PREFERENCES.enabled,
              reminderTime24h: parseReminderTimeMinutes(parsed.reminderTime24h).formatted24h,
              dismissedDateKey:
                typeof parsed.dismissedDateKey === 'string' ? parsed.dismissedDateKey : null,
              startedFocusDateKey:
                typeof parsed.startedFocusDateKey === 'string'
                  ? parsed.startedFocusDateKey
                  : null,
              simulatedPastCutoff: Boolean(parsed.simulatedPastCutoff),
            };
          }
        }
      } catch {
        // ignore
      }
      return DEFAULT_STREAK_REMINDER_PREFERENCES;
    });
  const [clockHoursMinutes, setClockHoursMinutes] = useState<{
    hours: number;
    minutes: number;
  }>(() => {
    const now = new Date();
    return { hours: now.getHours(), minutes: now.getMinutes() };
  });
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      setClockHoursMinutes({ hours: now.getHours(), minutes: now.getMinutes() });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const [securityNotice, setSecurityNotice] = useState<string>('');
  const [quickStartFeedback, setQuickStartFeedback] = useState<string>('');
  const [sharedDailyGoalSummary, setSharedDailyGoalSummary] = useState<
    (DailyGoalMomentShareSummary & { momentId: string; copied: boolean }) | null
  >(null);
  const initialFilterShareParams = (() => {
    try {
      return parseOnlineDirectoryFilterShareParams(window.location.search);
    } catch {
      return {
        hasFilterParams: false,
        audienceFilter: 'everyone' as OnlineDirectoryAudienceFilter,
        moodFilter: 'all',
        onlyInFocus: false,
      };
    }
  })();
  const [showOnlyInFocusPeers, setShowOnlyInFocusPeers] = useState<boolean>(
    initialFilterShareParams.onlyInFocus
  );
  const [directoryMoodFilter, setDirectoryMoodFilter] = useState<string>(
    initialFilterShareParams.moodFilter
  );
  const [moodPresetSearchQuery, setMoodPresetSearchQuery] = useState<string>('');
  const [isMoodCategoriesExpanded, setIsMoodCategoriesExpanded] = useState<boolean>(true);
  const [hoveredCategoryDrawerPresetId, setHoveredCategoryDrawerPresetId] =
    useState<string | null>(null);
  const [hoveredMoodSetterPresetId, setHoveredMoodSetterPresetId] =
    useState<string | null>(null);
  const [directoryAudienceFilter, setDirectoryAudienceFilter] =
    useState<OnlineDirectoryAudienceFilter>(initialFilterShareParams.audienceFilter);
  const [isQuickFilterHovered, setIsQuickFilterHovered] = useState<boolean>(false);
  const [isDirectoryFilterLinkCopied, setIsDirectoryFilterLinkCopied] =
    useState<boolean>(false);
  const [lastCopiedDirectoryFilterUrl, setLastCopiedDirectoryFilterUrl] =
    useState<string>('');
  const [lastDirectoryFilterChime, setLastDirectoryFilterChime] = useState<
    'start' | 'end' | null
  >(null);
  const [directoryFilterChimeCount, setDirectoryFilterChimeCount] = useState<number>(0);
  const filterLinkCopyTimerRef = useRef<number | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const [isSidebarFocused, setIsSidebarFocused] = useState<boolean>(false);
  const [isSidebarProgrammaticScroll, setIsSidebarProgrammaticScroll] =
    useState<boolean>(false);
  const sidebarScrollAreaRef = useRef<HTMLDivElement | null>(null);
  const sidebarProgrammaticTimerRef = useRef<number | null>(null);
  const [isClearFilterModalOpen, setIsClearFilterModalOpen] = useState<boolean>(false);
  useEffect(() => {
    if (!isClearFilterModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsClearFilterModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isClearFilterModalOpen]);
  const [userMood, setUserMood] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_user_mood_v1');
      if (saved !== null) {
        const parsed = normalizeAndValidatePeerMood(saved);
        return parsed.valid ? parsed.mood : 'Deep Work';
      }
    } catch {
      // ignore
    }
    return 'Deep Work';
  });
  const userMoodRef = useRef<string | null>(userMood);
  useEffect(() => {
    userMoodRef.current = userMood;
  }, [userMood]);
  const [customMoodInput, setCustomMoodInput] = useState<string>('');
  const [moodInputError, setMoodInputError] = useState<string>('');
  const [moodEvents, setMoodEvents] = useState<PeerMoodHistoryEvent[]>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_mood_events_24h_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Subtle UI Sound Effect Preferences (Incoming Messages & Connection Requests, with Background Boost)
  const [uiSoundPrefs, setUiSoundPrefs] = useState<UiSoundEffectPreferences>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_ui_sound_prefs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
            incomingMessages:
              typeof parsed.incomingMessages === 'boolean' ? parsed.incomingMessages : true,
            connectionRequests:
              typeof parsed.connectionRequests === 'boolean'
                ? parsed.connectionRequests
                : true,
            backgroundBoost:
              typeof parsed.backgroundBoost === 'boolean' ? parsed.backgroundBoost : true,
            volumePercent:
              typeof parsed.volumePercent === 'number' ? parsed.volumePercent : 65,
          };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_UI_SOUND_PREFERENCES;
  });
  const uiSoundPrefsRef = useRef<UiSoundEffectPreferences>(uiSoundPrefs);
  useEffect(() => {
    uiSoundPrefsRef.current = uiSoundPrefs;
  }, [uiSoundPrefs]);

  const [lastSoundFeedback, setLastSoundFeedback] = useState<string>(
    'Background & live chimes active (Messages & Requests)'
  );
  const [lastFocusDeskChime, setLastFocusDeskChime] = useState<'start' | 'end' | null>(
    null
  );
  const seenIncomingRequestIdsRef = useRef<Set<string>>(new Set());
  const initialRequestsLoadedRef = useRef<boolean>(false);

  const currentIdentity: AccountIdentity | null = authUser
    ? {
        uid: authUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_'),
        email: authUser.email || accountSession?.email || 'verified@google.com',
        displayName:
          authUser.displayName ||
          accountSession?.displayName ||
          authUser.email?.split('@')[0] ||
          'Verified Member',
        bio: accountSession?.bio || 'Verified Google Account on Mr. Stranger',
        avatarUrl: authUser.photoURL || '',
        streakCount: accountSession?.streakCount || 1,
        lastLoginDate: accountSession?.lastLoginDate || formatDateKey(new Date()),
        participationPoints: accountSession?.participationPoints || 25,
        privacyVisibility: accountSession?.privacyVisibility || 'everyone',
        readReceiptsEnabled: accountSession?.readReceiptsEnabled ?? true,
        allowCallsFromConnectionsOnly: accountSession?.allowCallsFromConnectionsOnly ?? true,
      }
    : accountSession;

  // Test connection on boot as required by Firebase integration skill
  useEffect(() => {
    testFirestoreConnection();
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);

      if (user) {
        const cleanUid = user.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
        const profileRef = doc(db, 'profiles', cleanUid);
        const privateRef = doc(db, 'privateAccounts', cleanUid);
        const todayKey = formatDateKey(new Date());
        const userEmail = (user.email || 'verified@user.app').slice(0, 160);

        try {
          const snap = await getDoc(profileRef);
          if (snap.exists()) {
            const data = snap.data();
            const { updated, incremented } = computeUpdatedStreak(
              {
                streakCount: Math.max(1, Number(data.streakCount) || 1),
                lastLoginDate: String(data.lastLoginDate || todayKey),
                participationPoints: Math.max(0, Number(data.participationPoints) || 25),
              },
              todayKey,
              10
            );
            const normalizedDisplayName = String(
              data.displayName || user.displayName || userEmail.split('@')[0] || 'Member'
            ).slice(0, 64);
            const normalizedBio = String(data.bio || 'Connected on Mr. Stranger').slice(0, 300);
            const normalizedAvatar = String(data.avatarUrl || user.photoURL || '').slice(0, 200000);
            const normalizedVisibility: AccountIdentity['privacyVisibility'] =
              data.privacyVisibility === 'connections_only' || data.privacyVisibility === 'ghost'
                ? data.privacyVisibility
                : 'everyone';

            const merged: AccountIdentity = {
              uid: cleanUid,
              email: userEmail,
              displayName: normalizedDisplayName,
              bio: normalizedBio,
              avatarUrl: normalizedAvatar,
              privacyVisibility: normalizedVisibility,
              readReceiptsEnabled: true,
              allowCallsFromConnectionsOnly: true,
              ...updated,
            };
            setAccountSession(merged);
            localStorage.setItem('mr_stranger_account_v2', JSON.stringify(merged));

            const needsSchemaMigration =
              !data.privacyVisibility ||
              !data.createdAt ||
              typeof data.bio !== 'string' ||
              typeof data.avatarUrl !== 'string';

            if (incremented || needsSchemaMigration) {
              await setDoc(profileRef, {
                uid: cleanUid,
                displayName: normalizedDisplayName,
                bio: normalizedBio,
                avatarUrl: normalizedAvatar,
                streakCount: updated.streakCount,
                lastLoginDate: updated.lastLoginDate,
                participationPoints: updated.participationPoints,
                privacyVisibility: normalizedVisibility,
                createdAt: data.createdAt || serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } else {
            const initialProfile = {
              uid: cleanUid,
              displayName: (user.displayName || userEmail.split('@')[0] || 'Member').slice(0, 64),
              bio: 'Verified account on Mr. Stranger',
              avatarUrl: (user.photoURL || '').slice(0, 200000),
              streakCount: 1,
              lastLoginDate: todayKey,
              participationPoints: 25,
              privacyVisibility: 'everyone' as const,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(profileRef, initialProfile);
            await setDoc(privateRef, {
              uid: cleanUid,
              email: userEmail,
              e2eeFingerprint: deriveE2eeFingerprint(cleanUid, userEmail),
              readReceiptsEnabled: true,
              allowCallsFromConnectionsOnly: true,
              updatedAt: serverTimestamp(),
            });
            const merged: AccountIdentity = {
              uid: cleanUid,
              email: userEmail,
              displayName: initialProfile.displayName,
              bio: initialProfile.bio,
              avatarUrl: initialProfile.avatarUrl,
              streakCount: 1,
              lastLoginDate: todayKey,
              participationPoints: 25,
              privacyVisibility: 'everyone',
              readReceiptsEnabled: true,
              allowCallsFromConnectionsOnly: true,
            };
            setAccountSession(merged);
            localStorage.setItem('mr_stranger_account_v2', JSON.stringify(merged));
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `profiles/${cleanUid}`);
        }
      }
    });
    return () => unsub();
  }, []);

  // Attach Firestore Real-Time Listeners when authenticated with Firebase
  useEffect(() => {
    if (!authReady || !authUser) return;
    const cleanUid = authUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_');

    const sentQ = query(collection(db, 'requests'), where('fromUid', '==', cleanUid));
    const unsubSent = onSnapshot(
      sentQ,
      (snap) => {
        const items: ConnectionRequestDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ConnectionRequestDoc, 'id'>),
        }));
        setRequests((prev) => {
          const others = prev.filter((r) => r.fromUid !== cleanUid);
          return [...others, ...items];
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'requests')
    );

    const recQ = query(collection(db, 'requests'), where('toUid', '==', cleanUid));
    const unsubRec = onSnapshot(
      recQ,
      (snap) => {
        const items: ConnectionRequestDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ConnectionRequestDoc, 'id'>),
        }));
        if (initialRequestsLoadedRef.current) {
          for (const item of items) {
            if (
              item.status === 'pending' &&
              !seenIncomingRequestIdsRef.current.has(item.id)
            ) {
              const isBg =
                typeof document !== 'undefined' &&
                (document.hidden || !document.hasFocus());
              const check = shouldPlayUiNotificationSound({
                preferences: uiSoundPrefsRef.current,
                eventType: 'connection_request',
                senderUid: item.fromUid,
                currentUid: cleanUid,
                isAppInBackground: isBg,
              });
              if (check.shouldPlay && check.chime) {
                playSubtleUiChime(check.chime);
                setLastSoundFeedback(
                  `Chime played: Connection Request from ${item.fromName} (${check.chime.noteNames})`
                );
              }
            }
          }
        }
        items.forEach((i) => seenIncomingRequestIdsRef.current.add(i.id));
        initialRequestsLoadedRef.current = true;
        setRequests((prev) => {
          const others = prev.filter((r) => r.toUid !== cleanUid);
          return [...others, ...items];
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'requests')
    );

    const momentsQ = query(
      collection(db, 'moments'),
      where('visibility', '==', 'public'),
      limit(25)
    );
    const unsubMoments = onSnapshot(
      momentsQ,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({
            id: d.id,
            authorUid: String(d.data().authorUid),
            authorName: String(d.data().authorName),
            caption: String(d.data().caption),
            photoDataUrl: String(d.data().photoDataUrl),
            visibility: (d.data().visibility as 'public' | 'connections') || 'public',
            createdAtMs: d.data().createdAt?.toMillis?.() || 0,
          }))
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        setMoments(docs);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'moments')
    );

    const notesQ = query(
      collection(db, 'studyNotes'),
      where('focusMinutes', '>=', 1),
      limit(25)
    );
    const unsubNotes = onSnapshot(
      notesQ,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({
            id: d.id,
            authorUid: String(d.data().authorUid),
            authorName: String(d.data().authorName),
            roomCode: String(d.data().roomCode || 'STUDY-GLOBAL'),
            subject: String(d.data().subject),
            positiveNote: String(d.data().positiveNote),
            focusMinutes: Number(d.data().focusMinutes) || 25,
            createdAtMs: d.data().createdAt?.toMillis?.() || 0,
          }))
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        setStudyNotes(docs);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'studyNotes')
    );

    const profilesQ = query(
      collection(db, 'profiles'),
      where('streakCount', '>=', 1),
      limit(50)
    );
    const unsubProfiles = onSnapshot(
      profilesQ,
      (snap) => {
        const docs: LeaderboardCandidate[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: String(data.uid || d.id),
            displayName: String(data.displayName || 'Verified Member'),
            bio: String(data.bio || 'Connected on Mr. Stranger'),
            streakCount: Math.max(1, Number(data.streakCount) || 1),
            participationPoints: Math.max(0, Number(data.participationPoints) || 0),
            privacyVisibility:
              data.privacyVisibility === 'connections_only' ||
              data.privacyVisibility === 'ghost'
                ? data.privacyVisibility
                : 'everyone',
          };
        });
        setFirestoreProfiles(docs);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'profiles')
    );

    const commentsQ = query(
      collection(db, 'momentComments'),
      where('visibility', '==', 'public'),
      limit(100)
    );
    const unsubComments = onSnapshot(
      commentsQ,
      (snap) => {
        const docs: MomentCommentRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            momentId: String(data.momentId || ''),
            momentAuthorUid: String(data.momentAuthorUid || ''),
            authorUid: String(data.authorUid || ''),
            authorName: String(data.authorName || 'Member'),
            text: String(data.text || ''),
            visibility: (data.visibility as 'public' | 'connections') || 'public',
            createdAtMs: data.createdAt?.toMillis?.() || Date.now(),
            ...(data.parentCommentId ? { parentCommentId: String(data.parentCommentId) } : {}),
            ...(data.replyToAuthorName
              ? { replyToAuthorName: String(data.replyToAuthorName) }
              : {}),
          };
        });
        setMomentComments((prev) => {
          const mergedMap = new Map<string, MomentCommentRecord>();
          prev.forEach((c) => mergedMap.set(c.id, c));
          docs.forEach((c) => mergedMap.set(c.id, c));
          const next = Array.from(mergedMap.values());
          localStorage.setItem('mr_stranger_moment_comments_v1', JSON.stringify(next));
          return next;
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'momentComments')
    );

    return () => {
      unsubSent();
      unsubRec();
      unsubMoments();
      unsubNotes();
      unsubProfiles();
      unsubComments();
    };
  }, [authReady, authUser]);

  // Fetch initial platform-wide leaderboard standings from server
  useEffect(() => {
    if (!currentIdentity) return;
    fetch('/api/leaderboard')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.users)) {
          setServerPlatformUsers(data.users);
        }
      })
      .catch(() => {
        // ignore if offline
      });
  }, [currentIdentity?.uid]);

  // Connect to Real-Time WebSocket Server
  useEffect(() => {
    if (!currentIdentity) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'peer:announce',
          peer: {
            uid: currentIdentity.uid,
            displayName: currentIdentity.displayName,
            bio: currentIdentity.bio,
            avatarUrl: currentIdentity.avatarUrl,
            streakCount: currentIdentity.streakCount,
            participationPoints: currentIdentity.participationPoints,
            privacyVisibility: currentIdentity.privacyVisibility,
            currentMode: activePage === 'signout' ? 'hub' : activePage,
            activeStudyRoomCode,
            activeGameId: null,
            mood: userMoodRef.current,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data));
        if (msg.type === 'server:state_sync') {
          setOnlinePeers(Array.isArray(msg.peers) ? msg.peers : []);
          if (Array.isArray(msg.platformUsers)) {
            setServerPlatformUsers(msg.platformUsers);
          }
          setStudyDesks(Array.isArray(msg.studyDesks) ? msg.studyDesks : []);
          setGameScores(Array.isArray(msg.gameScores) ? msg.gameScores : []);
          if (Array.isArray(msg.moments)) {
            setMoments((prev) => {
              const mergedMap = new Map<string, MomentPostDoc>();
              for (const raw of msg.moments) {
                if (raw && raw.id && raw.photoDataUrl) {
                  mergedMap.set(String(raw.id), {
                    id: String(raw.id),
                    authorUid: String(raw.authorUid || ''),
                    authorName: String(raw.authorName || 'Member'),
                    caption: String(raw.caption || ''),
                    photoDataUrl: String(raw.photoDataUrl),
                    visibility: raw.visibility === 'connections' ? 'connections' : 'public',
                  });
                }
              }
              prev.forEach((m) => {
                if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
              });
              const next = Array.from(mergedMap.values());
              localStorage.setItem('mr_stranger_moments_v1', JSON.stringify(next));
              return next;
            });
          }
          if (Array.isArray(msg.momentComments)) {
            setMomentComments((prev) => {
              const mergedMap = new Map<string, MomentCommentRecord>();
              prev.forEach((c) => mergedMap.set(c.id, c));
              for (const raw of msg.momentComments) {
                if (raw && raw.id && raw.momentId) {
                  mergedMap.set(String(raw.id), {
                    id: String(raw.id),
                    momentId: String(raw.momentId),
                    momentAuthorUid: String(raw.momentAuthorUid || ''),
                    authorUid: String(raw.authorUid || ''),
                    authorName: String(raw.authorName || 'Member'),
                    text: String(raw.text || ''),
                    visibility: raw.visibility === 'connections' ? 'connections' : 'public',
                    createdAtMs: Number(raw.createdAtMs) || Date.now(),
                    ...(raw.parentCommentId
                      ? { parentCommentId: String(raw.parentCommentId) }
                      : {}),
                    ...(raw.replyToAuthorName
                      ? { replyToAuthorName: String(raw.replyToAuthorName) }
                      : {}),
                  });
                }
              }
              const next = Array.from(mergedMap.values());
              localStorage.setItem('mr_stranger_moment_comments_v1', JSON.stringify(next));
              return next;
            });
          }
          if (Array.isArray(msg.moodEvents)) {
            setMoodEvents((prev) => {
              const mergedMap = new Map<string, PeerMoodHistoryEvent>();
              prev.forEach((ev) => {
                if (ev && ev.id) mergedMap.set(ev.id, ev);
              });
              for (const raw of msg.moodEvents) {
                if (raw && raw.id && raw.uid && raw.mood) {
                  mergedMap.set(String(raw.id), {
                    id: String(raw.id),
                    uid: String(raw.uid),
                    displayName: String(raw.displayName || 'Member'),
                    mood: String(raw.mood),
                    timestampMs: Number(raw.timestampMs) || Date.now(),
                  });
                }
              }
              const next = Array.from(mergedMap.values()).slice(-300);
              try {
                localStorage.setItem('mr_stranger_mood_events_24h_v1', JSON.stringify(next));
              } catch {
                // ignore
              }
              return next;
            });
          }
          if (msg.twitterLikes && typeof msg.twitterLikes === 'object') {
            setTwitterLikes((prev) => {
              const next: Record<string, string[]> = { ...prev };
              for (const [k, v] of Object.entries(msg.twitterLikes)) {
                if (Array.isArray(v)) {
                  const merged = new Set([...(next[k] || []), ...v.map(String)]);
                  next[k] = Array.from(merged);
                }
              }
              localStorage.setItem('mr_stranger_twitter_likes_v1', JSON.stringify(next));
              return next;
            });
          }
          if (msg.twitterRetweets && typeof msg.twitterRetweets === 'object') {
            setTwitterRetweets((prev) => {
              const next: Record<string, string[]> = { ...prev };
              for (const [k, v] of Object.entries(msg.twitterRetweets)) {
                if (Array.isArray(v)) {
                  const merged = new Set([...(next[k] || []), ...v.map(String)]);
                  next[k] = Array.from(merged);
                }
              }
              localStorage.setItem('mr_stranger_twitter_retweets_v1', JSON.stringify(next));
              return next;
            });
          }
          if (Array.isArray(msg.twitterChats)) {
            setTwitterChats((prev) => {
              const map = new Map<string, TwitterChatMessage>();
              prev.forEach((c) => {
                if (c && c.id) map.set(c.id, c);
              });
              for (const raw of msg.twitterChats) {
                if (raw && raw.id && raw.channelId && raw.senderUid) {
                  map.set(String(raw.id), {
                    id: String(raw.id),
                    channelId: String(raw.channelId),
                    senderUid: String(raw.senderUid),
                    senderName: String(raw.senderName || 'Member'),
                    senderHandle: String(raw.senderHandle || '@member'),
                    ...(raw.recipientUid ? { recipientUid: String(raw.recipientUid) } : {}),
                    text: String(raw.text || ''),
                    ...(raw.photoDataUrl ? { photoDataUrl: String(raw.photoDataUrl) } : {}),
                    createdAtMs: Number(raw.createdAtMs) || Date.now(),
                  });
                }
              }
              const next = Array.from(map.values())
                .sort((a, b) => a.createdAtMs - b.createdAtMs)
                .slice(-250);
              localStorage.setItem('mr_stranger_twitter_chats_v1', JSON.stringify(next));
              return next;
            });
          }
        } else if (msg.type === 'moment:publish' && msg.moment) {
          const incomingMoment: MomentPostDoc = {
            id: String(msg.moment.id),
            authorUid: String(msg.moment.authorUid || ''),
            authorName: String(msg.moment.authorName || 'Member'),
            caption: String(msg.moment.caption || ''),
            photoDataUrl: String(msg.moment.photoDataUrl || ''),
            visibility: msg.moment.visibility === 'connections' ? 'connections' : 'public',
          };
          setMoments((prev) => {
            if (prev.some((m) => m.id === incomingMoment.id)) return prev;
            const next = [incomingMoment, ...prev];
            localStorage.setItem('mr_stranger_moments_v1', JSON.stringify(next));
            return next;
          });
        } else if (msg.type === 'moment:delete' && msg.momentId) {
          setMoments((prev) => {
            const next = prev.filter((m) => m.id !== String(msg.momentId));
            localStorage.setItem('mr_stranger_moments_v1', JSON.stringify(next));
            return next;
          });
        } else if (msg.type === 'moment:comment' && msg.comment) {
          const incomingComment: MomentCommentRecord = {
            id: String(msg.comment.id),
            momentId: String(msg.comment.momentId),
            momentAuthorUid: String(msg.comment.momentAuthorUid || ''),
            authorUid: String(msg.comment.authorUid || ''),
            authorName: String(msg.comment.authorName || 'Member'),
            text: String(msg.comment.text || ''),
            visibility: msg.comment.visibility === 'connections' ? 'connections' : 'public',
            createdAtMs: Number(msg.comment.createdAtMs) || Date.now(),
            ...(msg.comment.parentCommentId
              ? { parentCommentId: String(msg.comment.parentCommentId) }
              : {}),
            ...(msg.comment.replyToAuthorName
              ? { replyToAuthorName: String(msg.comment.replyToAuthorName) }
              : {}),
          };
          setMomentComments((prev) => {
            if (prev.some((c) => c.id === incomingComment.id)) return prev;
            const next = [...prev, incomingComment];
            localStorage.setItem('mr_stranger_moment_comments_v1', JSON.stringify(next));
            return next;
          });
        } else if (msg.type === 'moment:comment_delete' && msg.commentId) {
          setMomentComments((prev) => {
            const next = prev.filter((c) => c.id !== String(msg.commentId));
            localStorage.setItem('mr_stranger_moment_comments_v1', JSON.stringify(next));
            return next;
          });
        } else if (msg.type === 'twitter:reaction' && msg.momentId && Array.isArray(msg.uids)) {
          const mId = String(msg.momentId);
          const uids = msg.uids.map((u: unknown) => String(u));
          if (msg.reactionType === 'retweet') {
            setTwitterRetweets((prev) => {
              const next = { ...prev, [mId]: uids };
              localStorage.setItem('mr_stranger_twitter_retweets_v1', JSON.stringify(next));
              return next;
            });
          } else {
            setTwitterLikes((prev) => {
              const next = { ...prev, [mId]: uids };
              localStorage.setItem('mr_stranger_twitter_likes_v1', JSON.stringify(next));
              return next;
            });
          }
        } else if (msg.type === 'twitter:chat' && msg.message) {
          const incomingChat: TwitterChatMessage = {
            id: String(msg.message.id),
            channelId: String(msg.message.channelId || 'global_townsquare'),
            senderUid: String(msg.message.senderUid || ''),
            senderName: String(msg.message.senderName || 'Member'),
            senderHandle: String(msg.message.senderHandle || '@member'),
            recipientUid: msg.message.recipientUid ? String(msg.message.recipientUid) : null,
            text: String(msg.message.text || ''),
            photoDataUrl: msg.message.photoDataUrl ? String(msg.message.photoDataUrl) : null,
            createdAtMs: Number(msg.message.createdAtMs) || Date.now(),
          };
          setTwitterChats((prev) => {
            if (prev.some((c) => c.id === incomingChat.id)) return prev;
            const next = [...prev, incomingChat];
            localStorage.setItem('mr_stranger_twitter_chats_v1', JSON.stringify(next));
            return next;
          });
        } else if (msg.type === 'chat:direct') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const isBg =
              typeof document !== 'undefined' &&
              (document.hidden || !document.hasFocus());
            const soundDecision = shouldPlayUiNotificationSound({
              preferences: uiSoundPrefsRef.current,
              eventType: 'incoming_message',
              senderUid: msg.senderUid,
              currentUid: currentIdentity.uid,
              isAppInBackground: isBg,
            });
            if (soundDecision.shouldPlay && soundDecision.chime) {
              playSubtleUiChime(soundDecision.chime);
              setLastSoundFeedback(
                `Chime played: Incoming Message from ${msg.senderName} (${soundDecision.chime.noteNames})`
              );
            }
            return [
              ...prev,
              {
                id: msg.id,
                senderUid: msg.senderUid,
                senderName: msg.senderName,
                receiverUid: msg.receiverUid,
                text: msg.text,
                timestamp: msg.timestamp,
              },
            ];
          });
        } else if (msg.type === 'study:chat') {
          setStudyChat((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const isBg =
              typeof document !== 'undefined' &&
              (document.hidden || !document.hasFocus());
            const soundDecision = shouldPlayUiNotificationSound({
              preferences: uiSoundPrefsRef.current,
              eventType: 'incoming_message',
              senderUid: msg.senderUid,
              currentUid: currentIdentity.uid,
              isAppInBackground: isBg,
            });
            if (soundDecision.shouldPlay && soundDecision.chime) {
              playSubtleUiChime(soundDecision.chime);
              setLastSoundFeedback(
                `Chime played: Study Room Message from ${msg.senderName} (${soundDecision.chime.noteNames})`
              );
            }
            return [...prev, msg];
          });
        } else if (msg.type === 'webrtc:signal') {
          setIncomingCallSignal({
            fromUid: msg.fromUid,
            fromName: msg.fromName,
            callType: msg.callType,
            signalData: msg.signalData,
          });
        } else if (msg.type === 'request:incoming') {
          setRequests((prev) => {
            const reqId = `req_${msg.fromUid}_${currentIdentity.uid}`;
            if (prev.some((r) => r.id === reqId)) return prev;
            seenIncomingRequestIdsRef.current.add(reqId);
            const isBg =
              typeof document !== 'undefined' &&
              (document.hidden || !document.hasFocus());
            const soundDecision = shouldPlayUiNotificationSound({
              preferences: uiSoundPrefsRef.current,
              eventType: 'connection_request',
              senderUid: msg.fromUid,
              currentUid: currentIdentity.uid,
              isAppInBackground: isBg,
            });
            if (soundDecision.shouldPlay && soundDecision.chime) {
              playSubtleUiChime(soundDecision.chime);
              setLastSoundFeedback(
                `Chime played: Connection Request from ${msg.fromName} (${soundDecision.chime.noteNames})`
              );
            }
            return [
              ...prev,
              {
                id: reqId,
                fromUid: msg.fromUid,
                fromName: msg.fromName,
                toUid: currentIdentity.uid,
                toName: currentIdentity.displayName,
                status: 'pending',
                note: msg.note || 'Would love to connect and chat!',
              },
            ];
          });
        } else if (msg.type === 'request:decision') {
          setRequests((prev) =>
            prev.map((r) =>
              (r.fromUid === currentIdentity.uid && r.toUid === msg.fromUid) ||
              (r.fromUid === msg.fromUid && r.toUid === currentIdentity.uid)
                ? { ...r, status: msg.decision }
                : r
            )
          );
          if (msg.decision === 'accepted') {
            setActiveChatPeerUid(msg.fromUid);
          }
        } else if (msg.type === 'server:security_notice') {
          setSecurityNotice(String(msg.reason || 'Security policy enforced.'));
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [currentIdentity?.uid]);

  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentIdentity) {
      wsRef.current.send(
        JSON.stringify({
          type: 'peer:mode_change',
          currentMode: activePage === 'signout' ? 'hub' : activePage,
          activeStudyRoomCode,
          activeGameId: activePage.startsWith('game_') ? activePage : null,
        })
      );
    }
  }, [activePage, activeStudyRoomCode]);

  const awardParticipation = (points: number) => {
    if (!currentIdentity) return;
    const safeAdded = Math.max(0, Math.round(Number(points) || 0));
    setAccountSession((prev) => {
      const base = prev || currentIdentity;
      const nextPoints = base.participationPoints + safeAdded;
      const updated: AccountIdentity = {
        ...base,
        participationPoints: nextPoints,
      };
      localStorage.setItem('mr_stranger_account_v2', JSON.stringify(updated));

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'peer:update_stats',
            participationPoints: nextPoints,
            streakCount: base.streakCount,
          })
        );
      }

      if (authUser) {
        updateDoc(doc(db, 'profiles', base.uid), {
          participationPoints: nextPoints,
          updatedAt: serverTimestamp(),
        }).catch(() => {
          // ignore if offline
        });
      }

      return updated;
    });

    setTodayPointsEarned((prevTodayPts) => {
      const nextTodayPts = prevTodayPts + safeAdded;
      setWeeklyActivityHistory((prevHist) => {
        const existingToday = prevHist[todayDateStr];
        const nextHist: Record<string, StoredDailyActivityRecord> = {
          ...prevHist,
          [todayDateStr]: {
            focusMinutes: existingToday?.focusMinutes ?? dailyCompletedMinutes,
            pointsEarned: nextTodayPts,
            targetMinutes: dailyTargetMinutes,
          },
        };
        localStorage.setItem('mr_stranger_weekly_activity_v1', JSON.stringify(nextHist));
        return nextHist;
      });
      return nextTodayPts;
    });
  };

  const persistProductivityGoal = (nextTarget: number, nextCompleted: number) => {
    const clampedTarget = clampProductivityTarget(nextTarget);
    const safeCompleted = Math.max(0, Math.round(nextCompleted));
    setDailyTargetMinutes(clampedTarget);
    setDailyCompletedMinutes(safeCompleted);
    setTargetInputMinutes(String(clampedTarget));
    localStorage.setItem(
      'mr_stranger_daily_goal_v1',
      JSON.stringify({
        dateKey: todayDateStr,
        targetMinutes: clampedTarget,
        completedMinutes: safeCompleted,
      })
    );
    setWeeklyActivityHistory((prevHist) => {
      const existingToday = prevHist[todayDateStr];
      const nextHist: Record<string, StoredDailyActivityRecord> = {
        ...prevHist,
        [todayDateStr]: {
          focusMinutes: safeCompleted,
          pointsEarned: existingToday?.pointsEarned ?? todayPointsEarned,
          targetMinutes: clampedTarget,
        },
      };
      localStorage.setItem('mr_stranger_weekly_activity_v1', JSON.stringify(nextHist));
      return nextHist;
    });
  };

  const handleSetDailyProductivityTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(targetInputMinutes);
    const clamped = clampProductivityTarget(parsed);
    persistProductivityGoal(clamped, dailyCompletedMinutes);
  };

  const persistStreakReminderPreferences = (
    updater:
      | StreakFocusReminderPreferences
      | ((prev: StreakFocusReminderPreferences) => StreakFocusReminderPreferences)
  ) => {
    setStreakReminderPrefs((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('mr_stranger_streak_reminder_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const markFocusSessionStartedToday = () => {
    persistStreakReminderPreferences((prev) => {
      if (prev.startedFocusDateKey === todayDateStr && !prev.simulatedPastCutoff) {
        return prev;
      }
      return {
        ...prev,
        startedFocusDateKey: todayDateStr,
        simulatedPastCutoff: false,
      };
    });
  };

  const handleLogFocusMinutes = (minutesToAdd: number) => {
    const added = Math.max(1, Math.round(minutesToAdd));
    persistProductivityGoal(dailyTargetMinutes, dailyCompletedMinutes + added);
    markFocusSessionStartedToday();
    awardParticipation(Math.max(5, Math.round(added / 2)));
  };

  const handleQuickStartPomodoro = () => {
    const result = applyQuickStartPomodoroBlock({
      targetMinutes: dailyTargetMinutes,
      currentCompletedMinutes: dailyCompletedMinutes,
      currentParticipationPoints: currentIdentity?.participationPoints ?? 25,
    });
    persistProductivityGoal(dailyTargetMinutes, result.nextCompletedMinutes);
    markFocusSessionStartedToday();
    awardParticipation(result.pointsAwarded);
    setQuickStartFeedback(result.feedbackMessage);
  };

  const handleLogTopicFocusSession = (
    rawTopic: string,
    rawRoomCode: string,
    minutesToAdd: number
  ) => {
    const added = Math.max(1, Math.round(minutesToAdd));
    const cleanTopic = normalizeStudyTopicName(rawTopic);
    const cleanRoomCode = sanitizeSafeText(
      String(rawRoomCode || activeStudyRoomCode || 'STUDY-GLOBAL').toUpperCase(),
      24
    );
    const newSession: TopicFocusSessionRecord = {
      id: `tsess_${Date.now()}_${currentIdentity?.uid || 'local'}`,
      topic: cleanTopic,
      roomCode: cleanRoomCode,
      focusMinutes: added,
      dateKey: todayDateStr,
      createdAtMs: Date.now(),
      authorUid: currentIdentity?.uid,
    };
    setTopicFocusSessions((prev) => {
      const next = [newSession, ...prev];
      localStorage.setItem('mr_stranger_topic_sessions_v1', JSON.stringify(next));
      return next;
    });
    persistProductivityGoal(dailyTargetMinutes, dailyCompletedMinutes + added);
    markFocusSessionStartedToday();
    awardParticipation(Math.max(5, Math.round(added / 2)));
  };

  const persistUiSoundPreferences = (nextPrefs: UiSoundEffectPreferences) => {
    setUiSoundPrefs(nextPrefs);
    localStorage.setItem('mr_stranger_ui_sound_prefs_v1', JSON.stringify(nextPrefs));
  };

  const handleToggleUiSoundEffects = () => {
    const nextPrefs = toggleUiSoundEffects(uiSoundPrefs);
    persistUiSoundPreferences(nextPrefs);
    if (nextPrefs.enabled) {
      const spec = previewUiSoundEffect('incoming_message', nextPrefs.volumePercent);
      setLastSoundFeedback(`Sound alerts active · ${spec.noteNames}`);
    } else {
      setLastSoundFeedback('Sound alerts muted for messages & requests');
    }
  };

  const handlePreviewUiChime = (eventType: UiSoundAlertEvent) => {
    if (!uiSoundPrefs.enabled) {
      const enabledPrefs = toggleUiSoundEffects(uiSoundPrefs, true);
      persistUiSoundPreferences(enabledPrefs);
    }
    const spec = previewUiSoundEffect(eventType, uiSoundPrefs.volumePercent);
    setLastSoundFeedback(`Previewed: ${spec.noteNames}`);
  };

  const handleUpdatePrivacy = async (
    nextVisibility: 'everyone' | 'connections_only' | 'ghost',
    nextReadReceipts: boolean,
    nextCallsFromConnectionsOnly: boolean
  ) => {
    if (!currentIdentity) return;
    const updated: AccountIdentity = {
      ...currentIdentity,
      privacyVisibility: nextVisibility,
      readReceiptsEnabled: nextReadReceipts,
      allowCallsFromConnectionsOnly: nextCallsFromConnectionsOnly,
    };
    setAccountSession(updated);
    localStorage.setItem('mr_stranger_account_v2', JSON.stringify(updated));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'peer:update_privacy',
          privacyVisibility: nextVisibility,
        })
      );
    }

    if (authUser) {
      try {
        await updateDoc(doc(db, 'profiles', currentIdentity.uid), {
          privacyVisibility: nextVisibility,
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'privateAccounts', currentIdentity.uid), {
          readReceiptsEnabled: nextReadReceipts,
          allowCallsFromConnectionsOnly: nextCallsFromConnectionsOnly,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore if offline
      }
    }
  };

  // Sign-In & Account Creation Handlers (Email ID + Password + Account Profile)
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSignUp = authTab === 'signup';
    const check = validateAccountCredentials(
      emailInput,
      passwordInput,
      accountNameInput,
      isSignUp
    );
    if (!check.valid) {
      setAuthFormError(check.error);
      return;
    }

    setAuthFormError('');
    setIsSubmittingAuth(true);

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          password: passwordInput,
          displayName: accountNameInput.trim(),
          bio: accountBioInput.trim() || 'Real personality on Mr. Stranger',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAuthFormError(data.error || 'Authentication failed. Please check your credentials.');
        setIsSubmittingAuth(false);
        return;
      }

      const newSession: AccountIdentity = {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        bio: data.bio,
        avatarUrl: '',
        streakCount: Number(data.streakCount) || 1,
        lastLoginDate: data.lastLoginDate || formatDateKey(new Date()),
        participationPoints: Number(data.participationPoints) || 25,
        privacyVisibility: data.privacyVisibility || 'everyone',
        readReceiptsEnabled: data.readReceiptsEnabled ?? true,
        allowCallsFromConnectionsOnly: data.allowCallsFromConnectionsOnly ?? true,
      };
      setAccountSession(newSession);
      localStorage.setItem('mr_stranger_account_v2', JSON.stringify(newSession));
      setPasswordInput('');
      setActivePage(initialRoomParam ? 'study' : initialMomentParam ? 'moments' : 'hub');
    } catch {
      setAuthFormError('Network error while contacting authentication server.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthFormError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthFormError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In popup was closed or blocked by the browser.'
      );
    }
  };

  // Sign-Out Handler with Email ID & Password Account Verification
  const handleConfirmSignOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentIdentity) return;

    if (
      signOutEmailConfirm.trim().toLowerCase() !== currentIdentity.email.toLowerCase()
    ) {
      setSignOutError(
        `Please enter your exact account Email ID (${currentIdentity.email}) to confirm sign out.`
      );
      return;
    }

    if (!authUser) {
      if (!signOutPasswordConfirm || signOutPasswordConfirm.length < 8) {
        setSignOutError(
          'Please enter your account password (minimum 8 characters) to verify sign out.'
        );
        return;
      }
      const resp = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentIdentity.email,
          password: signOutPasswordConfirm,
        }),
      });
      if (!resp.ok) {
        const errData = await resp.json();
        setSignOutError(errData.error || 'Password verification failed.');
        return;
      }
    }

    setSignOutError('');
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (authUser) {
      await signOut(auth);
    }
    localStorage.removeItem('mr_stranger_account_v2');
    setAccountSession(null);
    setSignOutEmailConfirm('');
    setSignOutPasswordConfirm('');
    setActivePage('hub');
  };

  // Send Connection Request to Online User
  const handleSendRequest = async (targetPeer: OnlinePeer) => {
    if (!currentIdentity) return;
    const reqId = `req_${currentIdentity.uid}_${targetPeer.uid}`;
    const note = (
      requestNoteMap[targetPeer.uid] || 'Hey! Saw you online on Mr. Stranger.'
    ).slice(0, 200);

    const newReq: ConnectionRequestDoc = {
      id: reqId,
      fromUid: currentIdentity.uid,
      fromName: currentIdentity.displayName,
      toUid: targetPeer.uid,
      toName: targetPeer.displayName,
      status: 'pending',
      note,
    };

    setRequests((prev) => [...prev.filter((r) => r.id !== reqId), newReq]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'request:notify',
          toUid: targetPeer.uid,
          fromName: currentIdentity.displayName,
          note,
        })
      );
    }

    if (authUser) {
      try {
        await setDoc(doc(db, 'requests', reqId), {
          fromUid: newReq.fromUid,
          fromName: newReq.fromName,
          toUid: newReq.toUid,
          toName: newReq.toName,
          status: 'pending',
          note: newReq.note,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Recipient might be a WebSocket session
      }
    }
    awardParticipation(5);
  };

  const handleRespondRequest = async (
    req: ConnectionRequestDoc,
    decision: 'accepted' | 'declined'
  ) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: decision } : r))
    );
    const partnerUid =
      req.fromUid === currentIdentity?.uid ? req.toUid : req.fromUid;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'request:decision',
          partnerUid,
          decision,
        })
      );
    }

    if (decision === 'accepted') {
      setActiveChatPeerUid(partnerUid);
      awardParticipation(10);
    }
    if (authUser) {
      try {
        await updateDoc(doc(db, 'requests', req.id), {
          status: decision,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // WebSocket fallback
      }
    }
  };

  // Send Direct Message (Strictly Invite-First: Only Accepted Connections)
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentIdentity) return;
    const trimmed = chatMessageInput.trim();
    if (!trimmed) {
      setChatError('Please write a message before sending.');
      return;
    }

    const threat = detectSecurityThreat(trimmed);
    if (!threat.safe) {
      setChatError(threat.reason);
      return;
    }

    const inviteGate = canUsersChatOrCall(
      currentIdentity.uid,
      activeChatPeerUid,
      requests
    );
    if (!inviteGate.allowed) {
      setChatError(inviteGate.reason);
      return;
    }

    const recipientUid = activeChatPeerUid;
    setChatError('');

    const msgId = `msg_${Date.now()}_${currentIdentity.uid}`;
    const newMsg: DirectMessageDoc = {
      id: msgId,
      senderUid: currentIdentity.uid,
      senderName: currentIdentity.displayName,
      receiverUid: recipientUid,
      text: sanitizeSafeText(trimmed, 1000),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatMessageInput('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat:direct',
          id: msgId,
          toUid: recipientUid,
          senderName: currentIdentity.displayName,
          text: newMsg.text,
        })
      );
    }

    if (authUser) {
      try {
        await setDoc(doc(db, 'messages', msgId), {
          senderUid: newMsg.senderUid,
          senderName: newMsg.senderName,
          receiverUid: newMsg.receiverUid,
          text: newMsg.text,
          createdAt: serverTimestamp(),
        });
      } catch {
        // WebSocket fallback
      }
    }
    awardParticipation(5);
  };

  // Handle Real Photo Upload & Moment Creation (with client-side compression if >400KB)
  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        if (rawDataUrl.length <= 400_000 || rawDataUrl.startsWith('data:image/svg')) {
          setMomentPhotoDataUrl(rawDataUrl);
          setSelectedMomentPlaceholderId(null);
          return;
        }
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 960;
          let width = img.width || 800;
          let height = img.height || 500;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.78);
            setMomentPhotoDataUrl(compressed);
          } else {
            setMomentPhotoDataUrl(rawDataUrl);
          }
          setSelectedMomentPlaceholderId(null);
        };
        img.onerror = () => {
          setMomentPhotoDataUrl(rawDataUrl);
          setSelectedMomentPlaceholderId(null);
        };
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const generateCameraSnapshotSvgDataUrl = (captionText: string, author: string) => {
    const safeCaption = captionText.replace(/[<>&"']/g, '');
    const safeAuthor = author.replace(/[<>&"']/g, '');
    const displayCaption =
      safeCaption.length > 38 ? `${safeCaption.slice(0, 37).trimEnd()}…` : safeCaption;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <rect width="800" height="500" fill="#050505"/>
      <rect x="48" y="48" width="704" height="404" rx="8" fill="#0A0A0C" stroke="#27272a" stroke-width="2"/>
      <text x="80" y="230" fill="#fafafa" font-family="sans-serif" font-size="30" font-weight="bold">${displayCaption}</text>
      <text x="80" y="280" fill="#a1a1aa" font-family="monospace" font-size="18">Captured by ${safeAuthor} · Mr. Stranger Verified Feed</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const handlePublishMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentIdentity) return;
    const trimmedCaption = momentCaption.trim();
    if (!trimmedCaption) {
      setMomentError('Please enter a caption describing your real photo moment.');
      return;
    }
    const threat = detectSecurityThreat(trimmedCaption);
    if (!threat.safe) {
      setMomentError(threat.reason);
      return;
    }
    setMomentError('');
    const safeCaption = sanitizeSafeText(trimmedCaption, 500);
    const resolvedImage = resolveMomentPublishImageSource({
      uploadedPhotoDataUrl: momentPhotoDataUrl,
      selectedPlaceholderId: selectedMomentPlaceholderId,
      fallbackGenerator: () =>
        generateCameraSnapshotSvgDataUrl(safeCaption, currentIdentity.displayName),
    });
    const finalPhotoData = resolvedImage.photoDataUrl;

    const momentId = `moment_${Date.now()}_${currentIdentity.uid}`;
    const newPost: MomentPostDoc = {
      id: momentId,
      authorUid: currentIdentity.uid,
      authorName: currentIdentity.displayName,
      caption: safeCaption,
      photoDataUrl: finalPhotoData,
      visibility: momentVisibility,
    };

    setMoments((prev) => {
      const next = [newPost, ...prev];
      localStorage.setItem('mr_stranger_moments_v1', JSON.stringify(next));
      return next;
    });
    setMomentCaption('');
    setMomentPhotoDataUrl('');
    setSelectedMomentPlaceholderId(null);
    awardParticipation(15);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'moment:publish',
          moment: {
            ...newPost,
            createdAtMs: Date.now(),
          },
        })
      );
    }

    if (authUser) {
      try {
        await setDoc(doc(db, 'moments', momentId), {
          authorUid: newPost.authorUid,
          authorName: newPost.authorName,
          caption: newPost.caption,
          photoDataUrl: newPost.photoDataUrl,
          visibility: newPost.visibility,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `moments/${momentId}`);
      }
    }
  };

  const handleShareDailyGoalToFeed = async () => {
    if (!currentIdentity) return;

    const summary = buildDailyGoalShareSummary({
      displayName: currentIdentity.displayName,
      completedMinutes: dailyCompletedMinutes,
      targetMinutes: dailyTargetMinutes,
      streakCount: currentIdentity.streakCount,
      participationPoints: currentIdentity.participationPoints,
      dateKey: todayDateStr,
      visibility: 'public',
    });

    const momentId = `moment_goal_${Date.now()}_${currentIdentity.uid}`;
    const newPost: MomentPostDoc = {
      id: momentId,
      authorUid: currentIdentity.uid,
      authorName: currentIdentity.displayName,
      caption: summary.caption,
      photoDataUrl: summary.photoDataUrl,
      visibility: summary.visibility,
    };

    setMoments((prev) => {
      const next = [newPost, ...prev];
      localStorage.setItem('mr_stranger_moments_v1', JSON.stringify(next));
      return next;
    });
    awardParticipation(15);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'moment:publish',
          moment: {
            ...newPost,
            createdAtMs: Date.now(),
          },
        })
      );
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(summary.caption);
      } catch {
        // ignore clipboard restriction in headless context
      }
    }

    setSharedDailyGoalSummary({
      ...summary,
      momentId,
      copied: true,
    });

    if (authUser) {
      try {
        await setDoc(doc(db, 'moments', momentId), {
          authorUid: newPost.authorUid,
          authorName: newPost.authorName,
          caption: newPost.caption,
          photoDataUrl: newPost.photoDataUrl,
          visibility: newPost.visibility,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `moments/${momentId}`);
      }
    }
  };

  const handleDeleteMoment = async (id: string) => {
    setMoments((prev) => {
      const next = prev.filter((m) => m.id !== id);
      localStorage.setItem('mr_stranger_moments_v1', JSON.stringify(next));
      return next;
    });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'moment:delete',
          momentId: id,
        })
      );
    }
    if (authUser) {
      try {
        await deleteDoc(doc(db, 'moments', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `moments/${id}`);
      }
    }
  };

  const handleShareMoment = async (momentItem: MomentPostDoc) => {
    const sharePayload = buildMomentSharePayload({
      origin: typeof window !== 'undefined' ? window.location.origin : 'https://mrstranger.app',
      momentId: momentItem.id,
      caption: momentItem.caption,
      authorName: momentItem.authorName,
    });

    let copiedViaClipboard = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(sharePayload.clipboardText);
        copiedViaClipboard = true;
      } catch {
        copiedViaClipboard = false;
      }
    }

    if (!copiedViaClipboard && typeof document !== 'undefined') {
      try {
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = sharePayload.clipboardText;
        tempTextarea.setAttribute('readonly', 'true');
        tempTextarea.style.position = 'fixed';
        tempTextarea.style.opacity = '0';
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);
      } catch {
        // ignore fallback error
      }
    }

    setCopiedMomentShare(sharePayload);
    if (shareResetTimerRef.current) {
      window.clearTimeout(shareResetTimerRef.current);
    }
    shareResetTimerRef.current = window.setTimeout(() => {
      setCopiedMomentShare((prev) => (prev?.momentId === momentItem.id ? null : prev));
    }, 6000);
  };

  const handleAddMomentComment = async (
    e: React.FormEvent,
    momentItem: MomentPostDoc,
    explicitReplyTarget?: { commentId: string; authorName: string } | null
  ) => {
    e.preventDefault();
    if (!currentIdentity) return;

    const acceptedSet = new Set(
      requests
        .filter((r) => r.status === 'accepted')
        .map((r) => (r.fromUid === currentIdentity.uid ? r.toUid : r.fromUid))
    );

    const permission = canUserCommentOnMoment({
      momentAuthorUid: momentItem.authorUid,
      momentVisibility: momentItem.visibility,
      currentUid: currentIdentity.uid,
      acceptedPeerUids: acceptedSet,
    });

    if (!permission.allowed) {
      setMomentCommentErrors((prev) => ({
        ...prev,
        [momentItem.id]: permission.reason,
      }));
      return;
    }

    const replyTarget =
      explicitReplyTarget !== undefined
        ? explicitReplyTarget
        : activeReplyTargetByMoment[momentItem.id] || null;

    const rawText =
      explicitReplyTarget && momentReplyInputs[explicitReplyTarget.commentId] !== undefined
        ? momentReplyInputs[explicitReplyTarget.commentId]
        : momentCommentInputs[momentItem.id] || '';

    const check = validateAndSanitizeMomentComment(rawText);
    if (!check.valid) {
      setMomentCommentErrors((prev) => ({
        ...prev,
        [momentItem.id]: check.error,
      }));
      return;
    }

    setMomentCommentErrors((prev) => ({
      ...prev,
      [momentItem.id]: '',
    }));

    const cleanParentId = replyTarget?.commentId
      ? String(replyTarget.commentId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128)
      : '';
    const cleanReplyAuthor = replyTarget?.authorName
      ? sanitizeSafeText(replyTarget.authorName, 64)
      : '';

    const commentId = `cmt_${Date.now()}_${currentIdentity.uid}`;
    const newComment: MomentCommentRecord = {
      id: commentId,
      momentId: momentItem.id,
      momentAuthorUid: momentItem.authorUid,
      authorUid: currentIdentity.uid,
      authorName: currentIdentity.displayName,
      text: check.sanitizedText,
      visibility: momentItem.visibility,
      createdAtMs: Date.now(),
      ...(cleanParentId ? { parentCommentId: cleanParentId } : {}),
      ...(cleanReplyAuthor ? { replyToAuthorName: cleanReplyAuthor } : {}),
    };

    setMomentComments((prev) => {
      const next = [...prev, newComment];
      localStorage.setItem('mr_stranger_moment_comments_v1', JSON.stringify(next));
      return next;
    });
    setCommentClockNowMs(Date.now());
    if (cleanParentId) {
      setMomentReplyInputs((prev) => ({
        ...prev,
        [cleanParentId]: '',
      }));
      const rootThreadId = resolveRootCommentIdForThread(
        [...momentComments, newComment],
        cleanParentId
      );
      if (rootThreadId) {
        setCollapsedCommentThreadIds((prev) =>
          prev.filter((id) => id !== rootThreadId)
        );
      }
    }
    setMomentCommentInputs((prev) => ({
      ...prev,
      [momentItem.id]: '',
    }));
    setActiveReplyTargetByMoment((prev) => ({
      ...prev,
      [momentItem.id]: null,
    }));
    awardParticipation(5);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'moment:comment',
          id: newComment.id,
          momentId: newComment.momentId,
          momentAuthorUid: newComment.momentAuthorUid,
          authorName: newComment.authorName,
          text: newComment.text,
          visibility: newComment.visibility,
          createdAtMs: newComment.createdAtMs,
          ...(cleanParentId ? { parentCommentId: cleanParentId } : {}),
          ...(cleanReplyAuthor ? { replyToAuthorName: cleanReplyAuthor } : {}),
        })
      );
    }

    if (authUser) {
      try {
        await setDoc(doc(db, 'momentComments', commentId), {
          momentId: newComment.momentId,
          momentAuthorUid: newComment.momentAuthorUid,
          authorUid: newComment.authorUid,
          authorName: newComment.authorName,
          text: newComment.text,
          visibility: newComment.visibility,
          ...(cleanParentId ? { parentCommentId: cleanParentId } : {}),
          ...(cleanReplyAuthor ? { replyToAuthorName: cleanReplyAuthor } : {}),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `momentComments/${commentId}`);
      }
    }
  };

  const handleDeleteMomentComment = async (commentId: string) => {
    setMomentComments((prev) => {
      const next = prev.filter((c) => c.id !== commentId);
      localStorage.setItem('mr_stranger_moment_comments_v1', JSON.stringify(next));
      return next;
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'moment:comment_delete',
          commentId,
        })
      );
    }

    if (authUser) {
      try {
        await deleteDoc(doc(db, 'momentComments', commentId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `momentComments/${commentId}`);
      }
    }
  };

  // Twitter / X Section Handlers (Like, Retweet, Bookmark, Follow, & Live Twitter Chat)
  const handleToggleTwitterLike = (momentId: string) => {
    if (!currentIdentity) return;
    setTwitterLikes((prev) => {
      const res = toggleTweetReaction(prev, momentId, currentIdentity.uid);
      localStorage.setItem('mr_stranger_twitter_likes_v1', JSON.stringify(res.updatedMap));
      return res.updatedMap;
    });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'twitter:reaction',
          momentId,
          reactionType: 'like',
        })
      );
    }
  };

  const handleToggleTwitterRetweet = (momentId: string) => {
    if (!currentIdentity) return;
    setTwitterRetweets((prev) => {
      const res = toggleTweetReaction(prev, momentId, currentIdentity.uid);
      localStorage.setItem(
        'mr_stranger_twitter_retweets_v1',
        JSON.stringify(res.updatedMap)
      );
      return res.updatedMap;
    });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'twitter:reaction',
          momentId,
          reactionType: 'retweet',
        })
      );
    }
  };

  const handleToggleTwitterBookmark = (momentId: string) => {
    if (!currentIdentity) return;
    setTwitterBookmarks((prev) => {
      const res = toggleTweetReaction(prev, momentId, currentIdentity.uid);
      localStorage.setItem(
        'mr_stranger_twitter_bookmarks_v1',
        JSON.stringify(res.updatedMap)
      );
      return res.updatedMap;
    });
  };

  const handleToggleTwitterFollow = (targetUid: string) => {
    if (!currentIdentity) return;
    setFollowedUids((prev) => {
      const res = toggleFollowUser(prev, targetUid, currentIdentity.uid);
      localStorage.setItem(
        'mr_stranger_twitter_follows_v1',
        JSON.stringify(res.updatedFollows)
      );
      return res.updatedFollows;
    });
  };

  const handleSendTwitterChat = (params: {
    channelId: string;
    recipientUid?: string | null;
    text: string;
    photoDataUrl?: string | null;
  }): { valid: boolean; error: string } => {
    if (!currentIdentity) {
      return { valid: false, error: 'Sign in required.' };
    }
    const check = validateAndBuildTwitterChatMessage({
      channelId: params.channelId,
      senderUid: currentIdentity.uid,
      senderName: currentIdentity.displayName,
      recipientUid: params.recipientUid,
      rawText: params.text,
      photoDataUrl: params.photoDataUrl,
    });
    if (!check.valid || !check.message) {
      return { valid: false, error: check.error };
    }
    const newMsg = check.message;
    setTwitterChats((prev) => {
      const next = [...prev, newMsg];
      localStorage.setItem('mr_stranger_twitter_chats_v1', JSON.stringify(next));
      return next;
    });
    awardParticipation(5);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'twitter:chat',
          ...newMsg,
        })
      );
    }
    return { valid: true, error: '' };
  };

  // ==========================================================================
  // DEDICATED MNC-GRADE SIGN-IN & CREATE ACCOUNT PAGE (Supports Dark & Light)
  // ==========================================================================
  if (!currentIdentity) {
    return (
      <div
        data-theme={themeMode}
        className={`min-h-screen flex flex-col justify-between p-6 md:p-12 transition-colors ${themeMeta.rootClassName} bg-slate-50 text-slate-900 dark:bg-[#050505] dark:text-zinc-100`}
      >
        <header className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800/80 pb-5">
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={APP_LOGO_URL}
              alt="Mr. Stranger Website Logo"
              data-testid="website-header-logo"
              className="w-10 h-10 rounded-xl object-cover border border-slate-300 dark:border-zinc-700/80 shadow-md shrink-0"
            />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0">
              Mr. Stranger
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-slate-600 dark:text-zinc-400 font-mono truncate">
              Enterprise Privacy · Real-Time Presence, Study Rooms & Multiplayer Arcade
            </span>
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-pressed={themeMeta.isLight}
              aria-label={themeMeta.ariaLabel}
              data-testid="theme-toggle-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 bg-white border-slate-300 text-slate-800 hover:bg-slate-100 dark:bg-[#0A0A0C] dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500"
            >
              {themeMeta.isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              )}
              <span>{themeMeta.buttonLabel}</span>
            </button>
          </div>
        </header>

        <main className="max-w-6xl w-full mx-auto my-auto py-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-3.5 p-2.5 pr-4 rounded-xl bg-[#0A0A0C] border border-zinc-800/80 w-fit">
              <img
                src={APP_LOGO_URL}
                alt="Mr. Stranger Official Emblem"
                data-testid="website-hero-logo"
                className="w-14 h-14 rounded-xl object-cover border border-zinc-700/80 shrink-0"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white tracking-wide">
                  Mr. Stranger · Official App & Website
                </div>
                <div className="text-[11px] font-mono text-emerald-400">
                  Verified Social Presence · Study Sanctuary · Arcade
                </div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Real people online. Private rooms, live calls, study sessions & multiplayer games.
            </h1>
            <p className="text-base text-zinc-400 leading-relaxed max-w-2xl">
              Sign in with your Email ID, Password, and Account profile. See everyone currently online, send real-time connection requests, jump into voice and video calls, invite friends to Study Rooms via shareable room codes or links, and compete across three built-in multiplayer games.
            </p>

            {initialRoomParam && (
              <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-700 text-xs text-zinc-200">
                You were invited to join Study Room <strong className="font-mono text-white">{initialRoomParam}</strong>. Sign in or create your account on the right to enter the room immediately.
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800/80">
                <div className="text-xs text-zinc-500 font-mono">01 / PRESENCE</div>
                <div className="text-sm font-semibold text-white mt-1">Real-Time Requests</div>
              </div>
              <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800/80">
                <div className="text-xs text-zinc-500 font-mono">02 / SANCTUARY</div>
                <div className="text-sm font-semibold text-white mt-1">Soundscapes & Code</div>
              </div>
              <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800/80">
                <div className="text-xs text-zinc-500 font-mono">03 / ARCADE</div>
                <div className="text-sm font-semibold text-white mt-1">3 Multiplayer Games</div>
              </div>
              <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800/80">
                <div className="text-xs text-zinc-500 font-mono">04 / VAULT</div>
                <div className="text-sm font-semibold text-white mt-1">PII Isolation & Ghost</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#0A0A0C] border border-zinc-800/80 rounded-lg p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-white whitespace-nowrap shrink-0">
                  {authTab === 'signup' ? 'Create Your Account' : 'Sign In to Account'}
                </h2>
                <div className="flex items-center gap-1 p-1 bg-[#050505] border border-zinc-800 rounded-md">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signup');
                      setAuthFormError('');
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                      authTab === 'signup'
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signin');
                      setAuthFormError('');
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                      authTab === 'signin'
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                </div>
              </div>

              <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="auth-email" className="block text-xs font-medium text-zinc-300">
                    Email ID
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="auth-password" className="block text-xs font-medium text-zinc-300">
                    Password (minimum 8 characters)
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter your secure account password"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {authTab === 'signup' && (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="auth-account-name" className="block text-xs font-medium text-zinc-300">
                        Account Display Name
                      </label>
                      <input
                        id="auth-account-name"
                        type="text"
                        required
                        value={accountNameInput}
                        onChange={(e) => setAccountNameInput(e.target.value)}
                        placeholder="e.g., Mahit Saxena"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="auth-account-bio" className="block text-xs font-medium text-zinc-300">
                        Account Bio / Status
                      </label>
                      <input
                        id="auth-account-bio"
                        type="text"
                        value={accountBioInput}
                        onChange={(e) => setAccountBioInput(e.target.value)}
                        placeholder="e.g., Principal Engineer · Study Room"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  </>
                )}

                {authFormError && <p className="text-xs text-rose-400">{authFormError}</p>}

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3 px-4 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-semibold text-xs rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  {authTab === 'signup'
                    ? 'Create Account & Enter Workspace'
                    : 'Sign In to Workspace'}
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-800/80" />
                <span className="flex-shrink mx-3 text-xs text-zinc-500">
                  Or SSO Authentication
                </span>
                <div className="flex-grow border-t border-zinc-800/80" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 font-semibold text-xs rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                Continue with Verified Google Account
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 border-t border-zinc-800/80 pt-4 flex items-center justify-between font-mono">
              <span>PII Isolated Vault (`privateAccounts`)</span>
              <span>scrypt + E2EE</span>
            </div>
          </div>
        </main>

        <footer className="max-w-6xl w-full mx-auto border-t border-zinc-900 pt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-2">
            <img
              src={APP_LOGO_URL}
              alt="Mr. Stranger"
              className="w-5 h-5 rounded-md object-cover border border-zinc-800 shrink-0"
            />
            <span>Mr. Stranger · Enterprise Real-Time Social Workspace</span>
          </span>
          <span>Available for everyone · Zero Fake Data</span>
        </footer>
      </div>
    );
  }

  const connectionRequestStatusMap = buildConnectionRequestStatusMap(
    currentIdentity.uid,
    requests
  );
  const acceptedPeerUids = new Set(
    requests
      .filter((r) => r.status === 'accepted')
      .map((r) => (r.fromUid === currentIdentity.uid ? r.toUid : r.fromUid))
  );
  const pendingPeerUids = new Set(
    requests
      .filter((r) => r.status === 'pending')
      .map((r) => (r.fromUid === currentIdentity.uid ? r.toUid : r.fromUid))
  );
  const acceptedConnections = requests
    .filter((r) => r.status === 'accepted')
    .map((r) => ({
      uid: r.fromUid === currentIdentity.uid ? r.toUid : r.fromUid,
      displayName: r.fromUid === currentIdentity.uid ? r.toName : r.fromName,
    }));
  const acceptedOnlinePeers = onlinePeers.filter(
    (p) => p.uid !== currentIdentity.uid && acceptedPeerUids.has(p.uid)
  );
  const otherOnlinePeers = onlinePeers.filter((p) => p.uid !== currentIdentity.uid);
  const e2eeFingerprint = deriveE2eeFingerprint(currentIdentity.uid, currentIdentity.email);
  const goalProgress = computeProductivityGoalProgress(
    dailyTargetMinutes,
    dailyCompletedMinutes
  );
  const progressMotionSpec = getProductivityProgressMotionSpec({
    targetMinutes: dailyTargetMinutes,
    completedMinutes: dailyCompletedMinutes,
    previousCompletedMinutes:
      prevCompletedMinutesRef.current !== dailyCompletedMinutes
        ? prevCompletedMinutesRef.current
        : lastCompletedMinutesSnapshot,
  });
  const weeklyActivitySummary = buildWeeklyActivityOverview({
    todayDateKey: todayDateStr,
    todayFocusMinutes: dailyCompletedMinutes,
    dailyTargetMinutes,
    todayPointsEarned,
    streakCount: currentIdentity.streakCount,
    storedHistory: weeklyActivityHistory,
  });
  const filteredMoments = moments.filter((m) => {
    if (momentFilter === 'public') return m.visibility === 'public';
    if (momentFilter === 'connections') return m.visibility === 'connections';
    if (momentFilter === 'mine') return m.authorUid === currentIdentity.uid;
    return true;
  });
  const commentsByMomentId = groupMomentCommentsByMomentId(momentComments);

  const directoryFocusSummary = summarizeOnlineDirectoryFocus(onlinePeers, studyDesks);
  const directoryMoodSummary = summarizeOnlineDirectoryMoods(onlinePeers);
  const moodPresetSearchResult = filterMoodCategoryGroupsBySearchQuery({
    groupedPresets: directoryMoodSummary.groupedPresets,
    searchQuery: moodPresetSearchQuery,
    countsByMood: directoryMoodSummary.countsByMood,
    countsByCategory: directoryMoodSummary.countsByCategory,
  });
  const popularMoods24h = buildPopularMoodsLast24Hours({
    onlinePeers,
    moodEvents,
  });
  const moodPresetUsage24hById = buildMoodPresetUsageCounts24hMap({
    onlinePeers,
    moodEvents,
    currentUid: currentIdentity.uid,
    currentUserMood: userMood,
  });
  const directoryQuickFilterMeta = getOnlineDirectoryQuickFilterMeta({
    mode: directoryAudienceFilter,
    onlinePeers,
    currentUid: currentIdentity.uid,
    acceptedPeerUids,
    connectionStatusMap: connectionRequestStatusMap,
    isHovered: isQuickFilterHovered,
    isClearModalOpen: isClearFilterModalOpen,
    moodFilter: directoryMoodFilter,
    onlyInFocus: showOnlyInFocusPeers,
    origin: typeof window !== 'undefined' ? window.location.origin : 'https://mrstranger.app',
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    isShareLinkCopied: isDirectoryFilterLinkCopied,
    uiSoundPreferences: uiSoundPrefs,
  });

  const handlePlayDirectoryFilterToggleChime = (
    currentMode: OnlineDirectoryAudienceFilter,
    nextMode?: OnlineDirectoryAudienceFilter
  ) => {
    const chimeResult = resolveQuickFilterToggleChime({
      currentMode,
      nextMode,
      preferences: uiSoundPrefs,
    });
    if (chimeResult.shouldPlay) {
      playSubtleUiChime(chimeResult.chime, chimeResult.volumePercent);
    }
    setLastDirectoryFilterChime(chimeResult.chimeType);
    setDirectoryFilterChimeCount((prev) => prev + 1);
    setLastSoundFeedback(chimeResult.feedbackMessage);
  };

  const handleCopyDirectoryFilterShareLink = async (
    e?: React.MouseEvent | React.KeyboardEvent,
    overrideAudienceMode?: OnlineDirectoryAudienceFilter
  ) => {
    if (e) {
      e.stopPropagation();
    }
    const effectiveAudienceMode = overrideAudienceMode ?? directoryAudienceFilter;
    const shareMeta = buildOnlineDirectoryFilterShareLink({
      origin: typeof window !== 'undefined' ? window.location.origin : 'https://mrstranger.app',
      pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
      audienceFilter: effectiveAudienceMode,
      moodFilter: directoryMoodFilter,
      onlyInFocus: showOnlyInFocusPeers,
      isCopied: true,
    });
    const urlToCopy = shareMeta.shareUrl;

    if (typeof window !== 'undefined' && window.history?.replaceState) {
      try {
        const parsedUrl = new URL(urlToCopy);
        window.history.replaceState(
          null,
          '',
          `${parsedUrl.pathname}${parsedUrl.search}`
        );
      } catch {
        // ignore history error
      }
    }

    setLastCopiedDirectoryFilterUrl(urlToCopy);
    setIsDirectoryFilterLinkCopied(true);
    if (filterLinkCopyTimerRef.current !== null) {
      window.clearTimeout(filterLinkCopyTimerRef.current);
    }
    filterLinkCopyTimerRef.current = window.setTimeout(() => {
      setIsDirectoryFilterLinkCopied(false);
    }, 3000);

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(urlToCopy);
      } catch {
        // ignore clipboard permissions error in headless context
      }
    }
  };
  const displayedOnlinePeers = filterOnlinePeersByDirectoryCriteria(
    onlinePeers,
    studyDesks,
    {
      onlyInFocus: showOnlyInFocusPeers,
      moodFilter: directoryMoodFilter === 'all' ? null : directoryMoodFilter,
      audienceFilter: directoryAudienceFilter,
      currentUid: currentIdentity.uid,
      acceptedPeerUids,
      connectionStatusMap: connectionRequestStatusMap,
    }
  );
  const myFocusStatus =
    directoryFocusSummary.byUid[currentIdentity.uid] ||
    getOnlinePeerFocusStatus(
      {
        uid: currentIdentity.uid,
        currentMode: activePage === 'signout' ? 'hub' : activePage,
        activeStudyRoomCode,
      },
      studyDesks
    );
  const myMoodMeta = getOnlinePeerMoodMeta(userMood);

  const weeklyTopicDistribution = buildWeeklyProductivityDistribution({
    todayDateKey: todayDateStr,
    totalWeeklyFocusMinutes: weeklyActivitySummary.totalFocusMinutes,
    storedSessions: topicFocusSessions,
    studyNotes,
    activeDeskSubject: myFocusStatus.subject || undefined,
    activeRoomCode: activeStudyRoomCode,
    currentUid: currentIdentity.uid,
  });

  const userBadgeSummary = evaluateUserBadges({
    uid: currentIdentity.uid,
    streakCount: currentIdentity.streakCount,
    weeklyDays: weeklyActivitySummary.days,
    frozenDates: streakFreezeState.frozenDates,
    studyNotes,
  });

  const streakFreezeStatus = evaluateStreakFreezeStatus({
    streakCount: currentIdentity.streakCount,
    participationPoints: currentIdentity.participationPoints,
    streakFreezesOwned: streakFreezeState.streakFreezesOwned,
    frozenDates: streakFreezeState.frozenDates,
    lastFreezeUsedDate: streakFreezeState.lastFreezeUsedDate,
    streakAtRiskCount: streakFreezeState.streakAtRiskCount,
    missedDateKey: streakFreezeState.missedDateKey,
  });

  const hasExplicitFocusSessionToday = Boolean(
    streakReminderPrefs.startedFocusDateKey === todayDateStr ||
      myFocusStatus.isInFocus ||
      topicFocusSessions.some((s) => s.dateKey === todayDateStr)
  );

  const streakReminderEvaluation = evaluateStreakFocusReminder({
    enabled: streakReminderPrefs.enabled,
    reminderTime24h: streakReminderPrefs.reminderTime24h,
    currentHours: clockHoursMinutes.hours,
    currentMinutes: clockHoursMinutes.minutes,
    todayDateKey: todayDateStr,
    dismissedDateKey: streakReminderPrefs.dismissedDateKey,
    startedFocusDateKey: streakReminderPrefs.startedFocusDateKey,
    hasStartedFocusSessionToday: hasExplicitFocusSessionToday,
    isInFocusDesk: myFocusStatus.isInFocus,
    streakCount: currentIdentity.streakCount,
    simulatedPastCutoff: streakReminderPrefs.simulatedPastCutoff,
  });

  const handleDismissStreakReminderToday = () => {
    persistStreakReminderPreferences((prev) => ({
      ...prev,
      dismissedDateKey: todayDateStr,
      simulatedPastCutoff: false,
    }));
  };

  const handleToggleStreakReminderEnabled = () => {
    persistStreakReminderPreferences((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const handleUpdateStreakReminderTime = (nextTime24h: string) => {
    const parsed = parseReminderTimeMinutes(nextTime24h);
    persistStreakReminderPreferences((prev) => ({
      ...prev,
      enabled: true,
      reminderTime24h: parsed.formatted24h,
      dismissedDateKey: null,
    }));
  };

  const handleTriggerStreakReminderPreview = () => {
    persistStreakReminderPreferences((prev) => ({
      ...prev,
      enabled: true,
      dismissedDateKey: null,
      startedFocusDateKey: null,
      simulatedPastCutoff: true,
    }));
  };

  const syncAccountPointsAndStreak = (nextStreak: number, nextPoints: number) => {
    setAccountSession((prev) => {
      const base = prev || currentIdentity;
      const updated: AccountIdentity = {
        ...base,
        streakCount: nextStreak,
        participationPoints: nextPoints,
        lastLoginDate: todayDateStr,
      };
      localStorage.setItem('mr_stranger_account_v2', JSON.stringify(updated));

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'peer:update_stats',
            participationPoints: nextPoints,
            streakCount: nextStreak,
          })
        );
      }

      if (authUser) {
        updateDoc(doc(db, 'profiles', base.uid), {
          streakCount: nextStreak,
          participationPoints: nextPoints,
          lastLoginDate: todayDateStr,
          updatedAt: serverTimestamp(),
        }).catch(() => {
          // ignore if offline
        });
      }

      return updated;
    });
  };

  const handlePurchaseStreakFreeze = (): {
    success: boolean;
    message: string;
    error: string;
  } => {
    const res = purchaseStreakFreeze({
      participationPoints: currentIdentity.participationPoints,
      streakFreezesOwned: streakFreezeState.streakFreezesOwned,
    });
    if (!res.success) {
      return { success: false, message: '', error: res.error };
    }
    setStreakFreezeState((prev) => {
      const next: StreakFreezeInventoryState = {
        ...prev,
        streakFreezesOwned: res.streakFreezesOwned,
      };
      localStorage.setItem('mr_stranger_streak_freeze_v1', JSON.stringify(next));
      return next;
    });
    syncAccountPointsAndStreak(currentIdentity.streakCount, res.participationPoints);
    return { success: true, message: res.message, error: '' };
  };

  const handleRescueMissedDayWithFreeze = (): {
    success: boolean;
    message: string;
    error: string;
  } => {
    const res = spendPointsToFreezeMissedDay({
      streakCount: currentIdentity.streakCount,
      lastLoginDate: currentIdentity.lastLoginDate,
      participationPoints: currentIdentity.participationPoints,
      streakFreezesOwned: streakFreezeState.streakFreezesOwned,
      frozenDates: streakFreezeState.frozenDates,
      lastFreezeUsedDate: streakFreezeState.lastFreezeUsedDate,
      streakAtRiskCount: streakFreezeState.streakAtRiskCount,
      missedDateKey: streakFreezeState.missedDateKey,
      todayDateKey: todayDateStr,
    });
    if (!res.success) {
      return { success: false, message: '', error: res.error };
    }
    const nextFreezeState: StreakFreezeInventoryState = {
      streakFreezesOwned: res.streakFreezesOwned,
      frozenDates: res.frozenDates,
      lastFreezeUsedDate: res.lastFreezeUsedDate,
      streakAtRiskCount: null,
      missedDateKey: null,
    };
    setStreakFreezeState(nextFreezeState);
    localStorage.setItem('mr_stranger_streak_freeze_v1', JSON.stringify(nextFreezeState));
    syncAccountPointsAndStreak(res.streakCount, res.participationPoints);
    return { success: true, message: res.message, error: '' };
  };

  const handleSimulateMissedDay = (): {
    preservedByEquippedFreeze: boolean;
    message: string;
  } => {
    const baseStreakToTest =
      streakFreezeState.streakAtRiskCount && streakFreezeState.streakAtRiskCount > 1
        ? streakFreezeState.streakAtRiskCount
        : Math.max(3, currentIdentity.streakCount);

    const sim = simulateMissedDayStreakEvaluation({
      streakCount: baseStreakToTest,
      participationPoints: currentIdentity.participationPoints,
      streakFreezesOwned: streakFreezeState.streakFreezesOwned,
      frozenDates: streakFreezeState.frozenDates,
      lastFreezeUsedDate: streakFreezeState.lastFreezeUsedDate,
      todayDateKey: todayDateStr,
    });

    const nextFreezeState: StreakFreezeInventoryState = {
      streakFreezesOwned: sim.streakFreezesOwned,
      frozenDates: sim.frozenDates,
      lastFreezeUsedDate: sim.lastFreezeUsedDate,
      streakAtRiskCount: sim.streakAtRiskCount,
      missedDateKey: sim.missedDateKey,
    };
    setStreakFreezeState(nextFreezeState);
    localStorage.setItem('mr_stranger_streak_freeze_v1', JSON.stringify(nextFreezeState));
    syncAccountPointsAndStreak(sim.streakCount, sim.participationPoints);

    return {
      preservedByEquippedFreeze: sim.preservedByEquippedFreeze,
      message: sim.message,
    };
  };

  const handleAdvanceUserStreak = (targetStreakDays?: number) => {
    setStreakFreezeState((prev) => {
      if (!prev.streakAtRiskCount) return prev;
      const cleared: StreakFreezeInventoryState = {
        ...prev,
        streakAtRiskCount: null,
        missedDateKey: null,
      };
      localStorage.setItem('mr_stranger_streak_freeze_v1', JSON.stringify(cleared));
      return cleared;
    });
    setAccountSession((prev) => {
      const base = prev || currentIdentity;
      const nextStreak =
        typeof targetStreakDays === 'number' && targetStreakDays > base.streakCount
          ? Math.round(targetStreakDays)
          : base.streakCount + 1;
      const nextPoints = base.participationPoints + 15;
      const updated: AccountIdentity = {
        ...base,
        streakCount: nextStreak,
        participationPoints: nextPoints,
        lastLoginDate: todayDateStr,
      };
      localStorage.setItem('mr_stranger_account_v2', JSON.stringify(updated));

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'peer:update_stats',
            participationPoints: nextPoints,
            streakCount: nextStreak,
          })
        );
      }

      if (authUser) {
        updateDoc(doc(db, 'profiles', base.uid), {
          streakCount: nextStreak,
          participationPoints: nextPoints,
          lastLoginDate: todayDateStr,
          updatedAt: serverTimestamp(),
        }).catch(() => {
          // ignore if offline
        });
      }

      return updated;
    });
  };

  const handleRecordConsecutiveGoalDay = (daysToEnsure?: number) => {
    const res = recordConsecutiveGoalHitDay({
      todayDateKey: todayDateStr,
      dailyTargetMinutes,
      storedHistory: weeklyActivityHistory,
      daysToEnsure,
    });
    setWeeklyActivityHistory(res.updatedHistory);
    localStorage.setItem(
      'mr_stranger_weekly_activity_v1',
      JSON.stringify(res.updatedHistory)
    );
    setDailyCompletedMinutes(res.todayCompletedMinutes);
    localStorage.setItem(
      'mr_stranger_daily_goal_v1',
      JSON.stringify({
        dateKey: todayDateStr,
        targetMinutes: dailyTargetMinutes,
        completedMinutes: res.todayCompletedMinutes,
      })
    );
    awardParticipation(20);
  };

  const handleContributeHelpfulNoteFromProfile = (
    subject: string,
    rawNote: string
  ): { valid: boolean; error: string } => {
    const check = validateAndBuildHelpfulNoteContribution({
      authorUid: currentIdentity.uid,
      authorName: currentIdentity.displayName,
      roomCode: activeStudyRoomCode,
      subject,
      rawNote,
      focusMinutes: 25,
    });
    if (!check.valid || !check.noteRecord) {
      return { valid: false, error: check.error };
    }
    const newNote: StudyNoteRecord = check.noteRecord;
    setStudyNotes((prev) => {
      const next = [newNote, ...prev];
      try {
        localStorage.setItem('mr_stranger_study_notes_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    awardParticipation(15);

    if (authUser) {
      setDoc(doc(db, 'studyNotes', newNote.id), {
        authorUid: newNote.authorUid,
        authorName: newNote.authorName,
        roomCode: newNote.roomCode,
        subject: newNote.subject,
        positiveNote: newNote.positiveNote,
        focusMinutes: newNote.focusMinutes,
        createdAt: serverTimestamp(),
      }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `studyNotes/${newNote.id}`)
      );
    }

    return { valid: true, error: '' };
  };

  const handleUpdateUserMood = (rawNextMood: string | null) => {
    const check = normalizeAndValidatePeerMood(rawNextMood);
    if (!check.valid) {
      setMoodInputError(check.error);
      return;
    }
    setMoodInputError('');
    setUserMood(check.mood);
    userMoodRef.current = check.mood;
    try {
      localStorage.setItem('mr_stranger_user_mood_v1', check.mood || '');
    } catch {
      // ignore storage errors
    }

    setOnlinePeers((prev) =>
      prev.map((p) => (p.uid === currentIdentity.uid ? { ...p, mood: check.mood } : p))
    );

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'peer:update_mood',
          mood: check.mood,
        })
      );
    } else if (check.mood) {
      const nowMs = Date.now();
      const localEv: PeerMoodHistoryEvent = {
        id: `local_${currentIdentity.uid}_${nowMs}`,
        uid: currentIdentity.uid,
        displayName: currentIdentity.displayName,
        mood: check.mood,
        timestampMs: nowMs,
      };
      setMoodEvents((prev) => {
        const next = [...prev, localEv].slice(-300);
        try {
          localStorage.setItem('mr_stranger_mood_events_24h_v1', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  const handleCustomMoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMoodInput.trim()) {
      setMoodInputError('Enter a custom mood or choose one of the presets above.');
      return;
    }
    const check = normalizeAndValidatePeerMood(customMoodInput);
    if (!check.valid) {
      setMoodInputError(check.error);
      return;
    }
    handleUpdateUserMood(check.mood);
    setCustomMoodInput('');
  };

  const handleToggleQuickFocusDesk = () => {
    const hasMyDesk = studyDesks.some((d) => d.uid === currentIdentity.uid);
    const soundTrigger = resolveQuickFocusDeskSoundTrigger({
      isCurrentlyAtDesk: hasMyDesk,
      preferences: uiSoundPrefs,
    });

    if (soundTrigger.shouldPlay) {
      playSubtleUiChime(soundTrigger.chime);
    }
    setLastFocusDeskChime(soundTrigger.chimeType);
    setLastSoundFeedback(soundTrigger.feedbackMessage);

    if (hasMyDesk) {
      setStudyDesks((prev) => prev.filter((d) => d.uid !== currentIdentity.uid));
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'study:leave' }));
      }
    } else {
      const nextDesk: StudyDeskItem = {
        uid: currentIdentity.uid,
        displayName: currentIdentity.displayName,
        roomCode: activeStudyRoomCode,
        roomName: `Study Room ${activeStudyRoomCode}`,
        subject: 'Deep Work & Problem Solving',
        positiveNote: 'Focused in Study Room — join me for a Pomodoro block!',
        timerMinutes: 25,
        startedAt: Date.now(),
      };
      setStudyDesks((prev) => [
        ...prev.filter((d) => d.uid !== currentIdentity.uid),
        nextDesk,
      ]);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'study:join',
            roomCode: activeStudyRoomCode,
            roomName: `Study Room ${activeStudyRoomCode}`,
            displayName: currentIdentity.displayName,
            subject: 'Deep Work & Problem Solving',
            positiveNote: 'Focused in Study Room — join me for a Pomodoro block!',
            timerMinutes: 25,
          })
        );
      }
      markFocusSessionStartedToday();
      awardParticipation(15);
    }
  };

  const sidebarScrollSpec = getWorkspaceSidebarScrollSpec(isSidebarHovered, {
    isFocused: isSidebarFocused,
    isProgrammaticScroll: isSidebarProgrammaticScroll,
  });

  const handleSidebarQuickJump = (
    targetSelectorId: string,
    triggerElement?: HTMLElement | null
  ) => {
    setIsSidebarProgrammaticScroll(true);
    if (sidebarProgrammaticTimerRef.current) {
      window.clearTimeout(sidebarProgrammaticTimerRef.current);
    }
    sidebarProgrammaticTimerRef.current = window.setTimeout(() => {
      setIsSidebarProgrammaticScroll(false);
    }, 600);

    setActivePage('hub');
    window.requestAnimationFrame(() => {
      if (triggerElement && typeof triggerElement.scrollIntoView === 'function') {
        triggerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      const targetEl = document.querySelector(
        `[data-testid="${targetSelectorId}"], #${targetSelectorId}`
      );
      if (targetEl && typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  // ==========================================================================
  // MNC-LEVEL WORKSPACE CANVAS: SIDEBAR + VIEWPORT (Supports Dark & Light)
  // ==========================================================================
  return (
    <div
      id="workspace-shell"
      data-testid="workspace-shell"
      data-theme={themeMode}
      data-layout-mode={sidebarScrollSpec.layoutMode}
      className={`${sidebarScrollSpec.shellClassName} transition-colors ${themeMeta.rootClassName} bg-slate-50 text-slate-900 dark:bg-[#050505] dark:text-zinc-100`}
    >
      {/* Persistent Left Sidebar Navigation (Stuck in place; scrolls remaining items only when hovered, focused, or programmatically scrolled) */}
      <aside
        id="workspace-sidebar"
        data-testid="workspace-sidebar"
        data-sidebar-sticky="true"
        data-sidebar-hovered={sidebarScrollSpec.isHovered ? 'true' : 'false'}
        data-sidebar-focused={sidebarScrollSpec.isFocused ? 'true' : 'false'}
        data-sidebar-scroll-mode={sidebarScrollSpec.scrollMode}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`w-full ${sidebarScrollSpec.sidebarPositionClass} bg-white dark:bg-[#0A0A0C] border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-800/80 flex flex-col overflow-hidden`}
        aria-label="Workspace Sidebar Navigation"
      >
        {/* Pinned Brand & Live Streak Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-200 dark:border-zinc-800/80 shrink-0 bg-white dark:bg-[#0A0A0C]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActivePage('hub')}
              data-testid="app-sidebar-brand-btn"
              className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0"
            >
              <img
                src={APP_LOGO_URL}
                alt="Mr. Stranger App Logo"
                data-testid="app-sidebar-logo"
                className="w-8 h-8 rounded-lg object-cover border border-slate-300 dark:border-zinc-700/80 shadow-sm shrink-0"
              />
              <span>Mr. Stranger</span>
            </button>
            <div
              className="flex items-center gap-1 text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums"
              title="Consecutive Daily Login Streak"
            >
              <Flame className="w-4 h-4" />
              <span>{Number.isFinite(currentIdentity.streakCount) ? currentIdentity.streakCount : 1}d</span>
            </div>
          </div>
        </div>

        {/* Hover & Focus/Programmatic Smooth-Scrollable Sidebar Items Container */}
        <div
          ref={sidebarScrollAreaRef}
          id="workspace-sidebar-scroll-area"
          tabIndex={-1}
          data-testid="workspace-sidebar-scroll-area"
          data-scroll-mode={sidebarScrollSpec.scrollMode}
          data-sidebar-hovered={sidebarScrollSpec.isHovered ? 'true' : 'false'}
          data-sidebar-focused={sidebarScrollSpec.isFocused ? 'true' : 'false'}
          data-programmatic-scroll={
            sidebarScrollSpec.isProgrammaticScroll ? 'true' : 'false'
          }
          data-scroll-behavior={sidebarScrollSpec.scrollBehavior}
          onFocusCapture={() => setIsSidebarFocused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setIsSidebarFocused(false);
            }
          }}
          onWheel={(e) => {
            if (!isSidebarHovered && !isSidebarFocused) {
              e.preventDefault();
            }
          }}
          className={`flex-1 min-h-0 flex flex-col justify-between ${sidebarScrollSpec.sidebarScrollAreaClass}`}
        >
          <div className="p-5 space-y-6">
            {/* Primary Communication & Study Modes */}
            <div className="space-y-1">
              <div className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Core Modes
              </div>
            <button
              type="button"
              onClick={() => setActivePage('hub')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'hub'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Online Directory</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{onlinePeers.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('chat')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'chat'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>Chat Mode</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{messages.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('talk')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'talk'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4" />
                <span>Talking Mode</span>
              </span>
              <span className="text-[11px] font-mono">WebRTC</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('study')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'study'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4" />
                <span>Study Mode & Room</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{studyDesks.length}</span>
            </button>
          </div>

          {/* Dedicated Multiplayer Game Pages on Sidebar */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Multiplayer Games
            </div>
            <button
              type="button"
              onClick={() => setActivePage('game_subway')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'game_subway'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4" />
                <span>Subway Runner</span>
              </span>
              <span className="text-[11px] font-mono">3-Lane</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('game_catapult')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'game_catapult'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4" />
                <span>Angry Catapult</span>
              </span>
              <span className="text-[11px] font-mono">Physics</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('game_blocks')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'game_blocks'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4" />
                <span>Block Arena</span>
              </span>
              <span className="text-[11px] font-mono">Grid</span>
            </button>
          </div>

          {/* Social Media Feed & Privacy Center */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Social & Security
            </div>
            <button
              type="button"
              onClick={() => setActivePage('moments')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'moments'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Camera className="w-4 h-4" />
                <span>Photos & Social Sync</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{moments.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('privacy')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'privacy'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Privacy & Security</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                {currentIdentity.privacyVisibility === 'ghost' ? 'Ghost' : 'Active'}
              </span>
            </button>
          </div>

          {/* Remaining Workspace Sections (Scrollable when hovering over sidebar) */}
          <div className="space-y-1.5" data-testid="sidebar-remaining-sections">
            <div className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Hub Quick Jump
            </div>
            <button
              type="button"
              onClick={(e) =>
                handleSidebarQuickJump('daily-productivity-goal-card', e.currentTarget)
              }
              data-testid="sidebar-jump-daily-goal"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span className="flex items-center gap-2.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Focus Goal</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{goalProgress.progressPercent}%</span>
            </button>
            <button
              type="button"
              onClick={(e) =>
                handleSidebarQuickJump('streak-reminder-settings-bar', e.currentTarget)
              }
              data-testid="sidebar-jump-streak-reminder"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span className="flex items-center gap-2.5">
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span>Streak Check-In</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{streakReminderEvaluation.reminderTime12h}</span>
            </button>
            <button
              type="button"
              onClick={(e) =>
                handleSidebarQuickJump('weekly-activity-overview-card', e.currentTarget)
              }
              data-testid="sidebar-jump-weekly-activity"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>7-Day Activity</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{dailyCompletedMinutes}m</span>
            </button>
            <button
              type="button"
              onClick={(e) =>
                handleSidebarQuickJump('global-leaderboard-card', e.currentTarget)
              }
              data-testid="sidebar-jump-leaderboard"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span className="flex items-center gap-2.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Global Leaderboard</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">
                {Number.isFinite(currentIdentity.participationPoints)
                  ? currentIdentity.participationPoints
                  : 0}
                p
              </span>
            </button>
            <button
              type="button"
              onClick={(e) =>
                handleSidebarQuickJump('hub-online-directory', e.currentTarget)
              }
              data-testid="sidebar-jump-mood-directory"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Mood Directory</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{onlinePeers.length}</span>
            </button>
            <button
              type="button"
              onClick={(e) =>
                handleSidebarQuickJump(
                  'online-directory-mood-category-filter',
                  e.currentTarget
                )
              }
              data-testid="sidebar-jump-mood-categories"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span className="flex items-center gap-2.5">
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mood Categories</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{ONLINE_MOOD_CATEGORIES.length}</span>
            </button>
          </div>
        </div>

          {/* Bottom Sidebar Account Card & Sign-Out Page Trigger */}
          <div className="p-4 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#050505] space-y-3 shrink-0">
            <div className="min-w-0 space-y-1.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentIdentity.displayName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono truncate">
                {currentIdentity.email}
              </div>
              <div
                className="flex flex-wrap items-center gap-1 pt-0.5"
                data-testid="sidebar-profile-badges"
              >
                {userBadgeSummary.unlockedBadges.length > 0 ? (
                  userBadgeSummary.unlockedBadges.map((b) => (
                    <AchievementBadgeChip
                      key={b.id}
                      badge={b}
                      compact={true}
                      testId={`sidebar-badge-${b.id}`}
                    />
                  ))
                ) : (
                  <span className="text-[10px] font-mono text-zinc-500">
                    Badges: 0/{userBadgeSummary.totalBadgesCount} unlocked
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('signout')}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'signout'
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Account & Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Right Main Workspace Viewport (Scrolls independently side-by-side next to stuck sidebar) */}
      <div
        id="workspace-main-viewport"
        data-testid="workspace-main-viewport"
        data-independent-scroll="true"
        className={sidebarScrollSpec.mainViewportClass}
      >
        {/* Top Workspace Header (Follows SaaS Top Bar Contract: Breadcrumb left, Theme Switcher, Streak & Primary Action right) */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#050505]">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 truncate">
            <img
              src={APP_LOGO_URL}
              alt="Mr. Stranger"
              data-testid="workspace-topbar-logo"
              className="w-5 h-5 rounded object-cover border border-slate-300 dark:border-zinc-800 shrink-0"
            />
            <span className="font-semibold text-slate-700 dark:text-zinc-300">Workspace</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 dark:text-white font-semibold capitalize">
              {activePage.replace('_', ' ')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-500 dark:text-zinc-400">
              Room: {activeStudyRoomCode}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-mono tabular-nums">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-pressed={themeMeta.isLight}
              aria-label={themeMeta.ariaLabel}
              data-testid="theme-toggle-btn"
              title={`Current theme: ${themeMeta.currentTheme}. Click to switch to ${themeMeta.nextTheme} mode.`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-sans font-semibold transition-colors whitespace-nowrap shrink-0 bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 dark:bg-[#0A0A0C] dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500"
            >
              {themeMeta.isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              )}
              <span>{themeMeta.buttonLabel}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleUiSoundEffects}
              aria-pressed={uiSoundPrefs.enabled}
              aria-label={
                uiSoundPrefs.enabled
                  ? 'Mute UI sound effects for incoming messages and connection requests'
                  : 'Unmute UI sound effects for incoming messages and connection requests'
              }
              data-testid="header-ui-sound-toggle"
              title="Toggle subtle UI sound effects for incoming messages and connection requests (including when app is in background)"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-sans font-medium transition-colors whitespace-nowrap shrink-0 ${
                uiSoundPrefs.enabled
                  ? 'bg-slate-100 border-slate-300 text-slate-800 hover:border-slate-400 dark:bg-[#0A0A0C] dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 dark:bg-[#050505] dark:border-zinc-800/80 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              {uiSoundPrefs.enabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-500 shrink-0" />
              )}
              <span>{uiSoundPrefs.enabled ? 'Sound Alerts: On' : 'Sound Alerts: Muted'}</span>
            </button>
            <span className="text-slate-700 dark:text-zinc-300 whitespace-nowrap">
              Streak: <strong className="text-amber-600 dark:text-amber-400">{currentIdentity.streakCount} Days</strong>
            </span>
            <span className="text-slate-700 dark:text-zinc-300 whitespace-nowrap">
              Score: <strong className="text-emerald-600 dark:text-emerald-400">{currentIdentity.participationPoints} pts</strong>
            </span>
            <button
              type="button"
              onClick={() => setActivePage('study')}
              className="px-3.5 py-1.5 text-xs font-sans font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
            >
              Invite to Study Room
            </button>
          </div>
        </header>

        {/* Main Scrollable Page Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          {/* ================================================================
              PAGE 1: ONLINE DIRECTORY, DAILY PRODUCTIVITY GOAL & STREAK HUB
              ================================================================ */}
          {activePage === 'hub' && (
            <section className="space-y-8" aria-label="Online Presence Directory">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className="p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-1.5"
                  data-testid="hub-signed-in-profile-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-zinc-400">Signed-In Account</div>
                    <span className="text-[11px] font-mono text-emerald-400">
                      {userBadgeSummary.unlockedCount}/{userBadgeSummary.totalBadgesCount} Badges
                    </span>
                  </div>
                  <div className="text-base font-bold text-white truncate">
                    {currentIdentity.displayName}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono truncate">
                    {currentIdentity.email}
                  </div>
                  {userBadgeSummary.unlockedBadges.length > 0 && (
                    <div
                      className="flex flex-wrap items-center gap-1 pt-1"
                      data-testid="hub-kpi-profile-badges"
                    >
                      {userBadgeSummary.unlockedBadges.map((b) => (
                        <AchievementBadgeChip
                          key={b.id}
                          badge={b}
                          compact={true}
                          testId={`hub-kpi-badge-${b.id}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-1"
                  data-testid="hub-kpi-streak-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-zinc-400">Active Login Streak</div>
                    <span
                      data-testid="hub-kpi-streak-freeze-status"
                      className={`text-[11px] font-mono font-semibold tabular-nums ${
                        streakFreezeStatus.isStreakAtRisk
                          ? 'text-amber-400'
                          : streakFreezeStatus.isProtected
                          ? 'text-sky-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      {streakFreezeStatus.isStreakAtRisk
                        ? `At Risk (${streakFreezeStatus.streakAtRiskCount}d)`
                        : `${streakFreezeStatus.streakFreezesOwned}/${streakFreezeStatus.maxFreezes} Freezes`}
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                    {currentIdentity.streakCount} {currentIdentity.streakCount === 1 ? 'Day' : 'Days'}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    Checked in: {currentIdentity.lastLoginDate}
                  </div>
                </div>

                <div className="p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-1">
                  <div className="text-xs text-zinc-400">Participation Points</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                    {currentIdentity.participationPoints} pts
                  </div>
                  <div className="text-xs text-zinc-500">
                    Study, Chat, Moments & Games
                  </div>
                </div>

                <div className="p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-1">
                  <div className="text-xs text-zinc-400">Privacy Shield</div>
                  <div className="text-base font-bold text-white capitalize">
                    {(currentIdentity.privacyVisibility || 'everyone').replace('_', ' ')}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono truncate">
                    Key: {e2eeFingerprint.slice(0, 9)}
                  </div>
                </div>
              </div>

              {/* User Profile, Streak Freeze Protection & Achievement Badges Card */}
              <UserProfileBadgesCard
                displayName={currentIdentity.displayName}
                email={currentIdentity.email}
                bio={currentIdentity.bio}
                streakCount={currentIdentity.streakCount}
                participationPoints={currentIdentity.participationPoints}
                badgeSummary={userBadgeSummary}
                streakFreezeStatus={streakFreezeStatus}
                onAdvanceStreak={handleAdvanceUserStreak}
                onRecordConsecutiveGoalDay={handleRecordConsecutiveGoalDay}
                onContributeHelpfulNote={handleContributeHelpfulNoteFromProfile}
                onPurchaseStreakFreeze={handlePurchaseStreakFreeze}
                onRescueMissedDayWithFreeze={handleRescueMissedDayWithFreeze}
                onSimulateMissedDay={handleSimulateMissedDay}
                onOpenStudyRoom={() => setActivePage('study')}
              />

              {/* Daily Productivity Goal Feature with Target Setter & Progress Bar */}
              <div
                className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-5"
                data-testid="daily-productivity-goal-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-white">
                        Daily Productivity Goal
                      </h2>
                      <span className="text-xs text-zinc-500">·</span>
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          goalProgress.isGoalReached
                            ? 'text-emerald-400'
                            : goalProgress.isHalfwayReached
                              ? 'text-amber-400'
                              : 'text-zinc-300'
                        }`}
                        data-testid="daily-goal-status-text"
                      >
                        {goalProgress.isGoalReached
                          ? `Goal Reached (${goalProgress.completedMinutes}m / ${goalProgress.targetMinutes}m)`
                          : goalProgress.isHalfwayReached
                            ? `50% Milestone Hit · ${goalProgress.remainingMinutes}m remaining to 100% target`
                            : `${goalProgress.remainingMinutes}m remaining to hit today's target`}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Set your daily target focus time and track completed focus blocks from the Study Room or quick sessions.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleQuickStartPomodoro}
                      data-testid="daily-goal-quick-start-btn"
                      title={`Instantly log a ${QUICK_START_POMODORO_MINUTES}-minute Pomodoro block and earn +${QUICK_START_PARTICIPATION_POINTS} participation points`}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-black shrink-0" />
                      <span>
                        Quick Start (+{QUICK_START_POMODORO_MINUTES}m · +{QUICK_START_PARTICIPATION_POINTS} pts)
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogFocusMinutes(15)}
                      data-testid="log-focus-15m-btn"
                      className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-md whitespace-nowrap shrink-0"
                    >
                      +15m Focus Block
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogFocusMinutes(25)}
                      data-testid="log-focus-25m-btn"
                      className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
                    >
                      +25m Pomodoro
                    </button>
                    <button
                      type="button"
                      onClick={handleShareDailyGoalToFeed}
                      data-testid="share-daily-goal-btn"
                      aria-label="Share Daily Goal progress and streak as a new Moment to your feed"
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Share Daily Goal</span>
                    </button>
                  </div>
                </div>

                {quickStartFeedback && (
                  <div
                    role="status"
                    aria-live="polite"
                    data-testid="daily-goal-quick-start-feedback"
                    className="px-3.5 py-2 rounded-md bg-amber-400/10 border border-amber-400/35 text-xs font-mono text-amber-200 flex items-center justify-between gap-3"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0 truncate">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{quickStartFeedback}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuickStartFeedback('')}
                      className="text-[11px] text-amber-300 hover:text-white underline underline-offset-2 shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {sharedDailyGoalSummary && (
                  <div
                    data-testid="daily-goal-share-summary-panel"
                    role="status"
                    className="p-4 rounded-md bg-[#050505] border border-emerald-500/40 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-bold text-white">
                          Posted to Moments Feed: {sharedDailyGoalSummary.headline}
                        </span>
                        <span aria-hidden="true" className="text-zinc-600">
                          ·
                        </span>
                        <span
                          data-testid="daily-goal-share-summary-percent"
                          className="font-mono font-semibold text-emerald-400 tabular-nums"
                        >
                          {sharedDailyGoalSummary.progressPercent}% Complete
                        </span>
                        <span aria-hidden="true" className="text-zinc-600">
                          ·
                        </span>
                        <span
                          data-testid="daily-goal-share-summary-streak"
                          className="font-mono font-semibold text-amber-400 tabular-nums"
                        >
                          {sharedDailyGoalSummary.streakCount}-Day Streak
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setMomentFilter('all');
                            setActivePage('moments');
                          }}
                          data-testid="view-shared-goal-moment-btn"
                          className="px-3 py-1 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                        >
                          View in Moments Feed
                        </button>
                      </div>
                    </div>

                    <p
                      data-testid="daily-goal-share-summary-caption"
                      className="text-xs font-mono text-zinc-200 leading-relaxed break-words"
                    >
                      {sharedDailyGoalSummary.caption}
                    </p>
                  </div>
                )}

                {/* Progress Bar Visualization with 50% & 100% Milestone Markers */}
                <div className="space-y-3" data-testid="daily-goal-progress-section">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-zinc-300">
                      Completed Today:{' '}
                      <strong className="text-white" data-testid="daily-goal-completed">
                        {goalProgress.completedMinutes} mins
                      </strong>{' '}
                      / Target:{' '}
                      <strong className="text-white" data-testid="daily-goal-target">
                        {goalProgress.targetMinutes} mins
                      </strong>
                    </span>
                    <div className="flex items-center gap-2">
                      {goalProgress.activeCelebrationHeadline && (
                        <motion.span
                          key={goalProgress.milestoneStage}
                          initial={{ opacity: 0, scale: 0.85, y: 2 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                          data-testid="daily-goal-celebration-badge"
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-sans font-semibold ${
                            goalProgress.isGoalReached
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          {goalProgress.isGoalReached ? (
                            <Trophy className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                          <span>
                            {goalProgress.isGoalReached ? '100% Target Hit!' : '50% Halfway Hit!'}
                          </span>
                        </motion.span>
                      )}
                      <span
                        className={`text-sm font-bold transition-colors duration-200 ${goalProgress.percentTextColorClass}`}
                        data-testid="daily-goal-percent"
                        data-milestone-stage={goalProgress.milestoneStage}
                      >
                        {goalProgress.progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Track + Positioned 50% and 100% Milestone Markers */}
                  <div className="relative pt-7 pb-2">
                    {/* 0% Start Label */}
                    <div className="absolute top-0 left-0 flex items-center gap-1 text-[11px] font-mono text-zinc-500 tabular-nums">
                      <span>0%</span>
                    </div>

                    {/* 50% Halfway Visual Milestone Marker */}
                    <div
                      data-testid="daily-goal-milestone-50"
                      data-reached={goalProgress.isHalfwayReached ? 'true' : 'false'}
                      className={`absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono tabular-nums transition-colors duration-200 whitespace-nowrap ${
                        goalProgress.isHalfwayReached
                          ? 'bg-amber-500/15 border-amber-400/50 text-amber-300 font-semibold'
                          : 'bg-[#050505] border-zinc-800 text-zinc-400'
                      }`}
                      title={`50% Milestone (${goalProgress.halfwayMinutes} mins)`}
                    >
                      <Sparkles
                        data-testid="daily-goal-milestone-50-icon"
                        className={`w-3 h-3 shrink-0 ${
                          goalProgress.isHalfwayReached ? 'text-amber-400' : 'text-zinc-500'
                        }`}
                      />
                      <span>50% ({goalProgress.halfwayMinutes}m)</span>
                      {goalProgress.isHalfwayReached && (
                        <Check className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>

                    {/* 100% Target Visual Milestone Marker */}
                    <div
                      data-testid="daily-goal-milestone-100"
                      data-reached={goalProgress.isGoalReached ? 'true' : 'false'}
                      className={`absolute top-0 right-0 flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono tabular-nums transition-colors duration-200 whitespace-nowrap ${
                        goalProgress.isGoalReached
                          ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 font-semibold'
                          : 'bg-[#050505] border-zinc-800 text-zinc-400'
                      }`}
                      title={`100% Daily Target (${goalProgress.targetMinutes} mins)`}
                    >
                      <Trophy
                        data-testid="daily-goal-milestone-100-icon"
                        className={`w-3 h-3 shrink-0 ${
                          goalProgress.isGoalReached ? 'text-emerald-400' : 'text-zinc-500'
                        }`}
                      />
                      <span>100% ({goalProgress.targetMinutes}m)</span>
                      {goalProgress.isGoalReached && (
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      )}
                    </div>

                    {/* Progress Bar Track with 50% & 100% Tick Notches */}
                    <div
                      role="progressbar"
                      aria-label="Daily Productivity Goal Progress"
                      aria-valuenow={goalProgress.progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      data-testid="daily-productivity-progress-bar"
                      data-milestone-stage={goalProgress.milestoneStage}
                      className={`relative w-full h-3.5 bg-[#050505] border rounded-full overflow-hidden transition-colors duration-200 ${
                        goalProgress.isGoalReached
                          ? 'border-emerald-500/50'
                          : goalProgress.isHalfwayReached
                            ? 'border-amber-500/50'
                            : 'border-zinc-800'
                      }`}
                    >
                      <motion.div
                        data-testid="daily-productivity-progress-fill"
                        data-milestone-stage={goalProgress.milestoneStage}
                        data-motion-animated="true"
                        data-progress-scale={progressMotionSpec.scaleX.toFixed(2)}
                        data-minutes-increased={
                          progressMotionSpec.didMinutesIncrease ? 'true' : 'false'
                        }
                        data-crossed-milestone={progressMotionSpec.crossedMilestone}
                        initial={progressMotionSpec.initial}
                        animate={progressMotionSpec.animate}
                        transition={progressMotionSpec.transition}
                        style={{ transformOrigin: 'left center' }}
                        className={`w-full h-full transition-colors duration-300 origin-left ${goalProgress.barFillColorClass}`}
                      />

                      {/* 50% Tick Line Overlay on the Progress Bar */}
                      <div
                        aria-hidden="true"
                        data-testid="daily-goal-milestone-50-tick"
                        className={`
                          absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 z-10
                          ${goalProgress.isHalfwayReached ? 'bg-amber-300' : 'bg-zinc-600'}
                        `}
                      />

                      {/* 100% End Tick Line Overlay on the Progress Bar */}
                      <div
                        aria-hidden="true"
                        data-testid="daily-goal-milestone-100-tick"
                        className={`
                          absolute inset-y-0 right-0 w-1 z-10
                          ${goalProgress.isGoalReached ? 'bg-emerald-300' : 'bg-zinc-700'}
                        `}
                      />
                    </div>
                  </div>

                  {/* Celebratory Milestone Status Strip */}
                  <div
                    data-testid="daily-goal-milestone-strip"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5"
                  >
                    {goalProgress.milestones.map((milestone) => {
                      const isAmber = milestone.tone === 'amber';
                      const activeCardClass = milestone.reached
                        ? isAmber
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                        : 'bg-[#050505] border-zinc-800/90 text-zinc-400';

                      return (
                        <div
                          key={milestone.id}
                          data-testid={`daily-goal-card-${milestone.id}`}
                          data-reached={milestone.reached ? 'true' : 'false'}
                          className={`flex items-center justify-between gap-3 px-3 py-2 rounded-md border text-xs transition-colors duration-200 ${activeCardClass}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                                milestone.reached
                                  ? isAmber
                                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                                    : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                              }`}
                            >
                              {milestone.iconName === 'sparkles' ? (
                                <Sparkles className="w-3.5 h-3.5" />
                              ) : (
                                <Trophy className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white truncate">
                                  {milestone.label}
                                </span>
                                <span className="font-mono text-[11px] opacity-80 tabular-nums">
                                  ({milestone.thresholdMinutes}m)
                                </span>
                              </div>
                              <p className="text-[11px] opacity-85 truncate">
                                {milestone.celebrationMessage}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider shrink-0 ${
                              milestone.reached
                                ? isAmber
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                  : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                                : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                            }`}
                          >
                            {milestone.reached ? 'Unlocked' : `${milestone.thresholdPercent}%`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Target Focus Time Controls */}
                <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
                  <form
                    onSubmit={handleSetDailyProductivityTarget}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <div className="space-y-1">
                      <label
                        htmlFor="daily-target-minutes-input"
                        className="block text-xs font-medium text-zinc-300"
                      >
                        Target Focus Time (Minutes / Day)
                      </label>
                      <input
                        id="daily-target-minutes-input"
                        type="number"
                        min={15}
                        max={720}
                        value={targetInputMinutes}
                        onChange={(e) => setTargetInputMinutes(e.target.value)}
                        className="w-36 px-3 py-1.5 text-xs font-mono tabular-nums bg-[#050505] border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
                    >
                      Set Target Goal
                    </button>
                  </form>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500 mr-1">Presets:</span>
                    {[60, 120, 180, 240].map((presetMins) => (
                      <button
                        key={presetMins}
                        type="button"
                        onClick={() =>
                          persistProductivityGoal(presetMins, dailyCompletedMinutes)
                        }
                        className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                          dailyTargetMinutes === presetMins
                            ? 'bg-white text-black border-white font-bold'
                            : 'bg-[#050505] text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {presetMins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Streak Focus Session Reminder Schedule Bar */}
                <div
                  data-testid="streak-reminder-settings-bar"
                  className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-md flex items-center justify-center border shrink-0 ${
                        streakReminderEvaluation.shouldShowToast
                          ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                          : streakReminderEvaluation.hasStartedFocusToday
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          Streak Focus Check-In Reminder
                        </span>
                        <span
                          data-testid="streak-reminder-cutoff-label"
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-amber-300 tabular-nums"
                        >
                          {streakReminderEvaluation.reminderTime12h}
                        </span>
                        <span
                          data-testid="streak-reminder-status-badge"
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                            streakReminderEvaluation.shouldShowToast
                              ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                              : streakReminderEvaluation.hasStartedFocusToday
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          }`}
                        >
                          {streakReminderEvaluation.shouldShowToast
                            ? 'Reminder Toast Active'
                            : streakReminderEvaluation.hasStartedFocusToday
                              ? 'Focus Started Today'
                              : streakReminderEvaluation.isDismissedToday
                                ? 'Dismissed Today'
                                : streakReminderPrefs.enabled
                                  ? 'Scheduled'
                                  : 'Paused'}
                        </span>
                      </div>
                      <p
                        data-testid="streak-reminder-status-summary"
                        className="text-[11px] text-zinc-400 truncate mt-0.5"
                      >
                        {streakReminderEvaluation.statusSummary}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0 mr-0.5" />
                      {STREAK_REMINDER_TIME_PRESETS.slice(0, 4).map((presetTime) => {
                        const parsedPreset = parseReminderTimeMinutes(presetTime);
                        const isSelected =
                          streakReminderEvaluation.reminderTime24h === parsedPreset.formatted24h;
                        return (
                          <button
                            key={presetTime}
                            type="button"
                            data-testid={`streak-reminder-preset-${presetTime.replace(':', '')}`}
                            onClick={() => handleUpdateStreakReminderTime(presetTime)}
                            className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                              isSelected
                                ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 font-semibold'
                                : 'bg-[#050505] text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            {parsedPreset.formatted12h}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      data-testid="streak-reminder-toggle-btn"
                      aria-pressed={streakReminderPrefs.enabled}
                      onClick={handleToggleStreakReminderEnabled}
                      className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                        streakReminderPrefs.enabled
                          ? 'bg-zinc-900 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                          : 'bg-[#050505] text-zinc-500 border-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      {streakReminderPrefs.enabled ? 'Reminder On' : 'Reminder Off'}
                    </button>

                    {!streakReminderEvaluation.shouldShowToast && (
                      <button
                        type="button"
                        data-testid="streak-reminder-trigger-btn"
                        onClick={handleTriggerStreakReminderPreview}
                        className="px-2.5 py-1 text-[11px] font-mono rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 transition-colors whitespace-nowrap shrink-0"
                        title="Preview or re-check the daily streak focus reminder toast"
                      >
                        Check Reminder Toast
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly Activity Overview (Last 7 Days Daily Productivity & Points Earned via Recharts) */}
              <WeeklyActivityOverview
                summary={weeklyActivitySummary}
                dailyTargetMinutes={dailyTargetMinutes}
                onLogQuickFocus={handleLogFocusMinutes}
              />

              {/* Weekly Productivity Distribution (Focus Session Breakdown by Study Room Topic via Recharts) */}
              <WeeklyProductivityDistribution
                distribution={weeklyTopicDistribution}
                onLogTopicFocusSession={handleLogTopicFocusSession}
                onOpenStudyRoomWithTopic={(roomCode) => {
                  setActiveStudyRoomCode(roomCode);
                  setActivePage('study');
                }}
              />

              {/* Global Leaderboard Component aggregating participationPoints & streakCount across the platform */}
              <GlobalLeaderboard
                currentUid={currentIdentity.uid}
                firestoreProfiles={firestoreProfiles}
                serverPlatformUsers={serverPlatformUsers}
                onlinePeers={onlinePeers.map((p) => ({
                  uid: p.uid,
                  displayName: p.displayName,
                  bio: p.bio,
                  streakCount: p.streakCount,
                  participationPoints: p.participationPoints,
                  isOnline: true,
                  currentMode: p.currentMode,
                  privacyVisibility: p.privacyVisibility,
                }))}
                currentUserCandidate={{
                  uid: currentIdentity.uid,
                  displayName: currentIdentity.displayName,
                  bio: currentIdentity.bio,
                  streakCount: currentIdentity.streakCount,
                  participationPoints: currentIdentity.participationPoints,
                  isOnline: true,
                  currentMode: activePage,
                  privacyVisibility: currentIdentity.privacyVisibility,
                  consecutiveGoalDays: userBadgeSummary.consecutiveGoalDays,
                  helpfulNotesCount: userBadgeSummary.helpfulNotesCount,
                }}
                acceptedPeerUids={acceptedPeerUids}
                pendingPeerUids={pendingPeerUids}
                onSendInviteFromLeaderboard={(entry) =>
                  handleSendRequest({
                    uid: entry.uid,
                    displayName: entry.displayName,
                    bio: entry.bio,
                    avatarUrl: '',
                    streakCount: entry.streakCount,
                    participationPoints: entry.participationPoints,
                    privacyVisibility: 'everyone',
                    currentMode: 'hub',
                    activeStudyRoomCode: 'STUDY-GLOBAL',
                    activeGameId: null,
                    connectedAt: Date.now(),
                  })
                }
                onOpenChatWithPeer={(peerUid) => {
                  setActiveChatPeerUid(peerUid);
                  setActivePage('chat');
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Live Online Users Directory (7 cols) */}
                <div
                  className="lg:col-span-7 p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4"
                  data-testid="hub-online-directory"
                >
                  <div className="border-b border-zinc-800/80 pb-4 space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="text-lg font-bold text-white">
                            Real People Online Now ({onlinePeers.length})
                          </h1>
                          <span aria-hidden="true" className="text-zinc-600">·</span>
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 tabular-nums"
                            data-testid="online-directory-in-focus-count"
                          >
                            <span
                              aria-hidden="true"
                              className={`w-2 h-2 rounded-full ${
                                directoryFocusSummary.inFocusCount > 0
                                  ? 'bg-emerald-400 animate-pulse'
                                  : 'bg-zinc-600'
                              }`}
                            />
                            <span>{directoryFocusSummary.inFocusCount} In Focus</span>
                          </span>
                          <span aria-hidden="true" className="text-zinc-600">·</span>
                          <span
                            className="text-xs font-mono text-sky-400 tabular-nums"
                            data-testid="online-directory-mood-count"
                          >
                            {directoryMoodSummary.activeMoodCount} Sharing Mood
                          </span>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 shrink-0">
                          {wsConnected ? 'Live Sync' : 'Reconnecting'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Set your live Mood indicator (e.g., Deep Work, Brainstorming, Quick Questions) and see who is currently productive in a Study Room.
                      </p>
                    </div>

                    {/* Interactive Mood Indicator Setter Bar */}
                    <div
                      className="p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 space-y-2.5"
                      data-testid="online-directory-mood-setter"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs min-w-0">
                            <span className="font-semibold text-zinc-200">Your Mood Indicator:</span>
                            <span
                              data-testid="current-user-active-mood"
                              className={`font-mono font-semibold ${
                                !myMoodMeta.hasMood
                                  ? 'text-zinc-500'
                                  : myMoodMeta.tone === 'emerald'
                                  ? 'text-emerald-400'
                                  : myMoodMeta.tone === 'amber'
                                  ? 'text-amber-400'
                                  : myMoodMeta.tone === 'violet'
                                  ? 'text-violet-400'
                                  : myMoodMeta.tone === 'sky'
                                  ? 'text-sky-400'
                                  : 'text-zinc-300'
                              }`}
                            >
                              {myMoodMeta.hasMood ? myMoodMeta.label : 'None Set'}
                            </span>
                          </div>
                          {myMoodMeta.hasMood && (
                            <button
                              type="button"
                              onClick={() => handleUpdateUserMood(null)}
                              data-testid="clear-user-mood-btn"
                              className="text-xs font-mono text-zinc-400 hover:text-white underline underline-offset-2 whitespace-nowrap shrink-0"
                            >
                              Clear Mood
                            </button>
                          )}
                        </div>
                        {myMoodMeta.hasMood && (
                          <p className="text-[11px] text-zinc-400">
                            {myMoodMeta.description}
                          </p>
                        )}
                      </div>

                      <motion.div
                        initial={
                          getMoodCategoryExpansionMotionSpec(true).containerInitial
                        }
                        animate={
                          getMoodCategoryExpansionMotionSpec(true).containerAnimate
                        }
                        transition={
                          getMoodCategoryExpansionMotionSpec(true).containerTransition
                        }
                        className="flex flex-wrap items-center gap-2.5"
                        role="group"
                        aria-label="Select your live Mood indicator grouped by category"
                        data-testid="mood-setter-category-groups"
                      >
                        {directoryMoodSummary.groupedPresets.map((group, catIdx) => {
                          const catHeaderMotion =
                            getMoodCategoryExpansionMotionSpec(true).getCategoryHeaderMotion(
                              catIdx
                            );
                          return (
                            <motion.div
                              key={group.category}
                              initial={catHeaderMotion.initial}
                              animate={catHeaderMotion.animate}
                              transition={catHeaderMotion.transition}
                              data-testid={`mood-setter-group-${group.category.toLowerCase()}`}
                              data-mood-category={group.category}
                              data-stagger-delay={catHeaderMotion.transition.delay}
                              className="inline-flex flex-wrap items-center gap-1.5 px-2 py-1 rounded-md bg-[#0A0A0C] border border-zinc-800/90"
                            >
                              <motion.span
                                initial={catHeaderMotion.initial}
                                animate={catHeaderMotion.animate}
                                transition={catHeaderMotion.transition}
                                className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pr-1 border-r border-zinc-800"
                              >
                                {group.label}
                              </motion.span>
                              {group.presets.map((preset, presetIdx) => {
                                const presetMotion =
                                  getMoodCategoryExpansionMotionSpec(true).getPresetItemMotion(
                                    catIdx,
                                    presetIdx
                                  );
                                const isSelected =
                                  myMoodMeta.hasMood &&
                                  myMoodMeta.label?.toLowerCase() ===
                                    preset.label.toLowerCase();
                                const setterTooltipMeta = getMoodPresetTooltipMeta(
                                  preset.id,
                                  hoveredMoodSetterPresetId === preset.id
                                );
                                const presetUsage24h =
                                  moodPresetUsage24hById[preset.id] ||
                                  getMoodPresetUsageCount24hMeta({
                                    presetIdOrLabel: preset.id,
                                    onlinePeers,
                                    moodEvents,
                                    currentUid: currentIdentity.uid,
                                    currentUserMood: userMood,
                                  });
                                return (
                                  <div
                                    key={preset.id}
                                    className="relative inline-flex items-center group"
                                    onMouseEnter={() =>
                                      setHoveredMoodSetterPresetId(preset.id)
                                    }
                                    onMouseLeave={() =>
                                      setHoveredMoodSetterPresetId((prev) =>
                                        prev === preset.id ? null : prev
                                      )
                                    }
                                  >
                                    <motion.button
                                      type="button"
                                      initial={presetMotion.initial}
                                      animate={presetMotion.animate}
                                      transition={presetMotion.transition}
                                      onClick={() => handleUpdateUserMood(preset.label)}
                                      onFocus={() => setHoveredMoodSetterPresetId(preset.id)}
                                      onBlur={() =>
                                        setHoveredMoodSetterPresetId((prev) =>
                                          prev === preset.id ? null : prev
                                        )
                                      }
                                      aria-pressed={isSelected}
                                      aria-describedby={`mood-setter-preset-tooltip-${preset.id}`}
                                      data-testid={`mood-preset-${preset.id}`}
                                      data-mood-category={preset.category}
                                      data-mood-definition={setterTooltipMeta.definition}
                                      data-usage-count-24h={presetUsage24h.usageCount24h}
                                      data-user-usage-24h={presetUsage24h.userUsageCount24h}
                                      data-community-usage-24h={
                                        presetUsage24h.communityUsageCount24h
                                      }
                                      data-stagger-delay={presetMotion.transition.delay}
                                      title={`${setterTooltipMeta.fullDefinitionText} · ${presetUsage24h.usageSummaryText}`}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border transition-colors whitespace-nowrap shrink-0 ${
                                        isSelected
                                          ? 'bg-white text-black border-white'
                                          : 'bg-[#050505] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                                      }`}
                                    >
                                      <span>{preset.label}</span>
                                      <span
                                        data-testid={`mood-preset-usage-count-${preset.id}`}
                                        data-usage-count-24h={presetUsage24h.usageCount24h}
                                        data-user-usage-24h={presetUsage24h.userUsageCount24h}
                                        data-community-usage-24h={
                                          presetUsage24h.communityUsageCount24h
                                        }
                                        aria-label={presetUsage24h.usageAriaLabel}
                                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums border transition-colors ${
                                          isSelected
                                            ? 'bg-black/10 text-zinc-900 border-black/25'
                                            : presetUsage24h.hasRecentActivity
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                                        }`}
                                      >
                                        {presetUsage24h.usageBadgeLabel}
                                      </span>
                                      <span
                                        data-testid={`mood-setter-preset-info-${preset.id}`}
                                        data-icon-component={setterTooltipMeta.iconComponent}
                                        aria-hidden="true"
                                        className={`inline-flex items-center justify-center transition-colors ${
                                          isSelected
                                            ? 'text-zinc-700'
                                            : 'text-zinc-500 group-hover:text-zinc-200'
                                        }`}
                                      >
                                        <Info className="w-3 h-3 shrink-0" />
                                      </span>
                                    </motion.button>
                                    <div
                                      id={`mood-setter-preset-tooltip-${preset.id}`}
                                      role="tooltip"
                                      data-testid={`mood-setter-preset-tooltip-${preset.id}`}
                                      data-mood-preset={preset.id}
                                      data-mood-category={preset.category}
                                      data-usage-count-24h={presetUsage24h.usageCount24h}
                                      data-visible={setterTooltipMeta.isVisible ? 'true' : 'false'}
                                      className={`pointer-events-none absolute bottom-full left-0 mb-2 z-30 w-64 p-2.5 rounded-md bg-[#050505] border border-zinc-700/90 shadow-xl space-y-1 text-left transition-opacity duration-150 ${
                                        setterTooltipMeta.isVisible
                                          ? 'opacity-100 visible'
                                          : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1.5 text-[11px] font-semibold text-white">
                                        <span className="inline-flex items-center gap-1">
                                          <Info className="w-3 h-3 shrink-0 text-emerald-400" />
                                          <span>{setterTooltipMeta.label}</span>
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                                          {setterTooltipMeta.category}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-zinc-300 leading-snug">
                                        {setterTooltipMeta.definition}
                                      </p>
                                      <div
                                        data-testid={`mood-setter-preset-tooltip-usage-${preset.id}`}
                                        className="pt-1 border-t border-zinc-800/80 text-[10px] font-mono text-emerald-300"
                                      >
                                        {presetUsage24h.usageSummaryText}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </motion.div>
                          );
                        })}
                      </motion.div>

                      <form
                        onSubmit={handleCustomMoodSubmit}
                        className="flex flex-wrap items-center gap-2 pt-0.5"
                      >
                        <input
                          type="text"
                          value={customMoodInput}
                          onChange={(e) => {
                            setCustomMoodInput(e.target.value);
                            if (moodInputError) setMoodInputError('');
                          }}
                          maxLength={36}
                          placeholder="Or set a custom mood (e.g., Reviewing PRs)..."
                          aria-label="Custom mood indicator"
                          data-testid="custom-mood-input"
                          className="flex-1 min-w-[180px] px-2.5 py-1 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                        />
                        <button
                          type="submit"
                          data-testid="set-custom-mood-btn"
                          className="px-3 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded whitespace-nowrap shrink-0"
                        >
                          Set Custom Mood
                        </button>
                      </form>
                      {moodInputError && (
                        <p className="text-xs text-rose-400" data-testid="mood-input-error">
                          {moodInputError}
                        </p>
                      )}
                    </div>

                    {/* 24-Hour Popular Peer Moods Chart & Summary Section */}
                    <PopularMoods24hSummary
                      summary={popularMoods24h}
                      activeMoodFilter={directoryMoodFilter}
                      onSelectMoodFilter={setDirectoryMoodFilter}
                      currentUid={currentIdentity.uid}
                      currentDisplayName={currentIdentity.displayName}
                      currentMood={userMood}
                      moodEvents={moodEvents}
                    />

                    {/* Interactive Focus Filter, Mood Filter & Quick Study Desk Status Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className="flex items-center gap-1 p-1 bg-[#050505] border border-zinc-800 rounded-md"
                          role="group"
                          aria-label="Filter online directory by Study Room focus status"
                        >
                          <button
                            type="button"
                            onClick={() => setShowOnlyInFocusPeers(false)}
                            data-testid="online-directory-filter-all"
                            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                              !showOnlyInFocusPeers
                                ? 'bg-white text-black'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            All Online ({onlinePeers.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowOnlyInFocusPeers(true)}
                            data-testid="online-directory-filter-focus"
                            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                              showOnlyInFocusPeers
                                ? 'bg-white text-black'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            In Focus ({directoryFocusSummary.inFocusCount})
                          </button>
                        </div>

                        <div
                          data-testid="online-directory-quick-filter-area"
                          className="relative inline-flex flex-wrap items-center gap-2"
                          onMouseEnter={() => setIsQuickFilterHovered(true)}
                          onMouseLeave={() => setIsQuickFilterHovered(false)}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <motion.button
                              id="online-directory-mood-filter"
                              type="button"
                              whileHover={
                                getQuickFilterToggleHoverMotionSpec(isQuickFilterHovered)
                                  .whileHover
                              }
                              whileTap={
                                getQuickFilterToggleHoverMotionSpec(isQuickFilterHovered)
                                  .whileTap
                              }
                              animate={
                                getQuickFilterToggleHoverMotionSpec(isQuickFilterHovered)
                                  .animate
                              }
                              transition={
                                getQuickFilterToggleHoverMotionSpec(isQuickFilterHovered)
                                  .transition
                              }
                              onClick={() => {
                                const action = resolveOnlineDirectoryFilterToggleAction(
                                  directoryAudienceFilter
                                );
                                if (action.shouldOpenClearModal) {
                                  setIsClearFilterModalOpen(true);
                                  handlePlayDirectoryFilterToggleChime(
                                    directoryAudienceFilter,
                                    'everyone'
                                  );
                                  void handleCopyDirectoryFilterShareLink(
                                    undefined,
                                    directoryAudienceFilter
                                  );
                                } else {
                                  setDirectoryAudienceFilter(action.nextMode);
                                  setIsClearFilterModalOpen(false);
                                  handlePlayDirectoryFilterToggleChime(
                                    directoryAudienceFilter,
                                    action.nextMode
                                  );
                                  void handleCopyDirectoryFilterShareLink(
                                    undefined,
                                    action.nextMode
                                  );
                                }
                              }}
                              onMouseEnter={() => setIsQuickFilterHovered(true)}
                              onMouseLeave={() => setIsQuickFilterHovered(false)}
                              onFocus={() => setIsQuickFilterHovered(true)}
                              onBlur={() => setIsQuickFilterHovered(false)}
                              title={directoryQuickFilterMeta.tooltipDetail}
                              aria-describedby="online-directory-quick-filter-tooltip"
                              aria-pressed={directoryQuickFilterMeta.ariaPressed}
                              aria-haspopup={
                                directoryQuickFilterMeta.requiresClearConfirmationModal
                                  ? 'dialog'
                                  : undefined
                              }
                              aria-expanded={
                                directoryQuickFilterMeta.requiresClearConfirmationModal
                                  ? isClearFilterModalOpen
                                  : undefined
                              }
                              aria-label={directoryQuickFilterMeta.ariaLabel}
                              data-testid="online-directory-quick-filter-btn"
                              data-filter-mode={directoryQuickFilterMeta.mode}
                              data-mood-filter={directoryQuickFilterMeta.shareLinkMeta.moodParam}
                              data-chime-utility={directoryQuickFilterMeta.toggleChimeSpec.utilityName}
                              data-chime-enabled={uiSoundPrefs.enabled ? 'true' : 'false'}
                              data-next-chime-type={directoryQuickFilterMeta.toggleChimeSpec.chimeType}
                              data-next-chime-notes={
                                directoryQuickFilterMeta.toggleChimeSpec.chime.noteNames
                              }
                              data-last-chime-played={lastDirectoryFilterChime || 'none'}
                              data-chime-play-count={directoryFilterChimeCount}
                              data-directory-constrained={
                                directoryQuickFilterMeta.isDirectoryConstrained ? 'true' : 'false'
                              }
                              data-icon-pulse-active={
                                directoryQuickFilterMeta.iconPulseSpec.isPulseActive
                                  ? 'true'
                                  : 'false'
                              }
                              data-constraint-reason={
                                directoryQuickFilterMeta.iconPulseSpec.activeConstraintReason
                              }
                              data-share-url={directoryQuickFilterMeta.shareLinkMeta.shareUrl}
                              data-copied={
                                directoryQuickFilterMeta.shareLinkMeta.isCopied ? 'true' : 'false'
                              }
                              data-feedback-state={
                                directoryQuickFilterMeta.shareLinkMeta.iconFeedbackState
                              }
                              data-hidden-peers-count={directoryQuickFilterMeta.hiddenPeersCount}
                              data-requires-clear-modal={
                                directoryQuickFilterMeta.requiresClearConfirmationModal
                                  ? 'true'
                                  : 'false'
                              }
                              data-tooltip-title={directoryQuickFilterMeta.tooltipTitle}
                              data-hovered={isQuickFilterHovered ? 'true' : 'false'}
                              data-hover-scale={
                                directoryQuickFilterMeta.toggleHoverMotion.hoverScale
                              }
                              data-hover-brightness={
                                directoryQuickFilterMeta.toggleHoverMotion.hoverBrightness
                              }
                              className={`group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border whitespace-nowrap shrink-0 origin-center ${
                                directoryQuickFilterMeta.isMyConnectionsOnly
                                  ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/60 hover:bg-emerald-500/25'
                                  : 'bg-[#050505] text-zinc-200 border-zinc-800 hover:border-zinc-600 hover:text-white'
                              }`}
                            >
                              <span
                                id="online-directory-mood-filter-icon-share-wrapper"
                                data-testid="online-directory-quick-filter-icon-share-container"
                                data-share-url={directoryQuickFilterMeta.shareLinkMeta.shareUrl}
                                data-last-copied-url={lastCopiedDirectoryFilterUrl}
                                data-share-status={directoryQuickFilterMeta.shareLinkMeta.statusLabel}
                                data-share-category={directoryQuickFilterMeta.shareLinkMeta.categoryParam}
                                data-share-mood={directoryQuickFilterMeta.shareLinkMeta.moodParam}
                                data-share-summary={directoryQuickFilterMeta.shareLinkMeta.summaryLabel}
                                data-share-copied={
                                  directoryQuickFilterMeta.shareLinkMeta.isCopied ? 'true' : 'false'
                                }
                                data-feedback-state={
                                  directoryQuickFilterMeta.shareLinkMeta.iconFeedbackState
                                }
                                role="button"
                                tabIndex={0}
                                title={directoryQuickFilterMeta.shareLinkMeta.containerTitle}
                                aria-label={directoryQuickFilterMeta.shareLinkMeta.containerAriaLabel}
                                onClick={(e) => {
                                  void handleCopyDirectoryFilterShareLink(e);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    void handleCopyDirectoryFilterShareLink(e);
                                  }
                                }}
                                className={`inline-flex items-center gap-1 rounded px-0.5 py-0.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/80 ${
                                  directoryQuickFilterMeta.shareLinkMeta.isCopied
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : 'hover:bg-emerald-500/15'
                                }`}
                              >
                                <span
                                  data-testid="online-directory-quick-filter-icon"
                                  data-icon-mode={directoryQuickFilterMeta.iconName}
                                  data-dynamic-icon={
                                    directoryQuickFilterMeta.dynamicFilterIconComponent
                                  }
                                  data-state-icon={directoryQuickFilterMeta.stateIconName}
                                  data-secondary-icon={directoryQuickFilterMeta.secondaryStateIconName}
                                  data-crossfade-animation={
                                    directoryQuickFilterMeta.iconCrossFadeMotion.animationType
                                  }
                                  data-crossfade-duration-ms={
                                    directoryQuickFilterMeta.iconCrossFadeMotion.durationMs
                                  }
                                  data-active-icon-key={
                                    directoryQuickFilterMeta.iconCrossFadeMotion.activeIconKey
                                  }
                                  data-icon-hovered={
                                    directoryQuickFilterMeta.iconHoverGlow.isHovered ? 'true' : 'false'
                                  }
                                  data-icon-glow-active={
                                    directoryQuickFilterMeta.iconHoverGlow.isGlowActive
                                      ? 'true'
                                      : 'false'
                                  }
                                  data-icon-glow-tone={
                                    directoryQuickFilterMeta.iconHoverGlow.glowTone
                                  }
                                  data-icon-glow-shadow={
                                    directoryQuickFilterMeta.iconHoverGlow.containerBoxShadow
                                  }
                                  data-icon-svg-filter={
                                    directoryQuickFilterMeta.iconHoverGlow.svgDropShadowFilter
                                  }
                                  data-directory-constrained={
                                    directoryQuickFilterMeta.isDirectoryConstrained
                                      ? 'true'
                                      : 'false'
                                  }
                                  data-icon-pulse-active={
                                    directoryQuickFilterMeta.iconPulseSpec.isPulseActive
                                      ? 'true'
                                      : 'false'
                                  }
                                  data-pulse-animation={
                                    directoryQuickFilterMeta.iconPulseSpec.animationName
                                  }
                                  data-pulse-duration-ms={
                                    directoryQuickFilterMeta.iconPulseSpec.durationMs
                                  }
                                  data-constraint-reason={
                                    directoryQuickFilterMeta.iconPulseSpec.activeConstraintReason
                                  }
                                  data-copied={
                                    directoryQuickFilterMeta.shareLinkMeta.isCopied ? 'true' : 'false'
                                  }
                                  data-feedback-state={
                                    directoryQuickFilterMeta.shareLinkMeta.iconFeedbackState
                                  }
                                  role="img"
                                  aria-label={
                                    directoryQuickFilterMeta.shareLinkMeta.isCopied
                                      ? `Copied! — ${directoryQuickFilterMeta.stateIconLabel}`
                                      : directoryQuickFilterMeta.iconPulseSpec.isPulseActive
                                        ? `${directoryQuickFilterMeta.stateIconLabel} (${directoryQuickFilterMeta.iconPulseSpec.constraintStatusLabel})`
                                        : directoryQuickFilterMeta.stateIconLabel
                                  }
                                  className={`relative overflow-hidden inline-flex items-center justify-center px-1.5 py-0.5 rounded border quick-filter-icon-crossfade ${
                                    directoryQuickFilterMeta.iconPulseSpec.cssClassName
                                  } ${
                                    directoryQuickFilterMeta.shareLinkMeta.isCopied
                                      ? 'bg-emerald-500/30 border-emerald-400/80 text-emerald-200'
                                      : directoryQuickFilterMeta.isDirectoryConstrained
                                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 group-hover:bg-emerald-500/30 group-hover:border-emerald-300/80 group-hover:text-emerald-200'
                                        : 'bg-zinc-900 border-zinc-700/80 text-zinc-300 group-hover:bg-emerald-500/15 group-hover:border-emerald-400/60 group-hover:text-emerald-200'
                                  }`}
                                >
                                  {directoryQuickFilterMeta.iconPulseSpec.isPulseActive && (
                                    <span
                                      aria-hidden="true"
                                      data-testid="quick-filter-icon-pulse-ring"
                                      data-constraint-reason={
                                        directoryQuickFilterMeta.iconPulseSpec.activeConstraintReason
                                      }
                                      className="pointer-events-none absolute inset-0 rounded border border-emerald-400/40 animate-pulse"
                                    />
                                  )}
                                  <AnimatePresence mode="popLayout" initial={false}>
                                    {directoryQuickFilterMeta.isMyConnectionsOnly ? (
                                      <motion.span
                                        key="icon-usercheck"
                                        data-testid="quick-filter-icon-crossfade-layer"
                                        data-icon-key="icon-usercheck"
                                        data-icon-component="UserCheck"
                                        initial={
                                          directoryQuickFilterMeta.iconCrossFadeMotion.initial
                                        }
                                        animate={
                                          directoryQuickFilterMeta.iconCrossFadeMotion.animate
                                        }
                                        exit={
                                          directoryQuickFilterMeta.iconCrossFadeMotion.exit
                                        }
                                        transition={
                                          directoryQuickFilterMeta.iconCrossFadeMotion.transition
                                        }
                                        className="inline-flex items-center justify-center quick-filter-icon-crossfade-item"
                                      >
                                        <UserCheck
                                          aria-hidden="true"
                                          data-testid="quick-filter-state-icon-usercheck"
                                          data-icon-component="UserCheck"
                                          data-icon-pulse-active={
                                            directoryQuickFilterMeta.iconPulseSpec.isPulseActive
                                              ? 'true'
                                              : 'false'
                                          }
                                          className={`w-3.5 h-3.5 shrink-0 text-emerald-300 group-hover:text-emerald-200 ${
                                            directoryQuickFilterMeta.iconPulseSpec.svgCssClassName
                                          }`}
                                        />
                                      </motion.span>
                                    ) : (
                                      <motion.span
                                        key="icon-filter"
                                        data-testid="quick-filter-icon-crossfade-layer"
                                        data-icon-key="icon-filter"
                                        data-icon-component="Filter"
                                        initial={
                                          directoryQuickFilterMeta.iconCrossFadeMotion.initial
                                        }
                                        animate={
                                          directoryQuickFilterMeta.iconCrossFadeMotion.animate
                                        }
                                        exit={
                                          directoryQuickFilterMeta.iconCrossFadeMotion.exit
                                        }
                                        transition={
                                          directoryQuickFilterMeta.iconCrossFadeMotion.transition
                                        }
                                        className="inline-flex items-center justify-center quick-filter-icon-crossfade-item"
                                      >
                                        <Filter
                                          aria-hidden="true"
                                          data-testid="quick-filter-state-icon-filter"
                                          data-icon-component="Filter"
                                          data-icon-pulse-active={
                                            directoryQuickFilterMeta.iconPulseSpec.isPulseActive
                                              ? 'true'
                                              : 'false'
                                          }
                                          className={`w-3.5 h-3.5 shrink-0 ${
                                            directoryQuickFilterMeta.isDirectoryConstrained
                                              ? 'text-emerald-300'
                                              : 'text-zinc-300'
                                          } group-hover:text-emerald-200 ${
                                            directoryQuickFilterMeta.iconPulseSpec.svgCssClassName
                                          }`}
                                        />
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                  {directoryQuickFilterMeta.shareLinkMeta.isCopied && (
                                    <span
                                      data-testid="quick-filter-icon-copied-feedback"
                                      data-feedback-state="Copied!"
                                      className="inline-flex items-center gap-0.5 ml-1 text-[9px] font-mono font-bold text-emerald-200 leading-none"
                                    >
                                      <Check
                                        aria-hidden="true"
                                        data-testid="quick-filter-state-icon-copied"
                                        className="w-2.5 h-2.5 shrink-0 text-emerald-300"
                                      />
                                      <span>Copied!</span>
                                    </span>
                                  )}
                                </span>
                                <span
                                  data-testid="online-directory-quick-filter-share-badge"
                                  data-copied={
                                    directoryQuickFilterMeta.shareLinkMeta.isCopied ? 'true' : 'false'
                                  }
                                  data-feedback-state={
                                    directoryQuickFilterMeta.shareLinkMeta.iconFeedbackState
                                  }
                                  className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono leading-none transition-colors ${
                                    directoryQuickFilterMeta.shareLinkMeta.isCopied
                                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/60'
                                      : 'bg-zinc-900/90 text-zinc-400 border border-zinc-800 group-hover:text-emerald-200 group-hover:border-emerald-500/40'
                                  }`}
                                >
                                  {directoryQuickFilterMeta.shareLinkMeta.isCopied ? (
                                    <>
                                      <Check className="w-2.5 h-2.5 shrink-0 text-emerald-300" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Link2 className="w-2.5 h-2.5 shrink-0" />
                                      <span>Link</span>
                                    </>
                                  )}
                                </span>
                              </span>

                              <span>
                                {directoryQuickFilterMeta.isMyConnectionsOnly
                                  ? `My Connections (${directoryQuickFilterMeta.myConnectionsCount})`
                                  : `Everyone (${directoryQuickFilterMeta.everyoneCount})`}
                              </span>

                              <span
                                data-testid="online-directory-quick-filter-indicator"
                                data-toggle-state={directoryQuickFilterMeta.mode}
                                data-thumb-position={directoryQuickFilterMeta.toggleThumbPosition}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
                                  directoryQuickFilterMeta.isMyConnectionsOnly
                                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50'
                                    : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`relative inline-flex items-center w-6 h-3.5 rounded-full p-0.5 transition-colors ${
                                    directoryQuickFilterMeta.isMyConnectionsOnly
                                      ? 'bg-emerald-400/40'
                                      : 'bg-zinc-700'
                                  }`}
                                >
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full transition-transform ${
                                      directoryQuickFilterMeta.isMyConnectionsOnly
                                        ? 'translate-x-2.5 bg-emerald-300'
                                        : 'translate-x-0 bg-zinc-300'
                                    }`}
                                  />
                                </span>
                                <span>{directoryQuickFilterMeta.toggleStateIndicator}</span>
                              </span>
                            </motion.button>

                            <AnimatePresence initial={false}>
                              {directoryQuickFilterMeta.showClearButton && (
                                <motion.button
                                  key="online-directory-mood-filter-clear"
                                  id="online-directory-mood-filter-clear"
                                  type="button"
                                  initial={directoryQuickFilterMeta.clearButtonMotion.initial}
                                  animate={directoryQuickFilterMeta.clearButtonMotion.animate}
                                  exit={directoryQuickFilterMeta.clearButtonMotion.exit}
                                  transition={directoryQuickFilterMeta.clearButtonMotion.transition}
                                  onClick={() => setIsClearFilterModalOpen(true)}
                                  title={directoryQuickFilterMeta.clearModalMeta.triggerButtonAriaLabel}
                                  aria-label={directoryQuickFilterMeta.clearModalMeta.triggerButtonAriaLabel}
                                  aria-haspopup="dialog"
                                  aria-expanded={isClearFilterModalOpen}
                                  data-testid="online-directory-quick-filter-clear-btn"
                                  data-hidden-peers-count={directoryQuickFilterMeta.hiddenPeersCount}
                                  data-motion-exit-scale={
                                    directoryQuickFilterMeta.clearButtonMotion.exit.scale
                                  }
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-md border border-zinc-700/90 bg-zinc-900/90 text-zinc-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-500 whitespace-nowrap shrink-0 origin-center"
                                >
                                  <RotateCcw className="w-3 h-3 shrink-0 text-amber-400" />
                                  <span>{directoryQuickFilterMeta.clearModalMeta.triggerButtonLabel}</span>
                                  <span
                                    data-testid="clear-filter-trigger-hidden-badge"
                                    className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-amber-300"
                                  >
                                    {directoryQuickFilterMeta.hiddenPeersCount} hidden
                                  </span>
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </div>

                          <AnimatePresence>
                            {isClearFilterModalOpen && directoryQuickFilterMeta.isMyConnectionsOnly && (
                              <motion.div
                                key="online-directory-clear-filter-modal-backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.16, ease: 'easeOut' }}
                                onClick={() => setIsClearFilterModalOpen(false)}
                                data-testid="online-directory-clear-filter-modal-overlay"
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
                              >
                                <motion.div
                                  id="online-directory-clear-filter-modal"
                                  role="dialog"
                                  aria-modal="true"
                                  aria-labelledby="online-directory-clear-filter-modal-title"
                                  aria-describedby="online-directory-clear-filter-modal-desc"
                                  data-testid="online-directory-clear-filter-modal"
                                  data-hidden-peers-count={directoryQuickFilterMeta.hiddenPeersCount}
                                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                  transition={{ duration: 0.16, ease: 'easeOut' }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full max-w-md rounded-xl bg-[#0A0A0C] border border-zinc-800 shadow-2xl p-5 space-y-4 text-left"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-300 shrink-0">
                                        <Filter className="w-4 h-4" />
                                      </span>
                                      <div>
                                        <h4
                                          id="online-directory-clear-filter-modal-title"
                                          data-testid="clear-filter-modal-title"
                                          className="text-sm font-bold text-white"
                                        >
                                          {directoryQuickFilterMeta.clearModalMeta.modalTitle}
                                        </h4>
                                        <p className="text-[11px] font-mono text-zinc-400">
                                          Prevent accidental directory shifts
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setIsClearFilterModalOpen(false)}
                                      aria-label="Close Clear Filter modal"
                                      data-testid="clear-filter-modal-close-btn"
                                      className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div
                                    id="online-directory-clear-filter-hidden-count"
                                    data-testid="clear-filter-modal-hidden-count"
                                    data-hidden-count={directoryQuickFilterMeta.hiddenPeersCount}
                                    className="p-3.5 rounded-lg bg-[#050505] border border-amber-500/30 space-y-2.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-amber-300">
                                        Currently Hidden Peers
                                      </span>
                                      <span
                                        data-testid="clear-filter-modal-hidden-badge"
                                        className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-xs font-mono font-bold text-amber-200"
                                      >
                                        {directoryQuickFilterMeta.hiddenPeersCount} hidden
                                      </span>
                                    </div>
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                      {directoryQuickFilterMeta.clearModalMeta.hiddenPeersSummaryText}
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                                      <div className="p-2 rounded bg-zinc-900/90 border border-zinc-800">
                                        <div className="text-[10px] font-mono text-zinc-400">
                                          Showing Now
                                        </div>
                                        <div
                                          data-testid="clear-filter-modal-visible-count"
                                          className="text-sm font-bold text-emerald-300 font-mono"
                                        >
                                          {directoryQuickFilterMeta.myConnectionsCount}
                                        </div>
                                      </div>
                                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30">
                                        <div className="text-[10px] font-mono text-amber-300">
                                          Hidden Peers
                                        </div>
                                        <div
                                          data-testid="clear-filter-modal-hidden-metric"
                                          className="text-sm font-bold text-amber-200 font-mono"
                                        >
                                          {directoryQuickFilterMeta.hiddenPeersCount}
                                        </div>
                                      </div>
                                      <div className="p-2 rounded bg-zinc-900/90 border border-zinc-800">
                                        <div className="text-[10px] font-mono text-zinc-400">
                                          After Reset
                                        </div>
                                        <div
                                          data-testid="clear-filter-modal-total-count"
                                          className="text-sm font-bold text-white font-mono"
                                        >
                                          {directoryQuickFilterMeta.everyoneCount}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <p
                                    id="online-directory-clear-filter-modal-desc"
                                    data-testid="clear-filter-modal-description"
                                    className="text-xs text-zinc-400 leading-relaxed"
                                  >
                                    {directoryQuickFilterMeta.clearModalMeta.modalDescription}
                                  </p>

                                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
                                    <button
                                      id="online-directory-cancel-reset-btn"
                                      type="button"
                                      onClick={() => setIsClearFilterModalOpen(false)}
                                      data-testid="online-directory-cancel-reset-btn"
                                      className="px-3.5 py-2 text-xs font-semibold rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-colors whitespace-nowrap"
                                    >
                                      {directoryQuickFilterMeta.clearModalMeta.cancelActionLabel}
                                    </button>
                                    <button
                                      id="online-directory-confirm-reset-btn"
                                      type="button"
                                      onClick={() => {
                                        const reset = confirmOnlineDirectoryClearFilterReset();
                                        setDirectoryAudienceFilter(reset.nextMode);
                                        setIsClearFilterModalOpen(reset.isModalOpen);
                                        handlePlayDirectoryFilterToggleChime(
                                          'my_connections',
                                          reset.nextMode
                                        );
                                      }}
                                      data-testid="online-directory-confirm-reset-btn"
                                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-white hover:bg-zinc-200 text-black transition-colors whitespace-nowrap"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        {directoryQuickFilterMeta.clearModalMeta.confirmActionLabel}
                                      </span>
                                    </button>
                                  </div>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <span
                            data-testid="online-directory-quick-filter-hint"
                            className={`text-[11px] font-mono whitespace-nowrap ${
                              directoryQuickFilterMeta.isMyConnectionsOnly
                                ? 'text-emerald-300'
                                : 'text-zinc-400'
                            }`}
                          >
                            {directoryQuickFilterMeta.tooltipTitle}
                          </span>

                          <div
                            id="online-directory-quick-filter-tooltip"
                            role="tooltip"
                            data-testid="online-directory-quick-filter-tooltip"
                            data-filter-mode={directoryQuickFilterMeta.mode}
                            data-visible={isQuickFilterHovered ? 'true' : 'false'}
                            className={`pointer-events-none absolute bottom-full left-0 mb-2 z-30 w-72 p-2.5 rounded-md bg-[#050505] border border-zinc-700/90 shadow-xl space-y-1 text-left transition-opacity duration-150 ${
                              isQuickFilterHovered
                                ? 'opacity-100 visible'
                                : 'opacity-0 invisible'
                            }`}
                          >
                            <div
                              data-testid="online-directory-quick-filter-tooltip-title"
                              className={`text-xs font-semibold flex items-center gap-1.5 ${
                                directoryQuickFilterMeta.isMyConnectionsOnly
                                  ? 'text-emerald-300'
                                  : 'text-white'
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  directoryQuickFilterMeta.isMyConnectionsOnly
                                    ? 'bg-emerald-400'
                                    : 'bg-zinc-400'
                                }`}
                              />
                              <span>{directoryQuickFilterMeta.tooltipTitle}</span>
                            </div>
                            <p
                              data-testid="online-directory-quick-filter-tooltip-detail"
                              className="text-[11px] text-zinc-400 leading-snug"
                            >
                              {directoryQuickFilterMeta.tooltipDetail}
                            </p>
                            <div
                              data-testid="online-directory-quick-filter-tooltip-share-info"
                              className="pt-1 mt-1 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-[10px] font-mono text-zinc-400"
                            >
                              <span className="truncate">
                                {directoryQuickFilterMeta.shareLinkMeta.isCopied
                                  ? `Copied: ${directoryQuickFilterMeta.shareLinkMeta.summaryLabel}`
                                  : `Share: ${directoryQuickFilterMeta.shareLinkMeta.summaryLabel}`}
                              </span>
                              <span className="text-emerald-300 shrink-0">
                                {directoryQuickFilterMeta.shareLinkMeta.isCopied
                                  ? 'Copied!'
                                  : 'Click icon'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          id="online-directory-mood-category-filter"
                          role="group"
                          aria-label="Filter online peers by Mood category (Productive, Social, Away)"
                          data-testid="online-directory-mood-category-groups"
                          className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#050505] border border-zinc-800 rounded-md"
                        >
                          <button
                            type="button"
                            onClick={() => setDirectoryMoodFilter('all')}
                            aria-pressed={directoryMoodFilter === 'all'}
                            data-testid="mood-category-filter-all"
                            className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                              directoryMoodFilter === 'all'
                                ? 'bg-white text-black'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            All Moods ({onlinePeers.length})
                          </button>
                          {directoryMoodSummary.groupedPresets.map((group, catIdx) => {
                            const headerMotion = getMoodCategoryExpansionMotionSpec(
                              isMoodCategoriesExpanded
                            ).getCategoryHeaderMotion(catIdx);
                            const isCatActive =
                              directoryMoodFilter === group.categoryFilterValue ||
                              directoryMoodFilter.toLowerCase() ===
                                group.category.toLowerCase();
                            return (
                              <motion.button
                                key={group.category}
                                type="button"
                                initial={headerMotion.initial}
                                animate={headerMotion.animate}
                                transition={headerMotion.transition}
                                onClick={() =>
                                  setDirectoryMoodFilter(
                                    isCatActive ? 'all' : group.categoryFilterValue
                                  )
                                }
                                aria-pressed={isCatActive}
                                title={`${group.label}: ${group.presets
                                  .map((p) => p.label)
                                  .join(', ')} — ${group.description}`}
                                data-testid={`mood-category-filter-${group.category.toLowerCase()}`}
                                data-mood-category={group.category}
                                data-category-count={group.activeCount}
                                data-stagger-delay={headerMotion.transition.delay}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                                  isCatActive
                                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/60'
                                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                                }`}
                              >
                                <span>{group.label}</span>
                                <span className="font-mono text-[10px] opacity-80">
                                  ({group.activeCount})
                                </span>
                              </motion.button>
                            );
                          })}
                          <button
                            id="online-directory-mood-category-expand-toggle"
                            type="button"
                            onClick={() =>
                              setIsMoodCategoriesExpanded((prev) =>
                                toggleMoodCategoryDrawerExpanded(prev)
                              )
                            }
                            aria-expanded={isMoodCategoriesExpanded}
                            aria-controls="online-directory-mood-category-drawer"
                            data-testid="online-directory-mood-category-expand-btn"
                            title={
                              isMoodCategoriesExpanded
                                ? 'Collapse Mood category preset groupings'
                                : 'Expand Mood category preset groupings'
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors whitespace-nowrap shrink-0"
                          >
                            {isMoodCategoriesExpanded ? (
                              <ChevronUp className="w-3 h-3 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 shrink-0" />
                            )}
                            <span>{isMoodCategoriesExpanded ? 'Presets' : 'Expand Presets'}</span>
                          </button>
                        </div>

                        <select
                          id="online-directory-mood-select"
                          aria-label="Filter online peers by Mood indicator or category"
                          data-testid="online-directory-mood-filter"
                          value={directoryMoodFilter}
                          onChange={(e) => setDirectoryMoodFilter(e.target.value)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-[#050505] border border-zinc-800 rounded-md text-zinc-200 focus:outline-none focus:border-zinc-500"
                        >
                          <option value="all">All Moods ({onlinePeers.length})</option>
                          {moodPresetSearchResult.filteredGroups.map((group) => (
                            <optgroup
                              key={group.category}
                              label={`${group.label} (${group.activeCount})`}
                              data-testid={`mood-filter-optgroup-${group.category.toLowerCase()}`}
                            >
                              <option value={group.categoryFilterValue}>
                                All {group.label} Moods ({group.activeCount})
                              </option>
                              {group.presets.map((preset) => (
                                <option key={preset.id} value={preset.label}>
                                  {group.label} · {preset.label} (
                                  {directoryMoodSummary.countsByMood[preset.label] || 0})
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        {lastFocusDeskChime && (
                          <span
                            data-testid="quick-focus-desk-chime-status"
                            data-chime-type={lastFocusDeskChime}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-mono ${
                              lastFocusDeskChime === 'start'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                            }`}
                          >
                            <Volume2 className="w-3 h-3 shrink-0" />
                            <span>
                              {lastFocusDeskChime === 'start'
                                ? 'Start Chime (C5→E5)'
                                : 'End Chime (E5→B4)'}
                            </span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleToggleQuickFocusDesk}
                          aria-pressed={myFocusStatus.isInFocus}
                          data-testid="hub-quick-focus-desk-toggle"
                          data-last-chime={lastFocusDeskChime || 'none'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            myFocusStatus.isInFocus
                              ? 'bg-[#050505] border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
                              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {myFocusStatus.isInFocus
                              ? 'Leave Focus Desk'
                              : 'Set Status: In Focus'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <AnimatePresence initial={true}>
                      {isMoodCategoriesExpanded && (
                        <motion.div
                          key="online-directory-mood-category-drawer"
                          id="online-directory-mood-category-drawer"
                          data-testid="online-directory-mood-category-drawer"
                          data-stagger-children={
                            getMoodCategoryExpansionMotionSpec(true).staggerChildrenSec
                          }
                          data-search-query={moodPresetSearchResult.normalizedQuery}
                          data-matching-presets-count={
                            moodPresetSearchResult.totalMatchingPresets
                          }
                          initial={getMoodCategoryExpansionMotionSpec(true).containerInitial}
                          animate={getMoodCategoryExpansionMotionSpec(true).containerAnimate}
                          exit={getMoodCategoryExpansionMotionSpec(true).containerExit}
                          transition={
                            getMoodCategoryExpansionMotionSpec(true).containerTransition
                          }
                          className="space-y-2.5 pt-1"
                        >
                          {/* Search Input Field at the Top of #online-directory-mood-filter Category Groupings */}
                          <div
                            id="online-directory-mood-preset-search-bar"
                            data-testid="online-directory-mood-preset-search-bar"
                            className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-md bg-[#050505] border border-zinc-800/90"
                          >
                            <div className="relative flex-1 min-w-[220px] flex items-center">
                              <Search
                                aria-hidden="true"
                                className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none shrink-0"
                              />
                              <input
                                id="online-directory-mood-preset-search-input"
                                type="text"
                                role="searchbox"
                                value={moodPresetSearchQuery}
                                onChange={(e) => setMoodPresetSearchQuery(e.target.value)}
                                placeholder={moodPresetSearchResult.inputPlaceholder}
                                aria-label={moodPresetSearchResult.inputAriaLabel}
                                data-testid="online-directory-mood-preset-search-input"
                                className="w-full pl-8 pr-8 py-1.5 text-xs bg-zinc-950/90 border border-zinc-800 rounded text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/70 transition-colors"
                              />
                              {moodPresetSearchResult.hasActiveQuery && (
                                <button
                                  type="button"
                                  onClick={() => setMoodPresetSearchQuery('')}
                                  aria-label="Clear mood preset search"
                                  data-testid="online-directory-mood-preset-search-clear"
                                  className="absolute right-2 p-0.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                >
                                  <X className="w-3 h-3 shrink-0" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 shrink-0">
                              <span
                                data-testid="online-directory-mood-preset-search-count"
                                className={`px-2 py-0.5 rounded border tabular-nums ${
                                  moodPresetSearchResult.hasActiveQuery
                                    ? moodPresetSearchResult.hasMatches
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                                }`}
                              >
                                {moodPresetSearchResult.shortMatchBadgeLabel}
                              </span>
                            </div>
                          </div>

                          {!moodPresetSearchResult.hasMatches ? (
                            <div
                              data-testid="online-directory-mood-preset-search-empty"
                              className="p-3 rounded-md bg-[#050505] border border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400"
                            >
                              <span>{moodPresetSearchResult.statusLabel}</span>
                              <button
                                type="button"
                                onClick={() => setMoodPresetSearchQuery('')}
                                data-testid="online-directory-mood-preset-search-reset-btn"
                                className="px-2.5 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded transition-colors whitespace-nowrap shrink-0"
                              >
                                Clear Search
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`grid grid-cols-1 ${
                                moodPresetSearchResult.filteredGroups.length === 1
                                  ? 'sm:grid-cols-1'
                                  : moodPresetSearchResult.filteredGroups.length === 2
                                  ? 'sm:grid-cols-2'
                                  : 'sm:grid-cols-3'
                              } gap-2`}
                            >
                              {moodPresetSearchResult.filteredGroups.map((group, catIdx) => {
                                const headerMotion =
                                  getMoodCategoryExpansionMotionSpec(true).getCategoryHeaderMotion(
                                    catIdx
                                  );
                                const isCatActive =
                                  directoryMoodFilter === group.categoryFilterValue ||
                                  directoryMoodFilter.toLowerCase() ===
                                    group.category.toLowerCase();
                                return (
                                  <motion.div
                                    key={group.category}
                                    initial={headerMotion.initial}
                                    animate={headerMotion.animate}
                                    exit={headerMotion.exit}
                                    transition={headerMotion.transition}
                                    data-testid={`mood-category-drawer-group-${group.category.toLowerCase()}`}
                                    data-mood-category={group.category}
                                    data-stagger-delay={headerMotion.transition.delay}
                                    className="p-2.5 rounded-md bg-[#050505] border border-zinc-800/80 space-y-2"
                                  >
                                    <motion.button
                                      type="button"
                                      initial={headerMotion.initial}
                                      animate={headerMotion.animate}
                                      exit={headerMotion.exit}
                                      transition={headerMotion.transition}
                                      onClick={() =>
                                        setDirectoryMoodFilter(
                                          isCatActive ? 'all' : group.categoryFilterValue
                                        )
                                      }
                                      aria-pressed={isCatActive}
                                      data-testid={`mood-category-header-${group.category.toLowerCase()}`}
                                      data-stagger-delay={headerMotion.transition.delay}
                                      className={`w-full flex items-center justify-between gap-2 text-left text-xs font-semibold transition-colors ${
                                        isCatActive
                                          ? 'text-emerald-300'
                                          : 'text-zinc-200 hover:text-white'
                                      }`}
                                    >
                                      <span>{group.label}</span>
                                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                        {group.activeCount} online
                                      </span>
                                    </motion.button>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {group.presets.map((preset, presetIdx) => {
                                        const presetMotion =
                                          getMoodCategoryExpansionMotionSpec(
                                            true
                                          ).getPresetItemMotion(catIdx, presetIdx);
                                        const isPresetActive =
                                          directoryMoodFilter.toLowerCase() ===
                                          preset.label.toLowerCase();
                                        const presetCount =
                                          directoryMoodSummary.countsByMood[preset.label] || 0;
                                        const tooltipMeta = getMoodPresetTooltipMeta(
                                          preset.id,
                                          hoveredCategoryDrawerPresetId === preset.id
                                        );
                                        const presetUsage24h =
                                          moodPresetUsage24hById[preset.id] ||
                                          getMoodPresetUsageCount24hMeta({
                                            presetIdOrLabel: preset.id,
                                            onlinePeers,
                                            moodEvents,
                                            currentUid: currentIdentity.uid,
                                            currentUserMood: userMood,
                                          });
                                        return (
                                          <div
                                            key={preset.id}
                                            data-testid={`mood-category-preset-wrapper-${preset.id}`}
                                            className="relative inline-flex items-center group"
                                            onMouseEnter={() =>
                                              setHoveredCategoryDrawerPresetId(preset.id)
                                            }
                                            onMouseLeave={() =>
                                              setHoveredCategoryDrawerPresetId((prev) =>
                                                prev === preset.id ? null : prev
                                              )
                                            }
                                          >
                                            <motion.button
                                              type="button"
                                              initial={presetMotion.initial}
                                              animate={presetMotion.animate}
                                              exit={presetMotion.exit}
                                              transition={presetMotion.transition}
                                              onClick={() =>
                                                setDirectoryMoodFilter(
                                                  isPresetActive ? 'all' : preset.label
                                                )
                                              }
                                              onFocus={() =>
                                                setHoveredCategoryDrawerPresetId(preset.id)
                                              }
                                              onBlur={() =>
                                                setHoveredCategoryDrawerPresetId((prev) =>
                                                  prev === preset.id ? null : prev
                                                )
                                              }
                                              aria-pressed={isPresetActive}
                                              aria-describedby={tooltipMeta.tooltipId}
                                              title={`${tooltipMeta.fullDefinitionText} · ${presetUsage24h.usageSummaryText}`}
                                              data-testid={`mood-category-preset-${preset.id}`}
                                              data-mood-category={group.category}
                                              data-mood-definition={tooltipMeta.definition}
                                              data-usage-count-24h={presetUsage24h.usageCount24h}
                                              data-tooltip-visible={
                                                tooltipMeta.isVisible ? 'true' : 'false'
                                              }
                                              data-stagger-delay={presetMotion.transition.delay}
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                                                isPresetActive
                                                  ? 'bg-white text-black border-white'
                                                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                                              }`}
                                            >
                                              <span>{preset.label}</span>
                                              <span className="font-mono text-[10px] opacity-75">
                                                ({presetCount})
                                              </span>
                                              <span
                                                data-testid={`mood-category-preset-usage-count-${preset.id}`}
                                                data-usage-count-24h={presetUsage24h.usageCount24h}
                                                className={`px-1 py-0.2 rounded text-[9px] font-mono tabular-nums border ${
                                                  isPresetActive
                                                    ? 'bg-black/10 text-zinc-900 border-black/25'
                                                    : presetUsage24h.hasRecentActivity
                                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                                                }`}
                                              >
                                                {presetUsage24h.usageBadgeLabel}
                                              </span>
                                              <span
                                                data-testid={`mood-category-preset-info-${preset.id}`}
                                                data-icon-component={tooltipMeta.iconComponent}
                                                aria-label={tooltipMeta.iconAriaLabel}
                                                role="img"
                                                className={`inline-flex items-center justify-center ml-0.5 transition-colors ${
                                                  isPresetActive
                                                    ? 'text-zinc-700'
                                                    : 'text-zinc-400 group-hover:text-emerald-300'
                                                }`}
                                              >
                                                <Info
                                                  aria-hidden="true"
                                                  data-testid={`mood-category-preset-info-svg-${preset.id}`}
                                                  className="w-3 h-3 shrink-0"
                                                />
                                              </span>
                                            </motion.button>

                                            <div
                                              id={tooltipMeta.tooltipId}
                                              role="tooltip"
                                              data-testid={tooltipMeta.tooltipId}
                                              data-mood-preset={preset.id}
                                              data-mood-category={tooltipMeta.category}
                                              data-mood-definition={tooltipMeta.definition}
                                              data-usage-count-24h={presetUsage24h.usageCount24h}
                                              data-visible={tooltipMeta.isVisible ? 'true' : 'false'}
                                              className={`pointer-events-none absolute bottom-full left-0 mb-2 z-30 w-64 p-2.5 rounded-md bg-[#050505] border border-zinc-700/90 shadow-xl space-y-1 text-left transition-opacity duration-150 ${
                                                tooltipMeta.isVisible
                                                  ? 'opacity-100 visible'
                                                  : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                                              }`}
                                            >
                                              <div
                                                data-testid={`mood-category-preset-tooltip-title-${preset.id}`}
                                                className="flex items-center justify-between gap-1.5 text-xs font-semibold text-white"
                                              >
                                                <span className="inline-flex items-center gap-1.5">
                                                  <Info
                                                    aria-hidden="true"
                                                    className="w-3.5 h-3.5 shrink-0 text-emerald-400"
                                                  />
                                                  <span>{tooltipMeta.label}</span>
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                                                  {tooltipMeta.category}
                                                </span>
                                              </div>
                                              <p
                                                data-testid={`mood-category-preset-tooltip-definition-${preset.id}`}
                                                className="text-[11px] text-zinc-300 leading-snug"
                                              >
                                                {tooltipMeta.definition}
                                              </p>
                                              <div
                                                data-testid={`mood-category-preset-tooltip-usage-${preset.id}`}
                                                className="pt-1 border-t border-zinc-800/80 text-[10px] font-mono text-emerald-300"
                                              >
                                                {presetUsage24h.usageSummaryText}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-3">
                    {displayedOnlinePeers.map((peer) => {
                      const isMe = peer.uid === currentIdentity.uid;
                      const focusStatus =
                        directoryFocusSummary.byUid[peer.uid] ||
                        getOnlinePeerFocusStatus(peer, studyDesks);
                      const peerMoodMeta =
                        directoryMoodSummary.byUid[peer.uid] ||
                        getOnlinePeerMoodMeta(isMe ? peer.mood ?? userMood : peer.mood);
                      const existingReq = requests.find(
                        (r) =>
                          (r.fromUid === currentIdentity.uid && r.toUid === peer.uid) ||
                          (r.fromUid === peer.uid && r.toUid === currentIdentity.uid)
                      );
                      const peerDmShortcut = resolveOnlineDirectoryPeerDmShortcut({
                        currentUid: currentIdentity.uid,
                        peerUid: peer.uid,
                        peerDisplayName: peer.displayName,
                        connectionStatusMap: connectionRequestStatusMap,
                      });

                      return (
                        <div
                          key={peer.uid}
                          data-testid={`online-directory-peer-row-${peer.uid}`}
                          data-connection-status={peerDmShortcut.status}
                          className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                <span className="text-sm font-bold text-white truncate">
                                  {peer.displayName} {isMe ? '(You — Online)' : ''}
                                </span>

                                {peerDmShortcut.isAcceptedConnection && (
                                  <span
                                    data-testid={`online-directory-connected-badge-${peer.uid}`}
                                    className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-400 whitespace-nowrap shrink-0"
                                  >
                                    <Check className="w-3 h-3 shrink-0" />
                                    <span>{peerDmShortcut.connectionBadgeLabel}</span>
                                  </span>
                                )}

                                {focusStatus.isInFocus && (
                                  <span
                                    data-testid="online-peer-in-focus-indicator"
                                    data-peer-uid={peer.uid}
                                    title={`Currently productive in Study Room (${focusStatus.statusDetail})`}
                                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 whitespace-nowrap shrink-0"
                                  >
                                    <span
                                      aria-hidden="true"
                                      className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                                    />
                                    <BookOpen className="w-3 h-3 shrink-0" />
                                    <span>In Focus</span>
                                  </span>
                                )}

                                {peerMoodMeta.hasMood && peerMoodMeta.label && (
                                  <span
                                    data-testid="online-peer-mood-indicator"
                                    data-peer-uid={peer.uid}
                                    data-peer-mood={peerMoodMeta.label}
                                    title={peerMoodMeta.description}
                                    className={`inline-flex items-center gap-1 text-xs font-mono font-semibold whitespace-nowrap shrink-0 ${
                                      peerMoodMeta.tone === 'emerald'
                                        ? 'text-emerald-400'
                                        : peerMoodMeta.tone === 'amber'
                                        ? 'text-amber-400'
                                        : peerMoodMeta.tone === 'violet'
                                        ? 'text-violet-400'
                                        : peerMoodMeta.tone === 'sky'
                                        ? 'text-sky-400'
                                        : 'text-zinc-300'
                                    }`}
                                  >
                                    <span>Mood: {peerMoodMeta.label}</span>
                                  </span>
                                )}

                                <span className="text-xs text-zinc-400 font-mono capitalize whitespace-nowrap">
                                  Mode: {peer.currentMode.replace('_', ' ')}
                                </span>
                              </div>

                              <p className="text-xs text-zinc-400 truncate">{peer.bio}</p>
                            </div>

                            {focusStatus.isInFocus && focusStatus.roomCode && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (focusStatus.roomCode) {
                                    setActiveStudyRoomCode(focusStatus.roomCode);
                                  }
                                  setActivePage('study');
                                }}
                                data-testid={`join-study-room-btn-${peer.uid}`}
                                className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 rounded whitespace-nowrap shrink-0"
                              >
                                {isMe ? 'Open Study Room' : 'Study Together'}
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-900">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 font-mono tabular-nums">
                              <span>Streak: {peer.streakCount}d</span>
                              <span aria-hidden="true">·</span>
                              <span>Participation: {peer.participationPoints} pts</span>
                              {focusStatus.isInFocus && focusStatus.statusDetail && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span
                                    className="text-emerald-400/90"
                                    data-testid="online-peer-focus-room-detail"
                                  >
                                    Room: {focusStatus.statusDetail}
                                  </span>
                                </>
                              )}
                            </div>

                            {!isMe && (
                              <div className="flex items-center gap-2 shrink-0">
                                {peerDmShortcut.showDirectMessageShortcut ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveChatPeerUid(peer.uid);
                                      setActivePage('chat');
                                    }}
                                    aria-label={peerDmShortcut.shortcutAriaLabel}
                                    data-testid={`online-directory-dm-shortcut-${peer.uid}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded transition-colors whitespace-nowrap shrink-0"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                    <span>{peerDmShortcut.shortcutLabel}</span>
                                  </button>
                                ) : !existingReq && peerDmShortcut.status === 'none' ? (
                                  <>
                                    <input
                                      type="text"
                                      value={requestNoteMap[peer.uid] || ''}
                                      onChange={(e) =>
                                        setRequestNoteMap((prev) => ({
                                          ...prev,
                                          [peer.uid]: e.target.value,
                                        }))
                                      }
                                      placeholder="Add a note..."
                                      aria-label={`Request note for ${peer.displayName}`}
                                      className="px-2.5 py-1 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white placeholder:text-zinc-600 w-32"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSendRequest(peer)}
                                      className="px-3 py-1 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                                    >
                                      Send Request
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-xs text-amber-400 font-mono">
                                    Request {existingReq?.status || peerDmShortcut.status}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {(showOnlyInFocusPeers ||
                      directoryMoodFilter !== 'all' ||
                      directoryAudienceFilter === 'my_connections') &&
                      displayedOnlinePeers.length === 0 && (
                        <div
                          className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-3"
                          data-testid="online-directory-empty-focus"
                        >
                          <span>
                            {directoryAudienceFilter === 'my_connections'
                              ? 'None of your accepted connections are currently online matching the active filters.'
                              : directoryMoodFilter !== 'all'
                                ? `No online users currently have their Mood set to "${directoryMoodFilter}".`
                                : 'No online users are currently in a Study Room. Start a Focus Desk to let others see you are productive!'}
                          </span>
                          <div className="flex items-center gap-2">
                            {directoryAudienceFilter === 'my_connections' && (
                              <button
                                type="button"
                                onClick={() => setDirectoryAudienceFilter('everyone')}
                                data-testid="online-directory-reset-audience-filter-btn"
                                className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                              >
                                Show Everyone
                              </button>
                            )}
                            {directoryMoodFilter !== 'all' && (
                              <button
                                type="button"
                                onClick={() => setDirectoryMoodFilter('all')}
                                className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded whitespace-nowrap shrink-0"
                              >
                                Show All Moods
                              </button>
                            )}
                            {showOnlyInFocusPeers && (
                              <button
                                type="button"
                                onClick={handleToggleQuickFocusDesk}
                                className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                              >
                                Set Status: In Focus
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                    {otherOnlinePeers.length === 0 && (
                      <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 text-xs text-zinc-400">
                        Open this app link in another browser window or share your Study Room invite link with friends to see live multi-user presence and exchange real-time requests.
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Requests Box (5 cols) */}
                <div className="lg:col-span-5 p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4">
                  <div className="border-b border-zinc-800/80 pb-3 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-white">
                          Connection Requests ({requests.length})
                        </h2>
                        <button
                          type="button"
                          onClick={handleToggleUiSoundEffects}
                          aria-pressed={uiSoundPrefs.enabled}
                          data-testid="hub-ui-sound-toggle"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            uiSoundPrefs.enabled
                              ? 'bg-[#050505] border-zinc-700 text-emerald-400 hover:border-zinc-500'
                              : 'bg-[#050505] border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {uiSoundPrefs.enabled ? (
                            <Volume2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <VolumeX className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{uiSoundPrefs.enabled ? 'Chime: On' : 'Chime: Muted'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Accept incoming requests to unlock Chat Mode and Talking Mode.
                      </p>
                    </div>

                    {/* Subtle UI Sound Effect Bar for Background & Live Feedback */}
                    <div
                      className="p-2.5 rounded-md bg-[#050505] border border-zinc-800/80 space-y-2 text-[11px]"
                      data-testid="hub-sound-feedback-panel"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-zinc-300 font-mono"
                          data-testid="ui-sound-feedback-status"
                        >
                          {lastSoundFeedback}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePreviewUiChime('incoming_message')}
                          data-testid="preview-message-chime-btn"
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium whitespace-nowrap"
                        >
                          Test Message Chime
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePreviewUiChime('connection_request')}
                          data-testid="preview-request-chime-btn"
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium whitespace-nowrap"
                        >
                          Test Request Chime
                        </button>
                      </div>
                    </div>
                  </div>

                  {requests.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-6">
                      No pending or accepted requests yet. Send a request to any online user on the left.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((req) => {
                        const isIncoming = req.toUid === currentIdentity.uid;
                        return (
                          <div
                            key={req.id}
                            className="p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white">
                                {isIncoming
                                  ? `From: ${req.fromName}`
                                  : `Sent to: ${req.toName}`}
                              </span>
                              <span className="text-zinc-400 uppercase font-mono">
                                {req.status}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300">"{req.note}"</p>
                            {isIncoming && req.status === 'pending' && (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleRespondRequest(req, 'accepted')}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                                >
                                  Accept Request
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondRequest(req, 'declined')}
                                  className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded whitespace-nowrap shrink-0"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 2: SIDEBAR CHAT MODE (STRICT INVITE-FIRST, ZERO RANDOM CHATS)
              ================================================================ */}
          {activePage === 'chat' && (
            <section className="space-y-6" aria-label="Real-Time Chat Mode">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Real-Time Chat Mode
                  </h1>
                  <p className="text-sm text-zinc-400">
                    Strict invite-first messaging: send a connection invite first; once accepted, real-time encrypted chat unlocks. No random chats.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleUiSoundEffects}
                    aria-pressed={uiSoundPrefs.enabled}
                    data-testid="chat-ui-sound-toggle"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      uiSoundPrefs.enabled
                        ? 'bg-[#0A0A0C] border-zinc-700 text-emerald-400 hover:border-zinc-500'
                        : 'bg-[#050505] border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {uiSoundPrefs.enabled ? (
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>
                      {uiSoundPrefs.enabled
                        ? 'Incoming Message Chime: On'
                        : 'Incoming Message Chime: Muted'}
                    </span>
                  </button>
                  <span className="text-xs font-mono text-zinc-400">
                    Fingerprint: {e2eeFingerprint}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4">
                  <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">
                      Accepted Connections ({acceptedConnections.length})
                    </h2>
                    <span className="text-xs font-mono text-emerald-400">Invite-Verified</span>
                  </div>

                  {acceptedConnections.length === 0 ? (
                    <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 space-y-3 text-xs text-zinc-400">
                      <div className="font-semibold text-white">
                        Invite Required Before Chatting
                      </div>
                      <p>
                        Random chats are strictly disabled. First send a connection invite to an online person and wait for them to accept.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActivePage('hub')}
                        className="w-full py-2 px-3 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
                      >
                        Browse Online Directory & Send Invite
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {acceptedConnections.map((conn) => {
                        const isOnline = acceptedOnlinePeers.some((p) => p.uid === conn.uid);
                        return (
                          <button
                            key={conn.uid}
                            type="button"
                            onClick={() => {
                              setActiveChatPeerUid(conn.uid);
                              setChatError('');
                            }}
                            className={`w-full text-left p-3 rounded-md border transition-colors ${
                              activeChatPeerUid === conn.uid
                                ? 'bg-white text-black border-white'
                                : 'bg-[#050505] border-zinc-800/80 text-zinc-300 hover:text-white'
                            }`}
                          >
                            <div className="text-sm font-semibold">{conn.displayName}</div>
                            <div
                              className={`text-xs font-mono ${
                                activeChatPeerUid === conn.uid
                                  ? 'text-zinc-800'
                                  : isOnline
                                  ? 'text-emerald-400'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {isOnline ? 'Invite Accepted · Online now' : 'Invite Accepted'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {otherOnlinePeers.filter((p) => !acceptedPeerUids.has(p.uid)).length > 0 && (
                    <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                      <div className="text-xs font-semibold text-zinc-300">
                        Online Users (Send Invite to Unlock Chat)
                      </div>
                      {otherOnlinePeers
                        .filter((p) => !acceptedPeerUids.has(p.uid))
                        .map((peer) => {
                          const pendingReq = requests.find(
                            (r) =>
                              (r.fromUid === currentIdentity.uid && r.toUid === peer.uid) ||
                              (r.fromUid === peer.uid && r.toUid === currentIdentity.uid)
                          );
                          return (
                            <div
                              key={peer.uid}
                              className="p-2.5 rounded bg-[#050505] border border-zinc-800/80 flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-zinc-200 truncate font-medium">
                                {peer.displayName}
                              </span>
                              {pendingReq ? (
                                <span className="font-mono text-amber-400">
                                  {pendingReq.status}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSendRequest(peer)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-white text-black rounded whitespace-nowrap shrink-0"
                                >
                                  Send Invite
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-8 p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] flex flex-col h-[520px] justify-between">
                  <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
                    <div className="text-sm font-bold text-white">
                      {activeChatPeerUid && acceptedPeerUids.has(activeChatPeerUid)
                        ? `Encrypted Direct Channel (${
                            acceptedConnections.find((c) => c.uid === activeChatPeerUid)
                              ?.displayName || 'Connected Peer'
                          })`
                        : 'Invite-Locked Channel (Select Accepted Connection)'}
                    </div>
                    <span className="text-xs text-zinc-400 font-mono tabular-nums">
                      {
                        messages.filter(
                          (m) =>
                            (m.senderUid === currentIdentity.uid &&
                              m.receiverUid === activeChatPeerUid) ||
                            (m.senderUid === activeChatPeerUid &&
                              m.receiverUid === currentIdentity.uid)
                        ).length
                      }{' '}
                      messages
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {!activeChatPeerUid || !acceptedPeerUids.has(activeChatPeerUid) ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-xs text-zinc-400 space-y-2 px-4">
                        <p className="text-white font-semibold text-sm">
                          Direct Chat Requires an Accepted Invite
                        </p>
                        <p className="max-w-md">
                          To protect privacy and prevent unsolicited random chats, you can only message users after your connection invite has been accepted.
                        </p>
                      </div>
                    ) : messages.filter(
                        (m) =>
                          (m.senderUid === currentIdentity.uid &&
                            m.receiverUid === activeChatPeerUid) ||
                          (m.senderUid === activeChatPeerUid &&
                            m.receiverUid === currentIdentity.uid)
                      ).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-xs text-zinc-400 space-y-1">
                        <p className="text-white font-medium">Connection Invite Accepted</p>
                        <p>Send your first real-time message below.</p>
                      </div>
                    ) : (
                      messages
                        .filter(
                          (m) =>
                            (m.senderUid === currentIdentity.uid &&
                              m.receiverUid === activeChatPeerUid) ||
                            (m.senderUid === activeChatPeerUid &&
                              m.receiverUid === currentIdentity.uid)
                        )
                        .map((msg) => {
                          const isMine = msg.senderUid === currentIdentity.uid;
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                            >
                              <div className="text-[11px] text-zinc-500 mb-1">
                                {msg.senderName}
                              </div>
                              <div
                                className={`px-4 py-2.5 rounded-md max-w-md text-sm ${
                                  isMine
                                    ? 'bg-white text-black font-medium'
                                    : 'bg-[#050505] border border-zinc-800 text-zinc-100'
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  <form onSubmit={handleSendDirectMessage} className="pt-3 border-t border-zinc-800/80 space-y-2">
                    {chatError && <p className="text-xs text-rose-400">{chatError}</p>}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessageInput}
                        onChange={(e) => setChatMessageInput(e.target.value)}
                        placeholder={
                          activeChatPeerUid && acceptedPeerUids.has(activeChatPeerUid)
                            ? 'Write a real-time message to your connection...'
                            : 'Accept or select a connection invite first to chat...'
                        }
                        aria-label="Direct chat message input"
                        className="flex-1 px-4 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
                      >
                        Send Message
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 3: SIDEBAR TALKING MODE (VOICE & VIDEO CALLS)
              ================================================================ */}
          {activePage === 'talk' && (
            <TalkingRoomView
              currentUid={currentIdentity.uid}
              currentName={currentIdentity.displayName}
              acceptedPeers={acceptedOnlinePeers}
              incomingSignal={incomingCallSignal}
              onSendSignal={(toUid, callType, signalData) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'webrtc:signal',
                      toUid,
                      fromName: currentIdentity.displayName,
                      callType,
                      signalData,
                    })
                  );
                }
              }}
              onClearIncomingSignal={() => setIncomingCallSignal(null)}
            />
          )}

          {/* ================================================================
              PAGE 4: SIDEBAR STUDY MODE & SHAREABLE STUDY ROOM
              ================================================================ */}
          {activePage === 'study' && (
            <StudyRoomView
              currentUid={currentIdentity.uid}
              currentName={currentIdentity.displayName}
              activeRoomCode={activeStudyRoomCode}
              onChangeRoomCode={(code) => {
                setActiveStudyRoomCode(code);
                const url = new URL(window.location.href);
                url.searchParams.set('room', code);
                window.history.replaceState({}, '', url.toString());
              }}
              studyDesks={studyDesks}
              studyNotes={studyNotes}
              studyChat={studyChat}
              onJoinDesk={(roomCode, roomName, subject, positiveNote, timerMinutes) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'study:join',
                      roomCode,
                      roomName,
                      displayName: currentIdentity.displayName,
                      subject,
                      positiveNote,
                      timerMinutes,
                    })
                  );
                }
                awardParticipation(15);
              }}
              onLeaveDesk={() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ type: 'study:leave' }));
                }
              }}
              onSaveStudyNote={async (roomCode, subject, positiveNote, focusMinutes) => {
                const noteId = `note_${Date.now()}_${currentIdentity.uid}`;
                const newNote: StudyNoteRecord = {
                  id: noteId,
                  authorUid: currentIdentity.uid,
                  authorName: currentIdentity.displayName,
                  roomCode,
                  subject,
                  positiveNote,
                  focusMinutes,
                };
                setStudyNotes((prev) => {
                  const next = [newNote, ...prev];
                  try {
                    localStorage.setItem('mr_stranger_study_notes_v1', JSON.stringify(next));
                  } catch {
                    // ignore
                  }
                  return next;
                });
                if (authUser) {
                  try {
                    await setDoc(doc(db, 'studyNotes', noteId), {
                      authorUid: newNote.authorUid,
                      authorName: newNote.authorName,
                      roomCode: newNote.roomCode,
                      subject: newNote.subject,
                      positiveNote: newNote.positiveNote,
                      focusMinutes: newNote.focusMinutes,
                      createdAt: serverTimestamp(),
                    });
                  } catch (err) {
                    handleFirestoreError(err, OperationType.CREATE, `studyNotes/${noteId}`);
                  }
                }
              }}
              onSendStudyChat={(roomCode, text) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'study:chat',
                      roomCode,
                      senderName: currentIdentity.displayName,
                      text,
                    })
                  );
                }
                awardParticipation(5);
              }}
              onFocusMinutesLogged={handleLogFocusMinutes}
              weeklyActivitySummary={weeklyActivitySummary}
              topicFocusSessions={topicFocusSessions}
              dailyTargetMinutes={dailyTargetMinutes}
              todayFocusMinutes={dailyCompletedMinutes}
              onLogTopicFocusSession={handleLogTopicFocusSession}
              onUpdateDailyTargetMinutes={(nextTarget) =>
                persistProductivityGoal(nextTarget, dailyCompletedMinutes)
              }
              uiSoundPrefs={uiSoundPrefs}
              onUpdateUiSoundPrefs={(nextPrefs) => {
                persistUiSoundPreferences(nextPrefs);
                setLastSoundFeedback(
                  nextPrefs.enabled
                    ? 'System & ambient sounds active'
                    : 'All system & ambient sounds muted from Study Room'
                );
              }}
            />
          )}

          {/* ================================================================
              PAGES 5, 6, 7: SIDEBAR MULTIPLAYER GAMES (SUBWAY, CATAPULT, BLOCKS)
              ================================================================ */}
          {(activePage === 'game_subway' ||
            activePage === 'game_catapult' ||
            activePage === 'game_blocks') && (
            <GameArcadeView
              selectedGame={
                activePage === 'game_subway'
                  ? 'subway'
                  : activePage === 'game_catapult'
                  ? 'catapult'
                  : 'blocks'
              }
              onSelectGame={(g) =>
                setActivePage(
                  g === 'subway'
                    ? 'game_subway'
                    : g === 'catapult'
                    ? 'game_catapult'
                    : 'game_blocks'
                )
              }
              currentUid={currentIdentity.uid}
              currentName={currentIdentity.displayName}
              multiplayerScores={gameScores}
              onBroadcastScore={(gameId, score, laneOrState) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'game:update',
                      gameId,
                      displayName: currentIdentity.displayName,
                      score,
                      laneOrState,
                    })
                  );
                }
              }}
              onParticipationEarned={awardParticipation}
            />
          )}

          {/* ================================================================
              PAGE 8: SEPARATED PHOTOS & SOCIAL MEDIA SYNC PAGE (TWITTER / X APP)
              ================================================================ */}
          {activePage === 'moments' && (
            <TwitterSocialSection
              currentIdentity={currentIdentity}
              moments={moments}
              momentComments={momentComments}
              commentsByMomentId={commentsByMomentId}
              momentFilter={momentFilter}
              setMomentFilter={setMomentFilter}
              momentCaption={momentCaption}
              setMomentCaption={setMomentCaption}
              momentPhotoDataUrl={momentPhotoDataUrl}
              setMomentPhotoDataUrl={setMomentPhotoDataUrl}
              selectedMomentPlaceholderId={selectedMomentPlaceholderId}
              setSelectedMomentPlaceholderId={setSelectedMomentPlaceholderId}
              momentVisibility={momentVisibility}
              setMomentVisibility={setMomentVisibility}
              momentError={momentError}
              handlePhotoFileSelect={handlePhotoFileSelect}
              handlePublishMoment={handlePublishMoment}
              handleDeleteMoment={handleDeleteMoment}
              handleShareMoment={handleShareMoment}
              copiedMomentShare={copiedMomentShare}
              setMomentLightbox={setMomentLightbox}
              acceptedPeerUids={acceptedPeerUids}
              momentCommentInputs={momentCommentInputs}
              setMomentCommentInputs={setMomentCommentInputs}
              momentReplyInputs={momentReplyInputs}
              setMomentReplyInputs={setMomentReplyInputs}
              activeReplyTargetByMoment={activeReplyTargetByMoment}
              setActiveReplyTargetByMoment={setActiveReplyTargetByMoment}
              collapsedCommentThreadIds={collapsedCommentThreadIds}
              setCollapsedCommentThreadIds={setCollapsedCommentThreadIds}
              momentCommentErrors={momentCommentErrors}
              setMomentCommentErrors={setMomentCommentErrors}
              commentClockNowMs={commentClockNowMs}
              handleAddMomentComment={handleAddMomentComment}
              handleDeleteMomentComment={handleDeleteMomentComment}
              onNavigateToHub={() => setActivePage('hub')}
              twitterLikes={twitterLikes}
              twitterRetweets={twitterRetweets}
              twitterBookmarks={twitterBookmarks}
              followedUids={followedUids}
              twitterChats={twitterChats}
              onToggleLike={handleToggleTwitterLike}
              onToggleRetweet={handleToggleTwitterRetweet}
              onToggleBookmark={handleToggleTwitterBookmark}
              onToggleFollow={handleToggleTwitterFollow}
              onSendTwitterChat={handleSendTwitterChat}
              onlinePeers={onlinePeers}
            />
          )}

          {/* ================================================================
              PAGE 9: ENHANCED PRIVACY & ZERO-TRUST SECURITY CENTER
              ================================================================ */}
          {activePage === 'privacy' && (
            <section className="space-y-6 max-w-3xl" aria-label="Privacy and Security Center">
              <div className="border-b border-zinc-800/80 pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Privacy & Zero-Trust Security Center
                </h1>
                <p className="text-sm text-zinc-400">
                  Control your live presence visibility, call permissions, rate-limiting shields, and isolated PII vault settings.
                </p>
              </div>

              {securityNotice && (
                <div className="p-4 rounded-md bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200">
                  {securityNotice}
                </div>
              )}

              <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-6">
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-white">
                    Online Presence & Directory Visibility
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Choose who can see you in the Online Directory and send you connection requests.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        {
                          id: 'everyone',
                          title: 'Everyone Online',
                          desc: 'Visible to all authenticated members',
                        },
                        {
                          id: 'connections_only',
                          title: 'Connections Only',
                          desc: 'Only accepted peers see your mode',
                        },
                        {
                          id: 'ghost',
                          title: 'Ghost Stealth Mode',
                          desc: 'Hidden from public online directory',
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          handleUpdatePrivacy(
                            opt.id,
                            currentIdentity.readReceiptsEnabled,
                            currentIdentity.allowCallsFromConnectionsOnly
                          )
                        }
                        className={`p-4 rounded-md border text-left transition-colors ${
                          currentIdentity.privacyVisibility === opt.id
                            ? 'bg-white text-black border-white'
                            : 'bg-[#050505] border-zinc-800/80 text-zinc-300 hover:border-zinc-600'
                        }`}
                      >
                        <div className="text-xs font-bold">{opt.title}</div>
                        <div
                          className={`text-[11px] mt-1 ${
                            currentIdentity.privacyVisibility === opt.id
                              ? 'text-zinc-800'
                              : 'text-zinc-500'
                          }`}
                        >
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                  <h2 className="text-base font-bold text-white">
                    Communication & WebRTC Call Guards
                  </h2>

                  <label className="flex items-center justify-between p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Restrict Voice & Video Calls to Accepted Connections Only
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Blocks unsolicited WebRTC signaling offers from non-connected accounts
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentIdentity.allowCallsFromConnectionsOnly}
                      onChange={(e) =>
                        handleUpdatePrivacy(
                          currentIdentity.privacyVisibility,
                          currentIdentity.readReceiptsEnabled,
                          e.target.checked
                        )
                      }
                      className="accent-white w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Send Message Delivery & Read Receipts
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Allow accepted connections to see when you read their messages
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentIdentity.readReceiptsEnabled}
                      onChange={(e) =>
                        handleUpdatePrivacy(
                          currentIdentity.privacyVisibility,
                          e.target.checked,
                          currentIdentity.allowCallsFromConnectionsOnly
                        )
                      }
                      className="accent-white w-4 h-4"
                    />
                  </label>
                </div>

                {/* UI Sound Effects & Background Notification Feedback Preferences */}
                <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-white">
                        Subtle UI Sound Effects & Background Feedback
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Configure acoustic chimes for incoming messages and connection requests when the workspace is in the background.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleUiSoundEffects}
                      aria-pressed={uiSoundPrefs.enabled}
                      className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        uiSoundPrefs.enabled
                          ? 'bg-white text-black border-white'
                          : 'bg-[#050505] text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {uiSoundPrefs.enabled ? 'Sound Alerts: Enabled' : 'Sound Alerts: Muted'}
                    </button>
                  </div>

                  <label className="flex items-center justify-between p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Incoming Message Chime (C5 → G5 Soft Fifth)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Plays a subtle harmonic chime when an accepted connection sends a message
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={uiSoundPrefs.incomingMessages}
                      onChange={(e) =>
                        persistUiSoundPreferences({
                          ...uiSoundPrefs,
                          incomingMessages: e.target.checked,
                        })
                      }
                      className="accent-white w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Connection Request Chime (A4 → E5 Warm Interval)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Plays a warm two-note chime when another online member sends a connection invite
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={uiSoundPrefs.connectionRequests}
                      onChange={(e) =>
                        persistUiSoundPreferences({
                          ...uiSoundPrefs,
                          connectionRequests: e.target.checked,
                        })
                      }
                      className="accent-white w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Background Tab Acoustic Boost
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Slightly extends chime sustain and clarity when the app tab is unfocused or in the background
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={uiSoundPrefs.backgroundBoost}
                      onChange={(e) =>
                        persistUiSoundPreferences({
                          ...uiSoundPrefs,
                          backgroundBoost: e.target.checked,
                        })
                      }
                      className="accent-white w-4 h-4"
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Lock className="w-4 h-4" />
                    <span>Isolated PII Vault & Zero-Trust Defense Matrix</span>
                  </div>
                  <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 text-xs font-mono text-zinc-300 space-y-1.5">
                    <div>Account UID: {currentIdentity.uid}</div>
                    <div>Isolated Email Vault: {currentIdentity.email} (Owner-Only Read)</div>
                    <div>E2EE Verification Fingerprint: {e2eeFingerprint}</div>
                    <div>Payload Firewall: SQLi / NoSQLi / XSS / Prototype-Pollution Blocked</div>
                    <div>Rate Limiter: 25 Auth/min · 120 API/min · 45 WS Frames/10s</div>
                    <div>Hardware Policy: Camera & Microphone Closed Until Explicit Permission + Join</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 10: DEDICATED SIGN-OUT PAGE (Requires Email ID, Password & Account Confirmation)
              ================================================================ */}
          {activePage === 'signout' && (
            <section className="max-w-xl mx-auto py-6" aria-label="Account Verification and Sign Out">
              <div className="p-8 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-6">
                <div className="space-y-1 border-b border-zinc-800/80 pb-4">
                  <h1 className="text-2xl font-bold text-white">
                    Account Verification & Sign Out
                  </h1>
                  <p className="text-xs text-zinc-400">
                    Confirm your account details, Email ID, and Password below to securely close your live presence session.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80">
                    <div className="text-xs text-zinc-400">Active Account</div>
                    <div className="text-sm font-bold text-white mt-1 truncate">
                      {currentIdentity.displayName}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono truncate">
                      {currentIdentity.email}
                    </div>
                  </div>
                  <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80">
                    <div className="text-xs text-zinc-400">Preserved Streak</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-amber-400 mt-1">
                      {currentIdentity.streakCount} Days · {currentIdentity.participationPoints} pts
                    </div>
                    <div className="text-xs text-zinc-500">
                      Synced with Account Vault
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmSignOut} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="signout-email" className="block text-xs font-medium text-zinc-300">
                      Confirm Account Email ID ({currentIdentity.email})
                    </label>
                    <input
                      id="signout-email"
                      type="email"
                      required
                      value={signOutEmailConfirm}
                      onChange={(e) => setSignOutEmailConfirm(e.target.value)}
                      placeholder={currentIdentity.email}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  {!authUser && (
                    <div className="space-y-1.5">
                      <label htmlFor="signout-password" className="block text-xs font-medium text-zinc-300">
                        Confirm Account Password
                      </label>
                      <input
                        id="signout-password"
                        type="password"
                        required
                        value={signOutPasswordConfirm}
                        onChange={(e) => setSignOutPasswordConfirm(e.target.value)}
                        placeholder="Enter your account password to sign out"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  )}

                  {signOutError && <p className="text-xs text-rose-400">{signOutError}</p>}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActivePage('hub')}
                      className="px-4 py-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-md whitespace-nowrap shrink-0"
                    >
                      Cancel & Stay Online
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md whitespace-nowrap shrink-0"
                    >
                      Verify & Sign Out
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Full-Screen Moment Image Lightbox Zoom Modal */}
      {momentLightbox?.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Full-screen photo lightbox for moment by ${momentLightbox.authorName}`}
          data-testid="moment-image-lightbox"
          data-moment-id={momentLightbox.momentId || ''}
          data-zoom-percent={momentLightbox.zoomPercent}
          className="fixed inset-0 z-50 flex flex-col bg-[#050505]/95 backdrop-blur-md"
        >
          {/* Top Lightbox Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-zinc-800/90 bg-[#0A0A0C]">
            <div className="flex flex-wrap items-center gap-2 text-xs min-w-0">
              <span className="font-bold text-white truncate">
                {momentLightbox.authorName}
              </span>
              <span aria-hidden="true" className="text-zinc-600">
                ·
              </span>
              <span className="font-mono text-zinc-400 capitalize whitespace-nowrap">
                {momentLightbox.visibility} Moment
              </span>
              <span aria-hidden="true" className="text-zinc-600">
                ·
              </span>
              <span
                data-testid="moment-lightbox-zoom-badge"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 font-mono text-[11px] font-semibold text-emerald-300 tabular-nums whitespace-nowrap"
              >
                Zoom {momentLightbox.zoomPercent}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setMomentLightbox((prev) =>
                    prev ? updateMomentLightboxZoom(prev, 'out') : null
                  )
                }
                disabled={!momentLightbox.canZoomOut}
                aria-label="Zoom out Moment image"
                data-testid="moment-lightbox-zoom-out"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-800 bg-[#050505] text-xs font-mono text-zinc-200 hover:border-zinc-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>-</span>
              </button>

              {MOMENT_LIGHTBOX_ZOOM_PRESETS.map((presetScale) => {
                const presetPct = Math.round(presetScale * 100);
                const isActive = momentLightbox.zoomScale === presetScale;
                return (
                  <button
                    key={presetScale}
                    type="button"
                    onClick={() =>
                      setMomentLightbox((prev) =>
                        prev ? updateMomentLightboxZoom(prev, presetScale) : null
                      )
                    }
                    data-testid={`moment-lightbox-preset-${presetPct}`}
                    className={`px-2.5 py-1.5 rounded border text-xs font-mono tabular-nums transition-colors ${
                      isActive
                        ? 'bg-white text-black border-white font-semibold'
                        : 'bg-[#050505] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600'
                    }`}
                  >
                    {presetPct}%
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setMomentLightbox((prev) =>
                    prev ? updateMomentLightboxZoom(prev, 'in') : null
                  )
                }
                disabled={!momentLightbox.canZoomIn}
                aria-label="Zoom in Moment image"
                data-testid="moment-lightbox-zoom-in"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-800 bg-[#050505] text-xs font-mono text-zinc-200 hover:border-zinc-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>+</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setMomentLightbox((prev) =>
                    prev ? updateMomentLightboxZoom(prev, 'reset') : null
                  )
                }
                aria-label="Reset zoom to 100%"
                data-testid="moment-lightbox-zoom-reset"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-800 bg-[#050505] text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={() => setMomentLightbox(null)}
                aria-label="Close full-screen lightbox"
                data-testid="moment-lightbox-close"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5 shrink-0" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Interactive Center Viewport */}
          <div
            data-testid="moment-lightbox-viewport"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setMomentLightbox(null);
              }
            }}
            className="relative flex-1 overflow-auto flex items-center justify-center p-6 select-none"
          >
            <img
              src={momentLightbox.photoDataUrl}
              alt={momentLightbox.caption}
              referrerPolicy="no-referrer"
              data-testid="moment-lightbox-image"
              data-zoom-scale={momentLightbox.zoomScale}
              onClick={(e) => {
                e.stopPropagation();
                setMomentLightbox((prev) =>
                  prev ? updateMomentLightboxZoom(prev, 'toggle') : null
                );
              }}
              style={{
                transform: `scale(${momentLightbox.zoomScale})`,
                transformOrigin: 'center center',
              }}
              className={`max-w-[88vw] max-h-[72vh] object-contain rounded-lg border border-zinc-800/80 bg-[#0A0A0C] shadow-2xl transition-transform duration-200 ease-out ${
                momentLightbox.isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            />
          </div>

          {/* Bottom Caption & Controls Footer */}
          <div className="px-6 py-4 border-t border-zinc-800/90 bg-[#0A0A0C] flex flex-wrap items-center justify-between gap-4">
            <p
              data-testid="moment-lightbox-caption"
              className="text-sm text-zinc-100 max-w-4xl leading-relaxed break-words"
            >
              {momentLightbox.caption}
            </p>
            <span className="text-[11px] font-mono text-zinc-400 whitespace-nowrap">
              Click image to toggle 200% zoom · Keys: + / - / 0 / Esc
            </span>
          </div>
        </div>
      )}

      {/* Subtle, Non-Intrusive Daily Streak Focus Reminder Toast */}
      {streakReminderEvaluation.shouldShowToast && (
        <aside
          role="status"
          aria-live="polite"
          data-testid="streak-focus-reminder-toast"
          data-reminder-cutoff={streakReminderEvaluation.reminderTime24h}
          className="fixed bottom-5 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-md rounded-xl border border-amber-400/35 bg-[#0A0A0C]/95 backdrop-blur-md p-4 shadow-2xl transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-amber-400/15 border border-amber-400/35 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    data-testid="streak-reminder-toast-title"
                    className="text-xs font-bold text-white tracking-tight"
                  >
                    {streakReminderEvaluation.title}
                  </span>
                  <span
                    data-testid="streak-reminder-toast-streak-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/35 text-[10px] font-mono font-semibold text-amber-300 tabular-nums"
                  >
                    <Flame className="w-3 h-3" />
                    <span>{streakReminderEvaluation.streakBadgeLabel}</span>
                  </span>
                </div>
                <p
                  data-testid="streak-reminder-toast-message"
                  className="text-xs text-zinc-300 leading-relaxed"
                >
                  {streakReminderEvaluation.message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissStreakReminderToday}
              data-testid="streak-reminder-close-btn"
              aria-label="Dismiss focus reminder for today"
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="streak-reminder-start-desk-btn"
                onClick={() => {
                  if (!myFocusStatus.isInFocus) {
                    handleToggleQuickFocusDesk();
                  } else {
                    markFocusSessionStartedToday();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Start Focus Desk</span>
              </button>

              <button
                type="button"
                data-testid="streak-reminder-log-15m-btn"
                onClick={() => handleLogFocusMinutes(15)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-mono font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>+15m Focus</span>
              </button>
            </div>

            <button
              type="button"
              data-testid="streak-reminder-dismiss-btn"
              onClick={handleDismissStreakReminderToday}
              className="px-2.5 py-1.5 rounded-md text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors whitespace-nowrap shrink-0"
            >
              Dismiss for Today
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}


