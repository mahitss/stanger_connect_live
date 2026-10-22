import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import {
  StudyFocus7DayTrendSummary,
  StudyFocus7DayDayBucket,
  StudyFocusSessionEntry,
} from '../utils/rules';
import { TrendingUp, Clock, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

interface StudyFocus7DayD3ChartProps {
  trendSummary: StudyFocus7DayTrendSummary;
  activeRoomCode: string;
  onLogStudySession?: (minutes: number, topic: string) => void;
}

type D3ChartViewMode = 'stacked_trend' | 'session_growth';

const SESSION_LAYER_COLORS = [
  '#059669', // Session 1: Deep Emerald 600
  '#10B981', // Session 2: Emerald 500
  '#34D399', // Session 3: Emerald 400
  '#38BDF8', // Session 4+: Sky 400
];

export const StudyFocus7DayD3Chart: React.FC<StudyFocus7DayD3ChartProps> = ({
  trendSummary,
  activeRoomCode,
  onLogStudySession,
}) => {
  const [viewMode, setViewMode] = useState<D3ChartViewMode>('stacked_trend');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const days = trendSummary.days;
  const allSessions = trendSummary.allSessions;

  const activeDay: StudyFocus7DayDayBucket = useMemo(() => {
    if (selectedDateKey) {
      const found = days.find((d) => d.dateKey === selectedDateKey);
      if (found) return found;
    }
    return days[days.length - 1] || days[0];
  }, [days, selectedDateKey]);

  const hoveredSession: StudyFocusSessionEntry | null = useMemo(() => {
    if (!hoveredSessionId) return null;
    return allSessions.find((s) => s.sessionId === hoveredSessionId) || null;
  }, [allSessions, hoveredSessionId]);

  // SVG coordinate space dimensions for responsive D3 rendering
  const svgWidth = 860;
  const svgHeight = 310;
  const margin = { top: 28, right: 36, bottom: 46, left: 52 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  // D3 Scales & Generators for Mode 1: 7-Day Stacked Sessions + Daily Trend Curve
  const stackedChartGeometry = useMemo(() => {
    const xScale = d3
      .scaleBand<string>()
      .domain(days.map((d) => d.dateKey))
      .range([0, innerWidth])
      .paddingInner(0.34)
      .paddingOuter(0.16);

    const maxDayFocus = d3.max(days, (d) => Math.max(d.totalFocusMinutes, d.targetMinutes)) || 120;
    const yMax = Math.max(60, Math.ceil((maxDayFocus * 1.16) / 20) * 20);

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([innerHeight, 0]);

    const bandwidth = xScale.bandwidth();

    const lineGenerator = d3
      .line<StudyFocus7DayDayBucket>()
      .x((d) => (xScale(d.dateKey) ?? 0) + bandwidth / 2)
      .y((d) => yScale(d.totalFocusMinutes))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3
      .area<StudyFocus7DayDayBucket>()
      .x((d) => (xScale(d.dateKey) ?? 0) + bandwidth / 2)
      .y0(innerHeight)
      .y1((d) => yScale(d.totalFocusMinutes))
      .curve(d3.curveMonotoneX);

    const trendPath = lineGenerator(days) || '';
    const areaPath = areaGenerator(days) || '';
    const yTicks = yScale.ticks(5);
    const targetMinutes = days[days.length - 1]?.targetMinutes || 120;
    const targetY = yScale(targetMinutes);

    return {
      xScale,
      yScale,
      bandwidth,
      trendPath,
      areaPath,
      yTicks,
      targetMinutes,
      targetY,
    };
  }, [days, innerWidth, innerHeight]);

  // D3 Scales & Generators for Mode 2: Individual Session Growth Curve (All Sessions #1..#N)
  const sessionGrowthGeometry = useMemo(() => {
    const sessionKeys = allSessions.map((s) => String(s.globalSessionNumber));
    const xScale = d3
      .scaleBand<string>()
      .domain(sessionKeys.length > 0 ? sessionKeys : ['1'])
      .range([0, innerWidth])
      .paddingInner(0.28)
      .paddingOuter(0.14);

    const maxSessionMins = d3.max(allSessions, (s) => s.minutes) || 60;
    const yMax = Math.max(45, Math.ceil((maxSessionMins * 1.22) / 15) * 15);

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([innerHeight, 0]);

    const bandwidth = xScale.bandwidth();

    const sessionLineGenerator = d3
      .line<StudyFocusSessionEntry>()
      .x((s) => (xScale(String(s.globalSessionNumber)) ?? 0) + bandwidth / 2)
      .y((s) => yScale(s.minutes))
      .curve(d3.curveMonotoneX);

    const sessionAreaGenerator = d3
      .area<StudyFocusSessionEntry>()
      .x((s) => (xScale(String(s.globalSessionNumber)) ?? 0) + bandwidth / 2)
      .y0(innerHeight)
      .y1((s) => yScale(s.minutes))
      .curve(d3.curveMonotoneX);

    const growthPath = sessionLineGenerator(allSessions) || '';
    const growthArea = sessionAreaGenerator(allSessions) || '';
    const yTicks = yScale.ticks(5);
    const meanMinutes = Math.round(d3.mean(allSessions, (s) => s.minutes) || 0);
    const meanY = yScale(meanMinutes);

    return {
      xScale,
      yScale,
      bandwidth,
      growthPath,
      growthArea,
      yTicks,
      meanMinutes,
      meanY,
    };
  }, [allSessions, innerWidth, innerHeight]);

  return (
    <div
      className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-5"
      data-testid="study-focus-7day-d3-chart"
      aria-label="7-Day Completed Study Focus Minutes and Individual Session Growth Chart"
    >
      {/* Top Header & Quick Session Growth Log Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2
              className="text-base font-bold text-white"
              data-testid="study-d3-chart-heading"
            >
              7-Day Study Focus Trend & Individual Session Growth
            </h2>
            <span aria-hidden="true" className="text-xs text-zinc-600">
              ·
            </span>
            <span
              className="text-xs font-mono tabular-nums text-emerald-400"
              data-testid="study-d3-session-growth-badge"
            >
              {trendSummary.sessionGrowthPercent >= 0
                ? `+${trendSummary.sessionGrowthPercent}% Session Stamina Growth`
                : `${trendSummary.sessionGrowthPercent}% Session Stamina Change`}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            D3 visualization of completed study focus minutes over the past 7 days, decomposing each day into individual focus sessions to track session-by-session stamina growth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap items-center gap-1 p-1 bg-[#050505] border border-zinc-800 rounded-md"
            role="group"
            aria-label="D3 Focus Trend View Mode"
            data-testid="study-d3-view-mode-group"
          >
            <button
              type="button"
              onClick={() => setViewMode('stacked_trend')}
              aria-pressed={viewMode === 'stacked_trend'}
              data-testid="study-d3-mode-stacked"
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'stacked_trend'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              7-Day Trend & Stacked Sessions
            </button>
            <button
              type="button"
              onClick={() => setViewMode('session_growth')}
              aria-pressed={viewMode === 'session_growth'}
              data-testid="study-d3-mode-growth"
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'session_growth'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Individual Session Growth ({allSessions.length})
            </button>
          </div>

          {onLogStudySession && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onLogStudySession(15, `Active Recall Sprint (${activeRoomCode})`)
                }
                data-testid="study-d3-log-15m"
                className="px-2.5 py-1.5 text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-md whitespace-nowrap shrink-0"
              >
                +15m Session
              </button>
              <button
                type="button"
                onClick={() =>
                  onLogStudySession(25, `Pomodoro Focus Block (${activeRoomCode})`)
                }
                data-testid="study-d3-log-25m"
                className="px-2.5 py-1.5 text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 rounded-md whitespace-nowrap shrink-0"
              >
                +25m Pomodoro
              </button>
              <button
                type="button"
                onClick={() =>
                  onLogStudySession(50, `Deep Work Synthesis (${activeRoomCode})`)
                }
                data-testid="study-d3-log-50m"
                className="px-3 py-1.5 text-xs font-mono font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
              >
                +50m Deep Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>7-Day Completed Focus</span>
            </div>
            <div
              className="text-xl font-bold font-mono tabular-nums text-white"
              data-testid="study-d3-total-minutes"
            >
              {trendSummary.totalFocusMinutes} mins
            </div>
          </div>
          <div className="text-right text-xs font-mono tabular-nums text-zinc-400">
            <div>Avg {trendSummary.averageDailyFocusMinutes}m/d</div>
            <div className="text-emerald-400">{trendSummary.totalSessionsCount} sessions</div>
          </div>
        </div>

        <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Avg Session Duration</span>
            </div>
            <div
              className="text-xl font-bold font-mono tabular-nums text-sky-400"
              data-testid="study-d3-avg-session"
            >
              {trendSummary.averageSessionMinutes} mins
            </div>
          </div>
          <div className="text-right text-xs font-mono tabular-nums text-zinc-400">
            <div>Early: {trendSummary.firstHalfAvgSessionMinutes}m</div>
            <div className="text-zinc-200">Recent: {trendSummary.secondHalfAvgSessionMinutes}m</div>
          </div>
        </div>

        <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Longest Focus Session</span>
            </div>
            <div
              className="text-xl font-bold font-mono tabular-nums text-amber-400"
              data-testid="study-d3-longest-session"
            >
              {trendSummary.longestSessionMinutes} mins
            </div>
          </div>
          <div className="text-right text-xs font-mono text-zinc-400 max-w-[130px] truncate">
            {trendSummary.longestSessionTopic}
          </div>
        </div>

        <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Peak Study Day</span>
            </div>
            <div
              className="text-base font-bold text-white truncate"
              data-testid="study-d3-peak-day"
            >
              {trendSummary.peakDayLabel}
            </div>
          </div>
          <div className="text-right font-mono tabular-nums">
            <span className="text-sm font-bold text-emerald-400">
              {trendSummary.peakDayMinutes} mins
            </span>
          </div>
        </div>
      </div>

      {/* Main D3 SVG Canvas */}
      <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-4">
            {viewMode === 'stacked_trend' ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#059669] inline-block" />
                  <span>Session 1 (Warmup)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981] inline-block" />
                  <span>Session 2 (Core Block)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#34D399] inline-block" />
                  <span>Session 3+ (Peak Stamina)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                  <span>D3 7-Day Focus Trend Line</span>
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                  <span>Individual Completed Session (Mins)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-sky-400 inline-block" />
                  <span>D3 Session Stamina Growth Curve</span>
                </span>
              </>
            )}
          </div>

          <span className="font-mono tabular-nums text-zinc-500">
            {hoveredSession
              ? `Session #${hoveredSession.globalSessionNumber} (${hoveredSession.dayName} · S${hoveredSession.sessionIndex}): ${hoveredSession.minutes}m — ${hoveredSession.topic}`
              : viewMode === 'stacked_trend'
              ? `Daily Goal Line: ${stackedChartGeometry.targetMinutes} mins · Click any day to inspect sessions`
              : `Mean Session Duration: ${sessionGrowthGeometry.meanMinutes} mins across ${allSessions.length} sessions`}
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[560px] sm:min-w-0 block select-none"
            role="img"
            aria-label="D3 7-day study focus minutes and individual session growth chart"
            data-testid="study-d3-svg"
          >
            <defs>
              <linearGradient id="d3StudyTrendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="d3SessionGrowthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {viewMode === 'stacked_trend' ? (
                <>
                  {/* Horizontal Y-Axis Grid Lines & Tick Labels */}
                  {stackedChartGeometry.yTicks.map((tickVal) => {
                    const y = stackedChartGeometry.yScale(tickVal);
                    return (
                      <g key={tickVal} transform={`translate(0, ${y})`}>
                        <line
                          x1={0}
                          x2={innerWidth}
                          stroke="#27272a"
                          strokeDasharray="3 3"
                          strokeOpacity={0.65}
                        />
                        <text
                          x={-10}
                          y={4}
                          textAnchor="end"
                          fill="#a1a1aa"
                          fontSize={11}
                          fontFamily="monospace"
                        >
                          {tickVal}m
                        </text>
                      </g>
                    );
                  })}

                  {/* Daily Target Reference Line */}
                  <g transform={`translate(0, ${stackedChartGeometry.targetY})`}>
                    <line
                      x1={0}
                      x2={innerWidth}
                      stroke="#71717a"
                      strokeWidth={1.2}
                      strokeDasharray="5 4"
                    />
                    <text
                      x={innerWidth - 4}
                      y={-6}
                      textAnchor="end"
                      fill="#a1a1aa"
                      fontSize={10}
                      fontFamily="monospace"
                    >
                      Daily Target ({stackedChartGeometry.targetMinutes}m)
                    </text>
                  </g>

                  {/* D3 Area Under 7-Day Trend Curve */}
                  <path
                    d={stackedChartGeometry.areaPath}
                    fill="url(#d3StudyTrendAreaGrad)"
                    pointerEvents="none"
                  />

                  {/* Stacked Individual Session Bars per Day */}
                  {days.map((day) => {
                    const barX = stackedChartGeometry.xScale(day.dateKey) ?? 0;
                    const barW = stackedChartGeometry.bandwidth;
                    const isSelectedDay = activeDay?.dateKey === day.dateKey;

                    return (
                      <g
                        key={day.dateKey}
                        transform={`translate(${barX}, 0)`}
                        className="cursor-pointer"
                        onClick={() => setSelectedDateKey(day.dateKey)}
                        data-testid={`d3-day-column-${day.dateKey}`}
                      >
                        {/* Subtle selection highlight column */}
                        {isSelectedDay && (
                          <rect
                            x={-6}
                            y={-8}
                            width={barW + 12}
                            height={innerHeight + 14}
                            rx={6}
                            fill="#ffffff"
                            fillOpacity={0.04}
                            stroke="#52525b"
                            strokeOpacity={0.5}
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Individual Session Segments Stacked Vertically */}
                        {day.sessions.map((sess, idx) => {
                          const yTop = stackedChartGeometry.yScale(sess.cumulativeDayMinutes);
                          const yBottom = stackedChartGeometry.yScale(sess.startMinuteOffset);
                          const segHeight = Math.max(3, yBottom - yTop - 1.5);
                          const fill =
                            SESSION_LAYER_COLORS[
                              Math.min(idx, SESSION_LAYER_COLORS.length - 1)
                            ];
                          const isHovered = hoveredSessionId === sess.sessionId;

                          return (
                            <g key={sess.sessionId}>
                              <rect
                                x={0}
                                y={yTop}
                                width={barW}
                                height={segHeight}
                                rx={3}
                                fill={fill}
                                fillOpacity={isHovered ? 1 : 0.9}
                                stroke={isHovered ? '#ffffff' : '#050505'}
                                strokeWidth={isHovered ? 1.5 : 1}
                                data-testid={`d3-session-segment-${day.dateKey}-${sess.sessionIndex}`}
                                onMouseEnter={() => setHoveredSessionId(sess.sessionId)}
                                onMouseLeave={() => setHoveredSessionId(null)}
                              />
                              {segHeight >= 16 && (
                                <text
                                  x={barW / 2}
                                  y={yTop + segHeight / 2 + 3.5}
                                  textAnchor="middle"
                                  fill="#050505"
                                  fontSize={10}
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                  pointerEvents="none"
                                >
                                  {sess.minutes}m
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* Day Total Label Above Bar */}
                        <text
                          x={barW / 2}
                          y={stackedChartGeometry.yScale(day.totalFocusMinutes) - 10}
                          textAnchor="middle"
                          fill={day.isToday ? '#34D399' : '#e4e4e7'}
                          fontSize={11}
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {day.totalFocusMinutes}m
                        </text>

                        {/* X-Axis Day Name & Short Date */}
                        <text
                          x={barW / 2}
                          y={innerHeight + 18}
                          textAnchor="middle"
                          fill={isSelectedDay ? '#ffffff' : '#a1a1aa'}
                          fontSize={11}
                          fontWeight={isSelectedDay || day.isToday ? 'bold' : 'normal'}
                          fontFamily="monospace"
                        >
                          {day.dayLabel}
                        </text>
                        <text
                          x={barW / 2}
                          y={innerHeight + 33}
                          textAnchor="middle"
                          fill="#71717a"
                          fontSize={10}
                          fontFamily="monospace"
                        >
                          {day.shortDate} · {day.sessions.length}s
                        </text>
                      </g>
                    );
                  })}

                  {/* D3 Smooth Monotone Cubic Spline Connecting 7-Day Focus Totals */}
                  <path
                    d={stackedChartGeometry.trendPath}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    data-testid="d3-daily-trend-path"
                    pointerEvents="none"
                  />

                  {/* D3 Trend Nodes */}
                  {days.map((day) => {
                    const cx =
                      (stackedChartGeometry.xScale(day.dateKey) ?? 0) +
                      stackedChartGeometry.bandwidth / 2;
                    const cy = stackedChartGeometry.yScale(day.totalFocusMinutes);
                    return (
                      <circle
                        key={`node_${day.dateKey}`}
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill="#F59E0B"
                        stroke="#050505"
                        strokeWidth={2}
                        className="cursor-pointer"
                        onClick={() => setSelectedDateKey(day.dateKey)}
                      />
                    );
                  })}
                </>
              ) : (
                <>
                  {/* Mode 2: Individual Session Growth Curve Across All Sessions */}
                  {sessionGrowthGeometry.yTicks.map((tickVal) => {
                    const y = sessionGrowthGeometry.yScale(tickVal);
                    return (
                      <g key={tickVal} transform={`translate(0, ${y})`}>
                        <line
                          x1={0}
                          x2={innerWidth}
                          stroke="#27272a"
                          strokeDasharray="3 3"
                          strokeOpacity={0.65}
                        />
                        <text
                          x={-10}
                          y={4}
                          textAnchor="end"
                          fill="#a1a1aa"
                          fontSize={11}
                          fontFamily="monospace"
                        >
                          {tickVal}m
                        </text>
                      </g>
                    );
                  })}

                  {/* Mean Session Reference Line */}
                  <g transform={`translate(0, ${sessionGrowthGeometry.meanY})`}>
                    <line
                      x1={0}
                      x2={innerWidth}
                      stroke="#71717a"
                      strokeWidth={1.2}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={innerWidth - 4}
                      y={-6}
                      textAnchor="end"
                      fill="#a1a1aa"
                      fontSize={10}
                      fontFamily="monospace"
                    >
                      Avg Session ({sessionGrowthGeometry.meanMinutes}m)
                    </text>
                  </g>

                  <path
                    d={sessionGrowthGeometry.growthArea}
                    fill="url(#d3SessionGrowthAreaGrad)"
                    pointerEvents="none"
                  />

                  {allSessions.map((sess) => {
                    const x =
                      sessionGrowthGeometry.xScale(String(sess.globalSessionNumber)) ?? 0;
                    const w = sessionGrowthGeometry.bandwidth;
                    const y = sessionGrowthGeometry.yScale(sess.minutes);
                    const h = Math.max(4, innerHeight - y);
                    const isHovered = hoveredSessionId === sess.sessionId;

                    return (
                      <g
                        key={sess.sessionId}
                        transform={`translate(${x}, 0)`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredSessionId(sess.sessionId)}
                        onMouseLeave={() => setHoveredSessionId(null)}
                        onClick={() => setSelectedDateKey(sess.dateKey)}
                        data-testid={`d3-growth-session-bar-${sess.globalSessionNumber}`}
                      >
                        <rect
                          x={0}
                          y={y}
                          width={w}
                          height={h}
                          rx={3}
                          fill={
                            sess.sessionGrowthDeltaMinutes >= 0 ? '#10B981' : '#059669'
                          }
                          fillOpacity={isHovered ? 1 : 0.78}
                          stroke={isHovered ? '#ffffff' : 'none'}
                          strokeWidth={1.5}
                        />
                        <text
                          x={w / 2}
                          y={y - 7}
                          textAnchor="middle"
                          fill="#e4e4e7"
                          fontSize={10}
                          fontFamily="monospace"
                        >
                          {sess.minutes}m
                        </text>
                        <text
                          x={w / 2}
                          y={innerHeight + 17}
                          textAnchor="middle"
                          fill="#a1a1aa"
                          fontSize={10}
                          fontFamily="monospace"
                        >
                          #{sess.globalSessionNumber}
                        </text>
                        <text
                          x={w / 2}
                          y={innerHeight + 31}
                          textAnchor="middle"
                          fill="#71717a"
                          fontSize={9}
                          fontFamily="monospace"
                        >
                          {sess.dayName}
                        </text>
                      </g>
                    );
                  })}

                  <path
                    d={sessionGrowthGeometry.growthPath}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    data-testid="d3-session-growth-path"
                    pointerEvents="none"
                  />

                  {allSessions.map((sess) => {
                    const cx =
                      (sessionGrowthGeometry.xScale(String(sess.globalSessionNumber)) ??
                        0) +
                      sessionGrowthGeometry.bandwidth / 2;
                    const cy = sessionGrowthGeometry.yScale(sess.minutes);
                    return (
                      <circle
                        key={`gnode_${sess.sessionId}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#38BDF8"
                        stroke="#050505"
                        strokeWidth={1.8}
                        pointerEvents="none"
                      />
                    );
                  })}
                </>
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* Interactive Day & Individual Session Breakdown Inspector */}
      {activeDay && (
        <div
          className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 space-y-3"
          data-testid="study-d3-active-inspector"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-white">
                {activeDay.dayLabel} · {activeDay.shortDate} Session Breakdown
              </span>
              <span aria-hidden="true" className="text-zinc-600">
                ·
              </span>
              <span className="font-mono tabular-nums text-emerald-400">
                {activeDay.totalFocusMinutes} mins total ({activeDay.sessions.length}{' '}
                {activeDay.sessions.length === 1 ? 'session' : 'sessions'})
              </span>
              <span aria-hidden="true" className="text-zinc-600">
                ·
              </span>
              <span className="font-mono tabular-nums text-zinc-400">
                {activeDay.dayOverDayDeltaMinutes >= 0
                  ? `+${activeDay.dayOverDayDeltaMinutes}m vs prior day`
                  : `${activeDay.dayOverDayDeltaMinutes}m vs prior day`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {days.map((d) => (
                <button
                  key={d.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(d.dateKey)}
                  data-testid={`study-d3-select-day-${d.dateKey}`}
                  className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                    activeDay.dateKey === d.dateKey
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-[#0A0A0C] text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {d.dayName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {activeDay.sessions.map((sess, idx) => {
              const prevInDay = idx > 0 ? activeDay.sessions[idx - 1].minutes : null;
              const intraDayDelta = prevInDay !== null ? sess.minutes - prevInDay : null;
              return (
                <div
                  key={sess.sessionId}
                  data-testid={`study-d3-inspector-session-${sess.sessionIndex}`}
                  className="p-3 rounded bg-[#0A0A0C] border border-zinc-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="font-bold text-white">
                      Session #{sess.sessionIndex} ({sess.minutes} mins)
                    </span>
                    <span
                      className={
                        intraDayDelta !== null && intraDayDelta > 0
                          ? 'text-emerald-400'
                          : 'text-zinc-400'
                      }
                    >
                      {intraDayDelta === null
                        ? 'Warmup Block'
                        : intraDayDelta >= 0
                        ? `+${intraDayDelta}m growth`
                        : `${intraDayDelta}m`}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 truncate">{sess.topic}</div>
                  <div className="text-[11px] font-mono text-zinc-500 tabular-nums">
                    Cumulative day focus: {sess.cumulativeDayMinutes}m · {sess.roomCode}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
