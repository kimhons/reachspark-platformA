module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          light: '#6366F1', // Indigo-500
          DEFAULT: '#4F46E5', // Indigo-600
          dark: '#4338CA', // Indigo-700
        },
        secondary: {
          light: '#10B981', // Emerald-500
          DEFAULT: '#059669', // Emerald-600
          dark: '#047857', // Emerald-700
        },
        'e-commerce': {
          light: '#F59E0B', // Amber-500
          DEFAULT: '#D97706', // Amber-600
          dark: '#B45309', // Amber-700
        },
        'analytics': {
          light: '#8B5CF6', // Violet-500
          DEFAULT: '#7C3AED', // Violet-600
          dark: '#6D28D9', // Violet-700
        },
        'social-media': {
          light: '#EC4899', // Pink-500
          DEFAULT: '#DB2777', // Pink-600
          dark: '#BE185D', // Pink-700
        },
        'website-builder': {
          light: '#3B82F6', // Blue-500
          DEFAULT: '#2563EB', // Blue-600
          dark: '#1D4ED8', // Blue-700
        },
        'ad-creation': {
          light: '#EF4444', // Red-500
          DEFAULT: '#DC2626', // Red-600
          dark: '#B91C1C', // Red-700
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
    },
  },
  plugins: [],
}
