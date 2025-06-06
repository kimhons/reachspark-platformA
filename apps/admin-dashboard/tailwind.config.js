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
        success: {
          light: '#34D399', // Emerald-400
          DEFAULT: '#10B981', // Emerald-500
          dark: '#059669', // Emerald-600
        },
        warning: {
          light: '#FBBF24', // Amber-400
          DEFAULT: '#F59E0B', // Amber-500
          dark: '#D97706', // Amber-600
        },
        danger: {
          light: '#F87171', // Red-400
          DEFAULT: '#EF4444', // Red-500
          dark: '#DC2626', // Red-600
        },
        info: {
          light: '#60A5FA', // Blue-400
          DEFAULT: '#3B82F6', // Blue-500
          dark: '#2563EB', // Blue-600
        },
        dark: {
          lightest: '#4B5563', // Gray-600
          lighter: '#374151', // Gray-700
          light: '#1F2937', // Gray-800
          DEFAULT: '#111827', // Gray-900
          dark: '#0F172A', // Slate-900
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'dashboard': '0 0 20px rgba(0, 0, 0, 0.05)',
        'sidebar': '4px 0 10px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-diagonal': 'linear-gradient(to right bottom, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionDuration: {
        '2000': '2000ms',
      },
    },
  },
  plugins: [],
}
