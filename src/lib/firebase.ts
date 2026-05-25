// ──────────────────────────────────────────────
// KidsVerse — Firebase Client Configuration
// ──────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
  type Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage';

// ── Config Validation ──
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** True when all required Firebase env vars are present */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// ── App ──
export const app = isFirebaseConfigured
  ? initializeApp(firebaseConfig)
  : null;

// ── Auth ──
export const auth: Auth | null = app ? getAuth(app) : null;

// ── Firestore ──
export const db: Firestore | null = app ? getFirestore(app) : null;

if (db) {
  enableIndexedDbPersistence(db).catch((error: unknown) => {
    if (error instanceof Error && error.message.includes('failed-precondition')) {
      console.warn(
        'KidsVerse: Firestore persistence failed — multiple tabs open. Persistence enabled only in first tab.'
      );
    } else if (error instanceof Error && error.message.includes('unimplemented')) {
      console.warn(
        'KidsVerse: Current browser does not support IndexedDB persistence.'
      );
    }
  });
}

// ── Storage ──
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

// ── Firestore Collection Paths ──
export const COLLECTIONS = {
  USERS: 'users',
  PARENT_PROFILES: 'parentProfiles',
  CHILD_PROFILES: 'childProfiles',
  PROGRESS: 'progress',
  BADGES: 'badges',
  GAME_SCORES: 'gameScores',
  DRAWINGS: 'drawings',
  FAVORITE_STORIES: 'favoriteStories',
  STORIES: 'stories',
  APPROVED_VIDEOS: 'approvedVideos',
  SCREEN_TIME_SESSIONS: 'screenTimeSessions',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

// ── Stripe ──
export const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '';
export const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:3000';

// ── App Config ──
export const APP_CONFIG = {
  maxChildProfiles: Number(import.meta.env.VITE_MAX_CHILD_PROFILES) || 5,
  freeTierMinutesPerDay: Number(import.meta.env.VITE_FREE_TIER_MINUTES_PER_DAY) || 30,
  premiumTierMinutesPerDay: Number(import.meta.env.VITE_PREMIUM_TIER_MINUTES_PER_DAY) || 120,
  youtubeApiKey: import.meta.env.VITE_YOUTUBE_API_KEY ?? '',
} as const;
