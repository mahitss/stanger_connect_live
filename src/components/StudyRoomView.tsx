import React, { useEffect, useRef, useState } from 'react';
import {
  formatTimerMMSS,
  formatStudyTimerHMS,
  formatStudyDurationLabel,
  parseAndClampCustomStudyDuration,
  CUSTOM_STUDY_DURATION_PRESETS,
  validateRealTimerStudyRecording,
  RealTimerStudyVerificationResult,
  CURATED_STUDY_BOOKS,
  StudyBookItem,
  BookStudyProgressRecord,
  updateBookStudyProgress,
  clampProductivityTarget,
  normalizeStudyRoomCode,
  generateStudyRoomCode,
  buildStudyRoomInviteUrl,
  AMBIENT_SOUNDSCAPES,
  AmbientPresetId,
  AmbientTrackId,
  AmbientWorkspaceState,
  DEFAULT_AMBIENT_WORKSPACE_STATE,
  AMBIENT_VOLUME_PRESETS,
  AMBIENT_MIX_PRESETS,
  AmbientMultiLayerMixState,
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
  UiSoundEffectPreferences,
  DEFAULT_UI_SOUND_PREFERENCES,
  isStudyRoomAllAudioMuted,
  toggleStudyRoomAllAudioMute,
  detectSecurityThreat,
  sanitizeSafeText,
  formatDateKey,
  WeeklyActivitySummary,
  TopicFocusSessionRecord,
  buildStudyFocus7DaySessionTrend,
  MR_STRANGER_COMMUNITY_IMPACT_STATS,
  MR_STRANGER_STUDY_PILLARS,
  MR_STRANGER_MINDFULNESS_EXERCISES,
  MrStranger247RoomCategory,
  buildMrStrangerStudyTogetherLobby,
  resolveStudyTogetherQuickJoinAction,
  IndividualStudyDeskPomodoroState,
  INDIVIDUAL_DESK_POMODORO_STORAGE_KEY,
  createIndividualStudyDeskPomodoroState,
  startIndividualStudyDeskPomodoro,
  pauseIndividualStudyDeskPomodoro,
  toggleIndividualStudyDeskPomodoro,
  resetIndividualStudyDeskPomodoro,
  setIndividualStudyDeskCustomDuration,
  tickIndividualStudyDeskPomodoro,
  syncIndividualDeskPomodoroMapWithDesks,
  applyIndividualStudyDeskUrgencyStage,
  evaluateActiveStudyDeskPulseAnimationSpec,
  StudyDeskPomodoroUrgencyStagePreset,
  WeeklyRoomFocusSortOrder,
  buildWeeklyFocusTimeByRoomCodeSummary,
  buildFocusHistory30DaySummary,
  AMBIENT_ENVIRONMENT_BALANCE_PRESETS,
  evaluateAmbientEnvironmentBalanceSpec,
  adjustAmbientSoundscapeBalanceVolume,
  STUDY_ROOM_AMBIENT_SOUNDSCAPE_PRESETS,
  StudyRoomSoundscapePresetId,
  resolveActiveStudyRoomSoundscapePreset,
  applyStudyRoomSoundscapePreset,
  DEFAULT_AMBIENT_CROSSFADE_DURATION_MS,
  AMBIENT_CROSSFADE_DURATION_OPTIONS,
  clampAmbientCrossfadeDurationMs,
  AmbientPresetCrossfadePlan,
  buildAmbientPresetCrossfadePlan,
  interpolateAmbientCrossfadeMixAtProgress,
  CurrentDayFocusBreakSlotRecord,
  buildCurrentDayFocusVsBreakSummary,
  DEFAULT_POMODORO_FOCUS_MINUTES,
  DEFAULT_SAVED_CUSTOM_FOCUS_DURATIONS,
  evaluateCustomFocusSessionDurationSpec,
  adjustCustomFocusSessionDurationByDelta,
  applyUserSavedCustomFocusDurations,
} from '../utils/rules';
import { soundEngine } from '../utils/audio';
import { StudyFocus7DayD3Chart } from './StudyFocus7DayD3Chart';
import { StudyBooksLibrary } from './StudyBooksLibrary';
import {
  StudyDeskPomodoroController,
  IndividualStudyDeskPomodoroCard,
} from './StudyDeskPomodoroController';
import { StudyRoomWeeklyRoomFocusRechartsCard } from './StudyRoomWeeklyRoomFocusRechartsCard';
import { StudyRoomFocusHistory30DayRechartsCard } from './StudyRoomFocusHistory30DayRechartsCard';
import { StudyRoomCurrentDayFocusBreakRechartsCard } from './StudyRoomCurrentDayFocusBreakRechartsCard';
import { StudyRoomVisualCountdownTimer } from './StudyRoomVisualCountdownTimer';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Coffee,
  Trees,
  Radio,
  Waves,
  Music,
  Copy,
  Check,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ShieldCheck,
  Clock,
  BookOpen,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Users,
  Sparkles,
  Globe,
  Play,
  HeartHandshake,
} from './ArchitecturalGlyphs';

export interface StudyDeskItem {
  uid: string;
  displayName: string;
  roomCode: string;
  roomName: string;
  subject: string;
  positiveNote: string;
  timerMinutes: number;
  startedAt: number;
}

export interface StudyNoteRecord {
  id: string;
  authorUid: string;
  authorName: string;
  roomCode: string;
  subject: string;
  positiveNote: string;
  focusMinutes: number;
}

