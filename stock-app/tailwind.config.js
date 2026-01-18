/** @type {import('tailwindcss').Config} */
export default {
   darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0f',
          900: '#111118',
          800: '#1a1a24',
          700: '#2a2a38',
        }
      }
    },
  },
  plugins: [],
}
