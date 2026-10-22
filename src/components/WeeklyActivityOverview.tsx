import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { BarChart3, Clock, Award, CheckCircle2, Flame, Download } from 'lucide-react';
import {
  WeeklyActivitySummary,
  WeeklyActivityDayEntry,
  buildWeeklyActivityJsonExport,
} from '../utils/rules';

export type WeeklyChartMode = 'combined' | 'productivity' | 'points';

interface WeeklyActivityOverviewProps {
  summary: WeeklyActivitySummary;
  dailyTargetMinutes: number;
  onLogQuickFocus?: (minutes: number) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
    payload: WeeklyActivityDayEntry;
  }>;
}

function WeeklyActivityTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const day = payload[0]?.payload;
  if (!day) return null;

  return (
    <div className="p-3 rounded-md bg-[#050505] border border-zinc-700 shadow-xl text-xs space-y-1.5 font-mono tabular-nums">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-1">
        <span className="font-sans font-bold text-white">
          {day.dayName}, {day.shortDate} {day.isToday ? '(Today)' : ''}
        </span>
        <span
          className={
            day.goalReached ? 'text-emerald-400 font-semibold' : 'text-zinc-400'
          }
        >
          {day.goalReached ? 'Goal Met' : `Target: ${day.targetMinutes}m`}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-zinc-300">
        <span>Daily Productivity:</span>
        <strong className="text-emerald-400">{day.focusMinutes} mins</strong>
      </div>
      <div className="flex items-center justify-between gap-4 text-zinc-300">
        <span>Points Earned:</span>
        <strong className="text-amber-400">+{day.pointsEarned} pts</strong>
      </div>
    </div>
  );
}

