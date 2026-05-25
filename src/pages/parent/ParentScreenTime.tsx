import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { updateChildProfile, getTodayScreenTime } from '@/lib/firestore';
import { getAvatarEmoji } from '@/lib/utils';
import { ProgressBar } from '@/components';
import { motion } from 'framer-motion';
import type { ChildProfile } from '@/types';

function getColorVariant(percentUsed: number): 'green' | 'orange' | 'red' {
  if (percentUsed >= 100) return 'red';
  if (percentUsed >= 75) return 'orange';
  return 'green';
}

export default function ParentScreenTime() {
  const navigate = useNavigate();
  const childProfiles = useAuthStore((s) => s.childProfiles);

  const [todayUsage, setTodayUsage] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load today's screen time from Firestore for each child
  const loadUsage = useCallback(async () => {
    if (childProfiles.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const todayStr = new Date().toISOString().split('T')[0]!;

    try {
      const results = await Promise.all(
        childProfiles.map(async (child) => {
          const minutes = await getTodayScreenTime(child.id, todayStr);
          return { id: child.id, minutes };
        }),
      );

      const usageMap: Record<string, number> = {};
      for (const r of results) {
        usageMap[r.id] = r.minutes;
      }
      setTodayUsage(usageMap);
    } catch {
      // Silently fail — usage stays at 0
    } finally {
      setIsLoading(false);
    }
  }, [childProfiles]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounced handler for limit slider changes
  const handleLimitChange = useCallback(
    (child: ChildProfile, newLimit: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Optimistically update the store immediately
      useAuthStore.getState().updateChildProfile(child.id, { screenTimeLimitMinutes: newLimit });

      // Debounced Firestore write
      debounceTimerRef.current = setTimeout(async () => {
        try {
          await updateChildProfile(child.id, { screenTimeLimitMinutes: newLimit });
        } catch {
          // Firestore write failed — store already updated optimistically
        }
      }, 500);
    },
    [],
  );

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = [30, 45, 20, 60, 40, 90, 25]; // sample minutes per day (real data in Phase 4)

  // ── Empty state ──
  if (childProfiles.length === 0) {
    return (
      <div className="kv-page">
        <header className="mb-8">
          <button
            onClick={() => navigate('/parent')}
            className="kv-button-base bg-kv-gray-200 text-kv-gray-600 px-4 py-2 text-sm mb-4"
            aria-label="Back to dashboard"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-display text-kv-orange">Screen Time</h1>
          <p className="text-kv-gray-500 mt-1">Set daily limits and monitor usage per child</p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="kv-card flex flex-col items-center justify-center py-16 text-center"
        >
          <span className="text-6xl mb-4" aria-hidden="true">👶</span>
          <h2 className="text-xl font-bold text-kv-gray-700 mb-2">No child profiles yet</h2>
          <p className="text-kv-gray-500 mb-6">
            Add a child profile to start setting screen time limits.
          </p>
          <button
            onClick={() => navigate('/parent/children')}
            className="kv-button-base bg-kv-orange text-white px-6 py-3 rounded-xl font-bold shadow-button hover:shadow-lg transition-shadow"
          >
            Add a Child
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="kv-page">
      <header className="mb-8">
        <button
          onClick={() => navigate('/parent')}
          className="kv-button-base bg-kv-gray-200 text-kv-gray-600 px-4 py-2 text-sm mb-4"
          aria-label="Back to dashboard"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-display text-kv-orange">Screen Time</h1>
        <p className="text-kv-gray-500 mt-1">Set daily limits and monitor usage per child</p>
      </header>

      {/* Per-child screen time settings */}
      <section className="space-y-6 mb-10" aria-label="Screen time settings per child">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: childProfiles.length }, (_, i) => (
            <div key={`skeleton-${i}`} className="kv-card animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-kv-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-24 rounded bg-kv-gray-200" />
                  <div className="h-3 w-40 rounded bg-kv-gray-100" />
                </div>
                <div className="text-right space-y-1">
                  <div className="h-7 w-10 rounded bg-kv-gray-200 ml-auto" />
                  <div className="h-3 w-16 rounded bg-kv-gray-100 ml-auto" />
                </div>
              </div>
              <div className="w-full h-4 bg-kv-gray-100 rounded-full" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-32 rounded bg-kv-gray-200" />
                <div className="h-3 w-full rounded bg-kv-gray-100" />
              </div>
            </div>
          ))
        ) : (
          childProfiles.map((child) => {
            const usedMinutes = todayUsage[child.id] ?? 0;
            const limitMinutes = child.screenTimeLimitMinutes;
            const percentUsed = limitMinutes > 0
              ? Math.min(100, Math.round((usedMinutes / limitMinutes) * 100))
              : 0;
            const isOver = usedMinutes >= limitMinutes;
            const remaining = Math.max(0, limitMinutes - usedMinutes);
            const colorVariant = getColorVariant(percentUsed);
            const avatarEmoji = getAvatarEmoji(child.avatar);

            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="kv-card"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl" aria-hidden="true">{avatarEmoji}</span>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-kv-gray-800">{child.name}</h2>
                    <p className={`text-sm ${isOver ? 'text-kv-red font-bold' : 'text-kv-gray-500'}`}>
                      {isOver
                        ? 'Time is up for today!'
                        : `${remaining} minute${remaining !== 1 ? 's' : ''} remaining today`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display font-bold text-kv-gray-800">{usedMinutes}</p>
                    <p className="text-xs text-kv-gray-400">of {limitMinutes} min</p>
                  </div>
                </div>

                {/* Progress bar */}
                <ProgressBar
                  value={usedMinutes}
                  max={limitMinutes}
                  variant={colorVariant}
                  size="lg"
                  aria-label={`${child.name}'s screen time usage: ${usedMinutes} of ${limitMinutes} minutes`}
                />

                {/* Limit slider */}
                <div className="mt-4">
                  <label htmlFor={`limit-${child.id}`} className="block text-sm font-bold text-kv-gray-700 mb-1">
                    Daily Limit: {child.screenTimeLimitMinutes} minutes
                  </label>
                  <input
                    id={`limit-${child.id}`}
                    type="range"
                    min={15}
                    max={180}
                    step={5}
                    defaultValue={child.screenTimeLimitMinutes}
                    onChange={(e) => handleLimitChange(child, Number(e.target.value))}
                    className="w-full h-3 rounded-full bg-kv-gray-200 accent-kv-orange"
                    aria-label={`Set ${child.name}'s daily screen time limit`}
                  />
                  <div className="flex justify-between text-xs text-kv-gray-400 mt-1">
                    <span>15 min</span>
                    <span>1 hour</span>
                    <span>2 hours</span>
                    <span>3 hours</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </section>

      {/* Weekly Overview */}
      <section aria-label="Weekly screen time overview">
        <h2 className="text-2xl font-display text-kv-gray-800 mb-4">This Week&apos;s Overview</h2>
        <div className="kv-card">
          <div className="flex items-end gap-2 h-48 px-4">
            {weekDays.map((day, i) => {
              const maxMinutes = 120;
              const dayMinutes = weeklyData[i] ?? 0;
              const height = Math.min(100, Math.round((dayMinutes / maxMinutes) * 100));
              const barColor = dayMinutes >= 90
                ? 'bg-kv-red'
                : dayMinutes >= 60
                  ? 'bg-kv-orange'
                  : 'bg-kv-green';

              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-kv-gray-600">{dayMinutes}m</span>
                  <div className="w-full bg-kv-gray-100 rounded-t-lg relative" style={{ height: '140px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ${barColor}`}
                      style={{ height: `${height}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-xs text-kv-gray-500 font-bold">{day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 px-4 text-xs text-kv-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-kv-green inline-block" /> Under limit</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-kv-orange inline-block" /> Approaching limit</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-kv-red inline-block" /> Over limit</span>
          </div>
        </div>
      </section>
    </div>
  );
}
