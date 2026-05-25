import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { VideoCategory } from '@/types';

interface ApprovedVideoItem {
  id: string;
  title: string;
  youtubeVideoId: string;
  category: VideoCategory;
  thumbnailURL: string;
}

export default function ParentVideoManager() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<ApprovedVideoItem[]>([
    { id: '1', title: 'ABC Song for Kids', youtubeVideoId: 'dQw4w9WgXcQ', category: 'songs', thumbnailURL: '' },
    { id: '2', title: 'Why is the Sky Blue?', youtubeVideoId: 'abc123', category: 'science', thumbnailURL: '' },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState<VideoCategory>('songs');

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId || !videoTitle.trim()) return;

    const newVideo: ApprovedVideoItem = {
      id: `video-${Date.now()}`,
      title: videoTitle.trim(),
      youtubeVideoId: videoId,
      category: videoCategory,
      thumbnailURL: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    };

    setVideos((prev) => [...prev, newVideo]);
    setShowAddForm(false);
    setYoutubeUrl('');
    setVideoTitle('');
    setVideoCategory('songs');
  };

  const handleRemoveVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const categories: VideoCategory[] = ['songs', 'science', 'art', 'stories'];

  return (
    <div className="kv-page">
      <header className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/parent')}
            className="kv-button-base bg-kv-gray-200 text-kv-gray-600 px-4 py-2 text-sm mb-4"
            aria-label="Back to dashboard"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-display text-kv-pink">Video Manager</h1>
          <p className="text-kv-gray-500 mt-1">
            Manage approved videos for your children ({videos.length} approved)
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="kv-button-base bg-kv-pink text-white px-6 py-3 font-display"
          aria-label="Add a new approved video"
        >
          + Add Video
        </button>
      </header>

      {/* Add Video Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Add new approved video">
          <div className="bg-white rounded-3xl shadow-modal p-6 md:p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display text-kv-gray-800">Add Video</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-10 h-10 rounded-full bg-kv-gray-100 flex items-center justify-center text-kv-gray-500 hover:bg-kv-gray-200"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label htmlFor="video-url" className="block text-sm font-bold text-kv-gray-700 mb-1">
                  YouTube URL
                </label>
                <input
                  id="video-url"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-pink focus:outline-none text-lg"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="video-title" className="block text-sm font-bold text-kv-gray-700 mb-1">
                  Video Title
                </label>
                <input
                  id="video-title"
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-pink focus:outline-none text-lg"
                  placeholder="Name this video"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="video-category" className="block text-sm font-bold text-kv-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="video-category"
                  value={videoCategory}
                  onChange={(e) => setVideoCategory(e.target.value as VideoCategory)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-kv-gray-200 focus:border-kv-pink focus:outline-none text-lg bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!youtubeUrl || !videoTitle}
                className="w-full kv-button-base bg-kv-pink text-white py-3 text-lg font-display disabled:opacity-50"
              >
                Approve Video
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Videos List */}
      {videos.length === 0 ? (
        <div className="kv-card text-center py-16">
          <span className="text-6xl block mb-4" aria-hidden="true">🎬</span>
          <h2 className="text-xl font-bold text-kv-gray-700 mb-2">No Approved Videos</h2>
          <p className="text-kv-gray-500 max-w-md mx-auto">
            Add YouTube videos to create a safe, curated playlist for your children. Only approved videos will be accessible in Kids Mode.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video.id} className="kv-card flex items-center gap-4">
              <div className="w-32 h-20 rounded-xl bg-kv-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden" aria-hidden="true">
                {video.thumbnailURL ? (
                  <img src={video.thumbnailURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">▶️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-kv-gray-800 truncate">{video.title}</h3>
                <p className="text-sm text-kv-gray-400">
                  ID: {video.youtubeVideoId} · {video.category}
                </p>
              </div>
              <button
                onClick={() => handleRemoveVideo(video.id)}
                className="kv-button-base bg-kv-gray-100 text-kv-gray-500 px-3 py-2 text-sm hover:bg-red-50 hover:text-kv-red"
                aria-label={`Remove ${video.title} from approved videos`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