export function WeeklyActivityOverview({
  summary,
  dailyTargetMinutes,
}: WeeklyActivityOverviewProps) {
  const [chartMode, setChartMode] = useState<WeeklyChartMode>('combined');
  const [exportNotice, setExportNotice] = useState<string>('');

  const showProductivity = chartMode === 'combined' || chartMode === 'productivity';
  const showPoints = chartMode === 'combined' || chartMode === 'points';

  const handleExportActivityJson = () => {
    const exportPayload = buildWeeklyActivityJsonExport({
      summary,
      dailyTargetMinutes,
      nowMs: Date.now(),
    });
    const blob = new Blob([exportPayload.jsonContent], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportPayload.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportNotice(
      `Exported ${exportPayload.filename} (${exportPayload.dayCount} days · ${summary.totalFocusMinutes}m focus)`
    );
  };

  return (
    <section
      className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-5"
      aria-label="Weekly Activity Overview"
      data-testid="weekly-activity-overview"
    >
      {/* Header & Chart View Switcher */}
      <div className="border-b border-zinc-800/80 pb-4 space-y-2.5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
              <h2 className="text-lg font-bold text-white">Weekly Activity Overview</h2>
              <span aria-hidden="true" className="text-xs text-zinc-600">
                ·
              </span>
              <span className="text-xs font-mono text-zinc-400 tabular-nums">
                Last 7 Days
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Visualizing your daily focus productivity (minutes) and participation points earned over the past 7 days.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Chart Metric Filter Controls */}
            <div
              className="flex flex-wrap items-center gap-1 p-1 bg-[#050505] border border-zinc-800 rounded-md max-w-full"
              role="group"
              aria-label="Weekly Activity Chart View Mode"
            >
              <button
                type="button"
                onClick={() => setChartMode('combined')}
                data-testid="weekly-chart-mode-combined"
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                  chartMode === 'combined'
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Combined Overview
              </button>
              <button
                type="button"
                onClick={() => setChartMode('productivity')}
                data-testid="weekly-chart-mode-productivity"
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                  chartMode === 'productivity'
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Productivity (Mins)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('points')}
                data-testid="weekly-chart-mode-points"
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                  chartMode === 'points'
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Points Earned
              </button>
            </div>

            {/* Export Activity JSON Button */}
            <button
              type="button"
              onClick={handleExportActivityJson}
              data-testid="export-weekly-activity-json-btn"
              aria-label="Export weekly productivity activity data as a JSON file"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 hover:border-zinc-500 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Export Activity</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div
            role="status"
            data-testid="export-weekly-activity-json-status"
            className="text-xs font-mono text-emerald-400 font-semibold"
          >
            {exportNotice}
          </div>
        )}
      </div>

      {/* 7-Day Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className=" whitespace-nowrap">7-Day Focus Time</span>
            </div>
            <div
              className="text-base font-bold font-mono tabular-nums text-white"
              data-testid="weekly-total-focus-minutes"
            >
              {summary.totalFocusMinutes} mins
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs text-zinc-400 shrink-0 whitespace-nowrap">
            <div>Avg {summary.averageFocusMinutes}m/d</div>
            <div className="text-emerald-400">Goal {dailyTargetMinutes}m</div>
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">7-Day Points Earned</span>
            </div>
            <div
              className="text-base font-bold font-mono tabular-nums text-amber-400"
              data-testid="weekly-total-points-earned"
            >
              +{summary.totalPointsEarned} pts
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs text-zinc-400 shrink-0 whitespace-nowrap">
            <div>Avg +{summary.averagePointsEarned} pts</div>
            <div className="text-zinc-500">7d Window</div>
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Daily Target Hit Rate</span>
            </div>
            <div
              className="text-base font-bold font-mono tabular-nums text-white"
              data-testid="weekly-goal-hit-days"
            >
              {summary.daysGoalReached} / 7 Days
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs text-emerald-400 shrink-0 whitespace-nowrap">
            {Math.round((summary.daysGoalReached / 7) * 100)}% Hit Rate
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">Peak Productivity Day</span>
            </div>
            <div className="text-sm font-bold text-white truncate">
              {summary.peakDayLabel}
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs text-emerald-400 font-semibold shrink-0 whitespace-nowrap">
            {summary.peakFocusMinutes} mins
          </div>
        </div>
      </div>

      {/* Recharts 7-Day Visualization Container */}
      <div
        className="p-4 rounded-md border border-zinc-800/80 bg-[#050505] space-y-3"
        data-testid="weekly-activity-recharts-container"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-4">
            {showProductivity && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                <span className="text-zinc-300 font-medium">
                  Daily Productivity (Focus Mins)
                </span>
              </span>
            )}
            {showPoints && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span className="text-zinc-300 font-medium">
                  Points Earned (pts)
                </span>
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
            Daily Goal Line: {dailyTargetMinutes} mins
          </span>
        </div>

        <div className="w-full h-[260px] min-w-0">
          <ResponsiveContainer width="100%" height={260} minWidth={260}>
            <ComposedChart
              data={summary.days}
              barCategoryGap="22%"
              margin={{ top: 12, right: 12, left: -8, bottom: 4 }}
            >
              <defs>
                <linearGradient id="weeklyPointsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="dayLabel"
                stroke="#71717a"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />
              {showProductivity && (
                <YAxis
                  yAxisId="minutes"
                  orientation="left"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  unit="m"
                />
              )}
              {showPoints && (
                <YAxis
                  yAxisId="points"
                  orientation={showProductivity ? 'right' : 'left'}
                  stroke="#71717a"
                  tick={{ fill: '#fbbf24', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  unit="p"
                />
              )}
              <Tooltip content={<WeeklyActivityTooltip />} />
              {showProductivity && (
                <ReferenceLine
                  yAxisId="minutes"
                  y={dailyTargetMinutes}
                  stroke="#52525b"
                  strokeDasharray="4 4"
                />
              )}
              {showProductivity && (
                <Bar
                  yAxisId="minutes"
                  dataKey="focusMinutes"
                  name="Daily Productivity (mins)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  isAnimationActive={false}
                >
                  {summary.days.map((entry) => (
                    <Cell
                      key={entry.dateKey}
                      fill={
                        entry.isToday
                          ? '#34d399'
                          : entry.goalReached
                          ? '#10b981'
                          : '#3f3f46'
                      }
                    />
                  ))}
                </Bar>
              )}
              {showPoints && (
                <Area
                  yAxisId="points"
                  type="monotone"
                  dataKey="pointsEarned"
                  name="Points Earned (pts)"
                  stroke="#fbbf24"
                  strokeWidth={2.25}
                  fillOpacity={1}
                  fill="url(#weeklyPointsGradient)"
                  dot={{ r: 3.5, fill: '#fbbf24', stroke: '#050505', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#fde68a', stroke: '#050505', strokeWidth: 1.5 }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Chronological Breakdown Strip */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5"
        data-testid="weekly-activity-day-cards"
      >
        {summary.days.map((day) => (
          <div
            key={day.dateKey}
            data-testid={day.isToday ? 'weekly-day-card-today' : `weekly-day-card-${day.dateKey}`}
            className={`p-3 rounded-md border space-y-1.5 font-mono tabular-nums ${
              day.isToday
                ? 'bg-zinc-900/90 border-emerald-500/50'
                : 'bg-[#050505] border-zinc-800/80'
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-sans font-bold text-white">
                {day.isToday ? 'Today' : day.dayName}
              </span>
              <span className="text-zinc-500">{day.shortDate}</span>
            </div>
            <div className="text-xs font-bold text-emerald-400">
              {day.focusMinutes}m focus
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-amber-400">+{day.pointsEarned} pts</span>
              <span
                className={
                  day.goalReached ? 'text-emerald-400' : 'text-zinc-500'
                }
              >
                {day.goalReached ? 'Goal Met' : `${day.targetMinutes}m`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
