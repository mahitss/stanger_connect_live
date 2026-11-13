import React, { useMemo, useState } from 'react';
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
  FocusHistory30DayPoint,
  FocusHistory30DaySummary,
  buildStudy30DayActivityAndStreaksPdfReportSpec,
  formatStudyDurationLabel,
  normalizeStudyRoomCode,
  sanitizeSafeText,
} from '../utils/rules';
import {
  TrendingUp,
  Calendar,
  Plus,
  CheckCircle2,
  Download,
  FileText,
  Flame,
  Award,
  ShieldCheck,
} from './ArchitecturalGlyphs';

interface StudyRoomFocusHistory30DayRechartsCardProps {
  summary: FocusHistory30DaySummary;
  activeRoomCode: string;
  dailyTargetMinutes: number;
  selectedRoomFilter: string;
  scholarName?: string;
  loginStreakDays?: number;
  onChangeRoomFilter: (nextRoomFilter: string) => void;
  onLogDailyFocusMinutes: (params: {
    dateKey: string;
    roomCode: string;
    topic: string;
    minutes: number;
  }) => void;
}

interface CustomFocusHistoryTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: FocusHistory30DayPoint;
  }>;
}

const CustomFocusHistory30DayTooltip: React.FC<
  CustomFocusHistoryTooltipProps
> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  return (
    <div
      className="p-3.5 rounded-lg bg-[#050507] border border-zinc-700 shadow-2xl space-y-1.5 text-xs"
      data-testid="focus-history-recharts-tooltip"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono font-bold text-white">
          {pt.weekdayShort}, {pt.shortDateLabel} ({pt.dateKey})
        </span>
        <span
          className={`font-mono tabular-nums ${
            pt.goalMet ? 'text-emerald-400' : 'text-amber-300'
          }`}
        >
          {pt.goalCompletionPercent}% of {pt.dailyTargetMinutes}m goal
        </span>
      </div>
      <div className="pt-1 border-t border-zinc-800/90 flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-zinc-400">Daily Focus Logged:</span>
        <span className="font-bold text-emerald-400">
          {pt.formattedDuration} ({pt.focusHours}h)
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums text-[11px]">
        <span className="text-zinc-400">7-Day Rolling Avg:</span>
        <span className="text-sky-300">{pt.rolling7DayAvgMinutes}m/day</span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums text-[11px]">
        <span className="text-zinc-400">Sessions & Top Room:</span>
        <span className="text-zinc-200">
          {pt.sessionsCount} {pt.sessionsCount === 1 ? 'session' : 'sessions'} ·{' '}
          {pt.topRoomCode}
        </span>
      </div>
      <div className="text-[11px] text-zinc-400 truncate max-w-[260px]">
        Focus Topic: <span className="text-zinc-200">{pt.topTopic}</span>
      </div>
    </div>
  );
};

export const StudyRoomFocusHistory30DayRechartsCard: React.FC<
  StudyRoomFocusHistory30DayRechartsCardProps
