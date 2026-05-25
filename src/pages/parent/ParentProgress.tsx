import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { getProgress, getBadges, getGameScores } from '@/lib/firestore';
import { cn, formatDate } from '@/lib/utils';
import { ProgressBar, AchievementBadge } from '@/components';
import { staggerContainer, staggerItem } from '@/components/animations';
import { motion } from 'framer-motion';
import type { Progress, Badge, GameScore, ChildProfile, SubjectArea, GameType } from '@/types';

// ── Lookup maps ──
const subjectEmojis: Record<SubjectArea, string> = {
  alphabet: '🔤',
  numbers: '🔢',
  colors: '🎨',
  shapes: '🧩',
  science: '🔬',
};

const subjectLabels: Record<SubjectArea, string> = {
  alphabet: 'Alphabet & Phonics',
  numbers: 'Numbers & Counting',
  colors: 'Colors & Shapes',
  shapes: 'Shapes & Patterns',
  science: 'Science Facts',
};

const gameEmojis: Record<GameType, string> = {
  'memory-match': '🃏',
  puzzle: '🧩',
  'spelling-bee': '🐝',
  'math-challenge': '🧮',
};

const gameLabels: Record<GameType, string> = {
  'memory-match': 'Memory Match',
  puzzle: 'Puzzle Builder',
  'spelling-bee': 'Spelling Bee',
  'math-challenge': 'Math Challenge',
};

// ── Skeleton component ──
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('kv-skeleton rounded-2xl', className)} />;
}

// ── Subject progress helpers ──
function isSubjectArea(moduleId: string): moduleId is SubjectArea {
  return moduleId in subjectLabels;
}

function groupSubjectProgress(progressList: Progress[]): Map<SubjectArea, Progress> {
  const map = new Map<SubjectArea, Progress>();
  for (const entry of progressList) {
    if (isSubjectArea(entry.moduleId) && !map.has(entry.moduleId)) {
      map.set(entry.moduleId, entry);
    }
  }
  return map;
}

// ── Game score helpers ──
interface GameSummary {
  gameType: GameType;
  bestScore: number;
  totalPlays: number;
}

function groupGameScores(scores: GameScore[]): GameSummary[] {
  const grouped = new Map<GameType, { bestScore: number; totalPlays: number }>();
  for (const score of scores) {
    const existing = grouped.get(score.gameType);
    if (existing) {
      if (score.score > existing.bestScore) {
        existing.bestScore = score.score;
      }
      existing.totalPlays += 1;
    } else {
      grouped.set(score.gameType, { bestScore: score.score, totalPlays: 1 });
    }
  }

  return Array.from(grouped.entries()).map(([gameType, summary]) => ({
    gameType,
    ...summary,
  }));
}

// ════════════════════════════════════════════════════════
// ParentProgress Page
// ════════════════════════════════════════════════════════

