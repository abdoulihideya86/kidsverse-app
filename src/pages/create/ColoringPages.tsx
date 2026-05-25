import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { upsertProgress, awardBadge } from '@/lib/firestore';
import { cn } from '@/lib/utils';
import {
  Card, MotionButton, Button, Badge, ConfirmDialog,
  IconArrowLeft, IconHome, AnimatedContainer, ProgressBar,
} from '@/components';
import type { LearningModuleId } from '@/types';

// ── Types ──
interface ColoringShape {
  id: string;
  label: string;
}

interface ColoringPage {
  id: string;
  title: string;
  emoji: string;
  gradient: string;
  ageMin: number;
  shapes: ColoringShape[];
}


// ── Color palettes per segment ──
const TODDLER_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF69B4', '#FFA94D'];
const LEARNER_COLORS = [
  '#FF6B6B', '#FFA94D', '#FFD93D', '#6BCB77', '#4D96FF',
  '#9B59B6', '#FF69B4', '#00CED1', '#2DD4BF', '#FFFFFF',
];
const KID_COLORS = [
  '#FF6B6B', '#FFA94D', '#FFD93D', '#6BCB77', '#4D96FF',
  '#9B59B6', '#FF69B4', '#00CED1', '#2DD4BF', '#F97316',
  '#8B4513', '#000000',
];

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
  '#8B4513': 'Brown',
  '#FFFFFF': 'White',
  '#000000': 'Black',
};

// ── 8 Coloring Pages ──
const ALL_PAGES: ColoringPage[] = [
  {
    id: 'flower', title: 'Garden Flower', emoji: '🌸',
    gradient: 'from-pink-400 to-rose-400', ageMin: 2,
    shapes: [
      { id: 'petal1', label: 'Top Petal' }, { id: 'petal2', label: 'Right Petal' },
      { id: 'petal3', label: 'Bottom Petal' }, { id: 'petal4', label: 'Left Petal' },
      { id: 'center', label: 'Flower Center' }, { id: 'stem', label: 'Stem' },
      { id: 'leaf1', label: 'Left Leaf' }, { id: 'leaf2', label: 'Right Leaf' },
      { id: 'butterfly1', label: 'Butterfly Wing Left' }, { id: 'butterfly2', label: 'Butterfly Wing Right' },
    ],
  },
  {
    id: 'house', title: 'Cozy House', emoji: '🏠',
    gradient: 'from-amber-400 to-orange-400', ageMin: 2,
    shapes: [
      { id: 'wall', label: 'Wall' }, { id: 'roof', label: 'Roof' },
      { id: 'door', label: 'Door' }, { id: 'window1', label: 'Left Window' },
      { id: 'window2', label: 'Right Window' }, { id: 'chimney', label: 'Chimney' },
      { id: 'sun', label: 'Sun' }, { id: 'cloud1', label: 'Cloud' },
      { id: 'fence', label: 'Fence' },
    ],
  },
  {
    id: 'rocket', title: 'Space Rocket', emoji: '🚀',
    gradient: 'from-blue-400 to-indigo-400', ageMin: 2,
    shapes: [
      { id: 'body', label: 'Rocket Body' }, { id: 'nose', label: 'Nose Cone' },
      { id: 'window', label: 'Window' }, { id: 'fin1', label: 'Left Fin' },
      { id: 'fin2', label: 'Right Fin' }, { id: 'flame', label: 'Flame' },
      { id: 'star1', label: 'Star' }, { id: 'star2', label: 'Star' },
      { id: 'planet', label: 'Planet' },
    ],
  },
  {
    id: 'safari', title: 'Safari Animals', emoji: '🦁',
    gradient: 'from-yellow-400 to-amber-500', ageMin: 3,
    shapes: [
      { id: 'lion', label: 'Lion' }, { id: 'giraffe', label: 'Giraffe' },
      { id: 'elephant', label: 'Elephant' }, { id: 'tree1', label: 'Acacia Tree' },
      { id: 'sun', label: 'Sun' }, { id: 'ground', label: 'Ground' },
      { id: 'bird', label: 'Bird' }, { id: 'cloud', label: 'Cloud' },
    ],
  },
  {
    id: 'ocean', title: 'Under the Sea', emoji: '🧜‍♀️',
    gradient: 'from-cyan-400 to-blue-500', ageMin: 3,
    shapes: [
      { id: 'fish1', label: 'Tropical Fish' }, { id: 'fish2', label: 'Small Fish' },
      { id: 'octopus', label: 'Octopus' }, { id: 'coral1', label: 'Red Coral' },
      { id: 'coral2', label: 'Green Coral' }, { id: 'seaweed', label: 'Seaweed' },
      { id: 'bubble1', label: 'Bubble' }, { id: 'bubble2', label: 'Bubble' },
      { id: 'starfish', label: 'Starfish' }, { id: 'shell', label: 'Shell' },
    ],
  },
  {
    id: 'dinosaur', title: 'Dinosaur Park', emoji: '🦖',
    gradient: 'from-green-400 to-emerald-500', ageMin: 4,
    shapes: [
      { id: 'trex', label: 'T-Rex' }, { id: 'tree1', label: 'Palm Tree' },
      { id: 'tree2', label: 'Fern' }, { id: 'volcano', label: 'Volcano' },
      { id: 'cloud1', label: 'Cloud' }, { id: 'cloud2', label: 'Cloud' },
      { id: 'ground', label: 'Ground' }, { id: 'egg', label: 'Dino Egg' },
      { id: 'footprint', label: 'Footprint' },
    ],
  },
  {
    id: 'halloween', title: 'Halloween Night', emoji: '🎃',
    gradient: 'from-purple-500 to-indigo-600', ageMin: 5,
    shapes: [
      { id: 'pumpkin', label: 'Pumpkin' }, { id: 'ghost', label: 'Ghost' },
      { id: 'bat1', label: 'Bat' }, { id: 'bat2', label: 'Bat' },
      { id: 'moon', label: 'Moon' }, { id: 'star1', label: 'Star' },
      { id: 'star2', label: 'Star' }, { id: 'hat', label: 'Witch Hat' },
      { id: 'ground', label: 'Ground' },
    ],
  },
  {
    id: 'christmas', title: 'Christmas Scene', emoji: '🎄',
    gradient: 'from-red-400 to-green-500', ageMin: 5,
    shapes: [
      { id: 'tree', label: 'Christmas Tree' }, { id: 'ornament1', label: 'Red Ornament' },
      { id: 'ornament2', label: 'Blue Ornament' }, { id: 'ornament3', label: 'Gold Ornament' },
      { id: 'star', label: 'Tree Topper Star' }, { id: 'gift1', label: 'Red Gift' },
      { id: 'gift2', label: 'Blue Gift' }, { id: 'snowman', label: 'Snowman' },
      { id: 'snow', label: 'Snow Ground' },
    ],
  },
];

