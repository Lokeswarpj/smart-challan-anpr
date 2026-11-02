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
        primary: {
          DEFAULT: '#171E19',
          dark: '#0F1411',
          light: '#232C25'
        },
        secondary: '#272727',
        accent: {
          DEFAULT: '#FFE17C',
          hover: '#FFD952',
          light: '#FFF5D1'
        },
        sage: {
          DEFAULT: '#B7C6C2',
          light: '#DCE4E1',
          dark: '#93A4A0'
        },
        surface: {
          DEFAULT: '#F8F9FA',
          subtle: '#F1F3F4',
          dark: '#1C231E'
        },
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B'
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'],
        sans: ['Satoshi', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      lineHeight: {
        'tight-display': '0.92'
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px rgba(23, 30, 25, 1)',
        'brutal-yellow': '4px 4px 0px 0px rgba(255, 225, 124, 1)',
        'brutal-sm': '2px 2px 0px 0px rgba(23, 30, 25, 1)',
        'brutal-hover': '6px 6px 0px 0px rgba(23, 30, 25, 1)'
      }
    },
  },
  plugins: [],
}

