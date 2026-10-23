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
} from '../utils/rules';
import { soundEngine } from '../utils/audio';
import { StudyFocus7DayD3Chart } from './StudyFocus7DayD3Chart';
import { StudyBooksLibrary } from './StudyBooksLibrary';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Coffee,
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
} from 'lucide-react';

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
  todayFocusMinutes = 65,
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

  // Custom Duration Inputs (Hours + Minutes)
  const [customHoursInput, setCustomHoursInput] = useState<string>(() =>
    String(Math.floor(durationMinutes / 60))
  );
  const [customMinutesInput, setCustomMinutesInput] = useState<string>(() =>
    String(durationMinutes % 60)
  );
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
    return {
      book_ddia: {
        bookId: 'book_ddia',
        currentPage: 42,
        completedChapterNumbers: [1],
        verifiedSecondsStudied: 3600,
        personalNotes:
          'Chapter 1 synthesis: Tail latency (p99) governs perceived reliability in multi-tier services.',
        lastStudiedAtMs: Date.now() - 86400_000,
      },
    };
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

  const applyCustomStudyMinutes = (mins: number) => {
    const config = parseAndClampCustomStudyDuration({ totalMinutes: mins });
    setDurationMinutes(config.totalMinutes);
    setSecondsLeft(config.totalSeconds);
    setElapsedSessionSeconds(0);
    setAlreadyRecordedSeconds(0);
    setCustomHoursInput(String(config.hours));
    setCustomMinutesInput(String(config.minutes));
    setIsRunning(false);
    setVerificationFeedback(null);
    try {
      localStorage.setItem(
        'mr_stranger_custom_study_duration_v1',
        String(config.totalMinutes)
      );
    } catch {
      // ignore
    }
  };

  const handleSelectDuration = (mins: number) => {
    applyCustomStudyMinutes(mins);
  };

  const handleCustomDurationFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config = parseAndClampCustomStudyDuration({
      hours: customHoursInput,
      minutes: customMinutesInput,
    });
    applyCustomStudyMinutes(config.totalMinutes);
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

  const syncAndPersistAmbientMix = (nextMix: AmbientMultiLayerMixState) => {
    setAmbientMixState(nextMix);
    try {
      localStorage.setItem(
        'mr_stranger_ambient_multilayer_mix_v1',
        JSON.stringify(nextMix)
      );
    } catch {
      // ignore storage errors
    }
    soundEngine.syncMultiLayerMix(getEffectiveAmbientMixMap(nextMix));
  };

  const handleToggleSoundscapeLayer = (clickedId: AmbientPresetId) => {
    if (clickedId === 'off') {
      const stopped = stopAllAmbientLayers(ambientMixState);
      syncAndPersistAmbientMix(stopped);
      return;
    }
    const nextMix = toggleAmbientLayer(ambientMixState, clickedId);
    syncAndPersistAmbientMix(nextMix);
  };

  const handleLayerVolumeChange = (trackId: AmbientTrackId, nextPercent: number) => {
    const nextMix = updateAmbientLayerVolume(ambientMixState, trackId, nextPercent);
    syncAndPersistAmbientMix(nextMix);
  };

  const handleMasterVolumeChange = (nextPercent: number) => {
    const nextMix = updateAmbientMasterVolume(ambientMixState, nextPercent);
    syncAndPersistAmbientMix(nextMix);
  };

  const handleToggleMuteWorkspaceAudio = () => {
    const nextMix = toggleAmbientMasterMute(ambientMixState);
    syncAndPersistAmbientMix(nextMix);
  };

  const handleApplyMixPreset = (presetId: string) => {
    const nextMix = applyAmbientMixPreset(ambientMixState, presetId);
    syncAndPersistAmbientMix(nextMix);
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
      elapsedSessionSeconds >= 60 ? verifiedMinutesSoFar : durationMinutes
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
  const effectiveVolumePercent = ambientMixState.isMasterMuted
    ? 0
    : ambientMixState.masterVolumePercent;

  const mergedSessions =
    topicFocusSessions && topicFocusSessions.length > 0
      ? topicFocusSessions
      : localStudySessions;

  const studyFocus7DayTrend = buildStudyFocus7DaySessionTrend({
    todayDateKey: formatDateKey(new Date()),
    todayFocusMinutes: todayFocusMinutes + (onLogTopicFocusSession ? 0 : localAddedTodayMinutes),
    dailyTargetMinutes,
    weeklyActivity: weeklyActivitySummary,
    storedSessions: mergedSessions,
    studyNotes,
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

  return (
    <section className="space-y-8" aria-label="Study Mode and Shareable Study Room">
      {/* Top Header & Shareable Room Invite Strip */}
      <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Study Mode & Live Study Sanctuary
              </h1>
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
      </div>

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
              Set the exact hours and minutes you want to study. Study sessions are strictly recorded from the real running timer — if you study 2 hours (2:00:00), you cannot record 3 hours (3:00:00) without the timer going until 3:00:00.
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
                <button
                  type="button"
                  onClick={handleCheck2HoursVs3HoursRule}
                  data-testid="study-check-2h-vs-3h-rule-btn"
                  className="py-2 px-3 text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-800 rounded transition-colors whitespace-nowrap"
                >
                  Test 2:00:00 vs 3:00:00 Rule
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
                {desksInCurrentRoom.map((desk) => (
                  <div
                    key={desk.uid}
                    className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-semibold text-white">{desk.displayName}</span>
                      <span className="font-mono tabular-nums">
                        {formatStudyDurationLabel(desk.timerMinutes)} block
                      </span>
                    </div>
                    <div className="text-xs font-medium text-emerald-400">{desk.subject}</div>
                    <p className="text-xs text-zinc-300 leading-relaxed">"{desk.positiveNote}"</p>
                  </div>
                ))}
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
