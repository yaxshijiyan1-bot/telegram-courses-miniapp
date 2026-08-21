/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#FFFFFF',
        darkBgSecondary: '#F8FAFC',
        darkCard: '#FFFFFF',
        darkCardElevated: '#F8FAFC',
        cyan: {
          DEFAULT: '#0284C7',
          light: '#38BDF8',
          deep: '#0369A1',
          glow: 'rgba(2, 132, 199, 0.15)',
        },
        violet: {
          DEFAULT: '#7C3AED',
          light: '#8B5CF6',
        },
        gold: '#D97706',
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
        },
        brand: {
          emerald: '#0284C7',
          deep: '#0369A1',
          text: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
          gold: '#D97706',
          border: 'rgba(226, 232, 240, 0.9)'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'sm': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '28px',
        '3xl': '32px',
        'card': '24px',
        'btn': '16px',
      },
      boxShadow: {
        'soft': '0 8px 30px -10px rgba(15, 23, 42, 0.08)',
        'elevated': '0 12px 36px -12px rgba(15, 23, 42, 0.12)',
        'cyanGlow': '0 8px 24px -4px rgba(2, 132, 199, 0.35)',
        'cyanGlowSm': '0 4px 16px -3px rgba(2, 132, 199, 0.25)',
        'glass': '0 8px 30px -10px rgba(15, 23, 42, 0.08)',
        'nav': '0 10px 40px -10px rgba(15, 23, 42, 0.1), 0 0 20px -5px rgba(2, 132, 199, 0.08)',
      }
    },
  },
  plugins: [],
}
