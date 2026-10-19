import React, { useMemo, useState } from 'react';
import { Trophy, Flame, Award, Users } from 'lucide-react';
import {
  LeaderboardCandidate,
  LeaderboardSortBy,
  RankedLeaderboardEntry,
  aggregateGlobalLeaderboard,
} from '../utils/rules';

interface GlobalLeaderboardProps {
  currentUid: string;
  firestoreProfiles: LeaderboardCandidate[];
  serverPlatformUsers: LeaderboardCandidate[];
  onlinePeers: LeaderboardCandidate[];
  currentUserCandidate: LeaderboardCandidate;
  acceptedPeerUids: Set<string>;
  pendingPeerUids: Set<string>;
  onSendInviteFromLeaderboard: (entry: RankedLeaderboardEntry) => void;
  onOpenChatWithPeer: (peerUid: string) => void;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  currentUid,
  firestoreProfiles,
  serverPlatformUsers,
  onlinePeers,
  currentUserCandidate,
  acceptedPeerUids,
  pendingPeerUids,
  onSendInviteFromLeaderboard,
  onOpenChatWithPeer,
}) => {
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>('combined');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const rankedEntries = useMemo(() => {
    return aggregateGlobalLeaderboard(
      [firestoreProfiles, serverPlatformUsers, onlinePeers, [currentUserCandidate]],
      sortBy,
      50
    );
  }, [firestoreProfiles, serverPlatformUsers, onlinePeers, currentUserCandidate, sortBy]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rankedEntries.filter((entry) => {
      if (scopeFilter === 'online' && !entry.isOnline) return false;
      if (!q) return true;
      return (
        entry.displayName.toLowerCase().includes(q) ||
        entry.bio.toLowerCase().includes(q) ||
        entry.currentMode.toLowerCase().includes(q)
      );
    });
  }, [rankedEntries, scopeFilter, searchQuery]);

  const myRankedEntry = useMemo(
    () => rankedEntries.find((e) => e.uid === currentUid) || null,
    [rankedEntries, currentUid]
  );

  const topPointsScore = useMemo(
    () =>
      rankedEntries.reduce(
        (max, item) => Math.max(max, item.participationPoints),
        currentUserCandidate.participationPoints
      ),
    [rankedEntries, currentUserCandidate.participationPoints]
  );

  const topStreakDays = useMemo(
    () =>
      rankedEntries.reduce(
        (max, item) => Math.max(max, item.streakCount),
        currentUserCandidate.streakCount
      ),
    [rankedEntries, currentUserCandidate.streakCount]
  );

  return (
    <section
      className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-5"
      aria-label="Global Leaderboard"
      data-testid="global-leaderboard-card"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 className="text-lg font-bold text-white">Global Leaderboard</h2>
            <span className="text-xs text-zinc-500">·</span>
            <span
              className="text-xs font-mono tabular-nums text-emerald-400"
              data-testid="leaderboard-total-users"
            >
              {rankedEntries.length} {rankedEntries.length === 1 ? 'Member' : 'Members'} Ranked
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Platform-wide standings aggregated across real accounts by{' '}
            <span className="font-mono text-zinc-300">participationPoints</span> and{' '}
            <span className="font-mono text-zinc-300">streakCount</span>.
          </p>
        </div>

        {/* Sort Mode & Scope Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div
            className="flex flex-wrap rounded-md border border-zinc-800 bg-[#050505] p-1 gap-1"
            role="group"
            aria-label="Leaderboard sort criteria"
          >
            <button
              type="button"
              onClick={() => setSortBy('combined')}
              data-testid="leaderboard-sort-combined"
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                sortBy === 'combined'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Combined Rank
            </button>
            <button
              type="button"
              onClick={() => setSortBy('points')}
              data-testid="leaderboard-sort-points"
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                sortBy === 'points'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Top Participation
            </button>
            <button
              type="button"
              onClick={() => setSortBy('streak')}
              data-testid="leaderboard-sort-streak"
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                sortBy === 'streak'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Longest Streak
            </button>
          </div>

          <div
            className="flex flex-wrap rounded-md border border-zinc-800 bg-[#050505] p-1 gap-1"
            role="group"
            aria-label="Leaderboard presence filter"
          >
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                scopeFilter === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Platform
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('online')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                scopeFilter === 'online'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Online Now
            </button>
          </div>
        </div>
      </div>

      {/* Platform-Wide KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] text-zinc-400">Your Platform Standing</div>
            <div
              className="text-base font-bold font-mono tabular-nums text-white"
              data-testid="leaderboard-your-rank"
            >
              #{myRankedEntry ? myRankedEntry.rank : 1} of {rankedEntries.length}
            </div>
          </div>
          <div className="text-right font-mono tabular-nums text-xs text-zinc-400">
            <div>{currentUserCandidate.participationPoints} pts</div>
            <div className="text-amber-400">{currentUserCandidate.streakCount}d streak</div>
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] text-zinc-400">Highest Participation Score</div>
            <div
              className="text-base font-bold font-mono tabular-nums text-emerald-400"
              data-testid="leaderboard-top-points"
            >
              {topPointsScore} pts
            </div>
          </div>
          <Award className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>

        <div className="p-3.5 rounded-md border border-zinc-800/80 bg-[#050505] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] text-zinc-400">Longest Active Streak</div>
            <div
              className="text-base font-bold font-mono tabular-nums text-amber-400"
              data-testid="leaderboard-top-streak"
            >
              {topStreakDays} {topStreakDays === 1 ? 'Day' : 'Days'}
            </div>
          </div>
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
        </div>
      </div>

      {/* Search & Formula Explainer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <Users className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter leaderboard by member name or mode..."
            aria-label="Filter leaderboard by member name"
            className="w-full px-3 py-1.5 text-xs bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div className="text-[11px] font-mono text-zinc-500">
          Rank Index = participationPoints + (streakCount × 25)
        </div>
      </div>

      {/* Leaderboard Standings Table */}
      <div className="overflow-x-auto border border-zinc-800/80 rounded-md bg-[#050505]">
        <table className="w-full text-left border-collapse" data-testid="global-leaderboard-table">
          <thead>
            <tr className="border-b border-zinc-800/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 bg-[#0A0A0C]">
              <th className="py-2.5 px-4 w-16">Rank</th>
              <th className="py-2.5 px-4">Member</th>
              <th className="py-2.5 px-4">Status / Mode</th>
              <th className="py-2.5 px-4 text-right">Streak</th>
              <th className="py-2.5 px-4 text-right">Participation</th>
              <th className="py-2.5 px-4 text-right">Rank Index</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-xs">
            {filteredEntries.map((entry) => {
              const isMe = entry.uid === currentUid;
              const isAccepted = acceptedPeerUids.has(entry.uid);
              const isPending = pendingPeerUids.has(entry.uid);

              return (
                <tr
                  key={entry.uid}
                  data-testid={`leaderboard-row-${entry.rank}`}
                  className={
                    isMe
                      ? 'bg-zinc-900/60'
                      : 'hover:bg-zinc-900/30 transition-colors'
                  }
                >
                  <td className="py-3 px-4 font-mono tabular-nums font-bold">
                    <span
                      className={
                        entry.rank === 1
                          ? 'text-amber-400'
                          : entry.rank === 2
                          ? 'text-zinc-200'
                          : entry.rank === 3
                          ? 'text-amber-600'
                          : 'text-zinc-500'
                      }
                    >
                      #{entry.rank}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-white truncate max-w-[200px]">
                      {entry.displayName}{' '}
                      {isMe && (
                        <span className="text-[11px] font-mono font-normal text-emerald-400">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate max-w-[240px]">
                      {entry.bio}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono">
                    {entry.isOnline ? (
                      <span className="text-emerald-400">
                        Online · {entry.currentMode.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-zinc-500">Offline</span>
                    )}
                  </td>

                  <td
                    className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-amber-400"
                    data-testid={isMe ? 'leaderboard-my-streak' : undefined}
                  >
                    {entry.streakCount} {entry.streakCount === 1 ? 'Day' : 'Days'}
                  </td>

                  <td
                    className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-400"
                    data-testid={isMe ? 'leaderboard-my-points' : undefined}
                  >
                    {entry.participationPoints} pts
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-white">
                    {entry.compositeScore}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {isMe ? (
                      <span className="text-[11px] font-mono text-zinc-500">Active Session</span>
                    ) : isAccepted ? (
                      <button
                        type="button"
                        onClick={() => onOpenChatWithPeer(entry.uid)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                      >
                        Message
                      </button>
                    ) : isPending ? (
                      <span className="text-[11px] font-mono text-amber-400">Invite Sent</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSendInviteFromLeaderboard(entry)}
                        className="px-2.5 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded whitespace-nowrap shrink-0"
                      >
                        Send Invite
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 px-4 text-center text-xs text-zinc-500">
                  No members match your current leaderboard filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
