// ──────────────────────────────────────────────
// KidsVerse — Root App Layout
// ──────────────────────────────────────────────
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function AppLayout() {
  const location = useLocation();

  return (
    <div id="kidsverse-root" className="min-h-screen bg-kv-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-kv-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-2xl focus:shadow-modal"
      >
        Skip to main content
      </a>
      <AnimatePresence mode="wait">
        <main id="main-content" key={location.pathname}>
          <Outlet />
        </main>
      </AnimatePresence>
    </div>
  );
}
