/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#f5f7f7',
        surface: '#ffffff',
        ink: '#16232b',
        subtle: '#5d6b74',
        faint: '#8b979e',
        line: '#e3e9e9',
        brand: {
          50: '#eef8f6',
          100: '#d4eee9',
          200: '#a9dcd4',
          600: '#0f766e',
          700: '#0b5d57',
          800: '#094a45',
        },
        danger: {
          50: '#fef3f2',
          100: '#fee4e2',
          600: '#c4322a',
          700: '#a52721',
        },
        warning: {
          50: '#fffaeb',
          100: '#fef0c7',
          600: '#b54708',
        },
        success: {
          50: '#ecfdf3',
          600: '#067647',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(16, 35, 43, 0.04)',
        pop: '0 12px 32px rgba(16, 35, 43, 0.14)',
      },
      borderRadius: {
        panel: '10px',
      },
    },
  },
  plugins: [],
};
