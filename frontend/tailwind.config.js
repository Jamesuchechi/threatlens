/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090d16',
        darkCard: '#101726',
        darkCardMuted: '#162035',
        darkBorder: '#1e293b',
        cyberCyan: '#00f2fe',
        cyberBlue: '#4facfe',
        cyberPurple: '#7c3aed',
        cyberRose: '#f43f5e',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)' },
          '50%': { opacity: 1, boxShadow: '0 0 25px rgba(0, 242, 254, 0.8)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
