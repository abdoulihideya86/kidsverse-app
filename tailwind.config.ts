import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#kidsverse-root',
  corePlugins: {
    preflight: true,
  },
  theme: {
    extend: {
      colors: {
        /* ── Primary palette — Duolingo-level vibrancy, child-safe & warm ── */
        kv: {
          red: '#FF4757',
          orange: '#FF6B2B',
          yellow: '#FFC312',
          green: '#2ED573',
          blue: '#1E90FF',
          purple: '#A55EEA',
          pink: '#FF6B9D',
          cyan: '#00D2D3',
          teal: '#0ABDE3',

          /* Neutrals — warm-tinted for friendliness */
          white: '#FFFFFF',
          cream: '#FFF9F0',
          gray: {
            50: '#FAFBFE',
            100: '#F0F2F8',
            200: '#E2E5F0',
            300: '#C8CCE0',
            400: '#9BA2BF',
            500: '#6B7394',
            600: '#4A5170',
            700: '#333A55',
            800: '#1F2438',
            900: '#111428',
          },
        },
      },

      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Fredoka One', 'Nunito', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        '3xs': ['0.5rem', { lineHeight: '0.75rem' }],
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      boxShadow: {
        /* ── Subtle neutral shadows ── */
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.10)',
        'button': '0 4px 14px rgba(0, 0, 0, 0.08)',
        'button-hover': '0 8px 24px rgba(0, 0, 0, 0.14)',
        'modal': '0 24px 64px rgba(0, 0, 0, 0.18)',
        'toast': '0 12px 40px rgba(0, 0, 0, 0.12)',
        'tooltip': '0 6px 16px rgba(0, 0, 0, 0.10)',

        /* ── Colored glow shadows — vibrant depth for kids UI ── */
        'glow-blue': '0 4px 24px rgba(30, 144, 255, 0.35), 0 0 0 1px rgba(30, 144, 255, 0.08)',
        'glow-green': '0 4px 24px rgba(46, 213, 115, 0.35), 0 0 0 1px rgba(46, 213, 115, 0.08)',
        'glow-orange': '0 4px 24px rgba(255, 107, 43, 0.35), 0 0 0 1px rgba(255, 107, 43, 0.08)',
        'glow-red': '0 4px 24px rgba(255, 71, 87, 0.35), 0 0 0 1px rgba(255, 71, 87, 0.08)',
        'glow-purple': '0 4px 24px rgba(165, 94, 234, 0.35), 0 0 0 1px rgba(165, 94, 234, 0.08)',
        'glow-pink': '0 4px 24px rgba(255, 107, 157, 0.35), 0 0 0 1px rgba(255, 107, 157, 0.08)',
        'glow-yellow': '0 4px 24px rgba(255, 195, 18, 0.40), 0 0 0 1px rgba(255, 195, 18, 0.10)',
        'glow-cyan': '0 4px 24px rgba(0, 210, 211, 0.35), 0 0 0 1px rgba(0, 210, 211, 0.08)',

        /* ── Inset highlights for 3D button feel ── */
        'inset-highlight': 'inset 0 2px 0 rgba(255, 255, 255, 0.30)',
        'inset-deep': 'inset 0 -2px 4px rgba(0, 0, 0, 0.06)',
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      /* ── Vibrant child-friendly animations ── */
      animation: {
        /* Existing */
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pop': 'pop 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',

        /* Entrance animations */
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'fade-up': 'fadeUp 0.5s ease-out both',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',

        /* Feedback & micro-interactions */
        'shimmer': 'shimmer 2s linear infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'wiggle-fast': 'wiggleFast 0.3s ease-in-out infinite',
        'jelly': 'jelly 0.5s ease-in-out',
        'wobble': 'wobble 0.6s ease-in-out',

        /* Looping playful */
        'float-slow': 'float 5s ease-in-out infinite',
        'float-fast': 'float 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },

      keyframes: {
        /* ── Existing keyframes ── */
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '80%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },

        /* ── Entrance keyframes ── */
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.08)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },

        /* ── Feedback keyframes ── */
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.3) rotate(15deg)' },
        },
        wiggleFast: {
          '0%, 100%': { transform: 'rotate(-4deg) scale(1.02)' },
          '25%': { transform: 'rotate(4deg) scale(0.98)' },
          '50%': { transform: 'rotate(-3deg) scale(1.01)' },
          '75%': { transform: 'rotate(3deg) scale(0.99)' },
        },
        jelly: {
          '0%': { transform: 'scale(1, 1)' },
          '15%': { transform: 'scale(0.9, 1.1)' },
          '30%': { transform: 'scale(1.1, 0.9)' },
          '45%': { transform: 'scale(0.95, 1.05)' },
          '60%': { transform: 'scale(1.03, 0.97)' },
          '75%': { transform: 'scale(0.98, 1.02)' },
          '100%': { transform: 'scale(1, 1)' },
        },
        wobble: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '15%': { transform: 'rotate(5deg) scale(1.03)' },
          '30%': { transform: 'rotate(-4deg) scale(0.97)' },
          '45%': { transform: 'rotate(3deg) scale(1.02)' },
          '60%': { transform: 'rotate(-2deg) scale(0.99)' },
          '75%': { transform: 'rotate(1deg) scale(1.01)' },
          '100%': { transform: 'rotate(0deg) scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.85', filter: 'brightness(1.15)' },
        },
      },

      /* ── Background patterns ── */
      backgroundImage: {
        'dot-pattern': 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
        'dot-pattern-lg': 'radial-gradient(circle, rgba(0,0,0,0.04) 2px, transparent 2px)',
        'shimmer-gradient': 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)',
      },

      backgroundSize: {
        'dot': '16px 16px',
        'dot-lg': '24px 24px',
        'shimmer': '200% 100%',
      },

      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
};

export default config;
