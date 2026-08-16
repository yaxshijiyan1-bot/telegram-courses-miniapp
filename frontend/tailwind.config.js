/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#159A6B',
          deep: '#0D6B4E',
          forest: '#103F32',
          dark: '#082C24',
          mint: '#E6F5EF',
          soft: '#D7EEE5',
          surface: '#F4FAF7',
          cream: '#FBF8F1',
          warmWhite: '#FFFDFC',
          gold: '#C9A96B',
          goldSoft: '#D9C18D',
          text: '#17352D',
          secondary: '#6B8179',
          muted: '#96A69F',
          border: '#E3ECE8'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'hero': '26px',
        'btn': '14px',
        'input': '12px'
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(13, 107, 78, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 12px 32px -4px rgba(13, 107, 78, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'gold': '0 4px 20px -2px rgba(201, 169, 107, 0.25)',
      }
    },
  },
  plugins: [],
}