export default function ParentProgress() {
  const navigate = useNavigate();
  const childProfiles = useAuthStore((s) => s.childProfiles);

  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [progress, setProgress] = useState<Progress[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Default to first child when profiles load or change
  useEffect(() => {
    if (childProfiles.length > 0 && !selectedChildId) {
      setSelectedChildId(childProfiles[0]!.id);
    }
  }, [childProfiles, selectedChildId]);

  // Fetch data when selected child changes
  useEffect(() => {
    if (!selectedChildId) return;

    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      getProgress(selectedChildId),
      getBadges(selectedChildId),
      getGameScores(selectedChildId),
    ]).then(([progressData, badgesData, scoresData]) => {
      if (!cancelled) {
        setProgress(progressData);
        setBadges(badgesData);
        setGameScores(scoresData);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setProgress([]);
        setBadges([]);
        setGameScores([]);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedChildId]);

  // Derived data
  const subjectProgressMap = groupSubjectProgress(progress);
  const subjectEntries = Array.from(subjectProgressMap.entries());
  const gameSummaries = groupGameScores(gameScores);

  return (
    <div className="kv-page">
      <header className="mb-8">
        <button
          onClick={() => navigate('/parent')}
          className="kv-button-base bg-kv-gray-200 text-kv-gray-600 px-4 py-2 text-sm mb-4"
          aria-label="Back to dashboard"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-display text-kv-green">Progress Reports</h1>
        <p className="text-kv-gray-500 mt-1">Track learning achievements and milestones</p>
      </header>

      {/* Child Selector */}
      <div className="mb-8">
        <label htmlFor="child-select" className="block text-sm font-bold text-kv-gray-700 mb-2">
          Select Child
        </label>
        {childProfiles.length === 0 ? (
          <p className="text-sm text-kv-gray-400">No child profiles found. Add a child profile first.</p>
        ) : (
          <select
            id="child-select"
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-blue focus:outline-none text-lg bg-white min-w-[200px]"
            aria-label="Select a child to view progress"
          >
            {childProfiles.map((child: ChildProfile) => (
              <option key={child.id} value={child.id}>
                {child.name} (Age {child.age})
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        /* Loading skeletons */
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          <motion.section variants={staggerItem} aria-label="Loading learning progress">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </motion.section>
          <motion.section variants={staggerItem} aria-label="Loading badges">
            <Skeleton className="h-8 w-40 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </div>
          </motion.section>
          <motion.section variants={staggerItem} aria-label="Loading game scores">
            <Skeleton className="h-8 w-36 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </motion.section>
        </motion.div>
      ) : (
        <>
          {/* Subject Progress */}
          <motion.section
            className="mb-10"
            aria-label="Subject area progress"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 variants={staggerItem} className="text-2xl font-display text-kv-gray-800 mb-4">
              Learning Progress
            </motion.h2>

            {subjectEntries.length === 0 ? (
              <motion.div
                variants={staggerItem}
                className="kv-card text-center py-12"
              >
                <span className="text-4xl block mb-3" aria-hidden="true">📚</span>
                <p className="text-kv-gray-500 font-bold">No learning activity yet</p>
                <p className="text-sm text-kv-gray-400 mt-1">Progress will appear once your child starts exploring lessons.</p>
              </motion.div>
            ) : (
              <motion.div variants={staggerItem} className="space-y-4">
                {subjectEntries.map(([moduleId, entry]) => (
                  <motion.div
                    key={moduleId}
                    variants={staggerItem}
                    className="kv-card"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-3xl" aria-hidden="true">{subjectEmojis[moduleId]}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-kv-gray-800">{subjectLabels[moduleId]}</h3>
                        <p className="text-sm text-kv-gray-400">Last: {formatDate(entry.lastAccessedAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-display font-bold text-kv-blue">{entry.percentComplete}%</p>
                        <p className="text-sm text-kv-yellow">⭐ {entry.stars} stars</p>
                      </div>
                    </div>
                    <ProgressBar
                      value={entry.percentComplete}
                      max={100}
                      variant="blue"
                      size="md"
                      animated
                      aria-label={`${subjectLabels[moduleId]} progress`}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>

          {/* Badges */}
          <motion.section
            className="mb-10"
            aria-label="Earned badges"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 variants={staggerItem} className="text-2xl font-display text-kv-gray-800 mb-4">
              Badges Earned ({badges.length})
            </motion.h2>

            {badges.length === 0 ? (
              <motion.div
                variants={staggerItem}
                className="kv-card text-center py-12"
              >
                <span className="text-4xl block mb-3" aria-hidden="true">🏆</span>
                <p className="text-kv-gray-500 font-bold">No badges earned yet</p>
                <p className="text-sm text-kv-gray-400 mt-1">Badges will be unlocked as your child learns and plays!</p>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerItem}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
              >
                {badges.map((badge: Badge) => (
                  <motion.div key={badge.id} variants={staggerItem}>
                    <AchievementBadge
                      name={badge.name}
                      description={badge.description}
                      emoji={badge.icon}
                      earned={true}
                      earnedDate={formatDate(badge.earnedAt)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>

          {/* Game Scores */}
          <motion.section
            aria-label="Game scores summary"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 variants={staggerItem} className="text-2xl font-display text-kv-gray-800 mb-4">
              Game Scores
            </motion.h2>

            {gameSummaries.length === 0 ? (
              <motion.div
                variants={staggerItem}
                className="kv-card text-center py-12"
              >
                <span className="text-4xl block mb-3" aria-hidden="true">🎮</span>
                <p className="text-kv-gray-500 font-bold">No games played yet</p>
                <p className="text-sm text-kv-gray-400 mt-1">Game scores will show up after your child plays games.</p>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerItem}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {gameSummaries.map((game: GameSummary) => (
                  <motion.div
                    key={game.gameType}
                    variants={staggerItem}
                    className="kv-card flex items-center gap-4"
                  >
                    <span className="text-3xl" aria-hidden="true">{gameEmojis[game.gameType]}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-kv-gray-800">{gameLabels[game.gameType]}</h3>
                      <p className="text-sm text-kv-gray-400">{game.totalPlays} games played</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-display font-bold text-kv-purple">{game.bestScore}</p>
                      <p className="text-xs text-kv-gray-400">Best Score</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>
        </>
      )}
    </div>
  );
}