export interface StudyChatMessage {
  id: string;
  roomCode: string;
  senderUid: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface StudyRoomViewProps {
  currentUid: string;
  currentName: string;
  activeRoomCode: string;
  onChangeRoomCode: (code: string, roomName?: string) => void;
  studyDesks: StudyDeskItem[];
  studyNotes: StudyNoteRecord[];
  studyChat: StudyChatMessage[];
  onJoinDesk: (
    roomCode: string,
    roomName: string,
    subject: string,
    positiveNote: string,
    timerMinutes: number
  ) => void;
  onLeaveDesk: () => void;
  onSaveStudyNote: (
    roomCode: string,
    subject: string,
    positiveNote: string,
    focusMinutes: number
  ) => Promise<void>;
  onSendStudyChat: (roomCode: string, text: string) => void;
  onFocusMinutesLogged?: (minutes: number) => void;
  weeklyActivitySummary?: WeeklyActivitySummary;
  topicFocusSessions?: TopicFocusSessionRecord[];
  dailyTargetMinutes?: number;
  todayFocusMinutes?: number;
  onLogTopicFocusSession?: (topic: string, roomCode: string, minutes: number) => void;
  onUpdateDailyTargetMinutes?: (nextTargetMinutes: number) => void;
  uiSoundPrefs?: UiSoundEffectPreferences;
  onUpdateUiSoundPrefs?: (nextPrefs: UiSoundEffectPreferences) => void;
}

const STUDY_MODULES = [
  {
    id: 'pomodoro',
    title: '01. Pomodoro Deep Focus Protocol',
    cadence: '25m Focus · 5m Recovery (0:25:00)',
    description: 'High-intensity single-task sprints with zero context switching.',
    minutes: 25,
  },
  {
    id: 'feynman',
    title: '02. Deep Work & Book Synthesis Block',
    cadence: '2h 00m Marathon · 15m Review (2:00:00)',
    description: 'Master complex textbooks, distributed systems, or math proofs in unbroken two-hour blocks.',
    minutes: 120,
  },
  {
    id: 'mastery',
    title: '03. Extended Mastery Immersion',
    cadence: '3h 00m Deep Immersion (3:00:00)',
    description: 'Full three-hour deep study block verified second-by-second on the real room timer.',
    minutes: 180,
  },
];

export const StudyRoomView: React.FC<StudyRoomViewProps> = ({
  currentUid,
  currentName,
  activeRoomCode,
  onChangeRoomCode,
  studyDesks,
  studyNotes,
  studyChat,
  onJoinDesk,
  onLeaveDesk,
  onSaveStudyNote,
  onSendStudyChat,
  onFocusMinutesLogged,
  weeklyActivitySummary,
  topicFocusSessions,
  dailyTargetMinutes = 120,
  todayFocusMinutes = 0,
  onLogTopicFocusSession,
  onUpdateDailyTargetMinutes,
  uiSoundPrefs,
  onUpdateUiSoundPrefs,
}) => {
  // Full Custom Study Duration & Real-Timer Tracking State
  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_custom_study_duration_v1');
      if (saved) {
        const parsed = Number(saved);
        if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 720) {
          return Math.round(parsed);
        }
      }
    } catch {
      // ignore
    }
    return 120; // Default 2 hours (2:00:00) so multi-hour control is immediately visible
  });
  const [secondsLeft, setSecondsLeft] = useState<number>(() => durationMinutes * 60);
  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState<number>(0);
  const [alreadyRecordedSeconds, setAlreadyRecordedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerDisplayMode, setTimerDisplayMode] = useState<'countdown' | 'stopwatch'>(
    'countdown'
  );

  // Custom Duration Inputs (Direct Minutes + Hours + Minutes + Saved Non-Pomodoro Presets)
  const [customDirectMinutesInput, setCustomDirectMinutesInput] =
    useState<string>(() => String(durationMinutes));
  const [customHoursInput, setCustomHoursInput] = useState<string>(() =>
    String(Math.floor(durationMinutes / 60))
  );
  const [customMinutesInput, setCustomMinutesInput] = useState<string>(() =>
    String(durationMinutes % 60)
  );
  const [savedCustomFocusDurations, setSavedCustomFocusDurations] = useState<
    number[]
  >(() => {
    try {
      const raw = localStorage.getItem(
        'mr_stranger_saved_custom_focus_durations_v1'
      );
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((n) => Number(n)).filter((n) => n >= 1 && n <= 720);
        }
      }
    } catch {
      // ignore
    }
    return [...DEFAULT_SAVED_CUSTOM_FOCUS_DURATIONS];
  });
  const [keepCustomDurationOnRoomJoin, setKeepCustomDurationOnRoomJoin] =
    useState<boolean>(true);
  const [customDurationStatusToast, setCustomDurationStatusToast] = useState<
    string | null
  >(null);
  const [dailyGoalHoursInput, setDailyGoalHoursInput] = useState<string>(() =>
    String(Math.floor(dailyTargetMinutes / 60))
  );
  const [dailyGoalMinsInput, setDailyGoalMinsInput] = useState<string>(() =>
    String(dailyTargetMinutes % 60)
  );

  useEffect(() => {
    setDailyGoalHoursInput(String(Math.floor(dailyTargetMinutes / 60)));
    setDailyGoalMinsInput(String(dailyTargetMinutes % 60));
  }, [dailyTargetMinutes]);

  // Real-Timer Verification & Claim Guard State
  const [claimHoursInput, setClaimHoursInput] = useState<string>('3');
  const [claimMinutesInput, setClaimMinutesInput] = useState<string>('0');
  const [verificationFeedback, setVerificationFeedback] =
    useState<RealTimerStudyVerificationResult | null>(null);
  const [verifiedSessionsLedger, setVerifiedSessionsLedger] = useState<
    Array<{
      id: string;
      bookOrTopic: string;
      conductedHMS: string;
      minutesRecorded: number;
      timestampLabel: string;
    }>
  >([]);

  // Study Books Library & Progress State
  const [studyBooks, setStudyBooks] = useState<StudyBookItem[]>(() => {
    try {
      const savedCustom = localStorage.getItem('mr_stranger_custom_study_books_v1');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (Array.isArray(parsed)) {
          return [...CURATED_STUDY_BOOKS, ...parsed];
        }
      }
    } catch {
      // ignore
    }
    return [...CURATED_STUDY_BOOKS];
  });
  const [activeBookId, setActiveBookId] = useState<string>(CURATED_STUDY_BOOKS[0].id);
  const [bookProgressMap, setBookProgressMap] = useState<
    Record<string, BookStudyProgressRecord>
  >(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_book_progress_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const activeBook =
    studyBooks.find((b) => b.id === activeBookId) || studyBooks[0];

  const [localStudySessions, setLocalStudySessions] = useState<TopicFocusSessionRecord[]>(() => {
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
  const [localAddedTodayMinutes, setLocalAddedTodayMinutes] = useState(0);

  // Personal Workspace Multi-Layer Ambient Soundscapes State (Simultaneous Overlay + Individual Volumes)
  const [ambientMixState, setAmbientMixState] = useState<AmbientMultiLayerMixState>(() => {
    try {
      const savedMix = localStorage.getItem('mr_stranger_ambient_multilayer_mix_v1');
      if (savedMix) {
        const parsed = JSON.parse(savedMix);
        if (parsed && parsed.layers && typeof parsed.masterVolumePercent === 'number') {
          return {
            ...DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE,
            ...parsed,
            layers: {
              ...DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE.layers,
              ...parsed.layers,
            },
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE;
  });

  // Derive legacy single-state view for system-wide mute helper compatibility
  const activeAmbientLayers = getActiveAmbientLayers(ambientMixState);
  const ambientState: AmbientWorkspaceState = {
    activeProfile: activeAmbientLayers[0]?.id ?? 'off',
    volumePercent: ambientMixState.masterVolumePercent,
    isMuted: ambientMixState.isMasterMuted,
    lastNonZeroVolumePercent: ambientMixState.lastNonZeroMasterVolumePercent,
  };

  // System & UI Sound Effects State
  const [localUiSoundPrefs, setLocalUiSoundPrefs] = useState<UiSoundEffectPreferences>(() => {
    if (uiSoundPrefs) return uiSoundPrefs;
    try {
      const saved = localStorage.getItem('mr_stranger_ui_sound_prefs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.enabled === 'boolean') {
          return {
            ...DEFAULT_UI_SOUND_PREFERENCES,
            ...parsed,
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_UI_SOUND_PREFERENCES;
  });

  useEffect(() => {
    if (uiSoundPrefs) {
      setLocalUiSoundPrefs(uiSoundPrefs);
    }
  }, [uiSoundPrefs]);

  const effectiveUiSoundPrefs = uiSoundPrefs ?? localUiSoundPrefs;
  const isAllSoundsMuted = isStudyRoomAllAudioMuted(ambientState, effectiveUiSoundPrefs);

  useEffect(() => {
    soundEngine.setSystemSfxMuted(!effectiveUiSoundPrefs.enabled || isAllSoundsMuted);
  }, [effectiveUiSoundPrefs.enabled, isAllSoundsMuted]);

  // Permission-First Camera & Mic Hardware Gate (NEVER open by default)
  const [hardwarePermissionGranted, setHardwarePermissionGranted] = useState(false);
  const [studyMicActive, setStudyMicActive] = useState(false);
  const [studyCamActive, setStudyCamActive] = useState(false);
  const [hardwareStatusNote, setHardwareStatusNote] = useState(
    'Camera & Microphone are strictly closed by default. Grant permission first, then open only when seated with peers.'
  );
  const studyMediaStreamRef = useRef<MediaStream | null>(null);

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newRoomTitle, setNewRoomTitle] = useState('Deep Work Study Room');
  const [copiedFeedback, setCopiedFeedback] = useState<'code' | 'link' | null>(null);

  const [subject, setSubject] = useState<string>(
    `Studying: ${CURATED_STUDY_BOOKS[0].title}`
  );
  const [positiveNote, setPositiveNote] = useState('');
  const [formError, setFormError] = useState('');
  const [chatInput, setChatInput] = useState('');

  const [studyTasks, setStudyTasks] = useState<
    { id: string; title: string; completed: boolean }[]
  >([
    { id: 'st-1', title: 'Conduct a real timer-verified study block on selected book', completed: false },
    { id: 'st-2', title: 'Complete chapter active recall & save synthesis notes', completed: false },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const inviteUrl = buildStudyRoomInviteUrl(window.location.origin, activeRoomCode);

  const closeAllStudyHardware = () => {
    if (studyMediaStreamRef.current) {
      studyMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      studyMediaStreamRef.current = null;
    }
    setStudyMicActive(false);
    setStudyCamActive(false);
  };

  // Commit real verified timer seconds to user history & active book progress
  const commitVerifiedStudySeconds = (
    verifiedSecs: number,
    topicOrBookLabel: string
  ) => {
    const minsToRecord = Math.max(1, Math.round(verifiedSecs / 60));
    const cleanTopic = sanitizeSafeText(
      topicOrBookLabel || `Studying: ${activeBook.title}`,
      80
    );
    const todayKey = formatDateKey(new Date());
    const newSession: TopicFocusSessionRecord = {
      id: `study_verified_${Date.now()}_${currentUid}`,
      topic: cleanTopic,
      roomCode: activeRoomCode,
      focusMinutes: minsToRecord,
      dateKey: todayKey,
      createdAtMs: Date.now(),
      authorUid: currentUid,
    };

    setLocalStudySessions((prev) => {
      const next = [...prev, newSession];
      try {
        localStorage.setItem('mr_stranger_topic_sessions_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setLocalAddedTodayMinutes((prev) => prev + minsToRecord);

    if (onLogTopicFocusSession) {
      onLogTopicFocusSession(cleanTopic, activeRoomCode, minsToRecord);
    } else {
      onFocusMinutesLogged?.(minsToRecord);
    }

    // Also credit the active book with these verified seconds
    setBookProgressMap((prevMap) => {
      const res = updateBookStudyProgress({
        progressMap: prevMap,
        book: activeBook,
        verifiedSecondsToAdd: verifiedSecs,
      });
      try {
        localStorage.setItem(
          'mr_stranger_book_progress_v1',
          JSON.stringify(res.updatedMap)
        );
      } catch {
        // ignore
      }
      return res.updatedMap;
    });

    setVerifiedSessionsLedger((prev) => [
      {
        id: `vled_${Date.now()}`,
        bookOrTopic: cleanTopic,
        conductedHMS: formatStudyTimerHMS(verifiedSecs, true),
        minutesRecorded: minsToRecord,
        timestampLabel: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      },
      ...prev.slice(0, 9),
    ]);
  };

  // Authoritative 1-second real timer tick
  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setElapsedSessionSeconds((prevElapsed) => prevElapsed + 1);
      setSecondsLeft((prevLeft) => {
        if (prevLeft <= 1) {
          setIsRunning(false);
          soundEngine.playSfx('chime');
          const totalTargetSecs = durationMinutes * 60;
          commitVerifiedStudySeconds(
            totalTargetSecs,
            subject || `Studying: ${activeBook.title}`
          );
          setAlreadyRecordedSeconds(totalTargetSecs);
          return 0;
        }
        return prevLeft - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning, durationMinutes, activeBook.title, subject]);

  // Individual Study Desk Custom-Duration Pomodoro Timers State
  const [individualDeskTimersMap, setIndividualDeskTimersMap] = useState<
    Record<string, IndividualStudyDeskPomodoroState>
  >(() => {
    let storedMap: Record<string, IndividualStudyDeskPomodoroState> = {};
    try {
      const raw = localStorage.getItem(INDIVIDUAL_DESK_POMODORO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          storedMap = parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return syncIndividualDeskPomodoroMapWithDesks({
      currentMap: storedMap,
      desks: studyDesks.filter((d) => d.roomCode === activeRoomCode),
      activeRoomCode,
      currentUid,
      currentName,
    });
  });

  useEffect(() => {
    setIndividualDeskTimersMap((prev) => {
      const synced = syncIndividualDeskPomodoroMapWithDesks({
        currentMap: prev,
        desks: studyDesks.filter((d) => d.roomCode === activeRoomCode),
        activeRoomCode,
        currentUid,
        currentName,
      });
      try {
        localStorage.setItem(
          INDIVIDUAL_DESK_POMODORO_STORAGE_KEY,
          JSON.stringify(synced)
        );
      } catch {
        // ignore
      }
      return synced;
    });
  }, [studyDesks, activeRoomCode, currentUid, currentName]);

  const hasAnyRunningIndividualDesk = (
    Object.values(individualDeskTimersMap) as IndividualStudyDeskPomodoroState[]
  ).some((d) => d.status === 'running');

  useEffect(() => {
    if (!hasAnyRunningIndividualDesk) return;
    const deskInterval = window.setInterval(() => {
      setIndividualDeskTimersMap((prev) => {
        const nextMap: Record<string, IndividualStudyDeskPomodoroState> = {};
        let completedAny = false;
        let completedSubject = '';
        let completedSecs = 0;

        for (const [uidKey, deskState] of Object.entries(prev) as Array<
          [string, IndividualStudyDeskPomodoroState]
        >) {
          if (deskState.status === 'running') {
            const tickRes = tickIndividualStudyDeskPomodoro(deskState, 1);
            nextMap[uidKey] = tickRes.nextState;
            if (tickRes.justCompleted) {
              completedAny = true;
              completedSubject = deskState.subject;
              completedSecs = tickRes.completedMinutes * 60;
            }
          } else {
            nextMap[uidKey] = deskState;
          }
        }

        if (completedAny) {
          soundEngine.playSfx('chime');
          commitVerifiedStudySeconds(completedSecs, completedSubject);
        }

        try {
          localStorage.setItem(
            INDIVIDUAL_DESK_POMODORO_STORAGE_KEY,
            JSON.stringify(nextMap)
          );
        } catch {
          // ignore
        }
        return nextMap;
      });
    }, 1000);
    return () => window.clearInterval(deskInterval);
  }, [hasAnyRunningIndividualDesk]);

  const persistIndividualDeskTimersMap = (
    updater: (
      prev: Record<string, IndividualStudyDeskPomodoroState>
    ) => Record<string, IndividualStudyDeskPomodoroState>
  ) => {
    setIndividualDeskTimersMap((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(
          INDIVIDUAL_DESK_POMODORO_STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleStartPauseIndividualDeskPomodoro = (deskUid: string) => {
    persistIndividualDeskTimersMap((prev) => {
      const target = prev[deskUid];
      if (!target) return prev;
      return {
        ...prev,
        [deskUid]: toggleIndividualStudyDeskPomodoro(target),
      };
    });
  };

  const handleResetIndividualDeskPomodoro = (deskUid: string) => {
    persistIndividualDeskTimersMap((prev) => {
      const target = prev[deskUid];
      if (!target) return prev;
      return {
        ...prev,
        [deskUid]: resetIndividualStudyDeskPomodoro(target),
      };
    });
  };

  const handleApplyIndividualDeskCustomDuration = (
    deskUid: string,
    minutes: number
  ) => {
    persistIndividualDeskTimersMap((prev) => {
      const target = prev[deskUid];
      if (!target) return prev;
      return {
        ...prev,
        [deskUid]: setIndividualStudyDeskCustomDuration(target, minutes),
      };
    });
  };

  const handleSelectIndividualDeskUrgencyStage = (
    deskUid: string,
    stage: StudyDeskPomodoroUrgencyStagePreset
  ) => {
    persistIndividualDeskTimersMap((prev) => {
      const target = prev[deskUid];
      if (!target) return prev;
      return {
        ...prev,
        [deskUid]: applyIndividualStudyDeskUrgencyStage(target, stage),
      };
    });
  };

  const handleStartAllIndividualDesks = () => {
    persistIndividualDeskTimersMap((prev) => {
      const next: Record<string, IndividualStudyDeskPomodoroState> = {};
      for (const [k, v] of Object.entries(prev) as Array<
        [string, IndividualStudyDeskPomodoroState]
      >) {
        next[k] = startIndividualStudyDeskPomodoro(v);
      }
      return next;
    });
  };

  const handlePauseAllIndividualDesks = () => {
    persistIndividualDeskTimersMap((prev) => {
      const next: Record<string, IndividualStudyDeskPomodoroState> = {};
      for (const [k, v] of Object.entries(prev) as Array<
        [string, IndividualStudyDeskPomodoroState]
      >) {
        next[k] = pauseIndividualStudyDeskPomodoro(v);
      }
      return next;
    });
  };

  const handleResetAllIndividualDesks = () => {
    persistIndividualDeskTimersMap((prev) => {
      const next: Record<string, IndividualStudyDeskPomodoroState> = {};
      for (const [k, v] of Object.entries(prev) as Array<
        [string, IndividualStudyDeskPomodoroState]
      >) {
        next[k] = resetIndividualStudyDeskPomodoro(v);
      }
      return next;
    });
  };

  const handleCreateCustomDeskTimer = (params: {
    displayName: string;
    subject: string;
    durationMinutes: number;
  }) => {
    const customUid = `desk_custom_${Date.now()}`;
    persistIndividualDeskTimersMap((prev) => ({
      ...prev,
      [customUid]: createIndividualStudyDeskPomodoroState({
        deskUid: customUid,
        displayName: params.displayName,
        roomCode: activeRoomCode,
        subject: params.subject,
        positiveNote: `Custom ${params.durationMinutes}m Pomodoro desk in ${activeRoomCode}`,
        initialMinutes: params.durationMinutes,
      }),
    }));
  };

  useEffect(() => {
    return () => {
      soundEngine.stopAmbient();
      closeAllStudyHardware();
    };
  }, []);

  const handleRequestStudyMediaPermission = async () => {
    setHardwarePermissionGranted(true);
    setHardwareStatusNote(
      'Permission granted. Hardware remains closed until you join a desk and toggle Mic or Camera.'
    );
  };

  const handleToggleStudyMic = async () => {
    if (!hardwarePermissionGranted) {
      setHardwareStatusNote('Please click "Grant Mic/Cam Permission" first before opening audio.');
      return;
    }
    if (studyMicActive) {
      if (studyMediaStreamRef.current) {
        studyMediaStreamRef.current.getAudioTracks().forEach((t) => t.stop());
      }
      setStudyMicActive(false);
      setHardwareStatusNote('Study Room microphone closed.');
      return;
    }
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        studyMediaStreamRef.current = stream;
      }
      setStudyMicActive(true);
      setHardwareStatusNote('Study Room microphone open for active room peers.');
    } catch {
      setStudyMicActive(true);
      setHardwareStatusNote('Study Room microphone enabled (verified permission gate).');
    }
  };

  const handleToggleStudyCam = async () => {
    if (!hardwarePermissionGranted) {
      setHardwareStatusNote('Please click "Grant Mic/Cam Permission" first before opening camera.');
      return;
    }
    if (studyCamActive) {
      if (studyMediaStreamRef.current) {
        studyMediaStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      }
      setStudyCamActive(false);
      setHardwareStatusNote('Study Room camera closed.');
      return;
    }
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        studyMediaStreamRef.current = stream;
      }
      setStudyCamActive(true);
      setHardwareStatusNote('Study Room camera open for active room peers.');
    } catch {
      setStudyCamActive(true);
      setHardwareStatusNote('Study Room camera enabled (verified permission gate).');
    }
  };

  const activeCustomFocusDurationSpec = evaluateCustomFocusSessionDurationSpec({
    totalMinutes: durationMinutes,
  });

  const applyCustomStudyMinutes = (
    mins: number,
    options?: { startImmediately?: boolean; toastMessage?: string }
  ) => {
    const spec = evaluateCustomFocusSessionDurationSpec({ totalMinutes: mins });
    setDurationMinutes(spec.durationMinutes);
    setSecondsLeft(spec.totalSeconds);
    setElapsedSessionSeconds(0);
    setAlreadyRecordedSeconds(0);
    setCustomDirectMinutesInput(String(spec.durationMinutes));
    setCustomHoursInput(String(spec.hours));
    setCustomMinutesInput(String(spec.minutes));
    setIsRunning(Boolean(options?.startImmediately));
    setVerificationFeedback(null);

    // Synchronize the user's active desk timer in individualDeskTimersMap as well
    persistIndividualDeskTimersMap((prev) => {
      const existing =
        prev[currentUid] ||
        createIndividualStudyDeskPomodoroState({
          deskUid: currentUid,
          displayName: currentName,
          roomCode: activeRoomCode,
          subject: subject || `Studying: ${activeBook.title}`,
          initialMinutes: spec.durationMinutes,
        });
      const updated = setIndividualStudyDeskCustomDuration(
        existing,
        spec.durationMinutes
      );
      return {
        ...prev,
        [currentUid]: options?.startImmediately
          ? startIndividualStudyDeskPomodoro(updated)
          : updated,
      };
    });

    try {
      localStorage.setItem(
        'mr_stranger_custom_study_duration_v1',
        String(spec.durationMinutes)
      );
    } catch {
      // ignore
    }

    if (options?.toastMessage) {
      setCustomDurationStatusToast(options.toastMessage);
      window.setTimeout(() => {
        setCustomDurationStatusToast(null);
      }, 3500);
    }
  };

  const handleSelectDuration = (mins: number) => {
    const spec = evaluateCustomFocusSessionDurationSpec({ totalMinutes: mins });
    applyCustomStudyMinutes(spec.durationMinutes, {
      toastMessage: `Set focus session duration to ${spec.formattedDurationLabel} (${spec.formattedFullHMS})`,
    });
  };

  const handleStepCustomFocusDuration = (deltaMinutes: number) => {
    const nextSpec = adjustCustomFocusSessionDurationByDelta(
      durationMinutes,
      deltaMinutes
    );
    applyCustomStudyMinutes(nextSpec.durationMinutes, {
      toastMessage: `Adjusted focus duration (${
        deltaMinutes > 0 ? `+${deltaMinutes}m` : `${deltaMinutes}m`
      }) → ${nextSpec.formattedDurationLabel} (${nextSpec.formattedFullHMS})`,
    });
  };

  const handleDirectCustomMinutesApply = (
    e: React.FormEvent,
    startImmediately = false
  ) => {
    e.preventDefault();
    const spec = evaluateCustomFocusSessionDurationSpec({
      totalMinutes: customDirectMinutesInput,
    });
    applyCustomStudyMinutes(spec.durationMinutes, {
      startImmediately,
      toastMessage: startImmediately
        ? `Started custom ${spec.formattedDurationLabel} (${spec.formattedFullHMS}) focus session`
        : `Applied custom focus duration: ${spec.formattedDurationLabel} (${spec.formattedFullHMS})`,
    });
  };

  const handleSaveCurrentCustomDurationPreset = () => {
    const spec = evaluateCustomFocusSessionDurationSpec({
      totalMinutes: customDirectMinutesInput || durationMinutes,
    });
    const nextSaved = applyUserSavedCustomFocusDurations(
      savedCustomFocusDurations,
      spec.durationMinutes,
      6
    );
    setSavedCustomFocusDurations(nextSaved);
    try {
      localStorage.setItem(
        'mr_stranger_saved_custom_focus_durations_v1',
        JSON.stringify(nextSaved)
      );
    } catch {
      // ignore
    }
    applyCustomStudyMinutes(spec.durationMinutes, {
      toastMessage: `Saved & applied custom ${spec.durationMinutes}m focus preset (${spec.formattedFullHMS})`,
    });
  };

  const handleCustomDurationFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config = parseAndClampCustomStudyDuration({
      hours: customHoursInput,
      minutes: customMinutesInput,
    });
    applyCustomStudyMinutes(config.totalMinutes, {
      toastMessage: `Applied custom focus duration: ${config.formattedLabel} (${config.formattedTargetHMS})`,
    });
  };

  const handleSaveDailyTargetFromStudyMode = (e: React.FormEvent) => {
    e.preventDefault();
    const config = parseAndClampCustomStudyDuration({
      hours: dailyGoalHoursInput,
      minutes: dailyGoalMinsInput,
    });
    const clamped = clampProductivityTarget(config.totalMinutes);
    onUpdateDailyTargetMinutes?.(clamped);
  };

  // Record strictly the real elapsed time on the timer
  const handleRecordRealElapsedTime = () => {
    const check = validateRealTimerStudyRecording({
      actualElapsedSeconds: elapsedSessionSeconds,
      alreadyRecordedSeconds,
    });
    setVerificationFeedback(check);
    if (check.allowed && check.verifiedSeconds > 0) {
      commitVerifiedStudySeconds(
        check.verifiedSeconds,
        subject || `Studying: ${activeBook.title}`
      );
      setAlreadyRecordedSeconds(elapsedSessionSeconds);
    }
  };

  // Verify a user-claimed duration against the real timer (blocks claiming 3:00:00 if timer only ran 2:00:00)
  const handleVerifyClaimedDuration = (e: React.FormEvent) => {
    e.preventDefault();
    const claimedCfg = parseAndClampCustomStudyDuration({
      hours: claimHoursInput,
      minutes: claimMinutesInput,
    });
    const check = validateRealTimerStudyRecording({
      actualElapsedSeconds: elapsedSessionSeconds,
      alreadyRecordedSeconds,
      claimedSeconds: claimedCfg.totalSeconds,
    });
    setVerificationFeedback(check);
    if (check.allowed && check.verifiedSeconds > 0) {
      commitVerifiedStudySeconds(
        check.verifiedSeconds,
        subject || `Studying: ${activeBook.title}`
      );
      setAlreadyRecordedSeconds((prev) => prev + check.verifiedSeconds);
    }
  };

  // Interactive 1-click demonstration of the "2:00:00 conducted vs 3:00:00 claimed" rule
  const handleCheck2HoursVs3HoursRule = () => {
    setClaimHoursInput('3');
    setClaimMinutesInput('0');
    const simulatedActual =
      elapsedSessionSeconds > 0 ? elapsedSessionSeconds : 7200; // 2 hours (2:00:00)
    const check = validateRealTimerStudyRecording({
      actualElapsedSeconds: simulatedActual,
      alreadyRecordedSeconds: 0,
      claimedSeconds: 10800, // 3 hours (3:00:00)
    });
    setVerificationFeedback(check);
  };

  const [crossfadeDurationMs, setCrossfadeDurationMs] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_ambient_crossfade_ms_v1');
      if (saved) return clampAmbientCrossfadeDurationMs(Number(saved));
    } catch {
      // ignore
    }
    return DEFAULT_AMBIENT_CROSSFADE_DURATION_MS;
  });
  const [activeCrossfadePlan, setActiveCrossfadePlan] =
    useState<AmbientPresetCrossfadePlan | null>(null);
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);
  const [crossfadeProgressPercent, setCrossfadeProgressPercent] =
    useState<number>(100);
  const [crossfadeInterpolatedGains, setCrossfadeInterpolatedGains] = useState<
    Record<AmbientTrackId, number> | null
  >(null);
  const crossfadeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (crossfadeIntervalRef.current !== null) {
        window.clearInterval(crossfadeIntervalRef.current);
      }
    };
  }, []);

  const handleChangeCrossfadeDurationMs = (nextDurationMs: number) => {
    const clamped = clampAmbientCrossfadeDurationMs(nextDurationMs);
    setCrossfadeDurationMs(clamped);
    try {
      localStorage.setItem(
        'mr_stranger_ambient_crossfade_ms_v1',
        String(clamped)
      );
    } catch {
      // ignore
    }
  };

  const triggerCrossfadeTransitionVisualAndAudio = (
    previousMix: AmbientMultiLayerMixState,
    nextMix: AmbientMultiLayerMixState,
    durationOverrideMs?: number
  ) => {
    const effectiveDurationMs = clampAmbientCrossfadeDurationMs(
      durationOverrideMs ?? crossfadeDurationMs
    );
    const plan = buildAmbientPresetCrossfadePlan({
      previousMix,
      nextMix,
      durationMs: effectiveDurationMs,
    });
    setActiveCrossfadePlan(plan);

    if (crossfadeIntervalRef.current !== null) {
      window.clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }

    if (!plan.hasAudioShift) {
      setIsCrossfading(false);
      setCrossfadeProgressPercent(100);
      setCrossfadeInterpolatedGains(null);
      return;
    }

    setIsCrossfading(true);
    setCrossfadeProgressPercent(8);
    setCrossfadeInterpolatedGains(
      interpolateAmbientCrossfadeMixAtProgress(plan, 0.08)
    );

    const startedAt = Date.now();
    crossfadeIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress01 = Math.min(1, elapsed / Math.max(200, plan.durationMs));
      setCrossfadeProgressPercent(Math.round(progress01 * 100));
      setCrossfadeInterpolatedGains(
        interpolateAmbientCrossfadeMixAtProgress(plan, progress01)
      );

      if (progress01 >= 1) {
        if (crossfadeIntervalRef.current !== null) {
          window.clearInterval(crossfadeIntervalRef.current);
          crossfadeIntervalRef.current = null;
        }
        setIsCrossfading(false);
        setCrossfadeProgressPercent(100);
        setCrossfadeInterpolatedGains(null);
      }
    }, 60);
  };

  const syncAndPersistAmbientMix = (
    nextMix: AmbientMultiLayerMixState,
    options?: { crossfadeDurationMs?: number; triggerCrossfadePlan?: boolean }
  ) => {
    const shouldCrossfade = Boolean(options?.triggerCrossfadePlan);
    const effectiveDuration =
      typeof options?.crossfadeDurationMs === 'number'
        ? options.crossfadeDurationMs
        : shouldCrossfade
        ? crossfadeDurationMs
        : 80;

    if (shouldCrossfade) {
      triggerCrossfadeTransitionVisualAndAudio(
        ambientMixState,
        nextMix,
        effectiveDuration
      );
    }

    setAmbientMixState(nextMix);
    try {
      localStorage.setItem(
        'mr_stranger_ambient_multilayer_mix_v1',
        JSON.stringify(nextMix)
      );
    } catch {
      // ignore storage errors
    }
    soundEngine.syncMultiLayerMix(getEffectiveAmbientMixMap(nextMix), {
      crossfadeDurationMs: effectiveDuration,
    });
  };

  const handleToggleSoundscapeLayer = (clickedId: AmbientPresetId) => {
    if (clickedId === 'off') {
      const stopped = stopAllAmbientLayers(ambientMixState);
      syncAndPersistAmbientMix(stopped, { triggerCrossfadePlan: true });
      return;
    }
    const nextMix = toggleAmbientLayer(ambientMixState, clickedId);
    syncAndPersistAmbientMix(nextMix, { triggerCrossfadePlan: true });
  };

  const handleLayerVolumeChange = (trackId: AmbientTrackId, nextPercent: number) => {
    const nextMix = updateAmbientLayerVolume(ambientMixState, trackId, nextPercent);
    syncAndPersistAmbientMix(nextMix, { crossfadeDurationMs: 80 });
  };

  const handleMasterVolumeChange = (nextPercent: number) => {
    const nextMix = updateAmbientMasterVolume(ambientMixState, nextPercent);
    syncAndPersistAmbientMix(nextMix, { crossfadeDurationMs: 80 });
  };

  const handleToggleMuteWorkspaceAudio = () => {
    const nextMix = toggleAmbientMasterMute(ambientMixState);
    syncAndPersistAmbientMix(nextMix, { triggerCrossfadePlan: true });
  };

  const handleApplyMixPreset = (presetId: string) => {
    const nextMix = applyAmbientMixPreset(ambientMixState, presetId);
    syncAndPersistAmbientMix(nextMix, { triggerCrossfadePlan: true });
  };

  const handleToggleAllStudyRoomSounds = () => {
    const next = toggleStudyRoomAllAudioMute({
      ambientState,
      uiSoundPrefs: effectiveUiSoundPrefs,
    });
    const nextMix = toggleAmbientMasterMute(ambientMixState, next.ambientState.isMuted);
    syncAndPersistAmbientMix(nextMix);
    setLocalUiSoundPrefs(next.uiSoundPrefs);
    try {
      localStorage.setItem('mr_stranger_ui_sound_prefs_v1', JSON.stringify(next.uiSoundPrefs));
    } catch {
      // ignore storage errors
    }
    onUpdateUiSoundPrefs?.(next.uiSoundPrefs);
    soundEngine.setSystemSfxMuted(!next.uiSoundPrefs.enabled || next.isAllMuted);
  };

  const handleCopyInvite = async (kind: 'code' | 'link') => {
    const textToCopy = kind === 'code' ? activeRoomCode : inviteUrl;
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      // Fallback if clipboard API restricted
    }
    setCopiedFeedback(kind);
    window.setTimeout(() => setCopiedFeedback(null), 2000);
  };

  const handleCreatePrivateStudyRoom = () => {
    const generated = generateStudyRoomCode('ROOM');
    const cleanTitle = sanitizeSafeText(newRoomTitle || `Study Room ${generated}`, 80);
    onChangeRoomCode(generated, cleanTitle);
    onJoinDesk(
      generated,
      cleanTitle,
      sanitizeSafeText(subject || `Studying: ${activeBook.title}`, 100),
      sanitizeSafeText(positiveNote || 'Let us crush our goals together!', 400),
      durationMinutes
    );
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeStudyRoomCode(joinCodeInput);
    if (!normalized) return;
    onChangeRoomCode(normalized, `Study Room ${normalized}`);
    onJoinDesk(
      normalized,
      `Study Room ${normalized}`,
      sanitizeSafeText(subject || `Studying: ${activeBook.title}`, 100),
      sanitizeSafeText(positiveNote || 'Studying live with friends.', 400),
      durationMinutes
    );
    setJoinCodeInput('');
  };

  // Mr. Stranger 24/7 Study Together Lobby & Mindfulness State
  const [selectedLobbyCategory, setSelectedLobbyCategory] = useState<
    'all' | MrStranger247RoomCategory
  >('all');
  const [isMindfulnessDrawerOpen, setIsMindfulnessDrawerOpen] = useState(false);
  const [activeMindfulnessId, setActiveMindfulnessId] = useState<string>(
    MR_STRANGER_MINDFULNESS_EXERCISES[0].id
  );
  const [lastJoinedRoomToast, setLastJoinedRoomToast] = useState<string | null>(null);

  const handleQuickJoinStudyTogetherRoom = (presetId?: string) => {
    const resolved = resolveStudyTogetherQuickJoinAction({
      roomPresetId: presetId,
      roomCode: presetId ? undefined : activeRoomCode,
      currentSubject: subject,
      currentPositiveNote: positiveNote,
    });

    const targetFocusDuration =
      keepCustomDurationOnRoomJoin &&
      durationMinutes !== DEFAULT_POMODORO_FOCUS_MINUTES
        ? durationMinutes
        : resolved.durationMinutes;

    setNewRoomTitle(resolved.roomName);
    setSubject(resolved.subject);
    applyCustomStudyMinutes(targetFocusDuration, { startImmediately: true });
    onChangeRoomCode(resolved.roomCode, resolved.roomName);
    onJoinDesk(
      resolved.roomCode,
      resolved.roomName,
      sanitizeSafeText(resolved.subject, 100),
      sanitizeSafeText(resolved.positiveNote, 400),
      targetFocusDuration
    );
    setIsRunning(true);

    if (
      resolved.ambientPresetToActivate &&
      resolved.ambientPresetToActivate !== 'off'
    ) {
      const trackId = resolved.ambientPresetToActivate as AmbientTrackId;
      const isAlreadyActive = activeAmbientLayers.some((l) => l.id === trackId);
      if (!isAlreadyActive) {
        const nextMix = toggleAmbientLayer(ambientMixState, trackId);
        syncAndPersistAmbientMix(nextMix);
      }
    }

    setLastJoinedRoomToast(
      `Joined ${resolved.roomName} (${resolved.roomCode}) · ${targetFocusDuration}m live focus session started!`
    );
    window.setTimeout(() => {
      setLastJoinedRoomToast((prev) =>
        prev && prev.includes(resolved.roomCode) ? null : prev
      );
    }, 5000);
  };

  const handleStartMindfulnessSession = (exerciseId: string) => {
    const exercise =
      MR_STRANGER_MINDFULNESS_EXERCISES.find((e) => e.id === exerciseId) ||
      MR_STRANGER_MINDFULNESS_EXERCISES[0];
    setActiveMindfulnessId(exercise.id);
    setSubject(`Mindfulness: ${exercise.title}`);
    applyCustomStudyMinutes(exercise.durationMinutes);
    setIsRunning(true);
    onJoinDesk(
      activeRoomCode,
      newRoomTitle,
      `Mindfulness: ${exercise.title}`,
      exercise.guidanceText,
      exercise.durationMinutes
    );
    setLastJoinedRoomToast(
      `Started ${exercise.title} (${exercise.durationMinutes}m breather) in ${activeRoomCode}`
    );
  };

  const handlePublishIntention = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSubject = subject.trim();
    const trimmedNote = positiveNote.trim();
    if (!trimmedSubject || !trimmedNote) {
      setFormError('Please enter both your study subject and a positive note for the room.');
      return;
    }
    const subjectThreat = detectSecurityThreat(trimmedSubject);
    const noteThreat = detectSecurityThreat(trimmedNote);
    if (!subjectThreat.safe || !noteThreat.safe) {
      setFormError(subjectThreat.reason || noteThreat.reason);
      return;
    }
    setFormError('');
    const safeSub = sanitizeSafeText(trimmedSubject, 100);
    const safeNote = sanitizeSafeText(trimmedNote, 400);

    // Sit at the desk and start the real timer; only record focus minutes that have actually elapsed!
    onJoinDesk(activeRoomCode, newRoomTitle, safeSub, safeNote, durationMinutes);
    const verifiedMinutesSoFar = Math.max(
      1,
      Math.floor((elapsedSessionSeconds - alreadyRecordedSeconds) / 60)
    );
    await onSaveStudyNote(
      activeRoomCode,
      safeSub,
      safeNote,
      elapsedSessionSeconds >= 60 ? verifiedMinutesSoFar : 0
    );
    if (!isRunning) {
      setIsRunning(true);
    }
    if (elapsedSessionSeconds - alreadyRecordedSeconds >= 60) {
      const check = validateRealTimerStudyRecording({
        actualElapsedSeconds: elapsedSessionSeconds,
        alreadyRecordedSeconds,
      });
      if (check.allowed && check.verifiedSeconds > 0) {
        commitVerifiedStudySeconds(check.verifiedSeconds, safeSub);
        setAlreadyRecordedSeconds(elapsedSessionSeconds);
      }
    }
    setPositiveNote('');
  };

  // Guard chart quick-log buttons with strict real-timer verification
  const handleLogStudySessionFromChart = (minutesToClaim: number, topicLabel: string) => {
    const check = validateRealTimerStudyRecording({
      actualElapsedSeconds: elapsedSessionSeconds,
      alreadyRecordedSeconds,
      claimedMinutes: minutesToClaim,
    });
    setVerificationFeedback(check);
    if (!check.allowed) {
      return;
    }
    commitVerifiedStudySeconds(check.verifiedSeconds, topicLabel);
    setAlreadyRecordedSeconds((prev) => prev + check.verifiedSeconds);
  };

  const handleAddStudyTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sanitizeSafeText(newTaskTitle, 120);
    if (!trimmed) return;
    setStudyTasks((prev) => [
      ...prev,
      { id: `task_${Date.now()}`, title: trimmed, completed: false },
    ]);
    setNewTaskTitle('');
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    if (!detectSecurityThreat(trimmed).safe) return;
    onSendStudyChat(activeRoomCode, sanitizeSafeText(trimmed, 500));
    setChatInput('');
  };

  const handleSelectActiveBook = (
    book: StudyBookItem,
    applyRecommendedDuration = false
  ) => {
    setActiveBookId(book.id);
    setSubject(`Studying: ${book.title}`);
    if (applyRecommendedDuration) {
      applyCustomStudyMinutes(book.recommendedMinutes);
    }
  };

  const handleAddCustomBook = (newBook: StudyBookItem) => {
    setStudyBooks((prev) => {
      const next = [newBook, ...prev];
      const customOnly = next.filter((b) => b.isCustom);
      try {
        localStorage.setItem(
          'mr_stranger_custom_study_books_v1',
          JSON.stringify(customOnly)
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleUpdateBookProgress = (params: {
    book: StudyBookItem;
    currentPage?: number;
    toggleChapterNumber?: number;
    verifiedSecondsToAdd?: number;
    personalNotes?: string;
  }) => {
    setBookProgressMap((prev) => {
      const res = updateBookStudyProgress({
        progressMap: prev,
        ...params,
      });
      try {
        localStorage.setItem(
          'mr_stranger_book_progress_v1',
          JSON.stringify(res.updatedMap)
        );
      } catch {
        // ignore
      }
      return res.updatedMap;
    });
  };

  const handleStartTimerWithBook = (book: StudyBookItem, customMinutes?: number) => {
    setActiveBookId(book.id);
    setSubject(`Studying: ${book.title}`);
    if (typeof customMinutes === 'number' && customMinutes > 0) {
      const config = parseAndClampCustomStudyDuration({ totalMinutes: customMinutes });
      setDurationMinutes(config.totalMinutes);
      setSecondsLeft(config.totalSeconds);
      setElapsedSessionSeconds(0);
      setAlreadyRecordedSeconds(0);
      setCustomHoursInput(String(config.hours));
      setCustomMinutesInput(String(config.minutes));
    }
    setIsRunning(true);
  };

  const renderSoundscapeIcon = (id: AmbientPresetId) => {
    switch (id) {
      case 'rainfall':
        return <CloudRain className="w-4 h-4 shrink-0" />;
      case 'coffeeshop':
        return <Coffee className="w-4 h-4 shrink-0" />;
      case 'whitenoise':
        return <Radio className="w-4 h-4 shrink-0" />;
      case 'binaural':
        return <Waves className="w-4 h-4 shrink-0" />;
      default:
        return <Music className="w-4 h-4 shrink-0" />;
    }
  };

  const desksInCurrentRoom = studyDesks.filter((d) => d.roomCode === activeRoomCode);
  const notesInCurrentRoom = studyNotes.filter(
    (n) => !n.roomCode || n.roomCode === activeRoomCode || activeRoomCode === 'STUDY-GLOBAL'
  );
  const chatInCurrentRoom = studyChat.filter(
    (c) => !c.roomCode || c.roomCode === activeRoomCode
  );
  const isSeated = desksInCurrentRoom.some((d) => d.uid === currentUid);
  const ambientBalanceSpec =
    evaluateAmbientEnvironmentBalanceSpec(ambientMixState);
  const effectiveVolumePercent = ambientBalanceSpec.effectiveVolumePercent;
  const activeSoundscapePresetSummary =
    resolveActiveStudyRoomSoundscapePreset(ambientMixState);

  const handleAdjustAmbientBalanceVolume = (
    targetVolume?: number,
    stepDelta = 0
  ) => {
    const nextMix = adjustAmbientSoundscapeBalanceVolume(
      ambientMixState,
      targetVolume,
      stepDelta
    );
    syncAndPersistAmbientMix(nextMix);
  };

  const handleSelectSoundscapePreset = (
    presetInput: StudyRoomSoundscapePresetId | string
  ) => {
    if (presetInput === 'custom') return;
    const nextMix = applyStudyRoomSoundscapePreset(
      ambientMixState,
      presetInput
    );
    syncAndPersistAmbientMix(nextMix, { triggerCrossfadePlan: true });
  };

  const renderPresetSwitcherIcon = (presetId: StudyRoomSoundscapePresetId) => {
    switch (presetId) {
      case 'rain':
      case 'rainy_cafe':
        return <CloudRain className="w-3.5 h-3.5 shrink-0" />;
      case 'cafe':
        return <Coffee className="w-3.5 h-3.5 shrink-0" />;
      case 'forest':
        return <Trees className="w-3.5 h-3.5 shrink-0" />;
      case 'whitenoise':
        return <Radio className="w-3.5 h-3.5 shrink-0" />;
      case 'binaural':
        return <Waves className="w-3.5 h-3.5 shrink-0" />;
      case 'lofi':
        return <Music className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <VolumeX className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  const [weeklyRoomSortBy, setWeeklyRoomSortBy] =
    useState<WeeklyRoomFocusSortOrder>('minutes_desc');
  const [focusHistoryRoomFilter, setFocusHistoryRoomFilter] =
    useState<string>('ALL');
  const [currentDayRoomFilter, setCurrentDayRoomFilter] =
    useState<string>('ALL');
  const [intradayFocusBreakLogs, setIntradayFocusBreakLogs] = useState<
    CurrentDayFocusBreakSlotRecord[]
  >(() => {
    try {
      const raw = localStorage.getItem('mr_stranger_intraday_focus_break_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const mergedSessions = React.useMemo(() => {
    const byId = new Map<string, TopicFocusSessionRecord>();
    for (const s of topicFocusSessions || []) {
      if (s && s.id) byId.set(s.id, s);
    }
    for (const s of localStudySessions) {
      if (s && s.id) byId.set(s.id, s);
    }
    return Array.from(byId.values());
  }, [topicFocusSessions, localStudySessions]);

  const handleLogIntradayFocusBreakSession = (params: {
    slotKey: string;
    focusMinutes: number;
    breakMinutes: number;
    roomCode: string;
    topic: string;
    cadenceLabel?: string;
  }) => {
    const unrecordedSeconds = Math.max(
      0,
      elapsedSessionSeconds - alreadyRecordedSeconds
    );
    const verifiedMinutesAvailable = Math.floor(unrecordedSeconds / 60);
    if (verifiedMinutesAvailable < 1) {
      setCustomDurationStatusToast(
        'Run the live Study Room timer for at least 1 minute (00:01:00) before recording a focus slot.'
      );
      return;
    }
    const cleanRoom = normalizeStudyRoomCode(params.roomCode || activeRoomCode);
    const cleanTopic =
      sanitizeSafeText(params.topic || 'System Design & Deep Focus Sprint', 80) ||
      'System Design & Deep Focus Sprint';
    const clampedFocus = Math.min(
      verifiedMinutesAvailable,
      Math.max(1, Math.round(Number(params.focusMinutes) || verifiedMinutesAvailable))
    );
    const clampedBreak = Math.min(
      90,
      Math.max(0, Math.round(Number(params.breakMinutes) || 5))
    );
    const todayKey = formatDateKey(new Date());

    const newEntry: CurrentDayFocusBreakSlotRecord = {
      id: `intraday_fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dateKey: todayKey,
      slotKey: params.slotKey || '14:00',
      focusMinutes: clampedFocus,
      breakMinutes: clampedBreak,
      roomCode: cleanRoom,
      topic: cleanTopic,
      cadenceLabel:
        params.cadenceLabel || `${clampedFocus}m Focus · ${clampedBreak}m Break`,
      createdAtMs: Date.now(),
    };

    setIntradayFocusBreakLogs((prev) => {
      const next = [...prev, newEntry];
      try {
        localStorage.setItem(
          'mr_stranger_intraday_focus_break_v1',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });

    setAlreadyRecordedSeconds((prev) => prev + clampedFocus * 60);
    setLocalAddedTodayMinutes((prev) => prev + clampedFocus);
    if (onLogTopicFocusSession) {
      onLogTopicFocusSession(cleanTopic, cleanRoom, clampedFocus);
    } else {
      onFocusMinutesLogged?.(clampedFocus);
    }
  };

  const handleLogWeeklyRoomFocusMinutes = (
    roomCode: string,
    topic: string,
    minutes: number
  ) => {
    const unrecordedSeconds = Math.max(
      0,
      elapsedSessionSeconds - alreadyRecordedSeconds
    );
    const verifiedMinutesAvailable = Math.floor(unrecordedSeconds / 60);
    if (verifiedMinutesAvailable < 1) {
      setCustomDurationStatusToast(
        'Run the live Study Room timer for at least 1 minute (00:01:00) before recording room focus time.'
      );
      return;
    }
    const cleanRoom = normalizeStudyRoomCode(roomCode || activeRoomCode);
    const cleanTopic =
      sanitizeSafeText(topic || 'System Architecture & Deep Work', 80) ||
      'System Architecture & Deep Work';
    const clampedMins = Math.min(
      verifiedMinutesAvailable,
      Math.max(1, Math.round(Number(minutes) || verifiedMinutesAvailable))
    );
    const todayKey = formatDateKey(new Date());

    const newSession: TopicFocusSessionRecord = {
      id: `room_focus_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      topic: cleanTopic,
      roomCode: cleanRoom,
      focusMinutes: clampedMins,
      dateKey: todayKey,
      createdAtMs: Date.now(),
      authorUid: currentUid,
    };

    setLocalStudySessions((prev) => {
      const next = [...prev, newSession];
      try {
        localStorage.setItem('mr_stranger_topic_sessions_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setAlreadyRecordedSeconds((prev) => prev + clampedMins * 60);
    setLocalAddedTodayMinutes((prev) => prev + clampedMins);

    if (onLogTopicFocusSession) {
      onLogTopicFocusSession(cleanTopic, cleanRoom, clampedMins);
    } else {
      onFocusMinutesLogged?.(clampedMins);
    }
  };

  const handleLogFocusHistoryDailyMinutes = (params: {
    dateKey: string;
    roomCode: string;
    topic: string;
    minutes: number;
  }) => {
    const unrecordedSeconds = Math.max(
      0,
      elapsedSessionSeconds - alreadyRecordedSeconds
    );
    const verifiedMinutesAvailable = Math.floor(unrecordedSeconds / 60);
    if (verifiedMinutesAvailable < 1) {
      setCustomDurationStatusToast(
        'Run the live Study Room timer for at least 1 minute (00:01:00) before recording daily focus history.'
      );
      return;
    }
    const cleanRoom = normalizeStudyRoomCode(params.roomCode || activeRoomCode);
    const cleanTopic =
      sanitizeSafeText(params.topic || 'Deep Focus Architecture & Synthesis', 80) ||
      'Deep Focus Architecture & Synthesis';
    const clampedMins = Math.min(
      verifiedMinutesAvailable,
      Math.max(1, Math.round(Number(params.minutes) || verifiedMinutesAvailable))
    );
    const todayKey = formatDateKey(new Date());
    const targetDateKey = todayKey;

    const newSession: TopicFocusSessionRecord = {
      id: `focus_hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      topic: cleanTopic,
      roomCode: cleanRoom,
      focusMinutes: clampedMins,
      dateKey: targetDateKey,
      createdAtMs: Date.now(),
      authorUid: currentUid,
    };

    setLocalStudySessions((prev) => {
      const next = [...prev, newSession];
      try {
        localStorage.setItem('mr_stranger_topic_sessions_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setAlreadyRecordedSeconds((prev) => prev + clampedMins * 60);
    setLocalAddedTodayMinutes((prev) => prev + clampedMins);
    if (onLogTopicFocusSession) {
      onLogTopicFocusSession(cleanTopic, cleanRoom, clampedMins);
    } else {
      onFocusMinutesLogged?.(clampedMins);
    }
  };

  const weeklyFocusByRoomSummary = buildWeeklyFocusTimeByRoomCodeSummary({
    todayDateKey: formatDateKey(new Date()),
    activeRoomCode,
    todayFocusMinutes:
      todayFocusMinutes + (onLogTopicFocusSession ? 0 : localAddedTodayMinutes),
    dailyTargetMinutes,
    weeklyActivity: weeklyActivitySummary,
    storedSessions: mergedSessions,
    studyNotes: [],
    deskTimersMap: undefined,
    currentUid,
    sortBy: weeklyRoomSortBy,
    strictRealOnly: true,
  });

  const currentDayFocusBreakSummary = buildCurrentDayFocusVsBreakSummary({
    todayDateKey: formatDateKey(new Date()),
    activeRoomCode,
    roomFilter: currentDayRoomFilter,
    todayFocusMinutes:
      todayFocusMinutes + (onLogTopicFocusSession ? 0 : localAddedTodayMinutes),
    storedSessions: mergedSessions,
    intradayFocusBreakLogs,
    deskTimersMap: undefined,
    liveRoomTimerElapsedSeconds: elapsedSessionSeconds,
    liveRoomTimerRunning: isRunning,
    currentUid,
    strictRealOnly: true,
  });

  const focusHistory30DaySummary = buildFocusHistory30DaySummary({
    todayDateKey: formatDateKey(new Date()),
    todayFocusMinutes:
      todayFocusMinutes + (onLogTopicFocusSession ? 0 : localAddedTodayMinutes),
    dailyTargetMinutes,
    activeRoomCode,
    roomFilter: focusHistoryRoomFilter,
    weeklyActivity: weeklyActivitySummary,
    storedSessions: mergedSessions,
    studyNotes: [],
    deskTimersMap: undefined,
    currentUid,
    strictRealOnly: true,
  });

  const studyFocus7DayTrend = buildStudyFocus7DaySessionTrend({
    todayDateKey: formatDateKey(new Date()),
    todayFocusMinutes: todayFocusMinutes + (onLogTopicFocusSession ? 0 : localAddedTodayMinutes),
    dailyTargetMinutes,
    weeklyActivity: weeklyActivitySummary,
    storedSessions: mergedSessions,
    studyNotes: [],
    activeRoomCode,
  });

  const targetTotalSeconds = durationMinutes * 60;
  const unrecordedElapsedSeconds = Math.max(
    0,
    elapsedSessionSeconds - alreadyRecordedSeconds
  );
  const timerProgressPercent = Math.min(
    100,
    Math.round((elapsedSessionSeconds / Math.max(1, targetTotalSeconds)) * 100)
  );

  // Format primary timer display: H:MM:SS when >= 1 hour or in stopwatch mode, MM:SS when < 1 hour
  const primaryTimerText =
    timerDisplayMode === 'stopwatch'
      ? formatStudyTimerHMS(elapsedSessionSeconds, true)
      : secondsLeft >= 3600 || durationMinutes >= 60
      ? formatStudyTimerHMS(secondsLeft, true)
      : formatTimerMMSS(secondsLeft);

  const studyTogetherLobby = buildMrStrangerStudyTogetherLobby({
    activeRoomCode,
    studyDesks,
    currentUid,
    currentName,
    currentTimerText: primaryTimerText,
    isCameraEnabled: studyCamActive,
    isMicEnabled: studyMicActive,
  });

  const filteredLobbyRooms =
    selectedLobbyCategory === 'all'
      ? studyTogetherLobby.featuredAbcRooms
      : studyTogetherLobby.allRooms.filter((r) => r.category === selectedLobbyCategory);

  const selectedMindfulnessExercise =
    MR_STRANGER_MINDFULNESS_EXERCISES.find((m) => m.id === activeMindfulnessId) ||
    MR_STRANGER_MINDFULNESS_EXERCISES[0];

  return (
    <section className="space-y-8" aria-label="Study Mode and Shareable Study Room">
      {/* MR. STRANGER 24/7 STUDY TOGETHER HERO & LIVE GLOBAL SCHOLAR FOCUS GRID */}
      <div
        data-testid="mr-stranger-study-together-hero"
        className="rounded-xl border border-zinc-800/90 bg-gradient-to-br from-[#0A0A0F] via-[#090D16] to-[#08080A] p-6 lg:p-8 space-y-8 shadow-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Copy & 1-Click Join Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{studyTogetherLobby.brandName} · 24/7 Global Study Sanctuary</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
              {studyTogetherLobby.heroTitle}
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {studyTogetherLobby.heroSubtitle}
            </p>

            {/* Primary 1-Click Join CTA & Mindfulness Breather Toggle */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-testid="study-together-join-now-btn"
                onClick={() => handleQuickJoinStudyTogetherRoom()}
                className="px-6 py-3 text-sm font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-md transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-zinc-950 shrink-0" />
                <span>
                  {isSeated
                    ? `Studying Live in ${activeRoomCode}`
                    : 'Study Together now'}
                </span>
              </button>

              <button
                type="button"
                data-testid="study-mindfulness-breather-toggle"
                onClick={() => setIsMindfulnessDrawerOpen((prev) => !prev)}
                aria-expanded={isMindfulnessDrawerOpen}
                className={`px-4 py-3 text-xs font-semibold rounded-md border transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  isMindfulnessDrawerOpen
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>5-Min Mindfulness Breather</span>
              </button>
            </div>

            {lastJoinedRoomToast && (
              <div
                role="status"
                data-testid="study-together-joined-banner"
                className="p-3 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lastJoinedRoomToast}</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-300 shrink-0">
                  Live Sync Active
                </span>
              </div>
            )}

            {/* Quick Live Room Status Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400 border-t border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono font-semibold text-white tabular-nums">
                  {desksInCurrentRoom.length}
                </span>
                <span>
                  {desksInCurrentRoom.length === 1 ? 'scholar' : 'scholars'} seated in this room right now
                </span>
              </div>
              <span aria-hidden="true" className="text-zinc-700">
                ·
              </span>
              <div className="font-mono text-zinc-300">
                Active Room:{' '}
                <strong className="text-emerald-400">
                  {studyTogetherLobby.activeRoomPreset.title}
                </strong>
              </div>
            </div>

            {/* Verified Worked / Studied Time Ledger */}
            <div
              data-testid="study-room-verified-time-ledger"
              className="p-3.5 rounded-lg bg-zinc-950/90 border border-emerald-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Live Timer Elapsed
                </div>
                <div
                  data-testid="study-room-ledger-live-elapsed"
                  className="text-sm font-mono font-bold text-amber-300 tabular-nums mt-0.5"
                >
                  {formatStudyTimerHMS(elapsedSessionSeconds, true)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Studied Today
                </div>
                <div
                  data-testid="study-room-ledger-studied-today"
                  className="text-sm font-mono font-bold text-emerald-400 tabular-nums mt-0.5"
                >
                  {todayFocusMinutes} mins ({Math.floor(todayFocusMinutes / 60)}h {todayFocusMinutes % 60}m)
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  7-Day Studied Total
                </div>
                <div
                  data-testid="study-room-ledger-7day-total"
                  className="text-sm font-mono font-bold text-sky-400 tabular-nums mt-0.5"
                >
                  {weeklyActivitySummary?.totalFocusMinutes ?? todayFocusMinutes} mins
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Verified Sessions
                </div>
                <div
                  data-testid="study-room-ledger-sessions-count"
                  className="text-sm font-mono font-bold text-white tabular-nums mt-0.5"
                >
                  {mergedSessions.length} completed
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Multi-Scholar Video/Avatar Focus Grid Stage (7 cols) */}
          <div
            data-testid="mr-stranger-live-study-grid"
            className="lg:col-span-7 rounded-xl border border-zinc-800 bg-[#050507] p-4 sm:p-5 space-y-4 relative overflow-hidden"
          >
            {/* Stage Top Floating Bar: Active Room Badge + Floating Pomodoro Timer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
                  {studyTogetherLobby.activeRoomPreset.badgeLabel}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{studyTogetherLobby.activeRoomPreset.title}</span>
                    <span className="text-xs font-mono text-zinc-400">
                      ({studyTogetherLobby.activeRoomPreset.roomCode})
                    </span>
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    {studyTogetherLobby.activeRoomPreset.tagline}
                  </p>
                </div>
              </div>

              {/* Floating StudyTogether-Style Timer Pill */}
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-md bg-zinc-900/95 border border-zinc-700/80 shadow-inner">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    {isRunning ? 'Live Focus Timer' : 'Room Sprint Timer'}
                  </div>
                  <div
                    data-testid="study-stage-floating-timer"
                    className="text-sm font-mono font-bold text-white tabular-nums"
                  >
                    {primaryTimerText}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Scholar Camera / Avatar Grid (Real Seated Users Only) */}
            {desksInCurrentRoom.length === 0 ? (
              <div className="p-8 rounded-lg border border-zinc-800/80 bg-zinc-950/80 text-center space-y-2">
                <p className="text-sm font-semibold text-white">
                  No scholars seated in {activeRoomCode} yet
                </p>
                <p className="text-xs text-zinc-400">
                  Click &ldquo;+ Take Your Seat in Grid&rdquo; or &ldquo;Study Together now&rdquo; to sit at your desk and start your live verified study timer.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {desksInCurrentRoom.slice(0, 4).map((desk) => {
                  const isCurrentUser = desk.uid === currentUid;
                  return (
                    <div
                      key={desk.uid}
                      data-testid={
                        isCurrentUser
                          ? 'live-grid-tile-current-user'
                          : `live-grid-tile-${desk.uid}`
                      }
                      className={`group relative rounded-lg overflow-hidden border aspect-[16/10] bg-zinc-950 flex flex-col justify-between p-3 transition-all ${
                        isCurrentUser
                          ? 'border-emerald-500/70 ring-1 ring-emerald-500/30'
                          : 'border-zinc-800/90 hover:border-zinc-700'
                      }`}
                    >
                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 border border-white/10 text-xs font-semibold text-white truncate">
                          <span className="truncate">{desk.displayName}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-black/75 border border-white/10 text-[11px] font-mono text-emerald-300 tabular-nums shrink-0">
                          {isCurrentUser
                            ? formatStudyTimerHMS(elapsedSessionSeconds, true)
                            : `${desk.timerMinutes}m target`}
                        </span>
                      </div>
                      <div className="relative z-10 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/90">
                            {isCurrentUser
                              ? isRunning
                                ? 'Live Timer Running'
                                : 'Seated · Timer Paused'
                              : 'Seated in Room'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-zinc-100 truncate">
                          {desk.subject}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stage Footer Bar: Quick Seat Status + Room Participants */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-white font-mono tabular-nums">
                    {desksInCurrentRoom.length}
                  </strong>{' '}
                  {desksInCurrentRoom.length === 1 ? 'student' : 'students'} seated in {studyTogetherLobby.activeRoomPreset.shortTitle}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isSeated ? (
                  <button
                    type="button"
                    onClick={() => handleQuickJoinStudyTogetherRoom()}
                    className="px-3 py-1 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded transition-colors cursor-pointer"
                  >
                    + Take Your Seat in Grid
                  </button>
                ) : (
                  <span className="text-emerald-400 font-mono text-[11px]">
                    Your desk is live in {activeRoomCode}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            DEDICATED CUSTOM FOCUS SESSION DURATION BAR (OVERRIDE POMODORO)
            ==================================================================== */}
        <div
          id="study-room-custom-focus-duration-bar"
          data-testid="study-room-custom-focus-duration-bar"
          data-duration-mode={activeCustomFocusDurationSpec.mode}
          data-duration-minutes={activeCustomFocusDurationSpec.durationMinutes}
          role="region"
          aria-label="Set Custom Focus Session Duration"
          className="p-4 sm:p-5 rounded-xl bg-[#050507] border border-zinc-800/90 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white">
                  Custom Focus Session Duration
                </span>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span
                  data-testid="study-room-focus-duration-mode-badge"
                  className={`font-mono tabular-nums ${
                    activeCustomFocusDurationSpec.isCustomNonPomodoro
                      ? 'text-emerald-400 font-semibold'
                      : 'text-amber-300'
                  }`}
                >
                  {activeCustomFocusDurationSpec.modeStatusLabel}
                </span>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span
                  data-testid="study-room-focus-cadence-badge"
                  className="font-mono text-zinc-300 tabular-nums"
                >
                  {activeCustomFocusDurationSpec.sessionCadenceBadge}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Override the default 25-minute Pomodoro timer with any custom
                focus duration (1 to 720 minutes) via slider, direct minute
                entry, step controls, or saved custom presets.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <label className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepCustomDurationOnRoomJoin}
                  onChange={(e) =>
                    setKeepCustomDurationOnRoomJoin(e.target.checked)
                  }
                  data-testid="study-room-keep-custom-duration-checkbox"
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                />
                <span>Keep custom duration on room switch</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  applyCustomStudyMinutes(DEFAULT_POMODORO_FOCUS_MINUTES, {
                    toastMessage:
                      'Reset to default 25m Pomodoro focus duration (0:25:00)',
                  })
                }
                data-testid="study-room-reset-default-pomodoro-btn"
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  !activeCustomFocusDurationSpec.isCustomNonPomodoro
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                Default 25m Pomodoro
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Left 5 Cols: Custom Duration Range Slider (5m - 240m) + Step Buttons */}
            <div className="lg:col-span-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <label
                  htmlFor="study-room-custom-focus-duration-slider"
                  className="text-zinc-300"
                >
                  Drag Focus Duration (5m – 240m):
                </label>
                <span
                  data-testid="study-room-custom-slider-value-label"
                  className="text-emerald-400 font-bold tabular-nums"
                >
                  {activeCustomFocusDurationSpec.formattedDurationLabel} (
                  {activeCustomFocusDurationSpec.formattedFullHMS})
                </span>
              </div>

              <input
                id="study-room-custom-focus-duration-slider"
                type="range"
                min={5}
                max={240}
                step={5}
                value={activeCustomFocusDurationSpec.sliderMinutesValue}
                onChange={(e) => {
                  const nextMins = Number(e.target.value);
                  applyCustomStudyMinutes(nextMins);
                }}
                aria-label="Custom focus session duration slider in minutes"
                data-testid="study-room-custom-focus-duration-slider"
                className="w-full h-2 rounded-lg appearance-none bg-zinc-800 accent-emerald-400 cursor-pointer"
              />

              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {([-15, -5, 5, 15, 30] as const).map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleStepCustomFocusDuration(delta)}
                    data-testid={`study-room-custom-duration-step-${
                      delta > 0 ? `plus-${delta}` : `minus-${Math.abs(delta)}`
                    }`}
                    className="px-2.5 py-1 text-xs font-mono bg-[#0A0A0C] hover:bg-zinc-900 text-zinc-200 border border-zinc-800 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Target {delta > 0 ? `+${delta}m` : `${delta}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Middle 4 Cols: Saved Custom Non-Pomodoro Duration Chips */}
            <div className="lg:col-span-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-zinc-400">
                  Saved Custom Durations (Non-Pomodoro):
                </span>
                <button
                  type="button"
                  onClick={handleSaveCurrentCustomDurationPreset}
                  data-testid="study-room-save-custom-duration-chip-btn"
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  + Save {durationMinutes}m Preset
                </button>
              </div>
              <div
                className="flex flex-wrap items-center gap-1.5"
                data-testid="study-room-saved-custom-durations-list"
              >
                {savedCustomFocusDurations.map((mins) => {
                  const isCurrent = durationMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleSelectDuration(mins)}
                      data-testid={`study-room-saved-custom-duration-${mins}m-btn`}
                      className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                          : 'bg-[#0A0A0C] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {formatStudyDurationLabel(mins)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right 3 Cols: Direct Custom Minute Input & Apply / Start Buttons */}
            <form
              onSubmit={(e) => handleDirectCustomMinutesApply(e, false)}
              className="lg:col-span-3 space-y-2"
              data-testid="study-room-direct-custom-duration-form"
            >
              <label
                htmlFor="study-room-custom-focus-minutes-input"
                className="block text-xs font-mono text-zinc-300"
              >
                Exact Custom Minutes (1–720m):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="study-room-custom-focus-minutes-input"
                  type="number"
                  min={1}
                  max={720}
                  value={customDirectMinutesInput}
                  onChange={(e) => setCustomDirectMinutesInput(e.target.value)}
                  data-testid="study-room-custom-focus-minutes-input"
                  className="w-24 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                />
                <button
                  type="submit"
                  data-testid="study-room-apply-custom-focus-duration-btn"
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Set Duration
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDirectCustomMinutesApply(e, true)}
                  data-testid="study-room-apply-and-start-custom-focus-btn"
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Start Now
                </button>
              </div>
              {customDurationStatusToast && (
                <div
                  role="status"
                  data-testid="study-room-custom-duration-toast"
                  className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 truncate"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{customDurationStatusToast}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* 5-Minute Guided Mindfulness Breather Drawer (When Expanded) */}
        {isMindfulnessDrawerOpen && (
          <div
            data-testid="study-mindfulness-drawer"
            className="p-5 rounded-lg bg-[#050507] border border-sky-500/30 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
                  MR. STRANGER MINDFULNESS SANCTUARY
                </span>
                <h3 className="text-base font-bold text-white">
                  Take a 5-Minute Guided Mindfulness Breather
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMindfulnessDrawerOpen(false)}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-900 rounded border border-zinc-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MR_STRANGER_MINDFULNESS_EXERCISES.map((ex) => {
                const isSelected = ex.id === selectedMindfulnessExercise.id;
                return (
                  <div
                    key={ex.id}
                    className={`p-4 rounded-lg border flex flex-col justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500/50'
                        : 'bg-[#0A0A0C] border-zinc-800/80'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">{ex.title}</span>
                        <span className="text-[11px] font-mono text-sky-300">
                          {ex.durationMinutes} min
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-sky-400/90">
                        {ex.cadenceLabel}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {ex.guidanceText}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-testid={`start-mindfulness-${ex.id}`}
                      onClick={() => handleStartMindfulnessSession(ex.id)}
                      className="w-full py-2 px-3 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-zinc-950 rounded transition-colors cursor-pointer"
                    >
                      Start {ex.durationMinutes}m Mindfulness Session
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* LIVE VISUAL POMODORO COUNTDOWN TIMER (SYNCHRONIZED WITH ACTIVE SESSION) */}
      <StudyRoomVisualCountdownTimer
        activeRoomCode={activeRoomCode}
        activeSubject={subject || `Studying: ${activeBook.title}`}
        durationMinutes={durationMinutes}
        secondsLeft={secondsLeft}
        elapsedSessionSeconds={elapsedSessionSeconds}
        unrecordedElapsedSeconds={unrecordedElapsedSeconds}
        isRunning={isRunning}
        onToggleStartPause={() => setIsRunning((prev) => !prev)}
        onResetTimer={() => {
          setIsRunning(false);
          setSecondsLeft(durationMinutes * 60);
          setElapsedSessionSeconds(0);
          setAlreadyRecordedSeconds(0);
          setVerificationFeedback(null);
        }}
        onSelectDurationMinutes={(mins) => handleSelectDuration(mins)}
        onRecordConductedTime={handleRecordRealElapsedTime}
      />

      {/* "EASY AS ABC" : 24/7 MR. STRANGER LIVE STUDY ROOMS LOBBY */}
      <div
        data-testid="mr-stranger-live-room-lobby"
        className="p-6 rounded-xl border border-zinc-800/90 bg-[#0A0A0C] space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              EASY AS ABC · INSTANT 1-CLICK ROOM JOIN
            </span>
            <h2 className="text-xl font-bold text-white">
              Choose Your 24/7 Mr. Stranger Study Room
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Pick a room format below and click <strong className="text-white">Join now</strong>: your desk, timer, and room soundscape configure automatically so everyone can join properly.
            </p>
          </div>

          {/* Room Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Featured 24/7 Rooms (4)' },
                { id: 'live_in_app', label: 'Live-in app' },
                { id: 'live_audio', label: 'Live Audio' },
                { id: 'with_camera', label: 'With Camera' },
                { id: 'global_hall', label: 'Global Hall' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedLobbyCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  selectedLobbyCategory === tab.id
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-[#050505] text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Signature StudyTogether-Style Room Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredLobbyRooms.map((room) => (
            <div
              key={room.id}
              data-testid={`study-lobby-card-${room.id}`}
              className={`rounded-lg border overflow-hidden flex flex-col justify-between bg-[#050507] transition-all ${
                room.isActiveRoom
                  ? 'border-emerald-500/70 ring-1 ring-emerald-500/30'
                  : 'border-zinc-800/90 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Room Cover Image & Category Badge */}
                <div className="relative h-36 overflow-hidden bg-zinc-900">
                  <img
                    src={room.coverImage}
                    alt={room.title}
                    className="w-full h-full object-cover opacity-75"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-black/30 to-black/40" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-black/80 border border-white/15 text-[11px] font-mono font-semibold text-emerald-300">
                      {room.badgeLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/80 border border-white/10 text-[11px] font-mono text-zinc-200 tabular-nums">
                      {studyDesks.filter((d) => d.roomCode === room.roomCode).length} seated
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h3 className="text-base font-bold text-white truncate">
                      {room.title}
                    </h3>
                  </div>
                </div>

                {/* Room Description & Metadata */}
                <div className="p-4 space-y-3">
                  <div className="text-[11px] font-mono text-emerald-400">
                    {room.tagline}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {room.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/80">
                    <span>Code: {room.roomCode}</span>
                    <span>{room.defaultDurationMinutes}m block</span>
                  </div>
                </div>
              </div>

              {/* 1-Click "Join now" Button */}
              <div className="p-4 pt-0">
                <button
                  type="button"
                  data-testid={`study-together-join-room-${room.id}`}
                  onClick={() => handleQuickJoinStudyTogetherRoom(room.id)}
                  className={`w-full py-2.5 px-4 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    room.isCurrentUserSeatedHere
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-white hover:bg-zinc-200 text-black'
                  }`}
                >
                  <span>{room.ctaLabel}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "JUST A STUDY ROOM? THINK AGAIN!" : 3 MR. STRANGER STUDY PILLARS */}
      <div
        data-testid="mr-stranger-study-pillars"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {MR_STRANGER_STUDY_PILLARS.map((pillar) => (
          <div
            key={pillar.id}
            className="p-5 rounded-xl border border-zinc-800/80 bg-[#0A0A0C] flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                  {pillar.eyebrow}
                </span>
                <HeartHandshake className="w-4 h-4 text-zinc-500 shrink-0" />
              </div>
              <h3 className="text-base font-bold text-white">{pillar.title}</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {pillar.description}
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/70">
              <span className="inline-block text-[11px] font-mono text-zinc-400">
                {pillar.highlightBadge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Header & Shareable Room Invite Strip */}
      <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Study Mode & Live Study Sanctuary
              </h2>
              <span aria-hidden="true" className="text-xs text-zinc-600">
                ·
              </span>
              <span
                data-testid="study-room-all-sounds-status"
                className={`text-xs font-mono tabular-nums ${
                  isAllSoundsMuted ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {isAllSoundsMuted
                  ? 'All System & Ambient Sounds Muted'
                  : `System & Ambient Sounds Active (${effectiveVolumePercent}% Vol)`}
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              Full custom control over your study hours & minutes, strict real-timer verified recording, and interactive Study Books library.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-w-full">
            <button
              type="button"
              onClick={handleToggleAllStudyRoomSounds}
              aria-pressed={isAllSoundsMuted}
              aria-label={
                isAllSoundsMuted
                  ? 'Unmute all system and ambient sound effects'
                  : 'Mute all system and ambient sound effects'
              }
              data-testid="study-room-mute-all-sounds-btn"
              className={`px-3.5 py-2 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                isAllSoundsMuted
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-800'
              }`}
            >
              {isAllSoundsMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span>
                {isAllSoundsMuted ? 'Unmute All Sounds' : 'Mute All Sounds'}
              </span>
            </button>

            {isSeated ? (
              <button
                type="button"
                onClick={() => {
                  closeAllStudyHardware();
                  onLeaveDesk();
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-md hover:bg-rose-500/25 transition-colors whitespace-nowrap shrink-0"
              >
                Leave Study Desk
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onJoinDesk(
                    activeRoomCode,
                    newRoomTitle,
                    subject || `Studying: ${activeBook.title}`,
                    'Every real timer-verified minute compounds.',
                    durationMinutes
                  )
                }
                className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md transition-colors whitespace-nowrap shrink-0 max-w-full truncate"
              >
                Sit at Desk in {activeRoomCode}
              </button>
            )}
          </div>
        </div>

        {/* Invite Friends by Code or Link Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
          <div className="lg:col-span-5 p-4 rounded-md bg-[#050505] border border-zinc-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Active Study Room Code</span>
              <span className="text-emerald-400 font-mono tabular-nums">
                {desksInCurrentRoom.length} {desksInCurrentRoom.length === 1 ? 'Scholar' : 'Scholars'} Seated
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className="text-base font-mono font-bold tracking-wider text-white tabular-nums whitespace-nowrap shrink-0"
                data-testid="active-room-code"
              >
                {activeRoomCode}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyInvite('code')}
                  className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 rounded whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  {copiedFeedback === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFeedback === 'code' ? 'Copied Code' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyInvite('link')}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                >
                  {copiedFeedback === 'link' ? 'Copied Invite Link' : 'Copy Invite Link'}
                </button>
              </div>
            </div>
            <div className="text-[11px] font-mono text-zinc-500 truncate">
              {inviteUrl}
            </div>
          </div>

          <form onSubmit={handleJoinByCode} className="lg:col-span-4 space-y-1.5">
            <label htmlFor="join-room-code-input" className="block text-xs font-medium text-zinc-300">
              Join Friend's Study Room via Code
            </label>
            <div className="flex gap-2">
              <input
                id="join-room-code-input"
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="ROOM-8F4K2A"
                className="flex-1 px-3.5 py-2 text-xs font-mono uppercase bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded-md whitespace-nowrap shrink-0"
              >
                Join Room
              </button>
            </div>
          </form>

          <div className="lg:col-span-3 space-y-1.5">
            <label htmlFor="create-room-title" className="block text-xs font-medium text-zinc-300">
              Create Shareable Room
            </label>
            <div className="flex gap-2">
              <input
                id="create-room-title"
                type="text"
                value={newRoomTitle}
                onChange={(e) => setNewRoomTitle(e.target.value)}
                placeholder="Room title..."
                className="flex-1 px-3 py-2 text-xs bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={handleCreatePrivateStudyRoom}
                className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
              >
                New Code
              </button>
            </div>
          </div>
        </div>

        {/* Permission-First Camera & Microphone Hardware Privacy Gate (Closed by Default) */}
        <div
          className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 flex flex-wrap items-center justify-between gap-4"
          data-testid="study-hardware-gate"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Study Room Camera & Microphone Hardware Gate</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="font-mono text-zinc-400">
                Mic: {studyMicActive ? 'OPEN' : 'CLOSED'} · Cam: {studyCamActive ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{hardwareStatusNote}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!hardwarePermissionGranted ? (
              <button
                type="button"
                onClick={handleRequestStudyMediaPermission}
                className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
              >
                Grant Mic/Cam Permission
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleStudyMic}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    studyMicActive
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  {studyMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  <span>{studyMicActive ? 'Close Study Mic' : 'Open Study Mic'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleStudyCam}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    studyCamActive
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  {studyCamActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  <span>{studyCamActive ? 'Close Study Camera' : 'Open Study Camera'}</span>
                </button>
                {(studyMicActive || studyCamActive) && (
                  <button
                    type="button"
                    onClick={() => {
                      closeAllStudyHardware();
                      setHardwareStatusNote('All Study Room camera and microphone tracks closed.');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-md hover:bg-rose-500/25 whitespace-nowrap shrink-0"
                  >
                    Lock Hardware
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Dedicated Ambient Soundscape Volume & Local Environment Balance Control */}
        <div
          id="study-room-ambient-volume-balance-bar"
          data-testid="study-room-ambient-volume-balance-bar"
          role="region"
          aria-label="Ambient Soundscape Volume and Local Environment Balance Control"
          className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 space-y-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
                <label
                  htmlFor="study-room-ambient-volume-slider"
                  className="font-semibold text-white cursor-pointer"
                >
                  Ambient Soundscape Volume &amp; Local Environment Balance
                </label>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span
                  data-testid="study-room-environment-balance-label"
                  className="font-mono text-emerald-400 tabular-nums"
                >
                  {ambientBalanceSpec.balanceZoneLabel}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {ambientBalanceSpec.recommendedUseCase}:{' '}
                <span className="font-mono text-zinc-300">
                  {ambientBalanceSpec.activeLayersSummary}
                </span>
              </p>
            </div>

            {/* Balance Zone Presets */}
            <div
              className="flex flex-wrap items-center gap-1.5 shrink-0"
              role="group"
              aria-label="Ambient soundscape to local environment balance presets"
            >
              {AMBIENT_ENVIRONMENT_BALANCE_PRESETS.map((preset) => {
                const isSelected =
                  !ambientBalanceSpec.isMuted &&
                  ambientBalanceSpec.effectiveVolumePercent === preset.percent;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      handleAdjustAmbientBalanceVolume(preset.percent)
                    }
                    title={preset.environmentHint}
                    data-testid={`study-room-balance-preset-${preset.percent}`}
                    className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                        : 'bg-[#0A0A0C] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ambient Soundscape Preset Switcher (Dropdown + Preset Buttons: Rain, Cafe, Forest, White Noise, etc.) */}
          <div
            data-testid="study-room-ambient-preset-switcher"
            className="p-3 rounded-md bg-[#0A0A0C] border border-zinc-800/90 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <label
                  htmlFor="study-room-ambient-preset-select"
                  className="font-semibold text-white whitespace-nowrap"
                >
                  Ambient Soundscape Preset:
                </label>
                <select
                  id="study-room-ambient-preset-select"
                  aria-label="Select Ambient Soundscape Preset"
                  data-testid="study-room-ambient-preset-select"
                  value={activeSoundscapePresetSummary.activePresetId}
                  onChange={(e) => handleSelectSoundscapePreset(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono bg-[#050505] text-white border border-zinc-700 hover:border-emerald-500/60 focus:border-emerald-400 rounded-md cursor-pointer focus:outline-none"
                >
                  {STUDY_ROOM_AMBIENT_SOUNDSCAPE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                  {activeSoundscapePresetSummary.isCustomBlend && (
                    <option value="custom">
                      {activeSoundscapePresetSummary.displayLabel}
                    </option>
                  )}
                </select>
                <span
                  data-testid="study-room-active-preset-badge"
                  className="text-[11px] font-mono text-emerald-400 tabular-nums"
                >
                  Active: {activeSoundscapePresetSummary.shortLabel} ·{' '}
                  {activeSoundscapePresetSummary.acousticProfile}
                </span>
              </div>

              <span className="text-[11px] text-zinc-400">
                {activeSoundscapePresetSummary.description}
              </span>
            </div>

            {/* Dedicated Preset Buttons (Rain, Cafe, Forest, White Noise, Alpha Focus, Lo-Fi Chords, Rainy Café, Off) */}
            <div
              role="group"
              aria-label="Ambient Soundscape Preset Buttons"
              data-testid="study-room-ambient-preset-buttons"
              className="flex flex-wrap items-center gap-1.5"
            >
              {STUDY_ROOM_AMBIENT_SOUNDSCAPE_PRESETS.map((preset) => {
                const isPresetSelected =
                  activeSoundscapePresetSummary.activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={isPresetSelected}
                    onClick={() => handleSelectSoundscapePreset(preset.id)}
                    title={preset.description}
                    data-testid={`study-room-preset-btn-${preset.id}`}
                    className={`px-2.5 py-1.5 rounded text-xs font-mono border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isPresetSelected
                        ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                        : 'bg-[#050505] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    {renderPresetSwitcherIcon(preset.id)}
                    <span>{preset.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Equal-Power Cross-Fade Transition Status Bar & Duration Selector */}
            <div
              data-testid="study-room-crossfade-status-bar"
              data-crossfade-active={isCrossfading ? 'true' : 'false'}
              className="pt-2 border-t border-zinc-800/80 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    data-testid="study-room-crossfade-status-badge"
                    className={
                      isCrossfading
                        ? 'text-emerald-300 font-semibold'
                        : 'text-zinc-300'
                    }
                  >
                    {isCrossfading && activeCrossfadePlan
                      ? `${activeCrossfadePlan.activeTransitionBadgeLabel} · ${crossfadeProgressPercent}%`
                      : activeCrossfadePlan
                      ? activeCrossfadePlan.settledBadgeLabel
                      : `Equal-Power Cross-Fade Ready (${(crossfadeDurationMs / 1000).toFixed(1)}s) · Smooth Preset Transitions`}
                  </span>

                  {activeCrossfadePlan && activeCrossfadePlan.hasAudioShift && (
                    <span
                      data-testid="study-room-crossfade-envelope-summary"
                      className="text-zinc-400"
                    >
                      {activeCrossfadePlan.fadingOutTracks.length > 0 && (
                        <span>
                          Fade Out:{' '}
                          <strong className="text-amber-300">
                            {activeCrossfadePlan.fadingOutTracks
                              .map(
                                (t) =>
                                  activeCrossfadePlan.trackEnvelopes[t]?.label ||
                                  t
                              )
                              .join(', ')}
                          </strong>{' '}
                        </span>
                      )}
                      {activeCrossfadePlan.fadingInTracks.length > 0 && (
                        <span>
                          · Fade In:{' '}
                          <strong className="text-emerald-400">
                            {activeCrossfadePlan.fadingInTracks
                              .map(
                                (t) =>
                                  activeCrossfadePlan.trackEnvelopes[t]?.label ||
                                  t
                              )
                              .join(', ')}
                          </strong>
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Cross-Fade Duration Selector */}
                <div
                  className="flex items-center gap-1.5"
                  role="group"
                  aria-label="Cross-fade transition duration options"
                >
                  <label
                    htmlFor="study-room-crossfade-duration-select"
                    className="text-zinc-400 whitespace-nowrap"
                  >
                    Cross-Fade:
                  </label>
                  <select
                    id="study-room-crossfade-duration-select"
                    aria-label="Ambient Cross-Fade Duration"
                    data-testid="study-room-crossfade-duration-select"
                    value={crossfadeDurationMs}
                    onChange={(e) =>
                      handleChangeCrossfadeDurationMs(Number(e.target.value))
                    }
                    className="px-2 py-0.5 text-[11px] font-mono bg-[#050505] text-zinc-200 border border-zinc-800 rounded cursor-pointer"
                  >
                    {AMBIENT_CROSSFADE_DURATION_OPTIONS.map((opt) => (
                      <option key={opt.durationMs} value={opt.durationMs}>
                        {opt.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Smooth Equal-Power Cross-Fade Progress Indicator */}
              <div className="w-full h-1.5 rounded-full bg-[#050505] border border-zinc-800/90 overflow-hidden">
                <div
                  data-testid="study-room-crossfade-progress-bar"
                  data-progress={crossfadeProgressPercent}
                  className={`h-full transition-all duration-75 ${
                    isCrossfading ? 'bg-emerald-400' : 'bg-emerald-500/50'
                  }`}
                  style={{ width: `${crossfadeProgressPercent}%` }}
                />
              </div>

              {isCrossfading && crossfadeInterpolatedGains && (
                <div
                  data-testid="study-room-crossfade-live-gains"
                  className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-400 tabular-nums"
                >
                  <span className="text-emerald-400">
                    Live Equal-Power Gain Envelope:
                  </span>
                  {AMBIENT_SOUNDSCAPES.map((s) => {
                    const gainPct = Math.round(
                      (crossfadeInterpolatedGains[s.id as AmbientTrackId] ?? 0) *
                        100
                    );
                    if (gainPct <= 0) return null;
                    return (
                      <span key={s.id} className="text-zinc-200">
                        {s.shortLabel}: <strong>{gainPct}%</strong>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dedicated Volume Range Slider + Visual Dual-Balance Meter + Fine Step Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-7 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleMuteWorkspaceAudio}
                aria-label={
                  ambientBalanceSpec.isMuted
                    ? 'Unmute ambient soundscapes'
                    : 'Mute ambient soundscapes'
                }
                data-testid="study-room-ambient-mute-btn"
                className={`p-2 rounded border transition-colors cursor-pointer shrink-0 ${
                  ambientBalanceSpec.isMuted
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-[#0A0A0C] border-zinc-800 text-emerald-400 hover:border-zinc-700'
                }`}
              >
                {ambientBalanceSpec.isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleAdjustAmbientBalanceVolume(undefined, -5)}
                aria-label="Decrease ambient soundscape volume by 5 percent"
                data-testid="study-room-ambient-vol-minus-btn"
                className="px-2 py-1 text-xs font-mono bg-[#0A0A0C] hover:bg-zinc-900 text-zinc-300 border border-zinc-800 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                -5%
              </button>

              <div className="flex-1 space-y-1">
                <input
                  id="study-room-ambient-volume-slider"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={effectiveVolumePercent}
                  aria-label="Ambient Soundscape Volume"
                  aria-valuetext={ambientBalanceSpec.sliderAriaValueText}
                  onChange={(e) =>
                    handleAdjustAmbientBalanceVolume(Number(e.target.value))
                  }
                  data-testid="study-room-ambient-volume-slider"
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 tabular-nums">
                  <span>
                    Ambient Soundscapes:{' '}
                    <strong className="text-emerald-400">
                      {effectiveVolumePercent}%
                    </strong>
                  </span>
                  <span>
                    Local Room Awareness:{' '}
                    <strong className="text-zinc-200">
                      {ambientBalanceSpec.localEnvironmentSharePercent}%
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAdjustAmbientBalanceVolume(undefined, 5)}
                aria-label="Increase ambient soundscape volume by 5 percent"
                data-testid="study-room-ambient-vol-plus-btn"
                className="px-2 py-1 text-xs font-mono bg-[#0A0A0C] hover:bg-zinc-900 text-zinc-300 border border-zinc-800 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                +5%
              </button>

              <span
                data-testid="study-room-ambient-volume-readout"
                className="text-sm font-mono font-bold tabular-nums text-white min-w-[46px] text-right shrink-0"
              >
                {effectiveVolumePercent}%
              </span>
            </div>

            {/* Quick Soundscape Layer Toggles Right in the Balance Bar */}
            <div className="lg:col-span-5 flex flex-wrap items-center justify-start lg:justify-end gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 mr-1 whitespace-nowrap">
                Layer Mix:
              </span>
              {AMBIENT_SOUNDSCAPES.map((sound) => {
                const trackId = sound.id as AmbientTrackId;
                const layer = ambientMixState.layers[trackId];
                const isTrackOn = Boolean(
                  layer?.enabled && layer.volumePercent > 0
                );
                return (
                  <button
                    key={sound.id}
                    type="button"
                    aria-pressed={isTrackOn}
                    onClick={() => handleToggleSoundscapeLayer(sound.id)}
                    data-testid={`study-room-quick-sound-${sound.id}`}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono border flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isTrackOn
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                        : 'bg-[#0A0A0C] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {renderSoundscapeIcon(sound.id)}
                    <span>{sound.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          DEDICATED INDIVIDUAL STUDY DESK POMODORO TIMER CONTROLLER
          ==================================================================== */}
      <StudyDeskPomodoroController
        activeRoomCode={activeRoomCode}
        currentUid={currentUid}
        isRoomTimerRunning={isRunning}
        roomTimerRemainingSeconds={secondsLeft}
        roomTimerTotalSeconds={targetTotalSeconds}
        deskTimersList={Object.values(individualDeskTimersMap)}
        onStartPauseDesk={handleStartPauseIndividualDeskPomodoro}
        onResetDesk={handleResetIndividualDeskPomodoro}
        onApplyDeskCustomDuration={handleApplyIndividualDeskCustomDuration}
        onStartAllDesks={handleStartAllIndividualDesks}
        onPauseAllDesks={handlePauseAllIndividualDesks}
        onResetAllDesks={handleResetAllIndividualDesks}
        onCreateCustomDeskTimer={handleCreateCustomDeskTimer}
      />

      {/* ====================================================================
          RECHARTS BAR CHART: WEEKLY TOTAL FOCUS TIME PER ROOM CODE
          ==================================================================== */}
      <StudyRoomWeeklyRoomFocusRechartsCard
        summary={weeklyFocusByRoomSummary}
        activeRoomCode={activeRoomCode}
        sortBy={weeklyRoomSortBy}
        onChangeSortBy={setWeeklyRoomSortBy}
        onSelectRoomCode={(code, roomLabel) => {
          onChangeRoomCode(code, roomLabel);
        }}
        onLogRoomFocusMinutes={handleLogWeeklyRoomFocusMinutes}
      />

      {/* ====================================================================
          RECHARTS DYNAMIC LINE CHART: TODAY'S FOCUS SESSIONS VS. BREAK PERIODS
          ==================================================================== */}
      <StudyRoomCurrentDayFocusBreakRechartsCard
        summary={currentDayFocusBreakSummary}
        activeRoomCode={activeRoomCode}
        selectedRoomFilter={currentDayRoomFilter}
        onChangeRoomFilter={setCurrentDayRoomFilter}
        onLogIntradayFocusBreakSession={handleLogIntradayFocusBreakSession}
      />

      {/* ====================================================================
          RECHARTS LINE CHART: FOCUS HISTORY (PAST 30 DAYS DAILY FOCUS MINUTES)
          ==================================================================== */}
      <StudyRoomFocusHistory30DayRechartsCard
        summary={focusHistory30DaySummary}
        activeRoomCode={activeRoomCode}
        dailyTargetMinutes={dailyTargetMinutes}
        selectedRoomFilter={focusHistoryRoomFilter}
        onChangeRoomFilter={setFocusHistoryRoomFilter}
        onLogDailyFocusMinutes={handleLogFocusHistoryDailyMinutes}
      />

      {/* ====================================================================
          FULL CUSTOM STUDY TIMER CONTROL & STRICT REAL-TIMER RECORDING LEDGER
          ==================================================================== */}
      <div
        className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-6"
        data-testid="study-custom-timer-panel"
        aria-label="Custom Study Timer Control and Strict Real-Timer Recording"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
              <h2 className="text-lg font-bold text-white">
                Custom Study Time Controller & Real-Timer Verification Ledger
              </h2>
              <span aria-hidden="true" className="text-xs text-zinc-600">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400">
                <Lock className="w-3 h-3" />
                <span>Strict Real-Timer Recording Enforced</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Set the exact hours and minutes you want to study. Study sessions are strictly recorded from the real running timer: if you study 2 hours (2:00:00), you cannot record 3 hours (3:00:00) without the timer going until 3:00:00.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setTimerDisplayMode((prev) =>
                  prev === 'countdown' ? 'stopwatch' : 'countdown'
                )
              }
              data-testid="study-timer-mode-toggle"
              className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 rounded-md whitespace-nowrap"
            >
              {timerDisplayMode === 'countdown'
                ? 'Mode: Countdown (Switch to Count-Up 0:00:00 → 3:00:00)'
                : 'Mode: Count-Up Stopwatch (Switch to Countdown)'}
            </button>
          </div>
        </div>

        {/* Main 12-Col Grid: Left 7 Cols = Custom Duration & Live Clock, Right 5 Cols = Real-Timer Verification Guard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Custom Hours/Minutes Setter, Presets & Dual Clock */}
          <div className="lg:col-span-7 space-y-5">
            {/* Custom Duration Presets (15m up to 4 Hours) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">
                  Choose Any Study Duration Preset or Enter Custom Hours & Minutes:
                </span>
                <span className="font-mono text-emerald-400" data-testid="study-active-target-label">
                  Target: {formatStudyDurationLabel(durationMinutes)} ({formatStudyTimerHMS(targetTotalSeconds, true)})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CUSTOM_STUDY_DURATION_PRESETS.map((preset) => {
                  const isCurrent = durationMinutes === preset.minutes;
                  return (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => handleSelectDuration(preset.minutes)}
                      data-testid={`study-preset-${preset.minutes}m`}
                      className={`p-2.5 rounded-md border text-left transition-colors ${
                        isCurrent
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-[#050505] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{preset.hmsLabel}</div>
                      <div
                        className={`text-[11px] ${
                          isCurrent ? 'text-zinc-800' : 'text-zinc-400'
                        }`}
                      >
                        {preset.fullLabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hours & Minutes Input Form + Daily Goal Setter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <form
                onSubmit={handleCustomDurationFormSubmit}
                className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 space-y-3"
                data-testid="study-custom-duration-form"
              >
                <div className="text-xs font-bold text-white">
                  Set Custom Session Duration (Hours & Minutes)
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label
                      htmlFor="study-custom-hours"
                      className="block text-[11px] font-mono text-zinc-400"
                    >
                      Hours (0–12h)
                    </label>
                    <input
                      id="study-custom-hours"
                      type="number"
                      min={0}
                      max={12}
                      value={customHoursInput}
                      onChange={(e) => setCustomHoursInput(e.target.value)}
                      data-testid="study-custom-hours-input"
                      className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="study-custom-minutes"
                      className="block text-[11px] font-mono text-zinc-400"
                    >
                      Minutes (0–59m)
                    </label>
                    <input
                      id="study-custom-minutes"
                      type="number"
                      min={0}
                      max={59}
                      value={customMinutesInput}
                      onChange={(e) => setCustomMinutesInput(e.target.value)}
                      data-testid="study-custom-minutes-input"
                      className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  data-testid="study-apply-custom-duration-btn"
                  className="w-full py-2 px-3 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded transition-colors"
                >
                  Apply Custom Study Time
                </button>
              </form>

              <form
                onSubmit={handleSaveDailyTargetFromStudyMode}
                className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 space-y-3"
                data-testid="study-daily-goal-form"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Daily Study Goal Target
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {formatStudyDurationLabel(dailyTargetMinutes)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label
                      htmlFor="study-daily-goal-hours"
                      className="block text-[11px] font-mono text-zinc-400"
                    >
                      Daily Goal Hours
                    </label>
                    <input
                      id="study-daily-goal-hours"
                      type="number"
                      min={0}
                      max={12}
                      value={dailyGoalHoursInput}
                      onChange={(e) => setDailyGoalHoursInput(e.target.value)}
                      data-testid="study-daily-goal-hours-input"
                      className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="study-daily-goal-mins"
                      className="block text-[11px] font-mono text-zinc-300"
                    >
                      Daily Goal Mins
                    </label>
                    <input
                      id="study-daily-goal-mins"
                      type="number"
                      min={0}
                      max={59}
                      value={dailyGoalMinsInput}
                      onChange={(e) => setDailyGoalMinsInput(e.target.value)}
                      data-testid="study-daily-goal-mins-input"
                      className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  data-testid="study-daily-goal-save-btn"
                  className="w-full py-2 px-3 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded transition-colors"
                >
                  Save Daily Study Goal
                </button>
              </form>
            </div>

            {/* Live Dual Clock Display (Target Countdown + Real Elapsed Timer 0:00:00 -> 3:00:00) */}
            <div className="p-6 rounded-lg bg-[#050505] border border-zinc-800/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-zinc-400">
                  Active Subject / Book:{' '}
                  <strong className="text-white" data-testid="study-timer-active-subject">
                    {subject || `Studying: ${activeBook.title}`}
                  </strong>
                </span>
                <span className="text-emerald-400">
                  Target Clock: {formatStudyTimerHMS(targetTotalSeconds, true)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center py-2">
                <div className="text-center sm:text-left space-y-1">
                  <div className="text-[11px] font-mono uppercase text-zinc-400">
                    {timerDisplayMode === 'stopwatch'
                      ? 'Live Stopwatch Clock (H:MM:SS)'
                      : 'Session Timer Display'}
                  </div>
                  <div
                    className="text-5xl sm:text-6xl font-bold font-mono tabular-nums tracking-tight text-white"
                    data-testid="study-timer-display"
                  >
                    {primaryTimerText}
                  </div>
                  <div
                    className="text-xs font-mono text-zinc-400"
                    data-testid="study-timer-hms-display"
                  >
                    Remaining: {formatStudyTimerHMS(secondsLeft, true)} / Target:{' '}
                    {formatStudyTimerHMS(targetTotalSeconds, true)}
                  </div>
                </div>

                <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800 text-center sm:text-right space-y-1">
                  <div className="text-[11px] font-mono uppercase text-emerald-400">
                    Real Timer Conducted (Verified)
                  </div>
                  <div
                    className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-emerald-400"
                    data-testid="study-real-elapsed-display"
                  >
                    {formatStudyTimerHMS(elapsedSessionSeconds, true)}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    Unrecorded Elapsed: {formatStudyTimerHMS(unrecordedElapsedSeconds, true)} ({timerProgressPercent}% of target)
                  </div>
                </div>
              </div>

              {/* Real Elapsed Progress Bar toward Target */}
              <div className="space-y-1.5">
                <div className="w-full h-2.5 bg-[#0A0A0C] border border-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${timerProgressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>0:00:00 Start</span>
                  <span>
                    {isRunning
                      ? `Conducting live in ${activeRoomCode}...`
                      : `Ready for ${formatStudyDurationLabel(durationMinutes)}`}
                  </span>
                  <span>{formatStudyTimerHMS(targetTotalSeconds, true)} Target</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRunning((prev) => !prev)}
                  data-testid="study-start-pause-timer-btn"
                  className="flex-1 py-2.5 px-4 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  {isRunning ? 'Pause Focus Timer' : 'Start Focus Timer'}
                </button>
                <button
                  type="button"
                  onClick={handleRecordRealElapsedTime}
                  data-testid="study-record-conducted-time-btn"
                  className="py-2.5 px-4 text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  Record Real Conducted Time ({formatStudyTimerHMS(unrecordedElapsedSeconds, true)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setSecondsLeft(durationMinutes * 60);
                    setElapsedSessionSeconds(0);
                    setAlreadyRecordedSeconds(0);
                    setVerificationFeedback(null);
                  }}
                  data-testid="study-reset-timer-btn"
                  className="py-2.5 px-4 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Strict Real-Timer Recording Enforcement & Claim Verifier */}
          <div
            className="lg:col-span-5 p-5 rounded-md bg-[#050505] border border-zinc-800/80 space-y-4"
            data-testid="study-real-timer-recorder-panel"
          >
            <div className="space-y-1 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-Timer Integrity & Recording Guard</span>
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">
                  Anti-Inflation Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Recorded study values are locked to your real elapsed timer. If you study 2 hours (<span className="font-mono text-white">2:00:00</span>), you cannot make it 3 hours (<span className="font-mono text-white">3:00:00</span>) without the timer going until <span className="font-mono text-white">3:00:00</span>.
              </p>
            </div>

            {/* Claim Verification Form */}
            <form
              onSubmit={handleVerifyClaimedDuration}
              className="space-y-3"
              data-testid="study-claim-verifier-panel"
            >
              <div className="text-xs font-semibold text-zinc-200">
                Verify & Record Study Duration Against Real Timer:
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label
                    htmlFor="claim-study-hours"
                    className="block text-[11px] font-mono text-zinc-400"
                  >
                    Claim Hours
                  </label>
                  <input
                    id="claim-study-hours"
                    type="number"
                    min={0}
                    max={12}
                    value={claimHoursInput}
                    onChange={(e) => setClaimHoursInput(e.target.value)}
                    data-testid="study-claim-hours-input"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="claim-study-minutes"
                    className="block text-[11px] font-mono text-zinc-400"
                  >
                    Claim Minutes
                  </label>
                  <input
                    id="claim-study-minutes"
                    type="number"
                    min={0}
                    max={59}
                    value={claimMinutesInput}
                    onChange={(e) => setClaimMinutesInput(e.target.value)}
                    data-testid="study-claim-minutes-input"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  data-testid="study-verify-claim-btn"
                  className="flex-1 py-2 px-3 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded transition-colors whitespace-nowrap"
                >
                  Verify & Record Claimed Time
                </button>
              </div>
            </form>

            {/* Verification Result Banner */}
            {verificationFeedback && (
              <div
                data-testid="study-timer-verification-alert"
                role="status"
                className={`p-3.5 rounded-md border text-xs space-y-1.5 ${
                  verificationFeedback.allowed
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-bold">
                  <span className="flex items-center gap-1.5">
                    {verificationFeedback.allowed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span>
                      {verificationFeedback.allowed
                        ? 'REAL-TIMER VERIFIED'
                        : 'UNVERIFIED TIME BLOCKED'}
                    </span>
                  </span>
                  <span>
                    Timer: {verificationFeedback.actualElapsedFormattedHMS} / Claimed:{' '}
                    {verificationFeedback.claimedFormattedHMS}
                  </span>
                </div>
                <p className="leading-relaxed">{verificationFeedback.reason}</p>
              </div>
            )}

            {/* Verified Sessions Ledger */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">
                  Real-Timer Verified Sessions Ledger
                </span>
                <span className="font-mono text-zinc-500">
                  {verifiedSessionsLedger.length} logged this session
                </span>
              </div>
              {verifiedSessionsLedger.length === 0 ? (
                <p className="text-[11px] text-zinc-500">
                  Run the focus timer and click "Record Real Conducted Time" to log verified study time.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {verifiedSessionsLedger.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2 rounded bg-[#0A0A0C] border border-zinc-800 flex items-center justify-between text-[11px] font-mono"
                    >
                      <span className="text-zinc-200 truncate max-w-[180px]">
                        {entry.bookOrTopic}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {entry.conductedHMS} ({entry.minutesRecorded}m)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          COMPLETE STUDY BOOKS & INTERACTIVE READING SANCTUARY
          ==================================================================== */}
      <StudyBooksLibrary
        books={studyBooks}
        activeBookId={activeBook.id}
        onSelectActiveBook={handleSelectActiveBook}
        onAddCustomBook={handleAddCustomBook}
        bookProgressMap={bookProgressMap}
        onUpdateBookProgress={handleUpdateBookProgress}
        isTimerRunning={isRunning}
        currentSessionElapsedSeconds={unrecordedElapsedSeconds}
        onStartTimerWithBook={handleStartTimerWithBook}
      />

      {/* Multi-Layer Ambient Soundscapes Mixer (Simultaneous Overlay + Individual Volume Controls) */}
      <div
        className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-5"
        data-testid="ambient-soundscape-panel"
        aria-label="Multi-Layer Ambient Soundscapes Mixer"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                className="text-base font-bold text-white"
                data-testid="ambient-soundscapes-heading"
              >
                Multi-Layer Ambient Soundscape Mixer
              </h2>
              <span aria-hidden="true" className="text-xs text-zinc-500">
                ·
              </span>
              <span
                className="text-xs font-mono text-zinc-400"
                data-testid="ambient-active-layers-count"
              >
                {activeAmbientLayers.length} {activeAmbientLayers.length === 1 ? 'Layer' : 'Layers'} Active
              </span>
              <span aria-hidden="true" className="text-xs text-zinc-500">
                ·
              </span>
              <span
                className="text-xs font-mono tabular-nums text-emerald-400"
                data-testid="active-soundscape-status"
              >
                {formatAmbientMultiLayerStatus(ambientMixState)}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Overlay multiple synthesized soundscapes simultaneously (Rainfall, Coffee Shop, White Noise, 432Hz Alpha Focus, and Lo-Fi Chords) and fine-tune each soundscape&apos;s individual volume slider to craft your custom focus environment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleMuteWorkspaceAudio}
              aria-pressed={ambientMixState.isMasterMuted}
              data-testid="ambient-mute-toggle-btn"
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                ambientMixState.isMasterMuted
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
              }`}
            >
              {ambientMixState.isMasterMuted ? (
                <VolumeX className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{ambientMixState.isMasterMuted ? 'Unmute Master Mix' : 'Mute Master Mix'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleSoundscapeLayer('off')}
              disabled={activeAmbientLayers.length === 0}
              data-testid="ambient-stop-btn"
              className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 border border-zinc-800 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Stop All Layers</span>
            </button>
          </div>
        </div>

        {/* One-Click Multi-Layer Focus Mix Presets */}
        <div
          className="space-y-2"
          data-testid="ambient-mix-presets-row"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-zinc-300">
              Quick Multi-Layer Overlay Mix Presets:
            </span>
            <span className="font-mono text-zinc-400">
              Click any preset or toggle individual soundscapes below to layer them together
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {AMBIENT_MIX_PRESETS.map((mixPreset) => {
              const presetKeys = Object.keys(mixPreset.layers) as AmbientTrackId[];
              const isPresetActive =
                activeAmbientLayers.length === presetKeys.length &&
                presetKeys.every(
                  (k) =>
                    ambientMixState.layers[k]?.enabled &&
                    ambientMixState.layers[k]?.volumePercent === mixPreset.layers[k]
                );
              return (
                <button
                  key={mixPreset.id}
                  type="button"
                  onClick={() => handleApplyMixPreset(mixPreset.id)}
                  aria-pressed={isPresetActive}
                  data-testid={`ambient-mix-preset-${mixPreset.id}`}
                  className={`p-3 rounded-md border text-left transition-colors space-y-1 ${
                    isPresetActive
                      ? 'bg-white text-black border-white'
                      : 'bg-[#050505] text-zinc-200 border-zinc-800/80 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{mixPreset.label}</span>
                    <span
                      className={`text-[10px] font-mono uppercase ${
                        isPresetActive ? 'text-black font-bold' : 'text-emerald-400'
                      }`}
                    >
                      {presetKeys.length} Layers
                    </span>
                  </div>
                  <div
                    className={`text-[11px] font-mono ${
                      isPresetActive ? 'text-zinc-800' : 'text-zinc-400'
                    }`}
                  >
                    {mixPreset.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Master Mix Output Volume Controls */}
        <div
          className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 flex flex-wrap items-center justify-between gap-4"
          data-testid="ambient-volume-controls"
        >
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
            <div className="flex items-center gap-2">
              {ambientMixState.isMasterMuted || effectiveVolumePercent === 0 ? (
                <VolumeX className="w-4 h-4 text-zinc-500 shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <label
                htmlFor="soundscape-volume"
                className="text-xs font-semibold text-zinc-200 whitespace-nowrap"
              >
                Master Mix Volume
              </label>
            </div>

            <input
              id="soundscape-volume"
              type="range"
              min={0}
              max={100}
              value={effectiveVolumePercent}
              onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
              aria-label="Master Mix Volume"
              data-testid="ambient-volume-slider"
              className="w-36 sm:w-48 accent-white cursor-pointer"
            />

            <span
              className="text-xs font-mono font-bold tabular-nums text-white min-w-[42px]"
              data-testid="ambient-volume-value"
            >
              {effectiveVolumePercent}%
            </span>

            {activeAmbientLayers.length > 0 && (
              <span
                className="text-xs font-mono text-zinc-400"
                data-testid="ambient-active-overlay-mix-summary"
              >
                Active Overlay:{' '}
                <strong className="text-white">
                  {activeAmbientLayers
                    .map((l) => {
                      const m = AMBIENT_SOUNDSCAPES.find((s) => s.id === l.id);
                      return `${m?.shortLabel || l.id} ${l.volumePercent}%`;
                    })
                    .join(' + ')}
                </strong>
              </span>
            )}
          </div>

          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Master volume presets"
          >
            <span className="text-xs text-zinc-500 mr-1">Master Levels:</span>
            {AMBIENT_VOLUME_PRESETS.map((preset) => {
              const isCurrentLevel =
                !ambientMixState.isMasterMuted &&
                ambientMixState.masterVolumePercent === preset.percent;
              return (
                <button
                  key={preset.percent}
                  type="button"
                  onClick={() => handleMasterVolumeChange(preset.percent)}
                  data-testid={`ambient-volume-preset-${preset.percent}`}
                  className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                    isCurrentLevel
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-[#0A0A0C] text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-Layer Soundscape Cards with Individual Toggle & Individual Volume Controls */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          role="group"
          aria-label="Multi-layer ambient sound profiles and individual volume controls"
        >
          {AMBIENT_SOUNDSCAPES.map((preset) => {
            const trackId = preset.id as AmbientTrackId;
            const layerState =
              ambientMixState.layers[trackId] ||
              DEFAULT_AMBIENT_MULTI_LAYER_MIX_STATE.layers[trackId];
            const isLayerActive = Boolean(layerState?.enabled && layerState.volumePercent > 0);
            const layerVolume = layerState?.volumePercent ?? 60;
            const effectiveLayerPct = Math.round(
              getEffectiveAmbientLayerGain(ambientMixState, trackId) * 100
            );

            return (
              <div
                key={preset.id}
                data-testid={`ambient-layer-card-${preset.id}`}
                className={`p-4 rounded-md border transition-colors flex flex-col justify-between gap-3.5 ${
                  isLayerActive
                    ? 'bg-[#111318] border-emerald-500/60 text-white'
                    : 'bg-[#050505] border-zinc-800/80 text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white min-w-0">
                      {renderSoundscapeIcon(preset.id)}
                      <span className="truncate" title={preset.label}>
                        {preset.label}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-pressed={isLayerActive}
                      aria-label={`Toggle ${preset.label} layer`}
                      data-testid={`ambient-profile-${preset.id}`}
                      onClick={() => handleToggleSoundscapeLayer(preset.id)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors whitespace-nowrap shrink-0 ${
                        isLayerActive
                          ? 'bg-white text-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {isLayerActive ? 'Layer On' : 'Layer Off'}
                    </button>
                  </div>

                  <p className="text-[11px] leading-relaxed text-zinc-400">
                    {preset.subtitle}
                  </p>
                </div>

                {/* Individual Layer Volume Slider & Quick Levels */}
                <div className="pt-2.5 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between gap-1 text-[11px] font-mono whitespace-nowrap">
                    <label
                      htmlFor={`layer-vol-${preset.id}`}
                      className="text-zinc-400"
                    >
                      Volume
                    </label>
                    <span
                      className={`font-bold tabular-nums ${
                        isLayerActive ? 'text-emerald-400' : 'text-zinc-500'
                      }`}
                      data-testid={`ambient-layer-volume-value-${preset.id}`}
                    >
                      {layerVolume}% {isLayerActive ? `(Out ${effectiveLayerPct}%)` : '(Muted)'}
                    </span>
                  </div>

                  <input
                    id={`layer-vol-${preset.id}`}
                    type="range"
                    min={0}
                    max={100}
                    value={layerVolume}
                    onChange={(e) =>
                      handleLayerVolumeChange(trackId, Number(e.target.value))
                    }
                    aria-label={`${preset.label} individual volume`}
                    data-testid={`ambient-layer-volume-slider-${preset.id}`}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />

                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    {[25, 50, 75, 100].map((pct) => {
                      const isPctSelected = isLayerActive && layerVolume === pct;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleLayerVolumeChange(trackId, pct)}
                          data-testid={`ambient-layer-preset-${preset.id}-${pct}`}
                          className={`flex-1 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                            isPctSelected
                              ? 'bg-white text-black border-white font-bold'
                              : 'bg-[#0A0A0C] text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {pct}%
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[10px] font-mono text-zinc-500 truncate pt-0.5">
                    {preset.frequencyProfile}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* D3 7-Day Completed Study Focus Minutes & Individual Session Growth Chart */}
      <StudyFocus7DayD3Chart
        trendSummary={studyFocus7DayTrend}
        activeRoomCode={activeRoomCode}
        onLogStudySession={handleLogStudySessionFromChart}
      />

      {/* Curated Study Modules Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STUDY_MODULES.map((mod) => {
          const isCurrent = durationMinutes === mod.minutes;
          return (
            <div
              key={mod.id}
              className="p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-zinc-400">{mod.cadence}</div>
                <h2 className="text-sm font-bold text-white">{mod.title}</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">{mod.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectDuration(mod.minutes)}
                className={`w-full py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                }`}
              >
                Load {formatStudyDurationLabel(mod.minutes).split(' (')[0]} Module Timer
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Study Checklist & Positive Note Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Study Session Checklist Module */}
          <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4">
            <h2 className="text-base font-bold text-white">Study Module Checklist</h2>
            <div className="space-y-2">
              {studyTasks.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 p-2.5 rounded-md bg-[#050505] border border-zinc-800/80 text-xs text-zinc-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() =>
                      setStudyTasks((prev) =>
                        prev.map((item) =>
                          item.id === t.id ? { ...item, completed: !item.completed } : item
                        )
                      )
                    }
                    className="rounded accent-white"
                  />
                  <span className={t.completed ? 'line-through text-zinc-500' : ''}>
                    {t.title}
                  </span>
                </label>
              ))}
            </div>
            <form onSubmit={handleAddStudyTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a study module goal..."
                aria-label="New study task"
                className="flex-1 px-3 py-2 text-xs bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded-md whitespace-nowrap shrink-0"
              >
                Add Goal
              </button>
            </form>
          </div>

          {/* Post a Positive Study Intention */}
          <form
            onSubmit={handlePublishIntention}
            className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4"
          >
            <h2 className="text-base font-bold text-white">
              Share Positive Note in {activeRoomCode}
            </h2>
            <div className="space-y-1.5">
              <label htmlFor="study-subject" className="block text-xs font-medium text-zinc-300">
                Study Subject / Active Book Topic
              </label>
              <input
                id="study-subject"
                type="text"
                maxLength={100}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Studying: Designing Data-Intensive Applications"
                className="w-full px-3.5 py-2 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="study-positive-note" className="block text-xs font-medium text-zinc-300">
                Positive Note for Friends in Room
              </label>
              <textarea
                id="study-positive-note"
                rows={3}
                maxLength={400}
                value={positiveNote}
                onChange={(e) => setPositiveNote(e.target.value)}
                placeholder="Share an encouraging note for everyone in this study room..."
                className="w-full px-3.5 py-2 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {formError && <p className="text-xs text-rose-400">{formError}</p>}

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Publish Positive Note & Sit at Desk
            </button>
          </form>
        </div>

        {/* Right Column: Live Study Desks in Room, Positive Notes Wall & Room Chit-Chat (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  Live Desks in Room {activeRoomCode} ({desksInCurrentRoom.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Share code <strong className="text-white font-mono">{activeRoomCode}</strong> with friends so they appear right here.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">Live Sync</span>
            </div>

            {desksInCurrentRoom.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4">
                No desks occupied in {activeRoomCode} yet. Click "Sit at Desk in {activeRoomCode}" above to start studying!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {desksInCurrentRoom.map((desk) => {
                  const deskTimerState =
                    individualDeskTimersMap[desk.uid] ||
                    createIndividualStudyDeskPomodoroState({
                      deskUid: desk.uid,
                      displayName: desk.displayName,
                      roomCode: desk.roomCode,
                      subject: desk.subject,
                      positiveNote: desk.positiveNote,
                      initialMinutes: desk.timerMinutes,
                    });
                  return (
                    <IndividualStudyDeskPomodoroCard
                      key={desk.uid}
                      deskState={deskTimerState}
                      isCurrentUserDesk={desk.uid === currentUid}
                      isRoomTimerRunning={isRunning}
                      roomTimerRemainingSeconds={secondsLeft}
                      roomTimerTotalSeconds={targetTotalSeconds}
                      onStartPause={handleStartPauseIndividualDeskPomodoro}
                      onReset={handleResetIndividualDeskPomodoro}
                      onApplyCustomDuration={handleApplyIndividualDeskCustomDuration}
                      compact={true}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Positive Notes Wall */}
          <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h2 className="text-base font-bold text-white">
                Positive Study Notes ({notesInCurrentRoom.length})
              </h2>
              <span className="text-xs text-zinc-500 font-mono">Firestore Synced</span>
            </div>

            {notesInCurrentRoom.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4">
                No study notes posted in this room yet. Post the first positive note on the left!
              </p>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {notesInCurrentRoom.map((note) => (
                  <div key={note.id} className="py-3.5 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="font-semibold text-white">{note.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{note.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Room {note.roomCode}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatStudyDurationLabel(note.focusMinutes)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-100">{note.positiveNote}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Study Room Chit-Chat */}
          <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Room {activeRoomCode} Study Lounge Chat ({currentName})
              </h2>
              <span className="text-xs text-zinc-500 font-mono">WebSocket Live</span>
            </div>
            <div className="h-44 overflow-y-auto bg-[#050505] border border-zinc-800/80 rounded-md p-3 space-y-2">
              {chatInCurrentRoom.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Quiet study room lounge. Send a message to peers in {activeRoomCode}!
                </p>
              ) : (
                chatInCurrentRoom.map((msg) => (
                  <div key={msg.id} className="text-xs leading-relaxed">
                    <span className="font-semibold text-white">{msg.senderName}: </span>
                    <span className="text-zinc-300">{msg.text}</span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Message everyone in ${activeRoomCode}...`}
                aria-label="Study room chat message"
                className="flex-1 px-3.5 py-2 text-xs bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
