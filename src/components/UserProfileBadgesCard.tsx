import React, { useEffect, useRef, useState } from 'react';
import {
  Flame,
  Target,
  BookOpen,
} from './ArchitecturalGlyphs';
import {
  BadgeId,
  EvaluatedUserBadge,
  StreakFreezeStatusSummary,
  UserBadgeEvaluationSummary,
  detectNewlyUnlockedBadgeIds,
  getBadgeEntranceMotionSpec,
  sanitizeEditorialUiCopy,
  compactMinimalUiText,
} from '../utils/rules';
import { CurvedSectionHeading } from './CurvedTextHeader';

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
}> = ({ badgeId, className = 'w-3.5 h-3.5 shrink-0' }) => {
  if (badgeId === 'streak_5_day') {
    return <Flame className={className} aria-hidden="true" />;
  }
  if (badgeId === 'goal_3_day') {
    return <Target className={className} aria-hidden="true" />;
  }
  return <BookOpen className={className} aria-hidden="true" />;
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
    ? 'border-zinc-800 bg-transparent text-zinc-500'
    : 'border-zinc-700 bg-zinc-900 text-zinc-200';

  const cleanStatusLabel = sanitizeEditorialUiCopy(badge.statusLabel);

  return (
    <span
      key={motionSpec.motionKey}
      data-testid={testId || `achievement-badge-${badge.id}`}
      data-badge-id={badge.id}
      data-unlocked={badge.unlocked ? 'true' : 'false'}
      data-motion-mode={motionSpec.animationMode}
      data-motion-key={motionSpec.motionKey}
      title={`${badge.title}: ${badge.description} (${cleanStatusLabel})`}
      aria-label={`${badge.title} badge : ${badge.unlocked ? 'Unlocked' : 'Locked'}: ${cleanStatusLabel}`}
      className={`inline-flex items-center gap-1 border font-mono font-medium whitespace-nowrap shrink-0 ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      } ${toneClasses}`}
    >
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
      setNoteFeedback({ type: 'error', message: sanitizeEditorialUiCopy(res.error) });
      return;
    }
    setNoteText('');
    setNoteFeedback({
      type: 'success',
      message: 'Helpful study note contributed. Helpful Notes achievement unlocked.',
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
        message: 'Helpful study note contributed to Study Room. Achievement updated.',
      });
    }
  };

  const handleBuyFreezeClick = () => {
    const res = onPurchaseStreakFreeze();
    if (!res.success) {
      setNoteFeedback({ type: 'error', message: sanitizeEditorialUiCopy(res.error) });
    } else {
      setNoteFeedback({ type: 'success', message: sanitizeEditorialUiCopy(res.message) });
    }
  };

  const handleRescueFreezeClick = () => {
    const res = onRescueMissedDayWithFreeze();
    if (!res.success) {
      setNoteFeedback({ type: 'error', message: sanitizeEditorialUiCopy(res.error) });
    } else {
      setNoteFeedback({ type: 'success', message: sanitizeEditorialUiCopy(res.message) });
    }
  };

  const handleSimulateMissedDayClick = () => {
    const res = onSimulateMissedDay();
    setNoteFeedback({
      type: res.preservedByEquippedFreeze ? 'success' : 'error',
      message: sanitizeEditorialUiCopy(res.message),
    });
  };

  return (
    <section
      className="tactile-editorial-surface border border-zinc-800 bg-[#121215] divide-y divide-zinc-800"
      aria-label="User Profile and Achievement Badges"
      data-testid="user-profile-badges-card"
    >
      {/* Top Profile Identity & Earned Milestones Row */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[220px]">
          <CurvedSectionHeading
            id="profile-milestones"
            title={`${displayName} / MILESTONES`}
          />
          <span
            className="text-xs font-mono font-medium text-zinc-400 tabular-nums"
            data-testid="profile-badges-unlocked-count"
          >
            {badgeSummary.unlockedCount}/{badgeSummary.totalBadgesCount} ({badgeSummary.completionPercent}%)
          </span>
        </div>

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
          className="px-4 py-2 text-xs flex items-center justify-between gap-3 bg-[#18181B] text-zinc-200"
        >
          <span>{compactMinimalUiText(noteFeedback.message, 5)}</span>
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
        className="p-4 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 tabular-nums">
          <span
            data-testid="streak-freeze-headline"
            className="font-semibold text-white"
          >
            {compactMinimalUiText(streakFreezeStatus.protectionHeadline, 3)}
          </span>
          <span data-testid="streak-freeze-subtext" className="sr-only">
            {compactMinimalUiText(streakFreezeStatus.protectionSubtext, 3)}
          </span>
          <span data-testid="streak-freeze-owned-count">
            Freezes:{' '}
            <strong className="text-white">
              {streakFreezeStatus.streakFreezesOwned}/{streakFreezeStatus.maxFreezes}
            </strong>
          </span>
          <span data-testid="streak-freeze-available-points">
            Pts: <strong className="text-white">{participationPoints}</strong>
          </span>
          {streakFreezeStatus.frozenDates.length > 0 && (
            <span data-testid="streak-freeze-frozen-dates">
              <strong className="text-zinc-200">
                {streakFreezeStatus.frozenDates.join(', ')}
              </strong>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {streakFreezeStatus.isStreakAtRisk && (
            <button
              type="button"
              onClick={handleRescueFreezeClick}
              disabled={!streakFreezeStatus.canRescueMissedDay}
              data-testid="rescue-streak-freeze-btn"
              className="px-3 py-1.5 text-xs font-semibold bg-[#E6E2D8] disabled:opacity-50 text-[#141413] whitespace-nowrap shrink-0"
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
            className="px-3 py-1.5 text-xs font-semibold bg-[#E6E2D8] disabled:opacity-40 text-[#141413] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
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
            title="Audit your login & productivity streak protection when a day is missed"
            className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 whitespace-nowrap shrink-0"
          >
            Audit Streak Protection
          </button>
        </div>
      </div>

      {/* Stacked Vertical Architectural Milestone Ledger (Zero 3-Cards-In-A-Row) */}
      <div className="divide-y divide-zinc-800">
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
          const cleanStatusLabel = sanitizeEditorialUiCopy(badge.statusLabel);

          return (
            <div
              key={cardMotionSpec.motionKey}
              data-testid={`profile-badge-card-${badge.id}`}
              data-unlocked={isUnlocked ? 'true' : 'false'}
              data-motion-mode={cardMotionSpec.animationMode}
              data-motion-key={cardMotionSpec.motionKey}
              className="px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
                <span
                  data-testid={`profile-badge-icon-box-${badge.id}`}
                  className="font-mono text-xs text-zinc-400"
                >
                  0{index + 1}
                </span>
                <h3 className="text-sm font-semibold text-white">
                  {badge.title}
                </h3>
                <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                  +{badge.pointsReward}p
                </span>
                <span
                  data-testid={`profile-badge-status-${badge.id}`}
                  className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium whitespace-nowrap ${
                    isUnlocked ? 'text-zinc-200' : 'text-zinc-500'
                  }`}
                >
                  <span>{isUnlocked ? 'Unlocked' : 'Locked'}</span>
                </span>
              </div>

              <div className="lg:w-[340px] shrink-0 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span
                    className="text-zinc-300"
                    data-testid={`profile-badge-progress-text-${badge.id}`}
                  >
                    {cleanStatusLabel}
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
                  className="w-full h-1.5 bg-zinc-900 overflow-hidden"
                >
                  <div
                    className={`h-full ${
                      isUnlocked ? 'bg-zinc-300' : 'bg-zinc-600'
                    }`}
                    style={{ width: `${badge.progressPercent}%` }}
                  />
                </div>

                {badge.id === 'streak_5_day' && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onAdvanceStreak()}
                      data-testid="badge-action-advance-streak"
                      className="flex-1 py-1.5 px-2.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 whitespace-nowrap"
                    >
                      Check In (+1 Day Streak)
                    </button>
                    {!isUnlocked && (
                      <button
                        type="button"
                        onClick={() => onAdvanceStreak(5)}
                        data-testid="badge-action-complete-5d-streak"
                        className="py-1.5 px-2.5 text-xs font-semibold bg-[#E6E2D8] text-[#141413] whitespace-nowrap"
                      >
                        Reach 5-Day Streak
                      </button>
                    )}
                  </div>
                )}

                {badge.id === 'goal_3_day' && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onRecordConsecutiveGoalDay()}
                      data-testid="badge-action-log-goal-day"
                      className="flex-1 py-1.5 px-2.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 whitespace-nowrap"
                    >
                      Log Daily Goal Hit (+1d)
                    </button>
                    {!isUnlocked && (
                      <button
                        type="button"
                        onClick={() => onRecordConsecutiveGoalDay(3)}
                        data-testid="badge-action-complete-3d-goal"
                        className="py-1.5 px-2.5 text-xs font-semibold bg-[#E6E2D8] text-[#141413] whitespace-nowrap"
                      >
                        Hit 3-Day Goal Streak
                      </button>
                    )}
                  </div>
                )}

                {badge.id === 'helpful_notes' && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowNoteComposer((prev) => !prev)}
                      data-testid="badge-action-toggle-note-composer"
                      className="flex-1 py-1.5 px-2.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <span>Write Helpful Note</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickHelpfulNote}
                      data-testid="badge-action-quick-helpful-note"
                      className="py-1.5 px-2.5 text-xs font-semibold bg-[#E6E2D8] text-[#141413] whitespace-nowrap"
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

      {/* Inline Helpful Study Note Composer */}
      {showNoteComposer && (
        <form
          onSubmit={handleNoteFormSubmit}
          data-testid="profile-helpful-note-form"
          className="p-5 bg-[#0C0C0E] space-y-3"
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
              Open Full Study Room
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="w-full px-3 py-1.5 text-xs bg-[#121215] border border-zinc-800 text-white"
              />
            </div>

            <div className="space-y-1">
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
                  className="flex-1 px-3 py-1.5 text-xs bg-[#121215] border border-zinc-800 text-white"
                />
                <button
                  type="submit"
                  data-testid="profile-helpful-note-submit-btn"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#E6E2D8] text-[#141413] whitespace-nowrap shrink-0"
                >
                  Publish Note
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Minimal Footer Summary */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-400 tabular-nums">
        <span>{streakCount}d Streak</span>
        <span>{streakFreezeStatus.streakFreezesOwned}/{streakFreezeStatus.maxFreezes} Freezes</span>
        <span>{badgeSummary.consecutiveGoalDays}d Goal</span>
        <span>{participationPoints} pts</span>
      </div>
    </section>
  );
};
