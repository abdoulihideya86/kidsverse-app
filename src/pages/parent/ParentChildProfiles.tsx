import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import {
  getChildProfiles,
  createChildProfile,
  updateChildProfile,
  deleteChildProfile,
} from '@/lib/firestore';
import { APP_CONFIG } from '@/lib/firebase';
import type { ChildProfile, AvatarAnimal, AgeRange } from '@/types';
import { cn, getAvatarEmoji } from '@/lib/utils';
import { Modal, ConfirmDialog } from '@/components';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/components/animations';

// ── Constants ──

const AVATARS: AvatarAnimal[] = [
  'bear', 'bunny', 'cat', 'dog', 'elephant', 'fox',
  'giraffe', 'koala', 'lion', 'monkey', 'panda', 'penguin',
];

const AGE_OPTIONS: AgeRange[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

// ── Avatar background class mapping ──

const avatarBgClasses: Record<AvatarAnimal, string> = {
  bear: 'bg-orange-100',
  bunny: 'bg-pink-100',
  cat: 'bg-yellow-100',
  dog: 'bg-green-100',
  elephant: 'bg-blue-100',
  fox: 'bg-red-100',
  giraffe: 'bg-yellow-100',
  koala: 'bg-gray-100',
  lion: 'bg-orange-100',
  monkey: 'bg-purple-100',
  panda: 'bg-gray-100',
  penguin: 'bg-blue-100',
};

// ── Component ──

export default function ParentChildProfiles() {
  const navigate = useNavigate();
  const { user, childProfiles } = useAuthStore();

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChildProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState<AgeRange>(4);
  const [avatar, setAvatar] = useState<AvatarAnimal>('bear');
  const [screenTimeLimit, setScreenTimeLimit] = useState(30);

  // ── Load profiles from Firestore ──

  useEffect(() => {
    if (!user || hasLoaded) return;

    let cancelled = false;

    async function loadProfiles() {
      try {
        const profiles = await getChildProfiles(user!.uid);
        if (!cancelled) {
          useAuthStore.getState().setChildProfiles(profiles);
        }
      } catch (error) {
        console.error('Failed to load child profiles:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setHasLoaded(true);
        }
      }
    }

    loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [user, hasLoaded]);

  // ── Derived ──

  const canAddMore = childProfiles.length < APP_CONFIG.maxChildProfiles;
  const isEditMode = editingProfile !== null;
  const modalTitle = isEditMode ? `Edit ${editingProfile.name}` : 'New Child Profile';
  const submitLabel = isEditMode ? 'Save Changes' : 'Create Profile';

  // ── Modal helpers ──

  const resetForm = () => {
    setName('');
    setAge(4);
    setAvatar('bear');
    setScreenTimeLimit(30);
  };

  const openAddModal = () => {
    resetForm();
    setEditingProfile(null);
    setShowModal(true);
  };

  const openEditModal = (profile: ChildProfile) => {
    setName(profile.name);
    setAge(profile.age);
    setAvatar(profile.avatar);
    setScreenTimeLimit(profile.screenTimeLimitMinutes);
    setEditingProfile(profile);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProfile(null);
  };

  // ── Form submit ──

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const trimmedName = name.trim();

      if (isEditMode && editingProfile) {
        // Update in Firestore
        await updateChildProfile(editingProfile.id, {
          name: trimmedName,
          age,
          avatar,
          screenTimeLimitMinutes: screenTimeLimit,
        });
        // Update in store
        useAuthStore.getState().updateChildProfile(editingProfile.id, {
          name: trimmedName,
          age,
          avatar,
          screenTimeLimitMinutes: screenTimeLimit,
          updatedAt: new Date(),
        });
      } else {
        // Create in Firestore → returns doc ID
        const id = await createChildProfile({
          parentId: user.uid,
          name: trimmedName,
          age,
          avatar,
          screenTimeLimitMinutes: screenTimeLimit,
          contentFilters: [],
        });
        // Add to store
        useAuthStore.getState().addChildProfile({
          id,
          parentId: user.uid,
          name: trimmedName,
          age,
          avatar,
          screenTimeLimitMinutes: screenTimeLimit,
          contentFilters: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      handleCloseModal();
    } catch (error) {
      console.error('Failed to save child profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete handler ──

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteChildProfile(deleteTarget.id);
      useAuthStore.getState().removeChildProfile(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete child profile:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Loading state ──

  if (isLoading) {
    return (
      <div className="kv-page flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="kv-skeleton w-12 h-12 rounded-full mx-auto mb-4" aria-hidden="true" />
          <p className="text-kv-gray-500 text-lg">Loading profiles…</p>
        </div>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="kv-page">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/parent')}
            className="kv-button-base bg-kv-gray-200 text-kv-gray-600 px-4 py-2 text-sm mb-4"
            aria-label="Back to dashboard"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-display text-kv-blue">Child Profiles</h1>
          <p className="text-kv-gray-500 mt-1">
            {childProfiles.length} of {APP_CONFIG.maxChildProfiles} profiles created
          </p>
        </div>
        {canAddMore && (
          <button
            onClick={openAddModal}
            className="kv-button-base bg-kv-green text-white px-6 py-3 font-display"
            aria-label="Add a new child profile"
          >
            + Add Child
          </button>
        )}
      </header>

      {/* Profile Cards Grid */}
      {childProfiles.length === 0 ? (
        <div className="kv-card text-center py-16">
          <span className="text-6xl block mb-4" aria-hidden="true">👶</span>
          <h2 className="text-xl font-bold text-kv-gray-700 mb-2">No Profiles Yet</h2>
          <p className="text-kv-gray-500 max-w-md mx-auto mb-6">
            Create your first child profile to get started with KidsVerse. Each child gets
            their own personalized learning experience.
          </p>
          <button
            onClick={openAddModal}
            className="kv-button-base bg-kv-green text-white px-6 py-3 font-display"
            aria-label="Add your first child profile"
          >
            + Add Your First Child
          </button>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {childProfiles.map((profile) => (
            <motion.div key={profile.id} variants={staggerItem}>
              <div className="kv-card p-5">
                {/* Avatar + Info */}
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center text-4xl flex-shrink-0',
                      avatarBgClasses[profile.avatar],
                    )}
                    aria-hidden="true"
                  >
                    {getAvatarEmoji(profile.avatar)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-kv-gray-800 truncate">{profile.name}</h3>
                    <p className="text-sm text-kv-gray-500">Age {profile.age}</p>
                    <p className="text-sm text-kv-gray-400">{profile.screenTimeLimitMinutes} min/day</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/kids/${profile.id}`)}
                    className="flex-1 kv-button-base bg-kv-blue text-white py-2.5 text-sm font-display"
                    aria-label={`Launch Kids Mode for ${profile.name}`}
                  >
                    🚀 Launch
                  </button>
                  <button
                    onClick={() => openEditModal(profile)}
                    className="kv-button-base bg-kv-gray-100 text-kv-gray-500 px-3 py-2.5 text-sm hover:bg-kv-blue/10 hover:text-kv-blue transition-colors"
                    aria-label={`Edit ${profile.name}'s profile`}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setDeleteTarget(profile)}
                    className="kv-button-base bg-kv-gray-100 text-kv-gray-500 px-3 py-2.5 text-sm hover:bg-red-50 hover:text-kv-red transition-colors"
                    aria-label={`Delete ${profile.name}'s profile`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Add / Edit Profile Modal ── */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={modalTitle}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="child-name" className="block text-sm font-bold text-kv-gray-700 mb-1">
              Child&apos;s Name
            </label>
            <input
              id="child-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-blue focus:outline-none text-lg"
              placeholder="Enter your child's name"
              maxLength={30}
              required
              aria-required="true"
            />
          </div>

          {/* Age */}
          <div>
            <label htmlFor="child-age" className="block text-sm font-bold text-kv-gray-700 mb-1">
              Age
            </label>
            <select
              id="child-age"
              value={age}
              onChange={(e) => setAge(Number(e.target.value) as AgeRange)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-blue focus:outline-none text-lg bg-white"
              aria-label="Select child's age"
            >
              {AGE_OPTIONS.map((a) => (
                <option key={a} value={a}>{a} years old</option>
              ))}
            </select>
          </div>

          {/* Avatar Selector */}
          <fieldset>
            <legend className="block text-sm font-bold text-kv-gray-700 mb-2">
              Choose an Avatar
            </legend>
            <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Avatar selection">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={cn(
                    'w-full aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all',
                    avatar === av
                      ? 'bg-kv-blue ring-4 ring-kv-blue/30 scale-105'
                      : 'bg-kv-gray-100 hover:bg-kv-gray-200',
                  )}
                  role="radio"
                  aria-checked={avatar === av}
                  aria-label={`${av} avatar`}
                >
                  {getAvatarEmoji(av)}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Screen Time Slider */}
          <div>
            <label htmlFor="screen-time-limit" className="block text-sm font-bold text-kv-gray-700 mb-1">
              Daily Screen Time Limit: {screenTimeLimit} minutes
            </label>
            <input
              id="screen-time-limit"
              type="range"
              min={15}
              max={180}
              step={5}
              value={screenTimeLimit}
              onChange={(e) => setScreenTimeLimit(Number(e.target.value))}
              className="w-full h-3 rounded-full bg-kv-gray-200 accent-kv-blue"
              aria-valuemin={15}
              aria-valuemax={180}
              aria-valuenow={screenTimeLimit}
            />
            <div className="flex justify-between text-xs text-kv-gray-400 mt-1">
              <span>15 min</span>
              <span>180 min</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full kv-button-base bg-kv-green text-white py-3 text-lg font-display disabled:opacity-50"
            aria-label={submitLabel}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : submitLabel}
          </button>
        </form>
      </Modal>

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Child Profile"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name}'s profile? This action cannot be undone and all progress data will be lost.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
