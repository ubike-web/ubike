import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Ocean Blue (primary brand) ─────────────────────────────────
        ocean: {
          DEFAULT: '#0E86CA',
          50:  '#E3F4FD',
          100: '#B8E2F8',
          200: '#7DCBF1',
          300: '#42C8F5',
          400: '#1A9EDF',
          500: '#0E86CA',
          600: '#0A6DAA',
          700: '#0A2D6E',
          800: '#071E4A',
          900: '#040F26',
        },
        leaf: {
          DEFAULT: '#4CAF50',
          500: '#4CAF50',
          600: '#388E3C',
          700: '#2E7D32',
        },

        // ── Legacy class names used across dashboard pages ─────────────
        // These map to the ocean blue palette so old class names still work
        charcoal: {
          DEFAULT: '#0A1220',
          300: '#1A3A5C',
          400: '#0D2550',
          500: '#0A1A3E',
          600: '#07122A',
          700: '#040D1E',
          800: '#030810',
          900: '#020510',
          dark: '#040F26',
        },
        gold: {
          DEFAULT: '#42C8F5',
          300: '#7DCBF1',
          400: '#42C8F5',
          500: '#0E86CA',
          600: '#0A6DAA',
        },
        sienna: {
          300: '#F87171',
          400: '#EF4444',
          500: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
