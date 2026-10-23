import React, { useState } from 'react';
import {
  Flame,
  Target,
  BookOpen,
  Award,
  CheckCircle2,
  Lock,
  Plus,
  Sparkles,
  Snowflake,
  ShieldAlert,
} from 'lucide-react';
import {
  BadgeId,
  EvaluatedUserBadge,
  StreakFreezeStatusSummary,
  UserBadgeEvaluationSummary,
} from '../utils/rules';

export interface AchievementBadgeChipProps {
  badge: EvaluatedUserBadge;
  compact?: boolean;
  showProgressWhenLocked?: boolean;
  testId?: string;
}

export const AchievementBadgeIcon: React.FC<{
  badgeId: BadgeId;
  unlocked: boolean;
  className?: string;
}> = ({ badgeId, unlocked, className = 'w-3.5 h-3.5 shrink-0' }) => {
  const colorClass = !unlocked
    ? 'text-zinc-500'
    : badgeId === 'streak_5_day'
    ? 'text-amber-400'
    : badgeId === 'goal_3_day'
    ? 'text-emerald-400'
    : 'text-sky-400';

  if (badgeId === 'streak_5_day') {
    return <Flame className={`${className} ${colorClass}`} aria-hidden="true" />;
  }
  if (badgeId === 'goal_3_day') {
    return <Target className={`${className} ${colorClass}`} aria-hidden="true" />;
  }
  return <BookOpen className={`${className} ${colorClass}`} aria-hidden="true" />;
};

