import React, { useEffect, useState } from 'react';
import {
  formatTimerMMSS,
  normalizeStudyRoomCode,
  generateStudyRoomCode,
  buildStudyRoomInviteUrl,
} from '../utils/rules';
import { soundEngine } from '../utils/audio';

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
  onJoinDesk: (roomCode: string, roomName: string, subject: string, positiveNote: string, timerMinutes: number) => void;
  onLeaveDesk: () => void;
  onSaveStudyNote: (roomCode: string, subject: string, positiveNote: string, focusMinutes: number) => Promise<void>;
  onSendStudyChat: (roomCode: string, text: string) => void;
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
}) => {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientMode, setAmbientMode] = useState<'off' | 'rain' | 'binaural' | 'lofi'>('off');

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newRoomTitle, setNewRoomTitle] = useState('Deep Work Study Room');
  const [copiedFeedback, setCopiedFeedback] = useState<'code' | 'link' | null>(null);

  const [subject, setSubject] = useState('');
  const [positiveNote, setPositiveNote] = useState('');
  const [formError, setFormError] = useState('');
  const [chatInput, setChatInput] = useState('');

  // Personal study checklist tasks inside Study Mode
  const [studyTasks, setStudyTasks] = useState<
    { id: string; title: string; completed: boolean }[]
  >([
    { id: 'st-1', title: 'Complete 1 full Pomodoro sprint without distractions', completed: false },
    { id: 'st-2', title: 'Post a positive study note for room peers', completed: false },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const inviteUrl = buildStudyRoomInviteUrl(window.location.origin, activeRoomCode);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          soundEngine.playSfx('chime');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    return () => {
      soundEngine.stopAmbient();
    };
  }, []);

  const handleSelectDuration = (mins: number) => {
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
    setIsRunning(false);
  };

  const handleAmbientChange = (mode: 'off' | 'rain' | 'binaural' | 'lofi') => {
    setAmbientMode(mode);
    soundEngine.startAmbient(mode);
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
    onChangeRoomCode(generated, newRoomTitle || `Study Room ${generated}`);
    onJoinDesk(
      generated,
      newRoomTitle || `Study Room ${generated}`,
      subject || 'Focused Study Block',
      positiveNote || 'Let us crush our goals together!',
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
      subject || 'Joined via Room Code',
      positiveNote || 'Studying live with friends.',
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
    setFormError('');
    onJoinDesk(activeRoomCode, newRoomTitle, trimmedSubject, trimmedNote, durationMinutes);
    await onSaveStudyNote(activeRoomCode, trimmedSubject, trimmedNote, durationMinutes);
    setSubject('');
    setPositiveNote('');
  };

  const handleAddStudyTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
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
    onSendStudyChat(activeRoomCode, trimmed);
    setChatInput('');
  };

  const desksInCurrentRoom = studyDesks.filter((d) => d.roomCode === activeRoomCode);
  const notesInCurrentRoom = studyNotes.filter(
    (n) => !n.roomCode || n.roomCode === activeRoomCode || activeRoomCode === 'STUDY-GLOBAL'
  );
  const chatInCurrentRoom = studyChat.filter(
    (c) => !c.roomCode || c.roomCode === activeRoomCode
  );
  const isSeated = desksInCurrentRoom.some((d) => d.uid === currentUid);

  return (
    <section className="space-y-6" aria-label="Study Mode and Shareable Study Room">
      {/* Top Header & Shareable Room Invite Banner */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Study Mode & Live Study Room
            </h1>
            <p className="text-sm text-slate-400">
              Invite friends with a shareable room code or direct link, synchronize your focus timer, and study with synthesized ambient soundscapes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSeated ? (
              <button
                type="button"
                onClick={onLeaveDesk}
                className="px-4 py-2 text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/40 rounded-lg hover:bg-rose-600/30 whitespace-nowrap shrink-0"
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
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg whitespace-nowrap shrink-0"
              >
                Sit at Desk in {activeRoomCode}
              </button>
            )}
          </div>
        </div>

        {/* Invite Friends by Code or Link Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-5 p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Study Room Code</span>
              <span className="text-emerald-400 font-medium">
                {desksInCurrentRoom.length} {desksInCurrentRoom.length === 1 ? 'Scholar' : 'Scholars'} in Room
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
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md whitespace-nowrap shrink-0"
                >
                  {copiedFeedback === 'code' ? 'Copied Code!' : 'Copy Room Code'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyInvite('link')}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md whitespace-nowrap shrink-0"
                >
                  {copiedFeedback === 'link' ? 'Copied Link!' : 'Copy Invite Link'}
                </button>
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate">
              Shareable URL: {inviteUrl}
            </div>
          </div>

          <form onSubmit={handleJoinByCode} className="lg:col-span-4 space-y-1.5">
            <label htmlFor="join-room-code-input" className="block text-xs font-medium text-slate-300">
              Join Friend's Study Room via Code
            </label>
            <div className="flex gap-2">
              <input
                id="join-room-code-input"
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Enter code (e.g. ROOM-8F4K2A)"
                className="flex-1 px-3.5 py-2 text-xs font-mono uppercase bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg whitespace-nowrap shrink-0"
              >
                Join Room
              </button>
            </div>
          </form>

          <div className="lg:col-span-3 space-y-1.5">
            <label htmlFor="create-room-title" className="block text-xs font-medium text-slate-300">
              Create New Shareable Study Room
            </label>
            <div className="flex gap-2">
              <input
                id="create-room-title"
                type="text"
                value={newRoomTitle}
                onChange={(e) => setNewRoomTitle(e.target.value)}
                placeholder="Room title..."
                className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleCreatePrivateStudyRoom}
                className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg whitespace-nowrap shrink-0"
              >
                New Code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Study Modules Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STUDY_MODULES.map((mod) => (
          <div
            key={mod.id}
            className="p-5 rounded-xl border border-slate-800 bg-slate-900 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1">
              <div className="text-xs font-mono text-indigo-400">{mod.cadence}</div>
              <h2 className="text-sm font-bold text-white">{mod.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectDuration(mod.minutes)}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                durationMinutes === mod.minutes
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              Load {mod.minutes}m Module Timer
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Timer, Soundscapes, Study Checklist & Positive Note Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Room Synchronized Focus Timer
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {[25, 50, 15, 5].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSelectDuration(mins)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                      durationMinutes === mins
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="py-6 text-center bg-slate-950 rounded-xl border border-slate-800">
              <div
                className="text-6xl font-bold font-mono tabular-nums tracking-tight text-white"
                data-testid="study-timer-display"
              >
                {formatTimerMMSS(secondsLeft)}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {isRunning
                  ? `Studying live in room ${activeRoomCode}`
                  : `Ready to start ${durationMinutes}-minute module`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRunning((prev) => !prev)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {isRunning ? 'Pause Timer' : 'Start Focus Timer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setSecondsLeft(durationMinutes * 60);
                }}
                className="py-2.5 px-4 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Reset
              </button>
            </div>

            {/* Ambient Web Audio Soundscapes */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-300">
                Synthesized Study Music & Focus Soundscapes
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: 'off', label: 'Silence' },
                    { id: 'rain', label: 'Warm Rain' },
                    { id: 'binaural', label: '432Hz Focus' },
                    { id: 'lofi', label: 'Lo-Fi Chords' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAmbientChange(preset.id)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      ambientMode === preset.id
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Study Session Checklist Module */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
            <h2 className="text-base font-bold text-white">Study Module Checklist</h2>
            <div className="space-y-2">
              {studyTasks.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 cursor-pointer"
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
                    className="rounded accent-indigo-500"
                  />
                  <span className={t.completed ? 'line-through text-slate-500' : ''}>
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
                className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg whitespace-nowrap shrink-0"
              >
                Add Goal
              </button>
            </form>
          </div>

          {/* Post a Positive Study Intention */}
          <form
            onSubmit={handlePublishIntention}
            className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-4"
          >
            <h2 className="text-base font-bold text-white">
              Share Positive Note in {activeRoomCode}
            </h2>
            <div className="space-y-1.5">
              <label htmlFor="study-subject" className="block text-xs font-medium text-slate-300">
                Study Subject / Module Topic
              </label>
              <input
                id="study-subject"
                type="text"
                maxLength={100}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., System Design & Algorithms"
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="study-positive-note" className="block text-xs font-medium text-slate-300">
                Positive Note for Friends in Room
              </label>
              <textarea
                id="study-positive-note"
                rows={3}
                maxLength={400}
                value={positiveNote}
                onChange={(e) => setPositiveNote(e.target.value)}
                placeholder="Share an encouraging note for everyone in this study room..."
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {formError && <p className="text-xs text-rose-400">{formError}</p>}

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Publish Positive Note & Sit at Desk
            </button>
          </form>
        </div>

        {/* Right Column: Live Study Desks in Room, Positive Notes Wall & Room Chit-Chat (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  Live Desks in Room {activeRoomCode} ({desksInCurrentRoom.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Share code <strong className="text-slate-200 font-mono">{activeRoomCode}</strong> with friends so they appear right here.
                </p>
              </div>
              <span className="text-xs text-emerald-400 font-medium">Live Room Sync</span>
            </div>

            {desksInCurrentRoom.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">
                No desks occupied in {activeRoomCode} yet. Click "Sit at Desk in {activeRoomCode}" above to start studying!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {desksInCurrentRoom.map((desk) => (
                  <div
                    key={desk.uid}
                    className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-100">{desk.displayName}</span>
                      <span className="font-mono tabular-nums">{desk.timerMinutes}m block</span>
                    </div>
                    <div className="text-xs font-medium text-indigo-400">{desk.subject}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">"{desk.positiveNote}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Positive Notes Wall */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">
                Positive Study Notes ({notesInCurrentRoom.length})
              </h2>
              <span className="text-xs text-slate-400">Synced with Firestore</span>
            </div>

            {notesInCurrentRoom.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">
                No study notes posted in this room yet. Post the first positive note on the left!
              </p>
            ) : (
              <div className="divide-y divide-slate-800">
                {notesInCurrentRoom.map((note) => (
                  <div key={note.id} className="py-3.5 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">{note.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{note.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Room {note.roomCode}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{note.focusMinutes}m</span>
                    </div>
                    <p className="text-sm text-slate-100">{note.positiveNote}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Study Room Chit-Chat */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Room {activeRoomCode} Study Lounge Chat ({currentName})
              </h2>
              <span className="text-xs text-slate-400">Real-Time WebSocket</span>
            </div>
            <div className="h-44 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
              {chatInCurrentRoom.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Quiet study room lounge. Send a message to peers in {activeRoomCode}!
                </p>
              ) : (
                chatInCurrentRoom.map((msg) => (
                  <div key={msg.id} className="text-xs leading-relaxed">
                    <span className="font-semibold text-indigo-400">{msg.senderName}: </span>
                    <span className="text-slate-200">{msg.text}</span>
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
                className="flex-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg whitespace-nowrap shrink-0"
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
