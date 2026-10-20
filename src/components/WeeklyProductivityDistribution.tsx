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
  PieChart,
  Pie,
} from 'recharts';
import { BookOpen, Clock, Layers, Award, PlusCircle, ArrowUpRight } from 'lucide-react';
import {
  WeeklyTopicDistributionSummary,
  WeeklyTopicDistributionEntry,
  DEFAULT_STUDY_ROOM_TOPICS,
} from '../utils/rules';

export type DistributionChartType = 'bar' | 'donut';

interface WeeklyProductivityDistributionProps {
  distribution: WeeklyTopicDistributionSummary;
  onLogTopicFocusSession: (topic: string, roomCode: string, minutes: number) => void;
  onOpenStudyRoomWithTopic?: (roomCode: string, topic: string) => void;
}

interface TopicTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: WeeklyTopicDistributionEntry;
  }>;
}

function TopicDistributionTooltip({ active, payload }: TopicTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="p-3 rounded-md bg-[#050505] border border-zinc-700 shadow-xl text-xs space-y-1.5 font-mono tabular-nums">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-1">
        <span className="font-sans font-bold text-white flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-xs inline-block shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.topic}</span>
        </span>
        <span className="text-zinc-400">{item.roomCode}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-zinc-300">
        <span>Focus Duration:</span>
        <strong className="text-emerald-400">{item.focusMinutes} mins</strong>
      </div>
      <div className="flex items-center justify-between gap-4 text-zinc-300">
        <span>Focus Sessions:</span>
        <strong className="text-white">
          {item.sessionsCount} {item.sessionsCount === 1 ? 'session' : 'sessions'}
        </strong>
      </div>
      <div className="flex items-center justify-between gap-4 text-zinc-300">
        <span>Weekly Share:</span>
        <strong className="text-amber-400">{item.sharePercent}% of week</strong>
      </div>
    </div>
  );
}

