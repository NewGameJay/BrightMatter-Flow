/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Veri.club inspired colors
        'veri-dark': '#0A0A0A',
        'veri-darker': '#050505',
        'veri-gray': '#1A1A1A',
        'veri-light-gray': '#2A2A2A',
        'veri-border': '#333333',
        'flow-blue': '#10B981', // Changed to Veri green
        'flow-purple': '#8B5CF6',
        'veri-green': '#10B981',
        'veri-orange': '#F59E0B',
        // Default aliases for dark mode
        border: '#333333',
        background: '#0A0A0A',
        foreground: '#FFFFFF',
      },
      fontFamily: {
        'sans': ['Inter', 'Geist', 'system-ui', 'sans-serif'],
        'display': ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'veri-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
        'flow-gradient': 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)',
      },
    },
  },
  plugins: [],
}
