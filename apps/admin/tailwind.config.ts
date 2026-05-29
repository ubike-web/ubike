import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          DEFAULT: '#0E86CA',
          50: '#E3F4FD',
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
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#388E3C',
          700: '#2E7D32',
        },
        // Keep for legacy references
        charcoal: { DEFAULT: '#0A2D6E', 500: '#0A2D6E', 400: '#0E86CA', 300: '#1A7BB5', 600: '#071E4A', dark: '#040F26' },
        gold: { DEFAULT: '#0E86CA', 500: '#0E86CA', 400: '#1A9EDF' },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
