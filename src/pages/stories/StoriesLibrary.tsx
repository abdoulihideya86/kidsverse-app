import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import {
  getFavoriteStories,
  addFavoriteStory,
  removeFavoriteStory,
  getProgress,
} from '@/lib/firestore';
import {
  MotionCard,
  Button,
  Badge,
  CategoryBadge,
  ProgressBar,
  IconArrowLeft,
  IconHome,
  AnimatedContainer,
  StaggerGrid,
  StaggerItem,
} from '@/components';
import { cn } from '@/lib/utils';
import type { Story, AgeSegment } from '@/types';

// ──────────────────────────────────────────────
// Scene Emoji Map — shared with StoryViewer
// ──────────────────────────────────────────────

export const SCENE_EMOJIS: Record<string, string> = {
  // ── The Brave Little Star (toddler / adventure) ──
  'star-sky-1': '🌟✨🌑',
  'star-small-2': '⭐🌟🌟💫',
  'star-wish-3': '🌟💫✨🌟',
  'star-girl-4': '👧🌟🌙',
  'star-shine-5': '🌟🌟🌟🌟',
  'star-home-6': '🏠👧⭐',

  // ── Sleepy Bunny's Bedtime (toddler / bedtime) ──
  'bunny-field-1': '🐇🌻🌼',
  'bunny-yawn-2': '🐇💤 carrot',
  'bunny-moon-3': '🐇🌙⭐',
  'bunny-blanket-4': '🛏️🐇🧸',
  'bunny-dream-5': '💭🐇🌈',
  'bunny-sleep-6': '🌙🐇😴',

  // ── The Happy Sun (toddler / learning) ──
  'sun-rise-1': '🌅🌍🌸',
  'sun-smile-2': '😄☀️🌈',
  'sun-flowers-3': '🌻☀️🌷',
  'sun-rain-4': '☀️🌧️🌈',
  'sun-set-5': '🌅☀️🐝',
  'sun-night-6': '🌙⭐💪',

  // ── The Counting Caterpillar (early-learner / learning) ──
  'caterpillar-garden-1': '🐛🌺🌷',
  'caterpillar-count-2': '🐛1️⃣2️⃣3️⃣',
  'caterpillar-bugs-3': '🐛🦋🐞',
  'caterpillar-nature-4': '🐛💧🪨☁️',
  'caterpillar-items-5': '🐛9️⃣🔟🌸',
  'caterpillar-sleep-6': '🐛💤🌙',

  // ── The Silly Monster Under the Bed (early-learner / funny) ──
  'monster-bed-1': '🛏️😨👀',
  'monster-peek-2': '👾😁🛏️',
  'monster-joke-3': '👾😂🎨',
  'monster-dance-4': '👾💃🕺🎵',
  'monster-friends-5': '👶👾🤝',
  'monster-giggles-6': '👾😴🛏️💤',

  // ── Luna the Lost Puppy (early-learner / adventure) ──
  'puppy-park-1': '🐕🌳🌳🎾',
  'puppy-lost-2': '🐕😰❓',
  'puppy-duck-3': '🐕🦆🌊',
  'puppy-cat-4': '🐕🐱🐈',
  'puppy-home-5': '🐕🏠👧',
  'puppy-hug-6': '👧🐕❤️',

  // ── The Great Moon Adventure (kid / adventure) ──
  'rocket-build-1': '👦👧📦🚀',
  'rocket-launch-2': '🚀3️⃣2️⃣1️⃣',
  'space-planets-3': '🪐🪐🌍✨',
  'moon-bounce-4': '👧👦🌙🦘',
  'moon-flag-5': '🚩🌙🪨',
  'rocket-home-6': '🏠🚀🌅👦',

  // ── The Science Fair Surprise (kid / learning) ──
  'science-lab-1': '🧪🔬🥽',
  'science-idea-2': '💡👧📝',
  'science-experiment-3': '🧪🫧⚗️',
  'science-fail-4': '👧😰💥🧪',
  'science-learn-5': '📚👩‍🏫👩‍🔬',
  'science-win-6': '🏆👧👏🎉',

  // ── The Last Dragon's Song (kid / bedtime) ──
  'dragon-mountain-1': '🐉🏔️🌙',
  'dragon-lonely-2': '🐉😢⭐',
  'dragon-meets-3': '🐉👧🎶',
  'dragon-sings-4': '🐉🎵🌙✨',
  'dragon-friends-5': '🐉👧🌄',
  'dragon-dream-6': '🐉🌙💤✨',
};

