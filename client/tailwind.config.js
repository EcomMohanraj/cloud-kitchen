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
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#064e3b',
          900: '#06392c',
          950: '#022018',
        },
        forest: {
          DEFAULT: '#064e3b',
          50: '#f2fbf7',
          100: '#e1f6ed',
          800: '#064e3b',
          900: '#043729',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        mint: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
        },
        warmbg: {
          50: '#fcfdfa',
          100: '#f4f7f2',
          200: '#e7ede3',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(5, 150, 105, 0.35)',
        'glow-mint': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
        'card-soft': '0 10px 30px -10px rgba(6, 78, 59, 0.07)',
        'card-hover': '0 20px 40px -15px rgba(5, 150, 105, 0.18)',
        'glass': '0 8px 32px 0 rgba(6, 78, 59, 0.08)',
        'drawer': '-10px 0 40px rgba(0, 0, 0, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
