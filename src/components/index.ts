// ──────────────────────────────────────────────
// KidsVerse — Component Barrel Exports
// ──────────────────────────────────────────────

/* ── UI Components ── */
export { Button, MotionButton } from './ui/Button';
export type { ButtonProps, MotionButtonProps } from './ui/Button';
export { Card, MotionCard, CardHeader, CardBody, CardFooter } from './ui/Card';
export type { CardProps, MotionCardProps } from './ui/Card';
export { Badge, AchievementBadge, CategoryBadge } from './ui/Badge';
export type { BadgeProps } from './ui/Badge';
export { ProgressBar, StarRating, StepIndicator } from './ui/ProgressBar';
export { Modal, ConfirmDialog } from './ui/Modal';
export { SoundButton, SoundToggleBar } from './ui/SoundButton';
export { Avatar, AvatarSelector } from './ui/Avatar';

/* ── Icons ── */
export {
  IconArrowLeft, IconArrowRight, IconClose, IconMenu, IconHome,
  IconCheck, IconAlert, IconError, IconInfo, IconDelete, IconEdit,
  IconAdd, IconStar, IconClock, IconVolume, Spinner,
} from './icons';

/* ── Animation Helpers ── */
export {
  fadeVariants, slideUpVariants, slideDownVariants,
  slideLeftVariants, slideRightVariants, popVariants,
  staggerContainer, staggerItem, pageVariants, pageTransition,
  floatingAnimation, wiggleAnimation, pulseGlowAnimation,
  AnimatedContainer, StaggerGrid, StaggerItem,
} from './animations';
