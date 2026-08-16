/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#09090C',
        darkCard: '#131318',
        darkCardElevated: '#1B1B22',
        darkBorder: 'rgba(255, 255, 255, 0.08)',
        darkBorderLight: 'rgba(255, 255, 255, 0.14)',
        limeNeon: '#B4F523',
        limeSoft: 'rgba(180, 245, 35, 0.15)',
        brand: {
          emerald: '#B4F523',
          deep: '#84CC16',
          forest: '#131318',
          dark: '#FFFFFF',
          mint: 'rgba(180, 245, 35, 0.12)',
          soft: '#1B1B22',
          surface: '#131318',
          cream: '#09090C',
          warmWhite: '#181820',
          gold: '#B4F523',
          goldSoft: 'rgba(180, 245, 35, 0.2)',
          text: '#FFFFFF',
          secondary: '#A1A1AA',
          muted: '#71717A',
          border: 'rgba(255, 255, 255, 0.08)'
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        'card': '22px',
        'btn': '16px',
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.5)',
        'elevated': '0 16px 40px rgba(0, 0, 0, 0.7)',
        'neon': '0 0 25px rgba(180, 245, 35, 0.35)',
        'neonSm': '0 0 12px rgba(180, 245, 35, 0.25)',
      }
    },
  },
  plugins: [],
}
