import React, { useState } from 'react';
import {
  MoodPopularity24hSummary,
  MoodTrendRangeHours,
  MoodTrendChartViewMode,
  MOOD_TREND_RANGE_OPTIONS,
  OnlineMoodTone,
  PeerMoodHistoryEvent,
  isMoodTrendLineVisible,
  toggleMoodTrendLineVisibility,
  getVisibleTop3Moods,
  computeMoodTrendPeakMarkers,
  buildMostPopularMoodPeakAnnotation,
  computeMoodPairComparison,
  isMoodTrendPeakBucket,
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
  const [chartViewMode, setChartViewMode] =
    useState<MoodTrendChartViewMode>('top3');
  const [compareMoodA, setCompareMoodA] = useState<string>(
    summary.items[0]?.mood || 'Deep Work'
  );
  const [compareMoodB, setCompareMoodB] = useState<string>(
    summary.items[1]?.mood || 'Brainstorming'
  );

  const filteredTrend = filterMoodTrendByRangeHours({
    trendBuckets: summary.trendBuckets,
    rangeHours: trendRangeHours,
  });
  const trendBuckets = filteredTrend.buckets;

  const pairComparison = computeMoodPairComparison({
    items: summary.items,
    trendBuckets,
    moodA: compareMoodA,
    moodB: compareMoodB,
  });

  const activeChartMoods =
    chartViewMode === 'compare' && pairComparison
      ? [pairComparison.moodAStat, pairComparison.moodBStat]
      : top3Moods;

  const trendPeaks = computeMoodTrendPeakMarkers({
    top3Moods: activeChartMoods,
    trendBuckets,
  });

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

  const handleSelectChartViewMode = (nextMode: MoodTrendChartViewMode) => {
    setChartViewMode(nextMode);
    setHoveredPoint(null);
  };

  const handleChangeCompareMoodA = (nextMoodA: string) => {
    if (pairComparison && nextMoodA === pairComparison.moodBStat.mood) {
      setCompareMoodB(pairComparison.moodAStat.mood);
    }
    setCompareMoodA(nextMoodA);
    setHoveredPoint(null);
  };

  const handleChangeCompareMoodB = (nextMoodB: string) => {
    if (pairComparison && nextMoodB === pairComparison.moodAStat.mood) {
      setCompareMoodA(pairComparison.moodBStat.mood);
    }
    setCompareMoodB(nextMoodB);
    setHoveredPoint(null);
  };

  const handleSwapCompareMoods = () => {
    if (!pairComparison) return;
    setCompareMoodA(pairComparison.moodBStat.mood);
    setCompareMoodB(pairComparison.moodAStat.mood);
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
  const effectiveHiddenMoods =
    chartViewMode === 'compare' ? [] : hiddenTrendMoods;
  const visibleTop3Moods = getVisibleTop3Moods(
    activeChartMoods,
    effectiveHiddenMoods
  );
  const mostPopularPeakAnnotation = buildMostPopularMoodPeakAnnotation(
    trendPeaks,
    effectiveHiddenMoods
  );

  // SVG Line Chart geometry (padTop=38 gives a clean top band for the 2-line #1 Most Popular annotation)
  const svgW = 520;
  const svgH = 208;
  const padLeft = 58;
  const padRight = 20;
  const padTop = 38;
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

  // Ensure the active chart lines always have distinct stroke colors even if two moods share a tone
  const usedStrokes = new Set<string>();
  const lineColors = activeChartMoods.map((m, idx) => {
    const preferred = getToneClasses(m.tone).strokeHex;
    if (!usedStrokes.has(preferred)) {
      usedStrokes.add(preferred);
      return preferred;
    }
    const fallback = FALLBACK_LINE_HEX[idx] || '#a78bfa';
    usedStrokes.add(fallback);
    return fallback;
  });

  // Render order: reverse so #1 / Mood A is always in the foreground
  const renderOrderIndices = activeChartMoods
    .map((_, idx) => idx)
    .reverse();
  const visibleRenderIndices = renderOrderIndices.filter((rankIdx) => {
    const m = activeChartMoods[rankIdx];
    return m ? isMoodTrendLineVisible(effectiveHiddenMoods, m.mood) : false;
  });

  const hoveredMoodStat =
    hoveredPoint && activeChartMoods[hoveredPoint.rankIdx]
      ? activeChartMoods[hoveredPoint.rankIdx]
      : null;
  const hoveredBucket =
    hoveredPoint && trendBuckets[hoveredPoint.bucketIdx]
      ? trendBuckets[hoveredPoint.bucketIdx]
      : null;
  const activeTooltipData =
    hoveredPoint &&
    hoveredMoodStat &&
    hoveredBucket &&
    isMoodTrendLineVisible(effectiveHiddenMoods, hoveredMoodStat.mood)
      ? formatMoodTrendPointTooltip({
          moodStat: hoveredMoodStat,
          bucket: hoveredBucket,
          isPeak: isMoodTrendPeakBucket(
            trendPeaks,
            hoveredPoint.rankIdx,
            hoveredPoint.bucketIdx
          ),
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
            Most popular moods used by active peers over the last 24 hours. Click a mood bar to filter peers, or switch to Compare 2 Moods to overlay and correlate any two mood trend lines.
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

      {/* Top 3 Moods / Two-Mood Comparison Fluctuation Line Chart with 6h / 12h / 24h Date-Range Filter */}
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
                {chartViewMode === 'compare' && pairComparison
                  ? `Compare: ${pairComparison.moodAStat.mood} vs ${pairComparison.moodBStat.mood} · ${trendRangeHours}h Trend`
                  : `Top 3 Moods · ${trendRangeHours}h Fluctuation Trend`}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400 tabular-nums">
                {/* View Mode Toggle: Top 3 View vs Compare 2 Moods */}
                <div
                  className="inline-flex items-center gap-1 p-0.5 rounded bg-[#050505] border border-zinc-800"
                  role="group"
                  aria-label="Select mood trend chart view mode"
                  data-testid="popular-mood-trend-view-mode-toggle"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectChartViewMode('top3')}
                    aria-pressed={chartViewMode === 'top3'}
                    data-testid="popular-mood-mode-top3"
                    className={`px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap shrink-0 ${
                      chartViewMode === 'top3'
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    Top 3 View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectChartViewMode('compare')}
                    aria-pressed={chartViewMode === 'compare'}
                    data-testid="popular-mood-mode-compare"
                    className={`px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap shrink-0 ${
                      chartViewMode === 'compare'
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    Compare 2 Moods
                  </button>
                </div>

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

                {chartViewMode === 'top3' && (
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
                )}
              </div>
            </div>
            <div className="text-[11px] text-zinc-500">
              {chartViewMode === 'compare'
                ? 'Overlay any two mood trend lines to inspect correlation, shaded divergence bands, and maximum popularity gaps'
                : 'Switch between 6h, 12h, or 24h windows or click any legend item to toggle its trend line'}
            </div>
          </div>

          {/* Top 3 View: Clickable Legend to Toggle Visibility of Individual Mood Trend Lines */}
          {chartViewMode === 'top3' && (
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
          )}

          {/* Compare 2 Moods View: Dual Mood Selectors + Correlation & Divergence Summary */}
          {chartViewMode === 'compare' && pairComparison && (
            <div
              className="p-2.5 rounded bg-[#050505] border border-zinc-800/90 space-y-2"
              data-testid="popular-mood-comparison-panel"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
                  {/* Mood A Selector */}
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 min-w-0 max-w-full">
                    <span
                      aria-hidden="true"
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        getToneClasses(pairComparison.moodAStat.tone).dot
                      }`}
                    />
                    <span className="text-zinc-400 shrink-0">Mood A:</span>
                    <select
                      value={pairComparison.moodAStat.mood}
                      onChange={(e) => handleChangeCompareMoodA(e.target.value)}
                      aria-label="Select first mood to compare"
                      data-testid="popular-mood-compare-select-a"
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 text-[11px] font-mono font-semibold focus:outline-none focus:border-zinc-400 min-w-0 max-w-[195px] sm:max-w-none truncate"
                    >
                      {summary.items.map((item) => (
                        <option key={`opt-a-${item.mood}`} value={item.mood}>
                          #{item.rank} {item.mood} ({item.usageCount24h} in 24h)
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Swap A/B Button */}
                  <button
                    type="button"
                    onClick={handleSwapCompareMoods}
                    aria-label="Swap compared moods A and B"
                    data-testid="popular-mood-compare-swap-btn"
                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[10px] font-mono whitespace-nowrap shrink-0"
                  >
                    Swap A/B
                  </button>

                  {/* Mood B Selector */}
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 min-w-0 max-w-full">
                    <span
                      aria-hidden="true"
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        lineColors[1] === '#34d399'
                          ? 'bg-emerald-400'
                          : lineColors[1] === '#fbbf24'
                          ? 'bg-amber-400'
                          : lineColors[1] === '#38bdf8'
                          ? 'bg-sky-400'
                          : getToneClasses(pairComparison.moodBStat.tone).dot
                      }`}
                    />
                    <span className="text-zinc-400 shrink-0">Mood B:</span>
                    <select
                      value={pairComparison.moodBStat.mood}
                      onChange={(e) => handleChangeCompareMoodB(e.target.value)}
                      aria-label="Select second mood to compare"
                      data-testid="popular-mood-compare-select-b"
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 text-[11px] font-mono font-semibold focus:outline-none focus:border-zinc-400 min-w-0 max-w-[195px] sm:max-w-none truncate"
                    >
                      {summary.items.map((item) => (
                        <option key={`opt-b-${item.mood}`} value={item.mood}>
                          #{item.rank} {item.mood} ({item.usageCount24h} in 24h)
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Range Totals for Mood A vs Mood B */}
                <div
                  className="text-[11px] font-mono text-zinc-300 tabular-nums"
                  data-testid="popular-mood-compare-totals"
                >
                  <span className="text-zinc-400">{trendRangeHours}h Sum:</span>{' '}
                  <strong className="text-white">
                    {pairComparison.moodAStat.mood}
                  </strong>{' '}
                  ({pairComparison.totalCountA}) vs{' '}
                  <strong className="text-white">
                    {pairComparison.moodBStat.mood}
                  </strong>{' '}
                  ({pairComparison.totalCountB})
                </div>
              </div>

              {/* Correlation & Divergence Metrics Bar */}
              <div
                className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/70 text-[11px] font-mono tabular-nums"
                data-testid="popular-mood-compare-metrics"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span data-testid="popular-mood-compare-relationship">
                    <span className="text-zinc-500">Pattern:</span>{' '}
                    <strong
                      className={
                        pairComparison.relationshipType === 'Correlated'
                          ? 'text-emerald-400'
                          : pairComparison.relationshipType === 'Divergent'
                          ? 'text-amber-400'
                          : 'text-sky-400'
                      }
                    >
                      {pairComparison.relationshipLabel}
                    </strong>
                  </span>

                  <span
                    aria-hidden="true"
                    className="text-zinc-700 hidden sm:inline"
                  >
                    ·
                  </span>

                  <span data-testid="popular-mood-compare-max-divergence">
                    <span className="text-zinc-500">Max Gap:</span>{' '}
                    <strong className="text-amber-400">
                      Δ{pairComparison.maxDivergenceBucket.absDelta}
                    </strong>{' '}
                    <span className="text-zinc-300">
                      @ {pairComparison.maxDivergenceBucket.label}
                    </span>{' '}
                    <span className="text-zinc-400">
                      ({pairComparison.maxDivergenceBucket.leaderMood})
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="text-zinc-700 hidden sm:inline"
                  >
                    ·
                  </span>

                  <span data-testid="popular-mood-compare-convergence">
                    <span className="text-zinc-500">Closest:</span>{' '}
                    <strong className="text-emerald-400">
                      Δ{pairComparison.maxConvergenceBucket.absDelta}
                    </strong>{' '}
                    <span className="text-zinc-300">
                      @ {pairComparison.maxConvergenceBucket.label}
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedBucketIdx(
                      pairComparison.maxDivergenceBucket.bucketIndex
                    );
                    setHoveredPoint({
                      rankIdx: 0,
                      bucketIdx: pairComparison.maxDivergenceBucket.bucketIndex,
                    });
                  }}
                  data-testid="popular-mood-compare-focus-gap-btn"
                  className="text-[10px] font-mono text-sky-400 hover:text-white underline underline-offset-2 whitespace-nowrap shrink-0"
                >
                  Inspect Max Gap
                </button>
              </div>

              <div
                className="text-[11px] font-mono text-zinc-400"
                data-testid="popular-mood-compare-summary-text"
              >
                {pairComparison.summaryInsight}
              </div>
            </div>
          )}

          {/* Automated Text Annotation Context Banner for the Most Popular Mood */}
          {mostPopularPeakAnnotation && (
            <div
              className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/60 text-[11px] font-mono tabular-nums"
              data-testid="popular-mood-most-popular-annotation-banner"
            >
              <span
                className="text-zinc-300"
                data-testid="popular-mood-most-popular-annotation-text"
              >
                {mostPopularPeakAnnotation.annotationContextSentence}
              </span>
              <button
                type="button"
                onClick={() => {
                  const targetIdx = Math.max(
                    0,
                    activeChartMoods.findIndex(
                      (m) => m.mood === mostPopularPeakAnnotation.mood
                    )
                  );
                  setSelectedBucketIdx(
                    mostPopularPeakAnnotation.primaryPeakBucketIndex
                  );
                  setHoveredPoint({
                    rankIdx: targetIdx,
                    bucketIdx: mostPopularPeakAnnotation.primaryPeakBucketIndex,
                  });
                }}
                data-testid="popular-mood-focus-most-popular-peak-btn"
                className="text-[10px] font-mono text-sky-400 hover:text-white underline underline-offset-2 whitespace-nowrap shrink-0"
              >
                Inspect Peak Point
              </button>
            </div>
          )}
        </div>

        {/* SVG Line Chart with Clear Axis Labels & Data Point Markers */}
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            role="img"
            aria-label={
              chartViewMode === 'compare' && pairComparison
                ? `Comparison line chart overlaying ${pairComparison.moodAStat.mood} and ${pairComparison.moodBStat.mood} over the last ${trendRangeHours} hours`
                : `Line chart showing ${trendRangeHours}-hour fluctuation of the top 3 most popular moods with labeled axes and data point markers`
            }
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

            {/* Empty Prompt if All Trend Lines Are Toggled Off */}
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

            {/* Comparison Mode: Shaded Divergence Polygon & Vertical Bucket Delta Connectors */}
            {chartViewMode === 'compare' &&
              pairComparison &&
              trendBuckets.length > 0 &&
              (() => {
                const forwardPoints = trendBuckets
                  .map((b, bIdx) => {
                    const valA =
                      b.valuesByMood[pairComparison.moodAStat.mood] ?? 0;
                    return `${getBucketX(bIdx)},${getValueY(valA)}`;
                  })
                  .join(' ');
                const backwardPoints = [...trendBuckets]
                  .reverse()
                  .map((b, revIdx) => {
                    const origIdx = trendBuckets.length - 1 - revIdx;
                    const valB =
                      b.valuesByMood[pairComparison.moodBStat.mood] ?? 0;
                    return `${getBucketX(origIdx)},${getValueY(valB)}`;
                  })
                  .join(' ');

                return (
                  <g data-testid="popular-mood-compare-overlay-group">
                    <polygon
                      points={`${forwardPoints} ${backwardPoints}`}
                      fill="#38bdf8"
                      fillOpacity="0.11"
                      data-testid="popular-mood-compare-divergence-band"
                    />
                    {pairComparison.deltasByBucket.map((deltaItem) => {
                      if (deltaItem.absDelta === 0) return null;
                      const x = getBucketX(deltaItem.bucketIndex);
                      const yA = getValueY(deltaItem.valA);
                      const yB = getValueY(deltaItem.valB);
                      const isMaxGap =
                        deltaItem.bucketIndex ===
                        pairComparison.maxDivergenceBucket.bucketIndex;
                      return (
                        <line
                          key={`delta-line-${deltaItem.label}`}
                          x1={x}
                          y1={yA}
                          x2={x}
                          y2={yB}
                          stroke={isMaxGap ? '#fbbf24' : '#71717a'}
                          strokeOpacity={isMaxGap ? '0.85' : '0.45'}
                          strokeDasharray={isMaxGap ? '2.5 2' : '1.5 2'}
                          strokeWidth={isMaxGap ? '1.6' : '1.1'}
                          data-testid={`popular-mood-compare-delta-line-${deltaItem.bucketIndex}`}
                        />
                      );
                    })}
                  </g>
                );
              })()}

            {/* Visible Moods Polylines (drawn in reverse so #1 / Mood A is in foreground) */}
            {visibleRenderIndices.map((rankIdx) => {
              const moodStat = activeChartMoods[rankIdx];
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
                  strokeWidth={rankIdx === 0 ? '2.5' : '1.95'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsStr}
                  data-testid={`popular-mood-trend-line-${rankIdx + 1}`}
                />
              );
            })}

            {/* Small Data Point & Dynamic Peak Markers for Each Visible Mood Across All Selected Time Buckets */}
            {visibleRenderIndices.map((rankIdx) => {
              const moodStat = activeChartMoods[rankIdx];
              if (!moodStat) return null;
              const strokeColor = lineColors[rankIdx];
              const peakInfo = trendPeaks[rankIdx];
              return trendBuckets.map((b, bIdx) => {
                const val = b.valuesByMood[moodStat.mood] ?? 0;
                const cx = getBucketX(bIdx);
                const cy = getValueY(val);
                const isSelected = bIdx === safeSelectedBucketIdx;
                const isPeak = isMoodTrendPeakBucket(trendPeaks, rankIdx, bIdx);
                const isPrimaryPeak =
                  Boolean(peakInfo?.hasPeak) &&
                  peakInfo?.primaryPeakBucketIndex === bIdx;
                const isHovered =
                  hoveredPoint?.rankIdx === rankIdx &&
                  hoveredPoint?.bucketIdx === bIdx;
                const ptTooltip = formatMoodTrendPointTooltip({
                  moodStat,
                  bucket: b,
                  isPeak,
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
                    {isPeak && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isPrimaryPeak ? 8.2 : 7.2}
                        fill="none"
                        stroke={strokeColor}
                        strokeOpacity={isPrimaryPeak ? '0.8' : '0.55'}
                        strokeDasharray="2.5 2"
                        strokeWidth={isPrimaryPeak ? '1.6' : '1.3'}
                        pointerEvents="none"
                        data-testid={`popular-mood-trend-peak-marker-${rankIdx + 1}-${bIdx}`}
                      />
                    )}
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9.5}
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
                      r={
                        isHovered
                          ? 5.4
                          : isPeak
                          ? 4.9
                          : isSelected
                          ? 4.6
                          : 3.6
                      }
                      fill="#050505"
                      stroke={strokeColor}
                      strokeWidth={
                        isHovered
                          ? '2.6'
                          : isPeak
                          ? '2.4'
                          : isSelected
                          ? '2.2'
                          : '1.9'
                      }
                      onMouseEnter={handleActivatePoint}
                      onMouseLeave={handleDeactivatePoint}
                      data-testid={`popular-mood-trend-marker-${rankIdx + 1}-${bIdx}`}
                    >
                      <title>{`#${ptTooltip.rank} ${ptTooltip.mood}${ptTooltip.isPeak ? ' (PEAK)' : ''} · ${ptTooltip.countLabel} · ${ptTooltip.timestampLabel}`}</title>
                    </circle>
                    {isPeak && (
                      <polygon
                        points={`${cx},${cy - 2.4} ${cx + 2.4},${cy} ${cx},${cy + 2.4} ${cx - 2.4},${cy}`}
                        fill={strokeColor}
                        pointerEvents="none"
                      />
                    )}
                  </g>
                );
              });
            })}

            {/* Automated On-Chart Text Annotations Identifying Each Specific Mood Type at Its Peak Time */}
            {!activeTooltipData &&
              visibleRenderIndices.map((rankIdx) => {
                const moodStat = activeChartMoods[rankIdx];
                const peakInfo = trendPeaks[rankIdx];
                if (
                  !moodStat ||
                  !peakInfo ||
                  !peakInfo.hasPeak ||
                  peakInfo.primaryPeakBucketIndex < 0
                ) {
                  return null;
                }
                const bIdx = peakInfo.primaryPeakBucketIndex;
                const strokeColor = lineColors[rankIdx] || '#34d399';
                const cx = getBucketX(bIdx);
                const cy = getValueY(peakInfo.peakCount);
                const isTopMood = peakInfo.isMostPopularMood;

                const line1Text = isTopMood
                  ? `#1 ${peakInfo.annotationTitle}`
                  : `${peakInfo.mood} · Peak ${peakInfo.peakCount} (${peakInfo.primaryPeakBucketLabel})`;
                const line2Text = isTopMood ? peakInfo.annotationSubtext : '';

                const maxChars = Math.max(line1Text.length, line2Text.length);
                const badgeW = Math.max(
                  isTopMood ? 162 : 114,
                  Math.round(maxChars * 5.4 + 14)
                );
                const badgeH = isTopMood ? 25 : 16;
                const badgeX = Math.max(
                  padLeft + 2,
                  Math.min(
                    svgW - padRight - badgeW - 2,
                    Number((cx - badgeW / 2).toFixed(1))
                  )
                );

                // Offset vertically if another higher-ranked visible mood shares the exact same (bIdx, peakCount)
                const samePointCount = visibleRenderIndices.filter(
                  (otherIdx) => {
                    if (otherIdx >= rankIdx) return false;
                    const otherPeak = trendPeaks[otherIdx];
                    return (
                      otherPeak?.hasPeak &&
                      otherPeak.primaryPeakBucketIndex === bIdx &&
                      otherPeak.peakCount === peakInfo.peakCount
                    );
                  }
                ).length;

                const rawAboveY = cy - badgeH - 7 - samePointCount * 18;
                const placeAbove = rawAboveY >= 2;
                const badgeY = placeAbove
                  ? Number(rawAboveY.toFixed(1))
                  : Number((cy + 10 + samePointCount * 18).toFixed(1));
                const connectorY1 = placeAbove ? badgeY + badgeH : badgeY;
                const connectorY2 = placeAbove ? cy - 5.5 : cy + 5.5;

                return (
                  <g
                    key={`peak-badge-${moodStat.mood}`}
                    data-testid={`popular-mood-trend-peak-badge-${rankIdx + 1}`}
                    onClick={() => {
                      setSelectedBucketIdx(bIdx);
                      setHoveredPoint({ rankIdx, bucketIdx: bIdx });
                    }}
                    className="cursor-pointer"
                  >
                    <line
                      x1={cx}
                      y1={connectorY1}
                      x2={cx}
                      y2={connectorY2}
                      stroke={strokeColor}
                      strokeOpacity="0.65"
                      strokeDasharray="1.5 1.5"
                      strokeWidth="1"
                    />
                    <rect
                      x={badgeX}
                      y={badgeY}
                      width={badgeW}
                      height={badgeH}
                      rx="3.5"
                      fill="#050505"
                      fillOpacity="0.94"
                      stroke={strokeColor}
                      strokeWidth={isTopMood ? '1.3' : '1'}
                    />
                    <text
                      x={Number((badgeX + badgeW / 2).toFixed(1))}
                      y={Number((badgeY + (isTopMood ? 10.5 : 11)).toFixed(1))}
                      textAnchor="middle"
                      fill={isTopMood ? '#ffffff' : strokeColor}
                      data-testid={`popular-mood-trend-annotation-title-${rankIdx + 1}`}
                      className="font-mono text-[9.5px] font-bold tabular-nums"
                    >
                      {line1Text}
                    </text>
                    {isTopMood && line2Text && (
                      <text
                        x={Number((badgeX + badgeW / 2).toFixed(1))}
                        y={Number((badgeY + 21.5).toFixed(1))}
                        textAnchor="middle"
                        fill={strokeColor}
                        data-testid={`popular-mood-trend-annotation-detail-${rankIdx + 1}`}
                        className="font-mono text-[8.8px] font-semibold tabular-nums"
                      >
                        {line2Text}
                      </text>
                    )}
                  </g>
                );
              })}

            {/* Comparison Mode: On-Chart Max Divergence Callout Badge */}
            {!activeTooltipData &&
              chartViewMode === 'compare' &&
              pairComparison &&
              pairComparison.maxDivergenceBucket.absDelta > 0 &&
              (() => {
                const gapBucket = pairComparison.maxDivergenceBucket;
                const gapIdx = gapBucket.bucketIndex;
                const cx = getBucketX(gapIdx);
                const yA = getValueY(gapBucket.valA);
                const yB = getValueY(gapBucket.valB);
                const midY = (yA + yB) / 2;
                const labelText = `Max Gap Δ${gapBucket.absDelta} (${gapBucket.label})`;
                const badgeW = Math.max(
                  118,
                  Math.round(labelText.length * 5.4 + 14)
                );
                const badgeH = 15;
                const badgeX = Math.max(
                  padLeft + 4,
                  Math.min(
                    svgW - padRight - badgeW - 4,
                    Number((cx - badgeW / 2).toFixed(1))
                  )
                );
                const badgeY = Math.max(
                  padTop + 18,
                  Math.min(
                    padTop + plotH - badgeH - 4,
                    Number((midY - badgeH / 2).toFixed(1))
                  )
                );

                return (
                  <g
                    data-testid="popular-mood-compare-max-divergence-badge"
                    onClick={() => {
                      setSelectedBucketIdx(gapIdx);
                      setHoveredPoint({ rankIdx: 0, bucketIdx: gapIdx });
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x={badgeX}
                      y={badgeY}
                      width={badgeW}
                      height={badgeH}
                      rx="3"
                      fill="#050505"
                      fillOpacity="0.94"
                      stroke="#fbbf24"
                      strokeWidth="1"
                    />
                    <text
                      x={Number((badgeX + badgeW / 2).toFixed(1))}
                      y={Number((badgeY + 10.5).toFixed(1))}
                      textAnchor="middle"
                      fill="#fbbf24"
                      className="font-mono text-[9px] font-bold tabular-nums"
                    >
                      {labelText}
                    </text>
                  </g>
                );
              })()}

            {/* Floating Hover Tooltip Showing Exact Mood Count, Peak Status & Timestamp */}
            {activeTooltipData && hoveredPoint && (() => {
              const hoveredStroke =
                lineColors[hoveredPoint.rankIdx] || '#34d399';
              const hoveredCx = getBucketX(hoveredPoint.bucketIdx);
              const hoveredCy = getValueY(activeTooltipData.exactCount);
              const tooltipW = 280;
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
                    {activeTooltipData.isPeak && (
                      <tspan
                        data-testid="popular-mood-trend-tooltip-peak"
                        className="fill-amber-400 font-bold"
                      >
                        {' · PEAK'}
                      </tspan>
                    )}
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

        {/* Dynamic Peak Popularity Times Summary Strip */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/70 text-[11px] font-mono tabular-nums"
          data-testid="popular-mood-trend-peaks-strip"
        >
          <span className="text-zinc-500">
            Peak Popularity ({trendRangeHours}h):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {trendPeaks.map((peakInfo, idx) => {
              const toneCls = getToneClasses(peakInfo.tone);
              const isVisible = isMoodTrendLineVisible(
                effectiveHiddenMoods,
                peakInfo.mood
              );
              const isPeakHighlighted =
                hoveredPoint?.rankIdx === idx &&
                hoveredPoint?.bucketIdx === peakInfo.primaryPeakBucketIndex;
              if (!peakInfo.hasPeak) {
                return (
                  <span
                    key={peakInfo.mood}
                    data-testid={`popular-mood-peak-none-${idx + 1}`}
                    className="text-[10px] text-zinc-600"
                  >
                    #{idx + 1} {peakInfo.mood}: 0 peak
                  </span>
                );
              }
              return (
                <button
                  key={peakInfo.mood}
                  type="button"
                  onClick={() => {
                    if (!isVisible && chartViewMode === 'top3') {
                      setHiddenTrendMoods((prev) =>
                        toggleMoodTrendLineVisibility(prev, peakInfo.mood)
                      );
                    }
                    setSelectedBucketIdx(peakInfo.primaryPeakBucketIndex);
                    setHoveredPoint({
                      rankIdx: idx,
                      bucketIdx: peakInfo.primaryPeakBucketIndex,
                    });
                  }}
                  aria-label={`Highlight ${peakInfo.mood} peak of ${peakInfo.peakCount} at ${peakInfo.primaryPeakBucketLabel} (${peakInfo.primaryPeakClockUtc})`}
                  data-testid={`popular-mood-peak-jump-${idx + 1}`}
                  className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 px-2 py-0.5 rounded border text-left text-[10px] font-mono tabular-nums max-w-full ${
                    isPeakHighlighted
                      ? 'bg-zinc-900 text-white border-zinc-500'
                      : isVisible
                      ? 'bg-[#050505] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                      : 'bg-[#050505]/50 text-zinc-500 border-zinc-800/60 line-through'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isVisible ? toneCls.dot : 'bg-zinc-700'
                    }`}
                  />
                  <span className="font-semibold text-zinc-200">
                    {peakInfo.mood}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    Peak {peakInfo.peakCount}
                  </span>
                  <span className="text-zinc-400">
                    @ {peakInfo.primaryPeakBucketLabel} ({peakInfo.primaryPeakClockUtc})
                  </span>
                </button>
              );
            })}
          </div>
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
                  className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap shrink-0 ${
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
              {activeChartMoods.map((m, idx) => {
                const toneCls = getToneClasses(m.tone);
                const val = activeBucket.valuesByMood[m.mood] ?? 0;
                const isVisible = isMoodTrendLineVisible(
                  effectiveHiddenMoods,
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
              {chartViewMode === 'compare' && pairComparison && (
                <span
                  data-testid="popular-mood-bucket-compare-delta"
                  className="text-amber-400 font-semibold"
                >
                  (Δ
                  {Math.abs(
                    (activeBucket.valuesByMood[pairComparison.moodAStat.mood] ??
                      0) -
                      (activeBucket.valuesByMood[
                        pairComparison.moodBStat.mood
                      ] ?? 0)
                  )}
                  )
                </span>
              )}
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
