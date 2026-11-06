import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
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
  detectNewlyUnlockedBadgeIds,
  getBadgeEntranceMotionSpec,
} from '../utils/rules';

export interface AchievementBadgeChipProps {
  badge: EvaluatedUserBadge;
  index?: number;
  previouslyUnlockedIds?: readonly BadgeId[] | null;
  newlyUnlockedOverride?: boolean;
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
  index = 0,
  previouslyUnlockedIds = null,
  newlyUnlockedOverride,
  compact = false,
  showProgressWhenLocked = false,
  testId,
}) => {
  if (!badge.unlocked && !showProgressWhenLocked) {
    return null;
  }

  const motionSpec = getBadgeEntranceMotionSpec({
    badgeId: badge.id,
    index,
    unlocked: badge.unlocked,
    previouslyUnlockedIds,
    newlyUnlockedOverride,
  });

  const toneClasses = !badge.unlocked
    ? 'border-zinc-800/80 bg-transparent text-zinc-500'
    : 'border-zinc-700/80 bg-zinc-900/70 text-zinc-200';

  return (
    <motion.span
      key={motionSpec.motionKey}
      initial={motionSpec.initial}
      animate={motionSpec.animate}
      transition={motionSpec.transition}
      data-testid={testId || `achievement-badge-${badge.id}`}
      data-badge-id={badge.id}
      data-unlocked={badge.unlocked ? 'true' : 'false'}
      data-motion-mode={motionSpec.animationMode}
      data-motion-key={motionSpec.motionKey}
      title={`${badge.title}: ${badge.description} (${badge.statusLabel})`}
      aria-label={`${badge.title} badge — ${badge.unlocked ? 'Unlocked' : 'Locked'}: ${badge.statusLabel}`}
      className={`inline-flex items-center gap-1 rounded border font-mono font-medium whitespace-nowrap shrink-0 origin-center ${
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
    </motion.span>
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

  const prevUnlockedIdsRef = useRef<BadgeId[]>(
    badgeSummary.badges.filter((b) => b.unlocked).map((b) => b.id)
  );
  const [newlyUnlockedBadgeIds, setNewlyUnlockedBadgeIds] = useState<BadgeId[]>([]);

  useEffect(() => {
    const freshlyUnlocked = detectNewlyUnlockedBadgeIds(
      prevUnlockedIdsRef.current,
      badgeSummary.badges
    );
    if (freshlyUnlocked.length > 0) {
      setNewlyUnlockedBadgeIds((prev) =>
        Array.from(new Set([...prev, ...freshlyUnlocked]))
      );
    }
    prevUnlockedIdsRef.current = badgeSummary.badges
      .filter((b) => b.unlocked)
      .map((b) => b.id);
  }, [badgeSummary.badges]);

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
      className="tactile-editorial-surface rounded-md border border-zinc-800/80 bg-[#0A0A0C] divide-y divide-zinc-800/80"
      aria-label="User Profile and Achievement Badges"
      data-testid="user-profile-badges-card"
    >
      {/* Top Profile Identity & Earned Milestones Row */}
      <div className="p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Profile &amp; Achievement Milestones
            </h2>
            <span className="text-xs text-zinc-500" aria-hidden="true">
              ·
            </span>
            <span
              className="text-xs font-mono font-medium text-zinc-300 tabular-nums"
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
          className="flex flex-wrap items-center gap-1.5"
          data-testid="profile-earned-badges-strip"
        >
          {badgeSummary.badges.map((badge, index) => (
            <AchievementBadgeChip
              key={`${badge.id}-${badge.unlocked ? 'unlocked' : 'locked'}`}
              badge={badge}
              index={index}
              newlyUnlockedOverride={
                badge.unlocked && newlyUnlockedBadgeIds.includes(badge.id)
              }
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
          className={`px-5 py-3 text-xs flex items-center justify-between gap-3 ${
            noteFeedback.type === 'success'
              ? 'bg-emerald-950/20 text-emerald-200'
              : 'bg-rose-950/20 text-rose-200'
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

      {/* Streak Freeze Protection Ledger Row */}
      <div
        data-testid="streak-freeze-panel"
        className="p-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-semibold text-white">
              Streak Freeze Protection
            </h3>
            <span className="text-xs text-zinc-500" aria-hidden="true">
              ·
            </span>
            <span
              data-testid="streak-freeze-headline"
              className="text-xs font-mono text-zinc-300 tabular-nums"
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

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] font-mono text-zinc-400 tabular-nums">
            <span data-testid="streak-freeze-owned-count">
              Equipped Freezes:{' '}
              <strong className="text-white">
                {streakFreezeStatus.streakFreezesOwned}/{streakFreezeStatus.maxFreezes}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Freeze Cost:{' '}
              <strong className="text-white">{streakFreezeStatus.costPoints} pts</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span data-testid="streak-freeze-available-points">
              Available Balance:{' '}
              <strong className="text-white">{participationPoints} pts</strong>
            </span>
            {streakFreezeStatus.frozenDates.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span data-testid="streak-freeze-frozen-dates">
                  Preserved Days:{' '}
                  <strong className="text-zinc-200">
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
            className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded transition-colors whitespace-nowrap shrink-0"
          >
            Simulate Missed Day
          </button>
        </div>
      </div>

      {/* 3 Achievement Columns Divided by Hairlines (Single-Elevation Structure) */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800/80">
        {badgeSummary.badges.map((badge, index) => {
          const isUnlocked = badge.unlocked;
          const isNewlyUnlocked =
            isUnlocked && newlyUnlockedBadgeIds.includes(badge.id);
          const cardMotionSpec = getBadgeEntranceMotionSpec({
            badgeId: badge.id,
            index,
            unlocked: isUnlocked,
            newlyUnlockedOverride: isNewlyUnlocked,
          });

          return (
            <motion.div
              key={cardMotionSpec.motionKey}
              initial={cardMotionSpec.initial}
              animate={cardMotionSpec.animate}
              transition={cardMotionSpec.transition}
              data-testid={`profile-badge-card-${badge.id}`}
              data-unlocked={isUnlocked ? 'true' : 'false'}
              data-motion-mode={cardMotionSpec.animationMode}
              data-motion-key={cardMotionSpec.motionKey}
              className="p-5 flex flex-col justify-between gap-4 transition-colors origin-center"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <motion.div
                      initial={{ scale: isNewlyUnlocked ? 0.6 : 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: isNewlyUnlocked ? 440 : 350,
                        damping: 20,
                        delay: cardMotionSpec.transition.delay,
                      }}
                      data-testid={`profile-badge-icon-box-${badge.id}`}
                      className="w-7 h-7 rounded border border-zinc-800 bg-[#050505] flex items-center justify-center shrink-0"
                    >
                      <AchievementBadgeIcon
                        badgeId={badge.id}
                        unlocked={isUnlocked}
                        className="w-3.5 h-3.5"
                      />
                    </motion.div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {badge.title}
                      </h3>
                      <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
                        +{badge.pointsReward} pts reward
                      </div>
                    </div>
                  </div>

                  <span
                    data-testid={`profile-badge-status-${badge.id}`}
                    className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium whitespace-nowrap shrink-0 ${
                      isUnlocked ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{isNewlyUnlocked ? 'Newly Unlocked!' : 'Unlocked'}</span>
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
              <div className="space-y-2.5 pt-2.5 border-t border-zinc-800/70">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span
                    className="text-zinc-300"
                    data-testid={`profile-badge-progress-text-${badge.id}`}
                  >
                    {badge.statusLabel}
                  </span>
                  <span className="text-zinc-300 font-semibold">
                    {badge.progressPercent}%
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-label={`${badge.title} achievement progress`}
                  aria-valuenow={badge.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full transition-all duration-200 ${
                      isUnlocked ? 'bg-emerald-400' : 'bg-zinc-400'
                    }`}
                    style={{ width: `${badge.progressPercent}%` }}
                  />
                </div>

                {badge.id === 'streak_5_day' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onAdvanceStreak()}
                      data-testid="badge-action-advance-streak"
                      className="flex-1 py-1.5 px-2.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded transition-colors whitespace-nowrap"
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
                      className="flex-1 py-1.5 px-2.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded transition-colors whitespace-nowrap"
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
                      className="flex-1 py-1.5 px-2.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap"
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
            </motion.div>
          );
        })}
      </div>

      {/* Inline Helpful Study Note Composer (when expanded) */}
      {showNoteComposer && (
        <form
          onSubmit={handleNoteFormSubmit}
          data-testid="profile-helpful-note-form"
          className="p-5 bg-[#050505] space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-white">
              Contribute a Helpful Study Note to Unlock Achievement
            </div>
            <button
              type="button"
              onClick={onOpenStudyRoom}
              className="text-xs font-mono text-zinc-300 hover:text-white underline underline-offset-2 whitespace-nowrap"
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
      <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-400 tabular-nums">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            Active Streak: <strong className="text-white">{streakCount}d</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Streak Freezes:{' '}
            <strong className="text-white">
              {streakFreezeStatus.streakFreezesOwned}/{streakFreezeStatus.maxFreezes}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Consecutive Goal Days:{' '}
            <strong className="text-white">
              {badgeSummary.consecutiveGoalDays}d in a row
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Helpful Notes:{' '}
            <strong className="text-white">{badgeSummary.helpfulNotesCount}</strong>
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
