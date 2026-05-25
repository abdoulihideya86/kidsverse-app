import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { VideoCategory, ApprovedVideo } from '@/types';

const categories: { key: VideoCategory; label: string; emoji: string }[] = [
  { key: 'songs', label: 'Songs', emoji: '🎵' },
  { key: 'science', label: 'Science', emoji: '🔬' },
  { key: 'art', label: 'Art', emoji: '🎨' },
  { key: 'stories', label: 'Stories', emoji: '📖' },
];

const sampleVideos: ApprovedVideo[] = [
  { id: '1', parentId: 'p1', youtubeVideoId: 'dQw4w9WgXcQ', title: 'The ABC Song', category: 'songs', thumbnailURL: '', durationSeconds: 180, approvedAt: new Date(), approvedForProfileIds: ['1'] },
  { id: '2', parentId: 'p1', youtubeVideoId: 'abc123', title: 'Fun Science Experiment', category: 'science', thumbnailURL: '', durationSeconds: 300, approvedAt: new Date(), approvedForProfileIds: ['1'] },
  { id: '3', parentId: 'p1', youtubeVideoId: 'def456', title: 'Drawing Animals', category: 'art', thumbnailURL: '', durationSeconds: 420, approvedAt: new Date(), approvedForProfileIds: ['1'] },
  { id: '4', parentId: 'p1', youtubeVideoId: 'ghi789', title: 'Bedtime Story: The Little Prince', category: 'stories', thumbnailURL: '', durationSeconds: 600, approvedAt: new Date(), approvedForProfileIds: ['1'] },
  { id: '5', parentId: 'p1', youtubeVideoId: 'jkl012', title: 'Counting to 100', category: 'songs', thumbnailURL: '', durationSeconds: 240, approvedAt: new Date(), approvedForProfileIds: ['1'] },
  { id: '6', parentId: 'p1', youtubeVideoId: 'mno345', title: 'How Plants Grow', category: 'science', thumbnailURL: '', durationSeconds: 360, approvedAt: new Date(), approvedForProfileIds: ['1'] },
];

export default function VideoCategories() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const [activeCategory, setActiveCategory] = useState<VideoCategory>('songs');
  const [pin, setPin] = useState('');
  const [showPinGate, setShowPinGate] = useState(false);
  const [pinError, setPinError] = useState(false);

  const filteredVideos = sampleVideos.filter((v) => v.category === activeCategory);

  const handleVideoClick = (_video: ApprovedVideo) => {
    setShowPinGate(true);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // PIN verification would connect to parent's settings in Firestore
    if (pin.length >= 4) {
      setShowPinGate(false);
      setPin('');
      setPinError(false);
      // Navigate to the video player
    } else {
      setPinError(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="kv-page">
      <header className="mb-6">
        <button onClick={() => navigate(`/kids/${profileId}`)} className="kv-button-base bg-kv-gray-200 text-kv-gray-600 px-4 py-2 text-sm mb-4" aria-label="Back to home">← Home</button>
        <h1 className="text-2xl md:text-3xl font-display text-kv-purple">Videos</h1>
        <p className="text-kv-gray-500 mt-1">Watch parent-approved videos!</p>
      </header>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto kv-scroll-hidden pb-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`kv-button-base px-5 py-3 flex items-center gap-2 flex-shrink-0 text-base ${
              activeCategory === cat.key ? 'bg-kv-purple text-white' : 'bg-white text-kv-gray-600 border-2 border-kv-gray-200'
            }`}
            aria-label={`Show ${cat.label} videos`}
            aria-pressed={activeCategory === cat.key}
          >
            <span className="text-xl" aria-hidden="true">{cat.emoji}</span>
            <span className="font-bold">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVideos.map((video) => (
          <motion.button
            key={video.id}
            whileHover={{ y: -4 }}
            onClick={() => handleVideoClick(video)}
            className="kv-card-interactive text-left"
            aria-label={`Watch "${video.title}" — ${formatDuration(video.durationSeconds)}`}
          >
            <div className="w-full aspect-video rounded-xl bg-kv-gray-100 flex items-center justify-center mb-3 relative overflow-hidden">
              <span className="text-5xl" aria-hidden="true">▶️</span>
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                {formatDuration(video.durationSeconds)}
              </span>
            </div>
            <h3 className="font-bold text-kv-gray-800 truncate">{video.title}</h3>
            <p className="text-sm text-kv-gray-400 capitalize">{video.category}</p>
          </motion.button>
        ))}
      </div>

      {/* PIN Gate Modal */}
      {showPinGate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Parent PIN verification">
          <div className="bg-white rounded-3xl shadow-modal p-6 md:p-8 w-full max-w-sm text-center">
            <span className="text-5xl block mb-4" aria-hidden="true">🔒</span>
            <h2 className="text-xl font-display text-kv-gray-800 mb-2">Parent PIN Required</h2>
            <p className="text-sm text-kv-gray-500 mb-6">Enter your parent PIN to watch videos</p>

            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                className={`w-full px-4 py-3 rounded-2xl border-2 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none mb-4 ${
                  pinError ? 'border-kv-red' : 'border-kv-gray-200 focus:border-kv-purple'
                }`}
                placeholder="••••"
                maxLength={6}
                autoComplete="off"
                aria-label="Enter parent PIN"
                autoFocus
              />
              {pinError && (
                <p className="text-sm text-kv-red mb-3">PIN must be at least 4 digits</p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowPinGate(false); setPin(''); setPinError(false); }} className="flex-1 kv-button-base bg-kv-gray-200 text-kv-gray-600 py-3" aria-label="Cancel">
                  Cancel
                </button>
                <button type="submit" className="flex-1 kv-button-base bg-kv-purple text-white py-3 font-bold" aria-label="Submit PIN">
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