// ──────────────────────────────────────────────
// ALL_STORIES — exported for StoryViewer
// ──────────────────────────────────────────────

export const ALL_STORIES: Story[] = [
  // ═══════ TODDLER STORIES (2-4) ═══════

  {
    id: 'the-brave-little-star',
    title: 'The Brave Little Star',
    ageSegment: 'toddler',
    pages: [
      { pageNumber: 1, text: 'Once upon a time, there was a little star named Twinkle who lived in the big night sky.', svgScene: 'star-sky-1', audioLabel: 'Once upon a time' },
      { pageNumber: 2, text: 'All the other stars were big and bright, but Twinkle was small and dim.', svgScene: 'star-small-2', audioLabel: 'Twinkle was small' },
      { pageNumber: 3, text: '"I want to shine bright too!" said Twinkle. "I want to help children find their way home."', svgScene: 'star-wish-3', audioLabel: 'I want to shine bright' },
      { pageNumber: 4, text: 'One night, a little girl was lost in the dark. She looked up at the sky and saw Twinkle.', svgScene: 'star-girl-4', audioLabel: 'A little girl was lost' },
      { pageNumber: 5, text: 'Twinkle gathered all her courage and shone as bright as she could! She lit the path home.', svgScene: 'star-shine-5', audioLabel: 'Twinkle shone bright' },
      { pageNumber: 6, text: 'The girl found her way home safely. "Thank you, little star!" she said with a big smile.', svgScene: 'star-home-6', audioLabel: 'The girl found her way' },
    ],
    category: 'adventure',
    totalDurationSeconds: 180,
  },
  {
    id: 'sleepy-bunnys-bedtime',
    title: "Sleepy Bunny's Bedtime",
    ageSegment: 'toddler',
    pages: [
      { pageNumber: 1, text: 'Little Bunny hopped and played in the meadow all day long.', svgScene: 'bunny-field-1', audioLabel: 'Little Bunny hopped and played' },
      { pageNumber: 2, text: 'The sun went down. Bunny yawned a big, big yawn. "I am sleepy," said Bunny.', svgScene: 'bunny-yawn-2', audioLabel: 'Bunny yawned a big yawn' },
      { pageNumber: 3, text: 'The moon came out and the stars began to twinkle in the sky.', svgScene: 'bunny-moon-3', audioLabel: 'The moon came out' },
      { pageNumber: 4, text: 'Bunny curled up in her cozy bed with her favorite teddy bear.', svgScene: 'bunny-blanket-4', audioLabel: 'Bunny curled up in bed' },
      { pageNumber: 5, text: 'She dreamed of hopping through a rainbow with all her friends.', svgScene: 'bunny-dream-5', audioLabel: 'She dreamed of a rainbow' },
    ],
    category: 'bedtime',
    totalDurationSeconds: 150,
  },
  {
    id: 'the-happy-sun',
    title: 'The Happy Sun',
    ageSegment: 'toddler',
    pages: [
      { pageNumber: 1, text: 'Every morning, the Sun wakes up and says "Good morning, world!"', svgScene: 'sun-rise-1', audioLabel: 'The Sun wakes up' },
      { pageNumber: 2, text: 'The Sun smiles a big warm smile. Everything starts to glow!', svgScene: 'sun-smile-2', audioLabel: 'The Sun smiles' },
      { pageNumber: 3, text: 'The Sun helps the flowers grow tall and the birds sing their songs.', svgScene: 'sun-flowers-3', audioLabel: 'Flowers grow tall' },
      { pageNumber: 4, text: 'Sometimes it rains, but the Sun always comes back with a beautiful rainbow!', svgScene: 'sun-rain-4', audioLabel: 'A beautiful rainbow' },
      { pageNumber: 5, text: 'When the day is done, the Sun says "Good night" and goes to sleep.', svgScene: 'sun-set-5', audioLabel: 'The Sun says good night' },
      { pageNumber: 6, text: 'But do not worry! The Sun will come back tomorrow to play again. Good night, Sun!', svgScene: 'sun-night-6', audioLabel: 'Good night Sun' },
    ],
    category: 'learning',
    totalDurationSeconds: 170,
  },

  // ═══════ EARLY LEARNER STORIES (5-7) ═══════

  {
    id: 'the-counting-caterpillar',
    title: 'The Counting Caterpillar',
    ageSegment: 'early-learner',
    pages: [
      { pageNumber: 1, text: 'Cody the Caterpillar loved to count things. One sunny morning, he decided to count all the flowers in the garden.', svgScene: 'caterpillar-garden-1' },
      { pageNumber: 2, text: '"One red flower, two yellow flowers, three blue flowers..." Cody counted happily while crawling along.', svgScene: 'caterpillar-count-2' },
      { pageNumber: 3, text: 'He counted four butterflies dancing in the air and five ladybugs sitting on leaves.', svgScene: 'caterpillar-bugs-3' },
      { pageNumber: 4, text: '"Six drops of dew on the grass, seven pebbles on the path, eight clouds in the sky," Cody continued.', svgScene: 'caterpillar-nature-4' },
      { pageNumber: 5, text: 'He found nine seeds and ten petals that had fallen from a flower. What a wonderful day of counting!', svgScene: 'caterpillar-items-5' },
      { pageNumber: 6, text: "I counted all the way to ten! Cody said proudly. Tomorrow I'll count to twenty!", svgScene: 'caterpillar-sleep-6' },
      { pageNumber: 7, text: "That night Cody dreamed of numbers dancing all around him. What will he count next?", svgScene: 'caterpillar-sleep-6' },
      { pageNumber: 8, text: "When Cody woke up he was inside a beautiful cocoon. Soon he would become a butterfly and count wings!", svgScene: 'caterpillar-nature-4' },
    ],
    category: 'learning',
    totalDurationSeconds: 240,
  },
  {
    id: 'the-silly-monster-under-the-bed',
    title: 'The Silly Monster Under the Bed',
    ageSegment: 'early-learner',
    pages: [
      { pageNumber: 1, text: 'Lily heard a funny noise under her bed. "What was that?" she whispered.', svgScene: 'monster-bed-1' },
      { pageNumber: 2, text: 'She peeked under the bed and saw... a tiny purple monster with polka dots and big googly eyes!', svgScene: 'monster-peek-2' },
      { pageNumber: 3, text: '"Boo!" said the monster. But then he tripped over a toy and bumped his nose. "Owie!"', svgScene: 'monster-joke-3' },
      { pageNumber: 4, text: 'The monster started dancing to make Lily laugh. He wiggled his arms and shook his tummy!', svgScene: 'monster-dance-4' },
      { pageNumber: 5, text: '"My name is Giggles!" said the monster. "I just wanted a friend to play with."', svgScene: 'monster-friends-5' },
      { pageNumber: 6, text: 'Lily and Giggles played every night. And when it was time for bed, Giggles always told the silliest jokes to make Lily fall asleep laughing.', svgScene: 'monster-giggles-6' },
      { pageNumber: 7, text: '"Why did the banana go to the doctor? Because it was not peeling well!" Giggles giggled.', svgScene: 'monster-dance-4' },
    ],
    category: 'funny',
    totalDurationSeconds: 260,
  },
  {
    id: 'luna-the-lost-puppy',
    title: 'Luna the Lost Puppy',
    ageSegment: 'early-learner',
    pages: [
      { pageNumber: 1, text: 'Luna was a fluffy golden puppy who loved to play fetch in the park.', svgScene: 'puppy-park-1' },
      { pageNumber: 2, text: 'One day Luna chased a butterfly too far and realized she did not know where she was.', svgScene: 'puppy-lost-2' },
      { pageNumber: 3, text: '"Excuse me," said Luna to a duck by the pond. "Can you help me find my way home?"', svgScene: 'puppy-duck-3' },
      { pageNumber: 4, text: 'A friendly cat on a fence said, "Follow the big oak tree! It is near your house."', svgScene: 'puppy-cat-4' },
      { pageNumber: 5, text: 'Luna followed the path past the oak tree and saw her house! Her girl was waiting at the door.', svgScene: 'puppy-home-5' },
      { pageNumber: 6, text: '"Luna! You are home!" her girl cheered, giving Luna the biggest hug ever.', svgScene: 'puppy-hug-6' },
      { pageNumber: 7, text: 'From that day on, Luna always stayed close to home. But she still chased butterflies — just not too far!', svgScene: 'puppy-park-1' },
      { pageNumber: 8, text: 'And every night Luna dreamed of her adventure with the helpful duck and the kind cat.', svgScene: 'puppy-duck-3' },
    ],
    category: 'adventure',
    totalDurationSeconds: 280,
  },

  // ═══════ KID STORIES (8-10) ═══════

  {
    id: 'the-great-moon-adventure',
    title: 'The Great Moon Adventure',
    ageSegment: 'kid',
    pages: [
      { pageNumber: 1, text: "Best friends Mia and Leo built a rocket ship from old boxes and bottles in Leo's backyard.", svgScene: 'rocket-build-1' },
      { pageNumber: 2, text: '"3, 2, 1... BLAST OFF!" They counted together as their rocket zoomed up into the starry night sky.', svgScene: 'rocket-launch-2' },
      { pageNumber: 3, text: 'They flew past twinkling stars and colorful planets. Jupiter was enormous and Saturn had beautiful rings.', svgScene: 'space-planets-3' },
      { pageNumber: 4, text: 'When they landed on the Moon, they bounced high in the low gravity. "This is amazing!" laughed Mia.', svgScene: 'moon-bounce-4' },
      { pageNumber: 5, text: 'They left a flag that said "Mia & Leo were here!" and collected moon rocks as souvenirs.', svgScene: 'moon-flag-5' },
      { pageNumber: 6, text: 'As morning came, they flew back home and landed safely in the backyard. "Same time tomorrow?" asked Leo with a grin.', svgScene: 'rocket-home-6' },
      { pageNumber: 7, text: 'At school the next day, their teacher asked what they did over the weekend. They just smiled at each other mysteriously.', svgScene: 'rocket-build-1' },
      { pageNumber: 8, text: 'Nobody believed them — except the moon rocks on their desk, which glowed faintly with a silvery light.', svgScene: 'moon-flag-5' },
      { pageNumber: 9, text: 'That night they looked up at the Moon and saw their flag waving. Their greatest adventure had only just begun.', svgScene: 'space-planets-3' },
      { pageNumber: 10, text: 'Mia opened her notebook and started sketching plans for their next journey — Mars!', svgScene: 'rocket-launch-2' },
    ],
    category: 'adventure',
    totalDurationSeconds: 360,
  },
  {
    id: 'the-science-fair-surprise',
    title: 'The Science Fair Surprise',
    ageSegment: 'kid',
    pages: [
      { pageNumber: 1, text: 'Emma was nervous about the school science fair. Everyone else had amazing projects — volcanoes, robots, and solar system models.', svgScene: 'science-lab-1' },
      { pageNumber: 2, text: 'Emma had an idea: what if she could make a plant grow using different kinds of music? She set up four pots with seeds.', svgScene: 'science-idea-2' },
      { pageNumber: 3, text: 'She played classical music for one, rock music for another, pop for the third, and silence for the fourth. She measured them every day.', svgScene: 'science-experiment-3' },
      { pageNumber: 4, text: 'Disaster! A gust of wind knocked over the rock music plant. Emma was devastated. All her data was ruined.', svgScene: 'science-fail-4' },
      { pageNumber: 5, text: 'Her science teacher, Mrs. Chen, said, "In science, failures teach us just as much as successes. Why not present what you learned?"', svgScene: 'science-learn-5' },
      { pageNumber: 6, text: 'Emma presented her findings honestly. The classical music plant grew the tallest, but the surprise? The silence plant was almost as tall!', svgScene: 'science-win-6' },
      { pageNumber: 7, text: 'The judges loved her honesty and creative thinking. "Real science is about the truth, not just results," the head judge said.', svgScene: 'science-win-6' },
      { pageNumber: 8, text: 'Emma won second place! She learned that sometimes the most important discoveries come from things that do not go as planned.', svgScene: 'science-idea-2' },
    ],
    category: 'learning',
    totalDurationSeconds: 340,
  },
  {
    id: 'the-last-dragons-song',
    title: "The Last Dragon's Song",
    ageSegment: 'kid',
    pages: [
      { pageNumber: 1, text: 'High above the clouds, on a mountain no map could find, lived the last dragon in the world. His name was Aethon.', svgScene: 'dragon-mountain-1' },
      { pageNumber: 2, text: 'Aethon was ancient and lonely. The other dragons had disappeared long ago, and with them, the songs they used to sing together.', svgScene: 'dragon-lonely-2' },
      { pageNumber: 3, text: 'One night a young girl named Sage climbed the mountain. She was lost, cold, and afraid. Aethon warmed her with his gentle flame.', svgScene: 'dragon-meets-3' },
      { pageNumber: 4, text: '"Will you sing for me?" Sage asked. Aethon was surprised — no one had asked in a thousand years. He took a deep breath and began.', svgScene: 'dragon-sings-4' },
      { pageNumber: 5, text: 'His song was beautiful beyond words — it told of oceans, forests, and stars. It made the northern lights dance across the sky.', svgScene: 'dragon-sings-4' },
      { pageNumber: 6, text: '"I will come back every night," Sage promised. And she did. Aethon taught her the old songs, and she taught him new ones.', svgScene: 'dragon-friends-5' },
      { pageNumber: 7, text: 'Years passed. Sage grew up but never forgot the dragon. One winter night she brought her daughter to hear the ancient song.', svgScene: 'dragon-meets-3' },
      { pageNumber: 8, text: 'Aethon knew he was the last, but now the songs would live on through Sage and her family. He closed his eyes peacefully, knowing the music would never truly end.', svgScene: 'dragon-dream-6' },
      { pageNumber: 9, text: 'That night, for the first time in a thousand years, two new stars appeared in the sky, shaped like dragon wings, shining to a melody only the dreamers could hear.', svgScene: 'dragon-dream-6' },
    ],
    category: 'bedtime',
    totalDurationSeconds: 400,
  },
];

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  Story['category'],
  { emoji: string; gradient: string; label: string }
