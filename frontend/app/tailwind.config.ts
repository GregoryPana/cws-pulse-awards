import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Plus Jakarta Sans', 'Arial', 'sans-serif'],
        label: ['Outfit', 'Arial', 'sans-serif'],
      },
      colors: {
        navy: '#0A2240',
        deep: '#060F1E',
        blue: '#0070C0',
        sky: '#00A3D9',
        gold: '#F5A623',
        'gold-soft': '#FFD166',
        amber: '#E8870A',
        'mid-gray': '#6B8099',
        'dark-gray': '#2D3748',
        mist: 'rgba(255,255,255,0.06)',
        'mist-md': 'rgba(255,255,255,0.10)',
      },
      borderRadius: {
        card: '18px',
        modal: '16px',
        badge: '20px',
        tag: '6px',
        btn: '10px',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        cardIn: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.7)' },
        },
        drift: {
          from: { transform: 'translate(0,0) scale(1)' },
          to: { transform: 'translate(30px,40px) scale(1.08)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s forwards',
        cardIn: 'cardIn 0.7s forwards',
        modalIn: 'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        pulseDot: 'pulseDot 2s ease-in-out infinite',
        drift: 'drift 18s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
} satisfies Config