export function WeeklyProductivityDistribution({
  distribution,
  onLogTopicFocusSession,
  onOpenStudyRoomWithTopic,
}: WeeklyProductivityDistributionProps) {
  const [chartType, setChartType] = useState<DistributionChartType>('bar');
  const [selectedTopic, setSelectedTopic] = useState<string>(
    DEFAULT_STUDY_ROOM_TOPICS[0].topic
  );
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedPreset = DEFAULT_STUDY_ROOM_TOPICS.find(
      (p) => p.topic.toLowerCase() === selectedTopic.toLowerCase()
    );
    const roomCode = matchedPreset ? matchedPreset.roomCode : 'STUDY-GLOBAL';
    onLogTopicFocusSession(selectedTopic, roomCode, selectedMinutes);
  };

  return (
    <section
      className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-5"
      aria-label="Weekly Productivity Distribution"
      data-testid="weekly-productivity-distribution"
    >
      {/* Section Header & Chart Type Switcher */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <h2 className="text-lg font-bold text-white">
                Weekly Productivity Distribution
              </h2>
            </span>
            <span aria-hidden="true" className="text-xs text-zinc-600">
              ·
            </span>
            <span className="text-xs font-mono text-zinc-400 tabular-nums whitespace-nowrap">
              By Study Room Topic (7d)
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Breakdown of your focus sessions and study duration across Study Room topics over the last 7 days.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-1 p-1 bg-[#050505] border border-zinc-800 rounded-md"
          role="group"
          aria-label="Weekly Productivity Distribution Chart View"
        >
          <button
            type="button"
            onClick={() => setChartType('bar')}
            data-testid="distribution-chart-mode-bar"
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              chartType === 'bar'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Bar Breakdown
          </button>
          <button
            type="button"
            onClick={() => setChartType('donut')}
            data-testid="distribution-chart-mode-donut"
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              chartType === 'donut'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Donut Share
          </button>
        </div>
      </div>

      {/* 3-Card Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Primary Study Topic</span>
            </div>
            <div
              className="text-sm font-bold text-white truncate"
              data-testid="distribution-top-topic"
              title={distribution.topTopic}
            >
              {distribution.topTopic}
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs shrink-0 whitespace-nowrap">
            <div
              className="text-emerald-400 font-semibold"
              data-testid="distribution-top-topic-minutes"
            >
              {distribution.topTopicMinutes} mins
            </div>
            <div className="text-zinc-500">{distribution.topTopicSharePercent}% share</div>
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">7-Day Topic Sessions</span>
            </div>
            <div
              className="text-base font-bold font-mono tabular-nums text-white"
              data-testid="distribution-total-sessions"
            >
              {distribution.totalSessionsCount} Sessions
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs shrink-0 whitespace-nowrap">
            <div
              className="text-amber-400 font-semibold"
              data-testid="distribution-total-minutes"
            >
              {distribution.totalFocusMinutes} mins
            </div>
            <div className="text-zinc-500">Total Focus</div>
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="whitespace-nowrap">Active Study Topics</span>
            </div>
            <div
              className="text-base font-bold font-mono tabular-nums text-white"
              data-testid="distribution-active-topics"
            >
              {distribution.activeTopicsCount} Topics
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs text-zinc-400 shrink-0 whitespace-nowrap">
            <div className="text-sky-400">Study Rooms</div>
            <div className="text-zinc-500">Synced Live</div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Recharts Chart (7 cols) + Ranked Topic Breakdown (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Recharts Topic Visualization */}
        <div
          className="lg:col-span-7 p-4 rounded-md border border-zinc-800/80 bg-[#050505] flex flex-col justify-between space-y-3"
          data-testid="weekly-productivity-distribution-recharts"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-200">
              {chartType === 'bar'
                ? 'Focus Minutes by Study Room Topic'
                : 'Proportional Focus Share by Topic (%)'}
            </span>
            <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
              {distribution.totalFocusMinutes} mins across {distribution.activeTopicsCount} topics
            </span>
          </div>

          <div className="w-full h-[260px] min-w-0">
            <ResponsiveContainer width="100%" height={260} minWidth={250}>
              {chartType === 'bar' ? (
                <BarChart
                  data={distribution.topics}
                  layout="vertical"
                  margin={{ top: 6, right: 18, left: 4, bottom: 6 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1F1F23"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#27272A' }}
                    tickLine={false}
                    unit="m"
                  />
                  <YAxis
                    type="category"
                    dataKey="shortTopic"
                    width={82}
                    tick={{ fill: '#E4E4E7', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<TopicDistributionTooltip />}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar
                    dataKey="focusMinutes"
                    name="Focus Minutes"
                    radius={[0, 4, 4, 0]}
                    barSize={22}
                  >
                    {distribution.topics.map((entry) => (
                      <Cell key={entry.topic} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={distribution.topics}
                    dataKey="focusMinutes"
                    nameKey="topic"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={94}
                    paddingAngle={3}
                    stroke="#050505"
                    strokeWidth={2}
                  >
                    {distribution.topics.map((entry) => (
                      <Cell key={entry.topic} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<TopicDistributionTooltip />} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Color Legend Strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-zinc-900 text-[11px]">
            {distribution.topics.map((item) => (
              <span
                key={item.topic}
                className="inline-flex items-center gap-1.5 text-zinc-300 font-mono tabular-nums whitespace-nowrap"
              >
                <span
                  className="w-2.5 h-2.5 rounded-xs inline-block shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-sans text-zinc-300">{item.shortTopic}</span>
                <span className="text-zinc-500">({item.sharePercent}%)</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right: Ranked Study Room Topic Breakdown List */}
        <div
          className="lg:col-span-5 p-4 rounded-md border border-zinc-800/80 bg-[#050505] flex flex-col justify-between space-y-4"
          data-testid="weekly-topic-breakdown-list"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-2 text-xs">
              <span className="font-bold text-white whitespace-nowrap">
                Topic Session Breakdown
              </span>
              <span className="font-mono text-zinc-500 whitespace-nowrap shrink-0">
                Duration · Share
              </span>
            </div>

            <div className="space-y-2.5">
              {distribution.topics.map((item) => (
                <div
                  key={item.topic}
                  data-testid="topic-distribution-row"
                  data-topic={item.topic}
                  className="p-2.5 rounded bg-[#0A0A0C] border border-zinc-800/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-white truncate" title={item.topic}>
                        {item.topic}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono tabular-nums shrink-0 whitespace-nowrap">
                      <span className="text-emerald-400 font-semibold">
                        {item.focusMinutes}m
                      </span>
                      <span aria-hidden="true" className="text-zinc-600">
                        ·
                      </span>
                      <span className="text-zinc-400">{item.sharePercent}%</span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-zinc-900 rounded-xs overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(4, item.sharePercent))}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 tabular-nums">
                    <span className="truncate">
                      {item.roomCode} · {item.sessionsCount}{' '}
                      {item.sessionsCount === 1 ? 'session' : 'sessions'}
                    </span>
                    {onOpenStudyRoomWithTopic && (
                      <button
                        type="button"
                        onClick={() => onOpenStudyRoomWithTopic(item.roomCode, item.topic)}
                        className="inline-flex items-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Enter Room</span>
                        <ArrowUpRight className="w-3 h-3 shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Log Topic Focus Session Form */}
          <form
            onSubmit={handleQuickLogSubmit}
            className="pt-3 border-t border-zinc-900 space-y-2"
            data-testid="log-topic-focus-form"
          >
            <label
              htmlFor="quick-topic-select"
              className="block text-[11px] font-mono text-zinc-400"
            >
              Log Focus Session by Study Room Topic
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                id="quick-topic-select"
                aria-label="Select Study Room topic"
                data-testid="quick-topic-select"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-zinc-500"
              >
                {DEFAULT_STUDY_ROOM_TOPICS.map((preset) => (
                  <option key={preset.topic} value={preset.topic}>
                    {preset.topic} ({preset.roomCode})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  aria-label="Focus session duration in minutes"
                  data-testid="quick-topic-minutes-select"
                  value={selectedMinutes}
                  onChange={(e) => setSelectedMinutes(Number(e.target.value) || 25)}
                  className="px-2 py-1.5 text-xs font-mono bg-[#0A0A0C] border border-zinc-800 rounded text-white focus:outline-none focus:border-zinc-500"
                >
                  <option value={25}>+25m</option>
                  <option value={45}>+45m</option>
                  <option value={60}>+60m</option>
                </select>

                <button
                  type="submit"
                  data-testid="log-topic-session-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Log Topic</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