> = {
  adventure: {
    emoji: '🗺️',
    gradient: 'from-kv-blue to-kv-cyan',
    label: 'Adventure',
  },
  learning: {
    emoji: '📚',
    gradient: 'from-kv-green to-kv-teal',
    label: 'Learning',
  },
  bedtime: {
    emoji: '🌙',
    gradient: 'from-kv-purple to-kv-pink',
    label: 'Bedtime',
  },
  funny: {
    emoji: '😂',
    gradient: 'from-kv-orange to-kv-yellow',
    label: 'Funny',
  },
};

const AGE_FILTERS: { value: AgeSegment | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All Ages', emoji: '🌈' },
  { value: 'toddler', label: 'Ages 2-4', emoji: '🧒' },
  { value: 'early-learner', label: 'Ages 5-7', emoji: '👦' },
  { value: 'kid', label: 'Ages 8-10', emoji: '🧑' },
];

const CATEGORIES: (Story['category'] | 'all')[] = [
  'all',
  'adventure',
  'learning',
  'bedtime',
  'funny',
];

const STORY_COVER_EMOJIS: Record<string, string> = {
  'the-brave-little-star': '🌟',
  'sleepy-bunnys-bedtime': '🐇',
  'the-happy-sun': '☀️',
  'the-counting-caterpillar': '🐛',
  'the-silly-monster-under-the-bed': '👾',
  'luna-the-lost-puppy': '🐕',
  'the-great-moon-adventure': '🚀',
  'the-science-fair-surprise': '🔬',
  'the-last-dragons-song': '🐉',
};

