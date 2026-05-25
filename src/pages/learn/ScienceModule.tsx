import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useAgeAdaptiveConfig } from '@/hooks/useAgeAdaptiveConfig';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { upsertProgress, awardBadge } from '@/lib/firestore';
import { cn, shuffle, pickRandom } from '@/lib/utils';
import {
  ProgressBar,
  MotionCard,
  Button,
  Badge,
  StarRating,
  AchievementBadge,
  IconArrowLeft,
  IconHome,
  AnimatedContainer,
  StaggerGrid,
  StaggerItem,
} from '@/components';
import type { AgeSegment } from '@/types';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface ScienceQuestion {
  question: string;
  emoji: string;
  correctAnswer: string;
  options: { label: string; emoji: string }[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ScienceTopic {
  id: string;
  title: string;
  emoji: string;
  cardGradient: 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'rainbow';
  accentColor: string;
  description: string;
  facts: string[];
  funFact: string;
  questions: ScienceQuestion[];
}

type ViewMode = 'explore' | 'detail' | 'quiz' | 'completion';

interface QuizState {
  currentQuestion: number;
  score: number;
  feedback: 'correct' | 'wrong' | null;
  selectedAnswer: string | null;
  questions: ScienceQuestion[];
}

// ═══════════════════════════════════════════════
// Topic Data (8 topics, each with 4 facts, 1 fun fact, 4 questions)
// ═══════════════════════════════════════════════

const SCIENCE_TOPICS: ScienceTopic[] = [
  {
    id: 'solar-system',
    title: 'The Solar System',
    emoji: '🪐',
    cardGradient: 'blue',
    accentColor: 'text-kv-blue',
    description: 'Explore the Sun, planets, and amazing space facts!',
    facts: [
      'Our Sun is a giant ball of hot gas that gives us light and warmth. It is so big that over one million Earths could fit inside it!',
      'There are 8 planets in our solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Earth is the third planet from the Sun.',
      'Jupiter is the biggest planet in our solar system. It could fit over 1,300 Earths inside it! It also has a giant storm called the Great Red Spot.',
      'Saturn has beautiful rings made of ice and rock pieces. These rings stretch out thousands of miles but are only about 30 feet thick!',
    ],
    funFact: 'If you could drive a car at highway speed to the Sun, it would take over 170 years to get there! 🚗☀️',
    questions: [
      {
        question: 'What planet do we live on?',
        emoji: '🌍',
        correctAnswer: 'Earth',
        difficulty: 'easy',
        options: [
          { label: 'Earth', emoji: '🌍' },
          { label: 'Mars', emoji: '🔴' },
          { label: 'Jupiter', emoji: '🟤' },
          { label: 'Venus', emoji: '🟡' },
        ],
      },
      {
        question: 'Which planet is the biggest?',
        emoji: '🪐',
        correctAnswer: 'Jupiter',
        difficulty: 'easy',
        options: [
          { label: 'Saturn', emoji: '💍' },
          { label: 'Earth', emoji: '🌍' },
          { label: 'Jupiter', emoji: '🟤' },
          { label: 'Neptune', emoji: '🔵' },
        ],
      },
      {
        question: 'What is the hottest thing in our solar system?',
        emoji: '☀️',
        correctAnswer: 'The Sun',
        difficulty: 'medium',
        options: [
          { label: 'Mercury', emoji: '⚙️' },
          { label: 'The Sun', emoji: '☀️' },
          { label: 'Venus', emoji: '🟡' },
          { label: 'Jupiter', emoji: '🟤' },
        ],
      },
      {
        question: 'Which planet has beautiful rings made of ice?',
        emoji: '💍',
        correctAnswer: 'Saturn',
        difficulty: 'easy',
        options: [
          { label: 'Neptune', emoji: '🔵' },
          { label: 'Uranus', emoji: '🧊' },
          { label: 'Saturn', emoji: '💍' },
          { label: 'Jupiter', emoji: '🟤' },
        ],
      },
    ],
  },
  {
    id: 'water-cycle',
    title: 'The Water Cycle',
    emoji: '💧',
    cardGradient: 'blue',
    accentColor: 'text-kv-cyan',
    description: 'Learn how water moves around our planet!',
    facts: [
      'Water exists in three forms: liquid (water), solid (ice), and gas (water vapor). You can see all three forms in nature every day!',
      'The Sun heats water in oceans, lakes, and rivers, turning it into vapor. This process is called evaporation, and it happens all around us.',
      'Water vapor rises into the sky, cools down, and forms tiny water droplets. Millions of these droplets stick together to make clouds!',
      'When clouds get heavy enough with water droplets, water falls back down as rain, snow, sleet, or hail. This is called precipitation.',
    ],
    funFact: 'The water you drink today is the same water that dinosaurs drank millions of years ago! Water on Earth never gets used up — it just keeps cycling. 🦕💧',
    questions: [
      {
        question: 'What are the three forms of water?',
        emoji: '💧',
        correctAnswer: 'Liquid, solid, and gas',
        difficulty: 'medium',
        options: [
          { label: 'Liquid, solid, and gas', emoji: '💧🧊💨' },
          { label: 'Hot, warm, and cold', emoji: '🌡️' },
          { label: 'Soft, hard, and wet', emoji: '🫧' },
          { label: 'Big, small, and tiny', emoji: '🔍' },
        ],
      },
      {
        question: 'What do we call it when the Sun turns water into vapor?',
        emoji: '☀️',
        correctAnswer: 'Evaporation',
        difficulty: 'hard',
        options: [
          { label: 'Rainfall', emoji: '🌧️' },
          { label: 'Freezing', emoji: '🧊' },
          { label: 'Evaporation', emoji: '💨' },
          { label: 'Condensation', emoji: '☁️' },
        ],
      },
      {
        question: 'What happens when clouds get too heavy?',
        emoji: '☁️',
        correctAnswer: 'It rains or snows',
        difficulty: 'easy',
        options: [
          { label: 'They disappear', emoji: '👻' },
          { label: 'They float away', emoji: '🎈' },
          { label: 'They turn colors', emoji: '🌈' },
          { label: 'It rains or snows', emoji: '🌧️' },
        ],
      },
      {
        question: 'What are clouds made of?',
        emoji: '☁️',
        correctAnswer: 'Tiny water droplets',
        difficulty: 'medium',
        options: [
          { label: 'Cotton candy', emoji: '🍭' },
          { label: 'Tiny water droplets', emoji: '💧' },
          { label: 'Smoke', emoji: '💨' },
          { label: 'Dust', emoji: '💨' },
        ],
      },
    ],
  },
  {
    id: 'plants',
    title: 'How Plants Grow',
    emoji: '🌱',
    cardGradient: 'green',
    accentColor: 'text-kv-green',
    description: 'Discover how plants make food and grow tall!',
    facts: [
      'Plants make their own food using sunlight, water, and air. This amazing process is called photosynthesis, and it happens inside the leaves!',
      'Roots absorb water and nutrients from the soil through tiny root hairs. They also anchor the plant firmly in the ground so it does not blow away.',
      'Leaves capture sunlight using a green chemical called chlorophyll. That is why most leaves are green! The chlorophyll turns sunlight into food for the plant.',
      'Flowers help plants make new plants. They attract bees and butterflies with bright colors and sweet smells. The insects carry pollen from flower to flower.',
    ],
    funFact: 'The tallest tree in the world is a redwood named Hyperion in California — it is over 380 feet tall, taller than the Statue of Liberty! 🌲🗽',
    questions: [
      {
        question: 'What do plants use to make their own food?',
        emoji: '☀️',
        correctAnswer: 'Sunlight, water, and air',
        difficulty: 'easy',
        options: [
          { label: 'Pizza and ice cream', emoji: '🍕' },
          { label: 'Sunlight, water, and air', emoji: '☀️💧💨' },
          { label: 'Milk and cookies', emoji: '🍪' },
          { label: 'Rocks and sand', emoji: '🪨' },
        ],
      },
      {
        question: 'Why are most leaves green?',
        emoji: '🍃',
        correctAnswer: 'Because of chlorophyll',
        difficulty: 'hard',
        options: [
          { label: 'Someone painted them', emoji: '🎨' },
          { label: 'Because they like green', emoji: '💚' },
          { label: 'Because of chlorophyll', emoji: '🧪' },
          { label: 'Because of sunlight', emoji: '☀️' },
        ],
      },
      {
        question: 'What do roots do?',
        emoji: '🌱',
        correctAnswer: 'Absorb water and hold the plant in place',
        difficulty: 'medium',
        options: [
          { label: 'Make flowers', emoji: '🌸' },
          { label: 'Catch bugs', emoji: '🐛' },
          { label: 'Absorb water and hold the plant in place', emoji: '💧' },
          { label: 'Grow leaves', emoji: '🍃' },
        ],
      },
      {
        question: 'What helps flowers attract bees?',
        emoji: '🐝',
        correctAnswer: 'Bright colors and sweet smells',
        difficulty: 'easy',
        options: [
          { label: 'Loud noises', emoji: '🔊' },
          { label: 'Bright colors and sweet smells', emoji: '🌸' },
          { label: 'Running fast', emoji: '🏃' },
          { label: 'Being very tall', emoji: '📏' },
        ],
      },
    ],
  },
  {
    id: 'dinosaurs',
    title: 'Dinosaurs',
    emoji: '🦕',
    cardGradient: 'orange',
    accentColor: 'text-kv-orange',
    description: 'Travel back in time to when dinosaurs ruled the Earth!',
    facts: [
      'Dinosaurs lived on Earth over 65 million years ago, long before humans existed. They ruled the planet for over 160 million years!',
      'Some dinosaurs were huge, like Brachiosaurus which was as tall as a 4-story building. Others were tiny, like Microraptor which was the size of a chicken.',
      'Scientists learn about dinosaurs from fossils — preserved bones, teeth, and footprints found in rocks. A special scientist called a paleontologist studies fossils.',
      'Birds are actually living descendants of small meat-eating dinosaurs! So the pigeons you see in the park are distant cousins of the mighty T-Rex!',
    ],
    funFact: 'The T-Rex had teeth as long as bananas and could bite with enough force to crush a car! But its arms were so short it could not even reach its own mouth. 🦖🍌',
    questions: [
      {
        question: 'How long ago did dinosaurs live?',
        emoji: '⏰',
        correctAnswer: 'Over 65 million years ago',
        difficulty: 'medium',
        options: [
          { label: '100 years ago', emoji: '📅' },
          { label: '1,000 years ago', emoji: '🏰' },
          { label: 'Over 65 million years ago', emoji: '🦕' },
          { label: 'Last Tuesday', emoji: '📆' },
        ],
      },
      {
        question: 'What are fossils?',
        emoji: '🦴',
        correctAnswer: 'Preserved bones and footprints in rocks',
        difficulty: 'medium',
        options: [
          { label: 'Old paintings', emoji: '🎨' },
          { label: 'Kind of rocks', emoji: '🪨' },
          { label: 'Preserved bones and footprints in rocks', emoji: '🦴' },
          { label: 'Dinosaur toys', emoji: '🧸' },
        ],
      },
      {
        question: 'Which animal is related to dinosaurs?',
        emoji: '🐦',
        correctAnswer: 'Birds',
        difficulty: 'easy',
        options: [
          { label: 'Fish', emoji: '🐟' },
          { label: 'Birds', emoji: '🐦' },
          { label: 'Cats', emoji: '🐱' },
          { label: 'Frogs', emoji: '🐸' },
        ],
      },
      {
        question: 'What do we call scientists who study dinosaur fossils?',
        emoji: '🔬',
        correctAnswer: 'Paleontologists',
        difficulty: 'hard',
        options: [
          { label: 'Astronauts', emoji: '🧑‍🚀' },
          { label: 'Biologists', emoji: '🧬' },
          { label: 'Paleontologists', emoji: '🦴' },
          { label: 'Geologists', emoji: '🏔️' },
        ],
      },
    ],
  },
  {
    id: 'human-body',
    title: 'The Human Body',
    emoji: '🫀',
    cardGradient: 'pink',
    accentColor: 'text-kv-red',
    description: 'Learn about your amazing body and how it works!',
    facts: [
      'Your heart pumps blood through over 60,000 miles of blood vessels in your body. It beats about 100,000 times every day without you even thinking about it!',
      'Your brain has about 86 billion neurons that send messages to every part of your body. These signals travel faster than a race car — up to 268 miles per hour!',
      'Bones are alive and constantly growing! When you are born, you have about 270 bones, but some fuse together as you grow, leaving you with 206 bones as an adult.',
      'Your lungs breathe in about 2,400 gallons of air every single day. The right lung is slightly bigger than the left lung to make room for your heart!',
    ],
    funFact: 'Your nose can remember 50,000 different smells, and your ears never stop growing — even when you are old! Your body is truly incredible. 👃👂',
    questions: [
      {
        question: 'How many times does your heart beat every day?',
        emoji: '❤️',
        correctAnswer: 'About 100,000 times',
        difficulty: 'hard',
        options: [
          { label: 'About 100 times', emoji: '💯' },
          { label: 'About 1,000 times', emoji: '🔢' },
          { label: 'About 100,000 times', emoji: '💓' },
          { label: 'About 10 times', emoji: '👆' },
        ],
      },
      {
        question: 'What organ controls your whole body?',
        emoji: '🧠',
        correctAnswer: 'The brain',
        difficulty: 'easy',
        options: [
          { label: 'The heart', emoji: '❤️' },
          { label: 'The stomach', emoji: '🍽️' },
          { label: 'The brain', emoji: '🧠' },
          { label: 'The liver', emoji: '🫘' },
        ],
      },
      {
        question: 'How many bones does an adult have?',
        emoji: '🦴',
        correctAnswer: '206',
        difficulty: 'medium',
        options: [
          { label: '100', emoji: '💯' },
          { label: '500', emoji: '🔢' },
          { label: '206', emoji: '🦴' },
          { label: '50', emoji: '✋' },
        ],
      },
      {
        question: 'What do your lungs do?',
        emoji: '🫁',
        correctAnswer: 'Breathe in air',
        difficulty: 'easy',
        options: [
          { label: 'Pump blood', emoji: '🩸' },
          { label: 'Digest food', emoji: '🍔' },
          { label: 'Breathe in air', emoji: '💨' },
          { label: 'Help you see', emoji: '👁️' },
        ],
      },
    ],
  },
  {
    id: 'weather',
    title: 'Weather & Climate',
    emoji: '🌦️',
    cardGradient: 'purple',
    accentColor: 'text-kv-purple',
    description: 'Discover why it rains, snows, and shines!',
    facts: [
      'Weather changes from day to day — it can be sunny, rainy, windy, or snowy. Climate is the average weather pattern over many years in one area.',
      'Lightning is a giant spark of electricity in the sky. A bolt of lightning is about five times hotter than the surface of the Sun — that is 50,000 degrees!',
      'Rainbows appear when sunlight passes through raindrops and splits into different colors. You can only see a rainbow if the Sun is behind you and rain is in front!',
      'Tornadoes are spinning columns of air that touch the ground. They have the fastest winds on Earth, reaching over 300 miles per hour!',
    ],
    funFact: 'A single thunderstorm can release more energy than an atomic bomb! But do not worry — the energy is spread out over a huge area in the sky. ⛈️💥',
    questions: [
      {
        question: 'What is the difference between weather and climate?',
        emoji: '🌤️',
        correctAnswer: 'Weather changes daily; climate is the average over years',
        difficulty: 'medium',
        options: [
          { label: 'They are the same thing', emoji: '🤷' },
          { label: 'Weather is rain, climate is snow', emoji: '🌧️❄️' },
          { label: 'Weather changes daily; climate is the average over years', emoji: '📊' },
          { label: 'Climate is hotter than weather', emoji: '🌡️' },
        ],
      },
      {
        question: 'What is lightning?',
        emoji: '⚡',
        correctAnswer: 'A giant spark of electricity',
        difficulty: 'easy',
        options: [
          { label: 'A bright star', emoji: '⭐' },
          { label: 'A giant spark of electricity', emoji: '⚡' },
          { label: 'Fire from the sky', emoji: '🔥' },
          { label: 'A laser beam', emoji: '🔦' },
        ],
      },
      {
        question: 'When can you see a rainbow?',
        emoji: '🌈',
        correctAnswer: 'When the Sun is behind you and rain is in front',
        difficulty: 'hard',
        options: [
          { label: 'Only at night', emoji: '🌙' },
          { label: 'Only in summer', emoji: '☀️' },
          { label: 'When the Sun is behind you and rain is in front', emoji: '🌈' },
          { label: 'Every time it rains', emoji: '🌧️' },
        ],
      },
      {
        question: 'What has the fastest winds on Earth?',
        emoji: '🌪️',
        correctAnswer: 'Tornadoes',
        difficulty: 'easy',
        options: [
          { label: 'Hurricanes', emoji: '🌀' },
          { label: 'Tornadoes', emoji: '🌪️' },
          { label: 'Blimps', emoji: '🎈' },
          { label: 'Airplanes', emoji: '✈️' },
        ],
      },
    ],
  },
  {
    id: 'ocean-life',
    title: 'Ocean Life',
    emoji: '🐋',
    cardGradient: 'blue',
    accentColor: 'text-kv-cyan',
    description: 'Dive deep into the amazing underwater world!',
    facts: [
      'The ocean covers over 70% of Earth\'s surface and contains about 97% of all the water on our planet. It is so deep that Mount Everest could fit inside the deepest part!',
      'Blue whales are the largest animals that have ever lived on Earth — even bigger than any dinosaur! Their hearts are the size of a small car.',
      'Coral reefs are often called the "rainforests of the sea" because they are home to so many different creatures. Over 25% of all ocean species live in coral reefs!',
      'The deep ocean is completely dark and freezing cold. But amazing creatures live there, like the anglerfish which uses a glowing light on its head to attract prey!',
    ],
    funFact: 'Scientists have explored less than 5% of the ocean floor! That means there might be more unknown creatures in the deep sea than on all the land on Earth. 🌊🔮',
    questions: [
      {
        question: 'How much of Earth is covered by ocean?',
        emoji: '🌍',
        correctAnswer: 'Over 70%',
        difficulty: 'medium',
        options: [
          { label: 'About 10%', emoji: '🔟' },
          { label: 'About 50%', emoji: '半' },
          { label: 'Over 70%', emoji: '🌊' },
          { label: '100%', emoji: '💯' },
        ],
      },
      {
        question: 'What is the largest animal that ever lived?',
        emoji: '🐋',
        correctAnswer: 'Blue whale',
        difficulty: 'easy',
        options: [
          { label: 'T-Rex', emoji: '🦖' },
          { label: 'Elephant', emoji: '🐘' },
          { label: 'Blue whale', emoji: '🐋' },
          { label: 'Giraffe', emoji: '🦒' },
        ],
      },
      {
        question: 'What are coral reefs called?',
        emoji: '🪸',
        correctAnswer: 'Rainforests of the sea',
        difficulty: 'hard',
        options: [
          { label: 'Ocean gardens', emoji: '🌺' },
          { label: 'Fish homes', emoji: '🏠' },
          { label: 'Rainforests of the sea', emoji: '🌊' },
          { label: 'Rocky cities', emoji: '🏘️' },
        ],
      },
      {
        question: 'How does the anglerfish catch its food in the dark deep sea?',
        emoji: '🐟',
        correctAnswer: 'With a glowing light on its head',
        difficulty: 'medium',
        options: [
          { label: 'It asks nicely', emoji: '😊' },
          { label: 'With a glowing light on its head', emoji: '💡' },
          { label: 'It swims very fast', emoji: '🏊' },
          { label: 'It waits for food to float by', emoji: '🍃' },
        ],
      },
    ],
  },
  {
    id: 'space-exploration',
    title: 'Space Exploration',
    emoji: '🚀',
    cardGradient: 'purple',
    accentColor: 'text-kv-purple',
    description: 'Blast off! Learn about astronauts and space travel!',
    facts: [
      'Astronauts wear special spacesuits that protect them from extreme temperatures and provide air to breathe. A spacesuit can cost over 12 million dollars!',
      'In 1969, Neil Armstrong became the first person to walk on the Moon. He said the famous words: "That\'s one small step for man, one giant leap for mankind."',
      'The International Space Station (ISS) orbits Earth about 16 times every single day! Astronauts living there see 16 sunrises and sunsets every 24 hours.',
      'In space, there is no gravity, so astronauts float around! They sleep strapped to walls, eat food from squeeze tubes, and their muscles can get weak without exercise.',
    ],
    funFact: 'Astronauts grow about 2 inches taller in space because their spines stretch without gravity pulling on them. But they shrink back to normal when they return to Earth! 🚀📏',
    questions: [
      {
        question: 'Who was the first person to walk on the Moon?',
        emoji: ' Neil Armstrong',
        correctAnswer: 'Neil Armstrong',
        difficulty: 'easy',
        options: [
          { label: 'Buzz Lightyear', emoji: '🧑‍🚀' },
          { label: 'Neil Armstrong', emoji: '🚶' },
          { label: 'Albert Einstein', emoji: '🧑‍🔬' },
          { label: 'Galileo', emoji: '🔭' },
        ],
      },
      {
        question: 'How many sunrises do ISS astronauts see every day?',
        emoji: '🌅',
        correctAnswer: '16',
        difficulty: 'hard',
        options: [
          { label: '1', emoji: '☀️' },
          { label: '4', emoji: '24' },
          { label: '8', emoji: '8️⃣' },
          { label: '16', emoji: '🌅' },
        ],
      },
      {
        question: 'What happens to astronauts in space without gravity?',
        emoji: '🧑‍🚀',
        correctAnswer: 'They float around',
        difficulty: 'easy',
        options: [
          { label: 'They get very heavy', emoji: '🏋️' },
          { label: 'They fall down', emoji: '⬇️' },
          { label: 'They float around', emoji: '🎈' },
          { label: 'They shrink', emoji: '🔍' },
        ],
      },
      {
        question: 'Why do astronauts grow taller in space?',
        emoji: '📏',
        correctAnswer: 'Their spines stretch without gravity',
        difficulty: 'medium',
        options: [
          { label: 'They eat special food', emoji: '🥗' },
          { label: 'Space has special air', emoji: '💨' },
          { label: 'Their spines stretch without gravity', emoji: '🦴' },
          { label: 'They exercise a lot', emoji: '💪' },
        ],
      },
    ],
  },
];

const TOTAL_TOPICS = SCIENCE_TOPICS.length;
const QUESTIONS_PER_QUIZ = 3;

const ENCOURAGEMENT_MESSAGES: Record<AgeSegment, { perfect: string[]; great: string[]; good: string[] }> = {
  toddler: {
    perfect: ['You did it! Yay! 🎉', 'Amazing! You are a star! ⭐', 'Wow! So smart! 🧠'],
    great: ['Great job! 🌟', 'You are learning so much! 📚', 'Awesome work! 💪'],
    good: ['Good try! Keep going! 🌈', 'You did your best! ❤️', 'Nice work! Keep learning! 🎈'],
  },
  'early-learner': {
    perfect: ['Perfect score! You are a science genius! 🧪', 'Incredible! You know so much about science! 🌟', '100% correct! Amazing work! 🎉'],
    great: ['Great job! Almost perfect! 🌈', 'You are getting really good at science! 🔬', 'So close to perfect! Keep it up! ⭐'],
    good: ['Good effort! Science is fun to learn! 📚', 'Nice try! Every mistake helps you learn! 🌱', 'You are doing great! Practice makes progress! 💪'],
  },
  kid: {
    perfect: ['Perfect score! You are a true Science Explorer! 🏆', 'Outstanding! You have mastered this topic! 🧪', 'Flawless! Your science knowledge is impressive! 🌟'],
    great: ['Excellent work! Just one small thing to remember! 📝', 'Great score! You clearly know your science! 🔬', 'Well done! You are getting stronger every day! 💪'],
    good: ['Good effort! Review the facts and try again! 📖', 'Nice try! Science is all about curiosity and learning! 🧠', 'Keep exploring! Every question teaches something new! 🌱'],
  },
};

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function getOptionCount(segment: AgeSegment): number {
  if (segment === 'toddler') return 2;
  if (segment === 'early-learner') return 3;
  return 4;
}

function getGridCols(segment: AgeSegment): string {
  if (segment === 'toddler') return 'grid-cols-1 sm:grid-cols-2';
  if (segment === 'early-learner') return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
}

function getCardMinHeight(segment: AgeSegment): string {
  if (segment === 'toddler') return 'min-h-[160px]';
  if (segment === 'early-learner') return 'min-h-[130px]';
  return 'min-h-[120px]';
}

function getEmojiSize(segment: AgeSegment): string {
  if (segment === 'toddler') return 'text-6xl';
  if (segment === 'early-learner') return 'text-5xl';
  return 'text-4xl';
}

function getEncouragingMessage(
  segment: AgeSegment,
  score: number,
  total: number,
): string {
  const ratio = score / total;
  const messages = ENCOURAGEMENT_MESSAGES[segment];
  if (ratio === 1) return messages.perfect[Math.floor(Math.random() * messages.perfect.length)]!;
  if (ratio >= 0.66) return messages.great[Math.floor(Math.random() * messages.great.length)]!;
  return messages.good[Math.floor(Math.random() * messages.good.length)]!;
}

function getStarRating(score: number, total: number): 0 | 1 | 2 | 3 {
  const ratio = score / total;
  if (ratio === 1) return 3;
  if (ratio >= 0.66) return 2;
  if (ratio >= 0.33) return 1;
  return 0;
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

export default function ScienceModule() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { user, activeChildProfile } = useAuthStore();
  const { playClick, playSuccess, playError, playPop } = useSoundEffects();
  const ageAdaptive = useAgeAdaptiveConfig(activeChildProfile?.age ?? 5);

  const [viewMode, setViewMode] = useState<ViewMode>('explore');
  const [selectedTopic, setSelectedTopic] = useState<ScienceTopic | null>(null);
  const [expandedFact, setExpandedFact] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    score: 0,
    feedback: null,
    selectedAnswer: null,
    questions: [],
  });
  const [showCompletion, setShowCompletion] = useState(false);
  const [exploredTopics, setExploredTopics] = useState<Set<string>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const childId = activeChildProfile?.id ?? '';
  const parentId = user?.uid ?? '';
  const segment = ageAdaptive.segment;

  // ── Derived state ──
  const exploredCount = exploredTopics.size;
  const explorePercent = Math.round((exploredCount / TOTAL_TOPICS) * 100);

  // ── Progress mutation ──
  const progressMutation = useMutation({
    mutationFn: (data: Parameters<typeof upsertProgress>[0]) => upsertProgress(data),
  });

  const badgeMutation = useMutation({
    mutationFn: (data: Parameters<typeof awardBadge>[0]) => awardBadge(data),
  });

  // ── Persist explore progress ──
  const persistExploreProgress = useCallback(() => {
    if (!childId || !parentId) return;
    progressMutation.mutate({
      childId,
      parentId,
      moduleId: 'science',
      completed: false,
      stars: 0,
      percentComplete: explorePercent,
      lastAccessedAt: new Date(),
      completedAt: null,
    });
  }, [childId, parentId, explorePercent, progressMutation]);

  // ── Persist quiz completion ──
  const persistQuizCompletion = useCallback((score: number, total: number) => {
    if (!childId || !parentId) return;
    const stars = getStarRating(score, total) as 0 | 1 | 2 | 3;
    progressMutation.mutate({
      childId,
      parentId,
      moduleId: 'science',
      completed: true,
      stars,
      percentComplete: 100,
      lastAccessedAt: new Date(),
      completedAt: new Date(),
    });

    if (stars === 3) {
      badgeMutation.mutate({
        childId,
        parentId,
        category: 'explorer',
        name: 'Science Explorer',
        description: 'Earned a perfect score on a science quiz!',
        icon: '🔬',
        earnedAt: new Date(),
      });
    }
  }, [childId, parentId, progressMutation, badgeMutation]);

  // ── Clean up timers on unmount ──
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // ── Navigation handlers ──
  const handleGoHome = useCallback(() => {
    playClick();
    navigate(`/kids/${profileId}`);
  }, [navigate, profileId, playClick]);

  const handleGoBack = useCallback(() => {
    playClick();
    if (viewMode === 'quiz') {
      setViewMode('detail');
      setQuizState({ currentQuestion: 0, score: 0, feedback: null, selectedAnswer: null, questions: [] });
      setShowCompletion(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerSeconds(null);
    } else if (viewMode === 'detail') {
      setViewMode('explore');
      setSelectedTopic(null);
      setExpandedFact(null);
    } else {
      navigate(`/kids/${profileId}`);
    }
  }, [navigate, profileId, playClick, viewMode]);

  // ── Topic selection ──
  const handleSelectTopic = useCallback((topic: ScienceTopic) => {
    playPop();
    setSelectedTopic(topic);
    setExpandedFact(null);
    setViewMode('detail');

    const nextExplored = new Set(exploredTopics);
    if (!nextExplored.has(topic.id)) {
      nextExplored.add(topic.id);
      setExploredTopics(nextExplored);
      persistExploreProgress();
    }
  }, [exploredTopics, playPop, persistExploreProgress]);

  // ── Start quiz ──
  const handleStartQuiz = useCallback(() => {
    if (!selectedTopic) return;
    playClick();
    const optionCount = getOptionCount(segment);
    const quizQuestions = pickRandom(
      selectedTopic.questions.map((q) => ({
        ...q,
        options: shuffle(q.options).slice(0, optionCount),
      })),
      QUESTIONS_PER_QUIZ,
    );
    setQuizState({
      currentQuestion: 0,
      score: 0,
      feedback: null,
      selectedAnswer: null,
      questions: quizQuestions,
    });
    setShowCompletion(false);
    setViewMode('quiz');

    if (ageAdaptive.enableTimedChallenges) {
      setTimerSeconds(10);
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev !== null && prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
  }, [selectedTopic, segment, ageAdaptive.enableTimedChallenges, playClick]);

  // ── Answer question ──
  const handleAnswer = useCallback((answer: string) => {
    if (quizState.feedback) return;
    playClick();

    const currentQ = quizState.questions[quizState.currentQuestion];
    if (!currentQ) return;

    const isCorrect = answer === currentQ.correctAnswer;

    if (isCorrect) {
      playSuccess();
    } else {
      playError();
    }

    setQuizState((prev) => ({
      ...prev,
      feedback: isCorrect ? 'correct' : 'wrong',
      selectedAnswer: answer,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimerSeconds(null);

    feedbackTimerRef.current = setTimeout(() => {
      if (quizState.currentQuestion + 1 < QUESTIONS_PER_QUIZ) {
        setQuizState((prev) => ({
          ...prev,
          currentQuestion: prev.currentQuestion + 1,
          feedback: null,
          selectedAnswer: null,
        }));
        if (ageAdaptive.enableTimedChallenges) {
          setTimerSeconds(10);
          timerRef.current = setInterval(() => {
            setTimerSeconds((prev) => {
              if (prev !== null && prev <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = null;
                return null;
              }
              return prev !== null ? prev - 1 : null;
            });
          }, 1000);
        }
      } else {
        setShowCompletion(true);
        const finalScore = isCorrect ? quizState.score + 1 : quizState.score;
        persistQuizCompletion(finalScore, QUESTIONS_PER_QUIZ);
      }
    }, 1500);
  }, [quizState, ageAdaptive.enableTimedChallenges, playClick, playSuccess, playError, persistQuizCompletion]);

  // ── Completion handlers ──
  const handleExploreMore = useCallback(() => {
    playClick();
    setViewMode('explore');
    setSelectedTopic(null);
    setShowCompletion(false);
    setQuizState({ currentQuestion: 0, score: 0, feedback: null, selectedAnswer: null, questions: [] });
  }, [playClick]);

  // ── Auto-advance on timer expiry ──
  useEffect(() => {
    if (
      timerSeconds === 0 &&
      viewMode === 'quiz' &&
      !quizState.feedback &&
      quizState.questions[quizState.currentQuestion]
    ) {
      playError();
      setQuizState((prev) => ({
        ...prev,
        feedback: 'wrong',
        selectedAnswer: null,
      }));

      feedbackTimerRef.current = setTimeout(() => {
        if (quizState.currentQuestion + 1 < QUESTIONS_PER_QUIZ) {
          setQuizState((prev) => ({
            ...prev,
            currentQuestion: prev.currentQuestion + 1,
            feedback: null,
            selectedAnswer: null,
          }));
          if (ageAdaptive.enableTimedChallenges) {
            setTimerSeconds(10);
            timerRef.current = setInterval(() => {
              setTimerSeconds((prev) => {
                if (prev !== null && prev <= 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  timerRef.current = null;
                  return null;
                }
                return prev !== null ? prev - 1 : null;
              });
            }, 1000);
          }
        } else {
          setShowCompletion(true);
          persistQuizCompletion(quizState.score, QUESTIONS_PER_QUIZ);
        }
      }, 1500);
    }
  }, [timerSeconds, viewMode, quizState, ageAdaptive.enableTimedChallenges, playError, persistQuizCompletion]);

  // ═══════════════════════════════════════════════
  // Render: Header
  // ═══════════════════════════════════════════════

  const renderHeader = () => (
    <header className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size={segment === 'toddler' ? 'toddler' : 'md'}
          leftIcon={<IconArrowLeft />}
          onClick={handleGoBack}
          aria-label="Go back"
        />
        <Button
          variant="ghost"
          size={segment === 'toddler' ? 'toddler' : 'md'}
          leftIcon={<IconHome />}
          onClick={handleGoHome}
          aria-label="Go home"
        />
      </div>

      {viewMode === 'explore' && (
        <AnimatedContainer variant="slideUp">
          <h1 className={cn('font-display text-kv-purple', segment === 'toddler' ? 'text-4xl' : 'text-3xl md:text-4xl')}>
            {ageAdaptive.showTextLabels ? 'Science Explorer 🔬' : '🔬'}
          </h1>
          {ageAdaptive.showTextLabels && (
            <p className="text-kv-gray-500 mt-1 text-sm md:text-base">
              Tap a topic to explore and learn!
            </p>
          )}
          <div className="mt-4 max-w-md">
            <ProgressBar
              value={exploredCount}
              max={TOTAL_TOPICS}
              variant="purple"
              size="md"
              showLabel
              labelPosition="top"
            />
          </div>
        </AnimatedContainer>
      )}

      {viewMode === 'detail' && selectedTopic && (
        <AnimatedContainer variant="slideUp" key={`detail-${selectedTopic.id}`}>
          <h1 className={cn('font-display', selectedTopic.accentColor, segment === 'toddler' ? 'text-4xl' : 'text-3xl md:text-4xl')}>
            {segment === 'toddler' ? selectedTopic.emoji : `${selectedTopic.emoji} ${selectedTopic.title}`}
          </h1>
          {ageAdaptive.showTextLabels && (
            <p className="text-kv-gray-500 mt-1 text-sm md:text-base">{selectedTopic.description}</p>
          )}
        </AnimatedContainer>
      )}

      {viewMode === 'quiz' && selectedTopic && !showCompletion && (
        <AnimatedContainer variant="slideUp" key={`quiz-${selectedTopic.id}`}>
          <h1 className={cn('font-display', selectedTopic.accentColor, segment === 'toddler' ? 'text-3xl' : 'text-2xl md:text-3xl')}>
            {segment === 'toddler' ? '🧪' : `🧪 ${selectedTopic.title} Quiz`}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar
              value={quizState.currentQuestion + 1}
              max={QUESTIONS_PER_QUIZ}
              variant="purple"
              size="md"
              showLabel
              labelPosition="top"
            />
            {timerSeconds !== null && (
              <Badge variant={timerSeconds <= 3 ? 'danger' : 'default'} size="lg">
                {'⏱️ ' + timerSeconds + 's'}
              </Badge>
            )}
          </div>
        </AnimatedContainer>
      )}
    </header>
  );

  // ═══════════════════════════════════════════════
  // Render: Topic Grid (Explore Mode)
  // ═══════════════════════════════════════════════

  const renderTopicGrid = () => (
    <nav aria-label="Science topics">
    <StaggerGrid className={cn('grid gap-4 md:gap-6', getGridCols(segment))}>
      {SCIENCE_TOPICS.map((topic) => {
        const isExplored = exploredTopics.has(topic.id);
        return (
          <StaggerItem key={topic.id}>
            <MotionCard
              asMotion={true}
              variant="interactive"
              gradient={topic.cardGradient}
              padding={segment === 'toddler' ? 'lg' : 'md'}
              className={cn(getCardMinHeight(segment), 'flex flex-col items-center justify-center text-center')}
              onClick={() => handleSelectTopic(topic)}
              aria-label={ageAdaptive.showTextLabels ? `${topic.title} — tap to explore` : `${topic.emoji} — tap to explore`}
            >
              <span className={getEmojiSize(segment)} aria-hidden="true">{topic.emoji}</span>
              {ageAdaptive.showTextLabels && (
                <>
                  <h2 className="font-bold text-base md:text-lg mt-2">{topic.title}</h2>
                  <p className="text-sm opacity-80 mt-1 line-clamp-2">{topic.description}</p>
                </>
              )}
              {isExplored && (
                <Badge variant="success" size="sm" className="mt-2" pulse>
                  ✅ Explored
                </Badge>
              )}
            </MotionCard>
          </StaggerItem>
        );
      })}
    </StaggerGrid>
    </nav>
  );

  // ═══════════════════════════════════════════════
  // Render: Topic Detail View
  // ═══════════════════════════════════════════════

  const renderTopicDetail = () => {
    if (!selectedTopic) return null;
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`detail-view-${selectedTopic.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-center mb-6">
            <motion.span
              className="text-7xl md:text-8xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              {selectedTopic.emoji}
            </motion.span>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            {selectedTopic.facts.map((fact, i) => {
              const isExpanded = expandedFact === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      playPop();
                      setExpandedFact(isExpanded ? null : i);
                    }}
                    className={cn(
                      'w-full text-left kv-card-interactive p-4',
                      isExpanded
                        ? 'bg-kv-purple/10 ring-2 ring-kv-purple/30'
                        : 'bg-white hover:bg-kv-gray-50',
                    )}
                    aria-expanded={isExpanded}
                    aria-label={`Fact ${i + 1}: ${isExpanded ? fact : 'Tap to reveal'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                        isExpanded ? 'bg-kv-purple text-white' : 'bg-kv-gray-200 text-kv-gray-600',
                      )}>
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className={cn(
                          'text-sm md:text-base text-kv-gray-700 leading-relaxed',
                          isExpanded ? '' : 'text-kv-gray-400',
                        )}>
                          {isExpanded ? fact : 'Tap to reveal this fact...'}
                        </p>
                      </div>
                      <motion.span
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="text-kv-gray-400 text-lg flex-shrink-0"
                        aria-hidden="true"
                      >
                        ▼
                      </motion.span>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto mt-4"
          >
            <div className="kv-card bg-kv-yellow/20 border-2 border-kv-yellow p-4">
              <p className="text-sm font-bold text-kv-gray-600 mb-1">🤯 Fun Fact</p>
              <p className="text-sm md:text-base text-kv-gray-700 leading-relaxed">{selectedTopic.funFact}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-2xl mx-auto mt-6 flex justify-center"
          >
            <Button
              variant="premium"
              size={segment === 'toddler' ? 'toddler' : 'lg'}
              onClick={handleStartQuiz}
              aria-label="Take the Quiz"
            >
              {ageAdaptive.showTextLabels ? '🧪 Take the Quiz!' : '🧪'}
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ═══════════════════════════════════════════════
  // Render: Quiz Mode
  // ═══════════════════════════════════════════════

  const renderQuiz = () => {
    if (showCompletion) return renderCompletion();
    const currentQ = quizState.questions[quizState.currentQuestion];
    if (!currentQ) return null;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`quiz-q-${quizState.currentQuestion}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="kv-card p-6 md:p-8">
            <div className="text-center mb-6">
              <span className="text-5xl md:text-6xl block mb-3" aria-hidden="true">{currentQ.emoji}</span>
              <h2 className="font-bold text-lg md:text-xl text-kv-gray-800">{currentQ.question}</h2>
            </div>

            <div
              className="grid gap-3"
              role="radiogroup"
              aria-label={`Question ${quizState.currentQuestion + 1} options`}
            >
              {currentQ.options.map((option) => {
                const isSelected = quizState.selectedAnswer === option.label;
                const isCorrectOption = option.label === currentQ.correctAnswer;
                const showResult = quizState.feedback !== null;

                return (
                  <motion.button
                    key={option.label}
                    type="button"
                    onClick={() => handleAnswer(option.label)}
                    disabled={showResult}
                    whileHover={!showResult ? { scale: 1.02 } : undefined}
                    whileTap={!showResult ? { scale: 0.98 } : undefined}
                    className={cn(
                      'w-full text-left kv-card-interactive p-4 flex items-center gap-4',
                      'transition-all duration-200',
                      !showResult && 'hover:bg-kv-purple/5',
                      showResult && isCorrectOption && 'bg-kv-green/15 ring-2 ring-kv-green shadow-[0_0_12px_rgba(107,203,119,0.4)]',
                      showResult && isSelected && !isCorrectOption && 'bg-kv-red/15 ring-2 ring-kv-red',
                      showResult && !isSelected && !isCorrectOption && 'opacity-50',
                      segment === 'toddler' && 'min-h-[64px]',
                    )}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={option.label}
                  >
                    <span className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg',
                      showResult && isCorrectOption
                        ? 'bg-kv-green text-white'
                        : showResult && isSelected && !isCorrectOption
                          ? 'bg-kv-red text-white'
                          : 'bg-kv-gray-100',
                    )} aria-hidden="true">
                      {showResult && isCorrectOption ? '✓' : showResult && isSelected ? '✗' : option.emoji}
                    </span>
                    <span className={cn(
                      'font-medium',
                      showResult && isCorrectOption ? 'text-kv-green' : showResult && isSelected ? 'text-kv-red' : 'text-kv-gray-800',
                      segment === 'toddler' ? 'text-lg' : 'text-base',
                    )}>
                      {option.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {quizState.feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 text-center"
                  role="alert"
                  aria-live="assertive"
                >
                  {quizState.feedback === 'correct' ? (
                    <div className="kv-card bg-kv-green/15 border-2 border-kv-green p-3">
                      <p className="font-bold text-kv-green text-lg">✅ Correct! Great job!</p>
                    </div>
                  ) : (
                    <div className="kv-card bg-kv-red/15 border-2 border-kv-red p-3">
                      <p className="font-bold text-kv-red text-lg">❌ Not quite!</p>
                      <p className="text-sm text-kv-gray-600 mt-1">
                        The answer is: <strong>{currentQ.correctAnswer}</strong>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ═══════════════════════════════════════════════
  // Render: Completion Screen
  // ═══════════════════════════════════════════════

  const renderCompletion = () => {
    const score = quizState.score;
    const total = QUESTIONS_PER_QUIZ;
    const stars = getStarRating(score, total);
    const message = getEncouragingMessage(segment, score, total);
    const isPerfect = score === total;

    return (
      <AnimatePresence>
        <motion.div
          key="completion"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-lg mx-auto text-center"
        >
          <div className="kv-card p-6 md:p-8">
            <motion.span
              className="text-7xl md:text-8xl block mb-4"
              animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              {isPerfect ? '🏆' : stars >= 2 ? '🌟' : '👍'}
            </motion.span>

            <h2 className={cn('font-display text-kv-purple mb-2', segment === 'toddler' ? 'text-3xl' : 'text-2xl md:text-3xl')}>
              {isPerfect ? 'Perfect Score!' : 'Quiz Complete!'}
            </h2>

            <p className="text-kv-gray-600 text-base md:text-lg mb-4">{message}</p>

            <div className="flex justify-center mb-4">
              <StarRating rating={stars} maxRating={3} size={segment === 'toddler' ? 'lg' : 'md'} />
            </div>

            <p className="text-lg font-bold text-kv-gray-700 mb-6">
              You got <span className={cn(isPerfect ? 'text-kv-green' : 'text-kv-purple')}>{score}</span> out of <span className="text-kv-purple">{total}</span> correct!
            </p>

            {isPerfect && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <AchievementBadge
                  name="Science Explorer"
                  description="Earned a perfect score!"
                  emoji="🔬"
                  earned={true}
                  size="lg"
                />
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                size={segment === 'toddler' ? 'toddler' : 'lg'}
                onClick={handleExploreMore}
                aria-label="Explore more topics"
              >
                {ageAdaptive.showTextLabels ? '📚 Explore More' : '📚'}
              </Button>
              <Button
                variant="secondary"
                size={segment === 'toddler' ? 'toddler' : 'lg'}
                leftIcon={<IconHome />}
                onClick={handleGoHome}
                aria-label="Go home"
              >
                {ageAdaptive.showTextLabels ? 'Home' : ''}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ═══════════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════════

  return (
    <div className="kv-page">
      {renderHeader()}

      <main>
        <AnimatePresence mode="wait">
          {viewMode === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderTopicGrid()}
            </motion.div>
          )}

          {viewMode === 'detail' && (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderTopicDetail()}
            </motion.div>
          )}

          {viewMode === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderQuiz()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
