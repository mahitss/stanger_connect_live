import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  WeeklyFocusByRoomCodeBarEntry,
  WeeklyFocusByRoomCodeSummary,
  WeeklyRoomFocusMetricUnit,
  WeeklyRoomFocusSortOrder,
  formatStudyDurationLabel,
  normalizeStudyRoomCode,
  sanitizeSafeText,
} from '../utils/rules';
import { BarChart3, ArrowUpRight, Plus, CheckCircle2 } from 'lucide-react';

interface StudyRoomWeeklyRoomFocusRechartsCardProps {
  summary: WeeklyFocusByRoomCodeSummary;
  activeRoomCode: string;
  sortBy: WeeklyRoomFocusSortOrder;
  onChangeSortBy: (nextSort: WeeklyRoomFocusSortOrder) => void;
  onSelectRoomCode: (roomCode: string, roomName?: string) => void;
  onLogRoomFocusMinutes: (
    roomCode: string,
    topic: string,
    minutes: number
  ) => void;
}

interface CustomRoomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: WeeklyFocusByRoomCodeBarEntry;
  }>;
}

const CustomWeeklyRoomBarTooltip: React.FC<CustomRoomTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div
      className="p-3.5 rounded-lg bg-[#050507] border border-zinc-700 shadow-2xl space-y-1.5 text-xs"
      data-testid="weekly-room-recharts-tooltip"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono font-bold text-white">{item.roomCode}</span>
        <span className="font-mono text-emerald-400 tabular-nums">
          {item.sharePercent}% of week
        </span>
      </div>
      <div className="text-[11px] text-zinc-300">{item.roomLabel}</div>
      <div className="pt-1 border-t border-zinc-800/90 flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-zinc-400">Total Focus:</span>
        <span className="font-bold text-white">
          {item.formattedDuration} ({item.focusHours}h)
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums text-[11px]">
        <span className="text-zinc-400">Sessions Logged:</span>
        <span className="text-zinc-200">
          {item.sessionsCount} {item.sessionsCount === 1 ? 'session' : 'sessions'}
        </span>
      </div>
      <div className="text-[11px] text-zinc-400 truncate max-w-[240px]">
        Primary Topic: <span className="text-zinc-200">{item.primaryTopic}</span>
      </div>
    </div>
  );
};

export const StudyRoomWeeklyRoomFocusRechartsCard: React.FC<
  StudyRoomWeeklyRoomFocusRechartsCardProps
