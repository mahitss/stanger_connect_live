import React, { useState } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import {
  IndividualStudyDeskPomodoroState,
  INDIVIDUAL_DESK_POMODORO_PRESETS,
  evaluateIndividualStudyDeskPomodoroMeta,
  formatStudyDurationLabel,
  clampIndividualDeskPomodoroMinutes,
  sanitizeSafeText,
} from '../utils/rules';

interface IndividualStudyDeskPomodoroCardProps {
  deskState: IndividualStudyDeskPomodoroState;
  isCurrentUserDesk: boolean;
  onStartPause: (deskUid: string) => void;
  onReset: (deskUid: string) => void;
  onApplyCustomDuration: (deskUid: string, minutes: number) => void;
  compact?: boolean;
}

export const IndividualStudyDeskPomodoroCard: React.FC<
  IndividualStudyDeskPomodoroCardProps
> = ({
  deskState,
  isCurrentUserDesk,
  onStartPause,
  onReset,
  onApplyCustomDuration,
  compact = false,
}) => {
  const meta = evaluateIndividualStudyDeskPomodoroMeta(deskState);
  const [customMinutesDraft, setCustomMinutesDraft] = useState<string>(
    String(deskState.durationMinutes)
  );

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clamped = clampIndividualDeskPomodoroMinutes(
      customMinutesDraft,
      deskState.durationMinutes
    );
    setCustomMinutesDraft(String(clamped));
    onApplyCustomDuration(deskState.deskUid, clamped);
  };

  const handlePresetSelect = (presetMins: number) => {
    setCustomMinutesDraft(String(presetMins));
    onApplyCustomDuration(deskState.deskUid, presetMins);
  };

  return (
    <div
      id={compact ? `${meta.cardElementId}-compact` : meta.cardElementId}
      data-testid={compact ? `${meta.cardTestId}-compact` : meta.cardTestId}
      data-desk-uid={deskState.deskUid}
      data-timer-status={deskState.status}
      data-duration-minutes={String(deskState.durationMinutes)}
      data-remaining-seconds={String(deskState.remainingSeconds)}
      className={`rounded-lg border transition-colors p-4 flex flex-col justify-between gap-4 ${
        meta.isRunning
          ? 'bg-[#080D0B] border-emerald-500/60'
          : meta.isPaused
          ? 'bg-[#0C0B08] border-amber-500/50'
          : 'bg-[#050505] border-zinc-800/90 hover:border-zinc-700'
      }`}
    >
      {/* Top Desk Identity & Live Status Row */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-white truncate">
              {deskState.displayName}
            </span>
            {isCurrentUserDesk && (
              <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                (Your Desk)
              </span>
            )}
          </div>
          <span
            data-testid={`desk-pomodoro-status-${deskState.deskUid}`}
            className={`font-mono text-[11px] font-semibold shrink-0 ${
              meta.isRunning
                ? 'text-emerald-400'
                : meta.isPaused
                ? 'text-amber-300'
                : meta.isCompleted
                ? 'text-sky-300'
                : 'text-zinc-400'
            }`}
          >
            {meta.statusLabel}
          </span>
        </div>

        <div className="text-xs font-medium text-emerald-400 truncate">
          {deskState.subject}
        </div>
        {deskState.positiveNote && (
          <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
            &ldquo;{deskState.positiveNote}&rdquo;
          </p>
        )}
      </div>

      {/* Live Desk Pomodoro Countdown Readout & Progress Bar */}
      <div className="p-3.5 rounded-md bg-[#0A0A0C] border border-zinc-800/90 space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Desk Pomodoro Timer
            </div>
            <div
              id={
                compact
                  ? `${meta.timerDisplayElementId}-compact`
                  : meta.timerDisplayElementId
              }
              data-testid={
                compact
                  ? `${meta.timerDisplayTestId}-compact`
                  : meta.timerDisplayTestId
              }
              className="text-3xl font-bold font-mono tabular-nums tracking-tight text-white mt-0.5"
            >
              {meta.remainingFormatted}
            </div>
          </div>

          <div className="text-right font-mono text-[11px] text-zinc-400 space-y-0.5">
            <div>
              Target:{' '}
              <span className="text-zinc-200 font-semibold tabular-nums">
                {formatStudyDurationLabel(deskState.durationMinutes)}
              </span>
            </div>
            <div>
              Elapsed:{' '}
              <span className="text-emerald-400 tabular-nums">
                {meta.elapsedFormatted}
              </span>{' '}
              ({meta.progressPercent}%)
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[#050505] border border-zinc-800 rounded-full overflow-hidden">
          <div
            data-testid={`desk-pomodoro-progress-bar-${deskState.deskUid}`}
            className={`h-full transition-all duration-300 ${
              meta.isRunning
                ? 'bg-emerald-400'
                : meta.isPaused
                ? 'bg-amber-400'
                : meta.isCompleted
                ? 'bg-sky-400'
                : 'bg-zinc-600'
            }`}
            style={{ width: `${meta.progressPercent}%` }}
          />
        </div>

        {/* Primary Start / Pause / Reset Controls */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            id={
              compact
                ? `${meta.startPauseButtonId}-compact`
                : meta.startPauseButtonId
            }
            data-testid={
              compact
                ? `${meta.startPauseButtonTestId}-compact`
                : meta.startPauseButtonTestId
            }
            onClick={() => onStartPause(deskState.deskUid)}
            aria-label={`${meta.primaryActionLabel} Pomodoro timer for ${deskState.displayName}`}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              meta.isRunning
                ? 'bg-amber-400 hover:bg-amber-300 text-black'
                : 'bg-emerald-400 hover:bg-emerald-300 text-black'
            }`}
          >
            {meta.isRunning ? (
              <Pause className="w-3.5 h-3.5 fill-black shrink-0" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-black shrink-0" />
            )}
            <span>{meta.primaryActionLabel} Timer</span>
          </button>

          <button
            type="button"
            id={compact ? `${meta.resetButtonId}-compact` : meta.resetButtonId}
            data-testid={
              compact ? `${meta.resetButtonTestId}-compact` : meta.resetButtonTestId
            }
            onClick={() => onReset(deskState.deskUid)}
            aria-label={`Reset Pomodoro timer for ${deskState.displayName}`}
            className="py-2 px-3 rounded-md text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Custom Duration Presets & Custom Minute Input per Desk */}
      <div className="space-y-2 pt-1 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Custom Desk Duration (1–240m)</span>
          {deskState.completedCyclesCount > 0 && (
            <span className="text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{deskState.completedCyclesCount} completed</span>
            </span>
          )}
        </div>

        {/* Quick Preset Duration Buttons */}
        <div className="grid grid-cols-6 gap-1">
          {INDIVIDUAL_DESK_POMODORO_PRESETS.map((presetMins) => {
            const isSelected = deskState.durationMinutes === presetMins;
            return (
              <button
                key={presetMins}
                type="button"
                data-testid={
                  compact
                    ? `desk-pomodoro-preset-${deskState.deskUid}-${presetMins}m-compact`
                    : `desk-pomodoro-preset-${deskState.deskUid}-${presetMins}m`
                }
                onClick={() => handlePresetSelect(presetMins)}
                className={`py-1 px-1.5 rounded text-[11px] font-mono tabular-nums border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-[#0A0A0C] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                }`}
              >
                {presetMins}m
              </button>
            );
          })}
        </div>

        {/* Custom Minutes Form */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <label
            htmlFor={
              compact ? `${meta.durationInputId}-compact` : meta.durationInputId
            }
            className="sr-only"
          >
            Custom Pomodoro minutes for {deskState.displayName}
          </label>
          <input
            id={compact ? `${meta.durationInputId}-compact` : meta.durationInputId}
            data-testid={
              compact
                ? `${meta.durationInputTestId}-compact`
                : meta.durationInputTestId
            }
            type="number"
            min={1}
            max={240}
            value={customMinutesDraft}
            onChange={(e) => setCustomMinutesDraft(e.target.value)}
            placeholder="Custom mins (e.g. 35)"
            className="w-28 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-zinc-500"
          />
          <span className="text-[11px] font-mono text-zinc-400">min</span>
          <button
            type="submit"
            id={
              compact
                ? `${meta.applyDurationButtonId}-compact`
                : meta.applyDurationButtonId
            }
            data-testid={
              compact
                ? `${meta.applyDurationButtonTestId}-compact`
                : meta.applyDurationButtonTestId
            }
            className="ml-auto px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 rounded transition-colors whitespace-nowrap cursor-pointer"
          >
            Set Duration
          </button>
        </form>
      </div>
    </div>
  );
};

