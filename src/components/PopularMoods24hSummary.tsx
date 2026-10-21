import React, { useState } from 'react';
import {
  MoodPopularity24hSummary,
  MoodTrendRangeHours,
  MOOD_TREND_RANGE_OPTIONS,
  OnlineMoodTone,
  PeerMoodHistoryEvent,
  isMoodTrendLineVisible,
  toggleMoodTrendLineVisibility,
  getVisibleTop3Moods,
  formatMoodTrendPointTooltip,
  filterMoodTrendByRangeHours,
  buildPersonalMoodHistoryCsv,
  buildMoodHistory24hCsv,
} from '../utils/rules';

interface PopularMoods24hSummaryProps {
  summary: MoodPopularity24hSummary;
  activeMoodFilter: string;
  onSelectMoodFilter: (mood: string) => void;
  currentUid?: string;
  currentDisplayName?: string;
  currentMood?: string | null;
  moodEvents?: PeerMoodHistoryEvent[];
}

function getToneClasses(tone: OnlineMoodTone): {
  dot: string;
  fill: string;
  text: string;
  strokeHex: string;
} {
  switch (tone) {
    case 'emerald':
      return {
        dot: 'bg-emerald-400',
        fill: 'fill-emerald-400',
        text: 'text-emerald-400',
        strokeHex: '#34d399',
      };
    case 'amber':
      return {
        dot: 'bg-amber-400',
        fill: 'fill-amber-400',
        text: 'text-amber-400',
        strokeHex: '#fbbf24',
      };
    case 'violet':
      return {
        dot: 'bg-violet-400',
        fill: 'fill-violet-400',
        text: 'text-violet-400',
        strokeHex: '#a78bfa',
      };
    case 'sky':
      return {
        dot: 'bg-sky-400',
        fill: 'fill-sky-400',
        text: 'text-sky-400',
        strokeHex: '#38bdf8',
      };
    default:
      return {
        dot: 'bg-zinc-400',
        fill: 'fill-zinc-400',
        text: 'text-zinc-300',
        strokeHex: '#a1a1aa',
      };
  }
}

const FALLBACK_LINE_HEX = ['#fbbf24', '#34d399', '#38bdf8'];

