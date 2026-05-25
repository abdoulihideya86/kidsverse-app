import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { saveDrawingMetadata, upsertProgress } from '@/lib/firestore';
import {
  Card, MotionButton, Button,
  Badge, ConfirmDialog, IconArrowLeft, IconHome, AnimatedContainer,
} from '@/components';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import type { DrawingTool, LearningModuleId } from '@/types';

// ── localStorage save type ──
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

const STORAGE_KEY = 'kidsverse-drawings';
const MAX_UNDO = 30;

// ── Color palettes per age segment ──
const TODDLER_COLORS = ['#FF6B6B', '#FFA94D', '#FFD93D', '#6BCB77', '#4D96FF', '#FF69B4'];
const LEARNER_COLORS = [
  '#FF6B6B', '#FFA94D', '#FFD93D', '#6BCB77', '#4D96FF',
  '#9B59B6', '#FF69B4', '#00CED1', '#2DD4BF', '#FFFFFF',
];
const KID_COLORS = [
  '#FF6B6B', '#FFA94D', '#FFD93D', '#6BCB77', '#4D96FF',
  '#9B59B6', '#FF69B4', '#00CED1', '#2DD4BF', '#F97316',
  '#FFFFFF', '#000000',
];

// ── Brush size presets per age segment ──
const TODDLER_SIZES = [8, 16, 32];
const LEARNER_SIZES = [4, 8, 12, 20, 32];
const KID_SIZES = [2, 4, 8, 16, 32];

// ── Tool definitions ──
const TOOL_META: Record<DrawingTool, { emoji: string; label: string }> = {
  brush: { emoji: '🖌️', label: 'Brush' },
  eraser: { emoji: '🧹', label: 'Eraser' },
  fill: { emoji: '🪣', label: 'Fill' },
};

// ── Color names for ARIA ──
const COLOR_NAMES: Record<string, string> = {
  '#FF6B6B': 'Red',
  '#FFA94D': 'Orange',
  '#FFD93D': 'Yellow',
  '#6BCB77': 'Green',
  '#4D96FF': 'Blue',
  '#9B59B6': 'Purple',
  '#FF69B4': 'Pink',
  '#00CED1': 'Cyan',
  '#2DD4BF': 'Teal',
  '#F97316': 'Deep orange',
  '#FFFFFF': 'White',
  '#000000': 'Black',
};

// ── Helper: load drawings from localStorage ──
function loadDrawings(): SavedDrawing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedDrawing[]) : [];
  } catch {
    return [];
  }
}

// ── Helper: save drawings to localStorage ──
function persistDrawings(drawings: SavedDrawing[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drawings));
  } catch {
    // localStorage full — silently fail
  }
}

