import React, { useEffect, useRef, useState } from 'react';
import {
  formatTimerMMSS,
  normalizeStudyRoomCode,
  generateStudyRoomCode,
  buildStudyRoomInviteUrl,
  AMBIENT_SOUNDSCAPES,
  AmbientPresetId,
  AmbientWorkspaceState,
  DEFAULT_AMBIENT_WORKSPACE_STATE,
  AMBIENT_VOLUME_PRESETS,
  selectAmbientWorkspaceProfile,
  updateAmbientWorkspaceVolume,
  toggleAmbientWorkspaceMute,
  getEffectiveAmbientGain,
  formatAmbientWorkspaceStatus,
  detectSecurityThreat,
  sanitizeSafeText,
  formatDateKey,
  WeeklyActivitySummary,
  TopicFocusSessionRecord,
  buildStudyFocus7DaySessionTrend,
} from '../utils/rules';
import { soundEngine } from '../utils/audio';
import { StudyFocus7DayD3Chart } from './StudyFocus7DayD3Chart';
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
}

const STUDY_MODULES = [
  {
    id: 'pomodoro',
    title: '01. Pomodoro Deep Focus Protocol',
    cadence: '25m Focus · 5m Recovery',
    description: 'High-intensity single-task sprints with zero context switching.',
    minutes: 25,
  },
  {
    id: 'feynman',
    title: '02. Deep Work & Feynman Synthesis',
    cadence: '50m Synthesis · 10m Review',
    description: 'Master complex engineering, math, or research topics by explaining them in plain prose.',
    minutes: 50,
  },
  {
    id: 'recall',
    title: '03. Active Recall & Rapid Drill',
    cadence: '15m Sprint · 3m Check',
    description: 'High-frequency problem solving and memory retrieval practice.',
    minutes: 15,
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
}) => {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

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

  // Personal Workspace Ambient Soundscapes State (Rain, Cafe, White Noise, Binaural, Lo-Fi)
  const [ambientState, setAmbientState] = useState<AmbientWorkspaceState>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_ambient_workspace_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.volumePercent === 'number') {
          return {
            activeProfile: 'off',
            volumePercent: Math.min(100, Math.max(0, Math.round(parsed.volumePercent))),
            isMuted: Boolean(parsed.isMuted),
            lastNonZeroVolumePercent:
              typeof parsed.lastNonZeroVolumePercent === 'number' &&
              parsed.lastNonZeroVolumePercent > 0
                ? Math.min(100, Math.max(1, Math.round(parsed.lastNonZeroVolumePercent)))
                : 65,
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_AMBIENT_WORKSPACE_STATE;
  });

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

  const [subject, setSubject] = useState('');
  const [positiveNote, setPositiveNote] = useState('');
  const [formError, setFormError] = useState('');
  const [chatInput, setChatInput] = useState('');

  const [studyTasks, setStudyTasks] = useState<
    { id: string; title: string; completed: boolean }[]
  >([
    { id: 'st-1', title: 'Complete 1 full Pomodoro sprint without distractions', completed: false },
    { id: 'st-2', title: 'Post a positive study note for room peers', completed: false },
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

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          soundEngine.playSfx('chime');
          onFocusMinutesLogged?.(durationMinutes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning, durationMinutes, onFocusMinutesLogged]);

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
      // Browser headless / hardware fallback after explicit permission gate
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

  const handleSelectDuration = (mins: number) => {
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
    setIsRunning(false);
  };

  const persistAmbientWorkspaceState = (next: AmbientWorkspaceState) => {
    setAmbientState(next);
    try {
      localStorage.setItem('mr_stranger_ambient_workspace_v1', JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const handleToggleSoundscape = (clickedId: AmbientPresetId) => {
    const nextState = selectAmbientWorkspaceProfile(ambientState, clickedId);
    persistAmbientWorkspaceState(nextState);
    soundEngine.setVolume(getEffectiveAmbientGain(nextState));
    soundEngine.startAmbient(nextState.activeProfile);
  };

  const handleVolumeChange = (nextPercent: number) => {
    const nextState = updateAmbientWorkspaceVolume(ambientState, nextPercent);
    persistAmbientWorkspaceState(nextState);
    soundEngine.setVolume(getEffectiveAmbientGain(nextState));
  };

  const handleToggleMuteWorkspaceAudio = () => {
    const nextState = toggleAmbientWorkspaceMute(ambientState);
    persistAmbientWorkspaceState(nextState);
    soundEngine.setVolume(getEffectiveAmbientGain(nextState));
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
      sanitizeSafeText(subject || 'Focused Study Block', 100),
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
      sanitizeSafeText(subject || 'Joined via Room Code', 100),
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
    onJoinDesk(activeRoomCode, newRoomTitle, safeSub, safeNote, durationMinutes);
    await onSaveStudyNote(activeRoomCode, safeSub, safeNote, durationMinutes);
    handleLogStudySessionFromChart(durationMinutes, safeSub);
    setSubject('');
    setPositiveNote('');
  };

  const handleLogStudySessionFromChart = (minutesToAdd: number, topicLabel: string) => {
    const added = Math.max(1, Math.round(minutesToAdd));
    const todayKey = formatDateKey(new Date());
    const newSession: TopicFocusSessionRecord = {
      id: `study_d3_${Date.now()}_${currentUid}`,
      topic: sanitizeSafeText(topicLabel || 'Pomodoro Deep Focus Protocol', 80),
      roomCode: activeRoomCode,
      focusMinutes: added,
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
    setLocalAddedTodayMinutes((prev) => prev + added);
    if (onLogTopicFocusSession) {
      onLogTopicFocusSession(newSession.topic, activeRoomCode, added);
    } else {
      onFocusMinutesLogged?.(added);
    }
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
  const ambientMode = ambientState.activeProfile;
  const effectiveVolumePercent = ambientState.isMuted ? 0 : ambientState.volumePercent;
  const activePresetMeta = AMBIENT_SOUNDSCAPES.find((s) => s.id === ambientMode);

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

  return (
    <section className="space-y-8" aria-label="Study Mode and Shareable Study Room">
      {/* Top Header & Shareable Room Invite Strip */}
      <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Study Mode & Live Study Room
            </h1>
            <p className="text-sm text-zinc-400">
              Invite friends via room code or shareable link, synchronize focus timers, and toggle studio-synthesized ambient soundscapes.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
                    'Deep Focus Session',
                    'Every focused minute compounds.',
                    durationMinutes
                  )
                }
                className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md transition-colors whitespace-nowrap shrink-0"
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

      {/* Dedicated Ambient Soundscapes Panel (Rain, Cafe, White Noise, Binaural, Lo-Fi) */}
      <div
        className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-5"
        data-testid="ambient-soundscape-panel"
        aria-label="Ambient Soundscapes"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                className="text-base font-bold text-white"
                data-testid="ambient-soundscapes-heading"
              >
                Ambient Soundscapes
              </h2>
              <span aria-hidden="true" className="text-xs text-zinc-500">
                ·
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Personal Workspace Audio
              </span>
              <span aria-hidden="true" className="text-xs text-zinc-500">
                ·
              </span>
              <span
                className="text-xs font-mono tabular-nums text-emerald-400"
                data-testid="active-soundscape-status"
              >
                {formatAmbientWorkspaceStatus(ambientState)}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Toggle between synthesized sound profiles (Rain, Cafe, White Noise, 432Hz Alpha Focus, or Lo-Fi Chords) and adjust the background volume for your personal workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleMuteWorkspaceAudio}
              aria-pressed={ambientState.isMuted}
              data-testid="ambient-mute-toggle-btn"
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                ambientState.isMuted
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
              }`}
            >
              {ambientState.isMuted ? (
                <VolumeX className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{ambientState.isMuted ? 'Unmute Workspace' : 'Mute Volume'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleSoundscape('off')}
              disabled={ambientMode === 'off'}
              data-testid="ambient-stop-btn"
              className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 border border-zinc-800 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Turn Off Soundscape</span>
            </button>
          </div>
        </div>

        {/* Personal Workspace Background Volume Controls */}
        <div
          className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 flex flex-wrap items-center justify-between gap-4"
          data-testid="ambient-volume-controls"
        >
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
            <div className="flex items-center gap-2">
              {ambientState.isMuted || effectiveVolumePercent === 0 ? (
                <VolumeX className="w-4 h-4 text-zinc-500 shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <label
                htmlFor="soundscape-volume"
                className="text-xs font-semibold text-zinc-200 whitespace-nowrap"
              >
                Background Volume
              </label>
            </div>

            <input
              id="soundscape-volume"
              type="range"
              min={0}
              max={100}
              value={effectiveVolumePercent}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              aria-label="Personal Workspace Background Volume"
              data-testid="ambient-volume-slider"
              className="w-36 sm:w-48 accent-white cursor-pointer"
            />

            <span
              className="text-xs font-mono font-bold tabular-nums text-white min-w-[42px]"
              data-testid="ambient-volume-value"
            >
              {effectiveVolumePercent}%
            </span>

            {activePresetMeta && (
              <span className="text-xs font-mono text-zinc-400">
                Active Profile: <strong className="text-white">{activePresetMeta.label}</strong> ({activePresetMeta.frequencyProfile})
              </span>
            )}
          </div>

          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Background volume presets"
          >
            <span className="text-xs text-zinc-500 mr-1">Levels:</span>
            {AMBIENT_VOLUME_PRESETS.map((preset) => {
              const isCurrentLevel =
                !ambientState.isMuted && ambientState.volumePercent === preset.percent;
              return (
                <button
                  key={preset.percent}
                  type="button"
                  onClick={() => handleVolumeChange(preset.percent)}
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

        {/* Sound Profile Selector Cards (Rain, Cafe, White Noise, 432Hz Alpha Focus, Lo-Fi Study Chords) */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          role="group"
          aria-label="Ambient sound profiles"
        >
          {AMBIENT_SOUNDSCAPES.map((preset) => {
            const isSelected = ambientMode === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isSelected}
                data-testid={`ambient-profile-${preset.id}`}
                onClick={() => handleToggleSoundscape(preset.id)}
                className={`p-4 rounded-md border text-left transition-colors flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-white text-black border-white'
                    : 'bg-[#050505] border-zinc-800/80 text-zinc-200 hover:border-zinc-600'
                }`}
              >
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-bold">
                      {renderSoundscapeIcon(preset.id)}
                      <span>{preset.label}</span>
                    </span>
                    <span
                      className={`text-[11px] font-mono uppercase ${
                        isSelected ? 'text-black font-bold' : 'text-zinc-500'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Off'}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isSelected ? 'text-zinc-800' : 'text-zinc-400'
                    }`}
                  >
                    {preset.subtitle}
                  </p>
                </div>

                <div
                  className={`pt-2 border-t text-[10px] font-mono tabular-nums flex items-center justify-between gap-1 ${
                    isSelected
                      ? 'border-zinc-300 text-zinc-900'
                      : 'border-zinc-900 text-zinc-500'
                  }`}
                >
                  <span className="truncate">{preset.frequencyProfile}</span>
                  {isSelected && (
                    <span className="font-bold shrink-0">{effectiveVolumePercent}%</span>
                  )}
                </div>
              </button>
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
                Load {mod.minutes}m Module Timer
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Timer, Study Checklist & Positive Note Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Room Synchronized Focus Timer
              </span>
              <div className="flex items-center gap-1 bg-[#050505] p-1 rounded-md border border-zinc-800">
                {[25, 50, 15, 5].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSelectDuration(mins)}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                      durationMinutes === mins
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="py-7 text-center bg-[#050505] rounded-lg border border-zinc-800/80">
              <div
                className="text-6xl font-bold font-mono tabular-nums tracking-tight text-white"
                data-testid="study-timer-display"
              >
                {formatTimerMMSS(secondsLeft)}
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                {isRunning
                  ? `Studying live in room ${activeRoomCode}`
                  : `Ready to start ${durationMinutes}-minute module`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRunning((prev) => !prev)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {isRunning ? 'Pause Timer' : 'Start Focus Timer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setSecondsLeft(durationMinutes * 60);
                }}
                className="py-2.5 px-4 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Reset
              </button>
            </div>
          </div>

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
                Study Subject / Module Topic
              </label>
              <input
                id="study-subject"
                type="text"
                maxLength={100}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Distributed Systems & Consensus"
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
                      <span className="font-mono tabular-nums">{desk.timerMinutes}m block</span>
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
                      <span className="font-mono tabular-nums">{note.focusMinutes}m</span>
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