> = ({
  summary,
  activeRoomCode,
  sortBy,
  onChangeSortBy,
  onSelectRoomCode,
  onLogRoomFocusMinutes,
}) => {
  const [metricUnit, setMetricUnit] =
    useState<WeeklyRoomFocusMetricUnit>('minutes');
  const [quickRoomInput, setQuickRoomInput] = useState<string>(activeRoomCode);
  const [quickTopicInput, setQuickTopicInput] = useState<string>(
    'System Architecture & Deep Work'
  );
  const [quickMinutesInput, setQuickMinutesInput] = useState<string>('25');
  const [recentLoggedToast, setRecentLoggedToast] = useState<string | null>(
    null
  );

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoom = normalizeStudyRoomCode(quickRoomInput || activeRoomCode);
    const cleanTopic =
      sanitizeSafeText(quickTopicInput, 80) ||
      'System Architecture & Deep Work';
    const clampedMinutes = Math.min(
      240,
      Math.max(5, Math.round(Number(quickMinutesInput) || 25))
    );

    onLogRoomFocusMinutes(cleanRoom, cleanTopic, clampedMinutes);
    setRecentLoggedToast(
      `+${clampedMinutes}m logged to ${cleanRoom} (${cleanTopic})`
    );
    window.setTimeout(() => {
      setRecentLoggedToast(null);
    }, 3500);
  };

  const handleQuickPresetLog = (
    roomCode: string,
    topic: string,
    minutes: number
  ) => {
    onLogRoomFocusMinutes(roomCode, topic, minutes);
    setRecentLoggedToast(`+${minutes}m logged to ${roomCode}`);
    window.setTimeout(() => {
      setRecentLoggedToast(null);
    }, 3500);
  };

  const dataKey = metricUnit === 'hours' ? 'focusHours' : 'focusMinutes';
  const averageLineValue =
    metricUnit === 'hours'
      ? Number((summary.averageMinutesPerRoom / 60).toFixed(1))
      : summary.averageMinutesPerRoom;

  return (
    <section
      id="study-room-weekly-room-focus-chart"
      data-testid="study-room-weekly-room-focus-chart"
      aria-label="Weekly Total Focus Time per Room Code Bar Chart"
      className="p-6 rounded-xl border border-zinc-800/90 bg-[#0A0A0C] space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-emerald-400">
              Weekly Study Habit Analytics
            </span>
            <span aria-hidden="true">·</span>
            <span
              className="font-mono tabular-nums"
              data-testid="weekly-room-focus-window-label"
            >
              {summary.weekWindowLabel}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">
            Weekly Focus Time per Study Room Code
          </h2>
          <p className="text-xs text-zinc-400 max-w-3xl">
            Compare your total focus duration across every Study Room code this
            week. Click any room bar or row below to jump straight into that
            room or log a focus sprint.
          </p>
        </div>

        {/* Unit Toggle & Sort Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-[#050507] border border-zinc-800/90"
            role="group"
            aria-label="Chart metric unit"
          >
            <button
              type="button"
              onClick={() => setMetricUnit('minutes')}
              data-testid="weekly-room-unit-minutes-btn"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap ${
                metricUnit === 'minutes'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Minutes (min)
            </button>
            <button
              type="button"
              onClick={() => setMetricUnit('hours')}
              data-testid="weekly-room-unit-hours-btn"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap ${
                metricUnit === 'hours'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hours (hrs)
            </button>
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-[#050507] border border-zinc-800/90"
            role="group"
            aria-label="Sort study rooms"
          >
            {(
              [
                { id: 'minutes_desc', label: 'Most Focus' },
                { id: 'sessions_desc', label: 'Most Sessions' },
                { id: 'room_asc', label: 'Room A–Z' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeSortBy(opt.id)}
                data-testid={`weekly-room-sort-${opt.id}-btn`}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  sortBy === opt.id
                    ? 'bg-emerald-500 text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">
            Weekly Focus Across All Rooms
          </div>
          <div
            className="text-xl font-bold font-mono text-white tabular-nums"
            data-testid="weekly-room-total-focus-value"
          >
            {summary.totalWeeklyFocusMinutes}m{' '}
            <span className="text-xs font-normal text-zinc-400">
              ({summary.totalWeeklyFocusHours}h)
            </span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400 tabular-nums">
            {summary.totalSessionsCount} sessions across{' '}
            {summary.activeRoomsCount} rooms
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">Top Focus Room This Week</div>
          <div
            className="text-xl font-bold font-mono text-emerald-400 tabular-nums"
            data-testid="weekly-room-top-room-code"
          >
            {summary.topRoomCode}
          </div>
          <div className="text-[11px] font-mono text-zinc-300 tabular-nums">
            {formatStudyDurationLabel(summary.topRoomFocusMinutes)} ·{' '}
            {summary.topRoomSharePercent}% of weekly total
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">
            Active Room ({summary.activeRoomCode})
          </div>
          <div
            className="text-xl font-bold font-mono text-white tabular-nums"
            data-testid="weekly-room-active-room-minutes"
          >
            {summary.activeRoomFocusMinutes}m
          </div>
          <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
            {summary.activeRoomSharePercent}% share of current week
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">Average Focus per Room</div>
          <div
            className="text-xl font-bold font-mono text-white tabular-nums"
            data-testid="weekly-room-average-minutes"
          >
            {summary.averageMinutesPerRoom}m
          </div>
          <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
             Dashed reference line on chart
          </div>
        </div>
      </div>

      {/* Main Grid: Left 7 Cols = Recharts BarChart, Right 5 Cols = Interactive Room Breakdown & Quick Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Recharts Bar Chart Canvas */}
        <div className="lg:col-span-7 p-4 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-zinc-200">
              Total Weekly Focus Time by Room Code (
              {metricUnit === 'hours' ? 'Hours' : 'Minutes'})
            </span>
            <span className="font-mono text-zinc-400 tabular-nums">
              Active Room highlighted in Emerald
            </span>
          </div>

          <div
            className="w-full h-[310px]"
            data-testid="weekly-room-recharts-canvas"
          >
            <ResponsiveContainer width="100%" height={300} minWidth={280}>
              <BarChart
                data={summary.entries}
                margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272A"
                  vertical={false}
                />
                <XAxis
                  dataKey="roomCode"
                  stroke="#A1A1AA"
                  tick={{ fill: '#E4E4E7', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#27272A' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#A1A1AA"
                  tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#27272A' }}
                  tickLine={false}
                  unit={metricUnit === 'hours' ? 'h' : 'm'}
                />
                <Tooltip
                  content={<CustomWeeklyRoomBarTooltip />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                />
                <ReferenceLine
                  y={averageLineValue}
                  stroke="#52525B"
                  strokeDasharray="4 4"
                  label={{
                    value: `Avg ${averageLineValue}${
                      metricUnit === 'hours' ? 'h' : 'm'
                    }`,
                    position: 'insideTopRight',
                    fill: '#A1A1AA',
                    fontSize: 10,
                  }}
                />
                <Bar
                  dataKey={dataKey}
                  name={
                    metricUnit === 'hours' ? 'Focus Hours' : 'Focus Minutes'
                  }
                  radius={[6, 6, 0, 0]}
                  maxBarSize={54}
                  onClick={(barData) => {
                    const raw = barData as unknown as {
                      roomCode?: string;
                      roomLabel?: string;
                      payload?: WeeklyFocusByRoomCodeBarEntry;
                    };
                    const code = raw?.payload?.roomCode || raw?.roomCode;
                    const label = raw?.payload?.roomLabel || raw?.roomLabel;
                    if (code) {
                      onSelectRoomCode(code, label);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {summary.entries.map((entry) => (
                    <Cell
                      key={entry.roomCode}
                      fill={entry.isActiveRoom ? '#10B981' : entry.barColor}
                      stroke={entry.isActiveRoom ? '#34D399' : 'transparent'}
                      strokeWidth={entry.isActiveRoom ? 1.5 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            <span>
              Tip: Click any bar to switch your active Study Room to that room
              code.
            </span>
            <span className="font-mono tabular-nums text-zinc-300">
              Showing {summary.entries.length} room codes
            </span>
          </div>
        </div>

        {/* Right 5 Cols: Per-Room Table & Quick Focus Session Logger */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2.5">
              <span className="font-semibold text-white">
                Room-by-Room Weekly Breakdown
              </span>
              <span className="font-mono text-zinc-400">
                Share · Focus · Action
              </span>
            </div>

            <div
              className="divide-y divide-zinc-800/70 max-h-[220px] overflow-y-auto pr-1"
              data-testid="weekly-room-breakdown-list"
            >
              {summary.entries.map((entry) => (
                <div
                  key={entry.roomCode}
                  data-testid={`weekly-room-row-${entry.roomCode}`}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{
                          backgroundColor: entry.isActiveRoom
                            ? '#10B981'
                            : entry.barColor,
                        }}
                        aria-hidden="true"
                      />
                      <span className="font-mono font-bold text-white truncate">
                        {entry.roomCode}
                      </span>
                      {entry.isActiveRoom && (
                        <span className="text-[11px] font-mono text-emerald-400">
                          · Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {entry.primaryTopic} · {entry.sessionsCount}{' '}
                      {entry.sessionsCount === 1 ? 'session' : 'sessions'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right font-mono tabular-nums">
                      <div
                        className="font-bold text-white"
                        data-testid={`weekly-room-row-minutes-${entry.roomCode}`}
                      >
                        {metricUnit === 'hours'
                          ? `${entry.focusHours}h`
                          : `${entry.focusMinutes}m`}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {entry.sharePercent}%
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleQuickPresetLog(
                          entry.roomCode,
                          entry.primaryTopic,
                          25
                        )
                      }
                      data-testid={`weekly-room-quick-add-25m-${entry.roomCode}`}
                      aria-label={`Log 25m focus session in ${entry.roomCode}`}
                      className="px-2 py-1 text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-zinc-800 rounded transition-colors cursor-pointer whitespace-nowrap"
                    >
                      +25m
                    </button>

                    {!entry.isActiveRoom && (
                      <button
                        type="button"
                        onClick={() =>
                          onSelectRoomCode(entry.roomCode, entry.roomLabel)
                        }
                        data-testid={`weekly-room-switch-btn-${entry.roomCode}`}
                        aria-label={`Switch active room to ${entry.roomCode}`}
                        className="p-1.5 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors cursor-pointer"
                        title={`Switch to ${entry.roomCode}`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Log Focus Time to Any Room Code Form */}
          <form
            onSubmit={handleQuickLogSubmit}
            className="p-4 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-3"
            data-testid="weekly-room-quick-log-form"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                Log Focus Session to Room Code
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                Updates Chart Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label
                  htmlFor="weekly-chart-room-code-input"
                  className="block text-[10px] font-mono text-zinc-400 mb-1"
                >
                  Room Code
                </label>
                <input
                  id="weekly-chart-room-code-input"
                  type="text"
                  value={quickRoomInput}
                  onChange={(e) => setQuickRoomInput(e.target.value)}
                  placeholder="STUDY-204"
                  data-testid="weekly-room-log-code-input"
                  className="w-full px-2.5 py-1.5 text-xs font-mono uppercase bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label
                  htmlFor="weekly-chart-topic-input"
                  className="block text-[10px] font-mono text-zinc-400 mb-1"
                >
                  Study Topic
                </label>
                <input
                  id="weekly-chart-topic-input"
                  type="text"
                  value={quickTopicInput}
                  onChange={(e) => setQuickTopicInput(e.target.value)}
                  placeholder="Deep Work..."
                  data-testid="weekly-room-log-topic-input"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label
                  htmlFor="weekly-chart-minutes-input"
                  className="block text-[10px] font-mono text-zinc-400 mb-1"
                >
                  Minutes (5–240)
                </label>
                <input
                  id="weekly-chart-minutes-input"
                  type="number"
                  min={5}
                  max={240}
                  value={quickMinutesInput}
                  onChange={(e) => setQuickMinutesInput(e.target.value)}
                  data-testid="weekly-room-log-minutes-input"
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="weekly-room-log-submit-btn"
              className="w-full py-2 px-3 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Focus Session to Weekly Room Chart</span>
            </button>

            {recentLoggedToast && (
              <div
                role="status"
                data-testid="weekly-room-log-toast"
                className="p-2 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{recentLoggedToast}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
