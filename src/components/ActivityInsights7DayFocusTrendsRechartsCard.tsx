import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Flame,
  Plus,
  Sparkles,
} from './ArchitecturalGlyphs';
import {
  WeeklyActivitySummary,
  ActivityInsightsFocusTrendChartMode,
  ActivityInsightsFocusTrendUnit,
  ActivityInsightsFocusTrendDayPoint,
  buildActivityInsights7DayFocusTrendSummary,
  filterLiveRecordedWeeklyActivityOverview,
} from '../utils/rules';

interface ActivityInsights7DayFocusTrendsRechartsCardProps {
  summary: WeeklyActivitySummary;
  dailyTargetMinutes: number;
  onLogQuickFocus?: (minutes: number) => void;
}

interface FocusTrendTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
    payload: ActivityInsightsFocusTrendDayPoint;
  }>;
  unit: ActivityInsightsFocusTrendUnit;
  chartMode: ActivityInsightsFocusTrendChartMode;
}

function FocusTrendCustomTooltip({
  active,
  payload,
  unit,
  chartMode,
}: FocusTrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const deltaSign = point.deltaVsTargetMinutes >= 0 ? '+' : '';

  return (
    <div
      className="p-3.5 rounded-lg bg-[#050507] border border-zinc-700 shadow-2xl text-xs space-y-1.5 font-mono tabular-nums"
      data-testid="activity-insights-7d-focus-tooltip"
    >
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-1.5">
        <span className="font-sans font-bold text-white">
          {point.dayName}, {point.shortDate} {point.isToday ? '(Today)' : ''}
        </span>
        <span
          className={
            point.goalReached ? 'text-emerald-400 font-semibold' : 'text-zinc-400'
          }
        >
          {point.goalReached ? 'Goal Met' : `${point.completionPercent}% of goal`}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 text-zinc-300">
        <span>Daily Focus Time:</span>
        <strong className="text-emerald-400">
          {unit === 'hours'
            ? `${point.focusHours}h (${point.focusMinutes}m)`
            : `${point.focusMinutes} mins (${point.focusHours}h)`}
        </strong>
      </div>

      <div className="flex items-center justify-between gap-4 text-zinc-300">
        <span>3-Day Rolling Avg:</span>
        <strong className="text-amber-400">
          {unit === 'hours'
            ? `${point.rollingAvgHours}h`
            : `${point.rollingAvgMinutes} mins`}
        </strong>
      </div>

      {chartMode === 'cumulative' && (
        <div className="flex items-center justify-between gap-4 text-zinc-300">
          <span>7-Day Cumulative:</span>
          <strong className="text-sky-400">
            {unit === 'hours'
              ? `${point.cumulativeHours}h`
              : `${point.cumulativeMinutes} mins`}
          </strong>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 text-zinc-400 pt-1 border-t border-zinc-800/80">
        <span>vs Daily Target ({point.targetMinutes}m):</span>
        <span
          className={
            point.deltaVsTargetMinutes >= 0 ? 'text-emerald-400' : 'text-amber-300'
          }
        >
          {deltaSign}
          {point.deltaVsTargetMinutes}m
        </span>
      </div>
    </div>
  );
}

export const ActivityInsights7DayFocusTrendsRechartsCard: React.FC<
  ActivityInsights7DayFocusTrendsRechartsCardProps
> = ({ summary, dailyTargetMinutes, onLogQuickFocus }) => {
  const [chartMode, setChartMode] =
    useState<ActivityInsightsFocusTrendChartMode>('area_trend');
  const [unit, setUnit] = useState<ActivityInsightsFocusTrendUnit>('minutes');
  const [liveRecordedOnly, setLiveRecordedOnly] = useState<boolean>(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('25');
  const [loggedFeedback, setLoggedFeedback] = useState<string | null>(null);

  const effectiveSummary = useMemo(() => {
    if (!liveRecordedOnly) return summary;
    const todayEntry = summary.days.find((d) => d.isToday);
    return filterLiveRecordedWeeklyActivityOverview({
      summary,
      todayFocusMinutes: todayEntry?.focusMinutes ?? 0,
      todayPointsEarned: todayEntry?.pointsEarned ?? 0,
    });
  }, [summary, liveRecordedOnly]);

  const trendSummary = useMemo(
    () =>
      buildActivityInsights7DayFocusTrendSummary({
        summary: effectiveSummary,
        dailyTargetMinutes,
      }),
    [effectiveSummary, dailyTargetMinutes]
  );

  const selectedDayPoint = useMemo(() => {
    if (!trendSummary.days.length) return null;
    if (selectedDayKey) {
      const found = trendSummary.days.find((d) => d.dateKey === selectedDayKey);
      if (found) return found;
    }
    return trendSummary.days[trendSummary.days.length - 1];
  }, [trendSummary.days, selectedDayKey]);

  const handleLogFocus = (minutesToLog: number) => {
    const safeMins = Math.min(240, Math.max(5, Math.round(Number(minutesToLog) || 25)));
    if (onLogQuickFocus) {
      onLogQuickFocus(safeMins);
    }
    setLoggedFeedback(
      `+${safeMins}m focus logged to Today — 7-day trend chart updated.`
    );
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Math.min(240, Math.max(5, Math.round(Number(customMinutesInput) || 25)));
    handleLogFocus(parsed);
  };

  const primaryDataKey = unit === 'hours' ? 'focusHours' : 'focusMinutes';
  const rollingDataKey = unit === 'hours' ? 'rollingAvgHours' : 'rollingAvgMinutes';
  const cumulativeDataKey =
    unit === 'hours' ? 'cumulativeHours' : 'cumulativeMinutes';
  const targetReferenceValue =
    unit === 'hours'
      ? trendSummary.dailyTargetHours
      : trendSummary.dailyTargetMinutes;
  const unitSuffix = unit === 'hours' ? 'h' : 'm';

  return (
    <section
      id="activity-insights-7d-focus-trends-card"
      data-testid="activity-insights-7d-focus-trends-card"
      aria-label="7-Day Focus Time Trends Recharts Visualization"
      className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-5"
    >
      {/* Header & Interactive View Mode / Unit Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 className="text-lg font-bold text-white">
              7-Day Focus Time Trends
            </h2>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              data-testid="activity-insights-7d-window-range"
            >
              {trendSummary.windowDateRangeLabel}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                trendSummary.trendDirection === 'upward'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : trendSummary.trendDirection === 'downward'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700'
              }`}
              data-testid="activity-insights-7d-momentum-badge"
            >
              {trendSummary.trendSummaryBadge}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Recharts visualization of your daily focus duration, 3-day rolling momentum average, and cumulative study trajectory over the last 7 days.
          </p>
        </div>

        {/* Chart Mode & Metric Unit Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap items-center gap-1 p-1 bg-[#050505] border border-zinc-800 rounded-md"
            role="group"
            aria-label="7-Day Focus Trend Chart Mode"
          >
            <button
              type="button"
              onClick={() => setChartMode('area_trend')}
              data-testid="focus-trend-mode-area-btn"
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                chartMode === 'area_trend'
                  ? 'bg-emerald-500 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Area + Rolling Avg
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar_comparison')}
              data-testid="focus-trend-mode-bar-btn"
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                chartMode === 'bar_comparison'
                  ? 'bg-emerald-500 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Daily Bars vs Target
            </button>
            <button
              type="button"
              onClick={() => setChartMode('cumulative')}
              data-testid="focus-trend-mode-cumulative-btn"
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                chartMode === 'cumulative'
                  ? 'bg-emerald-500 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cumulative 7d Curve
            </button>
          </div>

          <div
            className="flex items-center gap-1 p-1 bg-[#050505] border border-zinc-800 rounded-md"
            role="group"
            aria-label="Focus Trend Metric Unit"
          >
            <button
              type="button"
              onClick={() => setUnit('minutes')}
              data-testid="focus-trend-unit-minutes-btn"
              className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                unit === 'minutes'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mins (m)
            </button>
            <button
              type="button"
              onClick={() => setUnit('hours')}
              data-testid="focus-trend-unit-hours-btn"
              className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                unit === 'hours'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hours (h)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setLiveRecordedOnly((prev) => !prev)}
            data-testid="focus-trend-live-recorded-toggle-btn"
            aria-pressed={liveRecordedOnly}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              liveRecordedOnly
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-[#050505] border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {liveRecordedOnly ? 'Recorded Only: ON' : 'Recorded Only'}
          </button>
        </div>
      </div>

      {/* 4-Card 7-Day Focus Trend KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">7-Day Total Focus</span>
            </div>
            <div
              className="text-base font-bold font-mono tabular-nums text-white"
              data-testid="focus-trend-total-minutes"
            >
              {unit === 'hours'
                ? `${trendSummary.totalFocusHours} hrs`
                : `${trendSummary.totalFocusMinutes} mins`}
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs text-zinc-400 shrink-0 whitespace-nowrap">
            <div>Avg {trendSummary.averageFocusMinutes}m/d</div>
            <div className="text-emerald-400">
              {trendSummary.totalFocusHours}h total
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">3-Day Rolling Average</span>
            </div>
            <div
              className="text-base font-bold font-mono tabular-nums text-amber-400"
              data-testid="focus-trend-rolling-avg"
            >
              {trendSummary.latestRollingAvgMinutes} mins/d
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs text-zinc-400 shrink-0 whitespace-nowrap">
            <div>
              {trendSummary.trendDeltaMinutes >= 0 ? '+' : ''}
              {trendSummary.trendDeltaMinutes}m vs early wk
            </div>
            <div className="text-zinc-500">
              {trendSummary.trendDeltaPercent >= 0 ? '+' : ''}
              {trendSummary.trendDeltaPercent}% pace
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Goal Consistency (7d)</span>
            </div>
            <div
              className="text-base font-bold font-mono tabular-nums text-white"
              data-testid="focus-trend-goal-consistency"
            >
              {trendSummary.daysGoalReached} / 7 Days
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs text-emerald-400 shrink-0 whitespace-nowrap">
            <div>{trendSummary.goalHitRatePercent}% Hit Rate</div>
            <div className="text-zinc-500">
              Target {trendSummary.dailyTargetMinutes}m
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">7-Day Peak Focus Day</span>
            </div>
            <div
              className="text-sm font-bold text-white truncate"
              data-testid="focus-trend-peak-day-label"
            >
              {trendSummary.peakDayLabel}
            </div>
          </div>
          <div
            className="text-right font-mono tabular-nums text-xs text-emerald-400 font-semibold shrink-0 whitespace-nowrap"
            data-testid="focus-trend-peak-minutes"
          >
            {trendSummary.peakFocusMinutes} mins
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left 7 Cols Recharts Canvas + Right 5 Cols Day Inspector & Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 7 Cols: Recharts 7-Day Focus Trend Canvas */}
        <div
          className="lg:col-span-7 p-4 rounded-md border border-zinc-800/80 bg-[#050505] flex flex-col justify-between space-y-3"
          data-testid="activity-insights-7d-recharts-canvas"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <div className="flex flex-wrap items-center gap-4">
              {chartMode === 'area_trend' && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                    <span className="text-zinc-200 font-medium">
                      Daily Focus ({unit === 'hours' ? 'hrs' : 'mins'})
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span className="text-zinc-200 font-medium">
                      3-Day Rolling Average
                    </span>
                  </span>
                </>
              )}
              {chartMode === 'bar_comparison' && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                    <span className="text-zinc-200 font-medium">
                      Goal Reached / Today
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-zinc-600 inline-block" />
                    <span className="text-zinc-300 font-medium">
                      In Progress (&lt; Target)
                    </span>
                  </span>
                </>
              )}
              {chartMode === 'cumulative' && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-400 inline-block" />
                  <span className="text-zinc-200 font-medium">
                    7-Day Cumulative Focus Curve ({trendSummary.totalFocusMinutes}m)
                  </span>
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
              Target Line: {targetReferenceValue}
              {unitSuffix}/day
            </span>
          </div>

          <div className="w-full h-[280px] min-w-0">
            <ResponsiveContainer width="100%" height={280} minWidth={260}>
              {chartMode === 'area_trend' ? (
                <ComposedChart
                  data={trendSummary.days}
                  margin={{ top: 12, right: 14, left: -6, bottom: 4 }}
                >
                  <defs>
                    <linearGradient
                      id="activityInsightsFocusAreaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
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
                    tick={{ fill: '#d4d4d8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={false}
                    unit={unitSuffix}
                  />
                  <Tooltip
                    content={
                      <FocusTrendCustomTooltip unit={unit} chartMode={chartMode} />
                    }
                  />
                  <ReferenceLine
                    y={targetReferenceValue}
                    stroke="#52525b"
                    strokeDasharray="4 4"
                    label={{
                      value: `Goal ${targetReferenceValue}${unitSuffix}`,
                      position: 'insideTopRight',
                      fill: '#a1a1aa',
                      fontSize: 10,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={primaryDataKey}
                    name="Daily Focus"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#activityInsightsFocusAreaGrad)"
                    dot={{ r: 4, fill: '#10b981', stroke: '#050505', strokeWidth: 1.5 }}
                    activeDot={{
                      r: 6,
                      fill: '#34d399',
                      stroke: '#050505',
                      strokeWidth: 1.5,
                    }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={rollingDataKey}
                    name="3-Day Rolling Avg"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={{ r: 3, fill: '#fbbf24', stroke: '#050505', strokeWidth: 1 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              ) : chartMode === 'bar_comparison' ? (
                <BarChart
                  data={trendSummary.days}
                  margin={{ top: 12, right: 14, left: -6, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#71717a"
                    tick={{ fill: '#d4d4d8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={false}
                    unit={unitSuffix}
                  />
                  <Tooltip
                    content={
                      <FocusTrendCustomTooltip unit={unit} chartMode={chartMode} />
                    }
                  />
                  <ReferenceLine
                    y={targetReferenceValue}
                    stroke="#fbbf24"
                    strokeDasharray="4 4"
                  />
                  <Bar
                    dataKey={primaryDataKey}
                    name="Daily Focus"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={36}
                    isAnimationActive={false}
                  >
                    {trendSummary.days.map((entry) => (
                      <Cell
                        key={entry.dateKey}
                        fill={
                          entry.isToday
                            ? '#34d399'
                            : entry.goalReached
                            ? '#10b981'
                            : '#52525b'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart
                  data={trendSummary.days}
                  margin={{ top: 12, right: 14, left: -6, bottom: 4 }}
                >
                  <defs>
                    <linearGradient
                      id="activityInsightsCumulativeGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
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
                    tick={{ fill: '#d4d4d8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={false}
                    unit={unitSuffix}
                  />
                  <Tooltip
                    content={
                      <FocusTrendCustomTooltip unit={unit} chartMode={chartMode} />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={cumulativeDataKey}
                    name="Cumulative 7d Focus"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#activityInsightsCumulativeGrad)"
                    dot={{ r: 4, fill: '#38bdf8', stroke: '#050505', strokeWidth: 1.5 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900 text-[11px] text-zinc-400 font-mono">
            <span>
              Early Week Avg (Days 1–3): {trendSummary.firstHalfAvgMinutes}m/d
            </span>
            <span>
              Recent Avg (Days 4–7): {trendSummary.secondHalfAvgMinutes}m/d
            </span>
          </div>
        </div>

        {/* Right 5 Cols: Interactive 7-Day Focus Inspector & Quick Focus Logger */}
        <div className="lg:col-span-5 p-4 rounded-md border border-zinc-800/80 bg-[#050505] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-2 text-xs">
              <span className="font-bold text-white">
                7-Day Focus Trend Breakdown
              </span>
              <span className="font-mono text-zinc-400">
                Click day to inspect
              </span>
            </div>

            {/* 7-Day Selector List */}
            <div
              className="space-y-1.5 max-h-[195px] overflow-y-auto pr-1"
              data-testid="activity-insights-7d-day-selector-list"
            >
              {trendSummary.days.map((day) => {
                const isSelected = selectedDayPoint?.dateKey === day.dateKey;
                const deltaPrefix = day.deltaVsTargetMinutes >= 0 ? '+' : '';
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDayKey(day.dateKey)}
                    data-testid={
                      day.isToday
                        ? 'focus-trend-day-row-today'
                        : `focus-trend-day-row-${day.dateKey}`
                    }
                    className={`w-full px-3 py-2 rounded border text-left transition-colors flex items-center justify-between gap-2 text-xs font-mono tabular-nums cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/35 border-emerald-500/60 text-white'
                        : 'bg-[#0A0A0C] border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          day.isToday
                            ? 'bg-emerald-400'
                            : day.goalReached
                            ? 'bg-emerald-500'
                            : 'bg-zinc-600'
                        }`}
                      />
                      <span className="font-sans font-semibold text-white">
                        {day.isToday ? `${day.dayName} (Today)` : day.dayName}
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        {day.shortDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-bold text-emerald-400">
                        {unit === 'hours' ? `${day.focusHours}h` : `${day.focusMinutes}m`}
                      </span>
                      <span className="text-[11px] text-amber-300">
                        3d avg {day.rollingAvgMinutes}m
                      </span>
                      <span
                        className={`text-[11px] ${
                          day.deltaVsTargetMinutes >= 0
                            ? 'text-emerald-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        ({deltaPrefix}
                        {day.deltaVsTargetMinutes}m)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Detail Callout */}
            {selectedDayPoint && (
              <div
                className="p-3 rounded bg-[#0A0A0C] border border-zinc-800/90 space-y-1 text-xs font-mono tabular-nums"
                data-testid="activity-insights-selected-day-detail"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-white">
                    {selectedDayPoint.dayName}, {selectedDayPoint.shortDate}{' '}
                    {selectedDayPoint.isToday ? '· Today' : ''}
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {selectedDayPoint.completionPercent}% of {selectedDayPoint.targetMinutes}m goal
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <span>Focus: {selectedDayPoint.focusMinutes}m</span>
                  <span>3d Avg: {selectedDayPoint.rollingAvgMinutes}m</span>
                  <span>Cumulative: {selectedDayPoint.cumulativeMinutes}m</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Focus Sprint Logger (Updates Today & 7-Day Trend Chart Immediately) */}
          <form
            onSubmit={handleCustomSubmit}
            className="pt-3 border-t border-zinc-900 space-y-2.5"
            data-testid="activity-insights-7d-focus-log-form"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                Log Focus Sprint to Today&apos;s Trend
              </span>
              <div className="flex items-center gap-1">
                {[15, 25, 45].map((presetMins) => (
                  <button
                    key={presetMins}
                    type="button"
                    onClick={() => handleLogFocus(presetMins)}
                    data-testid={`focus-trend-quick-add-${presetMins}m-btn`}
                    className="px-2 py-0.5 text-[11px] font-mono rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-zinc-800 transition-colors cursor-pointer"
                  >
                    +{presetMins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="focus-trend-custom-mins-input" className="sr-only">
                Custom focus minutes to log
              </label>
              <input
                id="focus-trend-custom-mins-input"
                type="number"
                min={5}
                max={240}
                value={customMinutesInput}
                onChange={(e) => setCustomMinutesInput(e.target.value)}
                data-testid="focus-trend-custom-mins-input"
                className="w-24 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-zinc-500"
              />
              <button
                type="submit"
                data-testid="focus-trend-log-submit-btn"
                className="flex-1 py-1.5 px-3 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Focus Time</span>
              </button>
            </div>

            {loggedFeedback && (
              <div
                role="status"
                data-testid="focus-trend-log-status"
                className="text-[11px] font-mono text-emerald-400"
              >
                {loggedFeedback}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
