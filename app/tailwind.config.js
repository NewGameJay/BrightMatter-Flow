/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'veri-green': '#10B981',
        'veri-dark': '#0F1419',
        'veri-gray': '#1a1f26',
      }
    },
  },
  plugins: [],
}

