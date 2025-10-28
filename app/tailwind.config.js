/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'flow-blue': '#00D4FF',
        'flow-purple': '#8B5CF6',
        'veri-green': '#10B981',
        'veri-orange': '#F59E0B',
        // Add missing color aliases for compatibility
        border: '#e5e7eb',
        background: 'white',
        foreground: '#111827',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

