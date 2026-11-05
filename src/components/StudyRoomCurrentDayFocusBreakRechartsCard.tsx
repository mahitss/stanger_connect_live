import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  CurrentDayFocusBreakChartMode,
  CurrentDayFocusBreakPoint,
  CurrentDayFocusBreakSummary,
  CURRENT_DAY_FOCUS_BREAK_QUICK_PRESETS,
  INTRADAY_FOCUS_BREAK_TIME_SLOTS,
  normalizeStudyRoomCode,
  sanitizeSafeText,
} from '../utils/rules';
import { Activity, Clock, Coffee, Plus, CheckCircle2 } from 'lucide-react';

interface StudyRoomCurrentDayFocusBreakRechartsCardProps {
  summary: CurrentDayFocusBreakSummary;
  activeRoomCode: string;
  selectedRoomFilter: string;
  onChangeRoomFilter: (nextRoomFilter: string) => void;
  onLogIntradayFocusBreakSession: (params: {
    slotKey: string;
    focusMinutes: number;
    breakMinutes: number;
    roomCode: string;
    topic: string;
    cadenceLabel?: string;
  }) => void;
}

interface CustomCurrentDayTooltipProps {
  active?: boolean;
  chartMode: CurrentDayFocusBreakChartMode;
  payload?: Array<{
    payload: CurrentDayFocusBreakPoint;
  }>;
}

const CustomCurrentDayFocusBreakTooltip: React.FC<
  CustomCurrentDayTooltipProps