const MAX_UNDO = 20;

// ══════════════════════════════════════════════
// ColoringPages Component
// ══════════════════════════════════════════════
export default function ColoringPages() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { activeChildProfile } = useAuthStore();
  const { playClick, playPop, playSuccess } = useSoundEffects();

  const age = activeChildProfile?.age ?? 5;
  const config = useAgeAdaptiveConfig(age);
  const isToddler = config.segment === 'toddler';
  const isKid = config.segment === 'kid';

  // Filter pages by age
  const availablePages = useMemo(
    () => ALL_PAGES.filter((p) => age >= p.ageMin),
    [age]
  );

  // Color palette
  const availableColors = isToddler
    ? TODDLER_COLORS
    : config.segment === 'early-learner'
      ? LEARNER_COLORS
      : KID_COLORS;

  const colorBtnSize = isToddler
    ? 'w-14 h-14 md:w-16 md:h-16'
    : config.segment === 'early-learner'
      ? 'w-10 h-10 md:w-12 md:h-12'
      : 'w-8 h-8 md:w-10 md:h-10';

  // ── State ──
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(availableColors[0] ?? '#FF6B6B');
  const [filledShapes, setFilledShapes] = useState<Record<string, string>>({});
  const [undoStack, setUndoStack] = useState<Record<string, string>[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [completedPages, setCompletedPages] = useState<Set<string>>(new Set());

  const selectedPage = availablePages[selectedPageIdx];
  const filledCount = Object.keys(filledShapes).length;
  const totalShapes = selectedPage?.shapes.length ?? 0;
  const isPageComplete = filledCount === totalShapes && totalShapes > 0;

  // ── Handlers ──
  const handleShapeClick = useCallback((shapeId: string) => {
    if (!selectedColor) return;
    playPop();
    setUndoStack((prev) => [...prev.slice(-(MAX_UNDO - 1)), { ...filledShapes }]);
    setFilledShapes((prev) => ({ ...prev, [shapeId]: selectedColor }));
  }, [selectedColor, filledShapes, playPop]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    if (!prev) return;
    setFilledShapes(prev);
    setUndoStack((s) => s.slice(0, -1));
    playClick();
  }, [undoStack, playClick]);

  const handleClear = useCallback(() => {
    if (isToddler) {
      setFilledShapes({});
      setUndoStack([]);
      playClick();
      return;
    }
    setShowClearConfirm(true);
  }, [isToddler, playClick]);

  const confirmClear = useCallback(() => {
    setFilledShapes({});
    setUndoStack([]);
    setShowClearConfirm(false);
    playClick();
  }, [playClick]);

  const handlePageSelect = useCallback((idx: number) => {
    setSelectedPageIdx(idx);
    setFilledShapes({});
    setUndoStack([]);
    playClick();
  }, [playClick]);

  const handleColorSelect = useCallback((c: string) => {
    setSelectedColor(c);
    playClick();
  }, [playClick]);

  const applyCustomColor = useCallback(() => {
    if (customColor) {
      handleColorSelect(customColor);
    }
  }, [customColor, handleColorSelect]);

  // ── Page completion tracking ──
  const handlePageComplete = useCallback(() => {
    if (!selectedPage) return;
    playSuccess();
    const newCompleted = new Set(completedPages);
    newCompleted.add(selectedPage.id);
    setCompletedPages(newCompleted);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [selectedPage, completedPages, playSuccess]);

  // Detect completion
  const prevFilledCountRef = { current: 0 };
  if (filledCount === totalShapes && totalShapes > 0 && prevFilledCountRef.current < totalShapes) {
    if (!completedPages.has(selectedPage?.id ?? '')) {
      setTimeout(() => handlePageComplete(), 100);
    }
  }
  prevFilledCountRef.current = filledCount;

  // ── Firestore mutations ──
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

  const awardBadgeMutation = useMutation({
    mutationFn: async () => {
      if (!activeChildProfile) return;
      await awardBadge({
        childId: activeChildProfile.id,
        parentId: activeChildProfile.parentId,
        category: 'creative-master',
        name: 'Coloring Master',
        description: 'Completed 3 or more coloring pages!',
        icon: '🎨',
        earnedAt: new Date(),
      });
    },
  });

  const handleSaveProgress = useCallback(() => {
    trackProgressMutation.mutate();
    if (completedPages.size >= 3 && !awardBadgeMutation.isPending) {
      awardBadgeMutation.mutate();
    }
  }, [trackProgressMutation, awardBadgeMutation, completedPages.size]);

  // ── SVG rendering per page ──
  const renderSVG = useCallback((page: ColoringPage, fills: Record<string, string>) => {
    const f = (id: string) => fills[id] ?? 'none';

    switch (page.id) {
      case 'flower':
        return (
          <svg viewBox="0 0 400 350" className="w-full max-w-lg mx-auto" role="img" aria-label={`${page.title} coloring page`}>
            <rect width="400" height="350" fill="#FFF9F0" />
            {/* Stem */}
            <rect x="190" y="190" width="20" height="110" fill={f('stem')} stroke="#4A3728" strokeWidth="2" rx="4" onClick={() => handleShapeClick('stem')} style={{ cursor: 'pointer' }} role="button" aria-label="Stem" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('stem'); }} />
            {/* Petals */}
            <ellipse cx="200" cy="75" rx="35" ry="50" fill={f('petal1')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('petal1')} style={{ cursor: 'pointer' }} role="button" aria-label="Top Petal" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('petal1'); }} />
            <ellipse cx="260" cy="130" rx="35" ry="50" fill={f('petal2')} stroke="#4A3728" strokeWidth="2" transform="rotate(72 260 130)" onClick={() => handleShapeClick('petal2')} style={{ cursor: 'pointer' }} role="button" aria-label="Right Petal" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('petal2'); }} />
            <ellipse cx="200" cy="190" rx="35" ry="50" fill={f('petal3')} stroke="#4A3728" strokeWidth="2" transform="rotate(144 200 190)" onClick={() => handleShapeClick('petal3')} style={{ cursor: 'pointer' }} role="button" aria-label="Bottom Petal" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('petal3'); }} />
            <ellipse cx="140" cy="130" rx="35" ry="50" fill={f('petal4')} stroke="#4A3728" strokeWidth="2" transform="rotate(216 140 130)" onClick={() => handleShapeClick('petal4')} style={{ cursor: 'pointer' }} role="button" aria-label="Left Petal" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('petal4'); }} />
            {/* Center */}
            <circle cx="200" cy="130" r="25" fill={f('center')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('center')} style={{ cursor: 'pointer' }} role="button" aria-label="Flower Center" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('center'); }} />
            {/* Leaves */}
            <ellipse cx="155" cy="240" rx="30" ry="15" fill={f('leaf1')} stroke="#4A3728" strokeWidth="2" transform="rotate(-30 155 240)" onClick={() => handleShapeClick('leaf1')} style={{ cursor: 'pointer' }} role="button" aria-label="Left Leaf" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('leaf1'); }} />
            <ellipse cx="245" cy="250" rx="30" ry="15" fill={f('leaf2')} stroke="#4A3728" strokeWidth="2" transform="rotate(30 245 250)" onClick={() => handleShapeClick('leaf2')} style={{ cursor: 'pointer' }} role="button" aria-label="Right Leaf" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('leaf2'); }} />
            {/* Butterfly */}
            <ellipse cx="310" cy="70" rx="18" ry="24" fill={f('butterfly1')} stroke="#4A3728" strokeWidth="1.5" transform="rotate(-20 310 70)" onClick={() => handleShapeClick('butterfly1')} style={{ cursor: 'pointer' }} role="button" aria-label="Butterfly Wing Left" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('butterfly1'); }} />
            <ellipse cx="340" cy="70" rx="18" ry="24" fill={f('butterfly2')} stroke="#4A3728" strokeWidth="1.5" transform="rotate(20 340 70)" onClick={() => handleShapeClick('butterfly2')} style={{ cursor: 'pointer' }} role="button" aria-label="Butterfly Wing Right" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('butterfly2'); }} />
          </svg>
        );

      case 'house':
        return (
          <svg viewBox="0 0 400 320" className="w-full max-w-lg mx-auto" role="img" aria-label={`${page.title} coloring page`}>
            <rect width="400" height="320" fill="#E8F4FD" />
            {/* Sun */}
            <circle cx="350" cy="50" r="30" fill={f('sun')} stroke="#F59E0B" strokeWidth="2" onClick={() => handleShapeClick('sun')} style={{ cursor: 'pointer' }} role="button" aria-label="Sun" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('sun'); }} />
            {/* Cloud */}
            <ellipse cx="90" cy="60" rx="40" ry="20" fill={f('cloud1')} stroke="#94A3B8" strokeWidth="1.5" onClick={() => handleShapeClick('cloud1')} style={{ cursor: 'pointer' }} role="button" aria-label="Cloud" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('cloud1'); }} />
            {/* Roof */}
            <polygon points="200,40 320,120 80,120" fill={f('roof')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('roof')} style={{ cursor: 'pointer' }} role="button" aria-label="Roof" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('roof'); }} />
            {/* Chimney */}
            <rect x="250" y="50" width="30" height="60" fill={f('chimney')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('chimney')} style={{ cursor: 'pointer' }} role="button" aria-label="Chimney" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('chimney'); }} />
            {/* Wall */}
            <rect x="110" y="120" width="180" height="140" fill={f('wall')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('wall')} style={{ cursor: 'pointer' }} role="button" aria-label="Wall" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('wall'); }} />
            {/* Door */}
            <rect x="175" y="200" width="50" height="60" fill={f('door')} stroke="#4A3728" strokeWidth="2" rx="3" onClick={() => handleShapeClick('door')} style={{ cursor: 'pointer' }} role="button" aria-label="Door" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('door'); }} />
            {/* Windows */}
            <rect x="125" y="150" width="35" height="35" fill={f('window1')} stroke="#4A3728" strokeWidth="2" rx="2" onClick={() => handleShapeClick('window1')} style={{ cursor: 'pointer' }} role="button" aria-label="Left Window" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('window1'); }} />
            <rect x="240" y="150" width="35" height="35" fill={f('window2')} stroke="#4A3728" strokeWidth="2" rx="2" onClick={() => handleShapeClick('window2')} style={{ cursor: 'pointer' }} role="button" aria-label="Right Window" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('window2'); }} />
            {/* Fence */}
            <rect x="40" y="250" width="8" height="40" fill={f('fence')} stroke="#4A3728" strokeWidth="1" onClick={() => handleShapeClick('fence')} style={{ cursor: 'pointer' }} role="button" aria-label="Fence" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('fence'); }} />
            <rect x="55" y="240" width="8" height="50" fill={f('fence')} stroke="#4A3728" strokeWidth="1" style={{ cursor: 'pointer' }} />
            <rect x="30" y="260" width="45" height="6" fill={f('fence')} stroke="#4A3728" strokeWidth="1" style={{ cursor: 'pointer' }} />
            <rect x="30" y="280" width="45" height="6" fill={f('fence')} stroke="#4A3728" strokeWidth="1" style={{ cursor: 'pointer' }} />
          </svg>
        );

      case 'rocket':
        return (
          <svg viewBox="0 0 400 350" className="w-full max-w-lg mx-auto" role="img" aria-label={`${page.title} coloring page`}>
            <rect width="400" height="350" fill="#0F172A" />
            {/* Stars */}
            <circle cx="80" cy="60" r="5" fill={f('star1')} onClick={() => handleShapeClick('star1')} style={{ cursor: 'pointer' }} role="button" aria-label="Star" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('star1'); }} />
            <circle cx="320" cy="90" r="4" fill={f('star2')} onClick={() => handleShapeClick('star2')} style={{ cursor: 'pointer' }} role="button" aria-label="Star" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('star2'); }} />
            {/* Planet */}
            <circle cx="340" cy="250" r="30" fill={f('planet')} stroke="#6366F1" strokeWidth="2" onClick={() => handleShapeClick('planet')} style={{ cursor: 'pointer' }} role="button" aria-label="Planet" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('planet'); }} />
            {/* Body */}
            <rect x="160" y="100" width="80" height="160" fill={f('body')} stroke="#4A3728" strokeWidth="2" rx="10" onClick={() => handleShapeClick('body')} style={{ cursor: 'pointer' }} role="button" aria-label="Rocket Body" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('body'); }} />
            {/* Nose */}
            <polygon points="200,30 245,100 155,100" fill={f('nose')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('nose')} style={{ cursor: 'pointer' }} role="button" aria-label="Nose Cone" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('nose'); }} />
            {/* Window */}
            <circle cx="200" cy="145" r="22" fill={f('window')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('window')} style={{ cursor: 'pointer' }} role="button" aria-label="Window" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('window'); }} />
            {/* Fins */}
            <polygon points="160,220 120,280 160,260" fill={f('fin1')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('fin1')} style={{ cursor: 'pointer' }} role="button" aria-label="Left Fin" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('fin1'); }} />
            <polygon points="240,220 280,280 240,260" fill={f('fin2')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('fin2')} style={{ cursor: 'pointer' }} role="button" aria-label="Right Fin" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('fin2'); }} />
            {/* Flame */}
            <ellipse cx="200" cy="285" rx="25" ry="35" fill={f('flame')} stroke="#EF4444" strokeWidth="2" onClick={() => handleShapeClick('flame')} style={{ cursor: 'pointer' }} role="button" aria-label="Flame" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('flame'); }} />
          </svg>
        );

      case 'safari':
        return (
          <svg viewBox="0 0 400 320" className="w-full max-w-lg mx-auto" role="img" aria-label={`${page.title} coloring page`}>
            <rect width="400" height="320" fill="#FEF3C7" />
            {/* Sun */}
            <circle cx="350" cy="50" r="35" fill={f('sun')} stroke="#F59E0B" strokeWidth="2" onClick={() => handleShapeClick('sun')} style={{ cursor: 'pointer' }} role="button" aria-label="Sun" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('sun'); }} />
            {/* Cloud */}
            <ellipse cx="70" cy="50" rx="35" ry="18" fill={f('cloud')} stroke="#94A3B8" strokeWidth="1.5" onClick={() => handleShapeClick('cloud')} style={{ cursor: 'pointer' }} role="button" aria-label="Cloud" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('cloud'); }} />
            {/* Tree */}
            <rect x="90" y="120" width="15" height="100" fill={f('tree1')} stroke="#4A3728" strokeWidth="1.5" onClick={() => handleShapeClick('tree1')} style={{ cursor: 'pointer' }} role="button" aria-label="Acacia Tree" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('tree1'); }} />
            <ellipse cx="97" cy="100" rx="50" ry="35" fill={f('tree1')} stroke="#4A3728" strokeWidth="1.5" style={{ cursor: 'pointer' }} />
            {/* Ground */}
            <rect x="0" y="240" width="400" height="80" fill={f('ground')} stroke="#92400E" strokeWidth="1.5" onClick={() => handleShapeClick('ground')} style={{ cursor: 'pointer' }} role="button" aria-label="Ground" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('ground'); }} />
            {/* Lion */}
            <ellipse cx="220" cy="220" rx="35" ry="25" fill={f('lion')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('lion')} style={{ cursor: 'pointer' }} role="button" aria-label="Lion" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('lion'); }} />
            <circle cx="220" cy="195" r="18" fill={f('lion')} stroke="#4A3728" strokeWidth="2" style={{ cursor: 'pointer' }} />
            {/* Giraffe */}
            <rect x="290" y="140" width="18" height="100" fill={f('giraffe')} stroke="#4A3728" strokeWidth="2" rx="6" onClick={() => handleShapeClick('giraffe')} style={{ cursor: 'pointer' }} role="button" aria-label="Giraffe" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('giraffe'); }} />
            <ellipse cx="299" cy="130" rx="15" ry="18" fill={f('giraffe')} stroke="#4A3728" strokeWidth="2" style={{ cursor: 'pointer' }} />
            {/* Elephant */}
            <ellipse cx="150" cy="225" rx="45" ry="30" fill={f('elephant')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('elephant')} style={{ cursor: 'pointer' }} role="button" aria-label="Elephant" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('elephant'); }} />
            <circle cx="110" cy="215" r="16" fill={f('elephant')} stroke="#4A3728" strokeWidth="2" style={{ cursor: 'pointer' }} />
            {/* Bird */}
            <path d="M300 60 Q310 45 320 60 Q310 55 300 60Z" fill={f('bird')} onClick={() => handleShapeClick('bird')} style={{ cursor: 'pointer' }} role="button" aria-label="Bird" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('bird'); }} />
          </svg>
        );

      case 'ocean':
        return (
          <svg viewBox="0 0 400 320" className="w-full max-w-lg mx-auto" role="img" aria-label={`${page.title} coloring page`}>
            <rect width="400" height="320" fill="#DBEAFE" />
            {/* Water background gradient implied by shapes */}
            {/* Seaweed */}
            <path d="M40 310 Q50 250 35 200 Q50 150 40 100" fill="none" stroke={f('seaweed') === 'none' ? '#4A3728' : f('seaweed')} strokeWidth="8" strokeLinecap="round" onClick={() => handleShapeClick('seaweed')} style={{ cursor: 'pointer' }} role="button" aria-label="Seaweed" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('seaweed'); }} />
            {/* Coral 1 */}
            <ellipse cx="120" cy="280" rx="30" ry="40" fill={f('coral1')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('coral1')} style={{ cursor: 'pointer' }} role="button" aria-label="Red Coral" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('coral1'); }} />
            {/* Coral 2 */}
            <ellipse cx="300" cy="285" rx="25" ry="35" fill={f('coral2')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('coral2')} style={{ cursor: 'pointer' }} role="button" aria-label="Green Coral" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('coral2'); }} />
            {/* Fish 1 */}
            <ellipse cx="220" cy="120" rx="30" ry="18" fill={f('fish1')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('fish1')} style={{ cursor: 'pointer' }} role="button" aria-label="Tropical Fish" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('fish1'); }} />
            <polygon points="250,120 275,105 275,135" fill={f('fish1')} stroke="#4A3728" strokeWidth="1.5" style={{ cursor: 'pointer' }} />
            {/* Fish 2 */}
            <ellipse cx="140" cy="170" rx="20" ry="12" fill={f('fish2')} stroke="#4A3728" strokeWidth="1.5" onClick={() => handleShapeClick('fish2')} style={{ cursor: 'pointer' }} role="button" aria-label="Small Fish" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('fish2'); }} />
            {/* Octopus */}
            <ellipse cx="300" cy="160" rx="30" ry="25" fill={f('octopus')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('octopus')} style={{ cursor: 'pointer' }} role="button" aria-label="Octopus" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('octopus'); }} />
            {/* Bubbles */}
            <circle cx="180" cy="80" r="8" fill={f('bubble1')} stroke="#93C5FD" strokeWidth="1.5" onClick={() => handleShapeClick('bubble1')} style={{ cursor: 'pointer' }} role="button" aria-label="Bubble" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('bubble1'); }} />
            <circle cx="200" cy="55" r="6" fill={f('bubble2')} stroke="#93C5FD" strokeWidth="1.5" onClick={() => handleShapeClick('bubble2')} style={{ cursor: 'pointer' }} role="button" aria-label="Bubble" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('bubble2'); }} />
            {/* Starfish */}
            <polygon points="350,300 358,315 375,315 362,325 366,342 350,332 334,342 338,325 325,315 342,315" fill={f('starfish')} stroke="#4A3728" strokeWidth="1.5" onClick={() => handleShapeClick('starfish')} style={{ cursor: 'pointer' }} role="button" aria-label="Starfish" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('starfish'); }} />
            {/* Shell */}
            <ellipse cx="70" cy="300" rx="18" ry="14" fill={f('shell')} stroke="#4A3728" strokeWidth="1.5" onClick={() => handleShapeClick('shell')} style={{ cursor: 'pointer' }} role="button" aria-label="Shell" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('shell'); }} />
          </svg>
        );

      case 'dinosaur':
        return (
          <svg viewBox="0 0 400 320" className="w-full max-w-lg mx-auto" role="img" aria-label={`${page.title} coloring page`}>
            <rect width="400" height="320" fill="#ECFDF5" />
            {/* Clouds */}
            <ellipse cx="80" cy="50" rx="30" ry="15" fill={f('cloud1')} stroke="#94A3B8" strokeWidth="1.5" onClick={() => handleShapeClick('cloud1')} style={{ cursor: 'pointer' }} role="button" aria-label="Cloud" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('cloud1'); }} />
            <ellipse cx="300" cy="40" rx="25" ry="12" fill={f('cloud2')} stroke="#94A3B8" strokeWidth="1.5" onClick={() => handleShapeClick('cloud2')} style={{ cursor: 'pointer' }} role="button" aria-label="Cloud" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('cloud2'); }} />
            {/* Volcano */}
            <polygon points="320,260 360,100 400,260" fill={f('volcano')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('volcano')} style={{ cursor: 'pointer' }} role="button" aria-label="Volcano" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('volcano'); }} />
            {/* Trees */}
            <rect x="60" y="180" width="10" height="60" fill={f('tree1')} stroke="#4A3728" strokeWidth="1" onClick={() => handleShapeClick('tree1')} style={{ cursor: 'pointer' }} role="button" aria-label="Palm Tree" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('tree1'); }} />
            <ellipse cx="65" cy="170" rx="25" ry="20" fill={f('tree1')} stroke="#4A3728" strokeWidth="1" style={{ cursor: 'pointer' }} />
            <ellipse cx="250" cy="230" rx="20" ry="15" fill={f('tree2')} stroke="#4A3728" strokeWidth="1" onClick={() => handleShapeClick('tree2')} style={{ cursor: 'pointer' }} role="button" aria-label="Fern" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('tree2'); }} />
            {/* Ground */}
            <rect x="0" y="260" width="400" height="60" fill={f('ground')} stroke="#92400E" strokeWidth="1.5" onClick={() => handleShapeClick('ground')} style={{ cursor: 'pointer' }} role="button" aria-label="Ground" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('ground'); }} />
            {/* T-Rex body */}
            <ellipse cx="170" cy="230" rx="40" ry="30" fill={f('trex')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('trex')} style={{ cursor: 'pointer' }} role="button" aria-label="T-Rex" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('trex'); }} />
            <circle cx="195" cy="195" r="20" fill={f('trex')} stroke="#4A3728" strokeWidth="2" style={{ cursor: 'pointer' }} />
            {/* Egg */}
            <ellipse cx="140" cy="295" rx="14" ry="18" fill={f('egg')} stroke="#4A3728" strokeWidth="1.5" onClick={() => handleShapeClick('egg')} style={{ cursor: 'pointer' }} role="button" aria-label="Dino Egg" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('egg'); }} />
            {/* Footprint */}
            <ellipse cx="280" cy="280" rx="12" ry="8" fill={f('footprint')} stroke="#4A3728" strokeWidth="1.5" onClick={() => handleShapeClick('footprint')} style={{ cursor: 'pointer' }} role="button" aria-label="Footprint" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('footprint'); }} />
          </svg>
        );

      case 'halloween':
        return (
          <svg viewBox="0 0 400 320" className="w-full max-w-lg mx-auto" role="img" aria-label={`${page.title} coloring page`}>
            <rect width="400" height="320" fill="#1E1B4B" />
            {/* Moon */}
            <circle cx="340" cy="60" r="35" fill={f('moon')} stroke="#FCD34D" strokeWidth="2" onClick={() => handleShapeClick('moon')} style={{ cursor: 'pointer' }} role="button" aria-label="Moon" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('moon'); }} />
            {/* Stars */}
            <polygon points="60,30 64,42 77,42 67,50 70,62 60,55 50,62 53,50 43,42 56,42" fill={f('star1')} onClick={() => handleShapeClick('star1')} style={{ cursor: 'pointer' }} role="button" aria-label="Star" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('star1'); }} />
            <polygon points="160,20 163,28 172,28 165,33 167,42 160,37 153,42 155,33 148,28 157,28" fill={f('star2')} onClick={() => handleShapeClick('star2')} style={{ cursor: 'pointer' }} role="button" aria-label="Star" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('star2'); }} />
            {/* Ground */}
            <path d="M0 260 Q100 240 200 260 Q300 280 400 260 L400 320 L0 320Z" fill={f('ground')} stroke="#4A3728" strokeWidth="1.5" onClick={() => handleShapeClick('ground')} style={{ cursor: 'pointer' }} role="button" aria-label="Ground" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('ground'); }} />
            {/* Pumpkin */}
            <ellipse cx="200" cy="250" rx="50" ry="35" fill={f('pumpkin')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('pumpkin')} style={{ cursor: 'pointer' }} role="button" aria-label="Pumpkin" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('pumpkin'); }} />
            <rect x="195" y="210" width="10" height="15" fill="#4A3728" />
            {/* Ghost */}
            <ellipse cx="100" cy="180" rx="30" ry="40" fill={f('ghost')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('ghost')} style={{ cursor: 'pointer' }} role="button" aria-label="Ghost" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('ghost'); }} />
            {/* Witch hat */}
            <polygon points="300,200 280,130 320,130" fill={f('hat')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('hat')} style={{ cursor: 'pointer' }} role="button" aria-label="Witch Hat" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('hat'); }} />
            <rect x="265" y="128" width="70" height="8" fill={f('hat')} stroke="#4A3728" strokeWidth="1.5" style={{ cursor: 'pointer' }} />
            {/* Bats */}
            <path d="M60 100 Q50 85 40 100 Q50 95 60 100 Q70 95 80 100 Q70 85 60 100Z" fill={f('bat1')} onClick={() => handleShapeClick('bat1')} style={{ cursor: 'pointer' }} role="button" aria-label="Bat" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('bat1'); }} />
            <path d="M250 80 Q240 65 230 80 Q240 75 250 80 Q260 75 270 80 Q260 65 250 80Z" fill={f('bat2')} onClick={() => handleShapeClick('bat2')} style={{ cursor: 'pointer' }} role="button" aria-label="Bat" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('bat2'); }} />
          </svg>
        );

      case 'christmas':
        return (
          <svg viewBox="0 0 400 350" className="w-full max-w-lg mx-auto" role="img" aria-label={`${page.title} coloring page`}>
            <rect width="400" height="350" fill="#EFF6FF" />
            {/* Snow ground */}
            <path d="M0 290 Q100 275 200 290 Q300 305 400 290 L400 350 L0 350Z" fill={f('snow')} stroke="#94A3B8" strokeWidth="1.5" onClick={() => handleShapeClick('snow')} style={{ cursor: 'pointer' }} role="button" aria-label="Snow Ground" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('snow'); }} />
            {/* Tree */}
            <polygon points="200,50 130,180 270,180" fill={f('tree')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('tree')} style={{ cursor: 'pointer' }} role="button" aria-label="Christmas Tree" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('tree'); }} />
            <polygon points="200,110 140,220 260,220" fill={f('tree')} stroke="#4A3728" strokeWidth="2" style={{ cursor: 'pointer' }} />
            <polygon points="200,160 150,260 250,260" fill={f('tree')} stroke="#4A3728" strokeWidth="2" style={{ cursor: 'pointer' }} />
            <rect x="190" y="260" width="20" height="30" fill="#8B4513" stroke="#4A3728" strokeWidth="1.5" />
            {/* Star */}
            <polygon points="200,30 205,42 218,42 208,50 212,62 200,55 188,62 192,50 182,42 195,42" fill={f('star')} stroke="#FCD34D" strokeWidth="1.5" onClick={() => handleShapeClick('star')} style={{ cursor: 'pointer' }} role="button" aria-label="Tree Topper Star" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('star'); }} />
            {/* Ornaments */}
            <circle cx="190" cy="130" r="8" fill={f('ornament1')} stroke="#4A3728" strokeWidth="1.5" onClick={() => handleShapeClick('ornament1')} style={{ cursor: 'pointer' }} role="button" aria-label="Red Ornament" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('ornament1'); }} />
            <circle cx="215" cy="170" r="7" fill={f('ornament2')} stroke="#4A3728" strokeWidth="1.5" onClick={() => handleShapeClick('ornament2')} style={{ cursor: 'pointer' }} role="button" aria-label="Blue Ornament" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('ornament2'); }} />
            <circle cx="185" cy="210" r="7" fill={f('ornament3')} stroke="#4A3728" strokeWidth="1.5" onClick={() => handleShapeClick('ornament3')} style={{ cursor: 'pointer' }} role="button" aria-label="Gold Ornament" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('ornament3'); }} />
            {/* Gifts */}
            <rect x="260" y="260" width="35" height="30" fill={f('gift1')} stroke="#4A3728" strokeWidth="2" rx="3" onClick={() => handleShapeClick('gift1')} style={{ cursor: 'pointer' }} role="button" aria-label="Red Gift" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('gift1'); }} />
            <rect x="305" y="270" width="30" height="25" fill={f('gift2')} stroke="#4A3728" strokeWidth="2" rx="3" onClick={() => handleShapeClick('gift2')} style={{ cursor: 'pointer' }} role="button" aria-label="Blue Gift" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('gift2'); }} />
            {/* Snowman */}
            <circle cx="80" cy="275" r="25" fill={f('snowman')} stroke="#4A3728" strokeWidth="2" onClick={() => handleShapeClick('snowman')} style={{ cursor: 'pointer' }} role="button" aria-label="Snowman" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleShapeClick('snowman'); }} />
            <circle cx="80" cy="245" r="18" fill={f('snowman')} stroke="#4A3728" strokeWidth="2" style={{ cursor: 'pointer' }} />
          </svg>
        );

      default:
        return null;
    }
  }, [handleShapeClick]);

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
          <h1 className="text-2xl md:text-3xl font-display text-kv-pink">
            {isToddler ? '🎨 Color!' : 'Coloring Pages'}
          </h1>
          {!isToddler && (
            <p className="text-kv-gray-500 text-sm mt-0.5">
              Pick a color, then tap a shape to fill it!
            </p>
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

      {/* ── Page Selector ── */}
      <AnimatedContainer variant="slideUp" delay={0.05}>
        <div className="flex gap-2 overflow-x-auto pb-2 kv-scroll-hidden" role="radiogroup" aria-label="Coloring page selector">
          {availablePages.map((page, idx) => (
            <motion.button
              key={page.id}
              type="button"
              onClick={() => handlePageSelect(idx)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className={cn(
                'kv-button-base flex-shrink-0 flex items-center gap-2 px-4 py-2.5 font-bold transition-colors',
                isToddler && 'min-h-[64px]',
                selectedPageIdx === idx
                  ? 'bg-kv-pink text-white shadow-button ring-2 ring-kv-pink/40'
                  : 'bg-white text-kv-gray-600 border-2 border-kv-gray-200 hover:border-kv-pink/40',
              )}
              aria-label={`Select ${page.title} coloring page`}
              aria-pressed={selectedPageIdx === idx}
              role="radio"
            >
              <span className="text-xl md:text-2xl" aria-hidden="true">{page.emoji}</span>
              {config.showTextLabels && <span className="text-sm">{page.title}</span>}
              {completedPages.has(page.id) && (
                <span className="text-xs" aria-label="Completed">✅</span>
              )}
            </motion.button>
          ))}
        </div>
      </AnimatedContainer>

      {/* ── Color Palette ── */}
      <AnimatedContainer variant="slideUp" delay={0.1}>
        <Card variant="elevated" padding="sm">
          <div className="flex flex-col gap-3 p-2 md:p-3">
            {/* Row 1: Colors */}
            <div className="flex items-center gap-2 flex-wrap" role="radiogroup" aria-label="Color picker">
              {availableColors.map((c) => (
                <motion.button
                  key={c}
                  type="button"
                  onClick={() => handleColorSelect(c)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'rounded-full border-2 transition-shadow focus-visible:ring-2 focus-visible:ring-kv-pink',
                    colorBtnSize,
                    selectedColor === c
                      ? 'border-kv-gray-800 ring-2 ring-kv-pink/50 shadow-lg scale-110'
                      : 'border-kv-gray-300 hover:border-kv-gray-500',
                    c === '#FFFFFF' && 'border-kv-gray-400',
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Select ${COLOR_NAMES[c] ?? 'custom'} color`}
                  role="radio"
                  aria-checked={selectedColor === c}
                />
              ))}

              {/* Custom color picker (kids only) */}
              {isKid && (
                <div className="flex items-center gap-1.5 ml-1">
                  <label className="sr-only" htmlFor="custom-color-input">Custom color</label>
                  <input
                    id="custom-color-input"
                    type="color"
                    value={customColor || '#FF6B6B'}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-kv-gray-300 cursor-pointer bg-transparent"
                    aria-label="Custom color picker"
                  />
                  <Button variant="secondary" size="xs" onClick={applyCustomColor} disabled={!customColor}>
                    Apply
                  </Button>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Active color indicator */}
              <div className="flex items-center gap-2">
                {!isToddler && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className={cn(
                      'kv-button-base rounded-xl flex items-center justify-center',
                      'bg-kv-gray-50 text-kv-gray-500 border border-kv-gray-200',
                      isToddler ? 'w-14 h-14' : 'w-9 h-9',
                      undoStack.length === 0 && 'opacity-30 cursor-not-allowed',
                    )}
                    aria-label="Undo last color"
                  >
                    <span className="text-lg" aria-hidden="true">↩️</span>
                  </button>
                )}

                <motion.button
                  type="button"
                  onClick={handleClear}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    'kv-button-base rounded-xl flex items-center justify-center',
                    'bg-kv-gray-50 text-kv-red border border-kv-gray-200 hover:bg-red-50',
                    isToddler ? 'w-14 h-14' : 'w-9 h-9',
                  )}
                  aria-label="Clear all colors"
                >
                  <span className="text-lg" aria-hidden="true">🗑️</span>
                </motion.button>

                <Badge variant="primary" size="sm" icon={<span aria-hidden="true">🎨</span>}>
                  {config.showTextLabels ? (COLOR_NAMES[selectedColor] ?? 'Color') : ''}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedContainer>

      {/* ── Coloring Area ── */}
      <AnimatedContainer variant="slideUp" delay={0.15}>
        <div className="relative">
          <Card variant="elevated" padding="none" className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPage?.id ?? 'none'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {selectedPage && renderSVG(selectedPage, filledShapes)}
              </motion.div>
            </AnimatePresence>

            {/* Saved overlay */}
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
                    <span className="text-6xl" aria-hidden="true">🎉</span>
                    <span className="text-2xl font-display font-bold text-kv-green">Beautiful!</span>
                  </AnimatedContainer>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar
              value={totalShapes > 0 ? Math.round((filledCount / totalShapes) * 100) : 0}
              variant={isPageComplete ? 'green' : 'blue'}
              size="sm"
            />
            <span
              className="text-sm text-kv-gray-500 font-bold min-w-fit"
              aria-live="polite"
              role="status"
            >
              {isToddler ? `${filledCount}/${totalShapes}` : `${filledCount} of ${totalShapes} colored`}
            </span>
          </div>
        </div>
      </AnimatedContainer>

      {/* ── Action Buttons ── */}
      <AnimatedContainer variant="slideUp" delay={0.2}>
        <div className="flex gap-3 justify-center flex-wrap">
          <MotionButton
            variant="success"
            size={isToddler ? 'toddler' : 'lg'}
            onClick={handleSaveProgress}
            loading={trackProgressMutation.isPending}
            leftIcon={<span aria-hidden="true">💾</span>}
            aria-label="Save progress"
          >
            {isToddler ? '💾 Save' : 'Save Progress'}
          </MotionButton>

          <MotionButton
            variant="premium"
            size={isToddler ? 'toddler' : 'lg'}
            onClick={() => navigate(`/create/gallery/${profileId}`)}
            leftIcon={<span aria-hidden="true">🖼️</span>}
            aria-label="View gallery"
          >
            {isToddler ? '🖼️ Gallery' : 'My Gallery'}
          </MotionButton>
        </div>
      </AnimatedContainer>

      {/* ── Hint ── */}
      {isKid && (
        <AnimatedContainer variant="fade" delay={0.3}>
          <p className="text-center text-kv-gray-400 text-xs">
            💡 Tip: Click a shape to fill it with the selected color. Use undo to fix mistakes.
          </p>
        </AnimatedContainer>
      )}

      {/* ── Clear Confirmation Dialog ── */}
      {!isToddler && (
        <ConfirmDialog
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={confirmClear}
          title="Clear All Colors"
          message="Are you sure you want to clear all the colors on this page? This cannot be undone."
          confirmLabel="Clear"
          cancelLabel="Keep Coloring"
          variant="danger"
        />
      )}
    </div>
  );
}
