import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface VideoInfo {
  id: string;
  title: string;
  youtubeVideoId: string;
}

// In a real app, this would be fetched from Firestore based on videoId
const videoDatabase: Record<string, VideoInfo> = {
  'v1': { id: 'v1', title: 'The ABC Song — Learn the Alphabet!', youtubeVideoId: 'dQw4w9WgXcQ' },
  'v2': { id: 'v2', title: 'Fun Science: Why is the Sky Blue?', youtubeVideoId: 'abc123' },
  'v3': { id: 'v3', title: 'How to Draw a Cute Cat', youtubeVideoId: 'def456' },
};

const relatedVideos = [
  { id: 'v2', title: 'Fun Science: Why is the Sky Blue?', emoji: '🔬' },
  { id: 'v3', title: 'How to Draw a Cute Cat', emoji: '🎨' },
];

export default function VideoPlayer() {
  const navigate = useNavigate();
  const { profileId, videoId } = useParams<{ profileId: string; videoId: string }>();
  const [video] = useState<VideoInfo | null>(videoId ? (videoDatabase[videoId] ?? null) : null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    (window as unknown as Record<string, () => void>).onYouTubeIframeAPIReady = () => {
      // Player would be initialized here with the video ID
    };

    return () => {
      document.head.removeChild(tag);
    };
  }, []);

  if (!video) {
    return (
      <div className="kv-page flex flex-col items-center justify-center">
        <span className="text-6xl block mb-4" aria-hidden="true">📺</span>
        <h1 className="text-2xl font-display text-kv-gray-700 mb-4">Video not found</h1>
        <button onClick={() => navigate(`/watch/${profileId}`)} className="kv-button-base bg-kv-purple text-white px-6 py-3 font-display" aria-label="Back to video categories">
          Back to Videos
        </button>
      </div>
    );
  }

  return (
    <div className="kv-page">
      <header className="mb-4">
        <button onClick={() => navigate(`/watch/${profileId}`)} className="kv-button-base bg-kv-gray-200 text-kv-gray-600 px-4 py-2 text-sm" aria-label="Back to video categories">← Videos</button>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Video Player */}
        <div className="kv-card p-2 mb-6">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${video.youtubeVideoId}?rel=0&modestbranding=1&iv_load_policy=3&controls=1&disablekb=0&fs=0`}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              aria-label={`Video player: ${video.title}`}
            />
          </div>
          <div className="p-4">
            <h1 className="text-xl md:text-2xl font-bold text-kv-gray-800">{video.title}</h1>
          </div>
        </div>

        {/* Related Videos (only approved ones) */}
        <section aria-label="More approved videos">
          <h2 className="text-lg font-bold text-kv-gray-700 mb-3">More Videos</h2>
          <div className="space-y-3">
            {relatedVideos.map((rv) => (
              <button
                key={rv.id}
                onClick={() => navigate(`/watch/${profileId}/${rv.id}`)}
                className="kv-card-interactive flex items-center gap-4 w-full text-left"
                aria-label={`Watch "${rv.title}"`}
              >
                <div className="w-28 h-16 rounded-xl bg-kv-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl" aria-hidden="true">{rv.emoji}</span>
                </div>
                <span className="font-bold text-kv-gray-700 flex-1 truncate">{rv.title}</span>
                <span className="text-kv-gray-400" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