> = ({
  summary,
  activeRoomCode,
  dailyTargetMinutes,
  selectedRoomFilter,
  scholarName = 'Sanctuary Scholar',
  loginStreakDays = 1,
  onChangeRoomFilter,
  onLogDailyFocusMinutes,
}) => {
  const [showRollingAverage, setShowRollingAverage] = useState<boolean>(true);
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    summary.todayPoint.dateKey
  );
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState<boolean>(false);
  const [pdfExportCount, setPdfExportCount] = useState<number>(0);
  const [lastExportedPdfToast, setLastExportedPdfToast] = useState<
    string | null
  >(null);

  const pdfReportSpec = useMemo(
    () =>
      buildStudy30DayActivityAndStreaksPdfReportSpec({
        summary,
        scholarName,
        activeRoomCode,
        loginStreakDays,
      }),
    [summary, scholarName, activeRoomCode, loginStreakDays]
  );

  const handleDownload30DayPdfReport = (openPreviewDrawer = true) => {
    try {
      const blob = new Blob([pdfReportSpec.pdfContent], {
        type: pdfReportSpec.mimeType,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', pdfReportSpec.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      // Fallback for restricted environments
    }
    setPdfExportCount((prev) => prev + 1);
    if (openPreviewDrawer) {
      setIsPdfPreviewOpen(true);
    }
    setLastExportedPdfToast(
      `Downloaded ${pdfReportSpec.filename} (${pdfReportSpec.pageCount} pages · ${Math.ceil(
        pdfReportSpec.byteLength / 1024
      )} KB · ID ${pdfReportSpec.verificationDigest})`
    );
  };

  const inspectedPoint =
    summary.points.find((p) => p.dateKey === selectedDateKey) ||
    summary.todayPoint;

  return (
    <section
      id="study-room-focus-history-section"
      data-testid="study-room-focus-history-section"
      data-days-count={summary.points.length}
      aria-label="Focus History 30-Day Daily Focus Minutes Line Chart"
      className="p-6 rounded-xl border border-zinc-800/90 bg-[#0A0A0C] space-y-6"
    >
      {/* Section Header & Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-emerald-400">
              30-Day Longitudinal Study Telemetry & PDF Report
            </span>
            <span aria-hidden="true">·</span>
            <span
              className="font-mono tabular-nums"
              data-testid="focus-history-window-label"
            >
              {summary.windowLabel}
            </span>
          </div>
          <h2
            className="text-lg font-bold text-white"
            data-testid="focus-history-heading"
          >
            Focus History & 30-Day Productivity Streaks
          </h2>
          <p className="text-xs text-zinc-400 max-w-3xl">
            Daily focus minutes logged over the past 30 days across your study
            sessions, overlaid with your 7-day rolling average, consecutive
            productivity streaks, and downloadable 2-page PDF report.
          </p>
        </div>

        {/* Overlay Toggles, Room Filter & 30-Day PDF Export Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleDownload30DayPdfReport(true)}
            data-testid="focus-history-export-30day-pdf-btn"
            className="px-3.5 py-1.5 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export 30-Day PDF Report</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPdfPreviewOpen((prev) => !prev)}
            aria-expanded={isPdfPreviewOpen}
            data-testid="focus-history-preview-30day-pdf-btn"
            className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              isPdfPreviewOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                : 'bg-[#050507] hover:bg-zinc-900 text-zinc-200 border-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {isPdfPreviewOpen ? 'Hide PDF Preview' : 'Preview PDF Report'}
            </span>
          </button>

          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-[#050507] border border-zinc-800/90"
            role="group"
            aria-label="Focus History chart overlays"
          >
            <button
              type="button"
              onClick={() => setShowRollingAverage((prev) => !prev)}
              aria-pressed={showRollingAverage}
              data-testid="focus-history-toggle-rolling-avg-btn"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showRollingAverage
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              7d Rolling Avg
            </button>
            <button
              type="button"
              onClick={() => setShowTargetLine((prev) => !prev)}
              aria-pressed={showTargetLine}
              data-testid="focus-history-toggle-target-line-btn"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showTargetLine
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Daily Goal ({dailyTargetMinutes}m)
            </button>
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-[#050507] border border-zinc-800/90"
            role="group"
            aria-label="Filter 30-day focus history by room"
          >
            <button
              type="button"
              onClick={() => onChangeRoomFilter('ALL')}
              data-testid="focus-history-room-filter-ALL"
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedRoomFilter === 'ALL'
                  ? 'bg-emerald-500 text-black font-bold'
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
                data-testid={`focus-history-room-filter-${rCode}`}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedRoomFilter === rCode
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {rCode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Banner When 30-Day PDF Report Is Exported */}
      {lastExportedPdfToast && (
        <div
          role="status"
          data-testid="focus-history-pdf-exported-banner"
          className="p-3.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-200"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono truncate">{lastExportedPdfToast}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-emerald-300">
              Exports this session: {pdfExportCount}
            </span>
            <a
              href={pdfReportSpec.dataUrl}
              download={pdfReportSpec.filename}
              data-testid="focus-history-pdf-direct-download-link"
              className="px-2.5 py-1 rounded bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-mono font-bold text-[11px] transition-colors"
            >
              Save PDF Again
            </a>
          </div>
        </div>
      )}

      {/* Expandable 30-Day Study Activity & Productivity Streaks Formatted PDF Report Preview */}
      {isPdfPreviewOpen && (
        <div
          data-testid="study-30day-pdf-report-preview-card"
          className="p-5 rounded-xl bg-[#050507] border border-emerald-500/40 space-y-5 shadow-2xl"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/90 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>FORMATTED 2-PAGE PDF REPORT PREVIEW</span>
                <span aria-hidden="true">·</span>
                <span data-testid="study-30day-pdf-verification-id">
                  {pdfReportSpec.verificationDigest}
                </span>
                <span aria-hidden="true">·</span>
                <span>{pdfReportSpec.filename}</span>
              </div>
              <h3 className="text-base font-bold text-white">
                {pdfReportSpec.reportTitle}
              </h3>
              <p className="text-xs text-zinc-400">
                Scholar: <strong className="text-white">{pdfReportSpec.scholarName}</strong> ·
                Scope: <strong className="text-emerald-300">{pdfReportSpec.selectedRoomFilter}</strong> ·
                Window: <span className="font-mono text-zinc-300">{pdfReportSpec.windowLabel}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownload30DayPdfReport(true)}
                data-testid="download-30day-study-pdf-confirm-btn"
                className="px-4 py-2 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Download Formatted PDF ({pdfReportSpec.pageCount} Pages)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPdfPreviewOpen(false)}
                data-testid="close-30day-study-pdf-preview-btn"
                className="px-3 py-2 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>

          {/* Productivity Streaks & Consistency Audit Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3 rounded-lg bg-[#0A0A0E] border border-zinc-800/90 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Current Focus Streak</span>
              </div>
              <div
                data-testid="pdf-report-current-focus-streak"
                className="text-lg font-mono font-bold text-amber-300 tabular-nums"
              >
                {pdfReportSpec.streakAudit.currentFocusStreakDays} days
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                Consecutive active study days
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0A0A0E] border border-zinc-800/90 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Longest 30d Streak</span>
              </div>
              <div
                data-testid="pdf-report-longest-focus-streak"
                className="text-lg font-mono font-bold text-emerald-400 tabular-nums"
              >
                {pdfReportSpec.streakAudit.longestFocusStreakDays} days
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                Best run in past 30 days
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0A0A0E] border border-zinc-800/90 space-y-1">
              <div className="text-[11px] font-mono text-zinc-400">
                Daily Goal Streak ({pdfReportSpec.dailyTargetMinutes}m)
              </div>
              <div
                data-testid="pdf-report-goal-streak"
                className="text-lg font-mono font-bold text-sky-300 tabular-nums"
              >
                {pdfReportSpec.streakAudit.currentGoalStreakDays}d{' '}
                <span className="text-xs font-normal text-zinc-400">
                  (Best: {pdfReportSpec.streakAudit.longestGoalStreakDays}d)
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                {pdfReportSpec.streakAudit.goalMetDaysCount}/30 goal days met
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0A0A0E] border border-zinc-800/90 space-y-1">
              <div className="text-[11px] font-mono text-zinc-400">
                Sanctuary Login Streak
              </div>
              <div
                data-testid="pdf-report-login-streak"
                className="text-lg font-mono font-bold text-white tabular-nums"
              >
                {pdfReportSpec.streakAudit.loginStreakDays}d streak
              </div>
              <div className="text-[10px] font-mono text-emerald-400">
                Verified daily presence
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0A0A0E] border border-zinc-800/90 space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-mono text-zinc-400">
                Consistency Rating
              </div>
              <div
                data-testid="pdf-report-consistency-tier"
                className="text-sm font-mono font-bold text-emerald-300 truncate"
              >
                {pdfReportSpec.streakAudit.consistencyTierLabel}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate">
                {pdfReportSpec.streakAudit.activeDaysCount}/30 active days
              </div>
            </div>
          </div>

          {/* Room-by-Room Activity Breakdown included in the PDF */}
          <div className="p-3.5 rounded-lg bg-[#0A0A0E] border border-zinc-800/80 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono font-bold text-white uppercase tracking-wider">
                30-Day Study Room Distribution
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                Total: {pdfReportSpec.total30DayFocusMinutes}m ({pdfReportSpec.total30DayFocusHours}h)
              </span>
            </div>
            {pdfReportSpec.streakAudit.roomBreakdown.length === 0 ? (
              <p className="text-xs font-mono text-zinc-400">
                No study sessions recorded yet in this 30-day filter window. Complete a live focus timer sprint to populate room breakdown telemetry.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {pdfReportSpec.streakAudit.roomBreakdown.map((rm) => (
                  <div
                    key={rm.roomCode}
                    className="p-2.5 rounded bg-[#050507] border border-zinc-800/90 flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-emerald-300 truncate">
                        {rm.roomCode}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {rm.daysActive}d active · {rm.sessionsCount} sess
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-white tabular-nums">
                        {rm.totalMinutes}m
                      </div>
                      <div className="text-[10px] text-zinc-400 tabular-nums">
                        {rm.sharePercent}% share
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 30-Day Chronological Table Preview (Scrollable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300 font-semibold">
                30-Day Daily Ledger Table Included in PDF ({pdfReportSpec.dailyRows.length} Days)
              </span>
              <span className="text-zinc-400 text-[11px]">
                Pages 1–2 · {Math.ceil(pdfReportSpec.byteLength / 1024)} KB PDF-1.4 Document
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-zinc-800/90 bg-[#0A0A0E]">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead className="sticky top-0 bg-zinc-950 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-2 px-3">Day</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Focus Time</th>
                    <th className="py-2 px-3">7d Avg</th>
                    <th className="py-2 px-3">Goal Status</th>
                    <th className="py-2 px-3">Room</th>
                    <th className="py-2 px-3">Topic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {pdfReportSpec.dailyRows
                    .slice()
                    .reverse()
                    .map((row) => (
                      <tr
                        key={row.dateKey}
                        className="hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="py-1.5 px-3 text-zinc-400 tabular-nums">
                          #{row.dayNumber}
                        </td>
                        <td className="py-1.5 px-3 text-white whitespace-nowrap">
                          {row.weekdayShort}, {row.shortDateLabel}
                        </td>
                        <td className="py-1.5 px-3 text-emerald-400 font-bold tabular-nums">
                          {row.focusMinutes}m ({row.formattedDuration})
                        </td>
                        <td className="py-1.5 px-3 text-sky-300 tabular-nums">
                          {row.rolling7DayAvgMinutes}m/d
                        </td>
                        <td
                          className={`py-1.5 px-3 tabular-nums ${
                            row.goalMet ? 'text-emerald-300' : 'text-zinc-400'
                          }`}
                        >
                          {row.goalStatusLabel}
                        </td>
                        <td className="py-1.5 px-3 text-zinc-200 whitespace-nowrap">
                          {row.topRoomCode}
                        </td>
                        <td className="py-1.5 px-3 text-zinc-400 truncate max-w-[180px]">
                          {row.topTopic}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4 Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">
            30-Day Total Focus Minutes
          </div>
          <div
            className="text-xl font-bold font-mono text-white tabular-nums"
            data-testid="focus-history-total-30d-minutes"
          >
            {summary.total30DayFocusMinutes}m{' '}
            <span className="text-xs font-normal text-zinc-400">
              ({summary.total30DayFocusHours}h)
            </span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400 tabular-nums">
            {summary.activeDaysCount}/30 active study days logged
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">Daily Average (Past 30d)</div>
          <div
            className="text-xl font-bold font-mono text-emerald-400 tabular-nums"
            data-testid="focus-history-daily-average-minutes"
          >
            {summary.averageDailyFocusMinutes}m/day
          </div>
          <div className="text-[11px] font-mono text-zinc-300 tabular-nums">
            {summary.formattedAverageDailyFocus} avg ·{' '}
            {summary.weekOverWeekDeltaPercent >= 0
              ? `+${summary.weekOverWeekDeltaPercent}%`
              : `${summary.weekOverWeekDeltaPercent}%`}{' '}
            last 7d vs prior 7d
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">
            Daily Goal Hit Rate ({dailyTargetMinutes}m)
          </div>
          <div
            className="text-xl font-bold font-mono text-white tabular-nums"
            data-testid="focus-history-goal-hit-days"
          >
            {summary.goalMetDaysCount}/30 days{' '}
            <span className="text-xs font-normal text-emerald-400">
              ({summary.goalMetRatePercent}%)
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
            {summary.currentStreakDays}-day consecutive focus streak
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-1">
          <div className="text-xs text-zinc-400">Peak Focus Day (30d)</div>
          <div
            className="text-xl font-bold font-mono text-white tabular-nums"
            data-testid="focus-history-peak-day-minutes"
          >
            {summary.peakDay.focusMinutes}m{' '}
            <span className="text-xs font-normal text-zinc-400">
              ({summary.peakDay.shortDateLabel})
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 tabular-nums truncate">
            {summary.peakDay.topRoomCode} · {summary.peakDay.formattedDuration}
          </div>
        </div>
      </div>

      {/* Main Recharts 30-Day Line Chart Canvas */}
      <div
        className="p-4 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-3"
        data-testid="focus-history-line-chart-container"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <span className="text-emerald-400 font-semibold">
              Daily Focus Minutes (m)
            </span>
            {showRollingAverage && (
              <>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span className="text-sky-300">
                  - - 7-Day Rolling Average (m)
                </span>
              </>
            )}
            {showTargetLine && (
              <>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span className="text-amber-300">
                  - - Daily Target ({dailyTargetMinutes}m)
                </span>
              </>
            )}
          </div>
          <div
            className="font-mono text-[11px] text-zinc-400 tabular-nums"
            data-testid="focus-history-today-summary-badge"
          >
            Today ({summary.todayPoint.shortDateLabel}):{' '}
            <strong className="text-emerald-400">
              {summary.todayPoint.formattedDuration}
            </strong>
          </div>
        </div>

        <div className="h-80 w-full" data-testid="focus-history-recharts-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={summary.points}
              margin={{ top: 12, right: 18, left: 0, bottom: 8 }}
              onClick={(state) => {
                if (
                  state &&
                  state.activeLabel &&
                  typeof state.activeLabel === 'string'
                ) {
                  const matched = summary.points.find(
                    (p) =>
                      p.shortDateLabel === state.activeLabel ||
                      p.dateKey === state.activeLabel
                  );
                  if (matched) {
                    setSelectedDateKey(matched.dateKey);
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
                dataKey="shortDateLabel"
                stroke="#71717A"
                tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#3F3F46' }}
                interval={3}
              />
              <YAxis
                stroke="#71717A"
                tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#3F3F46' }}
                unit="m"
                width={48}
              />
              <Tooltip content={<CustomFocusHistory30DayTooltip />} />
              {showTargetLine && (
                <ReferenceLine
                  y={dailyTargetMinutes}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Goal ${dailyTargetMinutes}m`,
                    position: 'insideTopRight',
                    fill: '#FCD34D',
                    fontSize: 10,
                  }}
                />
              )}
              {showRollingAverage && (
                <Line
                  type="monotone"
                  dataKey="rolling7DayAvgMinutes"
                  name="7-Day Rolling Avg"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#38BDF8',
                    stroke: '#050507',
                    strokeWidth: 1.5,
                  }}
                  isAnimationActive={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="focusMinutes"
                name="Daily Focus Minutes"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Day Inspector & Quick Daily Focus Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left 7 Cols: Recent 7-Day Strip + Inspected Day Details */}
        <div className="lg:col-span-7 p-4 rounded-lg bg-[#050507] border border-zinc-800/80 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Inspect Daily Focus Log (Click Any Day)</span>
            </div>
            <span
              className="text-[11px] font-mono text-zinc-400 tabular-nums"
              data-testid="focus-history-inspected-date-label"
            >
              Selected: {inspectedPoint.weekdayShort},{' '}
              {inspectedPoint.shortDateLabel} ({inspectedPoint.dateKey})
            </span>
          </div>

          {/* Quick Day Selector Strip (Last 10 Days of the 30-Day Window) */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {summary.points.slice(-10).map((pt) => {
              const isSelected = pt.dateKey === inspectedPoint.dateKey;
              return (
                <button
                  key={pt.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(pt.dateKey)}
                  data-testid={`focus-history-day-btn-${pt.dateKey}`}
                  className={`p-1.5 rounded border text-center font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-[#0A0A0C] border-zinc-800/90 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-[10px] truncate">{pt.compactTickLabel}</div>
                  <div
                    className={`text-xs font-bold tabular-nums ${
                      pt.goalMet ? 'text-emerald-400' : 'text-zinc-200'
                    }`}
                  >
                    {pt.focusMinutes}m
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inspected Day Detail Row */}
          <div
            className="p-3 rounded-md bg-[#0A0A0C] border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs"
            data-testid="focus-history-inspected-day-summary"
          >
            <div className="space-y-0.5 min-w-0">
              <div className="font-mono text-zinc-300 truncate">
                <strong className="text-white">
                  {inspectedPoint.shortDateLabel}
                </strong>{' '}
                · {inspectedPoint.topRoomCode} · {inspectedPoint.topTopic}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
                {inspectedPoint.sessionsCount}{' '}
                {inspectedPoint.sessionsCount === 1 ? 'session' : 'sessions'} ·
                7d rolling avg: {inspectedPoint.rolling7DayAvgMinutes}m/day
              </div>
            </div>
            <div className="text-right font-mono tabular-nums shrink-0">
              <div className="text-sm font-bold text-emerald-400">
                {inspectedPoint.formattedDuration}
              </div>
              <div className="text-[11px] text-zinc-400">
                {inspectedPoint.goalCompletionPercent}% of {dailyTargetMinutes}m goal
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Verified 30-Day History Inspector */}
        <div
          className="lg:col-span-5 p-4 rounded-lg bg-[#050507] border border-zinc-800/80 flex flex-col justify-between space-y-3"
          data-testid="focus-history-log-form"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white whitespace-nowrap">
              30-Day Verified Ledger
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Total: {summary.total30DayFocusMinutes}m
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Daily focus totals are recorded strictly from verified Study Room timer sessions. Select any date below to inspect its verified study duration.
          </p>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900">
            <label
              htmlFor="focus-history-date-select"
              className="text-[11px] font-mono text-zinc-300"
            >
              Inspect Date (Past 30d):
            </label>
            <select
              id="focus-history-date-select"
              value={selectedDateKey}
              onChange={(e) => setSelectedDateKey(e.target.value)}
              data-testid="focus-history-date-select"
              className="px-2.5 py-1 text-xs font-mono bg-[#0A0A0C] border border-zinc-800 rounded text-white"
            >
              {summary.points
                .slice()
                .reverse()
                .map((pt) => (
                  <option key={pt.dateKey} value={pt.dateKey}>
                    {pt.shortDateLabel} ({pt.focusMinutes}m)
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
};
