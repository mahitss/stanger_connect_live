import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Timer,
  Flame,
} from 'lucide-react';
import {
  computePomodoroVisualCountdownMetrics,
  formatStudyDurationLabel,
  formatStudyTimerHMS,
} from '../utils/rules';

export interface StudyRoomVisualCountdownTimerProps {
  activeRoomCode: string;
  activeSubject: string;
  durationMinutes: number;
  secondsLeft: number;
  elapsedSessionSeconds: number;
  unrecordedElapsedSeconds: number;
  isRunning: boolean;
  onToggleStartPause: () => void;
  onResetTimer: () => void;
  onSelectDurationMinutes: (minutes: number) => void;
  onRecordConductedTime: () => void;
}

const POMODORO_CADENCE_PRESETS: ReadonlyArray<{
  minutes: number;
  shortLabel: string;
  cadenceNote: string;
}> = [
  { minutes: 15, shortLabel: '15m Sprint', cadenceNote: '15m Focus · 3m Break' },
  {
    minutes: 25,
    shortLabel: '25m Pomodoro',
    cadenceNote: '25m Classic · 5m Break',
  },
  {
    minutes: 50,
    shortLabel: '50m Deep Focus',
    cadenceNote: '50m Flow · 10m Break',
  },
  {
    minutes: 90,
    shortLabel: '90m Marathon',
    cadenceNote: '90m Immersion · 15m Break',
  },
];

export const StudyRoomVisualCountdownTimer: React.FC<
  StudyRoomVisualCountdownTimerProps
