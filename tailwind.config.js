/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bullion: {
          dark: '#0B0E14',
          card: '#131822',
          border: '#232D3F',
          gold: '#D4AF37',
          goldLight: '#F3E5AB',
          goldDark: '#997B28',
          accent: '#E6C657',
          amberGlow: 'rgba(212, 175, 55, 0.15)',
          muted: '#8A99AD',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'gold-sm': '0 2px 10px rgba(212, 175, 55, 0.1)',
        'gold-md': '0 4px 20px rgba(212, 175, 55, 0.18)',
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.25)',
      }
    },
  },
  plugins: [],
}