> = ({ active, payload, chartMode }) => {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  return (
    <div
      className="p-3.5 rounded-lg bg-[#050507] border border-zinc-700 shadow-2xl space-y-1.5 text-xs"
      data-testid="current-day-focus-break-recharts-tooltip"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono font-bold text-white">
          {pt.windowRangeLabel}
        </span>
        <span className="font-mono tabular-nums text-emerald-400">
          {pt.focusSharePercent}% Focus / {pt.breakSharePercent}% Break
        </span>
      </div>

      <div className="pt-1 border-t border-zinc-800/90 flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-zinc-400">Slot Focus Time:</span>
        <span className="font-bold text-emerald-400">
          {pt.focusMinutes}m ({pt.formattedFocusDuration})
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-zinc-400">Slot Break Time:</span>
        <span className="font-bold text-amber-300">
          {pt.breakMinutes}m ({pt.formattedBreakDuration})
        </span>
      </div>

      {chartMode === 'cumulative_minutes' && (
        <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between gap-4 font-mono tabular-nums text-[11px]">
          <span className="text-zinc-400">Cumulative Through {pt.slotLabel}:</span>
          <span className="text-sky-300">
            {pt.cumulativeFocusMinutes}m Focus · {pt.cumulativeBreakMinutes}m Break
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 font-mono tabular-nums text-[11px]">
        <span className="text-zinc-400">Cadence & Room:</span>
        <span className="text-zinc-200">
          {pt.cadenceLabel} · {pt.roomCode}
        </span>
      </div>

      <div className="text-[11px] text-zinc-400 truncate max-w-[280px]">
        Subject: <span className="text-zinc-200">{pt.topic}</span>
      </div>
    </div>
  );
};

export const StudyRoomCurrentDayFocusBreakRechartsCard: React.FC<
  StudyRoomCurrentDayFocusBreakRechartsCardProps
> = ({
  summary,
  activeRoomCode,
  selectedRoomFilter,
  onChangeRoomFilter,
  onLogIntradayFocusBreakSession,
}) => {
  const [chartMode, setChartMode] =
    useState<CurrentDayFocusBreakChartMode>('slot_minutes');
  const [showPomodoroBenchmark, setShowPomodoroBenchmark] =
    useState<boolean>(true);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>('14:00');
  const [focusMinutesInput, setFocusMinutesInput] = useState<string>('25');
  const [breakMinutesInput, setBreakMinutesInput] = useState<string>('5');
  const [topicInput, setTopicInput] = useState<string>(
    'System Design & Deep Focus Sprint'
  );
  const [recentToast, setRecentToast] = useState<string | null>(null);

  const inspectedPoint =
    summary.points.find((p) => p.slotKey === selectedSlotKey) ||
    summary.peakFocusSlot ||
    summary.points[0];

  const focusDataKey =
    chartMode === 'cumulative_minutes'
      ? 'cumulativeFocusMinutes'
      : 'focusMinutes';
  const breakDataKey =
    chartMode === 'cumulative_minutes'
      ? 'cumulativeBreakMinutes'
      : 'breakMinutes';

  const handleQuickPresetClick = (
    focusMins: number,
    breakMins: number,
    cadenceLabel: string
  ) => {
    const targetRoom =
      selectedRoomFilter !== 'ALL'
        ? normalizeStudyRoomCode(selectedRoomFilter)
        : normalizeStudyRoomCode(activeRoomCode);

    onLogIntradayFocusBreakSession({
      slotKey: inspectedPoint.slotKey,
      focusMinutes: focusMins,
      breakMinutes: breakMins,
      roomCode: targetRoom,
      topic:
        sanitizeSafeText(topicInput, 80) ||
        `Focused Sprint in ${targetRoom}`,
      cadenceLabel,
    });

    setRecentToast(
      `Logged +${focusMins}m Focus / +${breakMins}m Break at ${inspectedPoint.slotLabel} (${targetRoom})`
    );
    window.setTimeout(() => {
      setRecentToast(null);
    }, 3500);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clampedFocus = Math.min(
      180,
      Math.max(5, Math.round(Number(focusMinutesInput) || 25))
    );
    const clampedBreak = Math.min(
      90,
      Math.max(0, Math.round(Number(breakMinutesInput) || 5))
    );
    const targetRoom =
      selectedRoomFilter !== 'ALL'
        ? normalizeStudyRoomCode(selectedRoomFilter)
        : normalizeStudyRoomCode(activeRoomCode);
    const cleanTopic =
      sanitizeSafeText(topicInput, 80) ||
      'System Design & Deep Focus Sprint';

    onLogIntradayFocusBreakSession({
      slotKey: inspectedPoint.slotKey,
      focusMinutes: clampedFocus,
      breakMinutes: clampedBreak,
      roomCode: targetRoom,
      topic: cleanTopic,
      cadenceLabel: `${clampedFocus}m Focus · ${clampedBreak}m Break`,
    });

    setRecentToast(
      `+${clampedFocus}m Focus & +${clampedBreak}m Break logged at ${inspectedPoint.slotLabel}`
    );
    window.setTimeout(() => {
      setRecentToast(null);
    }, 3500);
  };

  return (
    <section
      id="study-room-current-day-focus-vs-break-section"
      data-testid="study-room-current-day-focus-vs-break-section"
      data-slots-count={summary.points.length}
      data-chart-mode={chartMode}
      aria-label="Current-Day Focus Sessions versus Break Periods Line Chart"
      className="p-6 rounded-xl border border-zinc-800/90 bg-[#0A0A0C] space-y-6"
    >
      {/* Header & Interactive Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-emerald-400">
              Intraday Focus vs. Break Rhythm
            </span>
            <span aria-hidden="true">·</span>
            <span
              className="font-mono tabular-nums"
              data-testid="current-day-focus-break-date-label"
            >
              Today ({summary.todayDateKey}) · 08:00 AM – 09:30 PM
            </span>
          </div>
          <h2
            className="text-lg font-bold text-white"
            data-testid="current-day-focus-break-heading"
          >
            Today&apos;s Focus Sessions vs. Break Periods
          </h2>
          <p className="text-xs text-zinc-400 max-w-3xl">
            Dynamic intraday Recharts line chart tracking your completed focus
            sessions alongside recovery break periods across the current day.
          </p>
        </div>

        {/* View Mode Toggle, Benchmark Toggle, and Room Filter */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-[#050507] border border-zinc-800/90"
            role="group"
            aria-label="Current-day focus vs break chart mode"
          >
            <button
              type="button"
              onClick={() => setChartMode('slot_minutes')}
              aria-pressed={chartMode === 'slot_minutes'}
              data-testid="current-day-mode-slot-btn"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                chartMode === 'slot_minutes'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Session Blocks
            </button>
            <button
              type="button"
              onClick={() => setChartMode('cumulative_minutes')}
              aria-pressed={chartMode === 'cumulative_minutes'}
              data-testid="current-day-mode-cumulative-btn"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                chartMode === 'cumulative_minutes'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cumulative Curve
            </button>
            <button
              type="button"
              onClick={() => setShowPomodoroBenchmark((prev) => !prev)}
              aria-pressed={showPomodoroBenchmark}
              data-testid="current-day-toggle-benchmark-btn"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showPomodoroBenchmark
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              25m/5m Cadence Ref
            </button>
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-[#050507] border border-zinc-800/90"
            role="group"
            aria-label="Filter current-day focus vs break by room"
          >
            <button
              type="button"
              onClick={() => onChangeRoomFilter('ALL')}
              data-testid="current-day-room-filter-ALL"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedRoomFilter === 'ALL'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Rooms
            </button>
            {summary.availableRoomCodes.slice(0, 4).map((rCode) => (
              <button
                key={rCode}
                type="button"
                onClick={() => onChangeRoomFilter(rCode)}
                data-testid={`current-day-room-filter-${rCode}`}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedRoomFilter === rCode
                    ? 'bg-white text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {rCode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">Today&apos;s Focus Time</div>
          <div
            className="text-xl font-bold font-mono text-emerald-400 tabular-nums"
            data-testid="current-day-total-focus-minutes"
          >
            {summary.totalFocusMinutes}m{' '}
            <span className="text-xs font-normal text-zinc-400">
              ({summary.formattedTotalFocus})
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-300 tabular-nums">
            {summary.totalSessionsCount} focus sessions across{' '}
            {summary.activeSlotsCount}/9 windows
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">
            Today&apos;s Break &amp; Recovery
          </div>
          <div
            className="text-xl font-bold font-mono text-amber-300 tabular-nums"
            data-testid="current-day-total-break-minutes"
          >
            {summary.totalBreakMinutes}m{' '}
            <span className="text-xs font-normal text-zinc-400">
              ({summary.formattedTotalBreak})
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
            Recommended 1:5 recovery: {summary.recommendedBreakMinutesForFocus}m
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">
            Focus-to-Break Ratio &amp; Split
          </div>
          <div
            className="text-xl font-bold font-mono text-white tabular-nums"
            data-testid="current-day-focus-break-ratio"
          >
            {summary.focusToBreakRatioLabel}{' '}
            <span className="text-xs font-normal text-emerald-400">
              ({summary.focusEfficiencyPercent}% Focus)
            </span>
          </div>
          <div
            className="text-[11px] font-mono text-zinc-400 truncate"
            data-testid="current-day-recovery-balance-label"
          >
            {summary.recoveryBalanceLabel}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">Peak Intraday Window</div>
          <div
            className="text-xl font-bold font-mono text-white tabular-nums"
            data-testid="current-day-peak-focus-slot"
          >
            {summary.peakFocusSlot.slotLabel}{' '}
            <span className="text-xs font-normal text-emerald-400">
              ({summary.peakFocusSlot.focusMinutes}m /{' '}
              {summary.peakFocusSlot.breakMinutes}m brk)
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 truncate">
            {summary.peakFocusSlot.roomCode} · {summary.peakFocusSlot.topic}
          </div>
        </div>
      </div>

      {/* Recharts Dual-Series Dynamic Line Chart */}
      <div
        className="p-4 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-3"
        data-testid="current-day-focus-break-chart-container"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <span className="text-emerald-400 font-semibold">
              —{' '}
              {chartMode === 'cumulative_minutes'
                ? 'Cumulative Focus Minutes (m)'
                : 'Focus Session Minutes (m)'}
            </span>
            <span aria-hidden="true" className="text-zinc-600">
              ·
            </span>
            <span className="text-amber-300 font-semibold">
              - -{' '}
              {chartMode === 'cumulative_minutes'
                ? 'Cumulative Break Minutes (m)'
                : 'Break & Recovery Minutes (m)'}
            </span>
            {showPomodoroBenchmark && chartMode === 'slot_minutes' && (
              <>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span className="text-sky-300">
                  · · 25m Standard Pomodoro Block
                </span>
              </>
            )}
          </div>

          <div
            className="font-mono text-[11px] text-zinc-400 tabular-nums"
            data-testid="current-day-active-totals-badge"
          >
            Intraday Split:{' '}
            <strong className="text-emerald-400">
              {summary.totalFocusMinutes}m Focus
            </strong>{' '}
            vs.{' '}
            <strong className="text-amber-300">
              {summary.totalBreakMinutes}m Break
            </strong>{' '}
            ({summary.formattedTotalActive} total)
          </div>
        </div>

        <div
          className="h-80 w-full"
          data-testid="current-day-focus-break-recharts-canvas"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={summary.points}
              margin={{ top: 12, right: 20, left: 0, bottom: 8 }}
              onClick={(state) => {
                if (
                  state &&
                  state.activeLabel &&
                  typeof state.activeLabel === 'string'
                ) {
                  const matched = summary.points.find(
                    (p) =>
                      p.slotLabel === state.activeLabel ||
                      p.slotKey === state.activeLabel
                  );
                  if (matched) {
                    setSelectedSlotKey(matched.slotKey);
                  }
                }
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1F1F26"
                vertical={false}
              />
              <XAxis
                dataKey="slotLabel"
                stroke="#71717A"
                tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#3F3F46' }}
              />
              <YAxis
                stroke="#71717A"
                tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#3F3F46' }}
                unit="m"
                width={48}
              />
              <Tooltip
                content={
                  <CustomCurrentDayFocusBreakTooltip chartMode={chartMode} />
                }
              />
              {showPomodoroBenchmark && chartMode === 'slot_minutes' && (
                <ReferenceLine
                  y={25}
                  stroke="#38BDF8"
                  strokeDasharray="4 4"
                  strokeWidth={1.25}
                  label={{
                    value: '25m Pomodoro',
                    position: 'insideTopRight',
                    fill: '#7DD3FC',
                    fontSize: 10,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey={focusDataKey}
                name={
                  chartMode === 'cumulative_minutes'
                    ? 'Cumulative Focus (m)'
                    : 'Focus Minutes (m)'
                }
                stroke="#10B981"
                strokeWidth={2.75}
                dot={{
                  r: 4,
                  fill: '#10B981',
                  stroke: '#050507',
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 6,
                  fill: '#34D399',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey={breakDataKey}
                name={
                  chartMode === 'cumulative_minutes'
                    ? 'Cumulative Break (m)'
                    : 'Break Minutes (m)'
                }
                stroke="#F59E0B"
                strokeWidth={2.25}
                strokeDasharray="5 4"
                dot={{
                  r: 3.5,
                  fill: '#F59E0B',
                  stroke: '#050507',
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 5.5,
                  fill: '#FCD34D',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Intraday Slot Inspector & Quick Focus/Break Session Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left 7 Cols: 9 Intraday Time-Slot Selector Buttons & Inspected Slot Detail */}
        <div className="lg:col-span-7 p-4 rounded-lg bg-[#050507] border border-zinc-800/80 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Intraday Focus &amp; Break Windows (Click Any Slot)</span>
            </div>
            <span
              className="text-[11px] font-mono text-zinc-400 tabular-nums"
              data-testid="current-day-inspected-slot-label"
            >
              Selected: {inspectedPoint.windowRangeLabel}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
            {summary.points.map((pt) => {
              const isSelected = pt.slotKey === inspectedPoint.slotKey;
              return (
                <button
                  key={pt.slotKey}
                  type="button"
                  onClick={() => setSelectedSlotKey(pt.slotKey)}
                  data-testid={`current-day-slot-btn-${pt.slotKey}`}
                  className={`p-1.5 rounded border text-center font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-[#0A0A0C] border-zinc-800/90 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-[10px] truncate">{pt.slotKey}</div>
                  <div className="text-[11px] font-bold text-emerald-400 tabular-nums">
                    {pt.focusMinutes}m
                  </div>
                  <div className="text-[10px] text-amber-300 tabular-nums">
                    {pt.breakMinutes}m brk
                  </div>
                </button>
              );
            })}
          </div>

          <div
            className="p-3 rounded-md bg-[#0A0A0C] border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs"
            data-testid="current-day-inspected-slot-summary"
          >
            <div className="space-y-0.5 min-w-0">
              <div className="font-mono text-zinc-300 truncate">
                <strong className="text-white">{inspectedPoint.slotLabel}</strong>{' '}
                · {inspectedPoint.roomCode} · {inspectedPoint.topic}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
                {inspectedPoint.cadenceLabel} · Cumulative:{' '}
                {inspectedPoint.cumulativeFocusMinutes}m Focus /{' '}
                {inspectedPoint.cumulativeBreakMinutes}m Break
              </div>
            </div>
            <div className="text-right font-mono tabular-nums shrink-0">
              <div className="text-sm font-bold text-emerald-400">
                {inspectedPoint.focusMinutes}m Focus{' '}
                <span className="text-zinc-500">/</span>{' '}
                <span className="text-amber-300">
                  {inspectedPoint.breakMinutes}m Break
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                {inspectedPoint.focusSharePercent}% Focus ·{' '}
                {inspectedPoint.breakSharePercent}% Recovery
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Quick Intraday Focus vs. Break Logger */}
        <form
          onSubmit={handleCustomSubmit}
          className="lg:col-span-5 p-4 rounded-lg bg-[#050507] border border-zinc-800/80 flex flex-col justify-between space-y-3"
          data-testid="current-day-focus-break-log-form"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap">
              <Coffee className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Log Focus &amp; Break Block</span>
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {CURRENT_DAY_FOCUS_BREAK_QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    handleQuickPresetClick(
                      preset.focusMinutes,
                      preset.breakMinutes,
                      preset.cadenceLabel
                    )
                  }
                  data-testid={`current-day-quick-preset-${preset.id}-btn`}
                  className="px-2 py-0.5 text-[11px] font-mono bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {preset.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label
                htmlFor="current-day-slot-select"
                className="block text-[10px] font-mono text-zinc-400 mb-1"
              >
                Time Slot
              </label>
              <select
                id="current-day-slot-select"
                value={selectedSlotKey}
                onChange={(e) => setSelectedSlotKey(e.target.value)}
                data-testid="current-day-slot-select"
                className="w-full px-2 py-1.5 text-xs font-mono bg-[#0A0A0C] border border-zinc-800 rounded text-white"
              >
                {INTRADAY_FOCUS_BREAK_TIME_SLOTS.map((slot) => (
                  <option key={slot.slotKey} value={slot.slotKey}>
                    {slot.slotLabel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="current-day-focus-minutes-input"
                className="block text-[10px] font-mono text-emerald-400 mb-1"
              >
                Focus (m)
              </label>
              <input
                id="current-day-focus-minutes-input"
                type="number"
                min={5}
                max={180}
                value={focusMinutesInput}
                onChange={(e) => setFocusMinutesInput(e.target.value)}
                data-testid="current-day-focus-minutes-input"
                className="w-full px-2 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white"
              />
            </div>

            <div>
              <label
                htmlFor="current-day-break-minutes-input"
                className="block text-[10px] font-mono text-amber-300 mb-1"
              >
                Break (m)
              </label>
              <input
                id="current-day-break-minutes-input"
                type="number"
                min={0}
                max={90}
                value={breakMinutesInput}
                onChange={(e) => setBreakMinutesInput(e.target.value)}
                data-testid="current-day-break-minutes-input"
                className="w-full px-2 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white"
              />
            </div>

            <div>
              <label
                htmlFor="current-day-topic-input"
                className="block text-[10px] font-mono text-zinc-400 mb-1"
              >
                Subject
              </label>
              <input
                id="current-day-topic-input"
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                data-testid="current-day-topic-input"
                placeholder="Study topic..."
                className="w-full px-2 py-1.5 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {recentToast ? (
              <span
                className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 truncate"
                data-testid="current-day-focus-break-toast"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{recentToast}</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-zinc-400 truncate">
                Adds session into {inspectedPoint.slotLabel} (
                {selectedRoomFilter === 'ALL'
                  ? activeRoomCode
                  : selectedRoomFilter}
                )
              </span>
            )}
            <button
              type="submit"
              data-testid="current-day-focus-break-submit-btn"
              className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Session &amp; Break</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
