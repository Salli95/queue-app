/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': '#4f46e5', // Indigo-600
        'brand-hover': '#4338ca', // Indigo-700
      }
    },
  },
  plugins: [],
}

