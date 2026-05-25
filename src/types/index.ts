// ──────────────────────────────────────────────
// KidsVerse — Shared TypeScript Interfaces
// ──────────────────────────────────────────────

// ── Age Segmentation ──
export type AgeSegment = 'toddler' | 'early-learner' | 'kid';

export type AgeRange = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export function getAgeSegment(age: AgeRange): AgeSegment {
  if (age >= 2 && age <= 4) return 'toddler';
  if (age >= 5 && age <= 7) return 'early-learner';
  return 'kid';
}

// ── Firebase / Auth ──
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
}

export interface ParentProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  childProfileIds: string[];
  subscription: Subscription;
  createdAt: Date;
  updatedAt: Date;
}

// ── Child Profiles ──
export type AvatarAnimal =
  | 'bear'
  | 'bunny'
  | 'cat'
  | 'dog'
  | 'elephant'
  | 'fox'
  | 'giraffe'
  | 'koala'
  | 'lion'
  | 'monkey'
  | 'panda'
  | 'penguin';

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  age: AgeRange;
  avatar: AvatarAnimal;
  screenTimeLimitMinutes: number;
  contentFilters: ContentFilter[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentFilter {
  id: string;
  category: FilterCategory;
  enabled: boolean;
}

export type FilterCategory =
  | 'learning'
  | 'games'
  | 'stories'
  | 'videos'
  | 'creative'
  | 'science';

// ── Progress & Badges ──
export type SubjectArea =
  | 'alphabet'
  | 'numbers'
  | 'colors'
  | 'shapes'
  | 'science';

export type GameType =
  | 'memory-match'
  | 'puzzle'
  | 'spelling-bee'
  | 'math-challenge';

export type LearningModuleId = SubjectArea | GameType;

export interface Progress {
  id: string;
  childId: string;
  parentId: string;
  moduleId: LearningModuleId;
  completed: boolean;
  stars: 0 | 1 | 2 | 3;
  percentComplete: number;
  lastAccessedAt: Date;
  completedAt: Date | null;
}

export type BadgeCategory =
  | 'first-lesson'
  | 'perfect-score'
  | 'streak-3'
  | 'streak-7'
  | 'all-subjects'
  | 'creative-master'
  | 'bookworm'
  | 'explorer';

export interface Badge {
  id: string;
  childId: string;
  parentId: string;
  category: BadgeCategory;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

// ── Game Scores ──
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface GameScore {
  id: string;
  childId: string;
  parentId: string;
  gameType: GameType;
  score: number;
  maxScore: number;
  difficulty: DifficultyLevel;
  durationSeconds: number;
  playedAt: Date;
}

// ── Stories ──
export interface Story {
  id: string;
  title: string;
  ageSegment: AgeSegment;
  pages: StoryPage[];
  category: 'adventure' | 'learning' | 'bedtime' | 'funny';
  totalDurationSeconds: number;
}

export interface StoryPage {
  pageNumber: number;
  text: string;
  svgScene: string;
  audioLabel?: string;
}

export interface FavoriteStory {
  id: string;
  childId: string;
  parentId: string;
  storyId: string;
  addedAt: Date;
}

// ── Creative Studio ──
export type DrawingTool = 'brush' | 'eraser' | 'fill';

export interface Drawing {
  id: string;
  childId: string;
  parentId: string;
  storagePath: string;
  downloadURL: string;
  thumbnailURL: string;
  width: number;
  height: number;
  createdAt: Date;
}

// ── Subscription / Stripe ──
export type SubscriptionTier = 'free' | 'premium';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'inactive';

export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

// ── Video / YouTube ──
export type VideoCategory = 'songs' | 'science' | 'art' | 'stories';

export interface ApprovedVideo {
  id: string;
  parentId: string;
  youtubeVideoId: string;
  title: string;
  category: VideoCategory;
  thumbnailURL: string;
  durationSeconds: number;
  approvedAt: Date;
  approvedForProfileIds: string[];
}

// ── Screen Time ──
export interface ScreenTimeSession {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD format
  minutesUsed: number;
  startedAt: Date;
  endedAt: Date | null;
}

// ── App-level ──
export interface AppRoute {
  path: string;
  label: string;
  icon: string;
  audioLabel?: string;
  minAge: AgeRange;
}

export interface AgeAdaptiveConfig {
  segment: AgeSegment;
  showTextLabels: boolean;
  showAudioLabels: boolean;
  minTapTargetPx: number;
  maxColorsPerScreen: number;
  enableReading: boolean;
  enableTimedChallenges: boolean;
}
