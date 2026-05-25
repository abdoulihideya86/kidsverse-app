// ──────────────────────────────────────────────
// KidsVerse — Design Tokens (V3 — Vibrant & Polished)
// ──────────────────────────────────────────────

/* ═══════ Color Palette — Duolingo-level vibrancy ═══════ */
export const colors = {
  primary: {
    red: '#FF4757',
    orange: '#FF6B2B',
    yellow: '#FFC312',
    green: '#2ED573',
    blue: '#1E90FF',
    purple: '#A55EEA',
    pink: '#FF6B9D',
    cyan: '#00D2D3',
    teal: '#0ABDE3',
  },
  /* Extended palette for 3-stop gradients */
  primaryLight: {
    red: '#FF6B7A',
    orange: '#FF9054',
    yellow: '#FFD454',
    green: '#5EE09A',
    blue: '#4DAAFF',
    purple: '#BF86F5',
    pink: '#FF8FB8',
    cyan: '#4DE0E0',
    teal: '#3DD1F0',
  },
  primaryDark: {
    red: '#E83545',
    orange: '#E05510',
    yellow: '#E5A800',
    green: '#1BB85C',
    blue: '#0A72E0',
    purple: '#8B44D0',
    pink: '#E0507F',
    cyan: '#00ABAC',
    teal: '#089FC0',
  },
  semantic: {
    success: '#2ED573',
    successLight: '#D4F5E0',
    successDark: '#1BB85C',
    warning: '#FF6B2B',
    warningLight: '#FFF0E5',
    warningDark: '#E05510',
    error: '#FF4757',
    errorLight: '#FFE5E8',
    errorDark: '#E83545',
    info: '#1E90FF',
    infoLight: '#E3F0FF',
    infoDark: '#0A72E0',
  },
  neutral: {
    white: '#FFFFFF',
    cream: '#FFF9F0',
    gray50: '#FAFBFE',
    gray100: '#F0F2F8',
    gray200: '#E2E5F0',
    gray300: '#C8CCE0',
    gray400: '#9BA2BF',
    gray500: '#6B7394',
    gray600: '#4A5170',
    gray700: '#333A55',
    gray800: '#1F2438',
    gray900: '#111428',
  },
} as const;

/* ═══════ Component Variant Colors ═══════ */
export const buttonVariants = {
  primary: 'bg-gradient-to-b from-kv-blue to-blue-500 text-white shadow-glow-blue hover:shadow-glow-blue active:scale-[0.97]',
  secondary: 'bg-gradient-to-b from-kv-gray-100 to-kv-gray-200 text-kv-gray-700 hover:from-kv-gray-200 hover:to-kv-gray-300 active:scale-[0.97]',
  success: 'bg-gradient-to-b from-kv-green to-emerald-500 text-white shadow-glow-green hover:shadow-glow-green active:scale-[0.97]',
  warning: 'bg-gradient-to-b from-kv-orange to-amber-500 text-white shadow-glow-orange hover:shadow-glow-orange active:scale-[0.97]',
  danger: 'bg-gradient-to-b from-kv-red to-red-500 text-white shadow-glow-red hover:shadow-glow-red active:scale-[0.97]',
  ghost: 'bg-transparent text-kv-gray-700 hover:bg-kv-gray-100 active:bg-kv-gray-200 active:scale-[0.97]',
  premium: 'bg-gradient-to-b from-kv-purple to-violet-600 text-white shadow-glow-purple hover:shadow-glow-purple active:scale-[0.97]',
  rainbow: 'bg-gradient-to-r from-kv-red via-kv-yellow to-kv-blue text-white shadow-glow-blue active:scale-[0.97]',
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
  interactive: 'bg-white rounded-2xl shadow-card cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200',
  flat: 'bg-white rounded-2xl border-2 border-kv-gray-100',
  glass: 'bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 shadow-card',
  glassHover: 'bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-card-hover cursor-pointer hover:bg-white/80 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200',
  gradient: {
    blue: 'bg-gradient-to-br from-kv-blue via-blue-400 to-kv-cyan text-white rounded-2xl shadow-glow-blue',
    green: 'bg-gradient-to-br from-kv-green via-emerald-400 to-kv-teal text-white rounded-2xl shadow-glow-green',
    orange: 'bg-gradient-to-br from-kv-orange via-amber-400 to-kv-yellow text-white rounded-2xl shadow-glow-orange',
    purple: 'bg-gradient-to-br from-kv-purple via-violet-400 to-kv-pink text-white rounded-2xl shadow-glow-purple',
    pink: 'bg-gradient-to-br from-kv-pink via-rose-400 to-kv-red text-white rounded-2xl shadow-glow-pink',
    rainbow: 'bg-gradient-to-br from-kv-red via-kv-yellow via-kv-green to-kv-blue text-white rounded-2xl shadow-glow-blue',
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
  achievement: 'bg-kv-yellow/15 text-amber-700',
} as const;

export const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
} as const;

