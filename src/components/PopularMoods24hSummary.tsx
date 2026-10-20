import React from 'react';
import {
  MoodPopularity24hSummary,
  OnlineMoodTone,
} from '../utils/rules';

interface PopularMoods24hSummaryProps {
  summary: MoodPopularity24hSummary;
  activeMoodFilter: string;
  onSelectMoodFilter: (mood: string) => void;
}

function getToneClasses(tone: OnlineMoodTone): {
  dot: string;
  fill: string;
  text: string;
} {
  switch (tone) {
    case 'emerald':
      return {
        dot: 'bg-emerald-400',
        fill: 'fill-emerald-400',
        text: 'text-emerald-400',
      };
    case 'amber':
      return {
        dot: 'bg-amber-400',
        fill: 'fill-amber-400',
        text: 'text-amber-400',
      };
    case 'violet':
      return {
        dot: 'bg-violet-400',
        fill: 'fill-violet-400',
        text: 'text-violet-400',
      };
    case 'sky':
      return {
        dot: 'bg-sky-400',
        fill: 'fill-sky-400',
        text: 'text-sky-400',
      };
    default:
      return {
        dot: 'bg-zinc-400',
        fill: 'fill-zinc-400',
        text: 'text-zinc-300',
      };
  }
}

export const PopularMoods24hSummary: React.FC<PopularMoods24hSummaryProps> = ({
  summary,
  activeMoodFilter,
  onSelectMoodFilter,
}) => {
  const displayedItems = summary.items.slice(0, 6);
  const topToneClasses = getToneClasses(summary.topMoodTone);

  return (
    <div
      className="p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 space-y-3"
      data-testid="online-directory-popular-moods-24h"
    >
      <div className="border-b border-zinc-800/70 pb-2.5 space-y-1">
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
              {summary.totalEvents24h} {summary.totalEvents24h === 1 ? 'check-in' : 'check-ins'}
            </span>
            <span aria-hidden="true" className="text-zinc-700">
              ·
            </span>
            <span data-testid="popular-moods-24h-peers">
              {summary.uniqueActivePeers24h}{' '}
              {summary.uniqueActivePeers24h === 1 ? 'active peer' : 'active peers'}
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
          Most popular moods used by active peers over the last 24 hours. Click a mood bar to filter peers.
        </p>
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
                  <span className={item.usageCount24h > 0 ? 'text-zinc-200 font-semibold' : 'text-zinc-500'}>
                    {item.usageCount24h} in 24h
                  </span>
                  <span aria-hidden="true" className="text-zinc-700">
                    ·
                  </span>
                  <span className={item.activePeersNow > 0 ? 'text-emerald-400' : 'text-zinc-500'}>
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
