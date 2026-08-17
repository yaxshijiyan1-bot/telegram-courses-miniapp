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
        darkBgSecondary: '#0A0D13',
        darkCard: '#0D1117',
        darkCardElevated: '#11161D',
        cyan: {
          DEFAULT: '#22D3EE',
          light: '#67E8F9',
          deep: '#0891B2',
          glow: 'rgba(34, 211, 238, 0.15)',
        },
        violet: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
        },
        gold: '#F5C66B',
        ink: {
          DEFAULT: '#F4F7FB',
          secondary: '#A7B4C7',
          muted: '#66738A',
        },
        text: {
          primary: '#F4F7FB',
          secondary: '#A7B4C7',
          muted: '#66738A',
        },
        brand: {
          emerald: '#22D3EE',
          deep: '#0891B2',
          text: '#F4F7FB',
          secondary: '#A7B4C7',
          muted: '#66738A',
          gold: '#F5C66B',
          border: 'rgba(255, 255, 255, 0.08)'
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
        'soft': '0 18px 44px -18px rgba(0, 0, 0, 0.65)',
        'elevated': '0 24px 60px -20px rgba(0, 0, 0, 0.8)',
        'cyanGlow': '0 8px 36px -6px rgba(34, 211, 238, 0.35)',
        'cyanGlowSm': '0 4px 20px -4px rgba(34, 211, 238, 0.28)',
        'glass': '0 18px 44px -18px rgba(0, 0, 0, 0.65)',
        'nav': '0 20px 50px -12px rgba(0, 0, 0, 0.85), 0 0 40px -18px rgba(34, 211, 238, 0.18)',
      }
    },
  },
  plugins: [],
}
