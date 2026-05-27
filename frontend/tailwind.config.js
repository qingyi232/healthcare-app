/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#effefb',
          100: '#c7fff3',
          200: '#90ffe7',
          300: '#51f7d9',
          400: '#1de4c5',
          500: '#05c8ac',
          600: '#00a28e',
          700: '#058173',
          800: '#0a665d',
          900: '#0d544d',
        },
        fresh: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        }
      }
    },
  },
  plugins: [],
}