export const AchievementBadgeChip: React.FC<AchievementBadgeChipProps> = ({
  badge,
  compact = false,
  showProgressWhenLocked = false,
  testId,
}) => {
  if (!badge.unlocked && !showProgressWhenLocked) {
    return null;
  }

  const toneClasses = !badge.unlocked
    ? 'border-zinc-800 bg-[#050505] text-zinc-500'
    : badge.tone === 'amber'
    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
    : badge.tone === 'emerald'
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    : 'border-sky-500/40 bg-sky-500/10 text-sky-300';

  return (
    <span
      data-testid={testId || `achievement-badge-${badge.id}`}
      data-badge-id={badge.id}
      data-unlocked={badge.unlocked ? 'true' : 'false'}
      title={`${badge.title}: ${badge.description} (${badge.statusLabel})`}
      aria-label={`${badge.title} badge — ${badge.unlocked ? 'Unlocked' : 'Locked'}: ${badge.statusLabel}`}
      className={`inline-flex items-center gap-1 rounded border font-mono font-semibold whitespace-nowrap shrink-0 ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      } ${toneClasses}`}
    >
      <AchievementBadgeIcon
        badgeId={badge.id}
        unlocked={badge.unlocked}
        className={compact ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'}
      />
      <span>{badge.shortLabel}</span>
      {!badge.unlocked && showProgressWhenLocked && (
        <span className="text-[10px] opacity-80">
          ({badge.currentValue}/{badge.targetValue})
        </span>
      )}
    </span>
  );
};

interface UserProfileBadgesCardProps {
  displayName: string;
  email: string;
  bio: string;
  streakCount: number;
  participationPoints: number;
  badgeSummary: UserBadgeEvaluationSummary;
  streakFreezeStatus: StreakFreezeStatusSummary;
  onAdvanceStreak: (targetStreakDays?: number) => void;
  onRecordConsecutiveGoalDay: (daysToEnsure?: number) => void;
  onContributeHelpfulNote: (subject: string, noteText: string) => {
    valid: boolean;
    error: string;
  };
  onPurchaseStreakFreeze: () => {
    success: boolean;
    message: string;
    error: string;
  };
  onRescueMissedDayWithFreeze: () => {
    success: boolean;
    message: string;
    error: string;
  };
  onSimulateMissedDay: () => {
    preservedByEquippedFreeze: boolean;
    message: string;
  };
  onOpenStudyRoom: () => void;
}

export const UserProfileBadgesCard: React.FC<UserProfileBadgesCardProps> = ({
  displayName,
  email,
  bio,
  streakCount,
  participationPoints,
  badgeSummary,
  streakFreezeStatus,
  onAdvanceStreak,
  onRecordConsecutiveGoalDay,
  onContributeHelpfulNote,
  onPurchaseStreakFreeze,
  onRescueMissedDayWithFreeze,
  onSimulateMissedDay,
  onOpenStudyRoom,
}) => {
  const [noteSubject, setNoteSubject] = useState('Distributed Systems & Focus');
  const [noteText, setNoteText] = useState('');
  const [noteFeedback, setNoteFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showNoteComposer, setShowNoteComposer] = useState(false);

  const handleNoteFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onContributeHelpfulNote(noteSubject, noteText);
    if (!res.valid) {
      setNoteFeedback({ type: 'error', message: res.error });
      return;
    }
    setNoteText('');
    setNoteFeedback({
      type: 'success',
      message: 'Helpful study note contributed! Helpful Notes achievement unlocked.',
    });
    setShowNoteComposer(false);
  };

  const handleQuickHelpfulNote = () => {
    const res = onContributeHelpfulNote(
      'Deep Work & Consensus Notes',
      'Key takeaway: Raft leader election guarantees safety via up-to-date log term comparisons during RequestVote RPCs.'
    );
    if (res.valid) {
      setNoteFeedback({
        type: 'success',
        message: 'Helpful study note contributed to Study Room! Achievement updated.',
      });
    }
  };

  const handleBuyFreezeClick = () => {
    const res = onPurchaseStreakFreeze();
    if (!res.success) {
      setNoteFeedback({ type: 'error', message: res.error });
    } else {
      setNoteFeedback({ type: 'success', message: res.message });
    }
  };

  const handleRescueFreezeClick = () => {
    const res = onRescueMissedDayWithFreeze();
    if (!res.success) {
      setNoteFeedback({ type: 'error', message: res.error });
    } else {
      setNoteFeedback({ type: 'success', message: res.message });
    }
  };

  const handleSimulateMissedDayClick = () => {
    const res = onSimulateMissedDay();
    setNoteFeedback({
      type: res.preservedByEquippedFreeze ? 'success' : 'error',
      message: res.message,
    });
  };

  return (
    <section
      className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-5"
      aria-label="User Profile and Achievement Badges"
      data-testid="user-profile-badges-card"
    >
      {/* Top Profile Identity & Earned Badges Summary Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 className="text-lg font-bold text-white">
              Profile & Achievement Badges
            </h2>
            <span className="text-xs text-zinc-500">·</span>
            <span
              className="text-xs font-mono font-semibold text-emerald-400 tabular-nums"
              data-testid="profile-badges-unlocked-count"
            >
              {badgeSummary.unlockedCount} / {badgeSummary.totalBadgesCount} Badges Unlocked (
              {badgeSummary.completionPercent}%)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
            <span className="font-semibold text-white">{displayName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-zinc-400">{email}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-md">{bio}</span>
          </div>
        </div>

        {/* Earned Badge Chips Display on Profile Header */}
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="profile-earned-badges-strip"
        >
          {badgeSummary.badges.map((badge) => (
            <AchievementBadgeChip
              key={badge.id}
              badge={badge}
              showProgressWhenLocked={true}
              testId={`profile-badge-chip-${badge.id}`}
            />
          ))}
        </div>
      </div>

      {/* Achievement & Streak Freeze Feedback Banner */}
      {noteFeedback && (
        <div
          role="status"
          data-testid="profile-badge-feedback-banner"
          className={`p-3 rounded-md border text-xs flex items-center justify-between gap-3 ${
            noteFeedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}
        >
          <span>{noteFeedback.message}</span>
          <button
            type="button"
            onClick={() => setNoteFeedback(null)}
            className="text-[11px] font-mono underline underline-offset-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Streak Freeze Protection Panel (Spend Participation Points to Preserve Streak on Missed Days) */}
      <div
        data-testid="streak-freeze-panel"
        className={`p-4 rounded-md border transition-colors ${
          streakFreezeStatus.isStreakAtRisk
            ? 'border-amber-500/50 bg-[#0D0E12]'
            : streakFreezeStatus.isProtected
            ? 'border-sky-500/40 bg-[#0D0E12]'
            : 'border-zinc-800/80 bg-[#050505]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {streakFreezeStatus.isStreakAtRisk ? (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Snowflake
                  className={`w-4 h-4 shrink-0 ${
                    streakFreezeStatus.isProtected ? 'text-sky-400' : 'text-zinc-400'
                  }`}
                />
              )}
              <h3 className="text-sm font-bold text-white">
                Streak Freeze Protection
              </h3>
              <span className="text-xs text-zinc-500">·</span>
              <span
                data-testid="streak-freeze-headline"
                className={`text-xs font-mono font-semibold tabular-nums ${
                  streakFreezeStatus.isStreakAtRisk
                    ? 'text-amber-400'
                    : streakFreezeStatus.isProtected
                    ? 'text-sky-400'
                    : 'text-zinc-400'
                }`}
              >
                {streakFreezeStatus.protectionHeadline}
              </span>
            </div>

            <p
              data-testid="streak-freeze-subtext"
              className="text-xs text-zinc-400 leading-relaxed"
            >
              {streakFreezeStatus.protectionSubtext}
            </p>

            {/* Frozen Dates & Points Summary */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] font-mono text-zinc-400 tabular-nums">
              <span data-testid="streak-freeze-owned-count">
                Equipped Freezes:{' '}
                <strong className="text-sky-400">
                  {streakFreezeStatus.streakFreezesOwned}/{streakFreezeStatus.maxFreezes}
                </strong>
              </span>
              <span>·</span>
              <span>
                Freeze Cost:{' '}
                <strong className="text-white">{streakFreezeStatus.costPoints} pts</strong>
              </span>
              <span>·</span>
              <span data-testid="streak-freeze-available-points">
                Available Balance:{' '}
                <strong className="text-emerald-400">{participationPoints} pts</strong>
              </span>
              {streakFreezeStatus.frozenDates.length > 0 && (
                <>
                  <span>·</span>
                  <span data-testid="streak-freeze-frozen-dates">
                    Preserved Days:{' '}
                    <strong className="text-sky-300">
                      {streakFreezeStatus.frozenDates.join(', ')}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Streak Freeze Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {streakFreezeStatus.isStreakAtRisk && (
              <button
                type="button"
                onClick={handleRescueFreezeClick}
                disabled={!streakFreezeStatus.canRescueMissedDay}
                data-testid="rescue-streak-freeze-btn"
                className="px-3 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black rounded transition-colors whitespace-nowrap shrink-0"
              >
                {streakFreezeStatus.streakFreezesOwned > 0
                  ? `Use Equipped Freeze (Restore ${streakFreezeStatus.streakAtRiskCount}d Streak)`
                  : `Freeze Missed Day & Restore ${streakFreezeStatus.streakAtRiskCount}d Streak (${streakFreezeStatus.costPoints} pts)`}
              </button>
            )}

            <button
              type="button"
              onClick={handleBuyFreezeClick}
              disabled={!streakFreezeStatus.canPurchaseFreeze}
              data-testid="buy-streak-freeze-btn"
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 disabled:opacity-40 text-black rounded transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Snowflake className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>
                {streakFreezeStatus.isAtMaxCapacity
                  ? `Max Freezes (${streakFreezeStatus.maxFreezes}/${streakFreezeStatus.maxFreezes})`
                  : `Buy Streak Freeze (${streakFreezeStatus.costPoints} pts)`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSimulateMissedDayClick}
              data-testid="simulate-missed-day-btn"
              title="Test what happens to your login & productivity streak when you miss a day"
              className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded transition-colors whitespace-nowrap shrink-0"
            >
              Simulate Missed Day
            </button>
          </div>
        </div>
      </div>

      {/* 3 Achievement Cards Grid: 5-Day Streak, 3-Day Goal Hit, Helpful Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {badgeSummary.badges.map((badge) => {
          const isUnlocked = badge.unlocked;
          const borderClass = isUnlocked
            ? badge.tone === 'amber'
              ? 'border-amber-500/50 bg-[#0D0E12]'
              : badge.tone === 'emerald'
              ? 'border-emerald-500/50 bg-[#0D0E12]'
              : 'border-sky-500/50 bg-[#0D0E12]'
            : 'border-zinc-800/80 bg-[#050505]';

          const barColor =
            badge.tone === 'amber'
              ? 'bg-amber-400'
              : badge.tone === 'emerald'
              ? 'bg-emerald-400'
              : 'bg-sky-400';

          return (
            <div
              key={badge.id}
              data-testid={`profile-badge-card-${badge.id}`}
              data-unlocked={isUnlocked ? 'true' : 'false'}
              className={`p-4 rounded-md border flex flex-col justify-between gap-4 transition-colors ${borderClass}`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-md border flex items-center justify-center shrink-0 ${
                        isUnlocked
                          ? badge.tone === 'amber'
                            ? 'border-amber-500/40 bg-amber-500/15'
                            : badge.tone === 'emerald'
                            ? 'border-emerald-500/40 bg-emerald-500/15'
                            : 'border-sky-500/40 bg-sky-500/15'
                          : 'border-zinc-800 bg-[#0A0A0C]'
                      }`}
                    >
                      <AchievementBadgeIcon
                        badgeId={badge.id}
                        unlocked={isUnlocked}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">
                        {badge.title}
                      </h3>
                      <div className="text-[11px] font-mono text-zinc-400">
                        +{badge.pointsReward} pts reward
                      </div>
                    </div>
                  </div>

                  <span
                    data-testid={`profile-badge-status-${badge.id}`}
                    className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 ${
                      isUnlocked ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Unlocked</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span>Locked</span>
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Progress Bar & Action Controls */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span
                    className="text-zinc-300"
                    data-testid={`profile-badge-progress-text-${badge.id}`}
                  >
                    {badge.statusLabel}
                  </span>
                  <span
                    className={
                      isUnlocked ? 'text-emerald-400 font-bold' : 'text-zinc-400 font-bold'
                    }
                  >
                    {badge.progressPercent}%
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-label={`${badge.title} achievement progress`}
                  aria-valuenow={badge.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full h-2 bg-[#0A0A0C] border border-zinc-800 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full transition-all duration-200 ${barColor}`}
                    style={{ width: `${badge.progressPercent}%` }}
                  />
                </div>

                {/* Action button per badge so users can earn or advance achievements */}
                {badge.id === 'streak_5_day' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onAdvanceStreak()}
                      data-testid="badge-action-advance-streak"
                      className="flex-1 py-1.5 px-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded transition-colors whitespace-nowrap"
                    >
                      Check In (+1 Day Streak)
                    </button>
                    {!isUnlocked && (
                      <button
                        type="button"
                        onClick={() => onAdvanceStreak(5)}
                        data-testid="badge-action-complete-5d-streak"
                        className="py-1.5 px-2.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded transition-colors whitespace-nowrap"
                      >
                        Reach 5-Day Streak
                      </button>
                    )}
                  </div>
                )}

                {badge.id === 'goal_3_day' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onRecordConsecutiveGoalDay()}
                      data-testid="badge-action-log-goal-day"
                      className="flex-1 py-1.5 px-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded transition-colors whitespace-nowrap"
                    >
                      Log Daily Goal Hit (+1d)
                    </button>
                    {!isUnlocked && (
                      <button
                        type="button"
                        onClick={() => onRecordConsecutiveGoalDay(3)}
                        data-testid="badge-action-complete-3d-goal"
                        className="py-1.5 px-2.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded transition-colors whitespace-nowrap"
                      >
                        Hit 3-Day Goal Streak
                      </button>
                    )}
                  </div>
                )}

                {badge.id === 'helpful_notes' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNoteComposer((prev) => !prev)}
                      data-testid="badge-action-toggle-note-composer"
                      className="flex-1 py-1.5 px-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>Write Helpful Note</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickHelpfulNote}
                      data-testid="badge-action-quick-helpful-note"
                      className="py-1.5 px-2.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded transition-colors whitespace-nowrap"
                    >
                      +1 Helpful Note
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Helpful Study Note Composer (when expanded) */}
      {showNoteComposer && (
        <form
          onSubmit={handleNoteFormSubmit}
          data-testid="profile-helpful-note-form"
          className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Contribute a Helpful Study Note to Unlock Achievement</span>
            </div>
            <button
              type="button"
              onClick={onOpenStudyRoom}
              className="text-xs font-mono text-sky-400 hover:underline whitespace-nowrap"
            >
              Open Full Study Room →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="profile-note-subject"
                className="block text-[11px] font-mono text-zinc-400"
              >
                Study Topic / Subject
              </label>
              <input
                id="profile-note-subject"
                type="text"
                value={noteSubject}
                onChange={(e) => setNoteSubject(e.target.value)}
                placeholder="e.g., Distributed Consensus"
                data-testid="profile-helpful-note-subject-input"
                className="w-full px-3 py-1.5 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label
                htmlFor="profile-note-content"
                className="block text-[11px] font-mono text-zinc-400"
              >
                Helpful Study Note / Key Takeaway
              </label>
              <div className="flex gap-2">
                <input
                  id="profile-note-content"
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Share a helpful formula, summary, or study insight..."
                  data-testid="profile-helpful-note-text-input"
                  className="flex-1 px-3 py-1.5 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white"
                />
                <button
                  type="submit"
                  data-testid="profile-helpful-note-submit-btn"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                >
                  Publish Note
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Footer Summary of Current Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono text-zinc-400">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Active Streak: <strong className="text-amber-400">{streakCount}d</strong>
          </span>
          <span>·</span>
          <span>
            Streak Freezes:{' '}
            <strong className="text-sky-400">
              {streakFreezeStatus.streakFreezesOwned}/{streakFreezeStatus.maxFreezes}
            </strong>
          </span>
          <span>·</span>
          <span>
            Consecutive Goal Days:{' '}
            <strong className="text-emerald-400">
              {badgeSummary.consecutiveGoalDays}d in a row
            </strong>
          </span>
          <span>·</span>
          <span>
            Helpful Notes Contributed:{' '}
            <strong className="text-sky-400">{badgeSummary.helpfulNotesCount}</strong>
          </span>
        </div>
        <div>
          Total Participation:{' '}
          <strong className="text-white">{participationPoints} pts</strong>
        </div>
      </div>
    </section>
  );
};
