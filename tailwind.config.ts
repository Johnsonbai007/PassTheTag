import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07111f',
          900: '#0b1627',
          800: '#11213a',
          700: '#1a3152',
          500: '#4d7cff',
          400: '#74a1ff',
        },
        sand: {
          950: '#1e1408',
          900: '#2d1d0f',
          700: '#8b5e2f',
          400: '#f0b35f',
        },
        ice: {
          950: '#08131a',
          900: '#102634',
          700: '#2d6c8d',
          400: '#7dd3fc',
        },
        grass: {
          950: '#071307',
          900: '#102110',
          700: '#2d6c3e',
          400: '#86efac',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 0 24px rgba(116,161,255,0.18)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
} satisfies Config;