> = ({
  activeRoomCode,
  activeSubject,
  durationMinutes,
  secondsLeft,
  elapsedSessionSeconds,
  unrecordedElapsedSeconds,
  isRunning,
  onToggleStartPause,
  onResetTimer,
  onSelectDurationMinutes,
  onRecordConductedTime,
}) => {
  const metrics = computePomodoroVisualCountdownMetrics({
    durationMinutes,
    secondsLeft,
    elapsedSessionSeconds,
    isRunning,
    radius: 88,
    segmentsCount: 20,
  });

  const ringStrokeColor =
    metrics.phaseColorToken === 'emerald'
      ? '#10B981'
      : metrics.phaseColorToken === 'amber'
      ? '#F59E0B'
      : metrics.phaseColorToken === 'sky'
      ? '#38BDF8'
      : '#71717A';

  const statusTextColor =
    metrics.phaseColorToken === 'emerald'
      ? 'text-emerald-400'
      : metrics.phaseColorToken === 'amber'
      ? 'text-amber-300'
      : metrics.phaseColorToken === 'sky'
      ? 'text-sky-400'
      : 'text-zinc-300';

  const canRecordVerifiedTime = unrecordedElapsedSeconds >= 60;

  return (
    <section
      id="study-room-visual-countdown-timer"
      data-testid="study-room-visual-countdown-timer"
      data-phase-status={metrics.phaseStatus}
      data-progress-percent={String(metrics.progressPercent)}
      data-seconds-left={String(metrics.clampedSecondsLeft)}
      aria-label="Live Visual Pomodoro Countdown Timer"
      className="p-6 rounded-xl border border-zinc-800/90 bg-[#0A0A0C] space-y-6"
    >
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Timer className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 className="text-lg font-bold text-white">
              Live Pomodoro Visual Countdown &amp; Focus Progress
            </h2>
            <span aria-hidden="true" className="text-zinc-600">
              ·
            </span>
            <span
              data-testid="visual-countdown-phase-status"
              className={`font-mono font-semibold ${statusTextColor}`}
            >
              {metrics.phaseLabel}
            </span>
            <span aria-hidden="true" className="text-zinc-600">
              ·
            </span>
            <span className="font-mono text-zinc-400 tabular-nums">
              Room {activeRoomCode}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Synchronized second-by-second with your active Study Room Pomodoro
            session so you can track remaining time, circular ring completion,
            and milestone checkpoints at a glance.
          </p>
        </div>

        {/* Synchronized Pomodoro Cadence Switcher */}
        <div
          role="group"
          aria-label="Pomodoro session duration presets"
          className="flex flex-wrap items-center gap-1.5"
        >
          {POMODORO_CADENCE_PRESETS.map((preset) => {
            const isSelected = durationMinutes === preset.minutes;
            return (
              <button
                key={preset.minutes}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectDurationMinutes(preset.minutes)}
                data-testid={`visual-countdown-preset-${preset.minutes}m`}
                title={preset.cadenceNote}
                className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
                    : 'bg-[#050507] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                }`}
              >
                {preset.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 12-Col Split: Left 5 Cols = SVG Circular Countdown Ring, Right 7 Cols = Segmented Progress, Milestones & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left 5 Cols: Circular SVG Countdown Dial */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-4">
          <div className="relative w-[220px] h-[220px] flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 208 208"
              role="img"
              aria-label={`Pomodoro countdown ring: ${metrics.formattedCountdown} remaining, ${metrics.progressPercent}% complete`}
            >
              {/* Subtle Background Track Ring */}
              <circle
                cx="104"
                cy="104"
                r={metrics.svgCircle.radius}
                fill="none"
                stroke="#18181B"
                strokeWidth="12"
              />
              {/* 12 Dial Tick Marks around Outer Perimeter */}
              {Array.from({ length: 12 }, (_, idx) => {
                const angleRad = (idx * 30 * Math.PI) / 180;
                const innerR = 96;
                const outerR = 101;
                const x1 = 104 + innerR * Math.cos(angleRad);
                const y1 = 104 + innerR * Math.sin(angleRad);
                const x2 = 104 + outerR * Math.cos(angleRad);
                const y2 = 104 + outerR * Math.sin(angleRad);
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#3F3F46"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })}
              {/* Active Progress Arc */}
              <circle
                cx="104"
                cy="104"
                r={metrics.svgCircle.radius}
                fill="none"
                stroke={ringStrokeColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={metrics.svgCircle.strokeDasharray}
                strokeDashoffset={metrics.svgCircle.strokeDashoffset}
                data-testid="visual-countdown-svg-progress-arc"
                className="transition-all duration-300 ease-out"
              />
            </svg>

            {/* Center Readout Inside Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                {isRunning ? 'Counting Down' : 'Time Remaining'}
              </span>
              <span
                data-testid="visual-countdown-time-display"
                className="text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight text-white mt-0.5"
              >
                {metrics.formattedCountdown}
              </span>
              <span
                data-testid="visual-countdown-percent-badge"
                className={`text-xs font-mono font-semibold tabular-nums mt-1 ${statusTextColor}`}
              >
                {metrics.progressPercent}% Complete
              </span>
              <span className="text-[11px] font-mono text-zinc-500 tabular-nums mt-0.5">
                Target {formatStudyDurationLabel(metrics.durationMinutes)}
              </span>
            </div>
          </div>

          {/* Bottom Ring Caption: Elapsed vs Remaining */}
          <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-zinc-900 text-center font-mono">
            <div>
              <div className="text-[10px] text-zinc-500">Elapsed in Cycle</div>
              <div
                data-testid="visual-countdown-cycle-elapsed"
                className="text-xs font-bold text-emerald-400 tabular-nums mt-0.5"
              >
                {metrics.formattedCompletedInCycle}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500">Remaining</div>
              <div
                data-testid="visual-countdown-remaining- pct"
                className="text-xs font-bold text-white tabular-nums mt-0.5"
              >
                {metrics.remainingPercent}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500">Verified Total</div>
              <div
                data-testid="visual-countdown-verified-elapsed"
                className="text-xs font-bold text-amber-300 tabular-nums mt-0.5"
              >
                {metrics.formattedElapsed}
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Active Subject, 20-Segment Progress Bar, 4 Milestones & Action Controls */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          {/* Active Subject & Session Status Banner */}
          <div className="p-4 rounded-lg bg-[#050507] border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] font-mono text-zinc-400">
                Active Focus Subject in {activeRoomCode}
              </div>
              <div
                data-testid="visual-countdown-active-subject"
                className="text-sm font-bold text-white truncate"
              >
                {activeSubject}
              </div>
            </div>
            <div className="text-right font-mono tabular-nums shrink-0">
              <div className="text-[11px] text-zinc-400">Session Target</div>
              <div className="text-sm font-bold text-emerald-400">
                {metrics.formattedTarget}
              </div>
            </div>
          </div>

          {/* 20-Segment Visual Focus Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300 font-semibold">
                Segmented Focus Progress ({metrics.progressPercent}%)
              </span>
              <span className="text-zinc-400 tabular-nums">
                {metrics.formattedCompletedInCycle} / {metrics.formattedTarget}
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Pomodoro focus session progress"
              aria-valuenow={metrics.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              data-testid="visual-countdown-segment-bar"
              className="grid grid-cols-20 gap-1 p-1.5 rounded-md bg-[#050507] border border-zinc-800/90"
            >
              {metrics.segments.map((seg) => (
                <div
                  key={seg.index}
                  data-segment-index={seg.index}
                  data-segment-reached={seg.reached ? 'true' : 'false'}
                  className={`h-3 rounded-xs transition-colors ${
                    seg.reached
                      ? 'bg-emerald-400'
                      : seg.isCurrent
                      ? 'bg-amber-400/80'
                      : 'bg-zinc-900'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 4 Quarter Milestone Checkpoints (25%, 50%, 75%, 100%) */}
          <div
            data-testid="visual-countdown-milestones-grid"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
          >
            {metrics.milestones.map((m) => (
              <div
                key={m.percent}
                data-testid={`visual-countdown-milestone-${m.percent}`}
                data-reached={m.reached ? 'true' : 'false'}
                className={`p-3 rounded-lg border transition-colors ${
                  m.reached
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                    : 'bg-[#050507] border-zinc-800/80 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white">{m.percent}%</span>
                  {m.reached ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Flame className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] font-medium mt-1 truncate">
                  {m.label}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 tabular-nums mt-0.5">
                  at {m.formattedMark}
                </div>
              </div>
            ))}
          </div>

          {/* Primary Synchronized Countdown Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onToggleStartPause}
              data-testid="visual-countdown-start-pause-btn"
              className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                isRunning
                  ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-zinc-950'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-zinc-950 shrink-0" />
                  <span>Pause Pomodoro Countdown</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-zinc-950 shrink-0" />
                  <span>Start Pomodoro Countdown</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onRecordConductedTime}
              data-testid="visual-countdown-record-btn"
              className={`py-2.5 px-4 text-xs font-semibold rounded-md border transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                canRecordVerifiedTime
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Record Verified Time (
                {formatStudyTimerHMS(unrecordedElapsedSeconds, true)})
              </span>
            </button>

            <button
              type="button"
              onClick={onResetTimer}
              data-testid="visual-countdown-reset-btn"
              aria-label="Reset Pomodoro countdown session"
              className="py-2.5 px-3.5 text-xs font-semibold bg-[#050507] hover:bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
