/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#05070A',
        darkBgSecondary: '#0A0D12',
        darkCard: '#0D1117',
        darkCardElevated: '#11161D',
        darkBorder: 'rgba(255, 255, 255, 0.08)',
        darkBorderLight: 'rgba(255, 255, 255, 0.14)',
        darkGlass: 'rgba(255, 255, 255, 0.04)',
        cyan: {
          DEFAULT: '#22D3EE',
          light: '#67E8F9',
          deep: '#0891B2',
          glow: 'rgba(34, 211, 238, 0.15)',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        brand: {
          emerald: '#22D3EE',
          deep: '#0891B2',
          forest: '#0D1117',
          dark: '#F8FAFC',
          mint: 'rgba(34, 211, 238, 0.12)',
          soft: '#11161D',
          surface: '#0D1117',
          cream: '#05070A',
          warmWhite: '#11161D',
          gold: '#22D3EE',
          goldSoft: 'rgba(34, 211, 238, 0.2)',
          text: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
          border: 'rgba(255, 255, 255, 0.08)'
        }
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'sans-serif'],
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
        'soft': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'elevated': '0 16px 48px rgba(0, 0, 0, 0.8)',
        'cyanGlow': '0 0 25px rgba(34, 211, 238, 0.2)',
        'cyanGlowSm': '0 0 12px rgba(34, 211, 238, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