// ══════════════════════════════════════════════════════════
// DrawingCanvas Component
// ══════════════════════════════════════════════════════════
export default function DrawingCanvas() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { activeChildProfile } = useAuthStore();
  const { playClick, playPop, playSuccess } = useSoundEffects();

  // Age-adaptive config
  const age = activeChildProfile?.age ?? 5;
  const config = useAgeAdaptiveConfig(age);
  const segment = config.segment;

  // ── Derived age config ──
  const isToddler = segment === 'toddler';
  const isKid = segment === 'kid';
  const isLearner = segment === 'early-learner';

  const availableColors = isToddler ? TODDLER_COLORS : isLearner ? LEARNER_COLORS : KID_COLORS;
  const availableSizes = isToddler ? TODDLER_SIZES : isLearner ? LEARNER_SIZES : KID_SIZES;
  const availableTools: DrawingTool[] = isToddler
    ? ['brush']
    : isLearner
      ? ['brush', 'eraser']
      : ['brush', 'eraser', 'fill'];
  const colorBtnSize = isToddler ? 'w-16 h-16 md:w-20 md:h-20' : isLearner ? 'w-10 h-10 md:w-12 md:h-12' : 'w-8 h-8 md:w-10 md:h-10';
  const sizeBtnSize = isToddler ? 'w-16 h-16 md:w-20 md:h-20' : isLearner ? 'w-10 h-10 md:w-12 md:h-12' : 'w-9 h-9 md:w-10 md:h-10';
  const toolBtnSize = isToddler ? 'w-16 h-16 md:w-20 md:h-20' : isLearner ? 'w-12 h-12 md:w-14 md:h-14' : 'w-10 h-10 md:w-12 md:h-12';

  // ── State ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<DrawingTool>('brush');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(availableSizes[1] ?? 8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [canvasGlow, setCanvasGlow] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // ── Refs for sound debouncing ──
  const hasDrawn = useRef(false);

  // ── Canvas init ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = Math.min(Math.round(width * 0.6), 500);
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const initial = ctx.getImageData(0, 0, width, height);
    setUndoStack([initial]);
    setRedoStack([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoStack, redoStack]);

  // ── Canvas coordinate helper ──
  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0]!.clientX - rect.left) * scaleX,
        y: (e.touches[0]!.clientY - rect.top) * scaleY,
      };
    }
    if ('clientX' in e) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
    return { x: 0, y: 0 };
  }, []);

  // ── Push undo state ──
  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev.slice(-(MAX_UNDO - 1)), state]);
    setRedoStack([]);
  }, []);

  // ── Start drawing ──
  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      e.preventDefault();
    }
    setIsDrawing(true);
    setCanvasGlow(true);
    lastPos.current = getCanvasPos(e);
    hasDrawn.current = false;

    // Play pop on first stroke
    if (!hasDrawn.current) {
      playPop();
      hasDrawn.current = true;
    }

    // Draw a dot at the start position for single-click dots
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = lastPos.current;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (tool === 'eraser' ? brushSize * 2 : brushSize) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.fill();
  }, [getCanvasPos, playPop, brushSize, tool, color]);

  // ── Continue drawing ──
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos.current) return;
    if ('touches' in e) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 2 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
  }, [isDrawing, getCanvasPos, tool, color, brushSize]);

  // ── End drawing ──
  const endDraw = useCallback(() => {
    if (isDrawing) {
      pushUndo();
      setIsDrawing(false);
      lastPos.current = null;
      setCanvasGlow(false);
    }
  }, [isDrawing, pushUndo]);

  // ── Undo ──
  const handleUndo = useCallback(() => {
    if (undoStack.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newUndo = [...undoStack];
    const current = newUndo.pop()!;
    const prev = newUndo[newUndo.length - 1];
    if (!prev) return;

    ctx.putImageData(prev, 0, 0);
    setUndoStack(newUndo);
    setRedoStack((r) => [...r, current]);
    playClick();
  }, [undoStack, playClick]);

  // ── Redo ──
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newRedo = [...redoStack];
    const next = newRedo.pop()!;
    ctx.putImageData(next, 0, 0);
    setUndoStack((u) => [...u, next]);
    setRedoStack(newRedo);
    playClick();
  }, [redoStack, playClick]);

  // ── Clear canvas ──
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // For toddlers, clear immediately without confirmation
    if (isToddler) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      pushUndo();
      return;
    }
    setShowClearConfirm(true);
  }, [isToddler, pushUndo]);

  const confirmClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushUndo();
    setShowClearConfirm(false);
    playClick();
  }, [pushUndo, playClick]);

  // ── Fill canvas (simplified: fill entire canvas) ──
  const handleFill = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushUndo();
    playPop();
  }, [color, pushUndo, playPop]);

  // ── Fill tool intercept: when fill tool is selected and canvas is clicked ──
  const handleCanvasClick = useCallback(() => {
    if (tool === 'fill') {
      handleFill();
    }
  }, [tool, handleFill]);

  // ── Save to localStorage ──
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const childId = activeChildProfile?.id ?? 'unknown';
    const parentId = activeChildProfile?.parentId ?? 'unknown';

    const dataURL = canvas.toDataURL('image/png');
    const drawing: SavedDrawing = {
      id: generateId('kv-drawing'),
      childId,
      parentId,
      title: `Drawing by ${activeChildProfile?.name ?? 'Artist'}`,
      dataURL,
      width: canvas.width,
      height: canvas.height,
      createdAt: new Date().toISOString(),
    };

    const existing = loadDrawings();
    existing.push(drawing);
    persistDrawings(existing);

    // Show confirmation
    playSuccess();
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [activeChildProfile, playSuccess]);

  // ── Firestore mutations ──
  const saveMetadataMutation = useMutation({
    mutationFn: async () => {
      const canvas = canvasRef.current;
      if (!canvas || !activeChildProfile) return;

      await saveDrawingMetadata({
        childId: activeChildProfile.id,
        parentId: activeChildProfile.parentId,
        storagePath: `drawings/${activeChildProfile.id}/${Date.now()}.png`,
        downloadURL: '',
        thumbnailURL: '',
        width: canvas.width,
        height: canvas.height,
        createdAt: new Date(),
      });
    },
  });

  const trackProgressMutation = useMutation({
    mutationFn: async () => {
      if (!activeChildProfile) return;
      await upsertProgress({
        childId: activeChildProfile.id,
        parentId: activeChildProfile.parentId,
        moduleId: 'creative' as LearningModuleId,
        completed: true,
        stars: 2,
        percentComplete: 100,
        lastAccessedAt: new Date(),
        completedAt: new Date(),
      });
    },
  });

  // ── Combined save handler ──
  const handleFullSave = useCallback(() => {
    handleSave();
    saveMetadataMutation.mutate();
    trackProgressMutation.mutate();
  }, [handleSave, saveMetadataMutation, trackProgressMutation]);

  // ── Tool selection handler ──
  const selectTool = useCallback((t: DrawingTool) => {
    setTool(t);
    playClick();
    // If fill tool is selected, trigger fill immediately
    if (t === 'fill') {
      handleFill();
    }
  }, [playClick, handleFill]);

  // ── Color selection handler ──
  const selectColor = useCallback((c: string) => {
    setColor(c);
    if (tool === 'eraser') {
      setTool('brush');
    }
    playClick();
  }, [tool, playClick]);

  // ── Brush size selection handler ──
  const selectSize = useCallback((s: number) => {
    setBrushSize(s);
    playClick();
  }, [playClick]);

  // ── Custom color apply ──
  const applyCustomColor = useCallback(() => {
    if (customColor) {
      selectColor(customColor);
    }
  }, [customColor, selectColor]);

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
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
          <h1 className="text-2xl md:text-3xl font-display text-kv-orange">
            {isToddler ? '🎨 Draw!' : 'Drawing Canvas'}
          </h1>
          {!isToddler && (
            <p className="text-kv-gray-500 text-sm mt-0.5">Create your masterpiece!</p>
          )}
        </div>
        <Button
          variant="ghost"
          size={isToddler ? 'lg' : 'sm'}
          onClick={() => navigate(`/kids/${profileId}`)}
          aria-label="Home"
          leftIcon={<IconHome size={20} />}
        />
      </AnimatedContainer>

      {/* ── Toolbar ── */}
      <AnimatedContainer variant="slideUp" delay={0.1}>
        <Card variant="elevated" padding="sm" className="overflow-hidden">
          <div className="flex flex-col gap-3 p-2 md:p-3">

            {/* Row 1: Tools + Actions */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              {/* Drawing Tools */}
              <div className="flex gap-2" role="radiogroup" aria-label="Drawing tools">
                {availableTools.map((t) => (
                  <motion.button
                    key={t}
                    type="button"
                    onClick={() => selectTool(t)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'kv-button-base rounded-2xl flex flex-col items-center justify-center gap-0.5 font-bold transition-colors',
                      toolBtnSize,
                      tool === t
                        ? 'bg-kv-orange text-white shadow-button ring-2 ring-kv-orange/40'
                        : 'bg-kv-gray-50 text-kv-gray-600 border-2 border-kv-gray-200 hover:border-kv-orange/40',
                    )}
                    aria-label={`${TOOL_META[t].label} tool`}
                    aria-pressed={tool === t}
                    role="radio"
                  >
                    <span className="text-xl md:text-2xl" aria-hidden="true">{TOOL_META[t].emoji}</span>
                    {config.showTextLabels && (
                      <span className="text-[10px] md:text-xs leading-tight">{TOOL_META[t].label}</span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-10 bg-kv-gray-200" />

              {/* Undo / Redo */}
              {!isToddler && (
                <div className="flex gap-1.5">
                  <motion.button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length <= 1}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'kv-button-base rounded-xl flex items-center justify-center',
                      'bg-kv-gray-50 text-kv-gray-500 border border-kv-gray-200',
                      sizeBtnSize,
                      undoStack.length <= 1 && 'opacity-30 cursor-not-allowed',
                    )}
                    aria-label="Undo last stroke"
                  >
                    <span className="text-lg md:text-xl" aria-hidden="true">↩️</span>
                    {config.showTextLabels && <span className="text-[10px] md:text-xs ml-1">Undo</span>}
                  </motion.button>

                  {isKid && (
                    <motion.button
                      type="button"
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className={cn(
                        'kv-button-base rounded-xl flex items-center justify-center',
                        'bg-kv-gray-50 text-kv-gray-500 border border-kv-gray-200',
                        sizeBtnSize,
                        redoStack.length === 0 && 'opacity-30 cursor-not-allowed',
                      )}
                      aria-label="Redo last stroke"
                    >
                      <span className="text-lg md:text-xl" aria-hidden="true">↪️</span>
                      {config.showTextLabels && <span className="text-[10px] md:text-xs ml-1">Redo</span>}
                    </motion.button>
                  )}
                </div>
              )}

              {/* Clear Button */}
              <motion.button
                type="button"
                onClick={handleClear}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className={cn(
                  'kv-button-base rounded-xl flex items-center justify-center',
                  'bg-kv-gray-50 text-kv-red border border-kv-gray-200 hover:bg-red-50',
                  sizeBtnSize,
                )}
                aria-label="Clear canvas"
              >
                <span className="text-lg md:text-xl" aria-hidden="true">🗑️</span>
                {config.showTextLabels && <span className="text-[10px] md:text-xs ml-1">Clear</span>}
              </motion.button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Save Button */}
              <MotionButton
                variant="success"
                size={isToddler ? 'toddler' : 'lg'}
                onClick={handleFullSave}
                loading={saveMetadataMutation.isPending}
                leftIcon={<span aria-hidden="true">💾</span>}
                aria-label="Save drawing to gallery"
                className="min-w-fit"
              >
                {isToddler ? '💾 Save' : config.showTextLabels ? 'Save to Gallery' : '💾'}
              </MotionButton>
            </div>

            {/* Row 2: Colors */}
            <div className="flex items-center gap-2 flex-wrap" role="radiogroup" aria-label="Color picker">
              {availableColors.map((c) => (
                <motion.button
                  key={c}
                  type="button"
                  onClick={() => selectColor(c)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'rounded-full border-2 transition-shadow focus-visible:ring-2 focus-visible:ring-kv-orange',
                    colorBtnSize,
                    color === c && tool === 'brush'
                      ? 'border-kv-gray-800 ring-2 ring-kv-orange/50 shadow-lg scale-110'
                      : 'border-kv-gray-300 hover:border-kv-gray-500',
                    c === '#FFFFFF' && 'border-kv-gray-400',
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Select ${COLOR_NAMES[c] ?? 'custom'} color`}
                  role="radio"
                  aria-checked={color === c && tool === 'brush'}
                />
              ))}

              {/* Custom color picker (kids only) */}
              {isKid && (
                <div className="flex items-center gap-1.5 ml-1">
                  <label className="sr-only" htmlFor="custom-color-input">Custom color hex value</label>
                  <input
                    id="custom-color-input"
                    type="color"
                    value={customColor || '#FF6B6B'}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-kv-gray-300 cursor-pointer bg-transparent"
                    aria-label="Custom color picker"
                  />
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={applyCustomColor}
                    disabled={!customColor}
                    aria-label="Apply custom color"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>

            {/* Row 3: Brush Sizes */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap" role="radiogroup" aria-label="Brush size selector">
              {config.showTextLabels && (
                <span className="text-xs text-kv-gray-500 font-bold uppercase tracking-wider min-w-fit">
                  {isToddler ? '✏️' : 'Size'}
                </span>
              )}
              {availableSizes.map((size) => (
                <motion.button
                  key={size}
                  type="button"
                  onClick={() => selectSize(size)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'kv-button-base rounded-xl flex items-center justify-center',
                    'bg-kv-gray-50 border-2 transition-colors',
                    sizeBtnSize,
                    brushSize === size
                      ? 'border-kv-orange bg-kv-orange/10 ring-2 ring-kv-orange/40'
                      : 'border-kv-gray-200 hover:border-kv-gray-400',
                  )}
                  aria-label={`Brush size ${size} pixels`}
                  role="radio"
                  aria-checked={brushSize === size}
                >
                  <span
                    className="rounded-full bg-kv-gray-700"
                    style={{ width: Math.min(size, 28), height: Math.min(size, 28) }}
                    aria-hidden="true"
                  />
                </motion.button>
              ))}

              {/* Active tool indicator */}
              <div className="ml-auto">
                <Badge variant="primary" size="sm" icon={<span aria-hidden="true">{TOOL_META[tool].emoji}</span>}>
                  {config.showTextLabels ? TOOL_META[tool].label : (isToddler ? '🎨' : '')}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedContainer>

      {/* ── Canvas Area ── */}
      <AnimatedContainer variant="slideUp" delay={0.2}>
        <div
          ref={containerRef}
          className={cn(
            'relative rounded-2xl overflow-hidden shadow-card transition-shadow duration-300',
            canvasGlow && 'ring-3 ring-kv-orange/50 shadow-card-hover',
          )}
        >
          <canvas
            ref={canvasRef}
            className="w-full block cursor-crosshair touch-none rounded-2xl"
            onMouseDown={(e) => { startDraw(e); handleCanvasClick(); }}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
            onContextMenu={(e) => e.preventDefault()}
            role="img"
            aria-label="Drawing canvas — use your mouse or finger to draw"
          />

          {/* Saved confirmation overlay */}
          <AnimatePresence>
            {showSaved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl pointer-events-none"
              >
                <AnimatedContainer variant="pop" className="flex flex-col items-center gap-2">
                  <span className="text-6xl" aria-hidden="true">✅</span>
                  <span className="text-2xl font-display font-bold text-kv-green">Saved!</span>
                </AnimatedContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AnimatedContainer>

      {/* ── Auto-save hint for toddlers ── */}
      {isToddler && (
        <AnimatedContainer variant="fade" delay={0.4}>
          <p className="text-center text-kv-gray-400 text-xs">
            💡 Tap &quot;Save&quot; to keep your drawing!
          </p>
        </AnimatedContainer>
      )}

      {/* ── Keyboard shortcut hint for kids ── */}
      {isKid && (
        <AnimatedContainer variant="fade" delay={0.4}>
          <p className="text-center text-kv-gray-400 text-xs">
            💡 Tip: Press Ctrl+Z to undo, Ctrl+Y to redo
          </p>
        </AnimatedContainer>
      )}

      {/* ── Gallery Link ── */}
      <AnimatedContainer variant="slideUp" delay={0.3}>
        <div className="text-center">
          <MotionButton
            variant="premium"
            size={isToddler ? 'lg' : 'md'}
            onClick={() => navigate(`/create/gallery/${profileId}`)}
            leftIcon={<span aria-hidden="true">🖼️</span>}
            aria-label="View saved drawings gallery"
            fullWidth
          >
            {isToddler ? '🖼️ My Drawings' : 'View My Gallery'}
          </MotionButton>
        </div>
      </AnimatedContainer>

      {/* ── Clear Confirmation Dialog (not for toddlers) ── */}
      {!isToddler && (
        <ConfirmDialog
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={confirmClear}
          title="Clear Canvas"
          message="Are you sure you want to clear the canvas? This will erase your entire drawing and cannot be undone."
          confirmLabel="Clear"
          cancelLabel="Keep Drawing"
          variant="danger"
        />
      )}
    </div>
  );
}