function getAgeRangeLabel(segment: AgeSegment): string {
  switch (segment) {
    case 'toddler':
      return 'Ages 2-4';
    case 'early-learner':
      return 'Ages 5-7';
    case 'kid':
      return 'Ages 8-10';
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  return `${mins} min read`;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export default function StoriesLibrary() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { activeChildProfile } = useAuthStore();
  const childId = activeChildProfile?.id ?? '';
  const parentId = activeChildProfile?.parentId ?? '';
  const childAge = activeChildProfile?.age ?? 5;

  const config = useAgeAdaptiveConfig(childAge);
  const { playClick, playSuccess, playPop } = useSoundEffects();
  const queryClient = useQueryClient();

  // ── Filter state ──
  const [categoryFilter, setCategoryFilter] = useState<Story['category'] | 'all'>('all');
  const [ageFilter, setAgeFilter] = useState<AgeSegment | 'all'>(config.segment);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ── Firestore: favorites ──
  const { data: favoriteStories = [] } = useQuery({
    queryKey: ['favoriteStories', childId],
    queryFn: () => getFavoriteStories(childId),
    enabled: !!childId,
  });

  const favoriteStoryIds = useMemo(
    () => new Set(favoriteStories.map((f) => f.storyId)),
    [favoriteStories],
  );

  const addFavMutation = useMutation({
    mutationFn: (storyId: string) =>
      addFavoriteStory({
        childId,
        parentId,
        storyId,
        addedAt: new Date(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteStories', childId] });
      playSuccess();
    },
  });

  const removeFavMutation = useMutation({
    mutationFn: (favId: string) => removeFavoriteStory(favId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteStories', childId] });
      playPop();
    },
  });

  // ── Firestore: progress ──
  const { data: progressEntries = [] } = useQuery({
    queryKey: ['progress', childId],
    queryFn: () => getProgress(childId),
    enabled: !!childId,
  });

  const completedStoryIds = useMemo(() => {
    const set = new Set<string>();
    for (const p of progressEntries) {
      if (p.completed) {
        set.add(p.moduleId);
      }
    }
    return set;
  }, [progressEntries]);

  // ── Derived: filtered stories ──
  const filteredStories = useMemo(() => {
    return ALL_STORIES.filter((story) => {
      if (categoryFilter !== 'all' && story.category !== categoryFilter) return false;
      if (ageFilter !== 'all' && story.ageSegment !== ageFilter) return false;
      if (showFavoritesOnly && !favoriteStoryIds.has(story.id)) return false;
      return true;
    });
  }, [categoryFilter, ageFilter, showFavoritesOnly, favoriteStoryIds]);

  // ── Age-adaptive grid config ──
  const gridCols = config.segment === 'toddler'
    ? 'grid-cols-1'
    : config.segment === 'early-learner'
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  const showTextFilters = config.showTextLabels;
  const showReadingTime = config.segment === 'kid';
  const minTapSize = config.minTapTargetPx;

  // ── Handlers ──
  const handleCategoryFilter = useCallback(
    (cat: Story['category'] | 'all') => {
      playClick();
      setCategoryFilter(cat);
    },
    [playClick],
  );

  const handleAgeFilter = useCallback(
    (age: AgeSegment | 'all') => {
      playClick();
      setAgeFilter(age);
    },
    [playClick],
  );

  const handleToggleFavorites = useCallback(() => {
    playClick();
    setShowFavoritesOnly((prev) => !prev);
  }, [playClick]);

  const handleStoryClick = useCallback(
    (storyId: string) => {
      playClick();
      navigate(`/stories/${profileId}/${storyId}`);
    },
    [navigate, playClick, profileId],
  );

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, storyId: string) => {
      e.stopPropagation();
      const existingFav = favoriteStories.find((f) => f.storyId === storyId);
      if (existingFav) {
        removeFavMutation.mutate(existingFav.id);
      } else {
        addFavMutation.mutate(storyId);
      }
    },
    [favoriteStories, addFavMutation, removeFavMutation],
  );

  const handleResetFilters = useCallback(() => {
    playClick();
    setCategoryFilter('all');
    setAgeFilter(config.segment);
    setShowFavoritesOnly(false);
  }, [config.segment, playClick]);

  // ── Render ──
  return (
    <div className="kv-page">
      {/* ── Header ── */}
      <AnimatedContainer variant="slideUp" className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size={config.segment === 'toddler' ? 'toddler' : 'md'}
            onClick={() => navigate(`/kids/${profileId}`)}
            aria-label="Go back to home"
            leftIcon={<IconArrowLeft size={24} />}
          >
            {showTextFilters ? 'Back' : '🏠'}
          </Button>
          <Button
            variant="ghost"
            size={config.segment === 'toddler' ? 'toddler' : 'md'}
            onClick={() => navigate(`/kids/${profileId}`)}
            aria-label="Go to home"
            leftIcon={<IconHome size={24} />}
          >
            {showTextFilters ? 'Home' : '🏡'}
          </Button>
        </div>

        <h1 className="text-3xl md:text-4xl font-display text-kv-pink">
          {config.segment === 'toddler' ? '📖 📚' : ''} Story Library
        </h1>
        <p className="text-kv-gray-500 mt-1 text-lg">
          {showTextFilters
            ? 'Choose a story to read or listen to!'
            : '📖✨🌟'}
        </p>
      </AnimatedContainer>

      {/* ── Filters ── */}
      <AnimatedContainer variant="slideUp" delay={0.1}>
        <div
          className="mb-6 space-y-3"
          role="search"
          aria-label="Story filters"
        >
          {/* Category filters */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
            {CATEGORIES.map((cat) => {
              const isAll = cat === 'all';
              const cfg = isAll ? null : CATEGORY_CONFIG[cat];
              return (
                <CategoryBadge
                  key={cat}
                  label={showTextFilters ? (isAll ? 'All' : (cfg?.label ?? cat)) : ''}
                  emoji={isAll ? '📖' : cfg?.emoji}
                  active={categoryFilter === cat}
                  onClick={() => handleCategoryFilter(cat)}
                />
              );
            })}
          </div>

          {/* Age filters */}
          {showTextFilters && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Age group filters">
              {AGE_FILTERS.map((af) => (
                <CategoryBadge
                  key={af.value}
                  label={`${af.emoji} ${af.label}`}
                  active={ageFilter === af.value}
                  onClick={() => handleAgeFilter(af.value)}
                />
              ))}
            </div>
          )}

          {/* Emoji-only age filters for toddlers */}
          {!showTextFilters && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Age group filters">
              {AGE_FILTERS.map((af) => (
                <motion.button
                  key={af.value}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAgeFilter(af.value)}
                  className={cn(
                    'rounded-full flex items-center justify-center text-2xl',
                    ageFilter === af.value
                      ? 'bg-kv-blue text-white shadow-button'
                      : 'bg-white border-2 border-kv-gray-200 shadow-card',
                  )}
                  style={{ minWidth: minTapSize, minHeight: minTapSize }}
                  aria-label={af.label}
                  aria-pressed={ageFilter === af.value}
                >
                  {af.emoji}
                </motion.button>
              ))}
            </div>
          )}

          {/* Favorites toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleFavorites}
            className={cn(
              'kv-button-base px-4 py-2 text-sm flex items-center gap-1.5',
              showFavoritesOnly
                ? 'bg-kv-yellow text-kv-gray-800 shadow-button'
                : 'bg-white text-kv-gray-600 border-2 border-kv-gray-200',
            )}
            style={{ minHeight: minTapSize }}
            aria-label={showFavoritesOnly ? 'Show all stories' : 'Show favorites only'}
            aria-pressed={showFavoritesOnly}
          >
            <span aria-hidden="true" className="text-xl">{showFavoritesOnly ? '❤️' : '🤍'}</span>
            {showTextFilters && <span className="font-bold">Favorites</span>}
          </motion.button>
        </div>
      </AnimatedContainer>

      {/* ── Results count (screen reader) ── */}
      <div aria-live="polite" className="sr-only">
        {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'} found
      </div>

      {/* ── Visible results count ── */}
      {showTextFilters && filteredStories.length > 0 && (
        <p className="text-sm text-kv-gray-400 mb-4">
          {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
          {categoryFilter !== 'all' ? ` in ${CATEGORY_CONFIG[categoryFilter]?.label}` : ''}
          {ageFilter !== 'all' ? ` for ${AGE_FILTERS.find((a) => a.value === ageFilter)?.label}` : ''}
          {showFavoritesOnly ? ' (favorites only)' : ''}
        </p>
      )}

      {/* ── Stories Grid ── */}
      <AnimatePresence mode="wait">
        {filteredStories.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.span
              className="text-7xl block mb-6"
              aria-hidden="true"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              📖
            </motion.span>
            <h2 className="text-2xl font-bold text-kv-gray-700 mb-2">No stories found</h2>
            <p className="text-kv-gray-500 mb-6">Try changing the filters to see more stories.</p>
            <Button variant="secondary" size="lg" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </motion.div>
        ) : (
          <StaggerGrid key="grid" className={cn('grid gap-6', gridCols)}>
            {filteredStories.map((story) => {
              const isFav = favoriteStoryIds.has(story.id);
              const isRead = completedStoryIds.has(story.id);
              const catCfg = CATEGORY_CONFIG[story.category];
              const coverEmoji = STORY_COVER_EMOJIS[story.id] ?? '📖';
              const ageLabel = getAgeRangeLabel(story.ageSegment);

              return (
                <StaggerItem key={story.id}>
                  <MotionCard
                    asMotion
                    variant="interactive"
                    padding="none"
                    onClick={() => handleStoryClick(story.id)}
                    className="overflow-hidden"
                    aria-label={`Read "${story.title}" — ${story.pages.length} pages, ${catCfg.label}${isRead ? ', completed' : ''}`}
                    role="article"
                  >
                    {/* Cover gradient */}
                    <div
                      className={cn(
                        'w-full h-44 sm:h-48 bg-gradient-to-br flex items-center justify-center relative',
                        catCfg.gradient,
                      )}
                    >
                      <span className="text-6xl sm:text-7xl" aria-hidden="true">
                        {coverEmoji}
                      </span>

                      {/* Read badge */}
                      {isRead && (
                        <Badge
                          variant="success"
                          size="sm"
                          className="absolute top-3 left-3"
                        >
                          ✅ Read
                        </Badge>
                      )}

                      {/* Favorite button */}
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => handleToggleFavorite(e, story.id)}
                        className={cn(
                          'absolute top-3 right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full',
                          'flex items-center justify-center',
                          'bg-white/80 backdrop-blur-sm',
                          'hover:bg-white transition-colors shadow-sm',
                        )}
                        style={{
                          minWidth: Math.max(44, minTapSize * 0.5),
                          minHeight: Math.max(44, minTapSize * 0.5),
                        }}
                        aria-label={isFav ? `Remove "${story.title}" from favorites` : `Add "${story.title}" to favorites`}
                        disabled={addFavMutation.isPending || removeFavMutation.isPending}
                      >
                        <motion.span
                          className="text-xl sm:text-2xl"
                          animate={isFav ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                          transition={{ duration: 0.3 }}
                          aria-hidden="true"
                        >
                          {isFav ? '❤️' : '🤍'}
                        </motion.span>
                      </motion.button>
                    </div>

                    {/* Card content */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg sm:text-xl text-kv-gray-800 truncate leading-tight">
                            {story.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="default" size="sm">
                              {`${catCfg.emoji}${showTextFilters ? ` ${catCfg.label}` : ''}`}
                            </Badge>
                            <Badge variant="primary" size="sm">
                              {ageLabel}
                            </Badge>
                          </div>

                          {showTextFilters && (
                            <p className="text-sm text-kv-gray-500 mt-2">
                              {story.pages.length} pages
                              {showReadingTime && (
                                <span className="ml-2">· {formatDuration(story.totalDurationSeconds)}</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Reading progress bar (if partially read) */}
                      {isRead && showTextFilters && (
                        <div className="mt-3">
                          <ProgressBar
                            value={100}
                            max={100}
                            variant="green"
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  </MotionCard>
                </StaggerItem>
              );
            })}
          </StaggerGrid>
        )}
      </AnimatePresence>
    </div>
  );
}