interface StudyDeskPomodoroControllerProps {
  activeRoomCode: string;
  currentUid: string;
  deskTimersList: IndividualStudyDeskPomodoroState[];
  onStartPauseDesk: (deskUid: string) => void;
  onResetDesk: (deskUid: string) => void;
  onApplyDeskCustomDuration: (deskUid: string, minutes: number) => void;
  onStartAllDesks: () => void;
  onPauseAllDesks: () => void;
  onResetAllDesks: () => void;
  onCreateCustomDeskTimer: (params: {
    displayName: string;
    subject: string;
    durationMinutes: number;
  }) => void;
}

export const StudyDeskPomodoroController: React.FC<
  StudyDeskPomodoroControllerProps
> = ({
  activeRoomCode,
  currentUid,
  deskTimersList,
  onStartPauseDesk,
  onResetDesk,
  onApplyDeskCustomDuration,
  onStartAllDesks,
  onPauseAllDesks,
  onResetAllDesks,
  onCreateCustomDeskTimer,
}) => {
  const [newDeskName, setNewDeskName] = useState('');
  const [newDeskSubject, setNewDeskSubject] = useState('');
  const [newDeskMinutes, setNewDeskMinutes] = useState('35');
  const [isAddDeskOpen, setIsAddDeskOpen] = useState(false);

  const runningCount = deskTimersList.filter((d) => d.status === 'running').length;
  const pausedCount = deskTimersList.filter((d) => d.status === 'paused').length;

  const handleAddDeskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName =
      sanitizeSafeText(newDeskName.trim(), 64) ||
      `Focus Desk #${deskTimersList.length + 1}`;
    const cleanSubject =
      sanitizeSafeText(newDeskSubject.trim(), 100) ||
      'Deep Work & Problem Solving';
    const clampedMins = clampIndividualDeskPomodoroMinutes(newDeskMinutes, 35);

    onCreateCustomDeskTimer({
      displayName: cleanName,
      subject: cleanSubject,
      durationMinutes: clampedMins,
    });
    setNewDeskName('');
    setNewDeskSubject('');
    setNewDeskMinutes('35');
    setIsAddDeskOpen(false);
  };

  return (
    <section
      id="study-desk-pomodoro-controller"
      data-testid="study-desk-pomodoro-controller"
      data-active-room={activeRoomCode}
      data-desk-count={String(deskTimersList.length)}
      data-running-desk-count={String(runningCount)}
      aria-label="Individual Study Desk Custom-Duration Pomodoro Controller"
      className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-6"
    >
      {/* Header & Room-Wide Batch Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 className="text-lg font-bold text-white">
              Individual Study Desk Pomodoro Timers ({deskTimersList.length} Desks in{' '}
              {activeRoomCode})
            </h2>
            <span aria-hidden="true" className="text-xs text-zinc-600">
              ·
            </span>
            <span
              data-testid="study-desk-pomodoro-summary-status"
              className="text-xs font-mono text-emerald-400 tabular-nums"
            >
              {runningCount} Running · {pausedCount} Paused
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Start, pause, and reset independent custom-duration Pomodoro timers (1–240 minutes) for each individual study desk in {activeRoomCode}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="study-desk-pomodoro-start-all-btn"
            onClick={onStartAllDesks}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black shrink-0" />
            <span>Start All Desks</span>
          </button>

          <button
            type="button"
            data-testid="study-desk-pomodoro-pause-all-btn"
            onClick={onPauseAllDesks}
            className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 shrink-0" />
            <span>Pause All</span>
          </button>

          <button
            type="button"
            data-testid="study-desk-pomodoro-reset-all-btn"
            onClick={onResetAllDesks}
            className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset All</span>
          </button>

          <button
            type="button"
            data-testid="study-desk-pomodoro-toggle-add-btn"
            onClick={() => setIsAddDeskOpen((prev) => !prev)}
            aria-expanded={isAddDeskOpen}
            className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Add Custom Desk Timer</span>
          </button>
        </div>
      </div>

      {/* Optional Add Custom Study Desk Drawer */}
      {isAddDeskOpen && (
        <form
          onSubmit={handleAddDeskSubmit}
          data-testid="study-desk-pomodoro-add-form"
          className="p-4 rounded-md bg-[#050505] border border-zinc-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Individual Study Desk with Custom Pomodoro Timer</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Room {activeRoomCode}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="new-desk-pomodoro-name"
                className="block text-[11px] font-mono text-zinc-400"
              >
                Desk / Scholar Name
              </label>
              <input
                id="new-desk-pomodoro-name"
                data-testid="new-desk-pomodoro-name-input"
                type="text"
                value={newDeskName}
                onChange={(e) => setNewDeskName(e.target.value)}
                placeholder="e.g., Algorithm Sprint Desk"
                className="w-full px-3 py-1.5 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="new-desk-pomodoro-subject"
                className="block text-[11px] font-mono text-zinc-400"
              >
                Focus Subject / Task
              </label>
              <input
                id="new-desk-pomodoro-subject"
                data-testid="new-desk-pomodoro-subject-input"
                type="text"
                value={newDeskSubject}
                onChange={(e) => setNewDeskSubject(e.target.value)}
                placeholder="e.g., Graph Theory & DP Proofs"
                className="w-full px-3 py-1.5 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="new-desk-pomodoro-minutes"
                className="block text-[11px] font-mono text-zinc-400"
              >
                Custom Duration (1–240 Mins)
              </label>
              <div className="flex gap-2">
                <input
                  id="new-desk-pomodoro-minutes"
                  data-testid="new-desk-pomodoro-minutes-input"
                  type="number"
                  min={1}
                  max={240}
                  value={newDeskMinutes}
                  onChange={(e) => setNewDeskMinutes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                />
                <button
                  type="submit"
                  data-testid="new-desk-pomodoro-create-btn"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black rounded whitespace-nowrap cursor-pointer"
                >
                  Create Desk
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Grid of Individual Study Desk Pomodoro Timer Cards */}
      <div
        data-testid="study-desk-pomodoro-cards-grid"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {deskTimersList.map((deskState) => (
          <IndividualStudyDeskPomodoroCard
            key={deskState.deskUid}
            deskState={deskState}
            isCurrentUserDesk={deskState.deskUid === currentUid}
            onStartPause={onStartPauseDesk}
            onReset={onResetDesk}
            onApplyCustomDuration={onApplyDeskCustomDuration}
          />
        ))}
      </div>
    </section>
  );
};