export const PopularMoods24hSummary: React.FC<PopularMoods24hSummaryProps> = ({
  summary,
  activeMoodFilter,
  onSelectMoodFilter,
  currentUid = '',
  currentDisplayName = 'Member',
  currentMood = null,
  moodEvents = [],
}) => {
  const displayedItems = summary.items.slice(0, 6);
  const top3Moods = summary.top3Moods.slice(0, 3);
  const topToneClasses = getToneClasses(summary.topMoodTone);

  const [trendRangeHours, setTrendRangeHours] =
    useState<MoodTrendRangeHours>(24);
  const filteredTrend = filterMoodTrendByRangeHours({
    trendBuckets: summary.trendBuckets,
    rangeHours: trendRangeHours,
  });
  const trendBuckets = filteredTrend.buckets;

  const [selectedBucketIdx, setSelectedBucketIdx] = useState<number>(
    Math.max(0, summary.trendBuckets.length - 1)
  );
  const [hiddenTrendMoods, setHiddenTrendMoods] = useState<string[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{
    rankIdx: number;
    bucketIdx: number;
  } | null>(null);
  const [lastExportNotice, setLastExportNotice] = useState<string>('');

  const handleSelectTrendRange = (nextRange: MoodTrendRangeHours) => {
    const nextFiltered = filterMoodTrendByRangeHours({
      trendBuckets: summary.trendBuckets,
      rangeHours: nextRange,
    });
    setTrendRangeHours(nextRange);
    setSelectedBucketIdx(Math.max(0, nextFiltered.buckets.length - 1));
    setHoveredPoint(null);
  };

  const personalCsvPreview = buildPersonalMoodHistoryCsv({
    currentUid,
    currentDisplayName,
    currentMood,
    moodEvents,
  });

  const triggerCsvFileDownload = (csvContent: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownload24hMoodCsv = () => {
    const exportPayload = buildMoodHistory24hCsv({
      summary,
      nowMs: Date.now(),
    });
    triggerCsvFileDownload(exportPayload.csvContent, exportPayload.filename);
    setLastExportNotice(
      `Downloaded ${exportPayload.filename} (${exportPayload.rowCount} ${
        exportPayload.rowCount === 1 ? 'mood' : 'moods'
      })`
    );
  };

  const handleExportPersonalMoodCsv = () => {
    const exportPayload = buildPersonalMoodHistoryCsv({
      currentUid,
      currentDisplayName,
      currentMood,
      moodEvents,
      nowMs: Date.now(),
    });
    triggerCsvFileDownload(exportPayload.csvContent, exportPayload.filename);
    setLastExportNotice(
      `Exported ${exportPayload.filename} (${exportPayload.rowCount} ${
        exportPayload.rowCount === 1 ? 'entry' : 'entries'
      })`
    );
  };

  const safeSelectedBucketIdx =
    selectedBucketIdx >= 0 && selectedBucketIdx < trendBuckets.length
      ? selectedBucketIdx
      : Math.max(0, trendBuckets.length - 1);
  const activeBucket =
    trendBuckets[safeSelectedBucketIdx] ||
    trendBuckets[trendBuckets.length - 1];
  const visibleTop3Moods = getVisibleTop3Moods(top3Moods, hiddenTrendMoods);

  // SVG Line Chart geometry
  const svgW = 520;
  const svgH = 184;
  const padLeft = 58;
  const padRight = 20;
  const padTop = 18;
  const padBottom = 46;
  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;
  const maxVal = Math.max(4, filteredTrend.trendMaxValue);
  const midVal = Math.round(maxVal / 2);

  const getBucketX = (idx: number) => {
    if (trendBuckets.length <= 1) return padLeft + plotW / 2;
    return Number(
      (padLeft + (idx / (trendBuckets.length - 1)) * plotW).toFixed(1)
    );
  };

  const getValueY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxVal, val));
    return Number((padTop + plotH - (clamped / maxVal) * plotH).toFixed(1));
  };

  // Ensure the 3 lines always have distinct stroke colors even if two moods share a tone
  const usedStrokes = new Set<string>();
  const lineColors = top3Moods.map((m, idx) => {
    const preferred = getToneClasses(m.tone).strokeHex;
    if (!usedStrokes.has(preferred)) {
      usedStrokes.add(preferred);
      return preferred;
    }
    const fallback = FALLBACK_LINE_HEX[idx] || '#a78bfa';
    usedStrokes.add(fallback);
    return fallback;
  });

  // Render order: Rank #3 -> Rank #2 -> Rank #1 so #1 is always in the foreground
  const renderOrderIndices = top3Moods
    .map((_, idx) => idx)
    .reverse();
  const visibleRenderIndices = renderOrderIndices.filter((rankIdx) => {
    const m = top3Moods[rankIdx];
    return m ? isMoodTrendLineVisible(hiddenTrendMoods, m.mood) : false;
  });

  const hoveredMoodStat =
    hoveredPoint && top3Moods[hoveredPoint.rankIdx]
      ? top3Moods[hoveredPoint.rankIdx]
      : null;
  const hoveredBucket =
    hoveredPoint && trendBuckets[hoveredPoint.bucketIdx]
      ? trendBuckets[hoveredPoint.bucketIdx]
      : null;
  const activeTooltipData =
    hoveredPoint &&
    hoveredMoodStat &&
    hoveredBucket &&
    isMoodTrendLineVisible(hiddenTrendMoods, hoveredMoodStat.mood)
      ? formatMoodTrendPointTooltip({
          moodStat: hoveredMoodStat,
          bucket: hoveredBucket,
        })
      : null;

  return (
    <div
      className="p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 space-y-3.5"
      data-testid="online-directory-popular-moods-24h"
    >
      <div className="border-b border-zinc-800/70 pb-2.5 space-y-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Popular Peer Moods (Last 24h)
              </h2>
              {summary.topMood && (
                <span
                  data-testid="popular-moods-24h-top"
                  className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold ${topToneClasses.text}`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-1.5 h-1.5 rounded-full ${topToneClasses.dot}`}
                  />
                  <span>
                    #1 {summary.topMood} ({summary.topMoodSharePercent}%)
                  </span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400 tabular-nums shrink-0">
              <span data-testid="popular-moods-24h-total">
                {summary.totalEvents24h}{' '}
                {summary.totalEvents24h === 1 ? 'check-in' : 'check-ins'}
              </span>
              <span aria-hidden="true" className="text-zinc-700">
                ·
              </span>
              <span data-testid="popular-moods-24h-peers">
                {summary.uniqueActivePeers24h}{' '}
                {summary.uniqueActivePeers24h === 1
                  ? 'active peer'
                  : 'active peers'}
              </span>
              {activeMoodFilter !== 'all' && (
                <>
                  <span aria-hidden="true" className="text-zinc-700">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectMoodFilter('all')}
                    data-testid="popular-moods-24h-reset-filter"
                    className="text-sky-400 hover:text-white underline underline-offset-2"
                  >
                    Show All
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-[11px] text-zinc-400">
            Most popular moods used by active peers over the last 24 hours. Click a mood bar to filter peers, or click legend items below to toggle trend lines.
          </p>
        </div>

        {/* 24-Hour Mood History & Personal Log CSV Export Row */}
        <div
          className="pt-2 border-t border-zinc-800/60 space-y-1.5"
          data-testid="personal-mood-csv-export-bar"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-zinc-400 tabular-nums">
              <span>
                My 24h Log:{' '}
                <strong
                  className="text-zinc-200 font-semibold"
                  data-testid="personal-mood-24h-count"
                >
                  {personalCsvPreview.rowCount}{' '}
                  {personalCsvPreview.rowCount === 1 ? 'entry' : 'entries'}
                </strong>
              </span>
              {personalCsvPreview.entries[0] && (
                <span className="text-zinc-400">
                  ({personalCsvPreview.entries[0].mood})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownload24hMoodCsv}
                data-testid="download-24h-mood-history-csv-btn"
                aria-label="Download 24-hour mood history data as a CSV file"
                className="px-2 py-0.5 rounded bg-white hover:bg-zinc-200 text-black text-[11px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Download 24h CSV
              </button>
              <button
                type="button"
                onClick={handleExportPersonalMoodCsv}
                data-testid="export-personal-mood-csv-btn"
                aria-label="Export my personal mood history from the last 24 hours as a CSV file"
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 hover:border-zinc-500 text-[11px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Export My 24h CSV
              </button>
            </div>
          </div>

          {lastExportNotice && (
            <div
              className="text-[11px] font-mono text-emerald-400 font-semibold"
              data-testid="export-personal-mood-csv-status"
            >
              {lastExportNotice}
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Moods Fluctuation Line Chart with 6h / 12h / 24h Date-Range Filter */}
      <div
        className="p-3 rounded bg-[#0A0A0C] border border-zinc-800/80 space-y-2.5"
        data-testid="popular-moods-24h-line-chart"
      >
        <div className="space-y-2">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                className="text-[11px] font-bold uppercase tracking-wider text-zinc-300"
                data-testid="popular-mood-trend-chart-title"
              >
                Top 3 Moods · {trendRangeHours}h Fluctuation Trend
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400 tabular-nums">
                {/* Date-Range Filter: 6h / 12h / 24h */}
                <div
                  className="inline-flex items-center gap-1 p-0.5 rounded bg-[#050505] border border-zinc-800"
                  role="group"
                  aria-label="Filter mood trend chart date range"
                  data-testid="popular-mood-trend-range-filter"
                >
                  <span className="px-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Range
                  </span>
                  {MOOD_TREND_RANGE_OPTIONS.map((rangeOpt) => {
                    const isActive = trendRangeHours === rangeOpt;
                    return (
                      <button
                        key={rangeOpt}
                        type="button"
                        onClick={() => handleSelectTrendRange(rangeOpt)}
                        aria-pressed={isActive}
                        aria-label={`View mood trends over the last ${rangeOpt} hours`}
                        data-testid={`popular-mood-trend-range-${rangeOpt}h`}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono tabular-nums whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-white text-black font-bold'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                        }`}
                      >
                        {rangeOpt}h
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 tabular-nums">
                  <span data-testid="popular-mood-trend-visible-count">
                    {visibleTop3Moods.length}/{top3Moods.length} lines visible
                  </span>
                  {hiddenTrendMoods.length > 0 && (
                    <>
                      <span aria-hidden="true" className="text-zinc-700">
                        ·
                      </span>
                      <button
                        type="button"
                        onClick={() => setHiddenTrendMoods([])}
                        data-testid="popular-mood-trend-show-all"
                        className="text-sky-400 hover:text-white underline underline-offset-2 whitespace-nowrap shrink-0"
                      >
                        Show All Lines
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-zinc-500">
              Switch between 6h, 12h, or 24h windows or click any legend item to toggle its trend line
            </div>
          </div>

          {/* Clickable Legend to Toggle Visibility of Individual Mood Trend Lines */}
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Toggle visibility of top 3 mood trend lines"
          >
            {top3Moods.map((m, idx) => {
              const toneCls = getToneClasses(m.tone);
              const isVisible = isMoodTrendLineVisible(
                hiddenTrendMoods,
                m.mood
              );
              return (
                <button
                  key={m.mood}
                  type="button"
                  onClick={() =>
                    setHiddenTrendMoods((prev) =>
                      toggleMoodTrendLineVisibility(prev, m.mood)
                    )
                  }
                  aria-pressed={isVisible}
                  data-testid={`popular-mood-trend-legend-${idx + 1}`}
                  title={
                    isVisible
                      ? `Hide ${m.mood} trend line`
                      : `Show ${m.mood} trend line`
                  }
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 ${
                    isVisible
                      ? 'bg-[#050505] text-zinc-200 border-zinc-700 hover:border-zinc-500'
                      : 'bg-[#050505]/60 text-zinc-500 border-zinc-800/70 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full transition-opacity ${
                      isVisible ? toneCls.dot : 'bg-zinc-700 opacity-50'
                    }`}
                  />
                  <span className={isVisible ? 'font-semibold' : 'line-through'}>
                    #{idx + 1} {m.mood}
                  </span>
                  <span
                    className={`text-[10px] ${
                      isVisible ? 'text-emerald-400' : 'text-zinc-600'
                    }`}
                  >
                    {isVisible ? 'On' : 'Off'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG Line Chart with Clear Axis Labels & Data Point Markers */}
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            role="img"
            aria-label={`Line chart showing ${trendRangeHours}-hour fluctuation of the top 3 most popular moods with labeled axes and data point markers`}
            className="w-full h-auto block select-none"
          >
            {/* Y-Axis Title Label */}
            <text
              x={15}
              y={padTop + plotH / 2}
              transform={`rotate(-90 15 ${padTop + plotH / 2})`}
              textAnchor="middle"
              data-testid="popular-moods-24h-yaxis-label"
              className="fill-zinc-300 font-mono text-[11px] font-semibold"
            >
              {summary.yAxisLabel}
            </text>

            {/* Horizontal Y-Axis Gridlines & Numeric Tick Labels */}
            {[
              { label: String(maxVal), val: maxVal, id: 'max' },
              { label: String(midVal), val: midVal, id: 'mid' },
              { label: '0', val: 0, id: '0' },
            ].map((tick) => {
              const y = getValueY(tick.val);
              return (
                <g key={tick.id}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgW - padRight}
                    y2={y}
                    stroke="#27272a"
                    strokeDasharray={tick.val === 0 ? undefined : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    data-testid={`popular-moods-24h-ytick-${tick.id}`}
                    className="fill-zinc-400 font-mono text-[11px] tabular-nums"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}

            {/* Vertical Time Bucket Guides & X-Axis Labels */}
            {trendBuckets.map((bucket, bIdx) => {
              const x = getBucketX(bIdx);
              const isSelected = bIdx === safeSelectedBucketIdx;
              return (
                <g key={bucket.label}>
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={padTop + plotH}
                    stroke={isSelected ? '#52525b' : '#18181b'}
                    strokeWidth={isSelected ? '1.5' : '1'}
                  />
                  <text
                    x={x}
                    y={padTop + plotH + 16}
                    textAnchor="middle"
                    data-testid={`popular-moods-24h-xtick-${bucket.label}`}
                    className={`font-mono text-[11px] tabular-nums ${
                      isSelected ? 'fill-white font-bold' : 'fill-zinc-400'
                    }`}
                  >
                    {bucket.label}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Title Label */}
            <text
              x={padLeft + plotW / 2}
              y={svgH - 6}
              textAnchor="middle"
              data-testid="popular-moods-24h-xaxis-label"
              className="fill-zinc-300 font-mono text-[11px] font-semibold"
            >
              {filteredTrend.xAxisLabel}
            </text>

            {/* Empty Prompt if All 3 Trend Lines Are Toggled Off */}
            {visibleRenderIndices.length === 0 && (
              <text
                x={padLeft + plotW / 2}
                y={padTop + plotH / 2}
                textAnchor="middle"
                data-testid="popular-mood-trend-all-hidden-msg"
                className="fill-zinc-400 font-mono text-[11px]"
              >
                All trend lines hidden — click a legend item or Show All Lines
              </text>
            )}

            {/* Visible Top 3 Moods Polylines (drawn #3 -> #2 -> #1 so #1 is in foreground) */}
            {visibleRenderIndices.map((rankIdx) => {
              const moodStat = top3Moods[rankIdx];
              if (!moodStat) return null;
              const strokeColor = lineColors[rankIdx];
              const pointsStr = trendBuckets
                .map((b, bIdx) => {
                  const val = b.valuesByMood[moodStat.mood] ?? 0;
                  return `${getBucketX(bIdx)},${getValueY(val)}`;
                })
                .join(' ');

              return (
                <polyline
                  key={`line-${moodStat.mood}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={rankIdx === 0 ? '2.5' : '1.85'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsStr}
                  data-testid={`popular-mood-trend-line-${rankIdx + 1}`}
                />
              );
            })}

            {/* Small Data Point Markers for Each Visible Mood Across All Selected Time Buckets */}
            {visibleRenderIndices.map((rankIdx) => {
              const moodStat = top3Moods[rankIdx];
              if (!moodStat) return null;
              const strokeColor = lineColors[rankIdx];
              return trendBuckets.map((b, bIdx) => {
                const val = b.valuesByMood[moodStat.mood] ?? 0;
                const cx = getBucketX(bIdx);
                const cy = getValueY(val);
                const isSelected = bIdx === safeSelectedBucketIdx;
                const isHovered =
                  hoveredPoint?.rankIdx === rankIdx &&
                  hoveredPoint?.bucketIdx === bIdx;
                const ptTooltip = formatMoodTrendPointTooltip({
                  moodStat,
                  bucket: b,
                });
                const handleActivatePoint = () =>
                  setHoveredPoint({ rankIdx, bucketIdx: bIdx });
                const handleDeactivatePoint = () =>
                  setHoveredPoint((prev) =>
                    prev &&
                    prev.rankIdx === rankIdx &&
                    prev.bucketIdx === bIdx
                      ? null
                      : prev
                  );
                return (
                  <g
                    key={`marker-${moodStat.mood}-${b.label}`}
                    onClick={() => {
                      setSelectedBucketIdx(bIdx);
                      setHoveredPoint({ rankIdx, bucketIdx: bIdx });
                    }}
                    onMouseEnter={handleActivatePoint}
                    onMouseLeave={handleDeactivatePoint}
                    onFocus={handleActivatePoint}
                    onBlur={handleDeactivatePoint}
                    className="cursor-pointer"
                  >
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={7.5}
                        fill="none"
                        stroke={strokeColor}
                        strokeOpacity="0.45"
                        strokeWidth="2"
                        pointerEvents="none"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5.2 : isSelected ? 4.8 : 3.6}
                      fill="#050505"
                      stroke={strokeColor}
                      strokeWidth={isHovered ? '2.6' : isSelected ? '2.4' : '1.9'}
                      onMouseEnter={handleActivatePoint}
                      onMouseLeave={handleDeactivatePoint}
                      data-testid={`popular-mood-trend-marker-${rankIdx + 1}-${bIdx}`}
                    >
                      <title>{`#${ptTooltip.rank} ${ptTooltip.mood} · ${ptTooltip.countLabel} · ${ptTooltip.timestampLabel}`}</title>
                    </circle>
                  </g>
                );
              });
            })}

            {/* Floating Hover Tooltip Showing Exact Mood Count & Timestamp */}
            {activeTooltipData && hoveredPoint && (() => {
              const hoveredStroke =
                lineColors[hoveredPoint.rankIdx] || '#34d399';
              const hoveredCx = getBucketX(hoveredPoint.bucketIdx);
              const hoveredCy = getValueY(activeTooltipData.exactCount);
              const tooltipW = 264;
              const tooltipH = 44;
              const tooltipX = Math.max(
                padLeft + 2,
                Math.min(
                  svgW - padRight - tooltipW - 2,
                  Number((hoveredCx - tooltipW / 2).toFixed(1))
                )
              );
              const placeAbove = hoveredCy >= padTop + tooltipH + 10;
              const tooltipY = placeAbove
                ? Number((hoveredCy - tooltipH - 8).toFixed(1))
                : Number((hoveredCy + 10).toFixed(1));

              return (
                <g
                  data-testid="popular-mood-trend-tooltip"
                  pointerEvents="none"
                >
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipW}
                    height={tooltipH}
                    rx="5"
                    fill="#050505"
                    stroke={hoveredStroke}
                    strokeWidth="1.25"
                  />
                  <circle
                    cx={tooltipX + 12}
                    cy={tooltipY + 13.5}
                    r="3.5"
                    fill={hoveredStroke}
                  />
                  <text
                    x={tooltipX + 20}
                    y={tooltipY + 17}
                    data-testid="popular-mood-trend-tooltip-mood"
                    className="fill-white font-mono text-[10.5px] font-bold"
                  >
                    {`#${activeTooltipData.rank} ${activeTooltipData.mood}`}
                  </text>
                  <text
                    x={tooltipX + tooltipW - 10}
                    y={tooltipY + 17}
                    textAnchor="end"
                    data-testid="popular-mood-trend-tooltip-count"
                    className="fill-emerald-400 font-mono text-[10.5px] font-bold tabular-nums"
                  >
                    {activeTooltipData.countLabel}
                  </text>
                  <text
                    x={tooltipX + 10}
                    y={tooltipY + 34}
                    data-testid="popular-mood-trend-tooltip-timestamp"
                    className="fill-zinc-300 font-mono text-[10px] tabular-nums"
                  >
                    {activeTooltipData.timestampLabel}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Interactive Time-Window Inspector & Bucket Selector */}
        {activeBucket && (
          <div
            className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/70 text-[11px] font-mono tabular-nums"
            data-testid="popular-moods-24h-bucket-inspector"
          >
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-zinc-500 mr-1">Inspect Window:</span>
              {trendBuckets.map((b, bIdx) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setSelectedBucketIdx(bIdx)}
                  data-testid={`popular-mood-bucket-btn-${b.label}`}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition-colors whitespace-nowrap shrink-0 ${
                    bIdx === safeSelectedBucketIdx
                      ? 'bg-white text-black font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-zinc-300">
              <span className="text-zinc-500">{activeBucket.windowLabel}:</span>
              {top3Moods.map((m, idx) => {
                const toneCls = getToneClasses(m.tone);
                const val = activeBucket.valuesByMood[m.mood] ?? 0;
                const isVisible = isMoodTrendLineVisible(
                  hiddenTrendMoods,
                  m.mood
                );
                return (
                  <span
                    key={m.mood}
                    data-testid={`popular-mood-bucket-val-${idx + 1}`}
                    className={`inline-flex items-center gap-1 ${
                      isVisible ? '' : 'opacity-45 line-through'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-1.5 h-1.5 rounded-full ${
                        isVisible ? toneCls.dot : 'bg-zinc-600'
                      }`}
                    />
                    <span className="text-zinc-400">{m.mood}:</span>
                    <strong className="text-white">{val}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Distribution Bars */}
      <div
        className="space-y-1.5"
        role="group"
        aria-label="Popular moods over the last 24 hours"
      >
        {displayedItems.map((item) => {
          const toneClasses = getToneClasses(item.tone);
          const isFiltered =
            activeMoodFilter !== 'all' &&
            activeMoodFilter.toLowerCase() === item.mood.toLowerCase();
          const barWidthPercent =
            item.usageCount24h > 0 ? Math.max(6, item.sharePercent) : 0;

          return (
            <button
              key={item.mood}
              type="button"
              onClick={() =>
                onSelectMoodFilter(isFiltered ? 'all' : item.mood)
              }
              aria-pressed={isFiltered}
              data-testid={`popular-mood-bar-${item.rank}`}
              className={`w-full text-left p-2 rounded border transition-colors ${
                isFiltered
                  ? 'bg-zinc-900 border-zinc-500'
                  : 'bg-[#0A0A0C] border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[11px] text-zinc-500 tabular-nums shrink-0">
                    #{item.rank}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full shrink-0 ${toneClasses.dot}`}
                  />
                  <span className="font-semibold text-white truncate">
                    {item.mood}
                  </span>
                  {item.isTopMood && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 shrink-0">
                      Top 24h
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 tabular-nums shrink-0">
                  <span
                    className={
                      item.usageCount24h > 0
                        ? 'text-zinc-200 font-semibold'
                        : 'text-zinc-500'
                    }
                  >
                    {item.usageCount24h} in 24h
                  </span>
                  <span aria-hidden="true" className="text-zinc-700">
                    ·
                  </span>
                  <span
                    className={
                      item.activePeersNow > 0
                        ? 'text-emerald-400'
                        : 'text-zinc-500'
                    }
                  >
                    {item.activePeersNow} live
                  </span>
                  <span aria-hidden="true" className="text-zinc-700">
                    ·
                  </span>
                  <span className="w-8 text-right text-zinc-300 font-semibold">
                    {item.sharePercent}%
                  </span>
                </div>
              </div>

              <svg
                viewBox="0 0 100 4"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="h-1.5 w-full rounded-sm bg-zinc-900 overflow-hidden block"
              >
                <rect
                  x="0"
                  y="0"
                  width={barWidthPercent}
                  height="4"
                  className={toneClasses.fill}
                />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
};
