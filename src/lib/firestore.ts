// ──────────────────────────────────────────────
// KidsVerse — Firestore CRUD Utilities
// ──────────────────────────────────────────────
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';

function assertDb(value: typeof db): asserts value is NonNullable<typeof db> {
  if (!value) throw new Error('KidsVerse: Firebase not configured. Set VITE_FIREBASE_* environment variables.');
}
import type {
  ParentProfile,
  ChildProfile,
  Progress,
  Badge,
  GameScore,
  Drawing,
  FavoriteStory,
  ApprovedVideo,
  ScreenTimeSession,
} from '@/types';

// ── Helper: Firestore timestamp to Date ──
function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'seconds' in value) {
    return new Date((value as { seconds: number; nanoseconds: number }).seconds * 1000);
  }
  return new Date();
}

// ── Helper: Date to Firestore timestamp ──
function fromDate(date: Date): Date {
  return date;
}

// ════════════════════════════════════════════
// Parent Profile CRUD
// ════════════════════════════════════════════

export async function getParentProfile(uid: string): Promise<ParentProfile | null> {
  assertDb(db);
  const snap: DocumentSnapshot = await getDoc(doc(db, COLLECTIONS.PARENT_PROFILES, uid));
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
    createdAt: toDate(snap.data()?.createdAt),
    updatedAt: toDate(snap.data()?.updatedAt),
  } as unknown as ParentProfile;
}

export async function createParentProfile(profile: Omit<ParentProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
  assertDb(db);
  const now = fromDate(new Date());
  await setDoc(doc(db, COLLECTIONS.PARENT_PROFILES, profile.uid), {
    ...profile,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateParentProfile(
  uid: string,
  updates: Partial<Omit<ParentProfile, 'uid' | 'createdAt'>>
): Promise<void> {
  assertDb(db);
  await updateDoc(doc(db, COLLECTIONS.PARENT_PROFILES, uid), {
    ...updates,
    updatedAt: fromDate(new Date()),
  });
}

// ════════════════════════════════════════════
// Child Profile CRUD
// ════════════════════════════════════════════

export async function getChildProfiles(parentId: string): Promise<ChildProfile[]> {
  assertDb(db);
  const constraints: QueryConstraint[] = [
    where('parentId', '==', parentId),
    orderBy('createdAt', 'asc'),
  ];

  const snap = await getDocs(query(collection(db, COLLECTIONS.CHILD_PROFILES), ...constraints));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: toDate(d.data()?.createdAt),
    updatedAt: toDate(d.data()?.updatedAt),
  })) as ChildProfile[];
}

export async function createChildProfile(profile: Omit<ChildProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  assertDb(db);
  const now = fromDate(new Date());
  const docRef = doc(collection(db, COLLECTIONS.CHILD_PROFILES));
  await setDoc(docRef, {
    ...profile,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateChildProfile(
  id: string,
  updates: Partial<Omit<ChildProfile, 'id' | 'parentId' | 'createdAt'>>
): Promise<void> {
  assertDb(db);
  await updateDoc(doc(db, COLLECTIONS.CHILD_PROFILES, id), {
    ...updates,
    updatedAt: fromDate(new Date()),
  });
}

export async function deleteChildProfile(id: string): Promise<void> {
  assertDb(db);
  await deleteDoc(doc(db, COLLECTIONS.CHILD_PROFILES, id));
}

// ════════════════════════════════════════════
// Progress CRUD
// ════════════════════════════════════════════

export async function getProgress(childId: string): Promise<Progress[]> {
  assertDb(db);
  const constraints: QueryConstraint[] = [
    where('childId', '==', childId),
    orderBy('lastAccessedAt', 'desc'),
  ];
  const snap = await getDocs(query(collection(db, COLLECTIONS.PROGRESS), ...constraints));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    lastAccessedAt: toDate(d.data()?.lastAccessedAt),
    completedAt: d.data()?.completedAt ? toDate(d.data()?.completedAt) : null,
  })) as Progress[];
}

export async function upsertProgress(progress: Omit<Progress, 'id'>): Promise<void> {
  assertDb(db);
  const docRef = doc(collection(db, COLLECTIONS.PROGRESS));
  await setDoc(docRef, {
    ...progress,
    lastAccessedAt: fromDate(new Date()),
  });
}

// ════════════════════════════════════════════
// Badge CRUD
// ════════════════════════════════════════════

export async function getBadges(childId: string): Promise<Badge[]> {
  assertDb(db);
  const constraints: QueryConstraint[] = [
    where('childId', '==', childId),
    orderBy('earnedAt', 'desc'),
  ];
  const snap = await getDocs(query(collection(db, COLLECTIONS.BADGES), ...constraints));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    earnedAt: toDate(d.data()?.earnedAt),
  })) as Badge[];
}

export async function awardBadge(badge: Omit<Badge, 'id'>): Promise<void> {
  assertDb(db);
  const docRef = doc(collection(db, COLLECTIONS.BADGES));
  await setDoc(docRef, {
    ...badge,
    earnedAt: fromDate(new Date()),
  });
}

