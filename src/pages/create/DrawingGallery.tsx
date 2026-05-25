import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';
import {
  Card, MotionCard, MotionButton, Button, Badge,
  Modal, ConfirmDialog, AnimatedContainer, StaggerGrid, StaggerItem,
  IconArrowLeft, IconHome, IconDelete,
} from '@/components';

// ── Types ──
interface SavedDrawing {
  id: string;
  childId: string;
  parentId: string;
  title: string;
  dataURL: string;
  width: number;
  height: number;
  createdAt: string;
}

// ── localStorage helpers (matches DrawingCanvas.tsx) ──
const STORAGE_KEY = 'kidsverse-drawings';

function loadDrawings(): SavedDrawing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedDrawing[]) : [];
  } catch {
    return [];
  }
}

function persistDrawings(drawings: SavedDrawing[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drawings));
  } catch {
    // localStorage full — silently fail
  }
}

// ── Relative time helper ──
function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  if (diffDay < 2) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ══════════════════════════════════════════════
// DrawingGallery Component
// ══════════════════════════════════════════════
export default function DrawingGallery() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { activeChildProfile } = useAuthStore();
  const { playClick, playSuccess } = useSoundEffects();

  const age = activeChildProfile?.age ?? 5;
  const config = useAgeAdaptiveConfig(age);
  const isToddler = config.segment === 'toddler';
  const isKid = config.segment === 'kid';

  // ── State ──
  const [drawings, setDrawings] = useState<SavedDrawing[]>(() => {
    const all = loadDrawings();
    const childId = activeChildProfile?.id;
    if (!childId) return all;
    return all.filter((d) => d.childId === childId);
  });
  const [selectedDrawing, setSelectedDrawing] = useState<SavedDrawing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedDrawing | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  // ── Derived ──
  const totalCount = drawings.length;
  const newestDrawing = drawings[0];
  const gridCols = isToddler ? 'grid-cols-1 sm:grid-cols-2' : isKid ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3';
  const cardMinH = isToddler ? 'min-h-[200px]' : 'min-h-[140px]';

  // ── Delete single drawing ──
  const handleDeleteSingle = useCallback((drawing: SavedDrawing) => {
    if (isToddler) {
      // Toddlers: delete immediately
      const all = loadDrawings();
      const filtered = all.filter((d) => d.id !== drawing.id);
      persistDrawings(filtered);
      setDrawings((prev) => prev.filter((d) => d.id !== drawing.id));
      playClick();
      return;
    }
    setDeleteTarget(drawing);
  }, [isToddler, playClick]);

  const confirmDeleteSingle = useCallback(() => {
    if (!deleteTarget) return;
    const all = loadDrawings();
    const filtered = all.filter((d) => d.id !== deleteTarget.id);
    persistDrawings(filtered);
    setDrawings((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    setSelectedDrawing(null);
    setDeleteTarget(null);
    playClick();
    setShowDeleted(true);
    setTimeout(() => setShowDeleted(false), 1500);
  }, [deleteTarget, playClick]);

  // ── Clear all drawings ──
  const confirmClearAll = useCallback(() => {
    const all = loadDrawings();
    const childId = activeChildProfile?.id;
    const remaining = childId ? all.filter((d) => d.childId !== childId) : [];
    persistDrawings(remaining);
    setDrawings([]);
    setShowClearAll(false);
    playClick();
  }, [activeChildProfile, playClick]);

  // ── Download drawing as PNG ──
  const handleDownload = useCallback((drawing: SavedDrawing) => {
    const link = document.createElement('a');
    link.download = `${drawing.title.replace(/\s+/g, '_')}.png`;
    link.href = drawing.dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSuccess();
  }, [playSuccess]);

  // ── Refresh drawings from localStorage ──
  const handleRefresh = useCallback(() => {
    const all = loadDrawings();
    const childId = activeChildProfile?.id;
    if (!childId) {
      setDrawings(all);
      return;
    }
    setDrawings(all.filter((d) => d.childId === childId));
    playClick();
  }, [activeChildProfile, playClick]);

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  return (
    <div className="kv-page flex flex-col gap-4 pb-8">
      {/* ── Header ── */}
      <AnimatedContainer variant="slideDown" className="flex items-center gap-3">
        <Button
          variant="ghost"
          size={isToddler ? 'lg' : 'sm'}
          onClick={() => navigate(`/kids/${profileId}`)}
          aria-label="Go back to home"
          leftIcon={<IconArrowLeft size={20} />}
        />
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-display text-kv-purple">
            {isToddler ? '🖼️ My Art' : 'My Gallery'}
          </h1>
          {!isToddler && (
            <p className="text-kv-gray-500 text-sm mt-0.5">
              All your amazing creations in one place!
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size={isToddler ? 'lg' : 'sm'}
          onClick={handleRefresh}
          aria-label="Refresh gallery"
        >
          🔄
        </Button>
        <Button
          variant="ghost"
          size={isToddler ? 'lg' : 'sm'}
          onClick={() => navigate(`/kids/${profileId}`)}
          aria-label="Home"
          leftIcon={<IconHome size={20} />}
        />
      </AnimatedContainer>

      {/* ── Stats Bar ── */}
      {totalCount > 0 && (
        <AnimatedContainer variant="slideUp" delay={0.05}>
          <Card variant="elevated" padding="sm">
            <div className="flex items-center justify-between p-3 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="md" icon={<span aria-hidden="true">🖼️</span>}>
                  {isToddler
                    ? `${totalCount}`
                    : `${totalCount} drawing${totalCount !== 1 ? 's' : ''}`}
                </Badge>
                {isKid && newestDrawing && (
                  <span className="text-sm text-kv-gray-400">
                    Newest: {getRelativeTime(newestDrawing.createdAt)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isToddler && totalCount > 0 && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => setShowClearAll(true)}
                    aria-label="Delete all drawings"
                    leftIcon={<IconDelete size={14} />}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </AnimatedContainer>
      )}

      {/* ── Create New Buttons ── */}
      <AnimatedContainer variant="slideUp" delay={0.08}>
        <div className="flex gap-3 flex-wrap">
          <MotionButton
            variant="primary"
            size={isToddler ? 'toddler' : 'md'}
            onClick={() => navigate(`/create/draw/${profileId}`)}
            leftIcon={<span aria-hidden="true">🖌️</span>}
            aria-label="Create new drawing"
          >
            {isToddler ? '🖌️ Draw!' : 'New Drawing'}
          </MotionButton>
          <MotionButton
            variant="premium"
            size={isToddler ? 'toddler' : 'md'}
            onClick={() => navigate(`/create/coloring/${profileId}`)}
            leftIcon={<span aria-hidden="true">🎨</span>}
            aria-label="Color a new page"
          >
            {isToddler ? '🎨 Color!' : 'New Coloring Page'}
          </MotionButton>
        </div>
      </AnimatedContainer>

      {/* ── Gallery Grid or Empty State ── */}
      {totalCount === 0 ? (
        /* ── Empty State ── */
        <AnimatedContainer variant="slideUp" delay={0.1}>
          <Card variant="elevated" className="text-center py-12 md:py-16">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-4"
            >
              <span className="text-7xl md:text-8xl block" aria-hidden="true">🖼️</span>
            </motion.div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-kv-gray-700 mb-3">
              No Drawings Yet
            </h2>
            <p className="text-kv-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
              Your saved drawings and coloring pages will appear here. Start creating to fill your gallery with amazing art!
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <MotionButton
                variant="primary"
                size={isToddler ? 'toddler' : 'lg'}
                onClick={() => navigate(`/create/draw/${profileId}`)}
                leftIcon={<span aria-hidden="true">🖌️</span>}
                aria-label="Start drawing"
              >
                {isToddler ? '🖌️ Draw' : 'Start Drawing'}
              </MotionButton>
              <MotionButton
                variant="premium"
                size={isToddler ? 'toddler' : 'lg'}
                onClick={() => navigate(`/create/coloring/${profileId}`)}
                leftIcon={<span aria-hidden="true">🎨</span>}
                aria-label="Start coloring"
              >
                {isToddler ? '🎨 Color' : 'Start Coloring'}
              </MotionButton>
            </div>
          </Card>
        </AnimatedContainer>
      ) : (
        /* ── Drawing Grid ── */
        <StaggerGrid
          className={cn('grid gap-4', gridCols)}
        >
          {drawings.map((drawing) => (
            <StaggerItem key={drawing.id}>
              <MotionCard
                asMotion
                variant="interactive"
                padding="none"
                className={cn('flex flex-col overflow-hidden cursor-pointer group', cardMinH)}
                onClick={() => { setSelectedDrawing(drawing); playClick(); }}
                whileHover={{ y: -4 }}
                role="listitem"
                aria-label={`View drawing: ${drawing.title}, created ${getRelativeTime(drawing.createdAt)}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedDrawing(drawing);
                    playClick();
                  }
                }}
              >
                {/* Thumbnail */}
                <div className="w-full aspect-square bg-kv-gray-100 overflow-hidden flex-shrink-0">
                  <img
                    src={drawing.dataURL}
                    alt={drawing.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1 flex-1 min-w-0">
                  <p className="text-sm font-bold text-kv-gray-700 truncate">
                    {drawing.title}
                  </p>
                  <p className="text-xs text-kv-gray-400">
                    {getRelativeTime(drawing.createdAt)}
                  </p>

                  {/* Action buttons on hover */}
                  {!isToddler && (
                    <div className="flex gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setSelectedDrawing(drawing); }}
                        className="kv-button-base rounded-lg bg-kv-blue/10 text-kv-blue text-xs px-2 py-1"
                        aria-label="View full size"
                      >
                        👁️ View
                      </motion.button>
                      {isKid && (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); handleDownload(drawing); }}
                          className="kv-button-base rounded-lg bg-kv-green/10 text-kv-green text-xs px-2 py-1"
                          aria-label={`Download drawing: ${drawing.title}`}
                        >
                          💾 Save
                        </motion.button>
                      )}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteSingle(drawing); }}
                        className="kv-button-base rounded-lg bg-kv-red/10 text-kv-red text-xs px-2 py-1"
                        aria-label={`Delete drawing: ${drawing.title}`}
                      >
                        🗑️
                      </motion.button>
                    </div>
                  )}
                </div>
              </MotionCard>
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}

      {/* ── Deleted Feedback Toast ── */}
      <AnimatePresence>
        {showDeleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-kv-gray-800 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-bold"
            role="status"
            aria-live="polite"
          >
            🗑️ Drawing deleted
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full-View Modal ── */}
      <Modal
        isOpen={selectedDrawing !== null}
        onClose={() => setSelectedDrawing(null)}
        title={selectedDrawing?.title ?? 'Drawing'}
        size="xl"
        footer={
          selectedDrawing && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(selectedDrawing)}
                aria-label={`Download: ${selectedDrawing.title}`}
              >
                💾 Download
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteSingle(selectedDrawing)}
                aria-label={`Delete: ${selectedDrawing.title}`}
                leftIcon={<IconDelete size={14} />}
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDrawing(null)}
                aria-label="Close"
              >
                Close
              </Button>
            </div>
          )
        }
      >
        {selectedDrawing && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={selectedDrawing.dataURL}
              alt={selectedDrawing.title}
              className="w-full rounded-xl max-h-[50vh] object-contain bg-kv-gray-50"
            />
            <div className="flex items-center gap-3 text-sm text-kv-gray-400">
              <span>{getRelativeTime(selectedDrawing.createdAt)}</span>
              {isKid && (
                <Badge variant="default" size="sm">
                  {`${selectedDrawing.width} × ${selectedDrawing.height}`}
                </Badge>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Dialog ── */}
      {!isToddler && deleteTarget && (
        <ConfirmDialog
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteSingle}
          title="Delete Drawing"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Keep"
          variant="danger"
        />
      )}

      {/* ── Clear All Confirmation Dialog ── */}
      {!isToddler && (
        <ConfirmDialog
          isOpen={showClearAll}
          onClose={() => setShowClearAll(false)}
          onConfirm={confirmClearAll}
          title="Clear All Drawings"
          message={`Are you sure you want to delete all ${totalCount} drawing${totalCount !== 1 ? 's' : ''}? This action cannot be undone.`}
          confirmLabel="Delete All"
          cancelLabel="Keep Drawings"
          variant="danger"
        />
      )}
    </div>
  );
}
