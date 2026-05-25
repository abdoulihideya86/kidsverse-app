// ──────────────────────────────────────────────
// KidsVerse — Design Tokens (Enhanced Phase 2)
// ──────────────────────────────────────────────

/* ═══════ Color Palette ═══════ */
export const colors = {
  primary: {
    red: '#FF6B6B',
    orange: '#FFA94D',
    yellow: '#FFD93D',
    green: '#6BCB77',
    blue: '#4D96FF',
    purple: '#9B59B6',
    pink: '#FF69B4',
    cyan: '#00CED1',
    teal: '#2DD4BF',
  },
  semantic: {
    success: '#6BCB77',
    successLight: '#D4EDDA',
    warning: '#FFA94D',
    warningLight: '#FFF3CD',
    error: '#FF6B6B',
    errorLight: '#F8D7DA',
    info: '#4D96FF',
    infoLight: '#D6EAF8',
  },
  neutral: {
    white: '#FFFFFF',
    cream: '#FFF8F0',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
  },
} as const;

/* ═══════ Component Variant Colors ═══════ */
export const buttonVariants = {
  primary: 'bg-kv-blue text-white hover:bg-blue-500 active:bg-blue-600',
  secondary: 'bg-kv-gray-200 text-kv-gray-700 hover:bg-kv-gray-300 active:bg-kv-gray-400',
  success: 'bg-kv-green text-white hover:bg-emerald-500 active:bg-emerald-600',
  warning: 'bg-kv-orange text-white hover:bg-amber-500 active:bg-amber-600',
  danger: 'bg-kv-red text-white hover:bg-red-500 active:bg-red-600',
  ghost: 'bg-transparent text-kv-gray-700 hover:bg-kv-gray-100 active:bg-kv-gray-200',
  premium: 'bg-gradient-to-r from-kv-purple to-violet-500 text-white hover:from-kv-purple hover:to-violet-600',
  rainbow: 'bg-gradient-to-r from-kv-red via-kv-yellow via-kv-green to-kv-blue text-white',
} as const;

export const buttonSizes = {
  xs: 'px-3 py-1.5 text-xs min-h-[36px]',
  sm: 'px-4 py-2 text-sm min-h-[44px]',
  md: 'px-5 py-2.5 text-base min-h-[48px]',
  lg: 'px-6 py-3 text-lg min-h-[56px]',
  xl: 'px-8 py-4 text-xl min-h-[64px]',
  toddler: 'px-6 py-5 text-xl min-h-[80px]',
} as const;

export const cardVariants = {
  default: 'bg-white rounded-2xl shadow-card',
  elevated: 'bg-white rounded-3xl shadow-card-hover',
  interactive: 'bg-white rounded-2xl shadow-card cursor-pointer hover:shadow-card-hover active:scale-[0.98] transition-all duration-200',
  flat: 'bg-white rounded-2xl border-2 border-kv-gray-100',
  gradient: {
    blue: 'bg-gradient-to-br from-kv-blue to-blue-400 text-white rounded-2xl shadow-card',
    green: 'bg-gradient-to-br from-kv-green to-emerald-400 text-white rounded-2xl shadow-card',
    orange: 'bg-gradient-to-br from-kv-orange to-amber-400 text-white rounded-2xl shadow-card',
    purple: 'bg-gradient-to-br from-kv-purple to-violet-400 text-white rounded-2xl shadow-card',
    pink: 'bg-gradient-to-br from-kv-pink to-rose-400 text-white rounded-2xl shadow-card',
    rainbow: 'bg-gradient-to-br from-kv-red via-kv-yellow via-kv-green to-kv-blue text-white rounded-2xl shadow-card',
  },
} as const;

export const cardPaddings = {
  none: 'p-0',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
  xl: 'p-8 md:p-10',
} as const;

export const badgeVariants = {
  default: 'bg-kv-gray-100 text-kv-gray-700',
  primary: 'bg-kv-blue/15 text-kv-blue',
  success: 'bg-kv-green/15 text-kv-green',
  warning: 'bg-kv-orange/15 text-kv-orange',
  danger: 'bg-kv-red/15 text-kv-red',
  info: 'bg-kv-cyan/15 text-kv-cyan',
  premium: 'bg-kv-purple/15 text-kv-purple',
  achievement: 'bg-kv-yellow/15 text-kv-yellow',
} as const;

export const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
} as const;

export const progressBarVariants = {
  blue: 'bg-kv-blue',
  green: 'bg-kv-green',
  orange: 'bg-kv-orange',
  red: 'bg-kv-red',
  purple: 'bg-kv-purple',
  pink: 'bg-kv-pink',
  cyan: 'bg-kv-cyan',
  yellow: 'bg-kv-yellow',
} as const;

export const progressBarHeights = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
  xl: 'h-6',
} as const;

export const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  fullscreen: 'max-w-[95vw] md:max-w-[90vw]',
} as const;

/* ═══════ Typography ═══════ */
export const fontFamily = {
  sans: "'Nunito', system-ui, sans-serif",
  display: "'Fredoka One', 'Nunito', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const fontSize = {
  '2xs': '0.625rem',
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  hero: '4.5rem',
} as const;

/* ═══════ Spacing ═══════ */
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

/* ═══════ Border Radius ═══════ */
export const borderRadius = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  '4xl': '2.5rem',
  pill: '9999px',
} as const;

/* ═══════ Shadows ═══════ */
export const shadows = {
  card: '0 4px 16px rgba(0, 0, 0, 0.08)',
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
  button: '0 4px 12px rgba(0, 0, 0, 0.1)',
  buttonHover: '0 6px 20px rgba(0, 0, 0, 0.15)',
  modal: '0 20px 60px rgba(0, 0, 0, 0.15)',
  toast: '0 8px 32px rgba(0, 0, 0, 0.12)',
  tooltip: '0 4px 12px rgba(0, 0, 0, 0.08)',
} as const;

/* ═══════ Motion / Animation ═══════ */
export const motionPresets = {
  fast: { duration: 0.15, ease: 'easeOut' as const },
  normal: { duration: 0.3, ease: 'easeInOut' as const },
  slow: { duration: 0.5, ease: 'easeInOut' as const },
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  bounce: { type: 'spring' as const, stiffness: 400, damping: 15 },
  slideUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } },
  slideDown: { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 } },
  slideLeft: { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } },
  slideRight: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 } },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  scale: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } },
  pop: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.8 } },
} as const;

/* ═══════ Z-Index Layers ═══════ */
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalOverlay: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
} as const;

/* ═══════ Breakpoints (for reference in JS) ═══════ */
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/* ═══════ Age Segment Configs ═══════ */
export const segmentPalettes = {
  toddler: [colors.primary.blue, colors.primary.yellow, colors.primary.green] as const,
  'early-learner': [
    colors.primary.blue,
    colors.primary.orange,
    colors.primary.green,
    colors.primary.purple,
  ] as const,
  kid: [
    colors.primary.blue,
    colors.primary.purple,
    colors.primary.cyan,
    colors.primary.orange,
    colors.primary.pink,
  ] as const,
} as const;

export const tapTargetSize = {
  toddler: 80,
  'early-learner': 60,
  kid: 48,
} as const;

/* ═══════ Avatar Config ═══════ */
export const avatarSizes = {
  xs: 'w-8 h-8 text-lg',
  sm: 'w-10 h-10 text-xl',
  md: 'w-14 h-14 text-3xl',
  lg: 'w-20 h-20 text-4xl',
  xl: 'w-28 h-28 text-5xl',
} as const;
