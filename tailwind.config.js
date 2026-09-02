/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#059669',
          700: '#047857',
          800: '#15803d',
          900: '#14532d',
          950: '#052e16',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#059669',
          600: '#047857',
          700: '#15803d',
          800: '#166534',
        },
        mint: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
        },
        slate: {
          900: '#0f172a',
          950: '#090d16',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(5, 150, 105, 0.35)',
        'glow-mint': '0 0 25px -5px rgba(220, 252, 231, 0.4)',
        'soft': '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