export const progressBarVariants = {
  blue: 'bg-gradient-to-r from-kv-blue to-blue-400',
  green: 'bg-gradient-to-r from-kv-green to-emerald-400',
  orange: 'bg-gradient-to-r from-kv-orange to-amber-400',
  red: 'bg-gradient-to-r from-kv-red to-red-400',
  purple: 'bg-gradient-to-r from-kv-purple to-violet-400',
  pink: 'bg-gradient-to-r from-kv-pink to-rose-400',
  cyan: 'bg-gradient-to-r from-kv-cyan to-cyan-400',
  yellow: 'bg-gradient-to-r from-kv-yellow to-amber-400',
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

export const letterSpacing = {
  heading: '0.01em',
  display: '-0.02em',
  label: '0.04em',
  wide: '0.08em',
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

/* ═══════ Shadows — including colored glow variants ═══════ */
export const shadows = {
  /* Neutral */
  card: '0 2px 8px rgba(0, 0, 0, 0.06)',
  cardHover: '0 8px 30px rgba(0, 0, 0, 0.10)',
  button: '0 4px 14px rgba(0, 0, 0, 0.08)',
  buttonHover: '0 8px 24px rgba(0, 0, 0, 0.14)',
  modal: '0 24px 64px rgba(0, 0, 0, 0.18)',
  toast: '0 12px 40px rgba(0, 0, 0, 0.12)',
  tooltip: '0 6px 16px rgba(0, 0, 0, 0.10)',

  /* Colored glows */
  glowBlue: '0 4px 24px rgba(30, 144, 255, 0.35), 0 0 0 1px rgba(30, 144, 255, 0.08)',
  glowGreen: '0 4px 24px rgba(46, 213, 115, 0.35), 0 0 0 1px rgba(46, 213, 115, 0.08)',
  glowOrange: '0 4px 24px rgba(255, 107, 43, 0.35), 0 0 0 1px rgba(255, 107, 43, 0.08)',
  glowRed: '0 4px 24px rgba(255, 71, 87, 0.35), 0 0 0 1px rgba(255, 71, 87, 0.08)',
  glowPurple: '0 4px 24px rgba(165, 94, 234, 0.35), 0 0 0 1px rgba(165, 94, 234, 0.08)',
  glowPink: '0 4px 24px rgba(255, 107, 157, 0.35), 0 0 0 1px rgba(255, 107, 157, 0.08)',
  glowYellow: '0 4px 24px rgba(255, 195, 18, 0.40), 0 0 0 1px rgba(255, 195, 18, 0.10)',
  glowCyan: '0 4px 24px rgba(0, 210, 211, 0.35), 0 0 0 1px rgba(0, 210, 211, 0.08)',

  /* Inset highlights */
  insetHighlight: 'inset 0 2px 0 rgba(255, 255, 255, 0.30)',
  insetDeep: 'inset 0 -2px 4px rgba(0, 0, 0, 0.06)',
} as const;

/* ═══════ Motion / Animation — enhanced with jelly, wobble, tilt ═══════ */
export const motionPresets = {
  /* Durations */
  fast: { duration: 0.15, ease: 'easeOut' as const },
  normal: { duration: 0.3, ease: 'easeInOut' as const },
  slow: { duration: 0.5, ease: 'easeInOut' as const },
  gentle: { duration: 0.8, ease: 'easeOut' as const },

  /* Springs */
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  bounce: { type: 'spring' as const, stiffness: 400, damping: 15 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 25 },
  jelly: { type: 'spring' as const, stiffness: 200, damping: 10, mass: 0.8 },
  wobble: { type: 'spring' as const, stiffness: 300, damping: 8 },

  /* Transitions */
  slideUp: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } },
  slideDown: { initial: { opacity: 0, y: -24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 12 } },
  slideLeft: { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -12 } },
  slideRight: { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 12 } },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  scale: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } },
  pop: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.8 } },

  /* Entrance choreography */
  bounceIn: { initial: { opacity: 0, scale: 0.3 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring' as const, stiffness: 400, damping: 15 } },
  fadeUp: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: 'easeOut' as const } },
  scaleIn: { initial: { opacity: 0, scale: 0 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring' as const, stiffness: 350, damping: 20 } },

  /* Tilt (3D card) */
  tilt: { transition: { type: 'spring' as const, stiffness: 300, damping: 20 }, style: { transformPerspective: 800 } },
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
