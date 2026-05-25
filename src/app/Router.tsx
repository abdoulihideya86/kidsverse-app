// ──────────────────────────────────────────────
// KidsVerse — React Router Configuration
// ──────────────────────────────────────────────
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/app/AppLayout';
import { AuthProvider, ProtectedRoute } from '@/features/auth';
import { ChildProfileResolver } from '@/features/child';

// ── Lazy-loaded pages ──
import { lazy, Suspense } from 'react';

// Parent pages
const ParentLogin = lazy(() => import('@/pages/parent/ParentLogin'));
const ParentRegister = lazy(() => import('@/pages/parent/ParentRegister'));
const ParentDashboard = lazy(() => import('@/pages/parent/ParentDashboard'));
const ParentChildProfiles = lazy(() => import('@/pages/parent/ParentChildProfiles'));
const ParentScreenTime = lazy(() => import('@/pages/parent/ParentScreenTime'));
const ParentProgress = lazy(() => import('@/pages/parent/ParentProgress'));
const ParentSubscription = lazy(() => import('@/pages/parent/ParentSubscription'));
const ParentVideoManager = lazy(() => import('@/pages/parent/ParentVideoManager'));

// Child pages
const ChildHome = lazy(() => import('@/pages/kids/ChildHome'));

// Learning modules
const AlphabetModule = lazy(() => import('@/pages/learn/AlphabetModule'));
const NumbersModule = lazy(() => import('@/pages/learn/NumbersModule'));
const ColorsShapesModule = lazy(() => import('@/pages/learn/ColorsShapesModule'));
const ScienceModule = lazy(() => import('@/pages/learn/ScienceModule'));

// Games
const MemoryMatch = lazy(() => import('@/pages/play/MemoryMatch'));
const PuzzleBuilder = lazy(() => import('@/pages/play/PuzzleBuilder'));
const SpellingBee = lazy(() => import('@/pages/play/SpellingBee'));
const MathChallenge = lazy(() => import('@/pages/play/MathChallenge'));

// Stories
const StoriesLibrary = lazy(() => import('@/pages/stories/StoriesLibrary'));
const StoryViewer = lazy(() => import('@/pages/stories/StoryViewer'));

// Creative Studio
const DrawingCanvas = lazy(() => import('@/pages/create/DrawingCanvas'));
const ColoringPages = lazy(() => import('@/pages/create/ColoringPages'));
const DrawingGallery = lazy(() => import('@/pages/create/DrawingGallery'));

// Video section
const VideoPlayer = lazy(() => import('@/pages/watch/VideoPlayer'));
const VideoCategories = lazy(() => import('@/pages/watch/VideoCategories'));

// ── Loading fallback ──
function LazyFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-kv-cream"
      role="status"
      aria-label="Loading KidsVerse"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-kv-blue border-t-transparent animate-spin" />
        <p className="text-kv-gray-500 font-sans text-lg">Loading...</p>
      </div>
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>;
}

// ── Router ──
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // ── Redirect to parent login ──
      {
        index: true,
        element: (
          <AuthProvider>
            <Navigate to="/parent/login" replace />
          </AuthProvider>
        ),
      },

      // ── Parent Auth (not protected) ──
      {
        path: 'parent/login',
        element: (
          <AuthProvider>
            <SuspenseWrapper><ParentLogin /></SuspenseWrapper>
          </AuthProvider>
        ),
      },
      {
        path: 'parent/register',
        element: (
          <AuthProvider>
            <SuspenseWrapper><ParentRegister /></SuspenseWrapper>
          </AuthProvider>
        ),
      },

      // ── Parent Dashboard (protected) ──
      {
        path: 'parent',
        element: (
          <AuthProvider>
            <ProtectedRoute>
              <SuspenseWrapper><ParentDashboard /></SuspenseWrapper>
            </ProtectedRoute>
          </AuthProvider>
        ),
      },
      {
        path: 'parent/children',
        element: (
          <AuthProvider>
            <ProtectedRoute>
              <SuspenseWrapper><ParentChildProfiles /></SuspenseWrapper>
            </ProtectedRoute>
          </AuthProvider>
        ),
      },
      {
        path: 'parent/screen-time',
        element: (
          <AuthProvider>
            <ProtectedRoute>
              <SuspenseWrapper><ParentScreenTime /></SuspenseWrapper>
            </ProtectedRoute>
          </AuthProvider>
        ),
      },
      {
        path: 'parent/progress',
        element: (
          <AuthProvider>
            <ProtectedRoute>
              <SuspenseWrapper><ParentProgress /></SuspenseWrapper>
            </ProtectedRoute>
          </AuthProvider>
        ),
      },
      {
        path: 'parent/subscription',
        element: (
          <AuthProvider>
            <ProtectedRoute>
              <SuspenseWrapper><ParentSubscription /></SuspenseWrapper>
            </ProtectedRoute>
          </AuthProvider>
        ),
      },
      {
        path: 'parent/videos',
        element: (
          <AuthProvider>
            <ProtectedRoute>
              <SuspenseWrapper><ParentVideoManager /></SuspenseWrapper>
            </ProtectedRoute>
          </AuthProvider>
        ),
      },

      // ── Child Home Screen ──
      {
        path: 'kids/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><ChildHome /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },

      // ── Learning Modules ──
      {
        path: 'learn/alphabet/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><AlphabetModule /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },
      {
        path: 'learn/numbers/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><NumbersModule /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },
      {
        path: 'learn/colors-shapes/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><ColorsShapesModule /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },
      {
        path: 'learn/science/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><ScienceModule /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },

      // ── Games ──
      {
        path: 'play/memory-match/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><MemoryMatch /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },
      {
        path: 'play/puzzle/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><PuzzleBuilder /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },
      {
        path: 'play/spelling-bee/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><SpellingBee /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },
      {
        path: 'play/math-challenge/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><MathChallenge /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },

      // ── Stories ──
      {
        path: 'stories/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><StoriesLibrary /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },
      {
        path: 'stories/:profileId/:storyId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><StoryViewer /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },

      // ── Creative Studio ──
      {
        path: 'create/draw/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><DrawingCanvas /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },
      {
        path: 'create/coloring/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><ColoringPages /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },
      {
        path: 'create/gallery/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><DrawingGallery /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },

      // ── Video Section ──
      {
        path: 'watch/:profileId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><VideoCategories /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },
      {
        path: 'watch/:profileId/:videoId',
        element: (
          <AuthProvider>
            <ChildProfileResolver>
              <SuspenseWrapper><VideoPlayer /></SuspenseWrapper>
            </ChildProfileResolver>
          </AuthProvider>
        ),
      },

      // ── 404 ──
      {
        path: '*',
        element: (
          <AuthProvider>
            <div className="kv-page flex flex-col items-center justify-center gap-6">
              <h1 className="text-6xl font-display text-kv-blue">404</h1>
              <p className="text-xl text-kv-gray-500">Oops! This page went on an adventure.</p>
              <a
                href="/"
                className="kv-button-base bg-kv-blue text-white px-8 py-3 text-lg"
              >
                Go Home
              </a>
            </div>
          </AuthProvider>
        ),
      },
    ],
  },
]);
