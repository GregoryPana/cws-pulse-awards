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
        'navy-deep': '#061528',
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
        card: '10px',
        modal: '10px',
        badge: '8px',
        tag: '6px',
        btn: '6px',
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
        glowGold: {
          '0%, 100%': {
            boxShadow:
              '0 18px 50px rgba(0,0,0,0.45), 0 0 22px rgba(245,166,35,0.16), 0 0 0 1px rgba(245,166,35,0.25)',
          },
          '50%': {
            boxShadow:
              '0 18px 50px rgba(0,0,0,0.45), 0 0 52px rgba(245,166,35,0.38), 0 0 0 1px rgba(245,166,35,0.5)',
          },
        },
        sheen: {
          '0%': { transform: 'translateX(-160%) skewX(-18deg)' },
          '55%, 100%': { transform: 'translateX(420%) skewX(-18deg)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)', opacity: '0.65' },
          '50%': { transform: 'translateY(-8px) rotate(10deg)', opacity: '1' },
        },
        foilShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s forwards',
        cardIn: 'cardIn 0.7s forwards',
        modalIn: 'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        pulseDot: 'pulseDot 2s ease-in-out infinite',
        drift: 'drift 18s ease-in-out infinite alternate',
        glowGold: 'glowGold 3.4s ease-in-out infinite',
        sheen: 'sheen 6s ease-in-out infinite',
        floaty: 'floaty 4.2s ease-in-out infinite',
        foilShift: 'foilShift 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