// ════════════════════════════════════════════
// Game Scores CRUD
// ════════════════════════════════════════════

export async function getGameScores(
  childId: string,
  gameType?: string
): Promise<GameScore[]> {
  assertDb(db);
  const constraints: QueryConstraint[] = [
    where('childId', '==', childId),
    orderBy('playedAt', 'desc'),
    limit(50),
  ];
  if (gameType) {
    constraints.unshift(where('gameType', '==', gameType));
  }
  const snap = await getDocs(query(collection(db, COLLECTIONS.GAME_SCORES), ...constraints));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    playedAt: toDate(d.data()?.playedAt),
  })) as GameScore[];
}

export async function saveGameScore(score: Omit<GameScore, 'id'>): Promise<void> {
  assertDb(db);
  const docRef = doc(collection(db, COLLECTIONS.GAME_SCORES));
  await setDoc(docRef, {
    ...score,
    playedAt: fromDate(new Date()),
  });
}

// ════════════════════════════════════════════
// Drawings CRUD
// ════════════════════════════════════════════

export async function getDrawings(childId: string): Promise<Drawing[]> {
  assertDb(db);
  const constraints: QueryConstraint[] = [
    where('childId', '==', childId),
    orderBy('createdAt', 'desc'),
  ];
  const snap = await getDocs(query(collection(db, COLLECTIONS.DRAWINGS), ...constraints));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: toDate(d.data()?.createdAt),
  })) as Drawing[];
}

export async function saveDrawingMetadata(
  drawing: Omit<Drawing, 'id'>
): Promise<string> {
  assertDb(db);
  const docRef = doc(collection(db, COLLECTIONS.DRAWINGS));
  await setDoc(docRef, {
    ...drawing,
    createdAt: fromDate(new Date()),
  });
  return docRef.id;
}

// ════════════════════════════════════════════
// Favorite Stories CRUD
// ════════════════════════════════════════════

export async function getFavoriteStories(childId: string): Promise<FavoriteStory[]> {
  assertDb(db);
  const constraints: QueryConstraint[] = [
    where('childId', '==', childId),
    orderBy('addedAt', 'desc'),
  ];
  const snap = await getDocs(query(collection(db, COLLECTIONS.FAVORITE_STORIES), ...constraints));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    addedAt: toDate(d.data()?.addedAt),
  })) as FavoriteStory[];
}

export async function addFavoriteStory(fav: Omit<FavoriteStory, 'id'>): Promise<void> {
  assertDb(db);
  const docRef = doc(collection(db, COLLECTIONS.FAVORITE_STORIES));
  await setDoc(docRef, {
    ...fav,
    addedAt: fromDate(new Date()),
  });
}

export async function removeFavoriteStory(id: string): Promise<void> {
  assertDb(db);
  await deleteDoc(doc(db, COLLECTIONS.FAVORITE_STORIES, id));
}

// ════════════════════════════════════════════
// Approved Videos CRUD
// ════════════════════════════════════════════

export async function getApprovedVideos(parentId: string): Promise<ApprovedVideo[]> {
  assertDb(db);
  const constraints: QueryConstraint[] = [
    where('parentId', '==', parentId),
    orderBy('approvedAt', 'desc'),
  ];
  const snap = await getDocs(query(collection(db, COLLECTIONS.APPROVED_VIDEOS), ...constraints));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    approvedAt: toDate(d.data()?.approvedAt),
  })) as ApprovedVideo[];
}

export async function addApprovedVideo(
  video: Omit<ApprovedVideo, 'id' | 'approvedAt'>
): Promise<void> {
  assertDb(db);
  const docRef = doc(collection(db, COLLECTIONS.APPROVED_VIDEOS));
  await setDoc(docRef, {
    ...video,
    approvedAt: fromDate(new Date()),
  });
}

export async function removeApprovedVideo(id: string): Promise<void> {
  assertDb(db);
  await deleteDoc(doc(db, COLLECTIONS.APPROVED_VIDEOS, id));
}

// ════════════════════════════════════════════
// Screen Time Sessions CRUD
// ════════════════════════════════════════════

export async function getTodayScreenTime(
  childId: string,
  dateStr: string
): Promise<number> {
  assertDb(db);
  const constraints: QueryConstraint[] = [
    where('childId', '==', childId),
    where('date', '==', dateStr),
  ];
  const snap = await getDocs(query(collection(db, COLLECTIONS.SCREEN_TIME_SESSIONS), ...constraints));
  let totalMinutes = 0;
  snap.docs.forEach((d) => {
    totalMinutes += d.data()?.minutesUsed ?? 0;
  });
  return totalMinutes;
}

export async function saveScreenTimeSession(
  session: Omit<ScreenTimeSession, 'id'>
): Promise<void> {
  assertDb(db);
  const docRef = doc(collection(db, COLLECTIONS.SCREEN_TIME_SESSIONS));
  await setDoc(docRef, session);
}
