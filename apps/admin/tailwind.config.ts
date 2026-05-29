import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#2E2B26',
          50: '#6B6660',
          100: '#5A5550',
          200: '#4A4540',
          300: '#3D3A35',
          400: '#332F2A',
          500: '#2E2B26',
          600: '#242220',
          700: '#1A1918',
          800: '#111010',
          900: '#080808',
        },
        gold: {
          DEFAULT: '#BF9340',
          50: '#F5E9CE',
          100: '#EDD89A',
          200: '#E5C866',
          300: '#D9B54D',
          400: '#CFA448',
          500: '#BF9340',
          600: '#A07A32',
          700: '#806226',
          800: '#60491B',
          900: '#403112',
        },
        sienna: {
          DEFAULT: '#8B2E1E',
          50: '#E8A898',
          100: '#DE8A77',
          200: '#D16B56',
          300: '#C04D36',
          400: '#A83A24',
          500: '#8B2E1E',
          600: '#6E2318',
          700: '#521913',
          800: '#36100D',
          900: '#1A0807',
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
